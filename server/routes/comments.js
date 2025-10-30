const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

// 获取用户的消息通知
router.get('/notifications', auth, async (req, res) => {
  try {
    console.log('当前用户ID:', req.user.userId);

    // 检查用户是否存在
    const [user] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.user.userId]
    );
    console.log('用户信息:', user[0]);

    // 检查该用户的评论
    const [comments] = await pool.query(`
      SELECT * FROM comments WHERE user_id = ?
    `, [req.user.userId]);
    console.log('用户的评论:', comments);

    // 检查点赞记录
    const [likes] = await pool.query(`
      SELECT cl.*, c.user_id as comment_user_id 
      FROM comment_likes cl
      JOIN comments c ON cl.comment_id = c.id
      WHERE c.user_id = ?
    `, [req.user.userId]);
    console.log('点赞记录:', likes);

    // 检查回复记录
    const [replies] = await pool.query(`
      SELECT cr.*, c.user_id as comment_user_id
      FROM comment_replies cr
      JOIN comments c ON cr.comment_id = c.id
      WHERE c.user_id = ?
    `, [req.user.userId]);
    console.log('回复记录:', replies);

    // 修改通知查询
    const [notifications] = await pool.query(`
      SELECT 
        n.*,
        u.username as from_username,
        c.content as comment_content,
        cars.model as car_model,
        (
          SELECT COUNT(*) 
          FROM comment_likes 
          WHERE comment_id = c.id
        ) as total_likes
      FROM user_notifications n
      JOIN users u ON n.from_user_id = u.id
      JOIN comments c ON n.comment_id = c.id
      JOIN cars ON n.car_id = cars.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
    `, [req.user.userId]);

    console.log('通知记录:', notifications);

    res.json(notifications);
  } catch (error) {
    console.error('获取通知失败:', error);
    res.status(500).json({ 
      message: '获取通知失败', 
      error: error.message,
      stack: error.stack
    });
  }
});

// 标记通知为已读
router.put('/notifications/read', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE user_notifications SET is_read = TRUE WHERE user_id = ?',
      [req.user.userId]
    );
    res.json({ message: '标记成功' });
  } catch (error) {
    console.error('标记通知失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取评论列表
router.get('/:carId', async (req, res) => {
  try {
    // 首先获取评论
    const [comments] = await pool.query(`
      SELECT 
        c.*,
        u.username,
        COALESCE(COUNT(DISTINCT cl.id), 0) as likes_count,
        COALESCE(COUNT(DISTINCT cr.id), 0) as replies_count
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN comment_likes cl ON c.id = cl.comment_id
      LEFT JOIN comment_replies cr ON c.id = cr.comment_id
      WHERE c.car_id = ?
      GROUP BY c.id, c.user_id, c.car_id, c.content, c.created_at, u.username
      ORDER BY c.created_at DESC
    `, [req.params.carId]);

    // 获取每条评论的回复
    for (let comment of comments) {
      const [replies] = await pool.query(`
        SELECT 
          cr.*,
          u.username
        FROM comment_replies cr
        JOIN users u ON cr.user_id = u.id
        WHERE cr.comment_id = ?
        ORDER BY cr.created_at ASC
      `, [comment.id]);
      comment.replies = replies;
    }
    
    res.json(comments);
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({ message: '获取评论失败', error: error.message });
  }
});

// 点赞评论
router.post('/:commentId/like', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // 获取评论信息（包括评论作者ID）
    const [comment] = await connection.query(
      'SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?',
      [req.params.commentId]
    );

    if (!comment.length) {
      throw new Error('评论不存在');
    }

    // 检查是否已经点赞
    const [exists] = await connection.query(
      'SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?',
      [req.user.userId, req.params.commentId]
    );

    if (exists.length > 0) {
      // 取消点赞
      await connection.query(
        'DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?',
        [req.user.userId, req.params.commentId]
      );
      
      // 删除通知
      await connection.query(
        'DELETE FROM user_notifications WHERE from_user_id = ? AND comment_id = ? AND type = "like"',
        [req.user.userId, req.params.commentId]
      );
      
      await connection.commit();
      res.json({ liked: false });
    } else {
      // 添加点赞
      await connection.query(
        'INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)',
        [req.user.userId, req.params.commentId]
      );
      
      // 如果不是自己的评论，创建通知
      if (comment[0].user_id !== req.user.userId) {
        await connection.query(`
          INSERT INTO user_notifications 
          (user_id, from_user_id, type, comment_id, car_id) 
          VALUES (?, ?, 'like', ?, ?)`,
          [comment[0].user_id, req.user.userId, req.params.commentId, comment[0].car_id]
        );
      }
      
      await connection.commit();
      res.json({ liked: true });
    }
  } catch (error) {
    await connection.rollback();
    console.error('点赞操作失败:', error);
    res.status(500).json({ message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 回复评论
router.post('/:commentId/reply', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { content } = req.body;
    
    // 获取评论信息（包括评论作者ID）
    const [comment] = await connection.query(
      'SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?',
      [req.params.commentId]
    );

    if (!comment.length) {
      throw new Error('评论不存在');
    }
    
    // 添加回复
    const [result] = await connection.query(
      'INSERT INTO comment_replies (comment_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.commentId, req.user.userId, content]
    );
    
    // 如果不是自己的评论，创建通知
    if (comment[0].user_id !== req.user.userId) {
      await connection.query(`
        INSERT INTO user_notifications 
        (user_id, from_user_id, type, content, comment_id, car_id) 
        VALUES (?, ?, 'reply', ?, ?, ?)`,
        [comment[0].user_id, req.user.userId, content, req.params.commentId, comment[0].car_id]
      );
    }
    
    await connection.commit();
    res.status(201).json({ 
      message: '回复成功',
      replyId: result.insertId 
    });
  } catch (error) {
    await connection.rollback();
    console.error('回复评论失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  } finally {
    connection.release();
  }
});

// 发表评论
router.post('/', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { carId, content } = req.body;
    
    // 添加评论
    const [result] = await connection.query(
      'INSERT INTO comments (user_id, car_id, content) VALUES (?, ?, ?)',
      [req.user.userId, carId, content]
    );
    
    // 获取新添加的评论信息
    const [comment] = await connection.query(`
      SELECT 
        c.*,
        u.username,
        0 as likes_count,
        0 as replies_count
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);
    
    await connection.commit();
    res.status(201).json({
      message: '评论发表成功',
      comment: comment[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('发表评论失败:', error);
    res.status(500).json({ 
      message: '发表评论失败', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

module.exports = router; 
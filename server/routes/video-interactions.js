const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const dbConfig = require('../config/db.config');
const { JWT_SECRET } = require('../config');
const pool = mysql.createPool(dbConfig);

// 验证Token的中间件
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: '未提供认证token' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '无效的token格式' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    console.error('认证失败:', error);
    res.status(401).json({ message: '认证失败', error: error.message });
  }
};

// 获取用户的视频评论
router.get('/comments/my', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [comments] = await connection.query(`
      SELECT 
        vc.id,
        vc.content,
        vc.created_at,
        v.id as video_id,
        v.title as video_title
      FROM video_comments vc
      JOIN videos v ON vc.video_id = v.id
      WHERE vc.user_id = ?
      ORDER BY vc.created_at DESC
    `, [req.user.userId]);

    res.json(comments);
  } catch (error) {
    console.error('获取视频评论失败:', error);
    res.status(500).json({ message: '获取视频评论失败' });
  } finally {
    connection.release();
  }
});

// 获取用户收到的回复
router.get('/replies/my', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [replies] = await connection.query(`
      SELECT 
        vcr.id,
        vcr.content,
        vcr.created_at,
        vcr.is_read,
        u.username as from_username,
        vc.content as original_content,
        v.id as video_id,
        v.title as video_title
      FROM video_comment_replies vcr
      JOIN video_comments vc ON vcr.comment_id = vc.id
      JOIN users u ON vcr.user_id = u.id
      JOIN videos v ON vc.video_id = v.id
      WHERE vc.user_id = ?
      ORDER BY vcr.created_at DESC
    `, [req.user.userId]);

    // 确保 is_read 字段是布尔值
    const formattedReplies = replies.map(reply => ({
      ...reply,
      is_read: Boolean(reply.is_read)
    }));

    res.json(formattedReplies);
  } catch (error) {
    console.error('获取评论回复失败:', error);
    res.status(500).json({ message: '获取评论回复失败' });
  } finally {
    connection.release();
  }
});

// 获取用户获得的点赞
router.get('/likes/my', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [likes] = await connection.query(`
      SELECT 
        vcl.id,
        vcl.created_at,
        u.username as from_username,
        vc.content as comment_content,
        v.id as video_id,
        v.title as video_title
      FROM video_comment_likes vcl
      JOIN video_comments vc ON vcl.comment_id = vc.id
      JOIN users u ON vcl.user_id = u.id
      JOIN videos v ON vc.video_id = v.id
      WHERE vc.user_id = ?
      ORDER BY vcl.created_at DESC
    `, [req.user.userId]);

    res.json(likes);
  } catch (error) {
    console.error('获取评论点赞失败:', error);
    res.status(500).json({ message: '获取评论点赞失败' });
  } finally {
    connection.release();
  }
});

// 标记视频回复为已读
router.put('/reply/:id/read', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // 首先检查 is_read 字段是否存在
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'video_comment_replies' 
      AND COLUMN_NAME = 'is_read'
    `);

    // 如果字段不存在，添加它
    if (columns.length === 0) {
      await connection.query(`
        ALTER TABLE video_comment_replies 
        ADD COLUMN is_read BOOLEAN DEFAULT FALSE
      `);
    }

    // 验证该回复是否属于当前用户的评论
    const [reply] = await connection.query(`
      SELECT vcr.* 
      FROM video_comment_replies vcr
      JOIN video_comments vc ON vcr.comment_id = vc.id
      WHERE vcr.id = ? AND vc.user_id = ?
    `, [req.params.id, req.user.userId]);

    if (reply.length === 0) {
      return res.status(404).json({ message: '回复不存在或无权限' });
    }

    // 标记为已读
    await connection.query(
      'UPDATE video_comment_replies SET is_read = TRUE WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: '标记成功' });
  } catch (error) {
    console.error('标记已读失败:', error);
    res.status(500).json({ message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 标记所有视频回复为已读
router.put('/replies/read-all', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // 首先检查 is_read 字段是否存在
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'video_comment_replies' 
      AND COLUMN_NAME = 'is_read'
    `);

    // 如果字段不存在，添加它
    if (columns.length === 0) {
      await connection.query(`
        ALTER TABLE video_comment_replies 
        ADD COLUMN is_read BOOLEAN DEFAULT FALSE
      `);
    }

    // 标记所有属于当前用户评论的回复为已读
    await connection.query(`
      UPDATE video_comment_replies vcr
      JOIN video_comments vc ON vcr.comment_id = vc.id
      SET vcr.is_read = TRUE
      WHERE vc.user_id = ?
    `, [req.user.userId]);

    res.json({ message: '全部标记成功' });
  } catch (error) {
    console.error('标记全部已读失败:', error);
    res.status(500).json({ message: '服务器错误' });
  } finally {
    connection.release();
  }
});

module.exports = router; 
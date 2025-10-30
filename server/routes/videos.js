const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

// 验证管理员权限的中间件
const checkAdmin = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!users.length || users[0].role !== 'admin') {
      return res.status(403).json({ message: '需要管理员权限' });
    }

    next();
  } catch (error) {
    console.error('验证管理员权限失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 配置视频上传
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, '../../public/videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    console.log('视频上传目录:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'video-' + uniqueSuffix + ext;
    console.log('生成的文件名:', filename);
    cb(null, filename);
  }
});

// 配置缩略图上传
const thumbnailStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/images/video-covers');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'thumb-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { 
    fileSize: 500 * 1024 * 1024,
    fieldSize: 500 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    console.log('上传的文件:', file);
    if (file.fieldname !== 'video') {
      return cb(new Error('错误的字段名，应为 video'));
    }
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('只允许上传 MP4/WebM/Ogg 格式的视频文件'));
    }
    cb(null, true);
  }
}).single('video');

const thumbnailUpload = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname !== 'thumbnail') {
      return cb(new Error('错误的字段名，应为 thumbnail'));
    }
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('只允许上传图片文件'));
    }
    cb(null, true);
  }
}).single('thumbnail');

// 获取公开的视频列表
router.get('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [videos] = await connection.query(`
      SELECT * FROM videos 
      WHERE status = 'published'
      ORDER BY created_at DESC
    `);
    res.json(videos);
  } catch (error) {
    console.error('获取视频列表失败:', error);
    res.status(500).json({ message: '获取视频列表失败' });
  } finally {
    connection.release();
  }
});

// 管理员的视频列表接口
router.get('/admin', auth, checkAdmin, async (req, res) => {
  try {
    const [videos] = await pool.query(`
      SELECT * FROM videos 
      ORDER BY created_at DESC
    `);
    res.json(videos);
  } catch (error) {
    console.error('获取视频列表失败:', error);
    res.status(500).json({ message: '获取视频列表失败' });
  }
});

// 删除视频
router.delete('/:id', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 获取视频信息
    const [videos] = await connection.query(
      'SELECT * FROM videos WHERE id = ?',
      [req.params.id]
    );

    if (!videos.length) {
      await connection.rollback();
      return res.status(404).json({ message: '视频不存在' });
    }

    const video = videos[0];

    // 删除视频文件
    if (video.url) {
      const videoPath = path.join(__dirname, '../../public', video.url);
      if (fs.existsSync(videoPath)) {
        try {
          fs.unlinkSync(videoPath);
          console.log('视频文件删除成功:', videoPath);
        } catch (error) {
          console.error('删除视频文件失败:', error);
        }
      }
    }

    // 删除缩略图文件
    if (video.thumbnail) {
      const thumbnailPath = path.join(__dirname, '../../public', video.thumbnail);
      if (fs.existsSync(thumbnailPath)) {
        try {
          fs.unlinkSync(thumbnailPath);
          console.log('缩略图文件删除成功:', thumbnailPath);
        } catch (error) {
          console.error('删除缩略图文件失败:', error);
        }
      }
    }

    // 删除数据库记录
    await connection.query('DELETE FROM videos WHERE id = ?', [req.params.id]);

    await connection.commit();
    res.json({ 
      message: '删除成功',
      deletedFiles: {
        video: video.url,
        thumbnail: video.thumbnail
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('删除视频失败:', error);
    res.status(500).json({ 
      message: '删除视频失败',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// 更新视频状态
router.put('/:id/status', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { status } = req.body;
    await connection.query(
      'UPDATE videos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, req.params.id]
    );
    res.json({ message: '状态更新成功' });
  } catch (error) {
    console.error('更新视频状态失败:', error);
    res.status(500).json({ message: '更新状态失败' });
  } finally {
    connection.release();
  }
});

// 更新视频信息
router.put('/:id', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { title, description, category, is_featured, is_hot } = req.body;
    await connection.query(`
      UPDATE videos SET
        title = ?,
        description = ?,
        category = ?,
        is_featured = ?,
        is_hot = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, description, category, is_featured, is_hot, req.params.id]);

    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('更新视频失败:', error);
    res.status(500).json({ message: '更新失败' });
  } finally {
    connection.release();
  }
});

// 上传视频文件
router.post('/upload', auth, checkAdmin, (req, res) => {
  videoUpload(req, res, function(err) {
    if (err) {
      console.error('视频上传错误:', err);
      return res.status(400).json({ 
        message: err.message || '视频上传失败'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        message: '请选择要上传的视频文件'
      });
    }

    const filePath = '/videos/' + req.file.filename;
    res.json({ 
      url: filePath,
      message: '视频上传成功'
    });
  });
});

// 上传缩略图
router.post('/upload-thumbnail', auth, checkAdmin, (req, res) => {
  thumbnailUpload(req, res, function(err) {
    if (err) {
      console.error('缩略图上传错误:', err);
      return res.status(400).json({ 
        message: err.message || '缩略图上传失败'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        message: '请选择要上传的缩略图'
      });
    }

    // 返回文件路径
    const filePath = '/images/video-covers/' + req.file.filename;
    res.json({ 
      url: filePath,
      message: '缩略图上传成功'
    });
  });
});

// 添加新视频
router.post('/', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { 
      title, description, url, thumbnail, 
      duration, category, is_featured, is_hot 
    } = req.body;

    // 验证必要字段
    if (!title || !description || !url || !thumbnail || !duration || !category) {
      return res.status(400).json({ message: '请填写所有必要字段' });
    }

    const [result] = await connection.query(`
      INSERT INTO videos (
        title, description, url, thumbnail,
        duration, category, status, is_featured, is_hot,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'published', ?, ?, NOW(), NOW())
    `, [
      title, description, url, thumbnail,
      duration, category, 
      is_featured ? 1 : 0, 
      is_hot ? 1 : 0
    ]);

    res.status(201).json({
      id: result.insertId,
      message: '视频添加成功'
    });
  } catch (error) {
    console.error('添加视频失败:', error);
    res.status(500).json({ 
      message: '添加视频失败',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// 更新视频播放量
router.post('/:id/views', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // 更新视频播放量
    await connection.query(`
      UPDATE videos 
      SET views = views + 1 
      WHERE id = ?
    `, [req.params.id]);

    // 获取更新后的播放量
    const [result] = await connection.query(
      'SELECT views FROM videos WHERE id = ?',
      [req.params.id]
    );

    res.json({ 
      success: true, 
      views: result[0].views 
    });
  } catch (error) {
    console.error('更新播放量失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新播放量失败' 
    });
  } finally {
    connection.release();
  }
});

// 渲染表情函数
function renderEmoji(content) {
  if (!content) return '';
  return content.replace(/\[emoji:([^\]]+)\]/g, (match, name) => {
    return `[emoji:${name}]`; // 保持原样返回，由前端负责渲染
  });
}

// 获取视频评论列表
router.get('/:videoId/comments', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // ���取主评论
    const [comments] = await connection.query(`
      SELECT 
        c.*,
        u.username,
        u.avatar,
        (SELECT COUNT(*) FROM video_comment_likes WHERE comment_id = c.id) as likes_count,
        (SELECT COUNT(*) FROM video_comment_replies WHERE comment_id = c.id) as replies_count
      FROM video_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.video_id = ?
      ORDER BY c.created_at DESC
    `, [req.params.videoId]);

    // 获取每条评论的回复
    for (let comment of comments) {
      const [replies] = await connection.query(`
        SELECT 
          r.*,
          u.username,
          u.avatar
        FROM video_comment_replies r
        JOIN users u ON r.user_id = u.id
        WHERE r.comment_id = ?
        ORDER BY r.created_at ASC
      `, [comment.id]);
      
      comment.replies = replies;
    }

    // 如果用户已登录，检查点赞状态
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        for (let comment of comments) {
          const [likes] = await connection.query(
            'SELECT * FROM video_comment_likes WHERE comment_id = ? AND user_id = ?',
            [comment.id, userId]
          );
          comment.is_liked = likes.length > 0;
        }
      } catch (error) {
        console.error('验证token失败:', error);
      }
    }

    res.json(comments);
  } catch (error) {
    console.error('获取评论列表失败:', error);
    res.status(500).json({ message: '获取评论列表失败' });
  } finally {
    connection.release();
  }
});

// 发表评论
router.post('/:videoId/comments', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { content } = req.body;
    const result = await connection.query(
      'INSERT INTO video_comments (video_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.videoId, req.user.userId, content]
    );

    // 获取新创建的评论信息
    const [newComment] = await connection.query(`
      SELECT 
        c.*,
        u.username,
        u.avatar
      FROM video_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result[0].insertId]);

    res.json(newComment[0]);
  } catch (error) {
    console.error('发表评论失败:', error);
    res.status(500).json({ message: '发表评论失败' });
  } finally {
    connection.release();
  }
});

// 发表回复
router.post('/comments/:commentId/reply', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { content } = req.body;
    const result = await connection.query(
      'INSERT INTO video_comment_replies (comment_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.commentId, req.user.userId, content]
    );

    // 获取新创建的回复信息
    const [newReply] = await connection.query(`
      SELECT 
        r.*,
        u.username,
        u.avatar
      FROM video_comment_replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [result[0].insertId]);

    res.json(newReply[0]);
  } catch (error) {
    console.error('发表回复失败:', error);
    res.status(500).json({ message: '发表回复失败' });
  } finally {
    connection.release();
  }
});

// 处理视频评论点赞
router.post('/comments/:id/like', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const commentId = req.params.id;
    const userId = req.user.userId;

    // 检查评论是否存在
    const [comments] = await connection.query(
      'SELECT id FROM video_comments WHERE id = ?',
      [commentId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ 
        error: '评论不存在或已被删除',
        message: '该评论不存在或已被删除'
      });
    }

    // 检查是否已经点赞
    const [existingLikes] = await connection.query(
      'SELECT * FROM video_comment_likes WHERE comment_id = ? AND user_id = ?',
      [commentId, userId]
    );

    let liked;
    let message;
    if (existingLikes.length > 0) {
      // 如果已经点赞，则取消点赞
      await connection.query(
        'DELETE FROM video_comment_likes WHERE comment_id = ? AND user_id = ?',
        [commentId, userId]
      );
      liked = false;
      message = '已取消点赞';
    } else {
      // 如果未点赞，则添加点赞
      await connection.query(
        'INSERT INTO video_comment_likes (comment_id, user_id) VALUES (?, ?)',
        [commentId, userId]
      );
      liked = true;
      message = '点赞成功';
    }

    // 更新评论的点赞数
    const [likesCount] = await connection.query(
      'SELECT COUNT(*) as count FROM video_comment_likes WHERE comment_id = ?',
      [commentId]
    );

    res.json({ 
      liked,
      likes_count: likesCount[0].count,
      message
    });

  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({ 
      error: '点赞操作失败',
      message: '操作失败，请稍后重试'
    });
  } finally {
    connection.release();
  }
});

// 删除视频评论
router.delete('/:videoId/comments/:commentId', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { videoId, commentId } = req.params;
    const userId = req.user.userId;

    // 检查评论是否存在
    const [comment] = await connection.query(
      'SELECT user_id FROM video_comments WHERE id = ? AND video_id = ?',
      [commentId, videoId]
    );

    if (!comment.length) {
      return res.status(404).json({ message: '评论不存在' });
    }

    // 检查权限
    const [user] = await connection.query(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );

    if (comment[0].user_id !== userId && user[0].role !== 'admin') {
      return res.status(403).json({ message: '没有权限删除此评论' });
    }

    await connection.beginTransaction();

    // 删除评论点赞
    await connection.query(
      'DELETE FROM video_comment_likes WHERE comment_id = ?',
      [commentId]
    );

    // 删除评论
    await connection.query(
      'DELETE FROM video_comments WHERE id = ?',
      [commentId]
    );

    await connection.commit();
    res.json({ message: '删除���功' });
  } catch (error) {
    await connection.rollback();
    console.error('删除视频评论失败:', error);
    res.status(500).json({ message: '删除评论失败' });
  } finally {
    connection.release();
  }
});

// 在路由文件顶部添加错误处理
router.use((err, req, res, next) => {
  console.error('视频路由错误:', err);
  res.status(500).json({
    message: '服务器错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 添加数据库连接测试
router.get('/db-test', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query('SELECT 1 as test');
    res.json({ 
      message: '数据库连接正常',
      result: result[0] 
    });
  } catch (error) {
    res.status(500).json({ 
      message: '数据库连接失败',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// 添加一个测试路由
router.get('/test', (req, res) => {
  res.json({ message: 'Video routes working!' });
});

// 添加评论测试路由
router.post('/test-comment', auth, (req, res) => {
  res.json({ 
    message: 'Comment route working!',
    user: req.user,
    body: req.body 
  });
});

// 图片上传
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/uploads/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('只允许上传图片文件'));
    }
    cb(null, true);
  }
}).single('image');

// 图片上传接口
router.post('/upload/image', auth, checkAdmin, (req, res) => {
  thumbnailUpload(req, res, function(err) {
    if (err) {
      console.error('缩略图上传错误:', err);
      return res.status(400).json({ 
        message: err.message || '缩略图上传失败'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        message: '请选择要上传的缩略图'
      });
    }

    const filePath = '/images/video-covers/' + req.file.filename;
    res.json({ 
      url: filePath,
      message: '缩略图上传成功'
    });
  });
});

// ��取单个视频信息
router.get('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [videos] = await connection.query(`
      SELECT v.*, 
             COUNT(DISTINCT vc.id) as comments_count,
             COUNT(DISTINCT vv.id) as views_count
      FROM videos v
      LEFT JOIN video_comments vc ON v.id = vc.video_id
      LEFT JOIN video_views vv ON v.id = vv.video_id
      WHERE v.id = ? AND v.status = 'published'
      GROUP BY v.id
    `, [req.params.id]);

    if (!videos.length) {
      return res.status(404).json({ message: '视频不存在' });
    }

    res.json(videos[0]);
  } catch (error) {
    console.error('获取视频信息失败:', error);
    res.status(500).json({ message: '获取视频信息失败' });
  } finally {
    connection.release();
  }
});

// 添加收藏视频
router.post('/:id/favorite', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const videoId = req.params.id;
    const userId = req.user.userId;

    // 检查视频是否存在
    const [videos] = await connection.query(
      'SELECT id FROM videos WHERE id = ?',
      [videoId]
    );

    if (videos.length === 0) {
      return res.status(404).json({ 
        message: '视频不存在'
      });
    }

    // 检查是否已经收���
    const [favorites] = await connection.query(
      'SELECT * FROM video_favorites WHERE video_id = ? AND user_id = ?',
      [videoId, userId]
    );

    let favorited;
    let message;

    if (favorites.length > 0) {
      // 取消收藏
      await connection.query(
        'DELETE FROM video_favorites WHERE video_id = ? AND user_id = ?',
        [videoId, userId]
      );
      favorited = false;
      message = '已取消收藏';
    } else {
      // 添加收藏
      await connection.query(
        'INSERT INTO video_favorites (video_id, user_id) VALUES (?, ?)',
        [videoId, userId]
      );
      favorited = true;
      message = '收藏成功';
    }

    res.json({ 
      favorited,
      message
    });

  } catch (error) {
    console.error('收藏操作失败:', error);
    res.status(500).json({ message: '操作失败，请稍后重试' });
  } finally {
    connection.release();
  }
});

// 获取视频收藏状态
router.get('/:id/favorite', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [favorites] = await connection.query(
      'SELECT * FROM video_favorites WHERE video_id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    res.json({
      favorited: favorites.length > 0
    });
  } catch (error) {
    console.error('获取收藏状态失败:', error);
    res.status(500).json({ message: '获取收藏状态失败' });
  } finally {
    connection.release();
  }
});

// 获取用户收藏的视频列表
router.get('/favorites/list', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [videos] = await connection.query(`
      SELECT 
        v.*,
        COUNT(DISTINCT vc.id) as comments_count,
        COUNT(DISTINCT vl.id) as likes_count
      FROM video_favorites vf
      JOIN videos v ON vf.video_id = v.id
      LEFT JOIN video_comments vc ON v.id = vc.video_id
      LEFT JOIN video_likes vl ON v.id = vl.video_id
      WHERE vf.user_id = ? AND v.status = 'published'
      GROUP BY v.id
      ORDER BY vf.created_at DESC
    `, [req.user.userId]);

    res.json(videos);
  } catch (error) {
    console.error('获取收藏视频列表失败:', error);
    res.status(500).json({ message: '获取收藏视频列表失败' });
  } finally {
    connection.release();
  }
});

module.exports = router; 
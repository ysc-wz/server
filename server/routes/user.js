const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const pool = require('../db');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('只能上传图片文件'));
    }
    cb(null, true);
  }
}).single('avatar');

// 删除旧头像文件的辅助函数
const deleteOldAvatar = (avatarUrl) => {
  if (!avatarUrl || avatarUrl.includes('default-avatar')) return;
  
  try {
    const filePath = path.join(__dirname, '../../public', avatarUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('旧头像文件已删除:', filePath);
    }
  } catch (error) {
    console.error('删除旧头像文件失败:', error);
  }
};

// 头像上传路由
router.post('/avatar', auth, (req, res) => {
  // 添加缓存控制头
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  upload(req, res, async (err) => {
    if (err) {
      console.error('文件上传错误:', err);
      return res.status(400).json({ message: err.message || '文件上传失败' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: '没有上传文件' });
      }

      // 获取用户当前的头像URL
      const [userRows] = await pool.query(
        'SELECT avatar FROM users WHERE id = ?',
        [req.user.userId]
      );

      if (userRows.length > 0) {
        // 删除旧头像文件
        deleteOldAvatar(userRows[0].avatar);
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // 更新用户头像URL
      await pool.query(
        'UPDATE users SET avatar = ? WHERE id = ?',
        [avatarUrl, req.user.userId]
      );

      res.json({
        message: '头像上传成功',
        avatarUrl: avatarUrl
      });
    } catch (error) {
      // 如果更新失败，删除新上传的文件
      if (req.file) {
        const filePath = path.join(uploadDir, req.file.filename);
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkError) {
          console.error('删除新上传文件失败:', unlinkError);
        }
      }

      console.error('头像上传失败:', error);
      res.status(500).json({ message: '头像上传失败' });
    }
  });
});

module.exports = router; 
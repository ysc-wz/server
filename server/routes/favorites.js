const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// 切换收藏状态
router.post('/toggle', auth, async (req, res) => {
  try {
    const { carId } = req.body;
    const userId = req.user.userId;

    // 检查是否已收藏
    const [rows] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? AND car_id = ?',
      [userId, carId]
    );

    if (rows.length > 0) {
      // 取消收藏
      await pool.query(
        'DELETE FROM favorites WHERE user_id = ? AND car_id = ?',
        [userId, carId]
      );
      res.json({ isFavorited: false });
    } else {
      // 添加收藏
      await pool.query(
        'INSERT INTO favorites (user_id, car_id) VALUES (?, ?)',
        [userId, carId]
      );
      res.json({ isFavorited: true });
    }
  } catch (error) {
    console.error('收藏操作失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取收藏列表
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, b.name as brand, f.created_at as favorited_at
      FROM favorites f
      JOIN cars c ON f.car_id = c.id
      JOIN brands b ON c.brand_id = b.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [req.user.userId]);
    
    res.json(rows);
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 检查收藏状态
router.get('/check/:carId', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? AND car_id = ?',
      [req.user.userId, req.params.carId]
    );
    res.json({ isFavorited: rows.length > 0 });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router; 
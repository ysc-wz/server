const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// 获取购物车列表
router.get('/', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        c.*,
        b.name as brand
      FROM cart_items ci
      JOIN cars c ON ci.car_id = c.id
      JOIN brands b ON c.brand_id = b.id
      WHERE ci.user_id = ?
    `, [req.user.userId]);

    res.json(rows);
  } catch (error) {
    console.error('获取购物车失败:', error);
    res.status(500).json({ message: '获取购物车失败' });
  } finally {
    connection.release();
  }
});

// 添加商品到购物车
router.post('/', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { car_id, quantity } = req.body;
    
    // 检查商品是否已在购物车中
    const [existing] = await connection.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND car_id = ?',
      [req.user.userId, car_id]
    );

    if (existing.length > 0) {
      // 更新数量
      await connection.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND car_id = ?',
        [quantity, req.user.userId, car_id]
      );
    } else {
      // 新增商品
      await connection.query(
        'INSERT INTO cart_items (user_id, car_id, quantity) VALUES (?, ?, ?)',
        [req.user.userId, car_id, quantity]
      );
    }

    res.json({ message: '添加成功' });
  } catch (error) {
    console.error('添加到购物车失败:', error);
    res.status(500).json({ message: '添加到购物车失败' });
  } finally {
    connection.release();
  }
});

// 更新购物车商品数量
router.put('/:id', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { quantity } = req.body;
    
    await connection.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, req.params.id, req.user.userId]
    );

    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('更新购物车失败:', error);
    res.status(500).json({ message: '更新购物车失败' });
  } finally {
    connection.release();
  }
});

// 清空购物车
router.delete('/clear', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // 检查用户是否有购物车项
    const [items] = await connection.query(
      'SELECT id FROM cart_items WHERE user_id = ?',
      [req.user.userId]
    );

    if (!items.length) {
      return res.status(404).json({ message: '购物车为空' });
    }

    await connection.query(
      'DELETE FROM cart_items WHERE user_id = ?',
      [req.user.userId]
    );

    res.json({ message: '购物车已清空' });
  } catch (error) {
    console.error('清空购物车失败:', error);
    res.status(500).json({ message: '清空购物车失败' });
  } finally {
    connection.release();
  }
});

// 删除购物车商品
router.delete('/:id', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除购物车商品失败:', error);
    res.status(500).json({ message: '删除购物车商品失败' });
  } finally {
    connection.release();
  }
});

module.exports = router; 
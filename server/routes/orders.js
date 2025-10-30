const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// 获取用户订单列表
router.get('/', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // 获取订单基本信息
    const [orders] = await connection.query(`
      SELECT 
        o.id, o.order_no, o.total_amount, o.status,
        o.created_at, o.updated_at
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.userId]);

    // 获取订单详细信息
    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
      const [items] = await connection.query(`
        SELECT 
          oi.id, oi.car_id, oi.car_name, oi.car_image,
          oi.price, oi.quantity,
          c.brand_id, b.name as brand,
          c.images as car_images
        FROM order_items oi
        LEFT JOIN cars c ON oi.car_id = c.id
        LEFT JOIN brands b ON c.brand_id = b.id
        WHERE oi.order_id = ?
      `, [order.id]);

      return {
        ...order,
        items: items.map(item => ({
          ...item,
          car_image: item.car_image || (item.car_images ? 
            (item.car_images.includes('images/cars') ? 
              `/${item.car_images.split(',')[0]}` : 
              `/images/cars/${item.car_images.split(',')[0]}`
            ) : '/images/default-car.png'),
          subtotal: item.price * item.quantity
        }))
      };
    }));

    res.json(ordersWithDetails);
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ 
      message: '获取订单列表失败',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// 获取订单详情
router.get('/:id', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // 获取订单信息
    const [orders] = await connection.query(`
      SELECT 
        o.*, u.username, u.email,
        c.model as car_model,
        c.images as car_images,
        b.name as brand
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN cars c ON oi.car_id = c.id
      LEFT JOIN brands b ON c.brand_id = b.id
      WHERE o.id = ? AND o.user_id = ?
    `, [req.params.id, req.user.userId]);

    if (!orders.length) {
      return res.status(404).json({ message: '订单不存在' });
    }

    const order = orders[0];

    // 获取订单项
    const [items] = await connection.query(`
      SELECT 
        oi.*, c.brand_id, b.name as brand,
        c.model as car_name,
        c.images as car_images
      FROM order_items oi
      LEFT JOIN cars c ON oi.car_id = c.id
      LEFT JOIN brands b ON c.brand_id = b.id
      WHERE oi.order_id = ?
    `, [order.id]);

    // 处理每个订单项的图片
    const formattedItems = items.map(item => ({
      ...item,
      car_image: item.car_image || (item.car_images ? 
        (item.car_images.includes('images/cars') ? 
          `/${item.car_images.split(',')[0]}` : 
          `/images/cars/${item.car_images.split(',')[0]}`
        ) : '/images/default-car.png'),
      subtotal: item.price * item.quantity
    }));

    res.json({
      ...order,
      items: formattedItems
    });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ message: '获取订单详情失败' });
  } finally {
    connection.release();
  }
});

// 取消订单
router.post('/:id/cancel', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 检查订单是否存在且属于当前用户
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = "pending"',
      [req.params.id, req.user.userId]
    );

    if (!orders.length) {
      return res.status(404).json({ message: '订单不存在或无法取消' });
    }

    // 获取订单项以恢复库存
    const [items] = await connection.query(
      'SELECT car_id, quantity FROM order_items WHERE order_id = ?',
      [req.params.id]
    );

    // 恢复库存
    for (const item of items) {
      await connection.query(
        'UPDATE cars SET stock = stock + ? WHERE id = ?',
        [item.quantity, item.car_id]
      );
    }

    // 更新订单状态
    await connection.query(
      'UPDATE orders SET status = "cancelled", updated_at = NOW() WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();
    res.json({ message: '订单已取消' });
  } catch (error) {
    await connection.rollback();
    console.error('取消订单失败:', error);
    res.status(500).json({ message: '取消订单失败' });
  } finally {
    connection.release();
  }
});

// 创建订单
router.post('/', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { cartItems: orderItems } = req.body;
    const userId = req.user.userId;
    
    // 生成订单号
    const orderNo = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // 计算总金额并验证库存
    let totalAmount = 0;
    for (const item of orderItems) {
      const [cars] = await connection.query(
        'SELECT price, stock, images FROM cars WHERE id = ?',
        [item.car_id]
      );
      
      if (!cars.length) {
        throw new Error(`车辆不存在: ${item.car_id}`);
      }
      
      const car = cars[0];
      if (car.stock < item.quantity) {
        throw new Error(`库存不足: ${item.car_id}`);
      }
      
      totalAmount += car.price * item.quantity;
    }
    
    // 创建订单
    const [result] = await connection.query(
      `INSERT INTO orders (order_no, user_id, total_amount, status) 
       VALUES (?, ?, ?, 'paid')`,
      [orderNo, userId, totalAmount]
    );
    
    const orderId = result.insertId;
    
    // 创建订单项并更新库存
    for (const item of orderItems) {
      const [cars] = await connection.query(
        'SELECT price, model, images FROM cars WHERE id = ?',
        [item.car_id]
      );
      
      const car = cars[0];
      const carImage = car.images ? car.images.split(',')[0] : '/images/default-car.jpg';
      
      // 添加库存检查
      if (car.stock <= 0) {
        return res.status(400).json({
          error: '商品已无货'
        })
      }
      
      // 添加订单项
      await connection.query(
        `INSERT INTO order_items 
         (order_id, car_id, car_name, car_image, price, quantity)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.car_id, car.model, carImage, car.price, item.quantity]
      );
      
      // 更新库存
      await connection.query(
        'UPDATE cars SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.car_id]
      );

      // 如果库存为0，自动更新状态为已下架
      const [updatedCar] = await connection.query(
        'SELECT stock FROM cars WHERE id = ?',
        [item.car_id]
      );

      if (updatedCar[0].stock === 0) {
        await connection.query(
          'UPDATE cars SET status = ? WHERE id = ?',
          ['discontinued', item.car_id]
        );
      }
    }
    
    // 清空用户购物车
    const [userCartItems] = await connection.query(
      'SELECT id FROM cart_items WHERE user_id = ?',
      [userId]
    );
    
    if (userCartItems.length) {
      await connection.query(
        'DELETE FROM cart_items WHERE user_id = ?',
        [userId]
      );
    }
    
    await connection.commit();

    // 发送 WebSocket 消息通知前端更新
    req.app.get('io').emit('carUpdate', {
      type: 'stockChanged',
      carIds: orderItems.map(item => item.car_id)
    });

    res.json({
      message: '订单创建成功',
      orderId,
      orderNo
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('创建订单失败:', error);
    res.status(500).json({ 
      message: '创建订单失败',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

module.exports = router; 
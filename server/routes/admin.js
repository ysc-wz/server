const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// 在合适的初始化位置添加这段代码
const initDatabase = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      ALTER TABLE cars 
      MODIFY COLUMN status 
      ENUM('available', 'low_stock', 'out_of_stock', 'discontinued') 
      DEFAULT 'available'
    `);
    console.log('数据库表结构更新成功');
  } catch (error) {
    console.error('更新表结构失败:', error);
  } finally {
    connection.release();
  }
};

// 调用初始化函数
initDatabase();

// 获取车辆列表
router.get('/cars', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    // 获取总数
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as total FROM cars'
    );
    const total = countResult[0].total;

    // 获取分页数据
    const [cars] = await connection.query(
      `SELECT c.*, b.name as brand 
       FROM cars c 
       LEFT JOIN brands b ON c.brand_id = b.id 
       ORDER BY c.created_at DESC 
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );

    // 获取每辆车的分类
    for (let car of cars) {
      const [categories] = await connection.query(
        `SELECT c.name 
         FROM car_categories cc
         JOIN categories c ON cc.category_id = c.id
         WHERE cc.car_id = ?`,
        [car.id]
      );
      car.categories = categories.map(c => c.name).join(',');
    }

    res.json({
      items: cars,
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error('获取车��列表失败:', error);
    res.status(500).json({ message: '获取车辆列表失败' });
  } finally {
    connection.release();
  }
});

// 删除车辆
router.delete('/cars/:id', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const carId = req.params.id;
    console.log('开始删除车辆，ID:', carId);

    // 获取车辆信息
    const [cars] = await connection.query(
      'SELECT * FROM cars WHERE id = ?',
      [carId]
    );

    if (!cars.length) {
      await connection.rollback();
      return res.status(404).json({ message: '车辆不存在' });
    }

    // 获取相关数据统计
    const [relatedData] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM order_items WHERE car_id = ?) as orderCount,
        (SELECT COUNT(*) FROM comments WHERE car_id = ?) as commentCount,
        (SELECT COUNT(*) FROM favorites WHERE car_id = ?) as favoriteCount,
        (SELECT COUNT(*) FROM car_categories WHERE car_id = ?) as categoryCount
    `, [carId, carId, carId, carId]);

    console.log('相关数据统计:', relatedData[0]);

    // 删除相关的收藏记录
    if (relatedData[0].favoriteCount > 0) {
      await connection.query('DELETE FROM favorites WHERE car_id = ?', [carId]);
      console.log('已删除收藏记录');
    }

    // 删除相关的评论回复
    await connection.query(`
      DELETE cr FROM comment_replies cr
      INNER JOIN comments c ON cr.comment_id = c.id
      WHERE c.car_id = ?
    `, [carId]);
    console.log('已删除评论回复');

    // 删除评论点赞
    await connection.query(`
      DELETE cl FROM comment_likes cl
      INNER JOIN comments c ON cl.comment_id = c.id
      WHERE c.car_id = ?
    `, [carId]);
    console.log('已删除评论点赞');

    // 删除相关的评论
    if (relatedData[0].commentCount > 0) {
      await connection.query('DELETE FROM comments WHERE car_id = ?', [carId]);
      console.log('已删除评论');
    }

    // 删除相关的订单项
    if (relatedData[0].orderCount > 0) {
      // 获取相关订单ID
      const [orderItems] = await connection.query(
        'SELECT DISTINCT order_id FROM order_items WHERE car_id = ?',
        [carId]
      );
      
      // 删除订单项
      await connection.query('DELETE FROM order_items WHERE car_id = ?', [carId]);
      console.log('已删除订单项');

      // 检查并删除空订单
      for (const item of orderItems) {
        const [remainingItems] = await connection.query(
          'SELECT COUNT(*) as count FROM order_items WHERE order_id = ?',
          [item.order_id]
        );
        if (remainingItems[0].count === 0) {
          await connection.query('DELETE FROM orders WHERE id = ?', [item.order_id]);
          console.log('已删除空订单:', item.order_id);
        }
      }
    }

    // 删除车辆图片
    if (cars[0].images) {
      const imageUrls = cars[0].images.split(',');
      for (const imageUrl of imageUrls) {
        try {
          const filename = imageUrl.split('/').pop();
          if (filename) {
            const imagePath = path.join(__dirname, '../../public/images/cars', filename);
            console.log('尝试删除图片:', imagePath);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
              console.log('成功删除图片:', imagePath);
            }
          }
        } catch (err) {
          console.error('删除图片文件失败:', err);
        }
      }
    }

    // 删除分类关联
    if (relatedData[0].categoryCount > 0) {
      await connection.query('DELETE FROM car_categories WHERE car_id = ?', [carId]);
      console.log('已删除分类关联');
    }

    // 删除车辆记录
    const [result] = await connection.query(
      'DELETE FROM cars WHERE id = ?',
      [carId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: '车辆不存在或已被删除' });
    }

    await connection.commit();
    console.log('车辆及相关数据删除成功');
    res.json({ 
      message: '删除成功',
      deletedId: carId,
      deletedData: {
        orders: relatedData[0].orderCount,
        comments: relatedData[0].commentCount,
        favorites: relatedData[0].favoriteCount,
        categories: relatedData[0].categoryCount
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('删除车辆失败:', error);
    res.status(500).json({ 
      message: '删除车辆失败',
      error: error.message,
      details: '服务器内部错误'
    });
  } finally {
    connection.release();
  }
});

// 获取订单列表
router.get('/orders', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // 首先获取订单基本信息
    const [orders] = await connection.query(`
      SELECT 
        o.id, o.order_no, o.total_amount, o.status, 
        o.created_at, o.updated_at,
        u.id as user_id, u.username, u.email,
        CASE 
          WHEN o.status = 'pending' AND o.created_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE) 
          THEN 'cancelled'
          ELSE o.status 
        END as status
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    // 获取订单详细信息
    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
      const [items] = await connection.query(`
        SELECT 
          oi.id, oi.car_id, oi.car_name, oi.car_image,
          oi.price, oi.quantity,
          c.brand_id, b.name as brand
        FROM order_items oi
        LEFT JOIN cars c ON oi.car_id = c.id
        LEFT JOIN brands b ON c.brand_id = b.id
        WHERE oi.order_id = ?
      `, [order.id]);

      return {
        ...order,
        user: {
          id: order.user_id,
          username: order.username,
          email: order.email
        },
        items: items.map(item => ({
          ...item,
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

// 取消订单
router.post('/orders/:id/cancel', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 检查订单是否存在且状态为���款
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE id = ? AND status = "pending"',
      [req.params.id]
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

// 获取订单统计数据
router.get('/orders/stats', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // 获取订单统计
    const [orderStats] = await connection.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_sales
      FROM orders
      WHERE status != 'cancelled'
    `);

    // 获取用户总数
    const [userStats] = await connection.query(`
      SELECT COUNT(*) as unique_customers
      FROM users
      WHERE role != 'admin'
    `);

    res.json({
      total_orders: orderStats[0].total_orders || 0,
      total_sales: orderStats[0].total_sales || 0,
      unique_customers: userStats[0].unique_customers || 0
    });
  } catch (error) {
    console.error('获取订单统计失败:', error);
    res.status(500).json({ message: '获取订单统计失败' });
  } finally {
    connection.release();
  }
});

// 获取用户列表
router.get('/users', auth, checkAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const offset = (page - 1) * pageSize

    // 获取总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM users'
    )
    const total = countResult[0].total

    // 获取分页数据
    const [users] = await pool.query(
      'SELECT id, username, email, avatar, role, phone, created_at FROM users LIMIT ? OFFSET ?',
      [pageSize, offset]
    )

    // 处理回数据
    const formattedUsers = users.map(user => ({
      ...user,
      avatar: user.avatar ? user.avatar.replace('/uploads/avatars/', '') : null
    }))

    res.json({
      items: formattedUsers,
      total,
      page,
      pageSize
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({ message: '获取用户列表失败' })
  }
})

// 删除用户
router.delete('/users/:id', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 检查是��是管理员
    const [users] = await connection.query(
      'SELECT role FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!users.length) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (users[0].role === 'admin') {
      return res.status(403).json({ message: '不能删除管理员账号' });
    }

    // 删除用户
    await connection.query(
      'DELETE FROM users WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();
    res.json({ message: '删除成功' });
  } catch (error) {
    await connection.rollback();
    console.error('删除用户失败:', error);
    res.status(500).json({ message: '删除用户失败' });
  } finally {
    connection.release();
  }
});

// 获取评论列表
router.get('/comments', auth, checkAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const offset = (page - 1) * pageSize

    // 获取总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM comments'
    )
    const total = countResult[0].total

    // 获取分页数据
    const [comments] = await pool.query(
      `SELECT c.*, 
        u.username as user_username,
        u.avatar as user_avatar,
        car.model as car_model,
        car.images as car_images,
        b.name as car_brand,
        c.created_at as createdAt
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN cars car ON c.car_id = car.id
       LEFT JOIN brands b ON car.brand_id = b.id
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    )

    // 处理返回数据
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: {
        username: comment.user_username,
        avatar: comment.user_avatar ? comment.user_avatar.replace('/uploads/avatars/', '') : null
      },
      car: {
        brand: comment.car_brand,
        model: comment.car_model,
        images: comment.car_images
      }
    }))

    res.json({
      items: formattedComments,
      total,
      page,
      pageSize
    })
  } catch (error) {
    console.error('获取评论列表失败:', error)
    res.status(500).json({ message: '获取评论列表失败' })
  }
})

// 删除评论
router.delete('/comments/:id', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 检查评论是否存在
    const [comments] = await connection.query(
      'SELECT * FROM comments WHERE id = ?',
      [req.params.id]
    );

    if (!comments.length) {
      return res.status(404).json({ message: '评论不存在' });
    }

    // 删除评论
    await connection.query(
      'DELETE FROM comments WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();
    res.json({ message: '删除成功' });
  } catch (error) {
    await connection.rollback();
    console.error('删除评论失败:', error);
    res.status(500).json({ message: '删除评论失败' });
  } finally {
    connection.release();
  }
});

// 添加车辆前先获取品牌ID
const getBrandId = async (brandName) => {
  const [brand] = await pool.query('SELECT id FROM brands WHERE name = ?', [brandName]);
  if (brand && brand[0]) {
    return brand[0].id;
  }
  throw new Error(`Brand ${brandName} not found`);
};

// 添加车辆的路由处理
router.post('/cars', async (req, res) => {
  try {
    const {
      brand_id, // 只使用品牌ID
      model,
      price,
      year,
      color,
      mileage,
      stock,
      description,
      images,
      engine_type,
      transmission,
      fuel_type,
      body_type,
      drive_type
    } = req.body;

    // 插入车辆数据，不包含 brand 字段
    const result = await pool.query(
      `INSERT INTO cars SET ?`,
      {
        brand_id,
        model,
        price,
        year,
        color,
        mileage,
        stock,
        description,
        images,
        engine_type,
        transmission,
        fuel_type,
        status: 'available',
        body_type,
        drive_type
      }
    );

    res.json({
      success: true,
      message: '车辆添加成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('添加车辆失败:', error);
    res.status(500).json({
      success: false,
      message: '添加车辆失败: ' + error.message
    });
  }
});

// 编辑车辆
router.put('/cars/:id', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { categories, brand, created_at, updated_at, ...carData } = req.body;

    // 更新车辆基本信息
    const updateData = {
      ...carData,
      updated_at: new Date()
    };
    delete updateData.id; // 删除id字段，避免更新主键

    await connection.query(
      'UPDATE cars SET ? WHERE id = ?',
      [updateData, id]
    );

    // 删除旧的分类关联
    await connection.query(
      'DELETE FROM car_categories WHERE car_id = ?',
      [id]
    );

    // 添加新的分类关联
    if (categories && categories.length > 0) {
      // 先获取分类ID
      const [categoryRows] = await connection.query(
        'SELECT id, name FROM categories WHERE name IN (?)',
        [categories]
      );

      if (categoryRows.length > 0) {
        const values = categoryRows.map(category => [id, category.id]);
        await connection.query(
          'INSERT INTO car_categories (car_id, category_id) VALUES ?',
          [values]
        );
      }
    }

    await connection.commit();
    res.json({ message: '更新成功' });
  } catch (error) {
    await connection.rollback();
    console.error('更新车辆失败:', error);
    res.status(500).json({ message: '更新车辆失败' });
  } finally {
    connection.release();
  }
});

// 更新订单状态
router.put('/orders/:id/status', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { status } = req.body;
    const orderId = req.params.id;
 
    // 验证状态值
    const validStatuses = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: '无效的订单状态' });
    }
 
    await connection.beginTransaction();
 
    // 获取当前订��状态
    const [orders] = await connection.query(
      'SELECT status FROM orders WHERE id = ?',
      [orderId]
    );
 
    if (!orders.length) {
      return res.status(404).json({ message: '订单不存在' });
    }
 
    // 更新订单状态
    await connection.query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, orderId]
    );
 
    await connection.commit();
    res.json({ message: '订单状态已更新' });
 
  } catch (error) {
    await connection.rollback();
    console.error('更新订单状态失败:', error);
    res.status(500).json({ message: '更新订单状态失败' });
  } finally {
    connection.release();
  }
});

// 编辑用户信息
router.put('/users/:id', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { email, phone, role } = req.body;

    // 不允许降级管理员
    if (req.body.role) {
      const [users] = await connection.query(
        'SELECT role FROM users WHERE id = ?',
        [req.params.id]
      );

      if (users[0]?.role === 'admin' && role !== 'admin') {
        return res.status(403).json({ message: '不能降级管理员账号' });
      }
    }

    // 更新用户信息
    await connection.query(
      `UPDATE users SET
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        role = COALESCE(?, role),
        updated_at = NOW()
       WHERE id = ?`,
      [email, phone, role, req.params.id]
    );

    await connection.commit();
    res.json({ message: '更新成功' });
  } catch (error) {
    await connection.rollback();
    console.error('更新用户信息失败:', error);
    res.status(500).json({ message: '更新用户信息失败' });
  } finally {
    connection.release();
  }
});

// 批量删除车辆
router.post('/cars/batch-delete', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: '请选择要删除的车辆' });
    }

    // 删除车辆
    await connection.query(
      'DELETE FROM cars WHERE id IN (?)',
      [ids]
    );

    await connection.commit();
    res.json({ message: '批量删除成功' });
  } catch (error) {
    await connection.rollback();
    console.error('批量删除车辆失败:', error);
    res.status(500).json({ message: '批量删除车辆失败' });
  } finally {
    connection.release();
  }
});

// 批量更新车辆状态
router.post('/cars/batch-update-status', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: '请选择要更新的车辆' });
    }

    // 更新车辆状态
    await connection.query(
      'UPDATE cars SET status = ? WHERE id IN (?)',
      [status, ids]
    );

    await connection.commit();
    res.json({ message: '批量更新成功' });
  } catch (error) {
    await connection.rollback();
    console.error('批量更新车辆状态失败:', error);
    res.status(500).json({ message: '批量更新车辆状态失败' });
  } finally {
    connection.release();
  }
});

// 图片上传
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // 使用项目根目录的 public 文件夹
      const rootDir = path.join(__dirname, '../../public');  // 从 server/routes 回到项目根目录的 public
      const imagesDir = path.join(rootDir, 'images');
      const carsDir = path.join(imagesDir, 'cars');
      
      console.log('创建上传目录结构...');
      console.log('Public目录:', rootDir);
      console.log('Images目录:', imagesDir);
      console.log('Cars目录:', carsDir);
      
      // 依次创建目录
      try {
        if (!fs.existsSync(rootDir)) {
          fs.mkdirSync(rootDir);
          console.log('创建public目录成功');
        }
        if (!fs.existsSync(imagesDir)) {
          fs.mkdirSync(imagesDir);
          console.log('创建images目录成功');
        }
        if (!fs.existsSync(carsDir)) {
          fs.mkdirSync(carsDir);
          console.log('创建cars目录成功');
        }
        cb(null, carsDir);
      } catch (err) {
        console.error('创建目录失败:', err);
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      try {
        // 获取文件扩展���
        const ext = path.extname(file.originalname).toLowerCase();
        // 检查是否是允许的图片格式
        const allowedExts = ['.jpg', '.jpeg', '.png', '.gif'];
        if (!allowedExts.includes(ext)) {
          return cb(new Error('不支持的图片格式'));
        }
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'car-' + uniqueSuffix + ext;
        console.log('生成的文件名:', filename);
        cb(null, filename);
      } catch (err) {
        console.error('生成文件名时出错:', err);
        cb(err);
      }
    }
  }),
  fileFilter: (req, file, cb) => {
    // 检查文件类型
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      console.error('无效的文件类型:', file.mimetype);
      return cb(new Error('只能上传JPG、PNG或GIF格式的图片'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single('file');

// 修改上传路由路径
router.post('/cars/upload', auth, checkAdmin, (req, res) => {
  console.log('开始处理上传请求');
  
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer错误:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: '文件大小不能超过5MB' });
      }
      return res.status(400).json({ message: '文件上传失败', error: err.message });
    } else if (err) {
      console.error('上传错误:', err);
      return res.status(500).json({ message: '文件上传失败', error: err.message });
    }

    if (!req.file) {
      console.error('没有文件被上传');
      return res.status(400).json({ message: '没有上传文件' });
    }

    try {
      // 检查文件是否成功保存
      const filePath = req.file.path;
      console.log('保存的文���路径:', filePath);
      
      if (!fs.existsSync(filePath)) {
        console.error('文件未成功保存:', filePath);
        return res.status(500).json({ message: '文件保存失败' });
      }

      // 获取文件大小
      const stats = fs.statSync(filePath);
      console.log('文件大小:', stats.size, 'bytes');

      console.log('文件上传成功:', {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      // 返回相对路径
      const fileUrl = `/images/cars/${req.file.filename}`;
      res.json({
        url: fileUrl,
        message: '上传成功',
        file: {
          name: req.file.filename,
          size: stats.size,
          type: req.file.mimetype
        }
      });
    } catch (error) {
      console.error('处理上传文件时出错:', error);
      res.status(500).json({ message: '处理上传文件时出错', error: error.message });
    }
  });
});

// 获取评论详情
router.get('/comments/:id/detail', auth, checkAdmin, async (req, res) => {
  try {
    // 获取评论信息
    const [comments] = await pool.query(
      `SELECT c.*, 
        u.username as user_username,
        u.email as user_email,
        u.avatar as user_avatar,
        u.created_at as user_created_at,
        car.brand_id,
        car.model as car_model,
        car.price as car_price,
        car.year as car_year,
        car.images as car_images,
        b.name as car_brand
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN cars car ON c.car_id = car.id
       LEFT JOIN brands b ON car.brand_id = b.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (!comments.length) {
      return res.status(404).json({ message: '评论不存在' });
    }

    const comment = comments[0];

    // 获取评论的回复
    const [replies] = await pool.query(
      `SELECT r.*, 
        u.username as user_username,
        u.avatar as user_avatar
       FROM comment_replies r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.comment_id = ?
       ORDER BY r.created_at ASC`,
      [comment.id]
    );

    // 构建返回数据
    const result = {
      ...comment,
      user: {
        username: comment.user_username,
        email: comment.user_email,
        // 只保留文件名部分
        avatar: comment.user_avatar ? comment.user_avatar.replace('/uploads/avatars/', '') : null,
        created_at: comment.user_created_at
      },
      car: {
        brand: comment.car_brand,
        model: comment.car_model,
        price: comment.car_price,
        year: comment.car_year,
        images: comment.car_images
      },
      replies: replies.map(reply => ({
        ...reply,
        user: {
          username: reply.user_username,
          // 只留文件名部分
          avatar: reply.user_avatar ? reply.user_avatar.replace('/uploads/avatars/', '') : null
        }
      }))
    };

    res.json(result);
  } catch (error) {
    console.error('获取评论详情失败:', error);
    res.status(500).json({ message: '获取评论详情失败' });
  }
});

// 获取总览数据
router.get('/overview', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // 获取总销售额和订单数量
    const [salesStats] = await connection.query(`
      SELECT 
        COUNT(*) as orderCount,
        SUM(total_amount) as totalSales
      FROM orders 
      WHERE status != 'cancelled'
    `);

    // 获取用户数量
    const [userStats] = await connection.query(
      'SELECT COUNT(*) as userCount FROM users'
    );

    // 获取车辆库存
    const [stockStats] = await connection.query(`
      SELECT SUM(stock) as totalStock 
      FROM cars 
      WHERE status = 'available'
    `);

    // 获取热门车型
    const [popularCars] = await connection.query(`
      SELECT 
        c.id,
        c.model,
        c.price,
        c.images,
        b.name as brand,
        COUNT(oi.car_id) as sales
      FROM cars c
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN order_items oi ON oi.car_id = c.id
      LEFT JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND o.status != 'cancelled'
      GROUP BY c.id, c.model, c.price, c.images, b.name
      ORDER BY sales DESC
      LIMIT 5
    `);

    // 获取最新订单
    const [latestOrders] = await connection.query(`
      SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.created_at,
        u.username,
        c.model as car_model,
        c.images as car_images,
        b.name as brand
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN cars c ON oi.car_id = c.id
      LEFT JOIN brands b ON c.brand_id = b.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    // 计算趋势（与一个周期相比）
    const [prevSalesStats] = await connection.query(`
      SELECT COUNT(*) as orderCount, SUM(total_amount) as totalSales
      FROM orders 
      WHERE 
        status != 'cancelled' AND 
        created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND
        created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    const salesTrend = prevSalesStats[0].totalSales 
      ? ((salesStats[0].totalSales - prevSalesStats[0].totalSales) / prevSalesStats[0].totalSales * 100).toFixed(1)
      : 0;

    const orderTrend = prevSalesStats[0].orderCount
      ? ((salesStats[0].orderCount - prevSalesStats[0].orderCount) / prevSalesStats[0].orderCount * 100).toFixed(1)
      : 0;

    res.json({
      stats: {
        totalSales: salesStats[0].totalSales || 0,
        orderCount: salesStats[0].orderCount || 0,
        userCount: userStats[0].userCount || 0,
        carStock: stockStats[0].totalStock || 0,
        salesTrend: Number(salesTrend),
        orderTrend: Number(orderTrend),
        userTrend: 0,
        stockTrend: 0
      },
      popularCars: popularCars.map(car => ({
        ...car,
        image: car.images?.split(',')[0],
        sales: car.sales || 0
      })),
      latestOrders: latestOrders.map(order => ({
        id: order.id,
        amount: order.total_amount,
        status: order.status,
        createdAt: order.created_at,
        user: {
          username: order.username
        },
        car: {
          brand: order.brand,
          model: order.car_model,
          image: order.car_images?.split(',')[0]
        }
      }))
    });
  } catch (error) {
    console.error('获取总览数据失败:', error);
    res.status(500).json({ message: '获取总览数据失败' });
  } finally {
    connection.release();
  }
});

// 更新车辆状态
router.put('/cars/:id/status', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { status } = req.body;
    const validStatuses = ['available', 'discontinued'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: '无效的状态' });
    }

    // 更新状态，不做任何自动判断
    await connection.query(
      'UPDATE cars SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, req.params.id]
    );

    await connection.commit();
    res.json({ 
      message: '状态更新成功',
      status: status
    });
  } catch (error) {
    await connection.rollback();
    console.error('更新车辆状态失败:', error);
    res.status(500).json({ 
      message: '更新状态失败',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// 更新车辆信息
router.put('/cars/:id', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const carId = req.params.id;
    const updateData = { ...req.body };

    // 移除不需要的字段
    delete updateData.created_at;
    delete updateData.updated_at;

    // 确保状态字段存在且有效
    if (updateData.status) {
      const validStatuses = ['available', 'discontinued'];
      if (!validStatuses.includes(updateData.status)) {
        return res.status(400).json({ message: '无效的状态' });
      }

      // 只在用户选择"有货"状态且库存小于0时，才设置为low_stock
      if (updateData.status === 'available' && 
          typeof updateData.stock === 'number' && 
          updateData.stock <= 0) {
        updateData.status = 'low_stock';
      }
      // 其他情况保持用户选择的状态
    }

    // 构建更新SQL，确保status字段被正确更新
    const updateFields = Object.keys(updateData)
      .map(key => `${key} = ?`)
      .join(', ');
    const updateValues = [...Object.values(updateData), carId];

    // 执行更新
    await connection.query(
      `UPDATE cars SET ${updateFields}, updated_at = NOW() WHERE id = ?`,
      updateValues
    );

    // 获取更新后的车辆信息
    const [updatedCar] = await connection.query(
      `SELECT c.*, b.name as brand 
       FROM cars c 
       LEFT JOIN brands b ON c.brand_id = b.id 
       WHERE c.id = ?`,
      [carId]
    );

    await connection.commit();
    res.json({ 
      message: '更新成功',
      car: updatedCar[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('更新车辆失败:', error);
    res.status(500).json({ message: '更新失败' });
  } finally {
    connection.release();
  }
});

// 补货接口
router.put('/cars/:id/restock', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { stock } = req.body;
    
    // 获取当前库存和状态
    const [cars] = await connection.query(
      'SELECT stock, status FROM cars WHERE id = ?',
      [req.params.id]
    );

    if (!cars.length) {
      return res.status(404).json({ message: '车辆不存在' });
    }

    const car = cars[0];
    const newStock = car.stock + Number(stock);

    // 只更新库存，不改变状态
    await connection.query(
      'UPDATE cars SET stock = ?, updated_at = NOW() WHERE id = ?',
      [newStock, req.params.id]
    );

    await connection.commit();
    res.json({ 
      message: '补货成功',
      status: car.status, // 保持原状态不变
      stock: newStock
    });
  } catch (error) {
    await connection.rollback();
    console.error('补货失败:', error);
    res.status(500).json({ message: '补货失败' });
  } finally {
    connection.release();
  }
});

// 获取销售趋势数据
router.get('/stats/sales-trend', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { range = 'week' } = req.query;
    let dateFormat, interval;
    
    switch (range) {
      case 'year':
        dateFormat = '%Y-%m';
        interval = 'INTERVAL 12 MONTH';
        break;
      case 'month':
        dateFormat = '%Y-%m-%d';
        interval = 'INTERVAL 30 DAY';
        break;
      default: // week
        dateFormat = '%Y-%m-%d';
        interval = 'INTERVAL 7 DAY';
    }

    const [trends] = await connection.query(`
      SELECT 
        DATE_FORMAT(created_at, ?) as date,
        COUNT(*) as order_count,
        SUM(total_amount) as sales_amount
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), ${interval})
        AND status != 'cancelled'
      GROUP BY date
      ORDER BY date
    `, [dateFormat]);

    res.json(trends);
  } catch (error) {
    console.error('获取销售趋势失败:', error);
    res.status(500).json({ message: '获取销售趋势失败' });
  } finally {
    connection.release();
  }
});

// 获取热门车型
router.get('/stats/popular-cars', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { range = 'week' } = req.query;
    let interval;
    
    switch (range) {
      case 'quarter':
        interval = 'INTERVAL 90 DAY';
        break;
      case 'month':
        interval = 'INTERVAL 30 DAY';
        break;
      default: // week
        interval = 'INTERVAL 7 DAY';
    }

    const [popularCars] = await connection.query(`
      SELECT 
        c.id,
        c.model,
        b.name as brand,
        c.price,
        c.images,
        SUM(oi.quantity) as total_sales,
        COUNT(DISTINCT o.id) as order_count,
        (
          SELECT SUM(oi2.quantity)
          FROM order_items oi2
          JOIN orders o2 ON oi2.order_id = o2.id
          WHERE oi2.car_id = c.id
            AND o2.created_at >= DATE_SUB(DATE_SUB(CURDATE(), ${interval}), ${interval})
            AND o2.status != 'cancelled'
        ) as previous_sales
      FROM cars c
      JOIN brands b ON c.brand_id = b.id
      JOIN order_items oi ON oi.car_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= DATE_SUB(CURDATE(), ${interval})
        AND o.status != 'cancelled'
      GROUP BY c.id
      ORDER BY total_sales DESC
      LIMIT 10
    `);

    // 计算销售趋势
    const carsWithTrend = popularCars.map(car => ({
      ...car,
      image: car.images ? car.images.split(',')[0] : null,
      trend: ((car.total_sales - (car.previous_sales || 0)) / (car.previous_sales || 1)) * 100
    }));

    res.json(carsWithTrend);
  } catch (error) {
    console.error('获取热门车型失败:', error);
    res.status(500).json({ message: '获取热门车型失败' });
  } finally {
    connection.release();
  }
});

// 获取最新订单
router.get('/stats/latest-orders', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [orders] = await connection.query(`
      SELECT 
        o.id,
        o.order_no,
        o.total_amount as amount,
        o.status,
        o.created_at,
        u.id as user_id,
        u.username,
        oi.car_id,
        c.model as car_model,
        b.name as car_brand,
        c.images as car_images
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN cars c ON oi.car_id = c.id
      LEFT JOIN brands b ON c.brand_id = b.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    // 格式化订单数据
    const formattedOrders = orders.map(order => ({
      id: order.id,
      order_no: order.order_no,
      amount: order.amount,
      status: order.status,
      created_at: order.created_at,
      user: {
        id: order.user_id,
        username: order.username
      },
      car: {
        id: order.car_id,
        brand: order.car_brand,
        model: order.car_model,
        image: order.car_images ? order.car_images.split(',')[0] : null
      }
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('获取最新订单失败:', error);
    res.status(500).json({ message: '获取最新订单失败' });
  } finally {
    connection.release();
  }
});

// 更新视频信息
router.put('/videos/:id', auth, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, description, url, thumbnail, duration, category, status, is_featured, is_hot } = req.body;
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query(
      'UPDATE videos SET title = ?, description = ?, url = ?, thumbnail = ?, duration = ?, category = ?, status = ?, is_featured = ?, is_hot = ? WHERE id = ?',
      [title, description, url, thumbnail, duration, category, status, is_featured, is_hot, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '视频未找到' });
    }
    res.json({ message: '视频更新成功' });
  } catch (error) {
    console.error('更新视频失败:', error);
    res.status(500).json({ message: '更新视频���败' });
  } finally {
    connection.release();
  }
});

// 获取视频评论列表
router.get('/video-comments', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    // 获取总数
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as total FROM video_comments'
    );
    const total = countResult[0].total;
    console.log('总评论数:', total);

    // 获取评论��表
    const [comments] = await connection.query(`
      SELECT 
        vc.*,
        v.title as video_title,
        v.thumbnail as video_thumbnail,
        u.username,
        u.avatar,
        u.email,
        (SELECT COUNT(*) FROM video_comment_likes WHERE comment_id = vc.id) as likes_count,
        (SELECT COUNT(*) FROM video_comment_replies WHERE comment_id = vc.id) as replies_count
      FROM video_comments vc
      LEFT JOIN videos v ON vc.video_id = v.id
      LEFT JOIN users u ON vc.user_id = u.id
      ORDER BY vc.created_at DESC
      LIMIT ? OFFSET ?
    `, [pageSize, offset]);
    console.log('查询到的评论:', comments);

    // 获取每个评论的回复
    for (let comment of comments) {
      const [replies] = await connection.query(`
        SELECT 
          r.*,
          u.username,
          u.avatar
        FROM video_comment_replies r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.comment_id = ?
        ORDER BY r.created_at ASC
      `, [comment.id]);
      comment.replies = replies;
    }
    console.log('添加回复后的评论:', comments);

    res.json({
      total,
      comments
    });
  } catch (error) {
    console.error('获取视频评论列表失败:', error);
    res.status(500).json({ message: '获取评论列表失败' });
  } finally {
    connection.release();
  }
});

// 删除视频评论
router.delete('/video-comments/:id', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 先删除评论的回复
    await connection.query(
      'DELETE FROM video_comment_replies WHERE comment_id = ?',
      [req.params.id]
    );

    // 删除评论的点赞
    await connection.query(
      'DELETE FROM video_comment_likes WHERE comment_id = ?',
      [req.params.id]
    );

    // 删除评论本身
    await connection.query(
      'DELETE FROM video_comments WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();
    res.json({ message: '评论删除成功' });
  } catch (error) {
    await connection.rollback();
    console.error('删除视频评论失败:', error);
    res.status(500).json({ message: '删除评论失败' });
  } finally {
    connection.release();
  }
});

// 获取视频评论详情
router.get('/video-comments/:id', auth, checkAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // 获取评论详情
    const [comments] = await connection.query(`
      SELECT 
        vc.*,
        v.title as video_title,
        v.thumbnail as video_thumbnail,
        u.username,
        u.avatar,
        u.email,
        u.created_at as user_created_at,
        (SELECT COUNT(*) FROM video_comment_likes WHERE comment_id = vc.id) as likes_count
      FROM video_comments vc
      LEFT JOIN videos v ON vc.video_id = v.id
      LEFT JOIN users u ON vc.user_id = u.id
      WHERE vc.id = ?
    `, [req.params.id]);

    if (!comments.length) {
      return res.status(404).json({ message: '评论不存在' });
    }

    const comment = comments[0];

    // 获取回复列表
    const [replies] = await connection.query(`
      SELECT 
        vc.*,
        u.username,
        u.avatar
      FROM video_comments vc
      LEFT JOIN users u ON vc.user_id = u.id
      WHERE vc.parent_id = ?
      ORDER BY vc.created_at ASC
    `, [comment.id]);

    comment.replies = replies;

    res.json(comment);
  } catch (error) {
    console.error('获取视频评论详情失败:', error);
    res.status(500).json({ message: '获取评论详情失败' });
  } finally {
    connection.release();
  }
});

module.exports = router; 
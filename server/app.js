const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const dbConfig = require('./config/db.config')
const favoritesRouter = require('./routes/favorites');
const commentsRouter = require('./routes/comments');
const path = require('path');
const authRouter = require('./routes/auth');
const multer = require('multer')
const fs = require('fs')
const userRouter = require('./routes/user')
const adminRouter = require('./routes/admin');
const ordersRouter = require('./routes/orders');
const cartRouter = require('./routes/cart');
const videosRouter = require('./routes/videos');
const videoInteractionsRouter = require('./routes/video-interactions');
const { JWT_SECRET } = require('./config');

// 先创建 express app
const app = express()

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

// 然后创建 http server
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: [
      'http://localhost:5174',
      'https://aaa.yaosuchuan.cn',
      /\.yaosuchuan\.cn$/,
      'https://ysc-wz.github.io',
      /\.trycloudflare\.com$/  // Cloudflare Tunnel
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 设置 socket.io
app.set('io', io);

io.on('connection', (socket) => {
  console.log('客户端连接成功');
  
  socket.on('disconnect', () => {
    console.log('客户端断开连接');
  });
});

// 其他中间件和路由配置保持不变
app.use(cors({
  origin: [
    'http://localhost:5174',
    'https://aaa.yaosuchuan.cn',
    /\.yaosuchuan\.cn$/,
    'https://ysc-wz.github.io',
    /\.trycloudflare\.com$/  // Cloudflare Tunnel
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Requested-With',
    'Origin',
    'Accept',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
}))

app.options('*', cors());

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const pool = mysql.createPool(dbConfig)

// 测试数据库连接
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection()
    console.log('数据库连接成功')
    connection.release()
  } catch (error) {
    console.error('数据库连接失败:', error)
    throw error
  }
}

// 添加错误处理中件
app.use((err, req, res, next) => {
  const errorDetails = {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString(),
    ip: req.ip
  };
  
  console.error('服务器错误:', errorDetails);
  
  // 根据错误类型返回适当的状态码和信息
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: '请求参数错误',
      errors: err.errors,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    });
  }
  
  if (err.name === 'MulterError') {
    return res.status(400).json({
      message: '文件上传错误',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    });
  }
  
  res.status(500).json({
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? errorDetails : '服务器处理请求时发生错误'
  });
});

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 使用绝对路径
    const uploadDir = path.join(__dirname, '../public/uploads/avatars')
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, 'avatar-' + uniqueSuffix + ext)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许上传图片
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('只能上传图片文件'))
    }
    cb(null, true)
  }
}).single('avatar')

// 包装 upload 中间件以处理错误
const uploadMiddleware = (req, res, next) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer错误:', err);
      return res.status(400).json({
        message: '文件上传错误',
        error: err.message,
        code: 'UPLOAD_ERROR'
      });
    } else if (err) {
      console.error('其他上传错误:', err);
      return res.status(500).json({
        message: '文件上传失败',
        error: err.message,
        code: 'UPLOAD_FAILED'
      });
    }
    next();
  });
};

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../public/uploads/avatars')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
  console.log('创建上传目录:', uploadDir)
}

// 用户注册
app.post('/api/auth/register', uploadMiddleware, async (req, res) => {
  const connection = await pool.getConnection()
  try {
    console.log('注册请求体:', req.body)
    console.log('上传的文件:', req.file)

    const { username, password, email, phone } = req.body

    // 验证必填字段
    if (!username || !password || !email) {
      return res.status(400).json({ message: '用户名、密码和邮箱都是必填项' })
    }

    // 验证文件上传
    if (!req.file) {
      return res.status(400).json({ message: '请上传头像' })
    }

    // 构建头像URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`

    // 加密密
    const hashedPassword = await bcrypt.hash(password, 10)

    // 插入新用户
    const [result] = await connection.query(
      `INSERT INTO users (username, password, email, phone, avatar, role) 
       VALUES (?, ?, ?, ?, ?, 'user')`,
      [username, hashedPassword, email, phone || null, avatarUrl]
    )

    console.log('用户注册成功:', {
      userId: result.insertId,
      avatarUrl: avatarUrl
    })

    res.status(201).json({
      message: '注册成功',
      userId: result.insertId,
      avatarUrl: avatarUrl
    })
  } catch (error) {
    console.error('注册失败:', error)
    res.status(500).json({ message: '注册失败', error: error.message })
  } finally {
    connection.release()
  }
})

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const { username, password } = req.body

    // 获取用户信息（包括头像）
    const [users] = await connection.query(
      'SELECT id, username, password, email, avatar, role FROM users WHERE username = ?',
      [username]
    )

    if (users.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    const user = users[0]
    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    // 生成token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET)

    // 不返回密码
    delete user.password

    // 确保avatar字段存在
    console.log('登录用户信息:', user)

    res.json({
      token,
      user
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({ message: '登录失败' })
  } finally {
    connection.release()
  }
})

// 验证管理员权限的中间件
const adminAuth = async (req, res, next) => {
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

// 获取用户个人信息
app.get('/api/user/profile', auth, async (req, res) => {
  try {
    const userId = req.user.userId
    const [rows] = await pool.query(
      'SELECT username, email, phone FROM users WHERE id = ?',
      [userId]
    )
    
    if (rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' })
    }
    
    res.json(rows[0])
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 更新用户个人信息
app.put('/api/user/profile', auth, async (req, res) => {
  const { phone, email, newPassword } = req.body
  const userId = req.user.userId
  
  try {
    let query
    let values
    
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      query = `
        UPDATE users 
        SET phone = ?, email = ?, password = ? 
        WHERE id = ?
      `
      values = [phone, email, hashedPassword, userId]
    } else {
      query = `
        UPDATE users 
        SET phone = ?, email = ? 
        WHERE id = ?
      `
      values = [phone, email, userId]
    }
    
    const [result] = await pool.query(query, values)
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '用户不存在' })
    }
    
    res.json({ message: '更新成功' })
  } catch (error) {
    console.error('更新用户信息错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 获取轮播图
app.get('/api/banners', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order')
    res.json(rows)
  } catch (error) {
    console.error('获取轮播图失败:', error)
    res.status(500).json({ message: '获取轮播图失败' })
  }
})

// 1. 先定义搜索路由（必须放在其他具体路由）
app.get('/api/cars/search', async (req, res, next) => {
  const connection = await pool.getConnection()
  try {
    const { q, page = 1, pageSize = 12, sort, brand } = req.query
    
    console.log('搜索请求参数:', { q, page, pageSize, sort, brand })
    
    const offset = (page - 1) * pageSize

    // 基础查询
    let query = `
      SELECT DISTINCT c.*, b.name as brand 
      FROM cars c 
      JOIN brands b ON c.brand_id = b.id 
      LEFT JOIN car_categories cc ON c.id = cc.car_id
      LEFT JOIN categories cat ON cc.category_id = cat.id
      WHERE c.status = 'available'
    `
    const params = []

    // 添加搜索条件
    if (q) {
      query += ` AND (
        b.name LIKE ? OR 
        c.model LIKE ? OR 
        CONCAT(b.name, ' ', c.model) LIKE ? OR
        c.description LIKE ? OR 
        cat.name LIKE ? OR 
        c.color LIKE ? OR 
        c.engine_type LIKE ? OR 
        c.transmission LIKE ? OR 
        c.fuel_type LIKE ? OR 
        CAST(c.year AS CHAR) LIKE ? OR
        CAST(c.price AS CHAR) LIKE ?
      )`
      const searchTerm = `%${q}%`
      Array(11).fill(searchTerm).forEach(term => params.push(term))
    }

    // 添加品牌筛选
    if (brand) {
      query += ` AND b.name = ?`
      params.push(brand)
    }

    // 添加排序
    if (sort) {
      switch (sort) {
        case 'price_asc':
          query += ` ORDER BY c.price ASC`
          break
        case 'price_desc':
          query += ` ORDER BY c.price DESC`
          break
        case 'newest':
          query += ` ORDER BY c.created_at DESC`
          break
        default:
          query += ` ORDER BY c.created_at DESC`
      }
    } else {
      query += ` ORDER BY c.created_at DESC`
    }

    query += ` LIMIT ? OFFSET ?`
    params.push(Number(pageSize), offset)

    const [rows] = await connection.query(query, params)

    // 获取每辆车的分类
    for (let car of rows) {
      const [categories] = await connection.query(`
        SELECT cat.name 
        FROM car_categories cc
        JOIN categories cat ON cc.category_id = cat.id
        WHERE cc.car_id = ?
      `, [car.id])
      car.categories = categories.map(c => c.name).join(',')
    }

    const [countResult] = await connection.query('SELECT COUNT(*) as total FROM cars WHERE status = "available"')

    res.json({
      items: rows,
      total: countResult[0].total
    })
  } catch (error) {
    next(error)
  } finally {
    connection.release()
  }
})

// 2. 然后是其他路由
app.get('/api/cars', async (req, res) => {
  try {
    const { page = 1, pageSize = 12, category } = req.query
    const offset = (page - 1) * pageSize

    let query = `
      SELECT DISTINCT c.*, b.name as brand 
      FROM cars c 
      JOIN brands b ON c.brand_id = b.id 
      ${category && category !== 'all' ? `
      JOIN car_categories cc ON c.id = cc.car_id
      JOIN categories cat ON cc.category_id = cat.id
      ` : ''}
      WHERE c.status = 'available'
    `
    const params = []

    if (category && category !== 'all') {
      query += ' AND cat.name = ?'
      params.push(category)
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)

    const [rows] = await pool.query(query, params)
    
    // 获取每辆车的分类
    for (let car of rows) {
      const [categories] = await pool.query(`
        SELECT cat.name 
        FROM car_categories cc
        JOIN categories cat ON cc.category_id = cat.id
        WHERE cc.car_id = ?
      `, [car.id])
      car.categories = categories.map(c => c.name).join(',')
    }

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM cars WHERE status = "available"')

    res.json({
      items: rows,
      total: countResult[0].total
    })
  } catch (error) {
    console.error('获取汽车列表失败:', error)
    res.status(500).json({ message: '获取汽车列表失败' })
  }
})

app.get('/api/cars/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, b.name as brand 
      FROM cars c 
      JOIN brands b ON c.brand_id = b.id 
      WHERE c.id = ?
    `, [req.params.id])

    if (rows.length === 0) {
      return res.status(404).json({ message: '未找到该商品' })
    }

    res.json(rows[0])
  } catch (error) {
    console.error('获取汽车详情失败:', error)
    res.status(500).json({ message: '获取商品信失败' })
  }
})

// 获取购物数量
app.get('/api/cart/count', auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM cart_items WHERE user_id = ?',
      [req.user.userId]
    )
    res.json({ count: result[0].count })
  } catch (error) {
    console.error('获取购物车数量失败:', error)
    res.status(500).json({ message: '获取购物车数量失败' })
  }
})

// 获取购物车列表
app.get('/api/cart', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        c.*,
        b.name as brand
      FROM cart_items ci
      JOIN cars c ON ci.car_id = c.id
      JOIN brands b ON c.brand_id = b.id
      WHERE ci.user_id = ?
    `, [req.user.userId])
    res.json(rows)
  } catch (error) {
    console.error('获取购物车失败:', error)
    res.status(500).json({ message: '获取购物车失败' })
  }
})

// 添加到购物车
app.post('/api/cart', auth, async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const { carId, quantity } = req.body
    const userId = req.user.userId

    // 开始事务
    await connection.beginTransaction()

    // 检查商品是否存在且有库存
    const [cars] = await connection.query(
      'SELECT id, stock FROM cars WHERE id = ? AND status = "available"',
      [carId]
    )

    if (cars.length === 0) {
      await connection.rollback()
      return res.status(404).json({ message: '商品不存在或已下架' })
    }

    const car = cars[0]
    if (car.stock < quantity) {
      await connection.rollback()
      return res.status(400).json({ message: '商品库存不足' })
    }

    // 检查购物车是否已有该商品
    const [existingItems] = await connection.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND car_id = ?',
      [userId, carId]
    )

    if (existingItems.length > 0) {
      // 更新数量
      const newQuantity = existingItems[0].quantity + quantity
      await connection.query(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [newQuantity, existingItems[0].id]
      )
    } else {
      // 新增购物车项
      await connection.query(
        'INSERT INTO cart_items (user_id, car_id, quantity) VALUES (?, ?, ?)',
        [userId, carId, quantity]
      )
    }

    // 提交事务
    await connection.commit()
    
    // 返回更新后的购物车数量
    const [cartCount] = await connection.query(
      'SELECT COUNT(*) as count FROM cart_items WHERE user_id = ?',
      [userId]
    )

    res.json({ 
      message: '已加入购物车',
      cartCount: cartCount[0].count
    })

  } catch (error) {
    await connection.rollback()
    console.error('加入购物车失败:', error)
    res.status(500).json({ message: '加入购物车失败' })
  } finally {
    connection.release()
  }
})

// 更新购物车数量
app.put('/api/cart/:id', auth, async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const { quantity } = req.body
    const cartItemId = req.params.id
    const userId = req.user.userId

    // 开始事务
    await connection.beginTransaction()

    // 检查购物车项是否存在且属于当前用户
    const [cartItems] = await connection.query(
      'SELECT ci.*, c.stock FROM cart_items ci JOIN cars c ON ci.car_id = c.id WHERE ci.id = ? AND ci.user_id = ?',
      [cartItemId, userId]
    )

    if (cartItems.length === 0) {
      await connection.rollback()
      return res.status(404).json({ message: '购物车项不存在' })
    }

    const cartItem = cartItems[0]
    if (cartItem.stock < quantity) {
      await connection.rollback()
      return res.status(400).json({ message: '商品库存不足' })
    }

    // 更新数量
    await connection.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [quantity, cartItemId]
    )

    // 提交事务
    await connection.commit()
    res.json({ message: '更新成功' })

  } catch (error) {
    await connection.rollback()
    console.error('更新购物车失败:', error)
    res.status(500).json({ message: '更新购物车失败' })
  } finally {
    connection.release()
  }
})

// 删除购物车项
app.delete('/api/cart/:id', auth, async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const cartItemId = req.params.id
    const userId = req.user.userId

    // 开始事务
    await connection.beginTransaction()

    //    查购物车项是否存在且属于当前用户
    const [items] = await connection.query(
      'SELECT id FROM cart_items WHERE id = ? AND user_id = ?',
      [cartItemId, userId]
    )

    if (items.length === 0) {
      await connection.rollback()
      return res.status(404).json({ message: '购物车项不存在' })
    }

    // 删除购物车项
    await connection.query(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [cartItemId, userId]
    )

    // 提交事务
    await connection.commit()

    // 返回更新后的购物车数量
    const [cartCount] = await connection.query(
      'SELECT COUNT(*) as count FROM cart_items WHERE user_id = ?',
      [userId]
    )

    res.json({ 
      message: '删除成功',
      cartCount: cartCount[0].count
    })

  } catch (error) {
    await connection.rollback()
    console.error('删除购物车项失败:', error)
    res.status(500).json({ message: '删除失败' })
  } finally {
    connection.release()
  }
})

// 获取品牌列表
app.get('/api/brands', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM brands 
      WHERE 1=1 
      ORDER BY name
    `)
    console.log('获取品牌列表成功:', rows.length)
    res.json(rows)
  } catch (error) {
    console.error('获取   牌列表失败:', error)
    next(error)
  }
})

// 按品牌筛选汽车
app.get('/api/cars/brand/:brandName', async (req, res) => {
  try {
    const { page = 1, pageSize = 12 } = req.query
    const offset = (page - 1) * pageSize
    const brandName = req.params.brandName

    const [rows] = await pool.query(`
      SELECT c.*, b.name as brand 
      FROM cars c 
      JOIN brands b ON c.brand_id = b.id 
      WHERE b.name = ? AND c.status = 'available'
      ORDER BY c.created_at DESC 
      LIMIT ? OFFSET ?
    `, [brandName, Number(pageSize), offset])

    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM cars c 
      JOIN brands b ON c.brand_id = b.id 
      WHERE b.name = ? AND c.status = 'available'
    `, [brandName])

    res.json({
      items: rows,
      total: countResult[0].total
    })
  } catch (error) {
    console.error('获取品牌汽车列表失败:', error)
    res.status(500).json({ message: '获取品牌汽车列表失败' })
  }
})

// 添加路由
app.use('/api/favorites', favoritesRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/user/cart', cartRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/videos', videosRouter);
app.use('/api/video', videoInteractionsRouter);

// 添加客服聊天路由
app.use('/api/customer-service', require('./routes/customer-service'));

// 添加静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  }
}));

// 添加静态文件服务
app.use('/images', express.static(path.join(__dirname, '../public/images'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  }
}));

// 添加默认图片目录
app.use('/images/defaults', express.static(path.join(__dirname, '../public/images/defaults')));

// 添加视频和图片目录的静态服务
app.use('/videos', express.static(path.join(__dirname, '../public/videos')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// 确保目录存在
function ensureUploadDirs() {
  const dirs = [
    path.join(__dirname, '../public/videos'),
    path.join(__dirname, '../public/images/video-covers'),
    path.join(__dirname, '../public/images/defaults')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`创建目录: ${dir}`);
    }
  });
}

// 在应用启动时调用
ensureUploadDirs();

// 添加全局缓存控制中间件
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
});

// 修改请求日志中间件，增加更详细的信息
app.use((req, res, next) => {
  console.log('收到请求:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.method === 'POST' ? req.body : undefined,
    query: req.query,
    ip: req.ip,
    originalUrl: req.originalUrl
  });
  
  // 添加响应日志
  const oldWrite = res.write;
  const oldEnd = res.end;

  const chunks = [];

  res.write = function (chunk) {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return oldWrite.apply(res, arguments);
  };

  res.end = function (chunk) {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    
    let body;
    try {
      // 尝试将响应体转换为字符串
      if (chunks.length > 0) {
        const buffer = Buffer.concat(chunks);
        body = buffer.toString('utf8');
        // 尝试解析 JSON
        try {
          body = JSON.parse(body);
        } catch (e) {
          // 如果不是 JSON 则保持原样
        }
      }
    } catch (error) {
      body = '<无法读取响应体>';
    }

    console.log('响应信息:', {
      statusCode: res.statusCode,
      headers: res.getHeaders(),
      body: body
    });
    
    oldEnd.apply(res, arguments);
  };

  next();
});

// 修改服务器启动函数
async function startServer() {
  await testDatabaseConnection()
  
  const PORT = 3000
  http.listen(PORT, () => {
    console.log(`HTTP 服务器运行在端口 ${PORT}`)
  })
}

startServer().catch(console.error) 

// 添加品牌
app.post('/api/admin/brands', auth, adminAuth, async (req, res) => {
  try {
    const { name, logo, description } = req.body;

    // 检查品牌是否已存在
    const [existingBrand] = await pool.query(
      'SELECT * FROM brands WHERE name = ?',
      [name]
    );

    if (existingBrand.length > 0) {
      return res.status(400).json({ message: '该品牌已存在' });
    }

    // 插入新品牌
    const [result] = await pool.query(
      'INSERT INTO brands (name, logo, description) VALUES (?, ?, ?)',
      [name, logo || null, description || null]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      logo,
      description
    });
  } catch (error) {
    console.error('添加品牌失败:', error);
    res.status(500).json({ message: '添加品牌失败' });
  }
}); 

// 管理员获取车辆列表
app.get('/api/admin/cars', auth, adminAuth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    // 获取车辆列表
    const [cars] = await connection.query(`
      SELECT c.*, b.name as brand 
      FROM cars c 
      LEFT JOIN brands b ON c.brand_id = b.id
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [Number(pageSize), offset]);

    // 获取每辆车的分类
    for (let car of cars) {
      const [categories] = await connection.query(`
        SELECT cat.name 
        FROM car_categories cc
        JOIN categories cat ON cc.category_id = cat.id
        WHERE cc.car_id = ?
      `, [car.id]);
      car.categories = categories.map(c => c.name).join(',');
    }

    // 获取总数
    const [countResult] = await connection.query('SELECT COUNT(*) as total FROM cars');

    res.json({
      items: cars,
      total: countResult[0].total
    });
  } catch (error) {
    console.error('获取车辆列表失败:', error);
    res.status(500).json({ message: '获取车辆列表失败' });
  } finally {
    connection.release();
  }
}); 
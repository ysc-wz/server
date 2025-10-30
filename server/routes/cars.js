// 获取车辆列表（前台展示用）
router.get('/', async (req, res) => {
  try {
    console.log('正在获取车辆列表...');
    
    const [cars] = await pool.query(
      `SELECT c.*, b.name as brand 
       FROM cars c 
       LEFT JOIN brands b ON c.brand_id = b.id 
       WHERE c.status = 'available' AND c.stock > 0  /* 只显示有货且库存大于0的商品 */
       ORDER BY c.created_at DESC`
    );

    console.log('查询到的车辆数量:', cars.length);
    console.log('车辆状态统计:', cars.reduce((acc, car) => {
      acc[car.status] = (acc[car.status] || 0) + 1;
      return acc;
    }, {}));

    res.json(cars);
  } catch (error) {
    console.error('获取车辆列表失败:', error);
    res.status(500).json({ message: '获取车辆列表失败' });
  }
}); 

// 在获取车辆列表的路由中
router.get('/admin/cars', auth, adminAuth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // 首先更新所有库存为0的车辆状态为已下架
    await connection.query(
      `UPDATE cars SET status = 'discontinued' WHERE stock = 0`
    );

    // 然后获取车辆列表
    const [cars] = await connection.query(
      `SELECT c.*, b.name as brand 
       FROM cars c 
       LEFT JOIN brands b ON c.brand_id = b.id`
    );

    res.json({
      items: cars,
      total: cars.length
    });

  } catch (error) {
    console.error('获取车辆列表失败:', error);
    res.status(500).json({ message: '获取车辆列表失败' });
  } finally {
    connection.release();
  }
});

// 修改更新车辆信息的路由
router.put('/admin/cars/:id', auth, adminAuth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const carData = { ...req.body };
    
    // 如果库存为0，强制设置状态为已下架
    if (Number(carData.stock) === 0) {
      carData.status = 'discontinued';
    }

    await connection.query(
      'UPDATE cars SET ? WHERE id = ?',
      [carData, id]
    );

    // 获取更新后的车辆信息
    const [updatedCar] = await connection.query(
      'SELECT * FROM cars WHERE id = ?',
      [id]
    );

    res.json({
      message: '更新成功',
      status: updatedCar[0].status
    });

  } catch (error) {
    console.error('更新车辆信息失败:', error);
    res.status(500).json({ message: '更新车辆信息失败' });
  } finally {
    connection.release();
  }
});

// 修改车辆状态的路由
router.put('/admin/cars/:id/status', auth, adminAuth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 检查车辆信息
    const [cars] = await connection.query(
      'SELECT stock FROM cars WHERE id = ?',
      [id]
    );

    if (!cars.length) {
      return res.status(404).json({ message: '车辆不存在' });
    }

    // 如果库存为0，强制保持下架状态
    if (cars[0].stock === 0) {
      return res.status(400).json({ 
        message: '库存为0，无法上架商品',
        status: 'discontinued'
      });
    }

    await connection.query(
      'UPDATE cars SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({
      message: '状态更新成功',
      status: status
    });

  } catch (error) {
    console.error('更新状态失败:', error);
    res.status(500).json({ message: '更新状态失败' });
  } finally {
    connection.release();
  }
});

// 添加补货路由
router.put('/admin/cars/:id/restock', auth, adminAuth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { stock } = req.body;

    // 验证补货数量
    if (!Number.isInteger(Number(stock)) || Number(stock) <= 0) {
      return res.status(400).json({ message: '补货数量必须是大于0的整数' });
    }

    // 获取当前库存
    const [cars] = await connection.query(
      'SELECT stock FROM cars WHERE id = ?',
      [id]
    );

    if (!cars.length) {
      return res.status(404).json({ message: '车辆不存在' });
    }

    // 更新库存
    const newStock = cars[0].stock + Number(stock);
    await connection.query(
      'UPDATE cars SET stock = ?, status = ? WHERE id = ?',
      [newStock, 'available', id]
    );

    res.json({
      message: '补货成功',
      stock: newStock,
      status: 'available'
    });

  } catch (error) {
    console.error('补货失败:', error);
    res.status(500).json({ message: '补货失败' });
  } finally {
    connection.release();
  }
});
const mysql = require('mysql2/promise');
const dbConfig = require('./config/db.config');

let pool;

try {
  pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });
} catch (error) {
  console.error('创建数据库连接池失败:', error);
  process.exit(1);
}

// 添加连接错误处理
pool.on('error', (err) => {
  console.error('数据库连接池错误:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('数据库连接丢失');
  }
});

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    throw error;
  }
}

// 导出前先测试连接
testConnection().catch(console.error);

module.exports = pool; 
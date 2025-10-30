const mysql = require('mysql2/promise')

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'car_mall',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

// 或者使用连接URL
const connectionURL = 'mysql://root:123456@localhost:3306/car_mall'

module.exports = {
  dbConfig,
  connectionURL
} 
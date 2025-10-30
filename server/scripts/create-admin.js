const bcrypt = require('bcryptjs')
const mysql = require('mysql2/promise')
const dbConfig = require('../config/db.config')

async function createAdmin() {
  const pool = mysql.createPool(dbConfig)
  
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    await pool.query(`
      INSERT INTO users (username, password, email, role) 
      VALUES (?, ?, ?, 'admin')
      ON DUPLICATE KEY UPDATE 
      password = VALUES(password)
    `, ['admin', hashedPassword, 'admin@example.com'])
    
    console.log('管理员账户创建成功')
  } catch (error) {
    console.error('创建管理员账户失败:', error)
  } finally {
    await pool.end()
  }
}

createAdmin() 
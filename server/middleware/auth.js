const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('认证头:', authHeader);

    if (!authHeader) {
      return res.status(401).json({ message: '未提供认证token' });
    }

    const token = authHeader.split(' ')[1];
    console.log('提取的token:', token);

    if (!token) {
      return res.status(401).json({ message: '无效的token格式' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('解码的token:', decoded);

    req.user = { userId: decoded.userId };
    console.log('设置的用户ID:', req.user.userId);

    next();
  } catch (error) {
    console.error('认证失败:', error);
    res.status(401).json({ message: '认证失败', error: error.message });
  }
}; 
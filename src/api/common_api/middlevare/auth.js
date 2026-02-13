const jwt = require('jsonwebtoken');
const { getPool } = require('../db/connection');

const authMiddleware = async (req, res, next) => {
  // Берём токен из cookie (для Electron) или из заголовка Authorization (для mobile)
  let token = req.cookies.token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const pool = await getPool();
    const [rows] = await pool.query(
      'SELECT id_employees, role, is_active FROM employees WHERE id_employees = ?',
      [decoded.userId]
    );

    if (rows.length === 0 || rows[0].is_active === 0) {
      return res.status(401).json({ error: 'Пользователь не найден или заблокирован' });
    }

    req.user = rows[0]; // сохраняем данные пользователя для дальнейших роутов
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};

module.exports = authMiddleware;
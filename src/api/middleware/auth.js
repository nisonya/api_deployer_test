const jwt = require('jsonwebtoken');
const { getPool } = require('../../db/connection');
const { getAccessSecret } = require('../jwtSecrets');


const authMiddleware = async (req, res, next) => {
  const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Токен отсутствует' });
  }

  try {
    const secret = getAccessSecret();
    if (!secret) {
      return res.status(500).json({ error: 'JWT не настроен (задайте JWT_ACCESS_SECRET/JWT_REFRESH_SECRET в env или перезапустите API)' });
    }
    const decoded = jwt.verify(token, secret);

    const pool = await getPool();
    const [rows] = await pool.query(
      'SELECT id, access_level_id FROM profile WHERE id = ?',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Пользователь не найден' });
    }

    const user = rows[0];

    req.user = {
      id: user.id,
      accessLevel: user.access_level_id
    };
    next();
  } catch (err) {
    console.error('Ошибка проверки токена:', err.message);
    return res.status(401).json({ success: false, error: 'Недействительный или просроченный токен' });
  }
};

module.exports = authMiddleware;
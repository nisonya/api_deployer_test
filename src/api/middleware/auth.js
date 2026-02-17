const jwt = require('jsonwebtoken');
const { getPool } = require('../../db/connection');


const authMiddleware = async (req, res, next) => {
  // 1. Получаем токен из cookie (Electron) или из заголовка Authorization: Bearer ...
  const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен отсутствует' });
  }

  try {
    // 2. Проверяем токен (jwt.verify)
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // 3. Ищем пользователя в таблице profile по id из токена
    const pool = await getPool();
    const [rows] = await pool.query(
      'SELECT id, access_level_id FROM profile WHERE id = ?',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    const user = rows[0];

    // 4. Добавляем данные пользователя в req — они будут доступны в контроллерах/роутах
    req.user = {
      id: user.id,
      accessLevel: user.access_level_id
    };

    // 5. Всё ок — пропускаем запрос дальше
    next();
  } catch (err) {
    console.error('Ошибка проверки токена:', err.message);
    return res.status(401).json({ error: 'Недействительный или просроченный токен' });
  }
};

module.exports = authMiddleware;
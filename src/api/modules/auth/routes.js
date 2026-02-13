const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getPool } = require('../../db/connection');

router.post('/login', async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: 'Введите логин и пароль' });
  }

  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      'SELECT id_employees, password_hash, role, is_active FROM employees WHERE login = ?',
      [login]
    );

    if (rows.length === 0 || rows[0].is_active === 0) {
      return res.status(401).json({ error: 'Неверный логин или пользователь заблокирован' });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }

    // Access token — короткий, 1 час
    const accessToken = jwt.sign(
      { userId: user.id_employees, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    // Refresh token — длинный, 7 дней
    const refreshToken = jwt.sign(
      { userId: user.id_employees },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );

    // Сохраняем refresh в БД
    await pool.query(
      'INSERT INTO refresh_tokens (employee_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
      [user.id_employees, refreshToken]
    );

    // Для Electron — устанавливаем HttpOnly cookie
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: true, // только HTTPS
      sameSite: 'strict',
      maxAge: 3600 * 1000 // 1 час
    });

    // Возвращаем оба токена (для мобильного клиента)
    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id_employees,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Ошибка логина:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token обязателен' });
  }

  try {
    // Проверяем подпись refresh-токена
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const pool = await getPool();

    // Проверяем, существует ли токен в БД и не отозван ли
    const [tokenRows] = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW() AND revoked_at IS NULL',
      [refreshToken]
    );

    if (tokenRows.length === 0) {
      return res.status(401).json({ error: 'Недействительный или истёкший refresh token' });
    }

    // Проверяем, что пользователь активен
    const [userRows] = await pool.query(
      'SELECT id_employees, role, is_active FROM employees WHERE id_employees = ?',
      [decoded.userId]
    );

    if (userRows.length === 0 || userRows[0].is_active === 0) {
      return res.status(401).json({ error: 'Пользователь не найден или заблокирован' });
    }

    const user = userRows[0];

    // Генерируем новый access token
    const newAccessToken = jwt.sign(
      { userId: user.id_employees, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    // Можно выдать новый refresh (ротация), но для простоты оставляем старый

    res.cookie('token', newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600 * 1000
    });

    res.json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: 'Недействительный refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    const pool = await getPool();
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = ?',
      [refreshToken]
    );
  }

  res.clearCookie('token');
  res.json({ success: true, message: 'Выход выполнен' });
});

module.exports = router;
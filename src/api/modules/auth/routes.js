const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getPool } = require('../../../db/connection');

router.post('/login', async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: 'Введите логин и пароль' });
  }

  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      'SELECT id, password_hash, access_level_id FROM profile WHERE login = ?',
      [login]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        accessLevel: user.access_level_id 
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );


await pool.query(
  'INSERT INTO refresh_tokens (profile_id, token, expires_at, device_info, ip_address) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), ?, ?)',
  [user.id, refreshToken, req.headers['user-agent'] || 'unknown', req.ip || 'unknown']
);
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600 * 1000
    });

    res.json({
      success: true,
      accessToken,
      refreshToken, 
      user: { 
        id: user.id, 
        accessLevel: user.access_level_id 
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
    return res.status(401).json({ error: 'Требуется refresh-токен' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const pool = await getPool();
    const [rows] = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW() AND revoked_at IS NULL',
      [refreshToken]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Недействительный или просроченный refresh-токен' });
    }

    const profileId = rows[0].profile_id;

    const [userRows] = await pool.query(
      'SELECT id, access_level_id FROM profile WHERE id = ?',
      [profileId]
    );

    if (userRows.length === 0) {
      return res.status(401).json({ error: 'Профиль не найден' });
    }

    const user = userRows[0];

    const newAccessToken = jwt.sign(
      { 
        userId: user.id, 
        accessLevel: user.access_level_id 
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600 * 1000
    });

    res.json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    console.error('Ошибка рефреша:', err);
    res.status(401).json({ error: 'Недействительный refresh-токен' });
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

  res.clearCookie('access_token');
  res.json({ success: true });
});

module.exports = router;
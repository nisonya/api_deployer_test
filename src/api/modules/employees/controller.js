const { getPool } = require('../../db/connection');

exports.getAllEmployees = async (req, res) => {
  let conn;
  try {
    conn = await getPool().getConnection();

    const [rows] = await conn.query(
      'SELECT id_employees, first_name, second_name, position FROM employees WHERE is_active = 1'
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Ошибка получения сотрудников:', err);
    res.status(500).json({
      success: false,
      error: 'Не удалось получить список сотрудников. Попробуйте позже.'
    });
  } finally {
    if (conn) conn.release();
  }
};
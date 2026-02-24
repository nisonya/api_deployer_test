const { getPool } = require('../../../db/connection');

exports.getAllEmployees = async (req, res) => {
  let conn;
  try {
    const pool = await getPool();
    conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT e.id_employees, e.first_name, e.second_name, e.patronymic, e.position, p.name AS position_name
       FROM employees e
       LEFT JOIN position p ON e.position = p.id
       WHERE e.is_active = 1`
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

exports.getById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ success: false, error: 'Некорректный id сотрудника.' });
  }
  let conn;
  try {
    const pool = await getPool();
    conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT e.id_employees, e.first_name, e.second_name, e.patronymic,
              DATE_FORMAT(e.date_of_birth, '%Y-%m-%d') AS date_of_birth,
              e.position, p.name AS position_name, e.contact, e.size, e.education,
              e.schedule, e.gender, e.KPI, e.is_active
       FROM employees e
       LEFT JOIN position p ON e.position = p.id
       WHERE e.id_employees = ?`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Сотрудник не найден.' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Ошибка получения сотрудника:', err);
    res.status(500).json({
      success: false,
      error: 'Не удалось получить данные сотрудника.'
    });
  } finally {
    if (conn) conn.release();
  }
};

exports.getSchedule = async (req, res) => {
  let conn;
  try {
    const pool = await getPool();
    conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT es.idEmployees AS id_employees, es.idSchedule AS id_schedule, es.room AS room_id,
              CONCAT(e.second_name, ' ', e.first_name) AS employee_name,
              w.name AS day_name, s.startTime, s.endTime, r.name AS room_name
       FROM employees_schedule es
       INNER JOIN employees e ON es.idEmployees = e.id_employees AND e.is_active = 1
       INNER JOIN schedule s ON es.idSchedule = s.idlesson
       LEFT JOIN room r ON es.room = r.id
       LEFT JOIN weekday w ON s.day = w.idDay
       ORDER BY es.idEmployees, s.day, s.startTime`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Ошибка получения расписания:', err);
    res.status(500).json({
      success: false,
      error: 'Не удалось получить расписание сотрудников.'
    });
  } finally {
    if (conn) conn.release();
  }
};

/** POST body: { event_id, employee_id } — назначить сотрудника на мероприятие (event_plan_participation) */
exports.assignToEvent = async (req, res) => {
  const { event_id, employee_id } = req.body;
  if (!event_id || !employee_id) {
    return res.status(400).json({
      success: false,
      message: 'event_id и employee_id обязательны'
    });
  }
  const eid = parseInt(employee_id, 10);
  const evId = parseInt(event_id, 10);
  if (Number.isNaN(eid) || Number.isNaN(evId) || eid <= 0 || evId <= 0) {
    return res.status(400).json({ success: false, message: 'event_id и employee_id должны быть положительными числами.' });
  }
  let conn;
  try {
    const pool = await getPool();
    conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO responsible_for_part_events (id_event, id_employee, mark_of_sending_an_application)
       VALUES (?, ?, 0)`,
      [evId, eid]
    );
    res.status(201).json({ success: true, message: 'Сотрудник назначен на мероприятие.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'Сотрудник уже назначен на это мероприятие.' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({ success: false, error: 'Указанное мероприятие или сотрудник не найдены.' });
    }
    console.error('Ошибка назначения на мероприятие:', err);
    res.status(500).json({
      success: false,
      error: 'Не удалось назначить сотрудника на мероприятие.'
    });
  } finally {
    if (conn) conn.release();
  }
};
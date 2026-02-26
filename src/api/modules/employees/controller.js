const { withConnection } = require('../../helpers/db');
const { parsePositiveId, requireBodyKeys } = require('../../helpers/validation');

// Функции ниже принимают conn — это подключение к БД. Его не передаём мы:
// мы передаём саму функцию в withConnection, а withConnection внутри вызывает её как fn(conn).
// Подробнее: files/HELPERS_EXPLAINED.md

async function fetchAllEmployees(conn) {
  const [rows] = await conn.query(
    `SELECT e.id_employees, e.first_name, e.second_name, e.patronymic, e.position, p.name AS position_name
     FROM employees e
     LEFT JOIN position p ON e.position = p.id
     WHERE e.is_active = 1`
  );
  return rows;
}

/** get_all_employees: position != 10 (legacy) */
async function fetchAllEmployeesLegacy(conn) {
  const [rows] = await conn.query(
    `SELECT e.id_employees, e.first_name, e.second_name, e.patronymic,
      DATE_FORMAT(e.date_of_birth, '%Y-%m-%d') AS date_of_birth, p.name AS position,
      e.contact, e.size, e.education, e.schedule, e.gender
     FROM employees e
     INNER JOIN position p ON e.position = p.id
     WHERE e.position != 10`
  );
  return rows;
}

async function fetchKpi(conn, id) {
  const [rows] = await conn.query('SELECT KPI FROM employees WHERE id_employees = ?', [id]);
  return rows[0]?.KPI ?? null;
}

/** get_employee_by_letter: search by first_name or second_name. Empty letter → all (same shape). */
async function fetchEmployeesByLetter(conn, letter) {
  if (!letter || !String(letter).trim()) {
    const [rows] = await conn.query(
      `SELECT id_employees, CONCAT(first_name, ' ', second_name) AS name
       FROM employees WHERE position != 10`
    );
    return rows;
  }
  const [rows] = await conn.query(
    `SELECT id_employees, CONCAT(first_name, ' ', second_name) AS name
     FROM employees
     WHERE first_name LIKE CONCAT('%', ?, '%') OR second_name LIKE CONCAT('%', ?, '%')`,
    [letter, letter]
  );
  return rows;
}

/** get_employee: short list id, name (position != 10) */
async function fetchEmployeeShortList(conn) {
  const [rows] = await conn.query(
    `SELECT id_employees AS id, CONCAT(first_name, ' ', second_name) AS name
     FROM employees WHERE position != 10`
  );
  return rows;
}

/** sizes: id, name, gender, size from employees */
async function fetchSizes(conn) {
  const [rows] = await conn.query(
    'SELECT id_employees AS id, CONCAT(second_name, " ", first_name) AS name, gender, size FROM employees'
  );
  return rows;
}

async function fetchEmployeeById(conn, id) {
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
  return rows[0] || null;
}

async function fetchSchedule(conn) {
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
  return rows;
}

async function insertAssignToEvent(conn, eventId, employeeId) {
  await conn.query(
    `INSERT INTO responsible_for_part_events (id_event, id_employee, mark_of_sending_an_application)
     VALUES (?, ?, 0)`,
    [eventId, employeeId]
  );
}

async function updateKpi(conn, id, kpi) {
  const [r] = await conn.query('UPDATE employees SET KPI = ? WHERE id_employees = ?', [kpi, id]);
  return r.affectedRows;
}

async function updateContact(conn, id, contact) {
  const [r] = await conn.query('UPDATE employees SET contact = ? WHERE id_employees = ?', [contact, id]);
  return r.affectedRows;
}

async function updateSize(conn, id, size) {
  const [r] = await conn.query('UPDATE employees SET size = ? WHERE id_employees = ?', [size, id]);
  return r.affectedRows;
}

/** add_employee: insert employees + profile */
async function insertEmployee(conn, data) {
  const [ins] = await conn.query(
    `INSERT INTO employees (first_name, second_name, patronymic, date_of_birth, position, contact, size, education, schedule, gender, KPI)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.first_name, data.second_name, data.patronymic, data.date_of_birth, data.position, data.contact || null, data.size || null, data.education || null, data.schedule || null, data.gender || null, data.KPI || null]
  );
  const employeeId = ins.insertId;
  await conn.query(
    'INSERT INTO profile (employee_id, login, password, access_level_id) VALUES (?, ?, ?, ?)',
    [employeeId, data.login, data.password, data.access_level_id]
  );
  return employeeId;
}


function sendError(res, status, error) {
  res.status(status).json({ success: false, error });
}

function sendSuccess(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

exports.getAllEmployees = async (req, res) => {
  try {
    const rows = await withConnection(fetchAllEmployees);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('Ошибка получения сотрудников:', err);
    sendError(res, 500, 'Не удалось получить список сотрудников. Попробуйте позже.');
  }
};

/** GET /api/employees/all — список как get_all_employees (position != 10) */
exports.getAllEmployeesLegacy = async (req, res) => {
  try {
    const rows = await withConnection(fetchAllEmployeesLegacy);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getAllEmployeesLegacy:', err);
    sendError(res, 500, 'Не удалось получить список сотрудников.');
  }
};

/** GET /api/employees/kpi/:id */
exports.getKpi = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  try {
    const kpi = await withConnection((conn) => fetchKpi(conn, id));
    sendSuccess(res, { KPI: kpi });
  } catch (err) {
    console.error('getKpi:', err);
    sendError(res, 500, 'Не удалось получить KPI.');
  }
};

/** GET /api/employees/search/:letter */
exports.searchByLetter = async (req, res) => {
  const letter = req.params.letter;
  try {
    const rows = await withConnection((conn) => fetchEmployeesByLetter(conn, letter ?? ''));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('searchByLetter:', err);
    sendError(res, 500, 'Не удалось выполнить поиск.');
  }
};

/** GET /api/employees/short-list — id, name (position != 10) */
exports.getShortList = async (req, res) => {
  try {
    const rows = await withConnection(fetchEmployeeShortList);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getShortList:', err);
    sendError(res, 500, 'Не удалось получить список.');
  }
};

/** GET /api/employees/sizes */
exports.getSizes = async (req, res) => {
  try {
    const rows = await withConnection(fetchSizes);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getSizes:', err);
    sendError(res, 500, 'Не удалось получить размеры.');
  }
};

/** PUT body: { id, KPI } */
exports.setKpi = async (req, res) => {
  const id = parsePositiveId(req.body?.id);
  if (id == null) return sendError(res, 400, 'Нужен id.');
  const KPI = req.body?.KPI != null ? String(req.body.KPI) : '';
  try {
    const affected = await withConnection((conn) => updateKpi(conn, id, KPI));
    if (affected === 0) return sendError(res, 404, 'Сотрудник не найден.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('setKpi:', err);
    sendError(res, 500, 'Не удалось обновить KPI.');
  }
};

/** PUT body: { id, contact } */
exports.updateContact = async (req, res) => {
  const id = parsePositiveId(req.body?.id);
  if (id == null) return sendError(res, 400, 'Нужен id.');
  const contact = req.body?.contact != null ? String(req.body.contact) : null;
  try {
    const affected = await withConnection((conn) => updateContact(conn, id, contact));
    if (affected === 0) return sendError(res, 404, 'Сотрудник не найден.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('updateContact:', err);
    sendError(res, 500, 'Не удалось обновить контакт.');
  }
};

/** PUT body: { id, size } */
exports.updateSize = async (req, res) => {
  const id = parsePositiveId(req.body?.id);
  if (id == null) return sendError(res, 400, 'Нужен id.');
  const size = req.body?.size != null ? String(req.body.size) : null;
  try {
    const affected = await withConnection((conn) => updateSize(conn, id, size));
    if (affected === 0) return sendError(res, 404, 'Сотрудник не найден.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('updateSize:', err);
    sendError(res, 500, 'Не удалось обновить размер.');
  }
};

/** POST body: first_name, second_name, patronymic, date_of_birth, position, contact?, size?, education?, schedule?, gender?, KPI?, login, password, access_level_id */
exports.addEmployee = async (req, res) => {
  const keys = ['first_name', 'second_name', 'patronymic', 'date_of_birth', 'position', 'login', 'password', 'access_level_id'];
  const check = requireBodyKeys(req.body, keys);
  if (!check.valid) return sendError(res, 400, check.message);
  const pos = parsePositiveId(req.body.position);
  const accessId = parsePositiveId(req.body.access_level_id);
  if (pos == null || accessId == null) return sendError(res, 400, 'position и access_level_id должны быть положительными числами.');
  try {
    const id = await withConnection((conn) => insertEmployee(conn, req.body));
    sendSuccess(res, { id }, 201);
  } catch (err) {
    console.error('addEmployee:', err);
    sendError(res, 500, 'Не удалось добавить сотрудника.');
  }
};

exports.getById = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) {
    return res.status(400).json({ success: false, error: 'Некорректный id сотрудника.' });
  }
  try {
    const row = await withConnection((conn) => fetchEmployeeById(conn, id));
    if (!row) {
      return res.status(404).json({ success: false, error: 'Сотрудник не найден.' });
    }
    sendSuccess(res, row);
  } catch (err) {
    console.error('Ошибка получения сотрудника:', err);
    sendError(res, 500, 'Не удалось получить данные сотрудника.');
  }
};

exports.getSchedule = async (req, res) => {
  try {
    const rows = await withConnection(fetchSchedule);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('Ошибка получения расписания:', err);
    sendError(res, 500, 'Не удалось получить расписание сотрудников.');
  }
};

/** POST body: { event_id, employee_id } — назначить сотрудника на мероприятие */
exports.assignToEvent = async (req, res) => {
  const bodyCheck = requireBodyKeys(req.body, ['event_id', 'employee_id']);
  if (!bodyCheck.valid) {
    return res.status(400).json({ success: false, message: bodyCheck.message });
  }
  const eventId = parsePositiveId(req.body.event_id);
  const employeeId = parsePositiveId(req.body.employee_id);
  if (eventId == null || employeeId == null) {
    return res.status(400).json({
      success: false,
      message: 'event_id и employee_id должны быть положительными числами.'
    });
  }
  try {
    await withConnection((conn) => insertAssignToEvent(conn, eventId, employeeId));
    res.status(201).json({ success: true, message: 'Сотрудник назначен на мероприятие.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'Сотрудник уже назначен на это мероприятие.' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({ success: false, error: 'Указанное мероприятие или сотрудник не найдены.' });
    }
    console.error('Ошибка назначения на мероприятие:', err);
    sendError(res, 500, 'Не удалось назначить сотрудника на мероприятие.');
  }
};

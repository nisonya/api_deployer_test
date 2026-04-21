const { withConnection } = require('../../helpers/db');
const { parsePositiveId, requireBodyKeys, optionalPositiveId, dateOrNull } = require('../../helpers/validation');
const { sendSuccess, sendError } = require('../../helpers/http');
const bcrypt = require('bcryptjs');

// Функции ниже принимают conn — это подключение к БД. Его не передаём мы:
// мы передаём саму функцию в withConnection, а withConnection внутри вызывает её как fn(conn).
// Подробнее: files/HELPERS_EXPLAINED.md

async function fetchAllEmployees(conn) {
  const [rows] = await conn.query(
    `SELECT e.id_employees, e.first_name, e.second_name, e.patronymic, e.position, p.name AS position_name
     FROM employees e
     LEFT JOIN \`position\` p ON e.position = p.id
     WHERE e.is_active = 1`
  );
  return rows;
}

async function fetchAllEmployeesIncludingInactive(conn) {
  const [rows] = await conn.query(
    `SELECT e.id_employees, e.first_name, e.second_name, e.patronymic, e.position,
            p.name AS position_name, e.is_active
     FROM employees e
     LEFT JOIN \`position\` p ON e.position = p.id`
  );
  return rows;
}

/** get_all_employees */
async function fetchAllEmployeesLegacy(conn) {
  const [rows] = await conn.query(
    `SELECT e.id_employees, e.first_name, e.second_name, e.patronymic,
      DATE_FORMAT(e.date_of_birth, '%Y-%m-%d') AS date_of_birth, p.name AS position,
      e.contact, e.size, e.education, e.gender
     FROM employees e
     INNER JOIN \`position\` p ON e.position = p.id
     WHERE e.is_active = 1`
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
       FROM employees WHERE is_active = 1`
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

/** get_employee: short list id, name  */
async function fetchEmployeeShortList(conn) {
  const [rows] = await conn.query(
    `SELECT id_employees AS id, CONCAT(first_name, ' ', second_name) AS name
     FROM employees WHERE is_active = 1`
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
            e.gender, e.KPI, e.is_active
     FROM employees e
     LEFT JOIN \`position\` p ON e.position = p.id
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

const EMPLOYEE_SINGLE_FIELD = new Set(['KPI', 'contact', 'size']);

/** @param { import('mysql2/promise').PoolConnection } conn */
async function updateEmployeeSingleField(conn, id, column, value) {
  if (!EMPLOYEE_SINGLE_FIELD.has(column)) throw new Error(`Invalid column: ${column}`);
  const [r] = await conn.query(`UPDATE employees SET \`${column}\` = ? WHERE id_employees = ?`, [value, id]);
  return r.affectedRows;
}

/** 1 — активен по умолчанию при создании (в БД DEFAULT 0). См. API: опциональное поле is_active. */
function isActiveForInsert(body) {
  if (body == null) return 1;
  const v = body.is_active;
  if (v === undefined || v === null || v === '') return 1;
  if (v === false || v === 0 || v === '0' || v === 'false') return 0;
  return 1;
}

function patronymicOrNull(data) {
  if (data == null || data.patronymic == null) return null;
  const s = String(data.patronymic).trim();
  return s === '' ? null : s;
}

/**
 * В БД колонка gender хранит 1 символ: "м" или "ж".
 * Принимаем разные варианты с фронта: "Мужской/Женский", "male/female", "m/f".
 */
function normalizeGenderOrNull(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === '') return null;
  const low = s.toLowerCase();
  if (low === 'м' || low === 'm' || low === 'male' || low === 'мужской') return 'м';
  if (low === 'ж' || low === 'f' || low === 'female' || low === 'женский') return 'ж';
  return s.length > 1 ? null : low;
}

/** add_employee: insert employees + profile */
async function insertEmployee(conn, data) {
  const active = isActiveForInsert(data);
  const pat = patronymicOrNull(data);
  const gender = normalizeGenderOrNull(data.gender);
  const [ins] = await conn.query(
    `INSERT INTO employees (first_name, second_name, patronymic, date_of_birth, \`position\`, contact, size, education, gender, KPI, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.first_name, data.second_name, pat, data.date_of_birth, data.position, data.contact || null, data.size || null, data.education || null, gender, data.KPI || null, active]
  );
  const employeeId = ins.insertId;
  const hash = await bcrypt.hash(data.password, 12);
  await conn.query(
    'INSERT INTO profile (employee_id, login, password_hash, access_level_id) VALUES (?, ?, ?, ?)',
    [employeeId, data.login, hash, data.access_level_id]
  );
  return employeeId;
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

exports.getAllWithInactive = async (req, res) => {
  try {
    const rows = await withConnection(fetchAllEmployeesIncludingInactive);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getAllWithInactive:', err);
    sendError(res, 500, 'Не удалось получить список сотрудников.');
  }
};

/** GET /api/employees/all — список как get_all_employees */
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

/** GET /api/employees/short-list — id, name  */
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
    const affected = await withConnection((conn) => updateEmployeeSingleField(conn, id, 'KPI', KPI));
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
    const affected = await withConnection((conn) => updateEmployeeSingleField(conn, id, 'contact', contact));
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
    const affected = await withConnection((conn) => updateEmployeeSingleField(conn, id, 'size', size));
    if (affected === 0) return sendError(res, 404, 'Сотрудник не найден.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('updateSize:', err);
    sendError(res, 500, 'Не удалось обновить размер.');
  }
};

/** PUT /api/employees/:id — обновление всех данных сотрудника */
exports.updateEmployee = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const keys = ['first_name', 'second_name', 'date_of_birth'];
  const check = requireBodyKeys(req.body, keys);
  if (!check.valid) return sendError(res, 400, check.message);
  const b = req.body;
  if (!String(b.first_name || '').trim()) return sendError(res, 400, 'Укажите first_name.');
  if (!String(b.second_name || '').trim()) return sendError(res, 400, 'Укажите second_name.');
  const position = optionalPositiveId(b.position);
  if (b.position !== '' && b.position != null && b.position !== undefined && position == null) {
    return sendError(res, 400, 'Некорректный position.');
  }
  const isActive = b.is_active !== undefined ? (b.is_active ? 1 : 0) : undefined;
  const gender = normalizeGenderOrNull(b.gender);
  const sql = `UPDATE employees SET
    first_name = ?, second_name = ?, patronymic = ?,
    date_of_birth = ?, \`position\` = ?, contact = ?,
    size = ?, education = ?,
    gender = ?, KPI = ?${isActive !== undefined ? ', is_active = ?' : ''}
    WHERE id_employees = ?`;
  const params = [
    b.first_name, b.second_name, b.patronymic || null,
    dateOrNull(b.date_of_birth), position, b.contact || null,
    b.size || null, b.education || null,
    gender, b.KPI || null,
  ];
  if (isActive !== undefined) params.push(isActive);
  params.push(id);
  try {
    const [r] = await withConnection((conn) => conn.query(sql, params));
    if (r.affectedRows === 0) return sendError(res, 404, 'Сотрудник не найден.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return sendError(res, 400, 'Указанная должность не найдена.');
    console.error('updateEmployee:', err);
    sendError(res, 500, 'Не удалось обновить сотрудника.');
  }
};

/** POST body: first_name, second_name, date_of_birth, position, login, password, access_level_id; опц.: patronymic, contact, … */
exports.addEmployee = async (req, res) => {
  const keys = ['first_name', 'second_name', 'date_of_birth', 'position', 'login', 'password', 'access_level_id'];
  const check = requireBodyKeys(req.body, keys);
  if (!check.valid) return sendError(res, 400, check.message);
  const pos = parsePositiveId(req.body.position);
  const accessId = parsePositiveId(req.body.access_level_id);
  if (pos == null || accessId == null) return sendError(res, 400, 'position и access_level_id должны быть положительными числами.');
  try {
    const id = await withConnection((conn) => insertEmployee(conn, req.body));
    sendSuccess(res, { id }, 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return sendError(res, 409, 'Логин уже занят. Выберите другой.');
    }
    console.error('addEmployee:', err);
    sendError(res, 500, 'Не удалось добавить сотрудника.');
  }
};

/** DELETE /api/employees/:id */
exports.deleteEmployee = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  try {
    const [r] = await withConnection((conn) =>
      conn.query('DELETE FROM employees WHERE id_employees = ?', [id])
    );
    if (r.affectedRows === 0) return sendError(res, 404, 'Сотрудник не найден.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('deleteEmployee:', err);
    sendError(res, 500, 'Не удалось удалить сотрудника.');
  }
};

exports.getById = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id сотрудника.');
  try {
    const row = await withConnection((conn) => fetchEmployeeById(conn, id));
    if (!row) return sendError(res, 404, 'Сотрудник не найден.');
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
  if (!bodyCheck.valid) return sendError(res, 400, bodyCheck.message);
  const eventId = parsePositiveId(req.body.event_id);
  const employeeId = parsePositiveId(req.body.employee_id);
  if (eventId == null || employeeId == null) {
    return sendError(res, 400, 'event_id и employee_id должны быть положительными числами.');
  }
  try {
    await withConnection((conn) => insertAssignToEvent(conn, eventId, employeeId));
    sendSuccess(res, { message: 'Сотрудник назначен на мероприятие.' }, 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return sendError(res, 409, 'Сотрудник уже назначен на это мероприятие.');
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
      return sendError(res, 400, 'Указанное мероприятие или сотрудник не найдены.');
    }
    console.error('Ошибка назначения на мероприятие:', err);
    sendError(res, 500, 'Не удалось назначить сотрудника на мероприятие.');
  }
};

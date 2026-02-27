const { withConnection } = require('../../helpers/db');
const { parsePositiveId, requireBodyKeys } = require('../../helpers/validation');

const ALLOWED_SORT = ['id', 'name', 'dates_of_event', 'day_of_the_week'];

function buildWhere(filters) {
  const where = [];
  const params = [];
  if (filters?.period && filters.period !== 'all') {
    switch (filters.period) {
      case 'this_month':
        where.push(' eo.dates_of_event >= DATE_FORMAT(NOW(), "%Y-%m-01") AND eo.dates_of_event < DATE_ADD(DATE_FORMAT(NOW(), "%Y-%m-01"), INTERVAL 1 MONTH) ');
        break;
      case 'this_week':
        where.push(' YEARWEEK(eo.dates_of_event) = YEARWEEK(NOW()) ');
        break;
      case 'next_week':
        where.push(' YEARWEEK(eo.dates_of_event) = YEARWEEK(NOW())+1 ');
        break;
      case 'three_months':
        where.push(' eo.dates_of_event >= CURDATE() AND eo.dates_of_event <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH) ');
        break;
      default:
        break;
    }
  }
  if (filters?.search && String(filters.search).trim()) {
    where.push(' eo.name LIKE ? ');
    params.push(`%${String(filters.search).trim()}%`);
  }
  if (filters?.employee_id) {
    where.push(' EXISTS (SELECT 1 FROM responsible_for_org_events ro WHERE ro.id_event = eo.id AND ro.id_employee = ?) ');
    params.push(filters.employee_id);
  }
  return { where: where.length ? ` WHERE ${where.join(' AND ')} ` : '', params };
}

function parseListBody(body) {
  const filters = body?.filters || {};
  const sort = body?.sort && body.sort[0] ? body.sort[0] : {};
  const page = Math.max(1, parseInt(body?.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(body?.limit, 10) || 10));
  const offset = (page - 1) * limit;
  return { filters, sort, page, limit, offset };
}

function sendSuccess(res, data, status = 200) {
  res.status(status).json({ success: true, ...data });
}

function sendError(res, status, error) {
  res.status(status).json({ success: false, error });
}

exports.list = async (req, res) => {
  const { filters, sort, page, limit, offset } = parseListBody(req.body);
  const { where, params } = buildWhere(filters);
  const sortField = ALLOWED_SORT.includes(sort?.field) ? sort.field : 'id';
  const dir = sort?.order === 'asc' ? 'ASC' : 'DESC';
  const orderBy = ` ORDER BY eo.${sortField} ${dir} `;
  const sql = `SELECT eo.id, eo.name, DATE_FORMAT(eo.dates_of_event, '%Y-%m-%d') AS dates_of_event, eo.day_of_the_week FROM event_plan_organization eo ${where} ${orderBy} LIMIT ? OFFSET ?`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [...params, limit, offset]));
    sendSuccess(res, { data: rows, page, limit });
  } catch (err) {
    console.error('org list:', err);
    sendError(res, 500, 'Не удалось получить список мероприятий.');
  }
};

/** POST /count — только filters в теле */
exports.count = async (req, res) => {
  const filters = req.body?.filters || {};
  const { where, params } = buildWhere(filters);
  const sql = `SELECT COUNT(*) AS total FROM event_plan_organization eo ${where}`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, params));
    sendSuccess(res, { total: rows[0].total });
  } catch (err) {
    console.error('org count:', err);
    sendError(res, 500, 'Не удалось получить количество.');
  }
};

/** GET /resp-table — таблица ответственных за мероприятия организации */
exports.respTable = async (req, res) => {
  try {
    const [rows] = await withConnection((conn) => conn.query('SELECT * FROM responsible_for_org_events'));
    sendSuccess(res, { data: rows });
  } catch (err) {
    console.error('org respTable:', err);
    sendError(res, 500, 'Не удалось получить таблицу.');
  }
};

/** GET /full-inf/:id */
exports.fullInf = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const sql = `SELECT eo.id, eo.name, eo.form_of_holding, DATE_FORMAT(eo.dates_of_event, '%Y-%m-%d') AS dates_of_event, eo.day_of_the_week, eo.amount_of_applications, eo.amount_of_planning_application, eo.annotation, eo.result FROM event_plan_organization eo WHERE eo.id = ?`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [id]));
    if (rows.length === 0) return sendError(res, 404, 'Мероприятие не найдено.');
    sendSuccess(res, { data: rows[0] });
  } catch (err) {
    console.error('org fullInf:', err);
    sendError(res, 500, 'Не удалось получить данные.');
  }
};

/** GET /responsible/:id */
exports.responsible = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const sql = `SELECT ro.id_event, emp.id_employees, emp.first_name, emp.second_name FROM responsible_for_org_events ro INNER JOIN employees emp ON emp.id_employees = ro.id_employee WHERE ro.id_event = ?`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [id]));
    sendSuccess(res, { data: rows });
  } catch (err) {
    console.error('org responsible:', err);
    sendError(res, 500, 'Не удалось получить ответственных.');
  }
};

/** GET /notifications-today/:id (id_employee) */
exports.notificationsToday = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id сотрудника.');
  const sql = `SELECT eo.id, eo.name, DATE_FORMAT(eo.dates_of_event, '%Y-%m-%d') AS dates_of_event, eo.day_of_the_week FROM event_plan_organization eo INNER JOIN responsible_for_org_events resp ON resp.id_event = eo.id AND resp.id_employee = ? WHERE eo.dates_of_event = CURDATE() ORDER BY eo.id DESC`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [id]));
    sendSuccess(res, { data: rows });
  } catch (err) {
    console.error('org notificationsToday:', err);
    sendError(res, 500, 'Не удалось получить уведомления.');
  }
};

/** GET /notifications-tomorrow/:id */
exports.notificationsTomorrow = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id сотрудника.');
  const sql = `SELECT eo.id, eo.name, DATE_FORMAT(eo.dates_of_event, '%Y-%m-%d') AS dates_of_event, eo.day_of_the_week FROM event_plan_organization eo INNER JOIN responsible_for_org_events resp ON resp.id_event = eo.id AND resp.id_employee = ? WHERE eo.dates_of_event = DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY) ORDER BY eo.id DESC`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [id]));
    sendSuccess(res, { data: rows });
  } catch (err) {
    console.error('org notificationsTomorrow:', err);
    sendError(res, 500, 'Не удалось получить уведомления.');
  }
};

/** PUT /notifications — body: { id_employee, date } */
exports.notifications = async (req, res) => {
  const { id_employee, date } = req.body || {};
  const empId = parsePositiveId(id_employee);
  if (empId == null || !date) return sendError(res, 400, 'Нужны id_employee и date.');
  const sql = `SELECT eo.id, eo.name, DATE_FORMAT(eo.dates_of_event, '%Y-%m-%d') AS dates_of_event, eo.day_of_the_week FROM event_plan_organization eo INNER JOIN responsible_for_org_events resp ON resp.id_event = eo.id AND resp.id_employee = ? WHERE eo.dates_of_event = ? ORDER BY eo.id DESC`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [empId, date]));
    sendSuccess(res, { data: rows });
  } catch (err) {
    console.error('org notifications:', err);
    sendError(res, 500, 'Не удалось получить уведомления.');
  }
};

/** POST / — создание мероприятия */
exports.add = async (req, res) => {
  const keys = ['name', 'form_of_holding', 'dates_of_event', 'day_of_the_week', 'amount_of_applications', 'amount_of_planning_application', 'annotation', 'result'];
  const check = requireBodyKeys(req.body, keys);
  if (!check.valid) return sendError(res, 400, check.message);
  const b = req.body;
  const sql = `INSERT INTO event_plan_organization (name, form_of_holding, dates_of_event, day_of_the_week, amount_of_applications, amount_of_planning_application, annotation, result) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  try {
    const [r] = await withConnection((conn) => conn.query(sql, [b.name, b.form_of_holding || null, b.dates_of_event || null, b.day_of_the_week || null, b.amount_of_applications ?? null, b.amount_of_planning_application ?? null, b.annotation || null, b.result || null]));
    sendSuccess(res, { id: r.insertId }, 201);
  } catch (err) {
    console.error('org add:', err);
    sendError(res, 500, 'Не удалось создать мероприятие.');
  }
};

/** PUT / — обновление мероприятия */
exports.update = async (req, res) => {
  const keys = ['id', 'name', 'form_of_holding', 'dates_of_event', 'day_of_the_week', 'amount_of_applications', 'amount_of_planning_application', 'annotation', 'result'];
  const check = requireBodyKeys(req.body, keys);
  if (!check.valid) return sendError(res, 400, check.message);
  const id = parsePositiveId(req.body.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const b = req.body;
  const sql = `UPDATE event_plan_organization SET name = ?, form_of_holding = ?, dates_of_event = ?, day_of_the_week = ?, amount_of_applications = ?, amount_of_planning_application = ?, annotation = ?, result = ? WHERE id = ?`;
  try {
    const [r] = await withConnection((conn) => conn.query(sql, [b.name, b.form_of_holding || null, b.dates_of_event || null, b.day_of_the_week || null, b.amount_of_applications ?? null, b.amount_of_planning_application ?? null, b.annotation || null, b.result || null, id]));
    if (r.affectedRows === 0) return sendError(res, 404, 'Мероприятие не найдено.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('org update:', err);
    sendError(res, 500, 'Не удалось обновить мероприятие.');
  }
};

/** POST /responsible — body: { id_employee, id_event } */
exports.newResponsible = async (req, res) => {
  const id_employee = parsePositiveId(req.body?.id_employee ?? req.body?.id_employees);
  const id_event = parsePositiveId(req.body?.id_event);
  if (id_employee == null || id_event == null) return sendError(res, 400, 'Нужны id_employee и id_event.');
  try {
    await withConnection((conn) => conn.query('INSERT INTO responsible_for_org_events (id_employee, id_event) VALUES (?, ?)', [id_employee, id_event]));
    sendSuccess(res, { ok: true }, 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return sendError(res, 409, 'Ответственный уже назначен.');
    console.error('org newResponsible:', err);
    sendError(res, 500, 'Не удалось добавить ответственного.');
  }
};

/** DELETE /responsible — body: { id_employee, id_event } */
exports.deleteResponsible = async (req, res) => {
  const id_employee = parsePositiveId(req.body?.id_employee ?? req.body?.id_employees);
  const id_event = parsePositiveId(req.body?.id_event);
  if (id_employee == null || id_event == null) return sendError(res, 400, 'Нужны id_employee и id_event.');
  try {
    const [r] = await withConnection((conn) => conn.query('DELETE FROM responsible_for_org_events WHERE id_event = ? AND id_employee = ?', [id_event, id_employee]));
    if (r.affectedRows === 0) return sendError(res, 404, 'Запись не найдена.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('org deleteResponsible:', err);
    sendError(res, 500, 'Не удалось удалить.');
  }
};

/** DELETE /:id */
exports.deleteEvent = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  try {
    const [r] = await withConnection((conn) => conn.query('DELETE FROM event_plan_organization WHERE id = ?', [id]));
    if (r.affectedRows === 0) return sendError(res, 404, 'Мероприятие не найдено.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('org deleteEvent:', err);
    sendError(res, 500, 'Не удалось удалить мероприятие.');
  }
};

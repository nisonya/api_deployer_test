const { withConnection } = require('../../helpers/db');
const { parsePositiveId, requireBodyKeys, textField, intOrZero, dateOrNull } = require('../../helpers/validation');
const { sendSuccess, sendError } = require('../../helpers/http');
const { parseListBody, buildOrgWhere } = require('./helpers');

const ALLOWED_SORT = ['id', 'name', 'dates_of_event', 'day_of_the_week'];

exports.list = async (req, res) => {
  const { filters, sort, page, limit, offset } = parseListBody(req.body);
  const { where, params } = buildOrgWhere(filters);
  const sortField = ALLOWED_SORT.includes(sort?.field) ? sort.field : 'id';
  const dir = sort?.order === 'asc' ? 'ASC' : 'DESC';
  const orderBy = ` ORDER BY eo.${sortField} ${dir} `;
  const sql = `SELECT eo.id, eo.name, DATE_FORMAT(eo.dates_of_event, '%Y-%m-%d') AS dates_of_event, eo.day_of_the_week, eo.type FROM event_plan_organization eo ${where} ${orderBy} LIMIT ? OFFSET ?`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [...params, limit, offset]));
    res.json({ success: true, data: rows, page, limit });
  } catch (err) {
    console.error('org list:', err);
    sendError(res, 500, 'Не удалось получить список мероприятий.');
  }
};

/** POST /count — только filters в теле */
exports.count = async (req, res) => {
  const filters = req.body?.filters || {};
  const { where, params } = buildOrgWhere(filters);
  const sql = `SELECT COUNT(*) AS total FROM event_plan_organization eo ${where}`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, params));
    res.json({ success: true, total: rows[0].total });
  } catch (err) {
    console.error('org count:', err);
    sendError(res, 500, 'Не удалось получить количество.');
  }
};

/** GET /resp-table — таблица ответственных за мероприятия организации */
exports.respTable = async (req, res) => {
  try {
    const [rows] = await withConnection((conn) => conn.query('SELECT * FROM responsible_for_org_events'));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('org respTable:', err);
    sendError(res, 500, 'Не удалось получить таблицу.');
  }
};

/** GET /full-inf/:id */
exports.fullInf = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const sql = `SELECT eo.id, eo.name, eo.form_of_holding, DATE_FORMAT(eo.dates_of_event, '%Y-%m-%d') AS dates_of_event, eo.day_of_the_week, eo.amount_of_applications, eo.amount_of_planning_application, eo.annotation, eo.result, eo.type, eo.link FROM event_plan_organization eo WHERE eo.id = ?`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [id]));
    if (rows.length === 0) return sendError(res, 404, 'Мероприятие не найдено.');
    sendSuccess(res, rows[0]);
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
    sendSuccess(res, rows);
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
    sendSuccess(res, rows);
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
    sendSuccess(res, rows);
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
    sendSuccess(res, rows);
  } catch (err) {
    console.error('org notifications:', err);
    sendError(res, 500, 'Не удалось получить уведомления.');
  }
};

/** POST / — создание мероприятия */
exports.add = async (req, res) => {
  const keys = ['name', 'form_of_holding', 'dates_of_event', 'day_of_the_week', 'amount_of_applications', 'amount_of_planning_application', 'annotation', 'result'];
  const check = requireBodyKeys(req.body, keys, { allowEmpty: true });
  if (!check.valid) return sendError(res, 400, check.message);
  const b = req.body;
  if (!String(b.name || '').trim()) return sendError(res, 400, 'Укажите название мероприятия.');
  const sql = `INSERT INTO event_plan_organization (name, form_of_holding, dates_of_event, day_of_the_week, amount_of_applications, amount_of_planning_application, annotation, result, type, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  try {
    const [r] = await withConnection((conn) => conn.query(sql, [
      b.name,
      textField(b.form_of_holding),
      dateOrNull(b.dates_of_event),
      textField(b.day_of_the_week),
      intOrZero(b.amount_of_applications),
      intOrZero(b.amount_of_planning_application),
      textField(b.annotation),
      textField(b.result),
      intOrZero(b.type),
      textField(b.link),
    ]));
    sendSuccess(res, { id: r.insertId }, 201);
  } catch (err) {
    console.error('org add:', err);
    sendError(res, 500, 'Не удалось создать мероприятие.');
  }
};

/** PUT / — обновление мероприятия */
exports.update = async (req, res) => {
  const keys = ['id', 'name', 'form_of_holding', 'dates_of_event', 'day_of_the_week', 'amount_of_applications', 'amount_of_planning_application', 'annotation', 'result'];
  const check = requireBodyKeys(req.body, keys, { allowEmpty: true });
  if (!check.valid) return sendError(res, 400, check.message);
  const id = parsePositiveId(req.body.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const b = req.body;
  if (!String(b.name || '').trim()) return sendError(res, 400, 'Укажите название мероприятия.');
  const sql = `UPDATE event_plan_organization SET name = ?, form_of_holding = ?, dates_of_event = ?, day_of_the_week = ?, amount_of_applications = ?, amount_of_planning_application = ?, annotation = ?, result = ?, type = ?, link = ? WHERE id = ?`;
  try {
    const [r] = await withConnection((conn) => conn.query(sql, [
      b.name,
      textField(b.form_of_holding),
      dateOrNull(b.dates_of_event),
      textField(b.day_of_the_week),
      intOrZero(b.amount_of_applications),
      intOrZero(b.amount_of_planning_application),
      textField(b.annotation),
      textField(b.result),
      intOrZero(b.type),
      textField(b.link),
      id,
    ]));
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

const { withConnection } = require('../../helpers/db');
const { parsePositiveId, requireBodyKeys } = require('../../helpers/validation');

const ALLOWED_SORT = ['id', 'name', 'registration_deadline', 'participants_amount'];

function buildWhere(filters) {
  const where = [];
  const params = [];
  if (filters?.period && filters.period !== 'all') {
    switch (filters.period) {
      case 'this_month':
        where.push(' ep.registration_deadline >= DATE_FORMAT(NOW(), "%Y-%m-01") AND ep.registration_deadline < DATE_ADD(DATE_FORMAT(NOW(), "%Y-%m-01"), INTERVAL 1 MONTH) ');
        break;
      case 'this_week':
        where.push(' YEARWEEK(ep.registration_deadline) = YEARWEEK(NOW()) ');
        break;
      case 'next_week':
        where.push(' YEARWEEK(ep.registration_deadline) = YEARWEEK(NOW())+1 ');
        break;
      case 'three_months':
        where.push(' ep.registration_deadline >= CURDATE() AND ep.registration_deadline <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH) ');
        break;
      default:
        break;
    }
  }
  if (filters?.search && String(filters.search).trim()) {
    where.push(' ep.name LIKE ? ');
    params.push(`%${String(filters.search).trim()}%`);
  }
  if (filters?.employee_id) {
    where.push(' EXISTS (SELECT 1 FROM responsible_for_part_events rp WHERE rp.id_event = ep.id AND rp.id_employee = ?) ');
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

/** POST /list */
exports.list = async (req, res) => {
  const { filters, sort, page, limit, offset } = parseListBody(req.body);
  const { where, params } = buildWhere(filters);
  const sortField = ALLOWED_SORT.includes(sort?.field) ? sort.field : 'registration_deadline';
  const dir = sort?.order === 'asc' ? 'ASC' : 'DESC';
  const orderBy = ` ORDER BY ep.${sortField} ${dir} `;
  const sql = `SELECT ep.id, ep.name, DATE_FORMAT(ep.registration_deadline, '%Y-%m-%d') AS registration_deadline, ep.participants_amount, ep.result FROM event_plan_participation ep ${where} ${orderBy} LIMIT ? OFFSET ?`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [...params, limit, offset]));
    sendSuccess(res, { data: rows, page, limit });
  } catch (err) {
    console.error('part list:', err);
    sendError(res, 500, 'Не удалось получить список мероприятий.');
  }
};

/** POST /count */
exports.count = async (req, res) => {
  const filters = req.body?.filters || {};
  const { where, params } = buildWhere(filters);
  const sql = `SELECT COUNT(*) AS total FROM event_plan_participation ep ${where}`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, params));
    sendSuccess(res, { total: rows[0].total });
  } catch (err) {
    console.error('part count:', err);
    sendError(res, 500, 'Не удалось получить количество.');
  }
};

/** GET /full-inf/:id */
exports.fullInf = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const sql = `SELECT ep.id, ep.name, foh.name AS form_of_holding, lvl.type AS level, DATE_FORMAT(ep.registration_deadline, '%Y-%m-%d') AS registration_deadline, ep.participants_and_works, ep.result, ep.dates_of_event, ep.annotation, ep.link, ep.participants_amount, ep.winner_amount, ep.runner_up_amount FROM event_plan_participation ep INNER JOIN form_of_holding foh ON foh.id = ep.form_of_holding INNER JOIN type_of_part_event lvl ON lvl.id = ep.id_type WHERE ep.id = ?`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [id]));
    if (rows.length === 0) return sendError(res, 404, 'Мероприятие не найдено.');
    sendSuccess(res, { data: rows[0] });
  } catch (err) {
    console.error('part fullInf:', err);
    sendError(res, 500, 'Не удалось получить данные.');
  }
};

/** GET /responsible/:id */
exports.responsible = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const sql = `SELECT rp.id_event, emp.id_employees, emp.first_name, emp.second_name, rp.mark_of_sending_an_application FROM responsible_for_part_events rp INNER JOIN employees emp ON emp.id_employees = rp.id_employee WHERE rp.id_event = ?`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [id]));
    sendSuccess(res, { data: rows });
  } catch (err) {
    console.error('part responsible:', err);
    sendError(res, 500, 'Не удалось получить ответственных.');
  }
};

/** GET /responsible-new/:id — с result_of_responsible */
exports.responsibleNew = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const sql = `SELECT rp.id_event, emp.id_employees, emp.first_name, emp.second_name, rp.mark_of_sending_an_application, rp.result_of_responsible FROM responsible_for_part_events rp INNER JOIN employees emp ON emp.id_employees = rp.id_employee WHERE rp.id_event = ?`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [id]));
    sendSuccess(res, { data: rows });
  } catch (err) {
    console.error('part responsibleNew:', err);
    sendError(res, 500, 'Не удалось получить ответственных.');
  }
};

/** GET /resp-table */
exports.respTable = async (req, res) => {
  try {
    const [rows] = await withConnection((conn) => conn.query('SELECT * FROM responsible_for_part_events'));
    sendSuccess(res, { data: rows });
  } catch (err) {
    console.error('part respTable:', err);
    sendError(res, 500, 'Не удалось получить таблицу.');
  }
};

/** GET /notifications-today/:id (id_employee) */
exports.notificationsToday = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id сотрудника.');
  const sql = `SELECT ep.id, ep.name, foh.name AS form_of_holding, DATE_FORMAT(ep.registration_deadline, '%Y-%m-%d') AS registration_deadline FROM event_plan_participation ep INNER JOIN form_of_holding foh ON foh.id = ep.form_of_holding INNER JOIN responsible_for_part_events resp ON resp.id_event = ep.id AND resp.id_employee = ? WHERE ep.registration_deadline = CURDATE() ORDER BY ep.id DESC`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [id]));
    sendSuccess(res, { data: rows });
  } catch (err) {
    console.error('part notificationsToday:', err);
    sendError(res, 500, 'Не удалось получить уведомления.');
  }
};

/** GET /notifications-tomorrow/:id */
exports.notificationsTomorrow = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id сотрудника.');
  const sql = `SELECT ep.id, ep.name, foh.name AS form_of_holding, DATE_FORMAT(ep.registration_deadline, '%Y-%m-%d') AS registration_deadline FROM event_plan_participation ep INNER JOIN form_of_holding foh ON foh.id = ep.form_of_holding INNER JOIN responsible_for_part_events resp ON resp.id_event = ep.id AND resp.id_employee = ? WHERE ep.registration_deadline = DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY) ORDER BY ep.id DESC`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [id]));
    sendSuccess(res, { data: rows });
  } catch (err) {
    console.error('part notificationsTomorrow:', err);
    sendError(res, 500, 'Не удалось получить уведомления.');
  }
};

/** PUT /notifications — body: { id_employee, date } */
exports.notifications = async (req, res) => {
  const { id_employee, date } = req.body || {};
  const empId = parsePositiveId(id_employee);
  if (empId == null || !date) return sendError(res, 400, 'Нужны id_employee и date.');
  const sql = `SELECT ep.id, ep.name, foh.name AS form_of_holding, DATE_FORMAT(ep.registration_deadline, '%Y-%m-%d') AS registration_deadline FROM event_plan_participation ep INNER JOIN form_of_holding foh ON foh.id = ep.form_of_holding INNER JOIN responsible_for_part_events resp ON resp.id_event = ep.id AND resp.id_employee = ? WHERE ep.registration_deadline = ? ORDER BY ep.id DESC`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [empId, date]));
    sendSuccess(res, { data: rows });
  } catch (err) {
    console.error('part notifications:', err);
    sendError(res, 500, 'Не удалось получить уведомления.');
  }
};

/** POST / — создание (new_event_part: result опционален) */
exports.add = async (req, res) => {
  const keys = ['name', 'form_of_holding', 'id_type', 'registration_deadline', 'participants_and_works', 'annotation', 'dates_of_event', 'link', 'participants_amount', 'winner_amount', 'runner_up_amount'];
  const check = requireBodyKeys(req.body, keys);
  if (!check.valid) return sendError(res, 400, check.message);
  const b = req.body;
  const formId = parsePositiveId(b.form_of_holding);
  const typeId = parsePositiveId(b.id_type);
  if (formId == null || typeId == null) return sendError(res, 400, 'form_of_holding и id_type должны быть числами.');
  const sql = `INSERT INTO event_plan_participation (name, form_of_holding, id_type, registration_deadline, participants_and_works, result, annotation, dates_of_event, link, participants_amount, winner_amount, runner_up_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  try {
    const [r] = await withConnection((conn) => conn.query(sql, [b.name, formId, typeId, b.registration_deadline || null, b.participants_and_works || null, b.result ?? null, b.annotation || null, b.dates_of_event || null, b.link || null, b.participants_amount ?? null, b.winner_amount ?? null, b.runner_up_amount ?? null]));
    sendSuccess(res, { id: r.insertId }, 201);
  } catch (err) {
    console.error('part add:', err);
    sendError(res, 500, 'Не удалось создать мероприятие.');
  }
};

/** PUT / — обновление (update_event_part) */
exports.update = async (req, res) => {
  const keys = ['id', 'name', 'form_of_holding', 'id_type', 'registration_deadline', 'participants_and_works', 'result', 'annotation', 'dates_of_event', 'link', 'participants_amount', 'winner_amount', 'runner_up_amount'];
  const check = requireBodyKeys(req.body, keys);
  if (!check.valid) return sendError(res, 400, check.message);
  const id = parsePositiveId(req.body.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const b = req.body;
  const formId = parsePositiveId(b.form_of_holding);
  const typeId = parsePositiveId(b.id_type);
  if (formId == null || typeId == null) return sendError(res, 400, 'form_of_holding и id_type должны быть числами.');
  const sql = `UPDATE event_plan_participation SET name = ?, form_of_holding = ?, id_type = ?, registration_deadline = ?, participants_and_works = ?, result = ?, annotation = ?, dates_of_event = ?, link = ?, participants_amount = ?, winner_amount = ?, runner_up_amount = ? WHERE id = ?`;
  try {
    const [r] = await withConnection((conn) => conn.query(sql, [b.name, formId, typeId, b.registration_deadline || null, b.participants_and_works || null, b.result ?? null, b.annotation || null, b.dates_of_event || null, b.link || null, b.participants_amount ?? null, b.winner_amount ?? null, b.runner_up_amount ?? null, id]));
    if (r.affectedRows === 0) return sendError(res, 404, 'Мероприятие не найдено.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('part update:', err);
    sendError(res, 500, 'Не удалось обновить мероприятие.');
  }
};

/** PUT /result — body: { id_event, id_employee, result_of_responsible } */
exports.updateResult = async (req, res) => {
  const id_event = parsePositiveId(req.body?.id_event);
  const id_employee = parsePositiveId(req.body?.id_employee ?? req.body?.id_employees);
  if (id_event == null || id_employee == null) return sendError(res, 400, 'Нужны id_event и id_employee.');
  const result = req.body?.result_of_responsible != null ? String(req.body.result_of_responsible) : null;
  try {
    const [r] = await withConnection((conn) => conn.query('UPDATE responsible_for_part_events SET result_of_responsible = ? WHERE id_event = ? AND id_employee = ?', [result, id_event, id_employee]));
    if (r.affectedRows === 0) return sendError(res, 404, 'Запись не найдена.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('part updateResult:', err);
    sendError(res, 500, 'Не удалось обновить результат.');
  }
};

/** PUT /mark — body: { id_event, id_employee, mark_of_sending_an_application } */
exports.updateMark = async (req, res) => {
  const id_event = parsePositiveId(req.body?.id_event);
  const id_employee = parsePositiveId(req.body?.id_employee ?? req.body?.id_employees);
  if (id_event == null || id_employee == null) return sendError(res, 400, 'Нужны id_event и id_employee.');
  const mark = req.body?.mark_of_sending_an_application != null ? parseInt(req.body.mark_of_sending_an_application, 10) : 0;
  try {
    const [r] = await withConnection((conn) => conn.query('UPDATE responsible_for_part_events SET mark_of_sending_an_application = ? WHERE id_event = ? AND id_employee = ?', [mark, id_event, id_employee]));
    if (r.affectedRows === 0) return sendError(res, 404, 'Запись не найдена.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('part updateMark:', err);
    sendError(res, 500, 'Не удалось обновить отметку.');
  }
};

/** POST /responsible — body: { id_employee, id_event } */
exports.newResponsible = async (req, res) => {
  const id_employee = parsePositiveId(req.body?.id_employee ?? req.body?.id_employees);
  const id_event = parsePositiveId(req.body?.id_event);
  if (id_employee == null || id_event == null) return sendError(res, 400, 'Нужны id_employee и id_event.');
  try {
    await withConnection((conn) => conn.query('INSERT INTO responsible_for_part_events (id_event, id_employee) VALUES (?, ?)', [id_event, id_employee]));
    sendSuccess(res, { ok: true }, 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return sendError(res, 409, 'Ответственный уже назначен.');
    console.error('part newResponsible:', err);
    sendError(res, 500, 'Не удалось добавить ответственного.');
  }
};

/** DELETE /responsible — body: { id_employee, id_event } */
exports.deleteResponsible = async (req, res) => {
  const id_employee = parsePositiveId(req.body?.id_employee ?? req.body?.id_employees);
  const id_event = parsePositiveId(req.body?.id_event);
  if (id_employee == null || id_event == null) return sendError(res, 400, 'Нужны id_employee и id_event.');
  try {
    const [r] = await withConnection((conn) => conn.query('DELETE FROM responsible_for_part_events WHERE id_event = ? AND id_employee = ?', [id_event, id_employee]));
    if (r.affectedRows === 0) return sendError(res, 404, 'Запись не найдена.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('part deleteResponsible:', err);
    sendError(res, 500, 'Не удалось удалить.');
  }
};

/** DELETE /:id */
exports.deleteEvent = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  try {
    const [r] = await withConnection((conn) => conn.query('DELETE FROM event_plan_participation WHERE id = ?', [id]));
    if (r.affectedRows === 0) return sendError(res, 404, 'Мероприятие не найдено.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('part deleteEvent:', err);
    sendError(res, 500, 'Не удалось удалить мероприятие.');
  }
};

const { withConnection } = require('../../helpers/db');
const { parsePositiveId, requireBodyKeys, textField, intOrZero, dateOrNull, optionalPositiveId } = require('../../helpers/validation');
const { sendSuccess, sendError } = require('../../helpers/http');
const { parseListBody, buildPartWhere } = require('./helpers');

const ALLOWED_SORT = ['id', 'name', 'registration_deadline', 'participants_amount', 'dates_of_event'];

function nullableUIntOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseInt(v, 10);
  if (isNaN(n) || n < 0) return null;
  return n;
}

/** POST /list */
exports.list = async (req, res) => {
  const { filters, sort, page, limit, offset } = parseListBody(req.body);
  const { where, params } = buildPartWhere(filters);
  const sortField = ALLOWED_SORT.includes(sort?.field) ? sort.field : 'registration_deadline';
  const dir = sort?.order === 'asc' ? 'ASC' : 'DESC';
  const orderBy = ` ORDER BY ep.${sortField} ${dir} `;
  const sql = `SELECT ep.id, ep.name, DATE_FORMAT(ep.registration_deadline, '%Y-%m-%d') AS registration_deadline, ep.participants_amount, ep.result, ep.id_type FROM event_plan_participation ep ${where} ${orderBy} LIMIT ? OFFSET ?`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [...params, limit, offset]));
    res.json({ success: true, data: rows, page, limit });
  } catch (err) {
    console.error('part list:', err);
    sendError(res, 500, 'Не удалось получить список мероприятий.');
  }
};

/** POST /count */
exports.count = async (req, res) => {
  const filters = req.body?.filters || {};
  const { where, params } = buildPartWhere(filters);
  const sql = `SELECT COUNT(*) AS total FROM event_plan_participation ep ${where}`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, params));
    res.json({ success: true, total: rows[0].total });
  } catch (err) {
    console.error('part count:', err);
    sendError(res, 500, 'Не удалось получить количество.');
  }
};

/** GET /full-inf/:id */
exports.fullInf = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const sql = `SELECT ep.id, ep.name, ep.form_of_holding, ep.id_type, DATE_FORMAT(ep.registration_deadline, '%Y-%m-%d') AS registration_deadline, ep.participants_and_works, ep.result, ep.dates_of_event, ep.annotation, ep.link, ep.participants_amount, ep.winner_amount, ep.runner_up_amount FROM event_plan_participation ep WHERE ep.id = ?`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [id]));
    if (rows.length === 0) return sendError(res, 404, 'Мероприятие не найдено.');
    sendSuccess(res, rows[0]);
  } catch (err) {
    console.error('part fullInf:', err);
    sendError(res, 500, 'Не удалось получить данные.');
  }
};

/** GET /responsible/:id */
exports.responsible = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const sql = `SELECT rp.id_event, emp.id_employees, emp.first_name, emp.second_name, rp.mark_of_sending_an_application, rp.responsible_participants, rp.responsible_winners, rp.responsible_runner_up FROM responsible_for_part_events rp INNER JOIN employees emp ON emp.id_employees = rp.id_employee WHERE rp.id_event = ?`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [id]));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('part responsible:', err);
    sendError(res, 500, 'Не удалось получить ответственных.');
  }
};

/** GET /responsible-new/:id — с комментарием и вкладом ответственного */
exports.responsibleNew = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const sql = `SELECT rp.id_event, emp.id_employees, emp.first_name, emp.second_name, rp.mark_of_sending_an_application, rp.result_of_responsible, rp.responsible_participants, rp.responsible_winners, rp.responsible_runner_up FROM responsible_for_part_events rp INNER JOIN employees emp ON emp.id_employees = rp.id_employee WHERE rp.id_event = ?`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [id]));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('part responsibleNew:', err);
    sendError(res, 500, 'Не удалось получить ответственных.');
  }
};

/** GET /resp-table */
exports.respTable = async (req, res) => {
  try {
    const [rows] = await withConnection((conn) => conn.query('SELECT * FROM responsible_for_part_events'));
    sendSuccess(res, rows);
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
    sendSuccess(res, rows);
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
    sendSuccess(res, rows);
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
    sendSuccess(res, rows);
  } catch (err) {
    console.error('part notifications:', err);
    sendError(res, 500, 'Не удалось получить уведомления.');
  }
};

/** POST / — создание (new_event_part: result опционален) */
exports.add = async (req, res) => {
  const keys = ['name', 'form_of_holding', 'id_type', 'registration_deadline', 'participants_and_works', 'annotation', 'dates_of_event', 'link', 'participants_amount', 'winner_amount', 'runner_up_amount'];
  const check = requireBodyKeys(req.body, keys, { allowEmpty: true });
  if (!check.valid) return sendError(res, 400, check.message);
  const b = req.body;
  if (!String(b.name || '').trim()) return sendError(res, 400, 'Укажите название мероприятия.');
  const typeId = parsePositiveId(b.id_type);
  if (typeId == null) return sendError(res, 400, 'id_type должен быть положительным числом.');
  const formId = optionalPositiveId(b.form_of_holding);
  if (b.form_of_holding !== '' && b.form_of_holding != null && formId == null) {
    return sendError(res, 400, 'Некорректный form_of_holding.');
  }
  const sql = `INSERT INTO event_plan_participation (name, form_of_holding, id_type, registration_deadline, participants_and_works, result, annotation, dates_of_event, link, participants_amount, winner_amount, runner_up_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  try {
    const [r] = await withConnection((conn) => conn.query(sql, [
      b.name,
      formId,
      typeId,
      dateOrNull(b.registration_deadline),
      textField(b.participants_and_works),
      textField(b.result),
      textField(b.annotation),
      textField(b.dates_of_event),
      textField(b.link),
      intOrZero(b.participants_amount),
      intOrZero(b.winner_amount),
      intOrZero(b.runner_up_amount),
    ]));
    sendSuccess(res, { id: r.insertId }, 201);
  } catch (err) {
    console.error('part add:', err);
    sendError(res, 500, 'Не удалось создать мероприятие.');
  }
};

/** PUT / — обновление (update_event_part) */
exports.update = async (req, res) => {
  const keys = ['id', 'name', 'form_of_holding', 'id_type', 'registration_deadline', 'participants_and_works', 'result', 'annotation', 'dates_of_event', 'link', 'participants_amount', 'winner_amount', 'runner_up_amount'];
  const check = requireBodyKeys(req.body, keys, { allowEmpty: true });
  if (!check.valid) return sendError(res, 400, check.message);
  const id = parsePositiveId(req.body.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const b = req.body;
  if (!String(b.name || '').trim()) return sendError(res, 400, 'Укажите название мероприятия.');
  const typeId = parsePositiveId(b.id_type);
  if (typeId == null) return sendError(res, 400, 'id_type должен быть положительным числом.');
  const formId = optionalPositiveId(b.form_of_holding);
  if (b.form_of_holding !== '' && b.form_of_holding != null && formId == null) {
    return sendError(res, 400, 'Некорректный form_of_holding.');
  }
  const fallbackParticipants = intOrZero(b.participants_amount);
  const fallbackWinners = intOrZero(b.winner_amount);
  const fallbackRunnerUp = intOrZero(b.runner_up_amount);
  const sql = `UPDATE event_plan_participation SET name = ?, form_of_holding = ?, id_type = ?, registration_deadline = ?, participants_and_works = ?, result = ?, annotation = ?, dates_of_event = ?, link = ?,
    participants_amount = CASE
      WHEN EXISTS (
        SELECT 1 FROM responsible_for_part_events rp
        WHERE rp.id_event = ? AND (
          rp.responsible_participants IS NOT NULL OR rp.responsible_winners IS NOT NULL OR rp.responsible_runner_up IS NOT NULL
        )
      )
      THEN (
        SELECT COALESCE(SUM(COALESCE(rp.responsible_participants, 0)), 0)
        FROM responsible_for_part_events rp
        WHERE rp.id_event = ?
      )
      ELSE ?
    END,
    winner_amount = CASE
      WHEN EXISTS (
        SELECT 1 FROM responsible_for_part_events rp
        WHERE rp.id_event = ? AND (
          rp.responsible_participants IS NOT NULL OR rp.responsible_winners IS NOT NULL OR rp.responsible_runner_up IS NOT NULL
        )
      )
      THEN (
        SELECT COALESCE(SUM(COALESCE(rp.responsible_winners, 0)), 0)
        FROM responsible_for_part_events rp
        WHERE rp.id_event = ?
      )
      ELSE ?
    END,
    runner_up_amount = CASE
      WHEN EXISTS (
        SELECT 1 FROM responsible_for_part_events rp
        WHERE rp.id_event = ? AND (
          rp.responsible_participants IS NOT NULL OR rp.responsible_winners IS NOT NULL OR rp.responsible_runner_up IS NOT NULL
        )
      )
      THEN (
        SELECT COALESCE(SUM(COALESCE(rp.responsible_runner_up, 0)), 0)
        FROM responsible_for_part_events rp
        WHERE rp.id_event = ?
      )
      ELSE ?
    END
    WHERE id = ?`;
  try {
    const [r] = await withConnection((conn) => conn.query(sql, [
      b.name,
      formId,
      typeId,
      dateOrNull(b.registration_deadline),
      textField(b.participants_and_works),
      textField(b.result),
      textField(b.annotation),
      textField(b.dates_of_event),
      textField(b.link),
      id,
      id,
      fallbackParticipants,
      id,
      id,
      fallbackWinners,
      id,
      id,
      fallbackRunnerUp,
      id,
    ]));
    if (r.affectedRows === 0) return sendError(res, 404, 'Мероприятие не найдено.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('part update:', err);
    sendError(res, 500, 'Не удалось обновить мероприятие.');
  }
};

/** PUT /result — body: { id_event, id_employee, result_of_responsible/comment, responsible_* } */
exports.updateResult = async (req, res) => {
  const id_event = parsePositiveId(req.body?.id_event);
  const id_employee = parsePositiveId(req.body?.id_employee ?? req.body?.id_employees);
  if (id_event == null || id_employee == null) return sendError(res, 400, 'Нужны id_event и id_employee.');
  const commentRaw = req.body?.comment != null ? req.body.comment : req.body?.result_of_responsible;
  const comment = commentRaw != null ? String(commentRaw) : null;
  const responsibleParticipants = nullableUIntOrNull(req.body?.responsible_participants);
  const responsibleWinners = nullableUIntOrNull(req.body?.responsible_winners);
  const responsibleRunnerUp = nullableUIntOrNull(req.body?.responsible_runner_up);
  try {
    const [r] = await withConnection((conn) => conn.query(
      'UPDATE responsible_for_part_events SET result_of_responsible = ?, responsible_participants = ?, responsible_winners = ?, responsible_runner_up = ? WHERE id_event = ? AND id_employee = ?',
      [comment, responsibleParticipants, responsibleWinners, responsibleRunnerUp, id_event, id_employee]
    ));
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

/* ──────── Ученики мероприятия участия ──────── */

/** GET /:eventId/students */
exports.listStudents = async (req, res) => {
  const eventId = parsePositiveId(req.params.eventId);
  if (eventId == null) return sendError(res, 400, 'Некорректный id мероприятия.');
  const sql = `
    SELECT eps.id, eps.id_student, eps.id_status,
           s.surnameStudent  AS surname,
           s.nameStudent     AS name,
           s.patronymicStudent AS patronymic,
           st.name           AS status_name
      FROM event_part_student eps
      JOIN students s  ON s.idStudent = eps.id_student
      JOIN event_part_student_status st ON st.id = eps.id_status
     WHERE eps.id_event = ?
     ORDER BY s.surnameStudent, s.nameStudent`;
  try {
    const [rows] = await withConnection((conn) => conn.query(sql, [eventId]));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('part listStudents:', err);
    sendError(res, 500, 'Не удалось получить учеников.');
  }
};

/** POST /:eventId/students — body: { id_student, id_status } */
exports.addStudent = async (req, res) => {
  const eventId = parsePositiveId(req.params.eventId);
  if (eventId == null) return sendError(res, 400, 'Некорректный id мероприятия.');
  const studentId = parsePositiveId(req.body?.id_student);
  const statusId = parsePositiveId(req.body?.id_status);
  if (studentId == null) return sendError(res, 400, 'Укажите id_student (положительное число).');
  if (statusId == null) return sendError(res, 400, 'Укажите id_status (положительное число).');
  try {
    const [r] = await withConnection((conn) =>
      conn.query(
        'INSERT INTO event_part_student (id_event, id_student, id_status) VALUES (?, ?, ?)',
        [eventId, studentId, statusId]
      )
    );
    sendSuccess(res, { id: r.insertId }, 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return sendError(res, 409, 'Ученик уже добавлен к этому мероприятию.');
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return sendError(res, 400, 'Мероприятие, ученик или статус не найдены.');
    console.error('part addStudent:', err);
    sendError(res, 500, 'Не удалось добавить ученика.');
  }
};

/** PUT /students/:id — body: { id_status } */
exports.updateStudent = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id записи.');
  const statusId = parsePositiveId(req.body?.id_status);
  if (statusId == null) return sendError(res, 400, 'Укажите id_status (положительное число).');
  try {
    const [r] = await withConnection((conn) =>
      conn.query('UPDATE event_part_student SET id_status = ? WHERE id = ?', [statusId, id])
    );
    if (r.affectedRows === 0) return sendError(res, 404, 'Запись не найдена.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return sendError(res, 400, 'Указанный статус не найден.');
    console.error('part updateStudent:', err);
    sendError(res, 500, 'Не удалось обновить статус ученика.');
  }
};

/** DELETE /students/:id */
exports.deleteStudent = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id записи.');
  try {
    const [r] = await withConnection((conn) =>
      conn.query('DELETE FROM event_part_student WHERE id = ?', [id])
    );
    if (r.affectedRows === 0) return sendError(res, 404, 'Запись не найдена.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('part deleteStudent:', err);
    sendError(res, 500, 'Не удалось удалить ученика из мероприятия.');
  }
};

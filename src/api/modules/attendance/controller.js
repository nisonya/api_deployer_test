const { withConnection } = require('../../helpers/db');
const { parsePositiveId } = require('../../helpers/validation');

async function fetchAttByGroup(conn, groupId) {
  const [rows] = await conn.query(
    `SELECT CONCAT(s.surnameStudent, ' ', s.nameStudent) AS name,
      DATE_FORMAT(a.date_of_lesson, '%Y-%m-%d') AS date_of_lesson, a.presence
     FROM students s
     INNER JOIN attendance a ON s.idStudent = a.id_student
     WHERE a.id_group = ?
     ORDER BY a.date_of_lesson DESC`,
    [groupId]
  );
  return rows;
}

async function fetchAttByGroupAndDate(conn, groupId, date) {
  const [rows] = await conn.query(
    `SELECT CONCAT(s.surnameStudent, ' ', s.nameStudent) AS name,
      DATE_FORMAT(a.date_of_lesson, '%Y-%m-%d') AS date_of_lesson, a.presence
     FROM students s
     INNER JOIN attendance a ON s.idStudent = a.id_student
     WHERE a.id_group = ? AND a.date_of_lesson = ?`,
    [groupId, date]
  );
  return rows;
}

/** _new variant: includes id_student */
async function fetchAttByGroupAndDateNew(conn, groupId, date) {
  const [rows] = await conn.query(
    `SELECT s.idStudent AS id_student, CONCAT(s.surnameStudent, ' ', s.nameStudent) AS name,
      DATE_FORMAT(a.date_of_lesson, '%Y-%m-%d') AS date_of_lesson, a.presence
     FROM students s
     INNER JOIN attendance a ON s.idStudent = a.id_student
     WHERE a.id_group = ? AND a.date_of_lesson = ?`,
    [groupId, date]
  );
  return rows;
}

async function upsertAttendance(conn, studentId, groupId, date, presence) {
  const [existing] = await conn.query(
    'SELECT 1 FROM attendance WHERE id_student = ? AND id_group = ? AND date_of_lesson = ?',
    [studentId, groupId, date]
  );
  if (existing.length > 0) {
    await conn.query(
      'UPDATE attendance SET presence = ? WHERE id_student = ? AND id_group = ? AND date_of_lesson = ?',
      [presence, studentId, groupId, date]
    );
  } else {
    await conn.query(
      'INSERT INTO attendance (id_student, id_group, date_of_lesson, presence) VALUES (?, ?, ?, ?)',
      [studentId, groupId, date, presence]
    );
  }
}

function sendSuccess(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

function sendError(res, status, error) {
  res.status(status).json({ success: false, error });
}

exports.getByGroup = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id группы.');
  try {
    const rows = await withConnection((conn) => fetchAttByGroup(conn, id));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getByGroup:', err);
    sendError(res, 500, 'Не удалось получить посещаемость.');
  }
};

/** PUT body: { group_id, date } */
exports.getByGroupAndDate = async (req, res) => {
  const { group_id, date } = req.body || {};
  const groupId = parsePositiveId(group_id);
  if (groupId == null || !date) return sendError(res, 400, 'Нужны group_id и date.');
  try {
    const rows = await withConnection((conn) => fetchAttByGroupAndDate(conn, groupId, date));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getByGroupAndDate:', err);
    sendError(res, 500, 'Не удалось получить посещаемость.');
  }
};

/** PUT body: { group_id, date } — вариант с id_student */
exports.getByGroupAndDateNew = async (req, res) => {
  const { group_id, date } = req.body || {};
  const groupId = parsePositiveId(group_id);
  if (groupId == null || !date) return sendError(res, 400, 'Нужны group_id и date.');
  try {
    const rows = await withConnection((conn) => fetchAttByGroupAndDateNew(conn, groupId, date));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getByGroupAndDateNew:', err);
    sendError(res, 500, 'Не удалось получить посещаемость.');
  }
};

/** POST body: { student_id, group_id, date_of_lesson, presence } */
exports.newAttendance = async (req, res) => {
  const { student_id, group_id, date_of_lesson, presence } = req.body || {};
  const studentId = parsePositiveId(student_id);
  const groupId = parsePositiveId(group_id);
  const presenceNum = presence != null ? parseInt(presence, 10) : null;
  if (studentId == null || groupId == null || !date_of_lesson || presenceNum == null) {
    return sendError(res, 400, 'Нужны: student_id, group_id, date_of_lesson, presence.');
  }
  try {
    await withConnection((conn) =>
      upsertAttendance(conn, studentId, groupId, date_of_lesson, presenceNum)
    );
    sendSuccess(res, { ok: true }, 201);
  } catch (err) {
    console.error('newAttendance:', err);
    sendError(res, 500, 'Не удалось сохранить посещаемость.');
  }
};

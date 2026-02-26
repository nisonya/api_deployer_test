const { withConnection } = require('../../helpers/db');
const { parsePositiveId } = require('../../helpers/validation');

/** Uses view_schedule: groups taught by teacher t */
async function fetchGroupsByTeacher(conn, teacherId) {
  const [rows] = await conn.query(
    `SELECT v.\`group\` AS id, g.name
     FROM view_schedule v
     INNER JOIN \`groups\` g ON v.\`group\` = g.idGroups
     INNER JOIN employees_schedule es ON es.idSchedule = v.idlesson AND es.idEmployees = ?
     GROUP BY v.\`group\`, g.name`,
    [teacherId]
  );
  return rows;
}

async function fetchTableStudentsGroup(conn) {
  const [rows] = await conn.query('SELECT * FROM students_groups');
  return rows;
}

async function fetchPixelsByGroup(conn, groupId) {
  const [rows] = await conn.query(
    `SELECT CONCAT(s.surnameStudent, ' ', s.nameStudent) AS name, p.*
     FROM students s
     INNER JOIN pixels p ON s.idStudent = p.id_student
     INNER JOIN students_groups sg ON sg.idStudent = s.idStudent AND sg.idGroup = ?
     ORDER BY name DESC`,
    [groupId]
  );
  return rows;
}

async function fetchListGroup(conn) {
  const [rows] = await conn.query('SELECT idGroups AS id, name FROM `groups`');
  return rows;
}

const PIXEL_COLUMNS = [
  'part_of_comp', 'make_content', 'invite_friend', 'clean_kvantum', 'filled_project_card_on_time',
  'finished_project_with_product', 'regional_competition', 'interregional_competition', 'all_russian_competition',
  'international_competition', 'nto', 'become_an_engineering_volunteer', 'help_with_event', 'make_own_event',
  'special_achievements', 'fine'
];

async function updatePixelsForStudent(conn, studentId, fields) {
  const cols = PIXEL_COLUMNS.filter((c) => fields[c] != null);
  if (cols.length === 0) return 0;
  const setClause = cols.map((c) => `\`${c}\` = ?`).join(', ');
  const values = cols.map((c) => fields[c]);
  values.push(studentId);
  const [r] = await conn.query(
    `UPDATE pixels SET ${setClause} WHERE id_student = ?`,
    values
  );
  return r.affectedRows;
}

function sendSuccess(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

function sendError(res, status, error) {
  res.status(status).json({ success: false, error });
}

exports.getGroupsByTeacher = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id преподавателя.');
  try {
    const rows = await withConnection((conn) => fetchGroupsByTeacher(conn, id));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getGroupsByTeacher:', err);
    sendError(res, 500, 'Не удалось получить группы.');
  }
};

exports.getTableStudentsGroup = async (req, res) => {
  try {
    const rows = await withConnection(fetchTableStudentsGroup);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getTableStudentsGroup:', err);
    sendError(res, 500, 'Не удалось получить таблицу.');
  }
};

exports.getPixelsByGroup = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id группы.');
  try {
    const rows = await withConnection((conn) => fetchPixelsByGroup(conn, id));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getPixelsByGroup:', err);
    sendError(res, 500, 'Не удалось получить пиксели.');
  }
};

exports.getList = async (req, res) => {
  try {
    const rows = await withConnection(fetchListGroup);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getList:', err);
    sendError(res, 500, 'Не удалось получить список групп.');
  }
};

/** PUT body: id_student + any of part_of_comp, make_content, ... (pixel fields) */
exports.updatePixels = async (req, res) => {
  const body = req.body || {};
  const studentId = parsePositiveId(body.id_student ?? body.id);
  if (studentId == null) return sendError(res, 400, 'Нужен id_student (или id).');
  const fields = {};
  for (const col of PIXEL_COLUMNS) {
    if (body[col] != null) fields[col] = body[col];
  }
  if (Object.keys(fields).length === 0) return sendError(res, 400, 'Нужны хотя бы одно поле пикселей.');
  try {
    const affected = await withConnection((conn) => updatePixelsForStudent(conn, studentId, fields));
    sendSuccess(res, { ok: true, affected });
  } catch (err) {
    console.error('updatePixels:', err);
    sendError(res, 500, 'Не удалось обновить пиксели.');
  }
};

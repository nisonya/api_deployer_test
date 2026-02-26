const { withConnection } = require('../../helpers/db');
const { parsePositiveId, requireBodyKeys } = require('../../helpers/validation');

async function fetchStudentsByLetter(conn, letter) {
  const baseSelect = `SELECT s.idStudent AS id, s.surnameStudent AS surname, s.nameStudent AS name, s.patronymicStudent AS patronymic,
      DATE_FORMAT(s.birthdayStudent, '%Y-%m-%d') AS birthDay, s.navigator AS navigator, s.surnameParent AS parentSurname,
      s.nameParent AS parentName, s.patronymicParent AS parentPatronymic, s.\`E-mail\` AS email, s.phone
     FROM students s`;
  if (!letter || !String(letter).trim()) {
    const [rows] = await conn.query(baseSelect);
    return rows;
  }
  const [rows] = await conn.query(
    `${baseSelect} WHERE s.surnameStudent LIKE CONCAT(?, '%')`,
    [letter]
  );
  return rows;
}

/** get_students_by_letter_new: adds isActive (count of groups). Empty letter → all (same shape). */
async function fetchStudentsByLetterNew(conn, letter) {
  const baseSelect = `SELECT s.idStudent AS id, s.surnameStudent AS surname, s.nameStudent AS name, s.patronymicStudent AS patronymic,
      DATE_FORMAT(s.birthdayStudent, '%Y-%m-%d') AS birthDay, s.navigator AS navigator, s.surnameParent AS parentSurname,
      s.nameParent AS parentName, s.patronymicParent AS parentPatronymic, s.\`E-mail\` AS email, s.phone AS phone,
      (SELECT COUNT(*) FROM students_groups sg WHERE sg.idStudent = s.idStudent) AS isActive
     FROM students s`;
  if (!letter || !String(letter).trim()) {
    const [rows] = await conn.query(baseSelect);
    return rows;
  }
  const [rows] = await conn.query(
    `${baseSelect} WHERE s.surnameStudent LIKE CONCAT(?, '%')`,
    [letter]
  );
  return rows;
}

async function fetchGroupsByStudent(conn, studentId) {
  const [rows] = await conn.query(
    'SELECT g.idGroups AS id, g.name FROM `groups` g INNER JOIN students_groups sg ON g.idGroups = sg.idGroup WHERE sg.idStudent = ?',
    [studentId]
  );
  return rows;
}

async function fetchStudentsByGroupId(conn, groupId) {
  const [rows] = await conn.query(
    'SELECT s.idStudent AS id, CONCAT(s.surnameStudent, \' \', s.nameStudent) AS name FROM students s INNER JOIN students_groups sg ON s.idStudent = sg.idStudent WHERE sg.idGroup = ?',
    [groupId]
  );
  return rows;
}

async function fetchStudentFullInfByGroup(conn, groupId) {
  const [rows] = await conn.query(
    `SELECT s.idStudent AS id, s.surnameStudent AS surname, s.nameStudent AS name, s.patronymicStudent AS patronymic,
      DATE_FORMAT(s.birthdayStudent, '%Y-%m-%d') AS birthDay, s.navigator AS navigator, s.surnameParent AS parentSurname,
      s.nameParent AS parentName, s.patronymicParent AS parentPatronymic, s.\`E-mail\` AS email, s.phone
     FROM students s INNER JOIN students_groups sg ON s.idStudent = sg.idStudent WHERE sg.idGroup = ?`,
    [groupId]
  );
  return rows;
}

async function fetchStudentById(conn, id) {
  const [rows] = await conn.query(
    `SELECT s.idStudent AS id, s.surnameStudent AS surname, s.nameStudent AS name, s.patronymicStudent AS patronymic,
      DATE_FORMAT(s.birthdayStudent, '%Y-%m-%d') AS birthDay, s.navigator AS navigator, s.surnameParent AS parentSurname,
      s.nameParent AS parentName, s.patronymicParent AS parentPatronymic, s.\`E-mail\` AS email, s.phone
     FROM students s WHERE s.idStudent = ?`,
    [id]
  );
  return rows;
}

async function countStudentExist(conn, surname, name, patronymic) {
  const [rows] = await conn.query(
    'SELECT COUNT(*) AS amount FROM students s WHERE s.surnameStudent = ? AND s.nameStudent = ? AND s.patronymicStudent = ?',
    [surname, name, patronymic]
  );
  return rows[0].amount;
}

async function addStudentToGroupRow(conn, studentId, groupId) {
  await conn.query('INSERT INTO students_groups (idStudent, idGroup) VALUES (?, ?)', [studentId, groupId]);
}

async function addStudentRow(conn, data) {
  const [r] = await conn.query(
    'INSERT INTO students (surnameStudent, nameStudent, patronymicStudent, birthdayStudent, navigator, surnameParent, nameParent, patronymicParent, `E-mail`, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [data.surname, data.name, data.patronymic, data.birthDay, data.navigator ?? 0, data.parentSurname, data.parentName, data.parentPatronymic, data.email, data.phone]
  );
  return r.insertId;
}

async function updateStudentRow(conn, id, data) {
  const [r] = await conn.query(
    'UPDATE students SET surnameStudent = ?, nameStudent = ?, patronymicStudent = ?, birthdayStudent = ?, navigator = ?, surnameParent = ?, nameParent = ?, patronymicParent = ?, `E-mail` = ?, phone = ? WHERE idStudent = ?',
    [data.surname, data.name, data.patronymic, data.birthDay, data.navigator ?? 0, data.parentSurname, data.parentName, data.parentPatronymic, data.email, data.phone, id]
  );
  return r.affectedRows;
}

async function updateStudentToGroupRow(conn, studentId, oldGroupId, newGroupId) {
  const [r] = await conn.query(
    'UPDATE students_groups SET idGroup = ? WHERE idStudent = ? AND idGroup = ?',
    [newGroupId, studentId, oldGroupId]
  );
  return r.affectedRows;
}

async function deleteStudentFromGroupRow(conn, studentId, groupId) {
  const [r] = await conn.query('DELETE FROM students_groups WHERE idStudent = ? AND idGroup = ?', [studentId, groupId]);
  return r.affectedRows;
}

function sendSuccess(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

function sendError(res, status, error) {
  res.status(status).json({ success: false, error });
}

exports.searchByLetter = async (req, res) => {
  const letter = req.params.letter;
  try {
    const rows = await withConnection((conn) => fetchStudentsByLetter(conn, letter ?? ''));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('searchByLetter:', err);
    sendError(res, 500, 'Не удалось выполнить поиск.');
  }
};

exports.searchByLetterNew = async (req, res) => {
  const letter = req.params.letter;
  try {
    const rows = await withConnection((conn) => fetchStudentsByLetterNew(conn, letter ?? ''));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('searchByLetterNew:', err);
    sendError(res, 500, 'Не удалось выполнить поиск.');
  }
};

exports.getGroupsByStudent = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id студента.');
  try {
    const rows = await withConnection((conn) => fetchGroupsByStudent(conn, id));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getGroupsByStudent:', err);
    sendError(res, 500, 'Не удалось получить группы.');
  }
};

exports.getByGroupId = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id группы.');
  try {
    const rows = await withConnection((conn) => fetchStudentsByGroupId(conn, id));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getByGroupId:', err);
    sendError(res, 500, 'Не удалось получить список.');
  }
};

exports.getFullInfByGroup = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id группы.');
  try {
    const rows = await withConnection((conn) => fetchStudentFullInfByGroup(conn, id));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getFullInfByGroup:', err);
    sendError(res, 500, 'Не удалось получить данные.');
  }
};

exports.getById = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  try {
    const rows = await withConnection((conn) => fetchStudentById(conn, id));
    if (rows.length === 0) return sendError(res, 404, 'Студент не найден.');
    sendSuccess(res, rows[0]);
  } catch (err) {
    console.error('getById:', err);
    sendError(res, 500, 'Не удалось получить данные.');
  }
};

/** PUT body: { surname, name, patronymic } -> { amount } */
exports.checkExist = async (req, res) => {
  const check = requireBodyKeys(req.body, ['surname', 'name', 'patronymic']);
  if (!check.valid) return sendError(res, 400, check.message);
  const { surname, name, patronymic } = req.body;
  try {
    const amount = await withConnection((conn) => countStudentExist(conn, surname, name, patronymic));
    sendSuccess(res, { amount });
  } catch (err) {
    console.error('checkExist:', err);
    sendError(res, 500, 'Не удалось проверить.');
  }
};

/** POST body: { student_id, group_id } */
exports.addToGroup = async (req, res) => {
  const { student_id, group_id } = req.body || {};
  const studentId = parsePositiveId(student_id);
  const groupId = parsePositiveId(group_id);
  if (studentId == null || groupId == null) return sendError(res, 400, 'Нужны student_id и group_id.');
  try {
    await withConnection((conn) => addStudentToGroupRow(conn, studentId, groupId));
    sendSuccess(res, { ok: true }, 201);
  } catch (err) {
    console.error('addToGroup:', err);
    sendError(res, 500, 'Не удалось добавить в группу.');
  }
};

/** POST body: surname, name, patronymic, birthDay, navigator?, parentSurname, parentName, parentPatronymic, email, phone */
exports.addStudent = async (req, res) => {
  const check = requireBodyKeys(req.body, ['surname', 'name', 'patronymic', 'birthDay', 'parentSurname', 'parentName', 'parentPatronymic', 'email', 'phone']);
  if (!check.valid) return sendError(res, 400, check.message);
  const b = req.body;
  try {
    const id = await withConnection((conn) => addStudentRow(conn, b));
    sendSuccess(res, { id }, 201);
  } catch (err) {
    console.error('addStudent:', err);
    sendError(res, 500, 'Не удалось добавить студента.');
  }
};

/** PUT body: id + same fields as add */
exports.updateStudent = async (req, res) => {
  const check = requireBodyKeys(req.body, ['id', 'surname', 'name', 'patronymic', 'birthDay', 'parentSurname', 'parentName', 'parentPatronymic', 'email', 'phone']);
  if (!check.valid) return sendError(res, 400, check.message);
  const id = parsePositiveId(req.body.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const b = req.body;
  try {
    const affected = await withConnection((conn) => updateStudentRow(conn, id, b));
    if (affected === 0) return sendError(res, 404, 'Студент не найден.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('updateStudent:', err);
    sendError(res, 500, 'Не удалось обновить.');
  }
};

/** PUT body: { student_id, old_group_id, new_group_id } */
exports.updateStudentToGroup = async (req, res) => {
  const { student_id, old_group_id, new_group_id } = req.body || {};
  const studentId = parsePositiveId(student_id);
  const oldGroupId = parsePositiveId(old_group_id);
  const newGroupId = parsePositiveId(new_group_id);
  if (studentId == null || oldGroupId == null || newGroupId == null) return sendError(res, 400, 'Нужны student_id, old_group_id, new_group_id.');
  try {
    const affected = await withConnection((conn) => updateStudentToGroupRow(conn, studentId, oldGroupId, newGroupId));
    if (affected === 0) return sendError(res, 404, 'Связь не найдена.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('updateStudentToGroup:', err);
    sendError(res, 500, 'Не удалось обновить.');
  }
};

/** DELETE body or query: student_id, group_id */
exports.deleteFromGroup = async (req, res) => {
  const student_id = req.body?.student_id ?? req.query?.student_id;
  const group_id = req.body?.group_id ?? req.query?.group_id;
  const studentId = parsePositiveId(student_id);
  const groupId = parsePositiveId(group_id);
  if (studentId == null || groupId == null) return sendError(res, 400, 'Нужны student_id и group_id.');
  try {
    const affected = await withConnection((conn) => deleteStudentFromGroupRow(conn, studentId, groupId));
    if (affected === 0) return sendError(res, 404, 'Связь не найдена.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('deleteFromGroup:', err);
    sendError(res, 500, 'Не удалось удалить из группы.');
  }
};

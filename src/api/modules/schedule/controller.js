const { withConnection } = require('../../helpers/db');
const { parsePositiveId } = require('../../helpers/validation');

async function fetchSchedule(conn) {
  const [rows] = await conn.query(`
    SELECT
      s.idlesson AS id,
      room.name AS room,
      g.name AS \`group\`,
      s.startTime,
      s.endTime,
      weekday.name AS day,
      employees.id_employees AS id_employees
    FROM \`schedule\` s
    LEFT JOIN employees_schedule es ON s.idlesson = es.idSchedule
    LEFT JOIN employees ON es.idEmployees = employees.id_employees
    INNER JOIN room ON es.room = room.id
    INNER JOIN \`groups\` g ON s.\`group\` = g.idGroups
    INNER JOIN weekday ON s.day = weekday.idDay
    ORDER BY s.day, s.startTime
  `);
  return rows;
}

async function fetchScheduleByTeacher(conn, teacherId) {
  const [rows] = await conn.query(`
    SELECT room.name AS room, g.name AS \`group\`, s.startTime, s.endTime, weekday.name AS day,
      CONCAT(e.second_name, ' ', LEFT(e.first_name, 1), '.', LEFT(e.patronymic, 1)) AS name
    FROM \`schedule\` s
    LEFT JOIN employees_schedule es ON s.idlesson = es.idSchedule
    LEFT JOIN employees e ON es.idEmployees = e.id_employees
    INNER JOIN room ON es.room = room.id
    INNER JOIN \`groups\` g ON s.\`group\` = g.idGroups
    INNER JOIN weekday ON s.day = weekday.idDay
    WHERE e.id_employees = ?
    ORDER BY s.day, s.startTime
  `, [teacherId]);
  return rows;
}

async function fetchScheduleByGroup(conn, groupId) {
  const [rows] = await conn.query(`
    SELECT room.name AS room, g.name AS \`group\`, s.startTime, s.endTime, weekday.name AS day,
      CONCAT(e.second_name, ' ', LEFT(e.first_name, 1), '.', LEFT(e.patronymic, 1)) AS name
    FROM \`schedule\` s
    LEFT JOIN employees_schedule es ON s.idlesson = es.idSchedule
    LEFT JOIN employees e ON es.idEmployees = e.id_employees
    INNER JOIN room ON es.room = room.id
    INNER JOIN \`groups\` g ON s.\`group\` = g.idGroups
    INNER JOIN weekday ON s.day = weekday.idDay
    WHERE g.idGroups = ?
    ORDER BY s.day, s.startTime
  `, [groupId]);
  return rows;
}

async function fetchScheduleByRoom(conn, roomId) {
  const [rows] = await conn.query(`
    SELECT room.name AS room, g.name AS \`group\`, s.startTime, s.endTime, weekday.name AS day,
      CONCAT(e.second_name, ' ', LEFT(e.first_name, 1), '.', LEFT(e.patronymic, 1)) AS name
    FROM \`schedule\` s
    LEFT JOIN employees_schedule es ON s.idlesson = es.idSchedule
    LEFT JOIN employees e ON es.idEmployees = e.id_employees
    INNER JOIN room ON es.room = room.id
    INNER JOIN \`groups\` g ON s.\`group\` = g.idGroups
    INNER JOIN weekday ON s.day = weekday.idDay
    WHERE room.id = ?
    ORDER BY s.day, s.startTime
  `, [roomId]);
  return rows;
}

async function fetchScheduleByDate(conn, date, roomId) {
  const [rows] = await conn.query(`
    SELECT g.name AS name, s.startTime, s.endTime
    FROM \`schedule\` s
    LEFT JOIN employees_schedule es ON s.idlesson = es.idSchedule
    INNER JOIN room ON es.room = room.id
    INNER JOIN \`groups\` g ON s.\`group\` = g.idGroups
    WHERE DAYOFWEEK(?) = s.day AND room.id = ?
  `, [date, roomId]);
  return rows;
}

async function fetchTeachers(conn) {
  const [rows] = await conn.query(
    `SELECT id_employees AS id, CONCAT(second_name, ' ', LEFT(first_name, 1), '.', LEFT(patronymic, 1)) AS name FROM employees WHERE position = 2`
  );
  return rows;
}

async function fetchGroups(conn) {
  const [rows] = await conn.query('SELECT idGroups AS id, name FROM `groups`');
  return rows;
}

async function addScheduleRow(conn, roomId, groupId, startTime, endTime, day, employeeId) {
  const [ins] = await conn.query(
    'INSERT INTO `schedule` (`group`, startTime, endTime, `day`) VALUES (?, ?, ?, ?)',
    [groupId, startTime, endTime, day]
  );
  const scheduleId = ins.insertId;
  await conn.query(
    'INSERT INTO employees_schedule (idEmployees, idSchedule, room) VALUES (?, ?, ?)',
    [employeeId, scheduleId, roomId]
  );
  return scheduleId;
}

async function updateScheduleRow(conn, id, roomId, groupId, startTime, endTime) {
  await conn.query(
    'UPDATE `schedule` SET `group` = ?, startTime = ?, endTime = ? WHERE idlesson = ?',
    [groupId, startTime, endTime, id]
  );
  await conn.query('UPDATE employees_schedule SET room = ? WHERE idSchedule = ?', [roomId, id]);
}

async function deleteScheduleRow(conn, id) {
  await conn.query('DELETE FROM employees_schedule WHERE idSchedule = ?', [id]);
  const [r] = await conn.query('DELETE FROM `schedule` WHERE idlesson = ?', [id]);
  return r.affectedRows;
}

function sendSuccess(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

function sendError(res, status, error) {
  res.status(status).json({ success: false, error });
}

exports.getSchedule = async (req, res) => {
  try {
    const rows = await withConnection(fetchSchedule);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getSchedule:', err);
    sendError(res, 500, 'Не удалось получить расписание.');
  }
};

exports.getScheduleByTeacher = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id преподавателя.');
  try {
    const rows = await withConnection((conn) => fetchScheduleByTeacher(conn, id));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getScheduleByTeacher:', err);
    sendError(res, 500, 'Не удалось получить расписание.');
  }
};

exports.getScheduleByGroup = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id группы.');
  try {
    const rows = await withConnection((conn) => fetchScheduleByGroup(conn, id));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getScheduleByGroup:', err);
    sendError(res, 500, 'Не удалось получить расписание.');
  }
};

exports.getScheduleByRoom = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id комнаты.');
  try {
    const rows = await withConnection((conn) => fetchScheduleByRoom(conn, id));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getScheduleByRoom:', err);
    sendError(res, 500, 'Не удалось получить расписание.');
  }
};

exports.getScheduleByDate = async (req, res) => {
  const { date, room_id: roomId } = req.body || {};
  const room = parsePositiveId(roomId);
  if (!date || room == null) return sendError(res, 400, 'В теле запроса нужны date и room_id.');
  try {
    const rows = await withConnection((conn) => fetchScheduleByDate(conn, date, room));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getScheduleByDate:', err);
    sendError(res, 500, 'Не удалось получить расписание.');
  }
};

exports.getTeachers = async (req, res) => {
  try {
    const rows = await withConnection(fetchTeachers);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getTeachers:', err);
    sendError(res, 500, 'Не удалось получить список преподавателей.');
  }
};

exports.getGroups = async (req, res) => {
  try {
    const rows = await withConnection(fetchGroups);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getGroups:', err);
    sendError(res, 500, 'Не удалось получить список групп.');
  }
};

exports.addSchedule = async (req, res) => {
  const { room_id, group_id, start_time, end_time, day, employee_id } = req.body || {};
  const roomId = parsePositiveId(room_id);
  const groupId = parsePositiveId(group_id);
  const dayNum = parsePositiveId(day);
  const employeeId = parsePositiveId(employee_id);
  if (roomId == null || groupId == null || dayNum == null || employeeId == null || !start_time || !end_time) {
    return sendError(res, 400, 'Нужны: room_id, group_id, start_time, end_time, day, employee_id.');
  }
  try {
    const id = await withConnection((conn) =>
      addScheduleRow(conn, roomId, groupId, start_time, end_time, dayNum, employeeId)
    );
    sendSuccess(res, { id }, 201);
  } catch (err) {
    console.error('addSchedule:', err);
    sendError(res, 500, 'Не удалось добавить занятие.');
  }
};

exports.updateSchedule = async (req, res) => {
  const { id, room_id, group_id, start_time, end_time } = req.body || {};
  const scheduleId = parsePositiveId(id);
  const roomId = parsePositiveId(room_id);
  const groupId = parsePositiveId(group_id);
  if (scheduleId == null || roomId == null || groupId == null || !start_time || !end_time) {
    return sendError(res, 400, 'Нужны: id, room_id, group_id, start_time, end_time.');
  }
  try {
    await withConnection((conn) =>
      updateScheduleRow(conn, scheduleId, roomId, groupId, start_time, end_time)
    );
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('updateSchedule:', err);
    sendError(res, 500, 'Не удалось обновить занятие.');
  }
};

exports.deleteSchedule = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  try {
    const affected = await withConnection((conn) => deleteScheduleRow(conn, id));
    if (affected === 0) return sendError(res, 404, 'Занятие не найдено.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('deleteSchedule:', err);
    sendError(res, 500, 'Не удалось удалить занятие.');
  }
};

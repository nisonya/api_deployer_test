const { withConnection } = require('../../helpers/db');
const { parsePositiveId } = require('../../helpers/validation');

async function fetchRentByEvent(conn, eventId) {
  const [rows] = await conn.query(
    `SELECT r.id AS id_rent, r.id_event AS id_event, r.start_time, r.end_time,
      DATE_FORMAT(r.date, '%Y-%m-%d') AS date, CONCAT(ro.name, ' ', ro.number) AS name
     FROM rent r
     INNER JOIN room ro ON r.id_room = ro.id
     WHERE r.id_event = ?`,
    [eventId]
  );
  return rows;
}

async function fetchRentById(conn, id) {
  const [rows] = await conn.query(
    `SELECT r.id AS id_rent, r.id_event AS id_event, r.start_time, r.end_time,
      DATE_FORMAT(r.date, '%Y-%m-%d') AS date, CONCAT(ro.name, ' ', ro.number) AS name
     FROM rent r
     INNER JOIN room ro ON r.id_room = ro.id
     WHERE r.id = ?`,
    [id]
  );
  return rows;
}

/** By date and room (like get_rent_by_date_and_room_new: id_rent, id_room, id_event, start_time, end_time, date, name) */
async function fetchRentByDateAndRoom(conn, date, roomId) {
  const [rows] = await conn.query(
    `SELECT r.id AS id_rent, r.id_room AS id_room, r.id_event AS id_event, r.start_time, r.end_time,
      DATE_FORMAT(r.date, '%Y-%m-%d') AS date, eo.name
     FROM rent r
     INNER JOIN event_plan_organization eo ON eo.id = r.id_event
     WHERE r.id_room = ? AND r.date = ?`,
    [roomId, date]
  );
  return rows;
}

async function insertRent(conn, eventId, roomId, date, startTime, endTime) {
  const [r] = await conn.query(
    'INSERT INTO rent (id_event, id_room, date, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
    [eventId, roomId, date, startTime, endTime]
  );
  return r.insertId;
}

async function updateRentRow(conn, id, eventId, roomId, date, startTime, endTime) {
  const [r] = await conn.query(
    'UPDATE rent SET id_event = ?, id_room = ?, date = ?, start_time = ?, end_time = ? WHERE id = ?',
    [eventId, roomId, date, startTime, endTime, id]
  );
  return r.affectedRows;
}

async function deleteRentRow(conn, id) {
  const [r] = await conn.query('DELETE FROM rent WHERE id = ?', [id]);
  return r.affectedRows;
}

function sendSuccess(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

function sendError(res, status, error) {
  res.status(status).json({ success: false, error });
}

exports.getByEvent = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id мероприятия.');
  try {
    const rows = await withConnection((conn) => fetchRentByEvent(conn, id));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getByEvent:', err);
    sendError(res, 500, 'Не удалось получить аренду.');
  }
};

exports.getById = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  try {
    const rows = await withConnection((conn) => fetchRentById(conn, id));
    if (rows.length === 0) return sendError(res, 404, 'Аренда не найдена.');
    sendSuccess(res, rows[0]);
  } catch (err) {
    console.error('getById:', err);
    sendError(res, 500, 'Не удалось получить аренду.');
  }
};

/** POST body: { date, room_id } */
exports.getByDateAndRoom = async (req, res) => {
  const { date, room_id } = req.body || {};
  const roomId = parsePositiveId(room_id);
  if (!date || roomId == null) return sendError(res, 400, 'В теле запроса нужны date и room_id.');
  try {
    const rows = await withConnection((conn) => fetchRentByDateAndRoom(conn, date, roomId));
    sendSuccess(res, rows);
  } catch (err) {
    console.error('getByDateAndRoom:', err);
    sendError(res, 500, 'Не удалось получить аренду.');
  }
};

/** POST body: { event_id, room_id, date, start_time, end_time } */
exports.newRent = async (req, res) => {
  const { event_id, room_id, date, start_time, end_time } = req.body || {};
  const eventId = parsePositiveId(event_id);
  const roomId = parsePositiveId(room_id);
  if (eventId == null || roomId == null || !date || !start_time || !end_time) {
    return sendError(res, 400, 'Нужны: event_id, room_id, date, start_time, end_time.');
  }
  try {
    const id = await withConnection((conn) =>
      insertRent(conn, eventId, roomId, date, start_time, end_time)
    );
    sendSuccess(res, { id }, 201);
  } catch (err) {
    console.error('newRent:', err);
    sendError(res, 500, 'Не удалось создать аренду.');
  }
};

/** PUT body: { id, event_id, room_id, date, start_time, end_time } */
exports.updateRent = async (req, res) => {
  const { id, event_id, room_id, date, start_time, end_time } = req.body || {};
  const rentId = parsePositiveId(id);
  const eventId = parsePositiveId(event_id);
  const roomId = parsePositiveId(room_id);
  if (rentId == null || eventId == null || roomId == null || !date || !start_time || !end_time) {
    return sendError(res, 400, 'Нужны: id, event_id, room_id, date, start_time, end_time.');
  }
  try {
    const affected = await withConnection((conn) =>
      updateRentRow(conn, rentId, eventId, roomId, date, start_time, end_time)
    );
    if (affected === 0) return sendError(res, 404, 'Аренда не найдена.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('updateRent:', err);
    sendError(res, 500, 'Не удалось обновить аренду.');
  }
};

exports.deleteRent = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  try {
    const affected = await withConnection((conn) => deleteRentRow(conn, id));
    if (affected === 0) return sendError(res, 404, 'Аренда не найдена.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('deleteRent:', err);
    sendError(res, 500, 'Не удалось удалить аренду.');
  }
};

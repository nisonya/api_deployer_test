const { withConnection } = require('../../helpers/db');

async function fetchRooms(conn) {
  const [rows] = await conn.query('SELECT id, CONCAT(name, " ", number) AS name FROM room');
  return rows;
}

async function fetchAccess(conn) {
  const [rows] = await conn.query('SELECT id, discription AS name FROM access_level');
  return rows;
}

async function fetchPositions(conn) {
  const [rows] = await conn.query('SELECT id, name FROM position');
  return rows;
}

async function fetchDocs(conn) {
  const [rows] = await conn.query('SELECT * FROM documents');
  return rows;
}

async function fetchTypesOfHolding(conn) {
  const [rows] = await conn.query('SELECT * FROM form_of_holding');
  return rows;
}

/** part event levels (type_of_part_event) */
async function fetchLevels(conn) {
  const [rows] = await conn.query('SELECT id, type AS name FROM type_of_part_event');
  return rows;
}

function sendSuccess(res, data) {
  res.json({ success: true, data });
}

function sendError(res, status, error) {
  res.status(status).json({ success: false, error });
}

exports.getRooms = async (req, res) => {
  try {
    const rows = await withConnection(fetchRooms);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('Ошибка получения комнат:', err);
    sendError(res, 500, 'Не удалось получить список комнат.');
  }
};

exports.getAccess = async (req, res) => {
  try {
    const rows = await withConnection(fetchAccess);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('Ошибка получения уровней доступа:', err);
    sendError(res, 500, 'Не удалось получить уровни доступа.');
  }
};

exports.getPositions = async (req, res) => {
  try {
    const rows = await withConnection(fetchPositions);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('Ошибка получения должностей:', err);
    sendError(res, 500, 'Не удалось получить список должностей.');
  }
};

exports.getDocs = async (req, res) => {
  try {
    const rows = await withConnection(fetchDocs);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('Ошибка получения документов:', err);
    sendError(res, 500, 'Не удалось получить список документов.');
  }
};

exports.getTypesOfHolding = async (req, res) => {
  try {
    const rows = await withConnection(fetchTypesOfHolding);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('Ошибка получения форматов проведения:', err);
    sendError(res, 500, 'Не удалось получить форматы проведения.');
  }
};

exports.getLevels = async (req, res) => {
  try {
    const rows = await withConnection(fetchLevels);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('Ошибка получения уровней мероприятий (part):', err);
    sendError(res, 500, 'Не удалось получить уровни.');
  }
};

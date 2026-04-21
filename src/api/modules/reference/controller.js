const { withConnection } = require('../../helpers/db');
const { parsePositiveId } = require('../../helpers/validation');
const { sendSuccess, sendError } = require('../../helpers/http');
const ADMIN_ACCESS_LEVELS = [1, 4, 6];

function hasDocumentsWriteAccess(req) {
  const level = req && req.user ? Number(req.user.accessLevel) : NaN;
  return !isNaN(level) && ADMIN_ACCESS_LEVELS.indexOf(level) >= 0;
}

async function fetchRooms(conn) {
  const [rows] = await conn.query('SELECT id, CONCAT(name, " ", number) AS name FROM room');
  return rows;
}

async function fetchAccess(conn) {
  const [rows] = await conn.query('SELECT id, discription AS name FROM access_level');
  return rows;
}

async function fetchPositions(conn) {
  const [rows] = await conn.query('SELECT id, name FROM `position`');
  return rows;
}

async function fetchDocs(conn) {
  const [rows] = await conn.query('SELECT id, name, link FROM documents ORDER BY id ASC');
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

/** student statuses for part events (event_part_student_status) */
async function fetchStudentStatuses(conn) {
  const [rows] = await conn.query('SELECT id, name FROM event_part_student_status ORDER BY id ASC');
  return rows;
}

/** org event types (types_of_organization) */
async function fetchTypesOfOrganization(conn) {
  const [rows] = await conn.query(
    'SELECT id_type AS id, name FROM types_of_organization ORDER BY id_type ASC'
  );
  return rows;
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

exports.addDoc = async (req, res) => {
  if (!hasDocumentsWriteAccess(req)) return sendError(res, 403, 'Недостаточно прав для изменения документов.');
  const name = (req.body?.name || '').trim();
  const link = (req.body?.link || '').trim();
  if (!name) return sendError(res, 400, 'Укажите название документа (name).');
  if (!link) return sendError(res, 400, 'Укажите ссылку документа (link).');
  try {
    const [r] = await withConnection((conn) =>
      conn.query('INSERT INTO documents (name, link) VALUES (?, ?)', [name, link])
    );
    sendSuccess(res, { id: r.insertId }, 201);
  } catch (err) {
    console.error('addDoc:', err);
    sendError(res, 500, 'Не удалось добавить документ.');
  }
};

exports.updateDoc = async (req, res) => {
  if (!hasDocumentsWriteAccess(req)) return sendError(res, 403, 'Недостаточно прав для изменения документов.');
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const name = (req.body?.name || '').trim();
  const link = (req.body?.link || '').trim();
  if (!name) return sendError(res, 400, 'Укажите название документа (name).');
  if (!link) return sendError(res, 400, 'Укажите ссылку документа (link).');
  try {
    const [r] = await withConnection((conn) =>
      conn.query('UPDATE documents SET name = ?, link = ? WHERE id = ?', [name, link, id])
    );
    if (r.affectedRows === 0) return sendError(res, 404, 'Документ не найден.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('updateDoc:', err);
    sendError(res, 500, 'Не удалось обновить документ.');
  }
};

exports.deleteDoc = async (req, res) => {
  if (!hasDocumentsWriteAccess(req)) return sendError(res, 403, 'Недостаточно прав для изменения документов.');
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  try {
    const [r] = await withConnection((conn) =>
      conn.query('DELETE FROM documents WHERE id = ?', [id])
    );
    if (r.affectedRows === 0) return sendError(res, 404, 'Документ не найден.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('deleteDoc:', err);
    sendError(res, 500, 'Не удалось удалить документ.');
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

exports.getTypesOfOrganization = async (req, res) => {
  try {
    const rows = await withConnection(fetchTypesOfOrganization);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('Ошибка получения типов организации:', err);
    sendError(res, 500, 'Не удалось получить типы организации.');
  }
};

exports.getAccessByEmployee = async (req, res) => {
  const empId = parsePositiveId(req.params.employeeId);
  if (empId == null) return sendError(res, 400, 'Некорректный id сотрудника.');
  try {
    const [rows] = await withConnection((conn) =>
      conn.query('SELECT access_level_id FROM profile WHERE employee_id = ?', [empId])
    );
    if (rows.length === 0) return sendError(res, 404, 'Профиль сотрудника не найден.');
    sendSuccess(res, { access_level_id: rows[0].access_level_id });
  } catch (err) {
    console.error('Ошибка получения уровня доступа сотрудника:', err);
    sendError(res, 500, 'Не удалось получить уровень доступа.');
  }
};

exports.getStudentStatuses = async (req, res) => {
  try {
    const rows = await withConnection(fetchStudentStatuses);
    sendSuccess(res, rows);
  } catch (err) {
    console.error('Ошибка получения статусов учеников:', err);
    sendError(res, 500, 'Не удалось получить статусы учеников.');
  }
};

/* ──────── CRUD должностей ──────── */

exports.addPosition = async (req, res) => {
  const name = (req.body?.name || '').trim();
  if (!name) return sendError(res, 400, 'Укажите name (название должности).');
  try {
    const [r] = await withConnection((conn) =>
      conn.query('INSERT INTO `position` (name) VALUES (?)', [name])
    );
    sendSuccess(res, { id: r.insertId }, 201);
  } catch (err) {
    console.error('addPosition:', err);
    sendError(res, 500, 'Не удалось создать должность.');
  }
};

exports.updatePosition = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  const name = (req.body?.name || '').trim();
  if (!name) return sendError(res, 400, 'Укажите name (название должности).');
  try {
    const [r] = await withConnection((conn) =>
      conn.query('UPDATE `position` SET name = ? WHERE id = ?', [name, id])
    );
    if (r.affectedRows === 0) return sendError(res, 404, 'Должность не найдена.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('updatePosition:', err);
    sendError(res, 500, 'Не удалось обновить должность.');
  }
};

exports.deletePosition = async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (id == null) return sendError(res, 400, 'Некорректный id.');
  try {
    const [activeCounts] = await withConnection((conn) =>
      conn.query('SELECT COUNT(*) AS cnt FROM employees WHERE `position` = ? AND is_active = 1', [id])
    );
    if (activeCounts[0].cnt > 0) {
      return sendError(res, 409, 'Невозможно удалить: к должности привязаны активные сотрудники. Сначала переназначьте их.');
    }
    await withConnection((conn) =>
      conn.query('UPDATE employees SET `position` = NULL WHERE `position` = ? AND is_active = 0', [id])
    );
    const [r] = await withConnection((conn) =>
      conn.query('DELETE FROM `position` WHERE id = ?', [id])
    );
    if (r.affectedRows === 0) return sendError(res, 404, 'Должность не найдена.');
    sendSuccess(res, { ok: true });
  } catch (err) {
    console.error('deletePosition:', err);
    sendError(res, 500, 'Не удалось удалить должность.');
  }
};

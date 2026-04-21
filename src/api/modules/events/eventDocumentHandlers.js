const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const crypto = require('crypto');
const { withConnection } = require('../../helpers/db');
const { parsePositiveId, optionalInt } = require('../../helpers/validation');
const { sendSuccess, sendError } = require('../../helpers/http');
const { getDbConfig } = require('../../../common/envLoader');

const MAX_FILE_BYTES = 50 * 1024 * 1024;

/**
 * @typedef {{
 *   table: string,
 *   eventTable: string,
 *   rootConfigKey: 'documentsRootOrg' | 'documentsRootPart',
 *   label: string
 * }} DocumentKindConfig
 */

function getRootAbs(configKey) {
  const r = getDbConfig()[configKey];
  return r ? String(r).trim() : '';
}

/** Относительный путь в БД: только безопасные сегменты */
function safeOriginalFilename(name) {
  const base = path.basename(name || 'file');
  const cleaned = base.replace(/[^\w.\- ()\u0400-\u04FF]/g, '_').slice(0, 200);
  return cleaned || 'file';
}

/**
 * Проверяет, что абсолютный путь к файлу лежит внутри root.
 */
function isInsideRoot(rootAbs, absoluteFilePath) {
  const root = path.resolve(rootAbs);
  const file = path.resolve(absoluteFilePath);
  const rel = path.relative(root, file);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function absoluteFromStorageRoot(rootAbs, storagePathPosix) {
  if (!storagePathPosix || String(storagePathPosix).includes('..')) return null;
  const parts = String(storagePathPosix).split('/').filter(Boolean);
  const joined = path.join(rootAbs, ...parts);
  return isInsideRoot(rootAbs, joined) ? joined : null;
}

/**
 * @param {DocumentKindConfig} cfg
 */
function createHandlers(cfg) {
  const { table, eventTable, rootConfigKey, label } = cfg;

  async function assertEventExists(conn, eventId) {
    const [rows] = await conn.query(`SELECT id FROM ${eventTable} WHERE id = ? LIMIT 1`, [eventId]);
    return rows.length > 0;
  }

  return {
    MAX_FILE_BYTES,

    async list(req, res) {
      const eventId = parsePositiveId(req.params.eventId);
      if (eventId == null) return sendError(res, 400, 'Некорректный id мероприятия.');
      const root = getRootAbs(rootConfigKey);
      if (!root) {
        return sendError(res, 503, `Корневой каталог документов (${label}) не настроен в конфигурации API.`);
      }
      try {
        const out = await withConnection(async (conn) => {
          const exists = await assertEventExists(conn, eventId);
          if (!exists) return { code: 404, error: 'Мероприятие не найдено.' };
          const [rows] = await conn.query(
            `SELECT id, id_event, storage_path, original_filename, mime_type, size_bytes, uploaded_by_profile_id, sort_order, created_at
             FROM ${table} WHERE id_event = ? ORDER BY sort_order ASC, id ASC`,
            [eventId]
          );
          return { data: rows };
        });
        if (out.code) return sendError(res, out.code, out.error);
        sendSuccess(res, out.data);
      } catch (err) {
        console.error(`${label} documents list:`, err);
        sendError(res, 500, 'Не удалось получить список документов.');
      }
    },

    async upload(req, res) {
      const eventId = parsePositiveId(req.params.eventId);
      if (eventId == null) return sendError(res, 400, 'Некорректный id мероприятия.');
      if (!req.file || !req.file.buffer) {
        return sendError(res, 400, 'Прикрепите файл в поле multipart с именем «file».');
      }
      const root = getRootAbs(rootConfigKey);
      if (!root) {
        return sendError(res, 503, `Корневой каталог документов (${label}) не настроен в конфигурации API.`);
      }
      const original = safeOriginalFilename(req.file.originalname);
      const relDir = `${eventId}`;
      const unique = `${crypto.randomUUID()}_${original}`;
      const storagePath = `${relDir}/${unique}`.replace(/\\/g, '/');
      const absDir = path.join(root, relDir);
      const absFile = path.join(absDir, unique);

      if (!isInsideRoot(root, absFile)) return sendError(res, 400, 'Некорректный путь сохранения.');

      try {
        await fsp.mkdir(absDir, { recursive: true });
        await fsp.writeFile(absFile, req.file.buffer);

        const insertResult = await withConnection(async (conn) => {
          const exists = await assertEventExists(conn, eventId);
          if (!exists) {
            await fsp.rm(absFile, { force: true });
            return { code: 404, error: 'Мероприятие не найдено.' };
          }
          const [[{ maxSort }]] = await conn.query(
            `SELECT COALESCE(MAX(sort_order), 0) AS maxSort FROM ${table} WHERE id_event = ?`,
            [eventId]
          );
          const sortOrder = Number(maxSort) + 1;
          const mime = req.file.mimetype || null;
          const size = req.file.size ?? req.file.buffer.length;
          const profileId = req.user?.id ?? null;
          const [r] = await conn.query(
            `INSERT INTO ${table} (id_event, storage_path, original_filename, mime_type, size_bytes, uploaded_by_profile_id, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [eventId, storagePath, original, mime, size, profileId, sortOrder]
          );
          return { insertId: r.insertId, sortOrder };
        });

        if (insertResult.code) return sendError(res, insertResult.code, insertResult.error);

        sendSuccess(res, {
          id: insertResult.insertId,
          id_event: eventId,
          storage_path: storagePath,
          original_filename: original,
          mime_type: req.file.mimetype || null,
          size_bytes: req.file.size ?? req.file.buffer.length,
          uploaded_by_profile_id: req.user?.id ?? null,
          sort_order: insertResult.sortOrder
        }, 201);
      } catch (err) {
        console.error(`${label} documents upload:`, err);
        try {
          await fsp.rm(absFile, { force: true });
        } catch {
          /* ignore */
        }
        sendError(res, 500, 'Не удалось сохранить файл.');
      }
    },

    async download(req, res) {
      const docId = parsePositiveId(req.params.documentId);
      if (docId == null) return sendError(res, 400, 'Некорректный id документа.');
      const root = getRootAbs(rootConfigKey);
      if (!root) {
        return sendError(res, 503, `Корневой каталог документов (${label}) не настроен в конфигурации API.`);
      }
      try {
        const row = await withConnection(async (conn) => {
          const [rows] = await conn.query(
            `SELECT id, storage_path, original_filename, mime_type FROM ${table} WHERE id = ? LIMIT 1`,
            [docId]
          );
          return rows[0] || null;
        });
        if (!row) return sendError(res, 404, 'Документ не найден.');

        const abs = absoluteFromStorageRoot(root, row.storage_path);
        if (!abs) return sendError(res, 400, 'Некорректный путь в записи документа.');

        try {
          await fsp.access(abs, fs.constants.R_OK);
        } catch {
          return sendError(res, 404, 'Файл отсутствует на диске.');
        }

        const mime = row.mime_type || 'application/octet-stream';
        const safeName = safeOriginalFilename(row.original_filename);
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`);

        const stream = fs.createReadStream(abs);
        stream.on('error', (e) => {
          console.error(`${label} documents download stream:`, e);
          if (!res.headersSent) sendError(res, 500, 'Не удалось прочитать файл.');
        });
        stream.pipe(res);
      } catch (err) {
        console.error(`${label} documents download:`, err);
        sendError(res, 500, 'Не удалось отдать файл.');
      }
    },

    async remove(req, res) {
      const docId = parsePositiveId(req.params.documentId);
      if (docId == null) return sendError(res, 400, 'Некорректный id документа.');
      const root = getRootAbs(rootConfigKey);
      if (!root) {
        return sendError(res, 503, `Корневой каталог документов (${label}) не настроен в конфигурации API.`);
      }
      try {
        const result = await withConnection(async (conn) => {
          const [rows] = await conn.query(
            `SELECT id, storage_path FROM ${table} WHERE id = ? LIMIT 1`,
            [docId]
          );
          const row = rows[0];
          if (!row) return { code: 404, error: 'Документ не найден.' };
          await conn.query(`DELETE FROM ${table} WHERE id = ?`, [docId]);
          return { storage_path: row.storage_path };
        });
        if (result.code) return sendError(res, result.code, result.error);

        const abs = absoluteFromStorageRoot(root, result.storage_path);
        if (abs) {
          try {
            await fsp.unlink(abs);
          } catch {
            /* файл уже удалён — запись в БД всё равно удалена */
          }
        }
        sendSuccess(res, { ok: true });
      } catch (err) {
        console.error(`${label} documents remove:`, err);
        sendError(res, 500, 'Не удалось удалить документ.');
      }
    },

    async patchSort(req, res) {
      const docId = parsePositiveId(req.params.documentId);
      if (docId == null) return sendError(res, 400, 'Некорректный id документа.');
      const sortOrder = optionalInt(req.body?.sort_order);
      if (sortOrder == null || sortOrder < 0) {
        return sendError(res, 400, 'Укажите неотрицательное целое sort_order.');
      }
      try {
        const affected = await withConnection(async (conn) => {
          const [header] = await conn.query(`UPDATE ${table} SET sort_order = ? WHERE id = ?`, [sortOrder, docId]);
          return header.affectedRows;
        });
        if (!affected) return sendError(res, 404, 'Документ не найден.');
        sendSuccess(res, { ok: true });
      } catch (err) {
        console.error(`${label} documents patchSort:`, err);
        sendError(res, 500, 'Не удалось обновить порядок.');
      }
    }
  };
}

const orgHandlers = createHandlers({
  table: 'event_organization_document',
  eventTable: 'event_plan_organization',
  rootConfigKey: 'documentsRootOrg',
  label: 'организации'
});

const partHandlers = createHandlers({
  table: 'event_participation_document',
  eventTable: 'event_plan_participation',
  rootConfigKey: 'documentsRootPart',
  label: 'участия'
});

module.exports = {
  createHandlers,
  orgHandlers,
  partHandlers,
  MAX_FILE_BYTES
};

const { startApi, stopApi } = require('../api/app');
const { getDbConfig, setDbConfig, updateApiPort } = require('../common/config');
const { getPool } = require('../db/connection');
const fs = require('fs').promises;
const path = require('path');

/** Экспорт БД в SQL-файл. Без Electron — путь передаётся явно. onProgress(0..100) — опционально. */
async function exportSeed(filePath, onProgress) {
  if (!filePath) return { success: false, message: 'Не указан путь к файлу' };
  let conn = null;
  try {
    const pool = await getPool();
    conn = await pool.getConnection();
    if (onProgress) onProgress(0);
    const [tables] = await conn.query('SHOW TABLES');
    let dump = '-- Kvant seed dump\n\n';
    const total = tables.length;
    let processed = 0;
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const [rows] = await conn.query(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]);
        for (const row of rows) {
          const values = columns.map(col => conn.escape(row[col])).join(', ');
          dump += `INSERT INTO \`${tableName}\` (\`${columns.join('`, `')}\`) VALUES (${values});\n`;
        }
        dump += '\n';
      }
      processed++;
      if (onProgress) onProgress(Math.round((processed / total) * 100));
    }
    await fs.writeFile(filePath, dump, 'utf8');
    if (onProgress) onProgress(100);
    return { success: true, filePath };
  } catch (err) {
    return { success: false, message: err.message };
  } finally {
    if (conn) conn.release();
  }
}

/** Импорт БД из SQL-файла (только INSERT). Без Electron — путь передаётся явно. onProgress(0..100) — опционально. */
async function importSeed(filePath, onProgress) {
  if (!filePath) return { success: false, message: 'Не указан путь к файлу' };
  let conn = null;
  try {
    const sql = await fs.readFile(filePath, 'utf8');
    const lines = sql.split('\n');
    const insertLines = lines
      .map(line => line.trim())
      .filter(line => line.toUpperCase().startsWith('INSERT INTO'))
      .filter(line => line.endsWith(';'));
    if (insertLines.length === 0) {
      return { success: false, message: 'В файле не найдено ни одного INSERT-запроса' };
    }
    if (onProgress) onProgress(0);
    const pool = await getPool();
    conn = await pool.getConnection();
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');
    let processed = 0;
    const total = insertLines.length;
    for (const query of insertLines) {
      try {
        await conn.query(query);
        processed++;
        if (onProgress) onProgress(Math.round((processed / total) * 100));
        await new Promise(resolve => setImmediate(resolve));
      } catch (queryErr) {
        console.error(`Ошибка в запросе: ${query.substring(0, 100)}...`, queryErr.message);
      }
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
    if (onProgress) onProgress(100);
    return { success: true, processedInserts: processed };
  } catch (err) {
    return { success: false, message: err.message || 'Неизвестная ошибка при импорте' };
  } finally {
    if (conn) conn.release();
  }
}

function registerHandlers(mainWindow) {
  const { ipcMain, dialog } = require('electron');
  const { getApiServer, setApiServer } = require('./state');
  const { createSetupWindow, createBackupWindow } = require('./windows');

  function safeDbConfig(config) {
    return config ? { host: config.host, port: config.port, user: config.user, database: config.database, apiPort: config.apiPort } : null;
  }

  ipcMain.handle('get-api-status', () => ({ running: !!getApiServer() }));

  ipcMain.handle('get-db-config', async () => safeDbConfig(await getDbConfig()));
  ipcMain.handle('start-api', async () => {
    if (getApiServer()) return { success: false, message: 'API is running' };
    try {
      const config = await getDbConfig();
      const apiPort = config?.apiPort ?? 3000;
      const server = await startApi(apiPort);
      setApiServer(server);
      return { success: true, message: 'API is running' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('stop-api', async () => {
    if (!getApiServer()) return { success: false, message: 'API is not running' };
    await stopApi();
    setApiServer(null);
    return { success: true };
  });


  ipcMain.handle('test-db-connection', async (_event, config) => {
    try {
      const mysql = require('mysql2/promise');
      const testPool = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password
      });
      await testPool.query('SELECT 1');
      await testPool.end();
      return { success: true };
    } catch (err) {
      let userMessage = 'Не удалось подключиться. Проверьте данные.';
      if (err.code === 'ECONNREFUSED') userMessage = 'Сервер БД не запущен или порт неверный.';
      if (err.code === 'ER_ACCESS_DENIED_ERROR') userMessage = 'Неверный пользователь или пароль.';
      if (err.code === 'ER_DBACCESS_DENIED_ERROR') userMessage = 'Нет доступа к БД.';
      return { success: false, message: userMessage };
    }
  });

  ipcMain.handle('save-db-config', async (_event, config) => {
    await setDbConfig(config);
    return { success: true };
  });
  ipcMain.handle('update-api-port', async (_event, apiPort) => {
    try {
      await updateApiPort(apiPort);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });
  ipcMain.handle('export-seed', async (event) => {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `kvant-seed-${new Date().toISOString().slice(0, 10)}.sql`,
      filters: [{ name: 'SQL Files', extensions: ['sql'] }]
    });
    if (canceled || !filePath) return { success: false, message: 'Отменено' };
    const onProgress = (p) => event.sender.send('export-progress', p);
    return exportSeed(filePath, onProgress);
  });

  ipcMain.handle('import-seed', async (event) => {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: 'SQL Files', extensions: ['sql'] }]
    });
    if (canceled || !filePaths?.[0]) return { success: false, message: 'discard' };
    const onProgress = (p) => event.sender.send('import-progress', p);
    return importSeed(filePaths[0], onProgress);
  });
  ipcMain.on('restart-app', () => {
    require('electron').app.relaunch();
    require('electron').app.quit();
  });

  ipcMain.on('open-db-setup', () => {
    console.log('Открываем db_setup, mainWindow:', !!mainWindow);
    createSetupWindow(mainWindow);
  });

  ipcMain.on('open-backup', () => {
    createBackupWindow(mainWindow);
  });
}

module.exports = { registerHandlers, exportSeed, importSeed };
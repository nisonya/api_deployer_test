const { ipcMain, dialog } = require('electron');
const { startApi, stopApi } = require('../api/app');
const { getDbConfig, setDbConfig } = require('../common/config');
const { getPool } = require('../db/connection');
const { getApiServer, setApiServer } = require('./state');
const { createSetupWindow, createBackupWindow} = require('./windows');
const fs = require('fs');
const path = require('path');

function registerHandlers(mainWindow) {
  
  ipcMain.handle('get-api-status', () => ({ running: !!getApiServer() })); 
   ipcMain.handle('get-db-config', async () => {
    const config = await getDbConfig();
    return config ? {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database,
      apiPort: config.apiPort
    } : null;
  });
  ipcMain.handle('start-api', async () => {
    if (getApiServer()) return { success: false, message: 'API is running' };

    try {
      const server = await startApi();
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


  ipcMain.handle('test-db-connection', async (event, config) => {
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

  ipcMain.handle('save-db-config', async (event, config) => {
    await setDbConfig(config);
    return { success: true };
  });

 

  ipcMain.handle('export-seed', async () => {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `kvant-seed-${new Date().toISOString().slice(0,10)}.sql`,
      filters: [{ name: 'SQL Files', extensions: ['sql'] }]
    });

    if (canceled || !filePath) return { success: false, message: 'Отменено' };

    try {
      const pool = await getPool();
      const conn = await pool.getConnection();
      const [tables] = await conn.query('SHOW TABLES');
      let dump = '-- Kvant seed dump\n\n';
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        const [rows] = await conn.query(`SELECT * FROM \`${tableName}\``);
        if (rows.length > 0) {
          dump += `INSERT INTO \`${tableName}\` VALUES\n`;
          dump += rows.map(row => `(${Object.values(row).map(v => conn.escape(v)).join(',')})`).join(',\n') + ';\n\n';
        }
      }
      await fs.promises.writeFile(filePath, dump);
      return { success: true, filePath };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('import-seed', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: 'SQL Files', extensions: ['sql'] }]
    });

    if (canceled || !filePaths?.[0]) return { success: false, message: 'Отменено' };

    try {
      const sql = await fs.promises.readFile(filePaths[0], 'utf8');
      const pool = await getPool();
      const conn = await pool.getConnection();
      await conn.query(sql);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
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

module.exports = { registerHandlers };
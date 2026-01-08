require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { startApi, stopApi, getStatus } = require('./src/api/app');
const { isConfigured } = require('./src/common/config');
const { Console } = require('console');

let mainWindow = null;
let setupWindow = null;
let backupWindow = null;
let apiServer = null;


function createMainWindow() {
  console.log('asdasd');
  mainWindow = new BrowserWindow({
    width: 700,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('renderer/html/main_window.html');
}

function createSetupWindow() {
  setupWindow = new BrowserWindow({
    width: 600,
    height: 1200,
    parent: mainWindow || null,
    modal: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  setupWindow.loadFile('renderer/html/db_setup.html');
  console.log('Загрузка db_setup.html');
  setupWindow.on('closed', () => {
    setupWindow = null;
    if (!isConfigured()) app.quit(); // если закрыли без сохранения — выход
  });
}

function createBackupWindow() {
  if (backupWindow) {
    backupWindow.focus();
    return;
  }

  backupWindow = new BrowserWindow({
    width: 600,
    height: 400,
    parent: mainWindow,
    modal: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  backupWindow.loadFile('renderer/html/backup.html');

  backupWindow.on('closed', () => {
    backupWindow = null;
  });
}

app.whenReady().then(async () => {
  if (!(await isConfigured())) {
    // createSetupWindow();
    createMainWindow();
    return;
  }
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

// Остановка API при закрытии
app.on('window-all-closed', async () => {
  await stopApi();
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('start-api', async () => {
  if (apiServer) return { success: false, message: 'API уже запущен' };

  try {
    apiServer = await startApi(); // деплой БД здесь
    return { success: true, message: 'API запущен' };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('stop-api', async () => {
  if (!apiServer) return { success: false, message: 'API не запущен' };
  await stopApi();
  apiServer = null;
  return { success: true };
});

ipcMain.handle('get-api-status', () => ({ running: !!apiServer }));

ipcMain.handle('test-db-connection', async (event, config) => {
  try {
    const mysql = require('mysql2/promise');
    const testPool = mysql.createPool(config);
    await testPool.query('SELECT 1');
    await testPool.end();
    console.log("sucking seed");
    return { success: true };
  } catch (err) {
    console.log("oposite of sucking seed");let userMessage = 'Не удалось подключиться. Проверьте данные.';
    if (err.code === 'ECONNREFUSED') userMessage = 'Сервер БД не запущен или порт неверный.';
    if (err.code === 'ER_ACCESS_DENIED_ERROR') userMessage = 'Неверный пользователь или пароль.';
    if (err.code === 'ER_DBACCESS_DENIED_ERROR') userMessage = 'Нет доступа к БД.';
    console.error('Ошибка подключения:', err);
    return { success: false, message: userMessage };
    }
});

ipcMain.handle('save-db-config', async (event, config) => {
  require('./src/common/config').setDbConfig(config);
  app.relaunch();
  app.exit();
});

ipcMain.on('open-db-setup', () => {
  createSetupWindow();
});

ipcMain.on('open-backup', () => {
  createBackupWindow();
});

// Экспорт
ipcMain.handle('export-seed', async () => {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `kvan-seed-${new Date().toISOString().slice(0,10)}.sql`,
    filters: [{ name: 'SQL Files', extensions: ['sql'] }]
  });

  if (canceled || !filePath) return { success: false, message: 'Отменено' };

  try {
    const pool = await getPool();
    const conn = await pool.getConnection();
    const [tables] = await conn.query('SHOW TABLES');
    // Простой dump всех таблиц (можно улучшить mysqldump)
    let dump = '-- Kvan seed dump\n\n';
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

// Импорт
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
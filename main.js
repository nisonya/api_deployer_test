require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { startApi, stopApi, getStatus } = require('./src/api/app');
const { isConfigured } = require('./src/common/config');

let mainWindow = null;
let setupWindow = null;
let apiServer = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('renderer/index.html');
}

function createSetupWindow() {
  setupWindow = new BrowserWindow({
    width: 600,
    height: 600,
    parent: mainWindow || null,
    modal: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  setupWindow.loadFile('renderer/db-setup.html');

  setupWindow.on('closed', () => {
    setupWindow = null;
    if (!isConfigured()) app.quit(); // если закрыли без сохранения — выход
  });
}


app.whenReady().then(async () => {
  if (!(await isConfigured())) {
    createSetupWindow();
    return;
  }
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
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
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('save-db-config', async (event, config) => {
  require('./src/common/config').setDbConfig(config);
  app.relaunch();
  app.exit();
});
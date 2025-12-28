require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { startApi, stopApi, getStatus } = require('./src/api/app');

let mainWindow;
let apiServer = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('renderer/index.html');
}

// Запуск API сразу при старте приложения
app.whenReady().then(async () => {
  try {
    apiServer = await startApi(); // деплой БД + запуск API
  } catch (err) {
    console.error('Ошибка запуска API:', err);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Остановка API при закрытии
app.on('window-all-closed', async () => {
  await stopApi();
  if (process.platform !== 'darwin') app.quit();
});

// IPC — только статус и принудительная остановка (если нужно)
ipcMain.handle('get-api-status', () => getStatus());
ipcMain.handle('stop-api', async () => {
  await stopApi();
  return { success: true };
});
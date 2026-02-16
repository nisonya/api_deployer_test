require('dotenv').config();
const { app } = require('electron');
const { isConfigured } = require('./src/common/config');
const { createMainWindow, createSetupWindow} = require('./src/main/windows');

let mainWindow = null;

app.whenReady().then(async () => {
  
  require('./src/main/ipcHandlers').registerHandlers(mainWindow);
  if (!(await isConfigured())) {
    createSetupWindow();
    return;
  }
  createMainWindow();


  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', async () => {
  await require('./src/api/app').stopApi();
  if (process.platform !== 'darwin') {
    if (server) {
      server.close(() => {
        console.log('Сервер остановлен');
        app.quit();
      });
    } else {
      app.quit();
    }
  }
});

process.on('SIGTERM', () => {
  if (server) {
    server.close(() => {
      console.log('Сервер остановлен по SIGTERM');
      process.exit(0);
    });
  }
});

process.on('SIGINT', () => {
  if (server) {
    server.close(() => {
      console.log('Сервер остановлен по SIGINT');
      process.exit(0);
    });
  }
});
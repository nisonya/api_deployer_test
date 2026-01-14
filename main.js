require('dotenv').config();
const { app } = require('electron');
const { isConfigured } = require('./src/common/config');
const { createMainWindow, createSetupWindow} = require('./src/main/windows');

let mainWindow = null;

app.whenReady().then(async () => {
  if (!(await isConfigured())) {
    createSetupWindow();
    return;
  }
  createMainWindow();

  // Регистрируем handlers, передавая mainWindow
  require('./src/main/ipcHandlers').registerHandlers(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', async () => {
  await require('./src/api/app').stopApi();
  if (process.platform !== 'darwin') app.quit();
});
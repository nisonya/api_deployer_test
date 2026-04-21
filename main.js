const path = require('path');
const { app, BrowserWindow } = require('electron');
const { createMainWindow, createSetupWindow } = require('./src/main/windows');
const { log } = require('./src/main/mainLog');
const { tryAutoStartApi } = require('./src/main/autoStartApi');

function initEnv() {
  process.env.API_DEPLOYER_CONFIG_DIR = path.join(app.getPath('userData'), 'config');
  require('./src/common/envLoader').loadEnv();
}

let mainWindow = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}
app.on('second-instance', () => {
  const wins = BrowserWindow.getAllWindows();
  if (wins.length > 0) {
    const win = wins.find(w => w.isVisible()) || wins[0];
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.whenReady().then(async () => {
  try {
    initEnv();
    log('App ready, log file: ' + require('./src/main/mainLog').getLogPath());

    require('./src/main/ipcHandlers').registerHandlers(mainWindow);
    mainWindow = createMainWindow();
    log('Main window created');

    await tryAutoStartApi();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) mainWindow = createMainWindow();
    });
  } catch (err) {
    log(String(err.stack || err), true);
    throw err;
  }
}).catch((err) => {
  log('FATAL: ' + (err.stack || err), true);
  throw err;
});

process.on('uncaughtException', (err) => {
  log('uncaughtException: ' + (err.stack || String(err)), true);
});

process.on('unhandledRejection', (reason, promise) => {
  log('unhandledRejection: ' + String(reason), true);
});

app.on('window-all-closed', async () => {
  await require('./src/api/app').stopApi();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('SIGTERM', () => {
  require('./src/api/app').stopApi().then(() => process.exit(0));
});

process.on('SIGINT', () => {
  require('./src/api/app').stopApi().then(() => process.exit(0));
});
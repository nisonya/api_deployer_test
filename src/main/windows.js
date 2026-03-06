const { BrowserWindow, app } = require('electron');
const path = require('path');
const { isConfigured } = require('../common/envLoader');
const { log: mainLog } = require('./mainLog');

let mainWindow = null;

/** Путь к HTML в renderer: в разработке — от корня проекта, после установки — от app.asar */
function getRendererPath(relativePath) {
  return path.join(app.getAppPath(), 'renderer', relativePath);
}

function attachLoadErrorLog(win, label) {
  win.webContents.on('did-fail-load', (_e, errorCode, errorDescription, validatedURL) => {
    mainLog(`${label} did-fail-load: code=${errorCode} ${errorDescription} url=${validatedURL}`, true);
  });
}

function createMainWindow() {
  const htmlPath = getRendererPath(path.join('html', 'main_window.html'));
  mainLog('createMainWindow loading: ' + htmlPath);
  mainWindow = new BrowserWindow({
    width: 400,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, './preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  attachLoadErrorLog(mainWindow, 'main');
  mainWindow.loadFile(htmlPath).catch((err) => mainLog('main loadFile error: ' + (err.stack || err), true));
  mainWindow.removeMenu();
  return mainWindow;
}

function createSetupWindow(parentWindow = null) {
  const htmlPath = getRendererPath(path.join('html', 'db_setup.html'));
  mainLog('createSetupWindow loading: ' + htmlPath);
  const win = new BrowserWindow({
    width: 600,
    height: 900,
    parent: parentWindow,
    modal: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, './preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  attachLoadErrorLog(win, 'setup');
  win.loadFile(htmlPath).catch((err) => mainLog('setup loadFile error: ' + (err.stack || err), true));
  win.on('closed', () => {
    if (!isConfigured()) require('electron').app.quit();
  });
  win.removeMenu();
  return win;
}

function createBackupWindow(parentWindow = null) {
  const htmlPath = getRendererPath(path.join('html', 'backup.html'));
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    parent: parentWindow,
    modal: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, './preload.js')
    }
  });
  attachLoadErrorLog(win, 'backup');
  win.loadFile(htmlPath).catch((err) => mainLog('backup loadFile error: ' + (err.stack || err), true));
  win.on('closed', () => {});
  return win;
}

module.exports = { createMainWindow, createSetupWindow, createBackupWindow };
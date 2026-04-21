const { BrowserWindow, app, screen } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { isConfigured } = require('../common/envLoader');
const { log: mainLog } = require('./mainLog');

let mainWindow = null;

/** Путь к HTML в renderer: в разработке — от корня проекта, после установки — от app.asar */
function getRendererPath(relativePath) {
  return path.join(app.getAppPath(), 'renderer', relativePath);
}

/**
 * Ограничивает размер окна доступной областью экрана.
 * @param {number} desiredWidth - желаемая ширина
 * @param {number} desiredHeight - желаемая высота
 * @param {number} [maxPercent=0.9] - максимум от экрана (0.9 = 90%)
 * @returns {{ width, height, minWidth, minHeight, maxWidth, maxHeight }}
 */
function getWindowBounds(desiredWidth, desiredHeight, maxPercent = 0.9) {
  const primary = screen.getPrimaryDisplay();
  const workArea = primary.workAreaSize;
  const maxW = Math.floor(workArea.width * maxPercent);
  const maxH = Math.floor(workArea.height * maxPercent);
  const width = Math.min(desiredWidth, maxW);
  const height = Math.min(desiredHeight, maxH);
  return {
    width,
    height,
    minWidth: Math.min(320, width),
    minHeight: Math.min(400, height),
    maxWidth: maxW,
    maxHeight: maxH
  };
}

function attachLoadErrorLog(win, label) {
  win.webContents.on('did-fail-load', (_e, errorCode, errorDescription, validatedURL) => {
    mainLog(`${label} did-fail-load: code=${errorCode} ${errorDescription} url=${validatedURL}`, true);
  });
}

function createMainWindow() {
  const htmlPath = getRendererPath(path.join('html', 'main_window.html'));
  mainLog('createMainWindow loading: ' + htmlPath);
  const bounds = getWindowBounds(400, 700);
  mainWindow = new BrowserWindow({
    ...bounds,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, './preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.center();
  attachLoadErrorLog(mainWindow, 'main');
  // loadURL + pathToFileURL: на Windows путь со слешами \ и пробелами в каталоге иначе даёт ERR_FAILED (-2) при loadFile
  mainWindow
    .loadURL(pathToFileURL(htmlPath).href)
    .catch((err) => mainLog('main loadURL error: ' + (err.stack || err), true));
  mainWindow.removeMenu();
  return mainWindow;
}

function createSetupWindow(parentWindow = null) {
  const htmlPath = getRendererPath(path.join('html', 'db_setup.html'));
  mainLog('createSetupWindow loading: ' + htmlPath);
  const bounds = getWindowBounds(600, 900);
  const win = new BrowserWindow({
    ...bounds,
    parent: parentWindow,
    modal: !!parentWindow,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, './preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (!parentWindow) win.center();
  attachLoadErrorLog(win, 'setup');
  win
    .loadURL(pathToFileURL(htmlPath).href)
    .catch((err) => mainLog('setup loadURL error: ' + (err.stack || err), true));
  win.on('closed', () => {
    if (!isConfigured()) require('electron').app.quit();
  });
  win.removeMenu();
  return win;
}

function createBackupWindow(parentWindow = null) {
  const htmlPath = getRendererPath(path.join('html', 'backup.html'));
  const bounds = getWindowBounds(600, 400);
  const win = new BrowserWindow({
    ...bounds,
    parent: parentWindow,
    modal: !!parentWindow,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, './preload.js')
    }
  });
  if (!parentWindow) win.center();
  attachLoadErrorLog(win, 'backup');
  win
    .loadURL(pathToFileURL(htmlPath).href)
    .catch((err) => mainLog('backup loadURL error: ' + (err.stack || err), true));
  win.on('closed', () => {});
  return win;
}

module.exports = { createMainWindow, createSetupWindow, createBackupWindow };
const { BrowserWindow } = require('electron');
const path = require('path');
const { isConfigured } = require('../common/config');

let mainWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 700,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, './preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile('renderer/html/main_window.html');
  return mainWindow; // ← возвращаем, чтобы можно было использовать
}

function createSetupWindow(parentWindow = null) {
  const win = new BrowserWindow({
    width: 600,
    height: 950,
    parent: parentWindow, // ← теперь параметр
    modal: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, './preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('renderer/html/db_setup.html');
  win.on('closed', () => {
    if (!isConfigured()) require('electron').app.quit();
  });
  return win;
}

function createBackupWindow(parentWindow = null) {
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
  win.loadFile('renderer/html/backup.html');
  win.on('closed', () => {});
  return win;
}

module.exports = { createMainWindow, createSetupWindow, createBackupWindow };
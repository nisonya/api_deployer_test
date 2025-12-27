require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const https = require('https');
const fs = require('fs');
const express = require('express');
const httpsOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const path = require('path');

let mainWindow;
let server = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // будем использовать preload для безопасности
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (server) server.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC — обработка сообщений от renderer
ipcMain.handle('start-server', async (event, port) => {
  if (server) return { success: false, message: 'Сервер уже запущен' };
  const app = express();
  app.use(express.json());
  app.use('/api/events', require('./api/routes/events'));
  app.get('/', (req, res) => res.send('API работает'));
  return new Promise((resolve) => {
    
    server = https.createServer(httpsOptions, app);
    server.listen(port, '127.0.0.1', () => {
      resolve({ success: true, message: `API на порту ${port}` });
    });
    server.on('error', (err) => {
      server = null;
      if (err.code === 'EADDRINUSE') {
        resolve({ success: false, message: `Порт ${port} уже занят` });
      } else {
        resolve({ success: false, message: err.message });
      }
    });
  });
});

ipcMain.handle('stop-server', async () => {
  if (!server) return { success: false, message: 'Сервер не запущен' };

  return new Promise((resolve) => {
    server.close(() => {
      server = null;
      resolve({ success: true, message: 'Сервер остановлен' });
    });
  });
});

ipcMain.handle('get-server-status', () => {
  return { running: !!server };
});
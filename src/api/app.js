require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { deploy } = require('../db/deploy');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Монтируем модули (добавляй по мере готовностSи)
//app.use('/api/auth', require('./modules/auth/routes'));
app.use('/api/employees', require('./modules/employees/routes'));
app.use('/api/events', require('./modules/events/routes'));
app.use('/api/schedule', require('./modules/schedule/routes'));

// Корневой эндпоинт для проверки
app.get('/', (req, res) => res.send('API работает'));

let server = null;

async function startApi(port = process.env.PORT || 3000) {
  await deploy(); // авто-деплой БД при старте

  const config = await getDbConfig();
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '../../key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../../cert.pem'))
  };

  server = https.createServer(httpsOptions, app);

  return new Promise((resolve, reject) => {
    const port = config?.apiPort || 3000;
    server.listen(port, '127.0.0.1', () => {
      console.log(`API запущен на https://localhost:${port}`);
      resolve(server);
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

function stopApi() {
  return new Promise((resolve) => {
    if (!server) return resolve();
    server.close(() => {
      server = null;
      console.log('API остановлен');
      resolve();
    });
  });
}

function getStatus() {
  return { running: !!server };
}

module.exports = { startApi, stopApi, getStatus, app };
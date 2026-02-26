require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { deploy } = require('../db/deploy');
const { getDbConfig} = require('../common/config');
const app = express();
app.use(express.json());
app.use(cookieParser());
const authMiddleware = require('./middleware/auth');
const authRoutes = require('./modules/auth/routes');
app.use('/api/auth', authRoutes);
app.use('/api/employees', authMiddleware, require('./modules/employees/routes'));
app.use('/api/events', authMiddleware, require('./modules/events/routes'));
app.use('/api/schedule', authMiddleware, require('./modules/schedule/routes'));
app.use('/api/reference', authMiddleware, require('./modules/reference/routes'));
app.use('/api/rent', authMiddleware, require('./modules/rent/routes'));
app.use('/api/students', authMiddleware, require('./modules/students/routes'));
app.use('/api/attendance', authMiddleware, require('./modules/attendance/routes'));
app.use('/api/groups', authMiddleware, require('./modules/groups/routes'));

// Корневой эндпоинт для проверки
app.get('/', (req, res) => res.send('API work'));

// Обработчик ошибок — последний в цепочке (вызывается при next(err))
app.use(require('./middleware/errorHandler'));

let server = null;
async function startApi(port = 3000) {
  await deploy();

  const config = await getDbConfig();
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '../../key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../../cert.pem'))
  };

  server = https.createServer(httpsOptions, app);

  return new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => {
      console.log(`API is running on https://localhost:${port}`);
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
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const https = require('https');
const { deploy } = require('../db/deploy');
const { getDbConfig } = require('../common/config');
const { getHttpsOptions } = require('./certs');
const app = express();
app.use(express.json());
app.use(cookieParser());
const authMiddleware = require('./middleware/auth');
const authRoutes = require('./modules/auth/routes');
app.use('/api/auth', authRoutes);
app.use('/api/employees', authMiddleware, require('./modules/employees/routes'));
app.use('/api/events/org', authMiddleware, require('./modules/events/orgRoutes'));
app.use('/api/events/part', authMiddleware, require('./modules/events/partRoutes'));
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

const DEFAULT_API_PORT = 3000;

let server = null;
async function startApi(port = DEFAULT_API_PORT) {
  await deploy();

  const config = await getDbConfig();
  const httpsOptions = getHttpsOptions();

  server = https.createServer(httpsOptions, app);

  const host = config.apiHost ?? '0.0.0.0';
  return new Promise((resolve, reject) => {
    server.listen(port, host, () => {
      console.log(`API is running on https://${host}:${port}`);
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
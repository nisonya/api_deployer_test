// Только HTTPS; все настройки из env (.env загружается в main/server до сюда)
const express = require('express');
const cookieParser = require('cookie-parser');
const https = require('https');
const crypto = require('crypto');
const { deploy } = require('../db/deploy');
const { getDbConfig, writeEnvVars } = require('../common/envLoader');
const { getHttpsOptions } = require('./certs');
const { setSecrets } = require('./jwtSecrets');

const app = express();
app.use(express.json());
app.use(cookieParser());

const authMiddleware = require('./middleware/auth');
app.use('/api/auth', require('./modules/auth/routes'));

const protectedRoutes = [
  ['/api/employees', 'modules/employees/routes'],
  ['/api/events/org', 'modules/events/orgRoutes'],
  ['/api/events/part', 'modules/events/partRoutes'],
  ['/api/schedule', 'modules/schedule/routes'],
  ['/api/reference', 'modules/reference/routes'],
  ['/api/rent', 'modules/rent/routes'],
  ['/api/students', 'modules/students/routes'],
  ['/api/attendance', 'modules/attendance/routes'],
  ['/api/groups', 'modules/groups/routes'],
];
protectedRoutes.forEach(([mountPath, routePath]) => {
  app.use(mountPath, authMiddleware, require(`./${routePath}`));
});

app.get('/', (req, res) => res.send('API work'));
app.use(require('./middleware/errorHandler'));

const DEFAULT_API_PORT = 3000;
let server = null;

function ensureJwtSecrets() {
  let access = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  let refresh = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (access && refresh) {
    setSecrets(access, refresh);
    return;
  }
  access = access || crypto.randomBytes(32).toString('hex');
  refresh = refresh || crypto.randomBytes(32).toString('hex');
  process.env.JWT_ACCESS_SECRET = access;
  process.env.JWT_REFRESH_SECRET = refresh;
  writeEnvVars({ JWT_ACCESS_SECRET: access, JWT_REFRESH_SECRET: refresh });
  setSecrets(access, refresh);
}

async function startApi(port = DEFAULT_API_PORT) {
  await deploy();

  const config = getDbConfig();
  const apiPort = port ?? config.apiPort ?? DEFAULT_API_PORT;

  ensureJwtSecrets();

  server = https.createServer(getHttpsOptions(), app);
  const host = '0.0.0.0';

  return new Promise((resolve, reject) => {
    server.listen(apiPort, host, () => {
      console.log(`API is running on https://${host}:${apiPort}`);
      resolve(server);
    });
    server.on('error', reject);
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

/** Когда API запущен: { port, protocol }. Иначе null. */
function getAddresses() {
  const a = server?.address();
  return a ? { port: a.port, protocol: 'https' } : null;
}

module.exports = { startApi, stopApi, getStatus, getAddresses, app };
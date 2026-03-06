const path = require('path');
const os = require('os');
const fs = require('fs');
const dotenv = require('dotenv');

function getEnvDir() {
  return process.env.API_DEPLOYER_CONFIG_DIR || (process.platform === 'win32'
    ? path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'api-deployer')
    : path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'api-deployer'));
}

function getEnvFilePath() {
  return path.join(getEnvDir(), '.env');
}

function ensureConfigDir() {
  const dir = getEnvDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const DEFAULT_VARS = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_USER: 'root',
  DB_PASSWORD: '',
  DB_NAME: 'kvant',
  API_PORT: '3000'
};

const DB_NAME = DEFAULT_VARS.DB_NAME;

function ensureEnvFile() {
  ensureConfigDir();
  const filePath = getEnvFilePath();
  if (!fs.existsSync(filePath)) {
    const lines = Object.entries(DEFAULT_VARS).map(([k, v]) => `${k}=${v === '' ? '' : String(v)}`);
    fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
  }
}

function loadEnv() {
  ensureEnvFile();
  const result = dotenv.config({ path: getEnvFilePath(), override: true });
  if (result.error && result.error.code !== 'ENOENT') {
    throw result.error;
  }
}

/**
 * Читает текущий .env, сливает с vars и записывает обратно.
 * @param {Record<string, string>} vars - ключи в верхнем регистре (DB_HOST, API_PORT, JWT_ACCESS_SECRET и т.д.)
 */
function writeEnvVars(vars) {
  ensureConfigDir();
  const filePath = getEnvFilePath();
  let parsed = {};
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    parsed = dotenv.parse(content);
  }
  for (const [k, v] of Object.entries(vars)) {
    if (v !== undefined && v !== null) {
      parsed[k] = String(v);
    }
  }
  const lines = Object.entries(parsed).map(([k, v]) => {
    if (v.includes('\n') || v.includes('"') || v.includes(' ')) {
      const escaped = v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      return `${k}="${escaped}"`;
    }
    return `${k}=${v}`;
  });
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
}

// --- Чтение/запись настроек (все из env) ---

function validateApiPort(apiPort) {
  if (typeof apiPort !== 'number' || isNaN(apiPort) || !Number.isInteger(apiPort) || apiPort < 0 || apiPort > 65535) {
    throw new Error('Invalid API port (must be between 0 and 65535)');
  }
}

function parseEnvInt(key, defaultValue) {
  const n = parseInt(process.env[key], 10);
  return (Number.isInteger(n) && !isNaN(n)) ? n : defaultValue;
}

function getDbConfig() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseEnvInt('DB_PORT', 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || DB_NAME,
    apiPort: parseEnvInt('API_PORT', 3000),
    apiHost: '0.0.0.0'
  };
}

function isConfigured() {
  return true;
}

async function setDbConfig(config) {
  validateApiPort(config.apiPort != null ? config.apiPort : 3000);
  writeEnvVars({
    DB_HOST: config.host,
    DB_PORT: String(config.port ?? 3306),
    DB_USER: config.user,
    DB_PASSWORD: config.password !== undefined ? config.password : '',
    API_PORT: String(config.apiPort ?? 3000)
  });
  loadEnv(); // обновить process.env, чтобы текущий процесс видел изменения
}

async function updateApiPort(apiPort) {
  validateApiPort(apiPort);
  writeEnvVars({ API_PORT: String(apiPort) });
  loadEnv(); // обновить process.env
}

module.exports = {
  getEnvDir,
  getEnvFilePath,
  loadEnv,
  writeEnvVars,
  DEFAULT_VARS,
  DB_NAME,
  getConfigFilePath: getEnvFilePath,
  getConfigDir: getEnvDir,
  getDbConfig,
  isConfigured,
  setDbConfig,
  updateApiPort
};

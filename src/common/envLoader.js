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
  API_PORT: '3000',
  EVENT_DOCUMENTS_ROOT_ORG: '',
  EVENT_DOCUMENTS_ROOT_PART: ''
};

const DB_NAME = DEFAULT_VARS.DB_NAME;

/**
 * Абсолютный путь к каталогу для записи в .env и для fs.
 * path.normalize + слэши «/» — на Windows Node принимает оба вида; в .env так надёжнее, чем сырые «\» без кавычек.
 */
function normalizeDocumentsRootPath(p) {
  const s = String(p ?? '').trim();
  if (!s) return '';
  return path.normalize(s).replace(/\\/g, '/');
}

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
    if (v === undefined) {
      delete parsed[k];
    } else if (v !== null) {
      parsed[k] = String(v);
    }
  }
  const lines = Object.entries(parsed).map(([k, v]) => {
    if (v.includes('\n') || v.includes('"') || v.includes(' ')) {
      // Нормализуем переводы строк перед записью (PEM и др.): только LF, не CRLF
      const normalized = String(v).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const escaped = normalized.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
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
    apiHost: '0.0.0.0',
    documentsRootOrg: normalizeDocumentsRootPath(process.env.EVENT_DOCUMENTS_ROOT_ORG || ''),
    documentsRootPart: normalizeDocumentsRootPath(process.env.EVENT_DOCUMENTS_ROOT_PART || '')
  };
}

/**
 * Проверка, что в .env задано всё необходимое для запуска API (БД + порты + каталоги документов).
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
function validateConfigCompleteForServer() {
  const c = getDbConfig();
  if (!String(c.host || '').trim()) return { ok: false, message: 'Не указан хост БД. Заполните настройки в разделе «Подключение к БД».' };
  if (!Number.isInteger(c.port) || c.port < 1 || c.port > 65535) {
    return { ok: false, message: 'Укажите корректный порт БД (1–65535).' };
  }
  if (!String(c.user || '').trim()) return { ok: false, message: 'Не указан пользователь БД.' };
  if (!String(c.database || '').trim()) return { ok: false, message: 'Не указано имя базы данных.' };
  if (!Number.isInteger(c.apiPort) || c.apiPort < 1 || c.apiPort > 65535) {
    return { ok: false, message: 'Укажите корректный порт API (1–65535).' };
  }
  const org = normalizeDocumentsRootPath(c.documentsRootOrg);
  const part = normalizeDocumentsRootPath(c.documentsRootPart);
  if (!org) {
    return { ok: false, message: 'Не указан корневой каталог документов для мероприятий организации (вкладка «Настройки API»).' };
  }
  if (!part) {
    return { ok: false, message: 'Не указан корневой каталог документов для мероприятий участия (вкладка «Настройки API»).' };
  }
  try {
    if (!fs.existsSync(org)) {
      return { ok: false, message: `Каталог документов (организация) не найден: ${org}` };
    }
    if (!fs.statSync(org).isDirectory()) {
      return { ok: false, message: `Путь не является каталогом (организация): ${org}` };
    }
    if (!fs.existsSync(part)) {
      return { ok: false, message: `Каталог документов (участие) не найден: ${part}` };
    }
    if (!fs.statSync(part).isDirectory()) {
      return { ok: false, message: `Путь не является каталогом (участие): ${part}` };
    }
  } catch (e) {
    return { ok: false, message: `Ошибка проверки каталогов: ${e.message}` };
  }
  return { ok: true };
}

function isConfigured() {
  return validateConfigCompleteForServer().ok;
}

async function setDbConfig(config) {
  validateApiPort(config.apiPort != null ? config.apiPort : 3000);
  const org = normalizeDocumentsRootPath(config.documentsRootOrg);
  const part = normalizeDocumentsRootPath(config.documentsRootPart);
  if (org) {
    fs.mkdirSync(org, { recursive: true });
  }
  if (part) {
    fs.mkdirSync(part, { recursive: true });
  }
  writeEnvVars({
    DB_HOST: config.host,
    DB_PORT: String(config.port ?? 3306),
    DB_USER: config.user,
    DB_PASSWORD: config.password !== undefined ? config.password : '',
    DB_NAME: config.database != null && String(config.database).trim() !== '' ? String(config.database).trim() : DB_NAME,
    API_PORT: String(config.apiPort ?? 3000),
    EVENT_DOCUMENTS_ROOT_ORG: org,
    EVENT_DOCUMENTS_ROOT_PART: part
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
  validateConfigCompleteForServer,
  setDbConfig,
  updateApiPort
};

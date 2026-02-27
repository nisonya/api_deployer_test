const path = require('path');
const os = require('os');
const fs = require('fs').promises;

const isElectron = typeof process !== 'undefined' && process.versions && process.versions.electron;

function getConfigFilePath() {
  const dir = process.env.API_DEPLOYER_CONFIG_DIR || (process.platform === 'win32'
    ? path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'api-deployer')
    : path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'api-deployer'));
  return path.join(dir, 'config.json');
}

const DB_NAME = 'kvant'; // фиксированное имя БД, пользователь не может менять

const defaults = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: DB_NAME,
  apiPort: 3000,
  apiHost: '127.0.0.1'
};

function validateApiPort(apiPort) {
  if (typeof apiPort !== 'number' || isNaN(apiPort) || !Number.isInteger(apiPort) || apiPort < 1024 || apiPort > 65535) {
    throw new Error('Invalid API port (must be between 1024 and 65535)');
  }
}

function normalizeDbConfig(config, current) {
  return {
    host: config.host ?? current?.host ?? defaults.host,
    port: config.port ?? current?.port ?? defaults.port,
    user: config.user ?? current?.user ?? defaults.user,
    password: config.password !== undefined ? config.password : (current?.password ?? defaults.password),
    database: DB_NAME,
    apiPort: config.apiPort ?? current?.apiPort ?? defaults.apiPort,
    apiHost: config.apiHost ?? current?.apiHost ?? defaults.apiHost
  };
}

let StoreInstance = null;
async function initStore() {
  if (!StoreInstance) {
    const mod = await import('electron-store');
    const Store = mod.default;
    StoreInstance = new Store({
      projectName: 'api-deployer',
      encryptionKey: process.env.STORE_ENCRYPTION_KEY || undefined,
      defaults: { dbConfig: null }
    });
  }
  return StoreInstance;
}

async function getDbConfigElectron() {
  const store = await initStore();
  return store.get('dbConfig');
}
async function setDbConfigElectron(config) {
  const store = await initStore();
  const current = store.get('dbConfig') || {};
  store.set('dbConfig', normalizeDbConfig(config, current));
}
async function updateApiPortElectron(apiPort) {
  validateApiPort(apiPort);
  const store = await initStore();
  const currentConfig = store.get('dbConfig') || {};
  store.set('dbConfig', { ...currentConfig, apiPort });
}
async function isConfiguredElectron() {
  const store = await initStore();
  return !!store.get('dbConfig');
}

async function readConfigFile() {
  const filePath = getConfigFilePath();
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const json = JSON.parse(data);
    return json.dbConfig || null;
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}
async function writeConfigFile(dbConfig) {
  const filePath = getConfigFilePath();
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  let data = {};
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    data = JSON.parse(raw);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  data.dbConfig = dbConfig;
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

async function getDbConfigFile() {
  const cfg = await readConfigFile();
  if (!cfg) return null;
  const result = { ...cfg };
  if (process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== '') {
    result.password = process.env.DB_PASSWORD;
  }
  if (process.env.API_HOST !== undefined && process.env.API_HOST !== '') {
    result.apiHost = process.env.API_HOST;
  }
  return result;
}
async function setDbConfigFile(config) {
  const current = await readConfigFile();
  await writeConfigFile(normalizeDbConfig(config, current));
}
async function updateApiPortFile(apiPort) {
  validateApiPort(apiPort);
  const current = await readConfigFile();
  if (!current) throw new Error('Config not set');
  await writeConfigFile({ ...current, apiPort });
}
async function isConfiguredFile() {
  const cfg = await readConfigFile();
  return !!cfg && !!cfg.database;
}

module.exports = {
  getConfigFilePath,
  isElectron,
  DB_NAME,
  async getDbConfig() {
    return isElectron ? getDbConfigElectron() : getDbConfigFile();
  },
  async setDbConfig(config) {
    return isElectron ? setDbConfigElectron(config) : setDbConfigFile(config);
  },
  async updateApiPort(apiPort) {
    return isElectron ? updateApiPortElectron(apiPort) : updateApiPortFile(apiPort);
  },
  async isConfigured() {
    return isElectron ? isConfiguredElectron() : isConfiguredFile();
  }
};


const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

function normalizePem(bufOrStr) {
  const str = Buffer.isBuffer(bufOrStr) ? bufOrStr.toString('utf8') : String(bufOrStr);
  return Buffer.from(str.replace(/\r\n/g, '\n').replace(/\r/g, '\n'), 'utf8');
}

const projectRoot = path.resolve(__dirname, '../..');

let cachedHttpsOptions = null;

function getCertsDir() {
  if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
    try {
      return path.join(require('electron').app.getPath('userData'), 'certs');
    } catch (e) {
      // fallback
    }
  }
  const { getConfigDir } = require('../common/envLoader');
  return path.join(getConfigDir(), 'certs');
}

function getKeyCertPaths() {
  const rootKey = path.join(projectRoot, 'key.pem');
  const rootCert = path.join(projectRoot, 'cert.pem');
  if (fs.existsSync(rootKey) && fs.existsSync(rootCert)) {
    return { key: rootKey, cert: rootCert };
  }
  const certsDir = getCertsDir();
  const generatedKey = path.join(certsDir, 'key.pem');
  const generatedCert = path.join(certsDir, 'cert.pem');
  if (fs.existsSync(generatedKey) && fs.existsSync(generatedCert)) {
    return { key: generatedKey, cert: generatedCert };
  }
  return null;
}

function getHttpsOptions() {
  if (cachedHttpsOptions) return cachedHttpsOptions;

  const envKey = process.env.SSL_KEY;
  const envCert = process.env.SSL_CERT;
  if (envKey && envCert) {
    cachedHttpsOptions = {
      key: normalizePem(envKey),
      cert: normalizePem(envCert)
    };
    return cachedHttpsOptions;
  }

  const keyCertPaths = getKeyCertPaths();
  if (keyCertPaths) {
    cachedHttpsOptions = {
      key: normalizePem(fs.readFileSync(keyCertPaths.key)),
      cert: normalizePem(fs.readFileSync(keyCertPaths.cert))
    };
    return cachedHttpsOptions;
  }

  const pems = selfsigned.generate(
    [{ name: 'commonName', value: 'KVANT API (local)' }],
    { keySize: 2048, days: 3650 }
  );
  cachedHttpsOptions = {
    key: Buffer.from(pems.private, 'utf8'),
    cert: Buffer.from(pems.cert, 'utf8')
  };
  process.env.SSL_KEY = pems.private;
  process.env.SSL_CERT = pems.cert;
  try {
    const { writeEnvVars } = require('../common/envLoader');
    writeEnvVars({ SSL_KEY: normalizePem(pems.private).toString('utf8'), SSL_CERT: normalizePem(pems.cert).toString('utf8') });
  } catch (e) {
    // .env может быть недоступен при тестах
  }
  return cachedHttpsOptions;
}

/** Сбрасывает кэш и повреждённые сертификаты в env. Следующий вызов getHttpsOptions перегенерирует. */
function clearAndRegenerate() {
  cachedHttpsOptions = null;
  delete process.env.SSL_KEY;
  delete process.env.SSL_CERT;
  try {
    const { writeEnvVars } = require('../common/envLoader');
    writeEnvVars({ SSL_KEY: undefined, SSL_CERT: undefined });
  } catch (e) {
    // игнорируем
  }
}

module.exports = { getHttpsOptions, getCertsDir, getKeyCertPaths, clearAndRegenerate, normalizePem };

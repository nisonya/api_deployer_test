/**
 * TLS только из env или генерация при старте с сохранением в .env.
 * Приоритет: 1) env SSL_KEY/SSL_CERT, 2) файлы key.pem/cert.pem, 3) сгенерировать и записать в .env.
 */
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

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
      key: Buffer.from(envKey, 'utf8'),
      cert: Buffer.from(envCert, 'utf8')
    };
    return cachedHttpsOptions;
  }

  const keyCertPaths = getKeyCertPaths();
  if (keyCertPaths) {
    cachedHttpsOptions = {
      key: fs.readFileSync(keyCertPaths.key),
      cert: fs.readFileSync(keyCertPaths.cert)
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
    require('../common/envLoader').writeEnvVars({ SSL_KEY: pems.private, SSL_CERT: pems.cert });
  } catch (e) {
    // .env может быть недоступен при тестах
  }
  return cachedHttpsOptions;
}

module.exports = { getHttpsOptions, getCertsDir, getKeyCertPaths };

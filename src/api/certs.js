/**
 * Пути к TLS-сертификатам для HTTPS.
 * Ключи не попадают в установщик: при первом запуске генерируется уникальный самоподписанный сертификат для каждой установки.
 * Для разработки можно положить key.pem и cert.pem в корень проекта — они будут использованы в первую очередь.
 */
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

const projectRoot = path.resolve(__dirname, '../..');

function getCertsDir() {
  if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
    try {
      return path.join(require('electron').app.getPath('userData'), 'certs');
    } catch (e) {
      // fallback
    }
  }
  const { getConfigFilePath } = require('../common/config');
  return path.join(path.dirname(getConfigFilePath()), 'certs');
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

function generateSelfSigned(certsDir) {
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }
  const attrs = [{ name: 'commonName', value: 'KVANT API (local)' }];
  const opts = { keySize: 2048, days: 3650 };
  const pems = selfsigned.generate(attrs, opts);
  const keyPath = path.join(certsDir, 'key.pem');
  const certPath = path.join(certsDir, 'cert.pem');
  fs.writeFileSync(keyPath, pems.private, 'utf8');
  fs.writeFileSync(certPath, pems.cert, 'utf8');
  return { key: keyPath, cert: certPath };
}

function getHttpsOptions() {
  const paths = getKeyCertPaths();
  const keyCertPaths = paths || generateSelfSigned(getCertsDir());
  return {
    key: fs.readFileSync(keyCertPaths.key),
    cert: fs.readFileSync(keyCertPaths.cert)
  };
}

module.exports = { getHttpsOptions, getCertsDir, getKeyCertPaths };

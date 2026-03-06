const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5 МБ
const KEEP_WHEN_ROTATE = 1024 * 1024;  // оставить последние 1 МБ при ротации

let logFilePath = null;

function getLogPath() {
  if (!logFilePath) {
    try {
      logFilePath = path.join(app.getPath('userData'), 'main-log.txt');
    } catch (_) {
      logFilePath = path.join(process.env.APPDATA || '', 'KVANT_API', 'main-log.txt');
    }
  }
  return logFilePath;
}

function truncateIfNeeded(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const stat = fs.statSync(filePath);
    if (stat.size <= MAX_LOG_SIZE) return;

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    let kept = '';
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i] + '\n';
      if ((kept.length + line.length) > KEEP_WHEN_ROTATE) break;
      kept = line + kept;
    }
    fs.writeFileSync(filePath, (kept ? kept + '\n' : ''), 'utf8');
  } catch (_) {}
}

function appendLog(line) {
  try {
    const filePath = getLogPath();
    truncateIfNeeded(filePath);
    fs.appendFileSync(filePath, line);
  } catch (_) {}
}

function log(msg, isError = false) {
  const line = `[${new Date().toISOString()}] ${isError ? 'ERROR: ' : ''}${msg}\n`;
  try {
    if (process.stdout && process.stdout.write) process.stdout.write(line);
  } catch (_) {}
  appendLog(line);
}

module.exports = { log, getLogPath };

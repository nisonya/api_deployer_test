const fs = require('fs');
const path = require('path');
const { getEnvDir } = require('../common/envLoader');

const FILE_NAME = '.setup_done';

function getSetupDonePath() {
  return path.join(getEnvDir(), FILE_NAME);
}

/**
 * Можно автозапускать API при старте, если:
 * - есть маркер (сохранены настройки БД или был успешный ручной запуск API), или
 * - в .env уже есть JWT (обновление с прошлой версии, API уже запускали).
 */
function isSetupDone() {
  try {
    if (fs.existsSync(getSetupDonePath())) return true;
  } catch {
    /* ignore */
  }
  if (process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET) return true;
  return false;
}

function markSetupDone() {
  try {
    const dir = getEnvDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(getSetupDonePath(), '1', 'utf8');
  } catch (e) {
    console.error('markSetupDone:', e);
  }
}

module.exports = { isSetupDone, markSetupDone, getSetupDonePath };

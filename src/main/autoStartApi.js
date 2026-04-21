const { startApi } = require('../api/app');
const { getDbConfig, validateConfigCompleteForServer } = require('../common/envLoader');
const { getApiServer, setApiServer } = require('./state');
const { isSetupDone } = require('./setupMarker');
const { log } = require('./mainLog');

/** Автозапуск HTTPS API после готовности приложения (если уже не первый запуск). */
async function tryAutoStartApi() {
  if (getApiServer()) return;
  if (!isSetupDone()) {
    log('Пропуск автозапуска API: первый запуск или настройка ещё не завершена.');
    return;
  }
  const readiness = validateConfigCompleteForServer();
  if (!readiness.ok) {
    log(`Пропуск автозапуска API: ${readiness.message}`, true);
    return;
  }
  try {
    const config = await Promise.resolve(getDbConfig());
    const apiPort = config?.apiPort ?? 3000;
    const server = await startApi(apiPort);
    setApiServer(server);
    log(`API автоматически запущен (порт ${apiPort}).`);
  } catch (err) {
    log(`Автозапуск API не удался: ${err.message || err}`, true);
  }
}

module.exports = { tryAutoStartApi };

#!/usr/bin/env node
/**
 * Точка входа для запуска API без GUI (headless).
 * Запуск: node server.js  или  npm run start:headless
 * Настройки — только из .env (создаётся с значениями по умолчанию при первом запуске). Изменить — командой node scripts/set-env.js KEY=value
 */
require('./src/common/envLoader').loadEnv();
const { getDbConfig } = require('./src/common/envLoader');
const { deploy } = require('./src/db/deploy');
const { startApi, stopApi } = require('./src/api/app');

const DEFAULT_PORT = 3000;

async function main() {
  const config = getDbConfig();
  const port = config.apiPort ?? DEFAULT_PORT;

  await deploy();
  await startApi(port);

  const shutdown = async () => {
    console.log('\nОстановка API...');
    await stopApi();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Точка входа для запуска API без GUI (headless).
 * Запуск: node server.js  или  npm run start:headless
 */
require('dotenv').config();

const { isConfigured, getDbConfig } = require('./src/common/config');
const { deploy } = require('./src/db/deploy');
const { startApi, stopApi } = require('./src/api/app');

const DEFAULT_PORT = 3000;

async function main() {
  if (!(await isConfigured())) {
    console.error('Конфигурация не задана.');
    console.error('Создайте конфиг: node scripts/setup-cli.js');
    console.error('Либо создайте вручную JSON-файл с ключом dbConfig (host, port, user, password, database, apiPort).');
    process.exit(1);
  }

  const config = await getDbConfig();
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

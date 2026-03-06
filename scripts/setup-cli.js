#!/usr/bin/env node
/**
 * Интерактивная настройка переменных окружения (headless).
 * Записывает значения в .env. Изменить позже можно только этой командой или node scripts/set-env.js KEY=value
 */
require('../src/common/envLoader').loadEnv();
const { getEnvFilePath, setDbConfig, DB_NAME } = require('../src/common/envLoader');
const { parsePort } = require('./cli-utils');

const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function question(prompt, defaultValue = '') {
  const suffix = defaultValue ? ` [${defaultValue}]` : '';
  return new Promise((resolve) => {
    rl.question(`${prompt}${suffix}: `, (answer) => resolve(String(answer).trim() || defaultValue));
  });
}

async function secureEnvFileOnUnix() {
  if (process.platform === 'win32') return;
  try {
    const { chmod } = require('fs').promises;
    await chmod(getEnvFilePath(), 0o600);
    console.log('Права на .env установлены (600).');
  } catch (e) {
    console.warn('Не удалось установить права на .env:', e.message);
  }
}

async function main() {
  console.log('Настройка API Deployer (headless)\n');
  console.log('Значения будут записаны в:', getEnvFilePath());

  const host = await question('MySQL host', '127.0.0.1');
  const port = parsePort(await question('MySQL port', '3306'), 3306);
  const user = await question('MySQL user', 'root');
  const password = await question('MySQL password', '');
  const apiPort = parsePort(await question('API port', '3000'), 3000);

  await setDbConfig({
    host,
    port,
    user,
    password,
    database: DB_NAME,
    apiPort,
    apiHost: '0.0.0.0'
  });

  await secureEnvFileOnUnix();
  console.log('\nНастройки сохранены в .env. Запуск API: node server.js');
  console.log('Изменить позже: node scripts/set-env.js DB_HOST=... API_PORT=...');
  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});

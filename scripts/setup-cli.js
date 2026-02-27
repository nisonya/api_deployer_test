const readline = require('readline');
const { getConfigFilePath, setDbConfig, DB_NAME } = require('../src/common/config');
const { parsePort } = require('./cli-utils');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function question(prompt, defaultValue = '') {
  const suffix = defaultValue ? ` [${defaultValue}]` : '';
  return new Promise((resolve) => {
    rl.question(`${prompt}${suffix}: `, (answer) => resolve(String(answer).trim() || defaultValue));
  });
}

async function secureConfigFileOnUnix() {
  if (process.platform === 'win32') return;
  try {
    const { chmod } = require('fs').promises;
    await chmod(getConfigFilePath(), 0o600);
    console.log('Права на конфиг установлены (600).');
  } catch (e) {
    console.warn('Не удалось установить права на конфиг:', e.message);
  }
}

async function main() {
  console.log('Настройка API Deployer (headless)\n');
  console.log('Конфиг будет записан в:', getConfigFilePath());

  const host = await question('MySQL host', '127.0.0.1');
  const port = parsePort(await question('MySQL port', '3306'), 3306);
  const user = await question('MySQL user', 'root');
  const password = await question('MySQL password', '');
  const apiPort = parsePort(await question('API port', '3000'), 3000);
  const apiHostAnswer = await question('Слушать на всех интерфейсах (0.0.0.0) для доступа с других машин? (y/n)', 'n');
  const apiHost = /^y|yes|да|д$/i.test(apiHostAnswer) ? '0.0.0.0' : '127.0.0.1';

  await setDbConfig({
    host,
    port,
    user,
    password,
    database: DB_NAME,
    apiPort,
    apiHost
  });

  await secureConfigFileOnUnix();
  console.log('\nКонфигурация сохранена. Запуск API: node server.js');
  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});

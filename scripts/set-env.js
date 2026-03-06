#!/usr/bin/env node
/**
 * Изменение настроек (только так на headless).
 * Использование: node scripts/set-env.js KEY=value [KEY2=value2 ...]
 * Пример: node scripts/set-env.js DB_HOST=127.0.0.1 API_PORT=3000 DB_PASSWORD=secret
 * Переменные записываются в .env в каталоге настроек. После изменений перезапустите приложение.
 */
require('../src/common/envLoader').loadEnv();
const { writeEnvVars, getEnvFilePath } = require('../src/common/envLoader');

const args = process.argv.slice(2);
const vars = {};
for (const arg of args) {
  const eq = arg.indexOf('=');
  if (eq > 0) {
    const key = arg.slice(0, eq).trim();
    const value = arg.slice(eq + 1).trim();
    if (key) vars[key] = value;
  }
}
if (Object.keys(vars).length === 0) {
  console.error('Использование: node scripts/set-env.js KEY=value [KEY2=value2 ...]');
  console.error('Пример: node scripts/set-env.js DB_HOST=127.0.0.1 API_PORT=3000');
  process.exit(1);
}
writeEnvVars(vars);
console.log('Записано в', getEnvFilePath(), ':', Object.keys(vars).join(', '));
console.log('Перезапустите приложение для применения.');

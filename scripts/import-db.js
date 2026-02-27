
const { runCliTask, exitWithError } = require('./cli-utils');
const { importSeed } = require('../src/main/ipcHandlers');

const filePath = process.argv[2];
if (!filePath) {
  exitWithError('Укажите путь к .sql файлу: node scripts/import-db.js <файл.sql>');
}

const onProgress = (p) => process.stdout.write(`\rИмпорт: ${p}%`);

runCliTask(
  () => importSeed(filePath, onProgress),
  (r) => console.log(`\nГотово. Обработано INSERT: ${r.processedInserts}`)
);


const path = require('path');
const { runCliTask } = require('./cli-utils');
const { exportSeed } = require('../src/main/ipcHandlers');

const filePath = process.argv[2] || path.join(process.cwd(), `kvant-seed-${new Date().toISOString().slice(0, 10)}.sql`);
const onProgress = (p) => process.stdout.write(`\rЭкспорт: ${p}%`);

runCliTask(
  () => exportSeed(filePath, onProgress),
  (r) => console.log(`\nГотово: ${r.filePath}`)
);

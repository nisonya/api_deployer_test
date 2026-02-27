
function loadEnv() {
  try {
    require('dotenv').config();
  } catch (_) {}
}

function parsePort(str, defaultValue) {
  const n = parseInt(String(str), 10);
  return Number.isFinite(n) ? n : (defaultValue ?? 3000);
}

function exitWithError(message, code = 1) {
  console.error(message);
  process.exit(code);
}

/**
 * Запускает асинхронную задачу с предзагрузкой dotenv и единообразной обработкой ошибок.
 * @param {() => Promise<{ success: boolean, message?: string, [key: string]: any }>} task
 * @param {(result: any) => void} onSuccess — вызывается при result.success === true
 */
async function runCliTask(task, onSuccess) {
  loadEnv();
  try {
    const result = await task();
    if (result.success) {
      onSuccess(result);
    } else {
      exitWithError(result.message || 'Ошибка', 1);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

module.exports = { loadEnv, parsePort, exitWithError, runCliTask };

/**
 * Парсит значение как положительное целое (id).
 * @param { any } value 
 * @returns { number | null } 
 */
function parsePositiveId(value) {
  if (value == null) return null;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}

/**
 * Проверяет наличие обязательных полей в объекте (например req.body).
 * @param { object } obj
 * @param { string[] } keys
 * @returns { { valid: true } | { valid: false, message: string } }
 */
function requireBodyKeys(obj, keys) {
  if (!obj || typeof obj !== 'object') {
    return { valid: false, message: 'The request body is missing or is not an object.' };
  }
  const missing = keys.filter((k) => obj[k] == null || obj[k] === '');
  if (missing.length) {
    return { valid: false, message: `Required fields: ${missing.join(', ')}.` };
  }
  return { valid: true };
}

module.exports = { parsePositiveId, requireBodyKeys };

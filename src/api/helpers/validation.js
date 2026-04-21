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
 * @param { { allowEmpty?: boolean } } [options] — если `allowEmpty: true`, пустая строка `''` и `null` считаются заданными; отсутствует только ключ (`undefined`).
 * @returns { { valid: true } | { valid: false, message: string } }
 */
function requireBodyKeys(obj, keys, options = {}) {
  if (!obj || typeof obj !== 'object') {
    return { valid: false, message: 'Тело запроса отсутствует или не является объектом JSON.' };
  }
  const allowEmpty = options.allowEmpty === true;
  const missing = keys.filter((k) => {
    const v = obj[k];
    if (allowEmpty) {
      return v === undefined;
    }
    return v == null || v === '';
  });
  if (missing.length) {
    return { valid: false, message: `Обязательные поля: ${missing.join(', ')}.` };
  }
  return { valid: true };
}

/** Пустая строка / null / undefined → null; иначе целое число или null при NaN */
function optionalInt(value) {
  if (value === '' || value === undefined || value === null) return null;
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return null;
  return n;
}

/** Текстовые поля: в БД хранится пустая строка, не NULL */
function textField(value) {
  if (value === undefined || value === null) return '';
  return String(value);
}

/** Числовые поля (счётчики и т.п.): пусто → 0 */
function intOrZero(value) {
  if (value === '' || value === undefined || value === null) return 0;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Для опционального FK: пусто → null; иначе как parsePositiveId */
function optionalPositiveId(value) {
  if (value === '' || value === undefined || value === null) return null;
  return parsePositiveId(value);
}

/** Поля DATE в MySQL: пустая строка недопустима → NULL */
function dateOrNull(value) {
  if (value === '' || value === undefined || value === null) return null;
  return value;
}

module.exports = { parsePositiveId, requireBodyKeys, optionalInt, optionalPositiveId, textField, intOrZero, dateOrNull };

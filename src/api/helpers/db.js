const { getPool } = require('../../db/connection');

/**
 * Выполняет асинхронную функцию с подключением к БД.
 * Подключение получается из пула и гарантированно освобождается в finally.
 *
 * @param { (conn: import('mysql2/promise').PoolConnection) => Promise<any> } fn 
 * @returns { Promise<any> }
 */
async function withConnection(fn) {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    return await fn(conn);
  } finally {
    conn.release();
  }
}

module.exports = { withConnection };

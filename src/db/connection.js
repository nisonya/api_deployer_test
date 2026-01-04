const mysql = require('mysql2/promise');
const { getDbConfig } = require('../common/config');
let pool = null;

async function getPool() {
  if (!pool) {
    const config = await getDbConfig();
    if (!config) throw new Error('DB config not set');
    pool = mysql.createPool({
      host: config.host || 'localhost',
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

module.exports = { getPool };
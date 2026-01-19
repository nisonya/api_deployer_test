const mysql = require('mysql2/promise');
const { getDbConfig } = require('../common/config');
let pool = null;
let adminPool = null;

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
async function getAdminPool() {
  if (!adminPool) {
    const config = await getDbConfig();
    if (!config) throw new Error('DB config not set');

    adminPool = mysql.createPool({
      host: config.host || 'localhost',
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      multipleStatements: true 
    });
  }
  return adminPool;
}

module.exports = { getPool, getAdminPool };
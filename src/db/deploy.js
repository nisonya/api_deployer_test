const fs = require('fs').promises;
const path = require('path');
const { getAdminPool } = require('./connection');
const { getDbConfig } = require('../common/config');

async function deploy() {
  const pool = await getAdminPool();
  const conn = await pool.getConnection();
  const config = await getDbConfig();
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
    await conn.query(`USE \`${config.database}\``);
    const [rows] = await conn.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'attendance'`,
      [config.database]
    );

    if (rows.length > 0) {
      console.log('DB is alredy deployed');
      return;
    }

    console.log('deploy scheme..');
    const schemaPath = path.join(__dirname, 'scripts/schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
await conn.query('SET FOREIGN_KEY_CHECKS=0;');

    let currentDelimiter = ';';
    const lines = schemaSql.split(/\r?\n/); 
    let query = '';
    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('DELIMITER ')) {
        currentDelimiter = trimmedLine.substring('DELIMITER '.length).trim();
        continue;
      }

      query += line + '\n';

      if (query.trim().endsWith(currentDelimiter)) {
        query = query.trim().slice(0, -currentDelimiter.length).trim();
        if (query !== '') {
          await conn.query(query);
        }
        query = '';
      }
    }

    if (query.trim() !== '') {
      await conn.query(query.trim());
    }

    await conn.query('SET FOREIGN_KEY_CHECKS=1;');

    console.log('schema deployed sucssesfully');
  } catch (err) {
    console.error('Deploy error:', err);
    process.exit(1);
  } finally {
    conn.release();
  }
}

module.exports = { deploy };
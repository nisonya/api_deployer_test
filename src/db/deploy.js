const fs = require('fs').promises;
const path = require('path');
const { getAdminPool, getPool } = require('./connection');
const { getDbConfig } = require('../common/envLoader');
const bcrypt = require('bcryptjs');

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
      await initRootUser();
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
    await initRootUser();
    console.log('schema deployed sucssesfully');
  } catch (err) {
    console.error('Deploy error:', err);
    process.exit(1);
  } finally {
    conn.release();
  }
}
async function initRootUser() {
  const pool = await getPool();
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM profile');

  if (rows[0].count === 0) {
    const defaultLogin = 'rootroot'; // не менее 6 символов (триггер в БД)
    const defaultPassword = 'initial123'; // Изменить после первого логина!
    const hash = await bcrypt.hash(defaultPassword, 12);
    const defaultAccessLevel = 1; // Админ-уровень

    // profile привязан к employees; создаём системного сотрудника для root
    const [empResult] = await pool.query(
      `INSERT INTO employees (first_name, second_name, date_of_birth, position) VALUES (?, ?, ?, NULL)`,
      ['System', 'Admin', '2000-01-01']
    );
    const employeeId = empResult.insertId;

    await pool.query(
      'INSERT INTO profile (employee_id, login, password_hash, access_level_id) VALUES (?, ?, ?, ?)',
      [employeeId, defaultLogin, hash, defaultAccessLevel]
    );

    console.log('Создан root-аккаунт: login: rootroot, password: initial123. Смените пароль!');
  }
}  

module.exports = { deploy};
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
      console.log('БД уже развернута');
      return;
    }

    console.log('Разворачиваем схему...');
    const schemaPath = path.join(__dirname, 'scripts/schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('/*')); // убираем комментарии

    for (const stmt of statements) {
      if (stmt) {
        await conn.query(stmt);
      }
    }

    console.log('Схема применена успешно');

    // Опциональный seed
    const seedPath = path.join(__dirname, 'scripts/seed.sql');
    try {
      await fs.access(seedPath);
      if (process.env.SEED_DB === 'true') {
        console.log('Применяем seed...');
        const seedSql = await fs.readFile(seedPath, 'utf8');
        await conn.query(seedSql);
        console.log('Seed применён');
      }
    } catch (err) {
      if (err.code === 'ENOENT') console.log('seed.sql не найден — пропуск');
      else throw err;
    }
  } catch (err) {
    console.error('Ошибка деплоя БД:', err);
    process.exit(1);
  } finally {
    conn.release();
  }
}

module.exports = { deploy };
const fs = require('fs').promises;
const path = require('path');
const { getPool } = require('./connection');

async function deploy() {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'attendance'`,
      [process.env.DB_NAME]
    );

    if (rows.length > 0) {
      console.log('БД уже развернута');
      return;
    }

    console.log('Разворачиваем схему...');
    const schemaPath = path.join(__dirname, 'scripts/schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    await conn.query(schemaSql);
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
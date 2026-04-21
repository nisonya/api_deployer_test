const fs = require('fs').promises;
const path = require('path');
const { getAdminPool, getPool } = require('./connection');
const { getDbConfig } = require('../common/envLoader');
const bcrypt = require('bcryptjs');

async function deploy() {
  const pool = await getAdminPool();
  const config = await getDbConfig();
  const conn = await pool.getConnection();
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
      await ensureTypesOfOrganization();
      await ensureFormOfHolding();
      await ensurePartStudentStatuses();
      await ensureEmployeeDeleteTrigger();
      await ensurePositionNoDiscription();
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
    await ensureTypesOfOrganization();
    await ensureFormOfHolding();
    await ensurePartStudentStatuses();
    await ensureEmployeeDeleteTrigger();
    await ensurePositionNoDiscription();
    console.log('schema deployed sucssesfully');
  } catch (err) {
    console.error('Deploy error:', err);
    process.exit(1);
  } finally {
    conn.release();
  }
}

/** Справочник статусов учеников мероприятий участия (id 1–3). Идемпотентно. */
async function ensurePartStudentStatuses() {
  try {
    const pool = await getPool();
    await pool.query(
      `CREATE TABLE IF NOT EXISTS event_part_student_status (
        id int unsigned NOT NULL AUTO_INCREMENT,
        name varchar(50) NOT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    );
    await pool.query(
      `INSERT IGNORE INTO event_part_student_status (id, name) VALUES
        (1, 'Участник'),
        (2, 'Победитель'),
        (3, 'Призёр')`
    );

    await pool.query(
      `CREATE TABLE IF NOT EXISTS event_part_student (
        id bigint unsigned NOT NULL AUTO_INCREMENT,
        id_event int unsigned NOT NULL,
        id_student int unsigned NOT NULL,
        id_status int unsigned NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_event_student (id_event, id_student),
        KEY fk_eps_student (id_student),
        KEY fk_eps_status (id_status),
        CONSTRAINT fk_eps_event FOREIGN KEY (id_event) REFERENCES event_plan_participation (id) ON DELETE CASCADE,
        CONSTRAINT fk_eps_student FOREIGN KEY (id_student) REFERENCES students (idStudent) ON DELETE CASCADE,
        CONSTRAINT fk_eps_status FOREIGN KEY (id_status) REFERENCES event_part_student_status (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    );
  } catch (err) {
    console.error('ensurePartStudentStatuses:', err.message);
  }
}

/** Справочник типов организации (id 1–3). Идемпотентно: для уже развёрнутой БД без этих строк. */
async function ensureTypesOfOrganization() {
  try {
    const pool = await getPool();
    await pool.query(
      `INSERT IGNORE INTO types_of_organization (id_type, name) VALUES
        (1, 'Комплексный план'),
        (2, 'Гос. задние'),
        (3, 'Внешние')`
    );
  } catch (err) {
    console.error('ensureTypesOfOrganization:', err.message);
  }
}

/** Справочник форм проведения (id 1–3). Идемпотентно при каждом старте API. */
async function ensureFormOfHolding() {
  try {
    const pool = await getPool();
    await pool.query(
      `INSERT IGNORE INTO form_of_holding (id, name) VALUES
        (1, 'очно'),
        (2, 'заочно'),
        (3, 'очно/заочно')`
    );
  } catch (err) {
    console.error('ensureFormOfHolding:', err.message);
  }
}

/**
 * Обновляет триггер employees_BEFORE_DELETE, чтобы каскадно удалять записи
 * из profile, employees_schedule, responsible_for_org_events, responsible_for_part_events.
 * Идемпотентно: пересоздаёт триггер при каждом деплое.
 */
async function ensureEmployeeDeleteTrigger() {
  try {
    const pool = await getPool();
    await pool.query('DROP TRIGGER IF EXISTS `employees_BEFORE_DELETE`');
    await pool.query(`
      CREATE TRIGGER employees_BEFORE_DELETE BEFORE DELETE ON employees FOR EACH ROW
      BEGIN
        SET SQL_SAFE_UPDATES = 0;
        DELETE FROM profile                     WHERE employee_id = OLD.id_employees;
        DELETE FROM employees_schedule          WHERE idEmployees = OLD.id_employees;
        DELETE FROM responsible_for_org_events  WHERE id_employee = OLD.id_employees;
        DELETE FROM responsible_for_part_events WHERE id_employee = OLD.id_employees;
        SET SQL_SAFE_UPDATES = 1;
      END
    `);
  } catch (err) {
    console.error('ensureEmployeeDeleteTrigger:', err.message);
  }
}

/** Удаляет колонку discription у таблицы position (если есть). Идемпотентно. */
async function ensurePositionNoDiscription() {
  try {
    const pool = await getPool();
    const [cols] = await pool.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'position' AND COLUMN_NAME = 'discription'`
    );
    if (cols.length > 0) {
      await pool.query('ALTER TABLE `position` DROP COLUMN `discription`');
    }
  } catch (err) {
    console.error('ensurePositionNoDiscription:', err.message);
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
      `INSERT INTO employees (first_name, second_name, date_of_birth, \`position\`) VALUES (?, ?, ?, NULL)`,
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
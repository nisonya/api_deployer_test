/**
 * Setup приложения для тестов API.
 *
 * Логика: используем то же приложение (app), что и в проде, но мокаем модуль БД (connection)
 * до того, как app и middleware загрузятся. Поэтому в тестах (в tests/api/...) нужно вызывать jest.mock('../../../src/db/connection')
 * до require('../../setup'). Auth middleware тоже использует getPool(), поэтому мок пула должен
 * возвращать и getConnection() (для withConnection в контроллерах), и query() (для middleware,
 * который проверяет пользователя). В тестах мы подменяем query так, чтобы первый вызов
 * (проверка токена) возвращал валидного пользователя, а остальные — данные для контроллера.
 */
const express = require('express');
const app = express();

app.use(express.json());

const authMiddleware = require('../src/api/middleware/auth');

app.use('/api/auth', require('../src/api/modules/auth/routes'));
app.use('/api/employees', authMiddleware, require('../src/api/modules/employees/routes'));
app.use('/api/events/org', authMiddleware, require('../src/api/modules/events/orgRoutes'));
app.use('/api/events/part', authMiddleware, require('../src/api/modules/events/partRoutes'));
app.use('/api/schedule', authMiddleware, require('../src/api/modules/schedule/routes'));
app.use('/api/reference', authMiddleware, require('../src/api/modules/reference/routes'));
app.use('/api/rent', authMiddleware, require('../src/api/modules/rent/routes'));
app.use('/api/students', authMiddleware, require('../src/api/modules/students/routes'));
app.use('/api/attendance', authMiddleware, require('../src/api/modules/attendance/routes'));
app.use('/api/groups', authMiddleware, require('../src/api/modules/groups/routes'));

app.get('/', (req, res) => res.send('API work'));

module.exports = app;

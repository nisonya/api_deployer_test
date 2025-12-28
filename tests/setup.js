const express = require('express');
const app = express();

app.use(express.json());

// Монтируем все routers (точно как в main.js)
app.use('/api/events', require('../src/api/modules/events/routes'));
app.use('/api/employees', require('../src/api/modules/employees/routes'));
app.use('/api/schedule', require('../src/api/modules/schedule/routes'));
// Добавьте остальные по мере создания

module.exports = app;
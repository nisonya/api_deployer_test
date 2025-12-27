const express = require('express');
const app = express();

app.use(express.json());

// Монтируем все routers (точно как в main.js)
app.use('/api/events', require('../../api/routes/events'));
app.use('/api/employees', require('../../api/routes/employees'));
app.use('/api/schedule', require('../../api/routes/schedule'));
// Добавьте остальные по мере создания

module.exports = app;
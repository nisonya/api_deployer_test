const express = require('express');
const router = express.Router();
const controller = require('./controller');

// GET /api/employees — все активные сотрудники
router.get('/', controller.getAllEmployees);

// GET /api/employees/schedule — расписание сотрудников (должен быть до /:id)
router.get('/schedule', controller.getSchedule);

// GET /api/employees/:id — сотрудник по id
router.get('/:id', controller.getById);

// POST /api/employees — назначить сотрудника на мероприятие (event_id, employee_id)
router.post('/', controller.assignToEvent);

module.exports = router;
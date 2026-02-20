const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth'); 

// GET /api/employees — все сотрудники
router.get('/', authMiddleware, (req, res) => {
  // логика (выноси в controller.js, если много)
  res.json({ success: true, data: 'all employees' });
});

// GET /api/employees/:id — сотрудник по id
router.get('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  // логика
  res.json({ success: true, data: `employee with id ${id}` });
});

// GET /api/employees/schedule — расписание сотрудников
router.get('/schedule', authMiddleware, (req, res) => {
  // логика
  res.json({ success: true, data: 'employees schedule' });
});

// POST /api/employees — создать сотрудника
router.post('/', authMiddleware, (req, res) => {
  const { event_id, employee_id } = req.body;
  if (!event_id || !employee_id) {
    return res.status(400).json({ success: false, message: 'event_id и employee_id обязательны' });
  }
  // логика
  res.status(201).json({ success: true });
});

// ... другие методы здесь

module.exports = router;
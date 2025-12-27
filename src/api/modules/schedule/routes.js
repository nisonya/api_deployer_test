const express = require('express');
const router = express.Router();

// GET /api/events/organization
router.get('/', (req, res) => {
  // логика
  res.json({ success: true, data: 'schedule ' });
});

// POST /api/events/participation
router.post('/', (req, res) => {
  const { schedule_id, time} = req.body;
  if (!schedule_id || !time) {
    return res.status(400).json({ 
      success: false, 
      message: 'time и schedule_id обязательны' 
    });
  }
  res.status(201).json({ success: true });
});

// ... все методы для events здесь

module.exports = router;
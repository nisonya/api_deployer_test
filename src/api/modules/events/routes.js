const express = require('express');
const router = express.Router();

// GET /api/events/organization
router.get('/organization', (req, res) => {
  // логика
  res.json({  success: true,
    data: 'events organization' });
});

// POST /api/events/participation
router.post('/participation', (req, res) => {
  const { event_id, name} = req.body;
  if (!event_id || !name) {
    return res.status(400).json({ 
      success: false, 
      message: 'event_id и name обязательны' 
    });
  }
  res.status(201).json({ success: true });
});

// ... все методы для events здесь

module.exports = router;
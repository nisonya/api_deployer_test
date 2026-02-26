const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/by-group/:id', controller.getByGroup);
router.put('/by-group-date', controller.getByGroupAndDate);
router.put('/by-group-date-new', controller.getByGroupAndDateNew);
router.post('/', controller.newAttendance);

module.exports = router;

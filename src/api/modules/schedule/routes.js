const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/', controller.getSchedule);
router.get('/teachers', controller.getTeachers);
router.get('/groups', controller.getGroups);
router.post('/by-date', controller.getScheduleByDate);
router.get('/by-teacher/:id', controller.getScheduleByTeacher);
router.get('/by-group/:id', controller.getScheduleByGroup);
router.get('/by-room/:id', controller.getScheduleByRoom);
router.post('/', controller.addSchedule);
router.put('/', controller.updateSchedule);
router.delete('/:id', controller.deleteSchedule);

module.exports = router;

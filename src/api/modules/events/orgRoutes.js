const express = require('express');
const router = express.Router();
const controller = require('./orgController');

router.post('/list', controller.list);
router.post('/count', controller.count);
router.get('/resp-table', controller.respTable);
router.get('/full-inf/:id', controller.fullInf);
router.get('/responsible/:id', controller.responsible);
router.get('/notifications-today/:id', controller.notificationsToday);
router.get('/notifications-tomorrow/:id', controller.notificationsTomorrow);
router.put('/notifications', controller.notifications);
router.post('/', controller.add);
router.put('/', controller.update);
router.post('/responsible', controller.newResponsible);
router.delete('/responsible', controller.deleteResponsible);
router.delete('/:id', controller.deleteEvent);

module.exports = router;

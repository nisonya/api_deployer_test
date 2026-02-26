const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/by-event/:id', controller.getByEvent);
router.get('/by-id/:id', controller.getById);
router.post('/by-date-room', controller.getByDateAndRoom);
router.post('/', controller.newRent);
router.put('/', controller.updateRent);
router.delete('/:id', controller.deleteRent);

module.exports = router;

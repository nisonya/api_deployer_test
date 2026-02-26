const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/rooms', controller.getRooms);
router.get('/access', controller.getAccess);
router.get('/positions', controller.getPositions);
router.get('/docs', controller.getDocs);
router.get('/types-of-holding', controller.getTypesOfHolding);
router.get('/levels', controller.getLevels);

module.exports = router;

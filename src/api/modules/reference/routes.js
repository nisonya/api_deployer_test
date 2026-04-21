const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/rooms', controller.getRooms);
router.get('/access/:employeeId', controller.getAccessByEmployee);
router.get('/access', controller.getAccess);
router.get('/positions', controller.getPositions);
router.post('/positions', controller.addPosition);
router.put('/positions/:id', controller.updatePosition);
router.delete('/positions/:id', controller.deletePosition);
router.get('/docs', controller.getDocs);
router.post('/docs', controller.addDoc);
router.put('/docs/:id', controller.updateDoc);
router.delete('/docs/:id', controller.deleteDoc);
router.get('/types-of-holding', controller.getTypesOfHolding);
router.get('/levels', controller.getLevels);
router.get('/types-of-organization', controller.getTypesOfOrganization);
router.get('/student-statuses', controller.getStudentStatuses);

module.exports = router;

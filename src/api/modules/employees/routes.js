const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/', controller.getAllEmployees);
router.get('/all', controller.getAllEmployeesLegacy);
router.get('/schedule', controller.getSchedule);
router.get('/short-list', controller.getShortList);
router.get('/sizes', controller.getSizes);
router.get('/search', controller.searchByLetter);
router.get('/search/:letter', controller.searchByLetter);
router.get('/kpi/:id', controller.getKpi);
router.get('/:id', controller.getById);

router.post('/', controller.assignToEvent);
router.post('/add', controller.addEmployee);

router.put('/kpi', controller.setKpi);
router.put('/contact', controller.updateContact);
router.put('/size', controller.updateSize);

module.exports = router;
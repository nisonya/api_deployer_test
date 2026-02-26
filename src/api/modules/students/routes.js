const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/search', controller.searchByLetter);
router.get('/search/:letter', controller.searchByLetter);
router.get('/search-new', controller.searchByLetterNew);
router.get('/search-new/:letter', controller.searchByLetterNew);
router.get('/groups-by-student/:id', controller.getGroupsByStudent);
router.get('/by-group/:id', controller.getByGroupId);
router.get('/full-by-group/:id', controller.getFullInfByGroup);
router.get('/:id', controller.getById);
router.put('/exist', controller.checkExist);
router.post('/add-to-group', controller.addToGroup);
router.post('/', controller.addStudent);
router.put('/', controller.updateStudent);
router.put('/update-to-group', controller.updateStudentToGroup);
router.delete('/from-group', controller.deleteFromGroup);

module.exports = router;

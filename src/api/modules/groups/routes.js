const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/by-teacher/:id', controller.getGroupsByTeacher);
router.get('/table', controller.getTableStudentsGroup);
router.get('/pixels/:id', controller.getPixelsByGroup);
router.get('/list', controller.getList);
router.post('/list', controller.addGroup);
router.put('/list/:id', controller.updateGroup);
router.delete('/list/:id', controller.deleteGroup);
router.put('/pixels', controller.updatePixels);

module.exports = router;

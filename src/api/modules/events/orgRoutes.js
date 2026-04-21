const express = require('express');
const multer = require('multer');
const router = express.Router();
const controller = require('./orgController');
const { orgHandlers, MAX_FILE_BYTES } = require('./eventDocumentHandlers');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES }
});

function uploadSingle(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: `Файл слишком большой (макс. ${Math.round(MAX_FILE_BYTES / (1024 * 1024))} МБ).` });
    }
    return next(err);
  });
}

router.get('/documents/:documentId/download', orgHandlers.download);
router.delete('/documents/:documentId', orgHandlers.remove);
router.patch('/documents/:documentId', orgHandlers.patchSort);
router.get('/:eventId/documents', orgHandlers.list);
router.post('/:eventId/documents', uploadSingle, orgHandlers.upload);

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

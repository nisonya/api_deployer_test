const express = require('express');
const router = express.Router();

const orgRoutes = require('./orgRoutes');
const partRoutes = require('./partRoutes');

router.use('/org', orgRoutes);
router.use('/part', partRoutes);

module.exports = router;

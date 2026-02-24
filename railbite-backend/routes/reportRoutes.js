const express = require('express');
const router = express.Router();
const { getReport, getPopularItems } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, admin, getReport);
router.get('/popular-items', protect, admin, getPopularItems);

module.exports = router;

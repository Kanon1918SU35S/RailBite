const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
    getVapidKey,
    subscribe,
    unsubscribe,
    sendBroadcast,
} = require('../controllers/pushController');

// Public – get VAPID key for browser
router.get('/vapid-key', getVapidKey);

// Authenticated – manage subscription
router.post('/subscribe', protect, subscribe);
router.post('/unsubscribe', protect, unsubscribe);

// Admin – send broadcast push
router.post('/broadcast', protect, admin, sendBroadcast);

module.exports = router;

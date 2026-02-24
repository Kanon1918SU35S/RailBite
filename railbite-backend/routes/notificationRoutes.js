const express = require('express');
const router = express.Router();
const {
  getAll,
  send,
  deleteNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/auth');

// ── Authenticated user routes (any role) ──
router.get('/my', protect, getMyNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.patch('/read-all', protect, markAllAsRead);
router.patch('/:id/read', protect, markAsRead);

// ── Admin-only routes ──
router.get('/', protect, admin, getAll);
router.post('/', protect, admin, send);
router.delete('/:id', protect, admin, deleteNotification);

module.exports = router;

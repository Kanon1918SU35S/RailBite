const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getAllMessages,
  updateStatus,
  deleteMessage
} = require('../controllers/contactController');
const { protect, admin } = require('../middleware/auth');

router.post('/', sendMessage);
router.get('/', protect, admin, getAllMessages);
router.patch('/:id/status', protect, admin, updateStatus);
router.delete('/:id', protect, admin, deleteMessage);

module.exports = router;

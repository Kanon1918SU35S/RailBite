const express = require('express');
const router = express.Router();
const {
  getAllStaff,
  getAvailableStaff,
  createStaff,
  updateStaff,
  deleteStaff
} = require('../controllers/deliveryStaffController');
const { protect, admin } = require('../middleware/auth');

router.get('/available', protect, admin, getAvailableStaff);
router.get('/', protect, admin, getAllStaff);
router.post('/', protect, admin, createStaff);
router.put('/:id', protect, admin, updateStaff);
router.delete('/:id', protect, admin, deleteStaff);

module.exports = router;

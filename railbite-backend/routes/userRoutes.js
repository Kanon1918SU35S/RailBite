const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUser,
  toggleStatus,
  deleteUser,
  createUser,
  updateProfile
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, admin, getAllUsers);
router.post('/', protect, admin, createUser);
router.put('/profile', protect, updateProfile);
router.put('/:id', protect, admin, updateUser);
router.patch('/:id/toggle-status', protect, admin, toggleStatus);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;

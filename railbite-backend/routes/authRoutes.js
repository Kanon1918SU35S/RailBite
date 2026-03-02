const express = require('express');
const router = express.Router();
const {
  login,
  register,
  getMe,
  seedAdmin,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  testEmail
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);
router.post('/seed-admin', seedAdmin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);
router.get('/test-email', testEmail);
router.post('/test-email', testEmail);

module.exports = router;

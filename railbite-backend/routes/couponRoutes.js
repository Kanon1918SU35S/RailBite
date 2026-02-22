const express = require('express');
const router = express.Router();
const {
    validateCoupon,
    applyCoupon,
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getCouponStats
} = require('../controllers/couponController');
const { protect, admin } = require('../middleware/auth');

// Customer routes
router.post('/validate', protect, validateCoupon);
router.post('/apply', protect, applyCoupon);

// Admin routes
router.get('/stats', protect, admin, getCouponStats);
router.get('/', protect, admin, getAllCoupons);
router.post('/', protect, admin, createCoupon);
router.put('/:id', protect, admin, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

module.exports = router;

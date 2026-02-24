const express = require('express');
const router = express.Router();
const {
    getMyPoints,
    getMyHistory,
    redeemPoints,
    earnPointsForOrder,
    getAllLoyalty,
    awardBonusPoints
} = require('../controllers/loyaltyController');
const { protect, admin } = require('../middleware/auth');

// Customer routes
router.get('/my-points', protect, getMyPoints);
router.get('/history', protect, getMyHistory);
router.post('/redeem', protect, redeemPoints);

// Internal / admin trigger for earning points after delivery
router.post('/earn', protect, earnPointsForOrder);

// Admin routes
router.get('/admin/all', protect, admin, getAllLoyalty);
router.post('/admin/bonus', protect, admin, awardBonusPoints);

module.exports = router;

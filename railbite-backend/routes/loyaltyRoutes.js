const express = require('express');
const router = express.Router();
const {
    getMyPoints,
    getMyHistory,
    redeemPoints,
    earnPointsForOrder,
    getAllLoyalty,
    awardBonusPoints,
    deductPoints,
    getLoyaltyStats,
    getUserLoyaltyDetails
} = require('../controllers/loyaltyController');
const { protect, admin } = require('../middleware/auth');

// Customer routes
router.get('/my-points', protect, getMyPoints);
router.get('/history', protect, getMyHistory);
router.post('/redeem', protect, redeemPoints);

// Internal / admin trigger for earning points after delivery
router.post('/earn', protect, earnPointsForOrder);

// Admin routes
router.get('/admin/stats', protect, admin, getLoyaltyStats);
router.get('/admin/all', protect, admin, getAllLoyalty);
router.get('/admin/user/:userId', protect, admin, getUserLoyaltyDetails);
router.post('/admin/bonus', protect, admin, awardBonusPoints);
router.post('/admin/deduct', protect, admin, deductPoints);

module.exports = router;

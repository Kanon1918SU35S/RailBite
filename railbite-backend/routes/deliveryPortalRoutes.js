const express = require('express');
const router = express.Router();
const {
    getMyStats,
    getMyActiveOrders,
    getActiveDelivery,
    getMyOrders,
    getMyHistory,
    getOrderDetail,
    updateDeliveryStatus,
    getMyProfile,
    updateMyProfile
} = require('../controllers/deliveryPortalController');
const { protect, delivery } = require('../middleware/auth');

// All routes require authentication + delivery role
router.use(protect, delivery);

// Dashboard & stats
router.get('/stats', getMyStats);

// Orders
router.get('/active-orders', getMyActiveOrders);
router.get('/active-delivery', getActiveDelivery);
router.get('/my-orders', getMyOrders);
router.get('/history', getMyHistory);
router.get('/orders/:id', getOrderDetail);
router.patch('/orders/:id/status', updateDeliveryStatus);

// Profile
router.get('/profile', getMyProfile);
router.put('/profile', updateMyProfile);

module.exports = router;

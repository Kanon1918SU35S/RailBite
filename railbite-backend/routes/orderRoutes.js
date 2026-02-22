const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getRecentOrders,
  getMyOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  assignDeliveryStaff,
  getAssignmentStats
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

// specific routes BEFORE param routes
router.get('/recent', protect, admin, getRecentOrders);
router.get('/my-orders', protect, getMyOrders);
router.get('/assignment-stats', protect, admin, getAssignmentStats);

// general routes
router.get('/', protect, admin, getAllOrders);
router.post('/', protect, createOrder);

// param routes LAST
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, admin, updateOrderStatus);
router.post('/:id/assign', protect, admin, assignDeliveryStaff);
router.patch('/:id/cancel', protect, cancelOrder);

module.exports = router;

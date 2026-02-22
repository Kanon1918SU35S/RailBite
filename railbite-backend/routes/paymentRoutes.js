const express = require('express');
const router = express.Router();
const {
    initiatePayment,
    paymentSuccess,
    paymentFail,
    paymentCancel,
    paymentIPN,
    confirmDevPayment,
    getPaymentsByOrder,
    getAllPayments
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/auth');

// Customer: initiate a payment session
router.post('/initiate', protect, initiatePayment);

// Customer: confirm payment in dev mode
router.post('/confirm-dev', protect, confirmDevPayment);

// SSLCommerz callbacks (no auth - called by gateway server)
router.post('/success', paymentSuccess);
router.post('/fail', paymentFail);
router.post('/cancel', paymentCancel);
router.post('/ipn', paymentIPN);

// Get payments for a specific order
router.get('/order/:orderId', protect, getPaymentsByOrder);

// Admin: get all payments
router.get('/', protect, admin, getAllPayments);

module.exports = router;

const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { createNotification } = require('./notificationController');
const { emitOrderUpdate, emitNotification, emitRoleNotification } = require('../sockets/orderSocket');
const { sendPaymentConfirmationEmail } = require('../utils/emailService');
const User = require('../models/User');

const SSLCOMMERZ_STORE_ID = process.env.SSLCOMMERZ_STORE_ID || 'your_store_id';
const SSLCOMMERZ_STORE_PASSWORD = process.env.SSLCOMMERZ_STORE_PASSWORD || 'your_store_password';
const SSLCOMMERZ_IS_SANDBOX = process.env.SSLCOMMERZ_SANDBOX === 'true';
const SSLCOMMERZ_BASE_URL = SSLCOMMERZ_IS_SANDBOX
    ? 'https://sandbox.sslcommerz.com'
    : 'https://securepay.sslcommerz.com';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─────────────────────────────────────────────
// POST /api/payments/initiate – Start an SSLCommerz payment session
// ─────────────────────────────────────────────
exports.initiatePayment = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'orderId is required' });
        }

        const order = await Order.findById(orderId).populate('user', 'name email phone');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Only allow payment for the order owner
        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Don't allow re-payment for already paid orders
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ success: false, message: 'Order is already paid' });
        }

        // Generate unique transaction ID
        const transactionId = `RB_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        // Create a pending payment record
        const payment = await Payment.create({
            order: order._id,
            user: req.user._id,
            transactionId,
            amount: order.totalAmount,
            currency: 'BDT',
            method: 'sslcommerz',
            status: 'pending'
        });

        // Build SSLCommerz params
        const sslParams = {
            store_id: SSLCOMMERZ_STORE_ID,
            store_passwd: SSLCOMMERZ_STORE_PASSWORD,
            total_amount: order.totalAmount,
            currency: 'BDT',
            tran_id: transactionId,
            success_url: `${BACKEND_URL}/api/payments/success`,
            fail_url: `${BACKEND_URL}/api/payments/fail`,
            cancel_url: `${BACKEND_URL}/api/payments/cancel`,
            ipn_url: `${BACKEND_URL}/api/payments/ipn`,
            product_name: `RailBite Order ${order.orderNumber}`,
            product_category: 'Food',
            product_profile: 'general',
            cus_name: order.user.name || 'Customer',
            cus_email: order.user.email || 'customer@railbite.com',
            cus_phone: order.contactInfo?.phone || order.user.phone || '01700000000',
            cus_add1: order.bookingDetails?.pickupStation || 'Railway Station',
            cus_city: 'Dhaka',
            cus_country: 'Bangladesh',
            shipping_method: 'NO',
            multi_card_name: '',
            value_a: order._id.toString(),
            value_b: req.user._id.toString(),
            value_c: order.orderNumber
        };

        // In real implementation, you would POST to SSLCommerz API
        // For now, we simulate the gateway URL for development
        if (SSLCOMMERZ_IS_SANDBOX || !SSLCOMMERZ_STORE_ID || SSLCOMMERZ_STORE_ID === 'your_store_id') {
            // Development mode – simulate payment success
            return res.json({
                success: true,
                data: {
                    paymentId: payment._id,
                    transactionId,
                    amount: order.totalAmount,
                    gatewayUrl: `${FRONTEND_URL}/payment-process?tran_id=${transactionId}&amount=${order.totalAmount}&order=${order.orderNumber}`,
                    mode: 'development'
                }
            });
        }

        // Production: POST to SSLCommerz
        const fetch = (await import('node-fetch')).default;
        const formBody = Object.entries(sslParams)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');

        const sslRes = await fetch(`${SSLCOMMERZ_BASE_URL}/gwprocess/v4`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody
        });

        const sslData = await sslRes.json();

        if (sslData.status === 'SUCCESS') {
            payment.gatewayResponse = sslData;
            payment.gatewayTransactionId = sslData.sessionkey;
            await payment.save();

            return res.json({
                success: true,
                data: {
                    paymentId: payment._id,
                    transactionId,
                    amount: order.totalAmount,
                    gatewayUrl: sslData.GatewayPageURL,
                    mode: 'production'
                }
            });
        } else {
            payment.status = 'failed';
            payment.gatewayResponse = sslData;
            await payment.save();

            return res.status(400).json({
                success: false,
                message: 'Payment gateway error',
                details: sslData.failedreason
            });
        }
    } catch (error) {
        console.error('Payment initiation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// POST /api/payments/success – SSLCommerz success callback
// ─────────────────────────────────────────────
exports.paymentSuccess = async (req, res) => {
    try {
        const { tran_id, val_id, amount, card_type, card_brand, bank_tran_id } = req.body;

        const payment = await Payment.findOne({ transactionId: tran_id });
        if (!payment) {
            return res.redirect(`${FRONTEND_URL}/payment-result?status=error&message=Payment+not+found`);
        }

        // Update payment record
        payment.status = 'completed';
        payment.gatewayTransactionId = val_id || '';
        payment.cardType = card_type || '';
        payment.cardBrand = card_brand || '';
        payment.bankTransactionId = bank_tran_id || '';
        payment.paidAt = new Date();
        payment.gatewayResponse = req.body;
        await payment.save();

        // Update order payment status
        const order = await Order.findById(payment.order);
        if (order) {
            order.paymentStatus = 'paid';
            order.paymentMethod = 'card';
            order.paymentInfo = {
                provider: 'sslcommerz',
                transactionId: tran_id,
                cardType: card_type || '',
                cardholderName: card_brand || ''
            };
            order.advanceAmount = order.totalAmount;
            order.dueAmount = 0;
            await order.save();

            // Emit real-time update
            emitOrderUpdate(order._id.toString(), order.user.toString(), {
                orderId: order._id,
                orderNumber: order.orderNumber,
                paymentStatus: 'paid',
                status: order.status
            });

            // Notify user
            await createNotification({
                type: 'payment',
                title: 'Payment Successful',
                message: `Payment of ৳${amount} for order ${order.orderNumber} was successful.`,
                targetUser: order.user,
                relatedOrder: order._id
            });
            emitNotification(order.user.toString(), {
                type: 'payment', title: 'Payment Successful',
                message: `Payment of ৳${amount} for order ${order.orderNumber} was successful.`
            });

            // Notify admin about payment
            await createNotification({
                type: 'payment',
                title: 'Payment Received',
                message: `Payment of ৳${amount} received for order ${order.orderNumber}.`,
                targetRole: 'admin',
                relatedOrder: order._id
            });
            emitRoleNotification('admin', {
                type: 'payment', title: 'Payment Received',
                message: `Payment of ৳${amount} received for order ${order.orderNumber}.`
            });

            // Send payment confirmation email
            try {
                const customer = await User.findById(order.user).select('name email');
                if (customer) {
                    await sendPaymentConfirmationEmail(customer, order, {
                        amount: parseFloat(amount),
                        method: card_brand || 'Online',
                        transactionId: tran_id
                    });
                }
            } catch (emailErr) {
                console.error('[Email] Payment email failed:', emailErr.message);
            }
        }

        res.redirect(`${FRONTEND_URL}/payment-result?status=success&order=${order?.orderNumber}&tran_id=${tran_id}`);
    } catch (error) {
        console.error('Payment success handler error:', error);
        res.redirect(`${FRONTEND_URL}/payment-result?status=error&message=${encodeURIComponent(error.message)}`);
    }
};

// ─────────────────────────────────────────────
// POST /api/payments/fail – SSLCommerz failure callback
// ─────────────────────────────────────────────
exports.paymentFail = async (req, res) => {
    try {
        const { tran_id } = req.body;

        const payment = await Payment.findOne({ transactionId: tran_id });
        if (payment) {
            payment.status = 'failed';
            payment.gatewayResponse = req.body;
            await payment.save();
        }

        res.redirect(`${FRONTEND_URL}/payment-result?status=failed&tran_id=${tran_id}`);
    } catch (error) {
        res.redirect(`${FRONTEND_URL}/payment-result?status=error`);
    }
};

// ─────────────────────────────────────────────
// POST /api/payments/cancel – SSLCommerz cancel callback
// ─────────────────────────────────────────────
exports.paymentCancel = async (req, res) => {
    try {
        const { tran_id } = req.body;

        const payment = await Payment.findOne({ transactionId: tran_id });
        if (payment) {
            payment.status = 'cancelled';
            payment.gatewayResponse = req.body;
            await payment.save();
        }

        res.redirect(`${FRONTEND_URL}/payment-result?status=cancelled&tran_id=${tran_id}`);
    } catch (error) {
        res.redirect(`${FRONTEND_URL}/payment-result?status=error`);
    }
};

// ─────────────────────────────────────────────
// POST /api/payments/ipn – Instant Payment Notification (server-to-server)
// ─────────────────────────────────────────────
exports.paymentIPN = async (req, res) => {
    try {
        const { tran_id, status, val_id, amount } = req.body;

        const payment = await Payment.findOne({ transactionId: tran_id });
        if (!payment) {
            return res.status(404).json({ success: false });
        }

        if (status === 'VALID' || status === 'VALIDATED') {
            payment.status = 'completed';
            payment.paidAt = new Date();
        } else if (status === 'FAILED') {
            payment.status = 'failed';
        }
        payment.gatewayResponse = req.body;
        await payment.save();

        // If payment is completed, update order
        if (payment.status === 'completed') {
            const order = await Order.findById(payment.order);
            if (order && order.paymentStatus !== 'paid') {
                order.paymentStatus = 'paid';
                order.advanceAmount = order.totalAmount;
                order.dueAmount = 0;
                await order.save();
            }
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// POST /api/payments/confirm-dev – Confirm payment in dev mode
// (Used when SSLCommerz is not configured)
// ─────────────────────────────────────────────
exports.confirmDevPayment = async (req, res) => {
    try {
        const { transactionId } = req.body;

        if (!transactionId) {
            return res.status(400).json({ success: false, message: 'transactionId is required' });
        }

        const payment = await Payment.findOne({ transactionId });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        if (payment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Mark payment as completed
        payment.status = 'completed';
        payment.paidAt = new Date();
        payment.gatewayResponse = { mode: 'development', confirmedAt: new Date() };
        await payment.save();

        // Update order
        const order = await Order.findById(payment.order);
        if (order) {
            order.paymentStatus = 'paid';
            order.paymentMethod = 'card';
            order.paymentInfo = {
                provider: 'sslcommerz-dev',
                transactionId
            };
            order.advanceAmount = order.totalAmount;
            order.dueAmount = 0;
            await order.save();

            emitOrderUpdate(order._id.toString(), order.user.toString(), {
                orderId: order._id,
                orderNumber: order.orderNumber,
                paymentStatus: 'paid',
                status: order.status
            });

            await createNotification({
                type: 'payment',
                title: 'Payment Successful',
                message: `Payment of ৳${payment.amount} for order ${order.orderNumber} confirmed.`,
                targetUser: order.user,
                relatedOrder: order._id
            });
            emitNotification(order.user.toString(), {
                type: 'payment', title: 'Payment Successful',
                message: `Payment of ৳${payment.amount} for order ${order.orderNumber} confirmed.`
            });

            // Notify admin about payment
            await createNotification({
                type: 'payment',
                title: 'Payment Received',
                message: `Payment of ৳${payment.amount} received for order ${order.orderNumber}.`,
                targetRole: 'admin',
                relatedOrder: order._id
            });
            emitRoleNotification('admin', {
                type: 'payment', title: 'Payment Received',
                message: `Payment of ৳${payment.amount} received for order ${order.orderNumber}.`
            });

            // Send payment confirmation email
            try {
                const customer = await User.findById(order.user).select('name email');
                if (customer) {
                    await sendPaymentConfirmationEmail(customer, order, {
                        amount: payment.amount,
                        method: 'Online (Dev)',
                        transactionId
                    });
                }
            } catch (emailErr) {
                console.error('[Email] Payment email failed:', emailErr.message);
            }
        }

        res.json({
            success: true,
            data: {
                payment,
                orderNumber: order?.orderNumber,
                paymentStatus: 'paid'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/payments/order/:orderId – Get payment(s) for an order
// ─────────────────────────────────────────────
exports.getPaymentsByOrder = async (req, res) => {
    try {
        const payments = await Payment.find({ order: req.params.orderId })
            .sort({ createdAt: -1 });
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/payments – Get all payments (admin)
// ─────────────────────────────────────────────
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('order', 'orderNumber totalAmount status')
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

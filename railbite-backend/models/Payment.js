const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        transactionId: {
            type: String,
            required: true,
            unique: true
        },
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'BDT'
        },
        method: {
            type: String,
            enum: ['sslcommerz', 'bkash', 'nagad', 'rocket', 'card', 'mobile', 'cash'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
            default: 'pending'
        },
        gatewayResponse: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        gatewayTransactionId: {
            type: String,
            default: ''
        },
        cardType: {
            type: String,
            default: ''
        },
        cardBrand: {
            type: String,
            default: ''
        },
        bankTransactionId: {
            type: String,
            default: ''
        },
        refundAmount: {
            type: Number,
            default: 0
        },
        refundReason: {
            type: String,
            default: ''
        },
        paidAt: {
            type: Date
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);

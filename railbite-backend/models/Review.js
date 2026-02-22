const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
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
        orderNumber: { type: String, default: '' },
        ratings: {
            food: { type: Number, min: 1, max: 5, required: true },
            delivery: { type: Number, min: 1, max: 5, required: true },
            overall: { type: Number, min: 1, max: 5, required: true }
        },
        comment: { type: String, default: '' },
        userName: { type: String, default: '' },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        isApproved: { type: Boolean, default: false }
    },
    { timestamps: true }
);

// One review per order
reviewSchema.index({ order: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        description: {
            type: String,
            default: ''
        },
        discountType: {
            type: String,
            enum: ['percentage', 'flat'],
            required: true
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0
        },
        minOrderAmount: {
            type: Number,
            default: 0
        },
        maxDiscount: {
            type: Number,
            default: null
        },
        validFrom: {
            type: Date,
            required: true
        },
        validUntil: {
            type: Date,
            required: true
        },
        usageLimit: {
            type: Number,
            default: null  // null = unlimited
        },
        usedCount: {
            type: Number,
            default: 0
        },
        perUserLimit: {
            type: Number,
            default: 1  // each user can use it once by default
        },
        usedBy: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                usedAt: { type: Date, default: Date.now },
                order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
            }
        ],
        applicableTo: {
            type: String,
            enum: ['all', 'train', 'station'],
            default: 'all'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
);

// Index for fast lookups (code index already created by unique: true)
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

module.exports = mongoose.model('Coupon', couponSchema);

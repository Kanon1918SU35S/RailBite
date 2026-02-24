const mongoose = require('mongoose');

const loyaltyPointsSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        points: {
            type: Number,
            default: 0,
            min: 0
        },
        totalEarned: {
            type: Number,
            default: 0
        },
        totalRedeemed: {
            type: Number,
            default: 0
        },
        tier: {
            type: String,
            enum: ['bronze', 'silver', 'gold', 'platinum'],
            default: 'bronze'
        },
        history: [
            {
                type: {
                    type: String,
                    enum: ['earned', 'redeemed', 'bonus', 'expired', 'adjusted'],
                    required: true
                },
                points: { type: Number, required: true },
                description: { type: String, default: '' },
                order: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Order',
                    default: null
                },
                date: { type: Date, default: Date.now }
            }
        ]
    },
    { timestamps: true }
);

// Calculate tier based on total earned points
loyaltyPointsSchema.methods.recalculateTier = function () {
    if (this.totalEarned >= 5000) this.tier = 'platinum';
    else if (this.totalEarned >= 2000) this.tier = 'gold';
    else if (this.totalEarned >= 500) this.tier = 'silver';
    else this.tier = 'bronze';
};

// Static: earn points for an order (1 point per 10 BDT spent)
loyaltyPointsSchema.statics.earnPoints = async function (userId, orderId, orderAmount) {
    const pointsEarned = Math.floor(orderAmount / 10);
    if (pointsEarned <= 0) return null;

    let loyalty = await this.findOne({ user: userId });
    if (!loyalty) {
        loyalty = new this({ user: userId });
    }

    loyalty.points += pointsEarned;
    loyalty.totalEarned += pointsEarned;
    loyalty.history.push({
        type: 'earned',
        points: pointsEarned,
        description: `Earned from order`,
        order: orderId
    });
    loyalty.recalculateTier();
    await loyalty.save();
    return loyalty;
};

// Static: redeem points
loyaltyPointsSchema.statics.redeemPoints = async function (userId, orderId, pointsToRedeem) {
    const loyalty = await this.findOne({ user: userId });
    if (!loyalty || loyalty.points < pointsToRedeem) {
        throw new Error('Insufficient loyalty points');
    }

    loyalty.points -= pointsToRedeem;
    loyalty.totalRedeemed += pointsToRedeem;
    loyalty.history.push({
        type: 'redeemed',
        points: -pointsToRedeem,
        description: `Redeemed on order`,
        order: orderId
    });
    await loyalty.save();
    return loyalty;
};

module.exports = mongoose.model('LoyaltyPoints', loyaltyPointsSchema);

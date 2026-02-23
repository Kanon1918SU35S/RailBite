const LoyaltyPoints = require('../models/LoyaltyPoints');
const Order = require('../models/Order');

// GET /api/loyalty/my-points - get current user's loyalty points
exports.getMyPoints = async (req, res) => {
    try {
        let loyalty = await LoyaltyPoints.findOne({ user: req.user._id });
        if (!loyalty) {
            loyalty = await LoyaltyPoints.create({ user: req.user._id });
        }

        res.json({
            success: true,
            data: {
                points: loyalty.points,
                totalEarned: loyalty.totalEarned,
                totalRedeemed: loyalty.totalRedeemed,
                tier: loyalty.tier,
                // Points value: 1 point = 0.5 BDT discount
                pointsValue: loyalty.points * 0.5,
                history: loyalty.history.slice(-20).reverse() // last 20 entries
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/loyalty/history - get full loyalty history
exports.getMyHistory = async (req, res) => {
    try {
        const loyalty = await LoyaltyPoints.findOne({ user: req.user._id })
            .populate('history.order', 'orderNumber totalAmount');

        if (!loyalty) {
            return res.json({ success: true, data: [] });
        }

        res.json({
            success: true,
            data: loyalty.history.sort((a, b) => b.date - a.date)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/loyalty/redeem - redeem points on an order
exports.redeemPoints = async (req, res) => {
    try {
        const { orderId, points } = req.body;

        if (!orderId || !points || points <= 0) {
            return res.status(400).json({
                success: false,
                message: 'orderId and a positive points value are required'
            });
        }

        // Minimum redemption: 50 points
        if (points < 50) {
            return res.status(400).json({
                success: false,
                message: 'Minimum redemption is 50 points'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Calculate discount (1 point = 0.5 BDT)
        const discount = points * 0.5;

        // Cannot redeem more than order total
        if (discount > order.totalAmount) {
            return res.status(400).json({
                success: false,
                message: `Discount ৳${discount} exceeds order total ৳${order.totalAmount}`
            });
        }

        const loyalty = await LoyaltyPoints.redeemPoints(req.user._id, orderId, points);

        res.json({
            success: true,
            data: {
                pointsRedeemed: points,
                discount,
                remainingPoints: loyalty.points,
                tier: loyalty.tier
            }
        });
    } catch (error) {
        if (error.message === 'Insufficient loyalty points') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/loyalty/earn - manually earn points (called internally after delivery)
exports.earnPointsForOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status !== 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Points can only be earned for delivered orders'
            });
        }

        const loyalty = await LoyaltyPoints.earnPoints(
            order.user,
            order._id,
            order.totalAmount
        );

        if (!loyalty) {
            return res.json({ success: true, data: { pointsEarned: 0 } });
        }

        res.json({
            success: true,
            data: {
                pointsEarned: Math.floor(order.totalAmount / 10),
                totalPoints: loyalty.points,
                tier: loyalty.tier
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/loyalty/admin/all - admin: get all users' loyalty data
exports.getAllLoyalty = async (req, res) => {
    try {
        const loyalties = await LoyaltyPoints.find()
            .populate('user', 'name email phone')
            .sort({ points: -1 });

        res.json({ success: true, data: loyalties });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/loyalty/admin/bonus - admin: award bonus points
exports.awardBonusPoints = async (req, res) => {
    try {
        const { userId, points, description } = req.body;

        if (!userId || !points || points <= 0) {
            return res.status(400).json({
                success: false,
                message: 'userId and positive points value are required'
            });
        }

        let loyalty = await LoyaltyPoints.findOne({ user: userId });
        if (!loyalty) {
            loyalty = new LoyaltyPoints({ user: userId });
        }

        loyalty.points += points;
        loyalty.totalEarned += points;
        loyalty.history.push({
            type: 'bonus',
            points: points,
            description: description || 'Bonus points from admin'
        });
        loyalty.recalculateTier();
        await loyalty.save();

        res.json({
            success: true,
            data: {
                pointsAwarded: points,
                totalPoints: loyalty.points,
                tier: loyalty.tier
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

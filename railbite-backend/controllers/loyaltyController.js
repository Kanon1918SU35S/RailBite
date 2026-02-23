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
                message: `Discount ${discount} exceeds order total ${order.totalAmount}`
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';
        const tier = req.query.tier || '';

        let pipeline = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
        ];

        // Filter by search (name/email)
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { 'user.name': { $regex: search, $options: 'i' } },
                        { 'user.email': { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        // Filter by tier
        if (tier) {
            pipeline.push({ $match: { tier } });
        }

        pipeline.push(
            { $sort: { points: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    points: 1,
                    totalEarned: 1,
                    totalRedeemed: 1,
                    tier: 1,
                    createdAt: 1,
                    'user._id': 1,
                    'user.name': 1,
                    'user.email': 1,
                    'user.phone': 1
                }
            }
        );

        const loyalties = await LoyaltyPoints.aggregate(pipeline);
        const total = await LoyaltyPoints.countDocuments();

        res.json({
            success: true,
            data: loyalties,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/loyalty/admin/user/:userId - admin: get specific user loyalty details
exports.getUserLoyaltyDetails = async (req, res) => {
    try {
        const loyalty = await LoyaltyPoints.findOne({ user: req.params.userId })
            .populate('user', 'name email phone')
            .populate('history.order', 'orderNumber totalAmount');
        if (!loyalty) {
            return res.json({
                success: true,
                data: { history: [], points: 0, tier: 'bronze' }
            });
        }
        res.json({
            success: true,
            data: {
                user: loyalty.user,
                points: loyalty.points,
                totalEarned: loyalty.totalEarned,
                totalRedeemed: loyalty.totalRedeemed,
                tier: loyalty.tier,
                history: loyalty.history.sort((a, b) => b.date - a.date)
            }
        });
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

// POST /api/loyalty/admin/deduct - admin: deduct points from a user
exports.deductPoints = async (req, res) => {
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
            return res.status(404).json({ success: false, message: 'Loyalty record not found for this user' });
        }
        if (loyalty.points < points) {
            return res.status(400).json({
                success: false,
                message: `Cannot deduct ${points} points. User only has ${loyalty.points} points.`
            });
        }
        loyalty.points -= points;
        loyalty.totalRedeemed += points;
        loyalty.history.push({
            type: 'deduct',
            points: -points,
            description: description || 'Points deducted by admin'
        });
        loyalty.recalculateTier();
        await loyalty.save();
        res.json({
            success: true,
            data: {
                pointsDeducted: points,
                remainingPoints: loyalty.points,
                tier: loyalty.tier
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/loyalty/admin/stats - admin: get overall loyalty program stats
exports.getLoyaltyStats = async (req, res) => {
    try {
        const [tierStats, totals] = await Promise.all([
            LoyaltyPoints.aggregate([
                { $group: { _id: '$tier', count: { $sum: 1 }, totalPoints: { $sum: '$points' } } },
                { $sort: { totalPoints: -1 } }
            ]),
            LoyaltyPoints.aggregate([
                {
                    $group: {
                        _id: null,
                        totalActivePoints: { $sum: '$points' },
                        totalEverEarned: { $sum: '$totalEarned' },
                        totalEverRedeemed: { $sum: '$totalRedeemed' },
                        totalMembers: { $sum: 1 }
                    }
                }
            ])
        ]);
        res.json({
            success: true,
            data: {
                tierStats,
                totals: totals[0] || { totalActivePoints: 0, totalEverEarned: 0, totalEverRedeemed: 0, totalMembers: 0 },
                tierThresholds: {
                    bronze: '0 - 499 pts',
                    silver: '500 - 1,999 pts',
                    gold: '2,000 - 4,999 pts',
                    platinum: '5,000+ pts'
                },
                pointValue: '1 point = 0.50 BDT discount'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const Review = require('../models/Review');
const Order = require('../models/Order');
const DeliveryStaff = require('../models/DeliveryStaff');

// POST /api/reviews - customer submits a review for a delivered order
exports.createReview = async (req, res) => {
    try {
        const { orderId, ratings, comment } = req.body;

        if (!orderId || !ratings || !ratings.food || !ratings.delivery || !ratings.overall) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and all ratings (food, delivery, overall) are required'
            });
        }

        // Find the order
        const order = await Order.findById(orderId).populate('user', 'name');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Ensure the order belongs to this user
        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You can only review your own orders' });
        }

        // Ensure order is delivered
        if (order.status !== 'delivered') {
            return res.status(400).json({ success: false, message: 'You can only review delivered orders' });
        }

        // Check if review already exists
        const existing = await Review.findOne({ order: orderId });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this order' });
        }

        // Create the review (pending approval)
        const review = await Review.create({
            order: orderId,
            user: req.user._id,
            orderNumber: order.orderNumber || '',
            ratings: {
                food: Math.min(5, Math.max(1, ratings.food)),
                delivery: Math.min(5, Math.max(1, ratings.delivery)),
                overall: Math.min(5, Math.max(1, ratings.overall))
            },
            comment: comment || '',
            userName: req.user.name || order.user?.name || 'Customer',
            status: 'pending',
            isApproved: false
        });

        // Update the delivery staff's average rating if order was assigned
        if (order.assignedTo) {
            await recalcDeliveryStaffRating(order.assignedTo);
        }

        res.status(201).json({ success: true, data: review });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this order' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/reviews/order/:orderId - check if review exists for an order
exports.getReviewByOrder = async (req, res) => {
    try {
        const review = await Review.findOne({ order: req.params.orderId });
        res.json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/reviews/my-reviews - customer gets their own reviews
exports.getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user._id })
            .populate('order', 'orderNumber totalAmount items status')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/reviews/public - public reviews (only approved, no auth required)
exports.getPublicReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ status: 'approved', isApproved: true })
            .select('ratings comment userName createdAt')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/reviews - admin gets all reviews
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'name email')
            .populate('order', 'orderNumber totalAmount items assignedTo')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/reviews/:id/approve - admin approves a review
exports.approveReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        review.status = 'approved';
        review.isApproved = true;
        await review.save();
        res.json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/reviews/:id/reject - admin rejects a review
exports.rejectReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        review.status = 'rejected';
        review.isApproved = false;
        await review.save();
        res.json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/reviews/:id - admin deletes a review
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Before deleting, check if we need to recalculate assigned staff rating
        const order = await Order.findById(review.order);
        const assignedTo = order?.assignedTo;

        await Review.findByIdAndDelete(req.params.id);

        // Recalculate delivery staff rating if applicable
        if (assignedTo) {
            await recalcDeliveryStaffRating(assignedTo);
        }

        res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/reviews/stats - admin gets review stats
exports.getReviewStats = async (req, res) => {
    try {
        const totalReviews = await Review.countDocuments();
        const ratingDist = await Review.aggregate([
            {
                $group: {
                    _id: { $floor: '$ratings.overall' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } }
        ]);

        const avgRating = await Review.aggregate([
            {
                $group: {
                    _id: null,
                    avgFood: { $avg: '$ratings.food' },
                    avgDelivery: { $avg: '$ratings.delivery' },
                    avgOverall: { $avg: '$ratings.overall' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                totalReviews,
                ratingDistribution: ratingDist,
                averages: avgRating.length > 0 ? avgRating[0] : { avgFood: 0, avgDelivery: 0, avgOverall: 0 }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper: recalculate a delivery staff member's average rating from all reviews
async function recalcDeliveryStaffRating(userId) {
    try {
        // Find all orders assigned to this delivery staff that have reviews
        const orders = await Order.find({ assignedTo: userId }).select('_id');
        const orderIds = orders.map(o => o._id);

        if (orderIds.length === 0) return;

        const result = await Review.aggregate([
            { $match: { order: { $in: orderIds } } },
            {
                $group: {
                    _id: null,
                    avgDeliveryRating: { $avg: '$ratings.delivery' }
                }
            }
        ]);

        if (result.length > 0) {
            await DeliveryStaff.findOneAndUpdate(
                { userId },
                { rating: Math.round(result[0].avgDeliveryRating * 10) / 10 }
            );
        }
    } catch (err) {
        console.error('Error recalculating delivery staff rating:', err.message);
    }
}

const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const DeliveryStaff = require('../models/DeliveryStaff');
const { createNotification } = require('./notificationController');
const { emitOrderUpdate, emitNotification, emitRoleNotification } = require('../sockets/orderSocket');
const { sendOrderStatusEmail } = require('../utils/emailService');

// Helper: get or create DeliveryStaff profile linked to the logged-in user
const getOrCreateProfile = async (user) => {
    let profile = await DeliveryStaff.findOne({ userId: user._id });
    if (!profile) {
        // Auto-create a delivery profile linked to the user
        profile = await DeliveryStaff.create({
            userId: user._id,
            name: user.name,
            phone: user.phone || '',
            status: 'available'
        });
    }
    return profile;
};

// GET /api/delivery-portal/stats
exports.getMyStats = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);
        const profile = await getOrCreateProfile(req.user);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Count today's assigned deliveries
        const todayDeliveries = await Order.countDocuments({
            assignedTo: userId,
            createdAt: { $gte: todayStart }
        });

        // Count active orders (not delivered/cancelled)
        const activeOrders = await Order.countDocuments({
            assignedTo: userId,
            status: { $nin: ['delivered', 'cancelled'] }
        });

        // Count completed today
        const completedToday = await Order.countDocuments({
            assignedTo: userId,
            status: 'delivered',
            updatedAt: { $gte: todayStart }
        });

        // Calculate today's earnings (sum of delivery fees for completed orders today)
        const earningsAgg = await Order.aggregate([
            {
                $match: {
                    assignedTo: userId,
                    status: 'delivered',
                    updatedAt: { $gte: todayStart }
                }
            },
            { $group: { _id: null, total: { $sum: '$deliveryFee' } } }
        ]);
        const totalEarnings = earningsAgg.length > 0 ? earningsAgg[0].total : 0;

        // Sync profile counters with live data for consistency
        profile.assignedOrders = activeOrders;
        profile.completedToday = completedToday;
        if (activeOrders === 0 && profile.status === 'busy') {
            profile.status = 'available';
        }
        await profile.save();

        res.json({
            success: true,
            data: {
                todayDeliveries,
                activeOrders,
                completedToday,
                totalEarnings,
                rating: profile.rating || 5.0,
                onTimeRate: profile.onTimeRate || 100,
                status: profile.status
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/delivery-portal/active-orders
exports.getMyActiveOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            assignedTo: req.user._id,
            status: { $nin: ['delivered', 'cancelled'] }
        })
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });

        // Flatten booking details for frontend convenience
        const data = orders.map((o) => {
            const obj = o.toObject();
            return {
                ...obj,
                customerName: obj.contactInfo?.fullName || obj.user?.name || 'Customer',
                customerPhone: obj.contactInfo?.phone || obj.user?.phone || '',
                deliveryAddress: obj.bookingDetails?.pickupStation || '',
                trainNumber: obj.bookingDetails?.trainNumber || '',
                coachNumber: obj.bookingDetails?.coachNumber || '',
                seatNumber: obj.bookingDetails?.seatNumber || '',
                station: obj.bookingDetails?.pickupStation || ''
            };
        });

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/delivery-portal/active-delivery
exports.getActiveDelivery = async (req, res) => {
    try {
        // Find the single most recent non-completed order assigned to this staff
        const order = await Order.findOne({
            assignedTo: req.user._id,
            status: { $in: ['confirmed', 'preparing', 'on_the_way'] }
        })
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });

        if (!order) {
            return res.json({ success: true, data: null });
        }

        const obj = order.toObject();
        const data = {
            ...obj,
            customerName: obj.contactInfo?.fullName || obj.user?.name || 'Customer',
            customerPhone: obj.contactInfo?.phone || obj.user?.phone || '',
            deliveryAddress: obj.bookingDetails?.pickupStation || '',
            trainNumber: obj.bookingDetails?.trainNumber || '',
            coachNumber: obj.bookingDetails?.coachNumber || '',
            seatNumber: obj.bookingDetails?.seatNumber || '',
            station: obj.bookingDetails?.pickupStation || ''
        };

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/delivery-portal/my-orders
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ assignedTo: req.user._id })
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });

        const data = orders.map((o) => {
            const obj = o.toObject();
            return {
                ...obj,
                customerName: obj.contactInfo?.fullName || obj.user?.name || 'Customer',
                customerPhone: obj.contactInfo?.phone || obj.user?.phone || '',
                deliveryAddress: obj.bookingDetails?.pickupStation || '',
                trainNumber: obj.bookingDetails?.trainNumber || '',
                coachNumber: obj.bookingDetails?.coachNumber || '',
                seatNumber: obj.bookingDetails?.seatNumber || '',
                station: obj.bookingDetails?.pickupStation || ''
            };
        });

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/delivery-portal/history?range=today|week|month|all
exports.getMyHistory = async (req, res) => {
    try {
        const { range = 'today' } = req.query;

        const filter = {
            assignedTo: req.user._id,
            status: { $in: ['delivered', 'cancelled'] }
        };

        // Apply date range filter
        const now = new Date();
        if (range === 'today') {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            filter.updatedAt = { $gte: todayStart };
        } else if (range === 'week') {
            const weekStart = new Date();
            weekStart.setDate(now.getDate() - 7);
            weekStart.setHours(0, 0, 0, 0);
            filter.updatedAt = { $gte: weekStart };
        } else if (range === 'month') {
            const monthStart = new Date();
            monthStart.setDate(now.getDate() - 30);
            monthStart.setHours(0, 0, 0, 0);
            filter.updatedAt = { $gte: monthStart };
        }
        // 'all' => no date filter

        const orders = await Order.find(filter)
            .populate('user', 'name email phone')
            .sort({ updatedAt: -1 });

        const data = orders.map((o) => {
            const obj = o.toObject();
            return {
                ...obj,
                customerName: obj.contactInfo?.fullName || obj.user?.name || 'Customer',
                customerPhone: obj.contactInfo?.phone || obj.user?.phone || '',
                deliveryAddress: obj.bookingDetails?.pickupStation || '',
                trainNumber: obj.bookingDetails?.trainNumber || '',
                coachNumber: obj.bookingDetails?.coachNumber || '',
                seatNumber: obj.bookingDetails?.seatNumber || '',
                station: obj.bookingDetails?.pickupStation || ''
            };
        });

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/delivery-portal/orders/:id
exports.getOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        let order;

        if (mongoose.Types.ObjectId.isValid(id)) {
            order = await Order.findById(id).populate('user', 'name email phone');
        }

        if (!order) {
            order = await Order.findOne({ orderNumber: id }).populate('user', 'name email phone');
        }

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Ensure the order is assigned to this delivery staff
        if (order.assignedTo && order.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
        }

        const obj = order.toObject();
        const data = {
            ...obj,
            customerName: obj.contactInfo?.fullName || obj.user?.name || 'Customer',
            customerPhone: obj.contactInfo?.phone || obj.user?.phone || '',
            deliveryAddress: obj.bookingDetails?.pickupStation || '',
            trainNumber: obj.bookingDetails?.trainNumber || '',
            coachNumber: obj.bookingDetails?.coachNumber || '',
            seatNumber: obj.bookingDetails?.seatNumber || '',
            station: obj.bookingDetails?.pickupStation || ''
        };

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PATCH /api/delivery-portal/orders/:id/status
exports.updateDeliveryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        let order;
        if (mongoose.Types.ObjectId.isValid(id)) {
            order = await Order.findById(id);
        }
        if (!order) {
            order = await Order.findOne({ orderNumber: id });
        }

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Ensure assigned to this delivery staff (or allow if not yet assigned)
        if (order.assignedTo && order.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
        }

        // Delivery staff can only mark dispatched orders as delivered
        // (Admin handles: confirmed → preparing → on_the_way/dispatched)
        if (status !== 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'You can only mark dispatched orders as delivered.'
            });
        }

        if (order.status !== 'on_the_way') {
            return res.status(400).json({
                success: false,
                message: `Cannot mark as delivered. Order must be dispatched first (current status: ${order.status}).`
            });
        }

        // Update main order status
        order.status = 'delivered';
        order.deliveryStatus = 'delivered';

        await order.save();

        // Update the delivery staff profile stats
        const staffProfile = await DeliveryStaff.findOne({ userId: req.user._id });
        if (staffProfile) {
            // Use live count for accuracy (not stale counters)
            const remainingActive = await Order.countDocuments({
                assignedTo: req.user._id,
                status: { $nin: ['delivered', 'cancelled'] }
            });
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const liveCompletedToday = await Order.countDocuments({
                assignedTo: req.user._id,
                status: 'delivered',
                updatedAt: { $gte: todayStart }
            });
            const liveTotalDeliveries = await Order.countDocuments({
                assignedTo: req.user._id,
                status: 'delivered'
            });

            staffProfile.totalDeliveries = liveTotalDeliveries;
            staffProfile.completedToday = liveCompletedToday;
            staffProfile.assignedOrders = remainingActive;
            staffProfile.status = remainingActive === 0 ? 'available' : 'busy';
            await staffProfile.save();
        }

        // Notify customer that order is delivered
        await createNotification({
            type: 'order',
            title: 'Order Delivered!',
            message: `Your order ${order.orderNumber} has been delivered. Enjoy your meal!`,
            targetUser: order.user,
            relatedOrder: order._id
        });
        emitNotification(order.user.toString(), {
            type: 'order', title: 'Order Delivered!',
            message: `Your order ${order.orderNumber} has been delivered. Enjoy your meal!`
        });

        // Notify admin about completed delivery
        await createNotification({
            type: 'delivery',
            title: 'Delivery Completed',
            message: `Order ${order.orderNumber} has been delivered by ${req.user.name || 'delivery staff'}.`,
            targetRole: 'admin',
            relatedOrder: order._id
        });
        emitRoleNotification('admin', {
            type: 'delivery', title: 'Delivery Completed',
            message: `Order ${order.orderNumber} has been delivered by ${req.user.name || 'delivery staff'}.`
        });

        // Emit order status update to all tracking parties
        emitOrderUpdate(order._id.toString(), order.user.toString(), {
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: 'delivered',
            deliveryStatus: 'delivered'
        });

        // Send delivered email to customer
        try {
            const customer = await User.findById(order.user).select('name email');
            if (customer) {
                await sendOrderStatusEmail(customer, order, 'delivered');
            }
        } catch (emailErr) {
            console.error('[Email] Delivered email failed:', emailErr.message);
        }

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/delivery-portal/profile
exports.getMyProfile = async (req, res) => {
    try {
        const profile = await getOrCreateProfile(req.user);
        const userId = new mongoose.Types.ObjectId(req.user._id);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Compute live stats from Order collection (don't rely on stale counters)
        const [liveActiveOrders, liveCompletedToday, liveTotalDeliveries] = await Promise.all([
            Order.countDocuments({
                assignedTo: userId,
                status: { $nin: ['delivered', 'cancelled'] }
            }),
            Order.countDocuments({
                assignedTo: userId,
                status: 'delivered',
                updatedAt: { $gte: todayStart }
            }),
            Order.countDocuments({
                assignedTo: userId,
                status: 'delivered'
            })
        ]);

        // Sync profile with live data
        profile.assignedOrders = liveActiveOrders;
        profile.completedToday = liveCompletedToday;
        profile.totalDeliveries = liveTotalDeliveries;
        if (liveActiveOrders === 0 && profile.status === 'busy') {
            profile.status = 'available';
        }
        await profile.save();

        // Merge user info with delivery profile
        const data = {
            _id: profile._id,
            userId: req.user._id,
            name: profile.name || req.user.name,
            email: req.user.email,
            phone: profile.phone || req.user.phone || '',
            status: profile.status,
            totalDeliveries: liveTotalDeliveries,
            rating: profile.rating || 5.0,
            onTimeRate: profile.onTimeRate || 100,
            assignedOrders: liveActiveOrders,
            completedToday: liveCompletedToday,
            createdAt: profile.createdAt
        };

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/delivery-portal/profile
exports.updateMyProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;

        let profile = await getOrCreateProfile(req.user);

        if (name) profile.name = name;
        if (phone) profile.phone = phone;

        await profile.save();

        // Also update the User's name and phone if changed
        if (name || phone) {
            const userUpdate = {};
            if (name) userUpdate.name = name;
            if (phone) userUpdate.phone = phone;
            await User.findByIdAndUpdate(req.user._id, userUpdate);
        }

        const data = {
            _id: profile._id,
            userId: req.user._id,
            name: profile.name,
            email: req.user.email,
            phone: profile.phone,
            status: profile.status,
            totalDeliveries: profile.totalDeliveries || 0,
            rating: profile.rating || 5.0,
            onTimeRate: profile.onTimeRate || 100,
            assignedOrders: profile.assignedOrders || 0,
            completedToday: profile.completedToday || 0,
            createdAt: profile.createdAt
        };

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

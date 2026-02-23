const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const DeliveryStaff = require('../models/DeliveryStaff');
const LoyaltyPoints = require('../models/LoyaltyPoints');
const { createNotification } = require('./notificationController');
const { sendPushNotification } = require('../utils/pushNotification');
const { emitOrderUpdate, emitNewOrder, emitNotification, emitRoleNotification } = require('../sockets/orderSocket');

// GET /api/orders - all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/recent - recent orders for dashboard
exports.getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/my-orders - customer's own orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/orders - place a new order (customer)
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      contactInfo,
      orderType,
      bookingDetails,
      paymentMethod,
      paymentInfo,
      paymentStatus,
      advanceAmount,
      dueAmount,
      subtotal,
      vat,
      deliveryFee,
      total,
      couponCode,
      couponDiscount
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in order'
      });
    }

    // Generate unique order number (timestamp + random to avoid collisions)
    const orderNumber = 'RB-' + Date.now().toString(36).toUpperCase().slice(-4) + Math.random().toString(36).toUpperCase().slice(2, 5);

    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      items,
      contactInfo,
      orderType: orderType || 'train',
      bookingDetails: bookingDetails || {},
      paymentMethod: paymentMethod || 'cash',
      paymentInfo: paymentInfo || {},
      paymentStatus: paymentStatus || 'unpaid',
      advanceAmount: advanceAmount || 0,
      dueAmount: dueAmount || 0,
      couponCode: couponCode || '',
      couponDiscount: couponDiscount || 0,
      subtotal,
      vat: vat || 0,
      deliveryFee: deliveryFee || 50,
      totalAmount: total,
      status: 'pending',
      trackingHistory: [{
        status: 'pending',
        message: 'Order placed successfully',
        updatedBy: req.user._id
      }]
    });

    // Auto-notify: customer gets order confirmation
    await createNotification({
      type: 'order',
      title: 'Order Placed Successfully',
      message: `Your order ${orderNumber} has been placed and is pending confirmation.`,
      targetUser: req.user._id,
      relatedOrder: order._id
    });

    // Auto-notify: admin gets new order alert
    await createNotification({
      type: 'order',
      title: 'New Order Received',
      message: `New order ${orderNumber} placed by ${req.user.name || 'a customer'}. Total: ৳${total}`,
      targetRole: 'admin',
      relatedOrder: order._id
    });

    res.status(201).json({
      success: true,
      data: {
        ...order.toObject(),
        orderId: order.orderNumber
      }
    });

    // Emit real-time events (after response sent)
    emitNewOrder({
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: 'pending',
      total,
      userName: req.user.name
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/orders/:id/status - update order status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, deliveryStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const oldStatus = order.status;
    if (status) order.status = status;
    if (deliveryStatus) order.deliveryStatus = deliveryStatus;

    // Add tracking history entry
    const trackingMessages = {
      confirmed: 'Order has been confirmed by the restaurant',
      preparing: 'Your food is being prepared',
      on_the_way: 'Your order is on the way',
      delivered: 'Order has been delivered successfully',
      cancelled: 'Order has been cancelled'
    };
    if (status && trackingMessages[status]) {
      order.trackingHistory.push({
        status,
        message: trackingMessages[status],
        updatedBy: req.user._id
      });
    }

    await order.save();

    // If cancelled or delivered and had staff assigned, release/update them
    if ((status === 'cancelled' || status === 'delivered') && order.assignedTo) {
      const staffProfile = await DeliveryStaff.findOne({ userId: order.assignedTo });
      if (staffProfile) {
        const remaining = await Order.countDocuments({
          assignedTo: order.assignedTo,
          status: { $nin: ['delivered', 'cancelled'] }
        });
        staffProfile.assignedOrders = remaining;
        staffProfile.status = remaining === 0 ? 'available' : 'busy';

        // Sync total deliveries from live count
        if (status === 'delivered') {
          const totalDel = await Order.countDocuments({
            assignedTo: order.assignedTo,
            status: 'delivered'
          });
          staffProfile.totalDeliveries = totalDel;
        }
        await staffProfile.save();
      }
    }

    // Auto-notify: tell the customer about status change
    const statusLabels = {
      confirmed: 'confirmed and is being prepared',
      preparing: 'being prepared',
      on_the_way: 'on the way',
      delivered: 'delivered',
      cancelled: 'cancelled'
    };
    if (status && statusLabels[status]) {
      await createNotification({
        type: 'order',
        title: `Order ${status === 'cancelled' ? 'Cancelled' : 'Update'}`,
        message: `Your order ${order.orderNumber} has been ${statusLabels[status]}.`,
        targetUser: order.user,
        relatedOrder: order._id
      });

      // Send browser push notification to the customer
      try {
        const customer = await User.findById(order.user).select('pushSubscription pushEnabled');
        if (customer && customer.pushEnabled && customer.pushSubscription?.endpoint) {
          await sendPushNotification(customer.pushSubscription, {
            title: `Order ${status === 'cancelled' ? 'Cancelled' : 'Update'}`,
            body: `Your order ${order.orderNumber} has been ${statusLabels[status]}.`,
            url: '/order-history',
            tag: `order-${order._id}`,
          });
        }
      } catch (pushErr) {
        console.error('[Push] Error sending push:', pushErr.message);
      }
    }

    // Auto-award loyalty points when order is delivered
    if (status === 'delivered') {
      try {
        await LoyaltyPoints.earnPoints(order.user, order._id, order.totalAmount);
      } catch (loyaltyErr) {
        console.error('[Loyalty] Error awarding points:', loyaltyErr.message);
      }
    }

    // Re-fetch with populated fields
    const updated = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');

    res.json({ success: true, data: updated });

    // Emit real-time order status update
    emitOrderUpdate(order._id.toString(), order.user.toString(), {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      deliveryStatus: order.deliveryStatus,
      previousStatus: oldStatus
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/orders/:id/assign - assign delivery staff to order (admin)
exports.assignDeliveryStaff = async (req, res) => {
  try {
    const { staffId } = req.body; // This is the DeliveryStaff _id

    if (!staffId) {
      return res.status(400).json({ success: false, message: 'staffId is required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only allow assignment for orders in confirmed/preparing state
    if (!['confirmed', 'preparing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign staff to an order with status "${order.status}". Order must be confirmed or preparing.`
      });
    }

    // Find the DeliveryStaff record
    const staff = await DeliveryStaff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Delivery staff not found' });
    }

    if (staff.status === 'offline') {
      return res.status(400).json({ success: false, message: 'Cannot assign to offline staff' });
    }

    // If order was previously assigned to someone else, release them
    if (order.assignedTo) {
      const prevStaff = await DeliveryStaff.findOne({ userId: order.assignedTo });
      if (prevStaff) {
        // Use live count for accuracy (this order will be reassigned, so exclude it)
        const prevRemaining = await Order.countDocuments({
          assignedTo: order.assignedTo,
          _id: { $ne: order._id },
          status: { $nin: ['delivered', 'cancelled'] }
        });
        prevStaff.assignedOrders = prevRemaining;
        prevStaff.status = prevRemaining === 0 ? 'available' : 'busy';
        await prevStaff.save();
      }
    }

    // Assign: set order.assignedTo to the staff's userId
    order.assignedTo = staff.userId;
    await order.save();

    // Update staff: use live count for accuracy, set status to busy
    const newStaffActive = await Order.countDocuments({
      assignedTo: staff.userId,
      status: { $nin: ['delivered', 'cancelled'] }
    });
    staff.assignedOrders = newStaffActive;
    staff.status = 'busy';
    await staff.save();

    // Notify delivery staff
    await createNotification({
      type: 'delivery',
      title: 'New Delivery Assigned',
      message: `Order ${order.orderNumber} has been assigned to you for delivery. Customer: ${order.contactInfo?.fullName || 'N/A'}, Station: ${order.bookingDetails?.pickupStation || 'N/A'}.`,
      targetUser: staff.userId,
      relatedOrder: order._id
    });

    // Notify customer
    await createNotification({
      type: 'order',
      title: 'Delivery Staff Assigned',
      message: `A delivery partner has been assigned to your order ${order.orderNumber}. Your food will be on its way soon!`,
      targetUser: order.user,
      relatedOrder: order._id
    });

    // Notify admin
    await createNotification({
      type: 'delivery',
      title: 'Staff Assigned to Order',
      message: `${staff.name} has been assigned to order ${order.orderNumber}.`,
      targetRole: 'admin',
      relatedOrder: order._id
    });

    // Return populated order
    const updated = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/assignment-stats - get delivery assignment stats for admin
exports.getAssignmentStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalStaff, availableStaff, busyStaff, ordersInTransit, unassignedOrders, deliveredToday] = await Promise.all([
      DeliveryStaff.countDocuments({ status: { $ne: 'offline' } }),
      DeliveryStaff.countDocuments({ status: 'available' }),
      DeliveryStaff.countDocuments({ status: 'busy' }),
      Order.countDocuments({ status: 'on_the_way' }),
      Order.countDocuments({
        status: { $in: ['confirmed', 'preparing'] },
        assignedTo: null
      }),
      Order.countDocuments({
        status: 'delivered',
        updatedAt: { $gte: todayStart }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalActiveRiders: totalStaff,
        availableRiders: availableStaff,
        busyRiders: busyStaff,
        ordersInTransit,
        unassignedOrders,
        deliveredToday
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/:id - get single order
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    let order;

    // Check if id is a valid MongoDB ObjectId
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    if (isObjectId) {
      // Try finding by _id first
      order = await Order.findById(id).populate('user', 'name email');
    }

    // If not found by _id or not a valid ObjectId, try orderNumber
    if (!order) {
      order = await Order.findOne({ orderNumber: id }).populate('user', 'name email');
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow owner or admin
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    let order;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    if (isObjectId) {
      order = await Order.findById(id);
    }

    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    order.status = 'cancelled';
    await order.save();

    // Release assigned staff if any
    if (order.assignedTo) {
      const staffProfile = await DeliveryStaff.findOne({ userId: order.assignedTo });
      if (staffProfile) {
        const remaining = await Order.countDocuments({
          assignedTo: order.assignedTo,
          status: { $nin: ['delivered', 'cancelled'] }
        });
        staffProfile.assignedOrders = remaining;
        staffProfile.status = remaining === 0 ? 'available' : 'busy';
        await staffProfile.save();
      }
    }

    // Auto-notify: admin about cancellation
    await createNotification({
      type: 'order',
      title: 'Order Cancelled',
      message: `Order ${order.orderNumber} has been cancelled by the customer.`,
      targetRole: 'admin',
      relatedOrder: order._id
    });

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/orders/:id/reorder - reorder items from a previous order
exports.reorder = async (req, res) => {
  try {
    const { id } = req.params;
    let originalOrder;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    if (isObjectId) {
      originalOrder = await Order.findById(id);
    }
    if (!originalOrder) {
      originalOrder = await Order.findOne({ orderNumber: id });
    }
    if (!originalOrder) {
      return res.status(404).json({ success: false, message: 'Original order not found' });
    }

    // Only allow reorder of own orders
    if (originalOrder.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Return item data for the frontend to populate cart
    res.json({
      success: true,
      data: {
        items: originalOrder.items,
        orderType: originalOrder.orderType,
        bookingDetails: originalOrder.bookingDetails,
        contactInfo: originalOrder.contactInfo,
        subtotal: originalOrder.subtotal,
        vat: originalOrder.vat,
        deliveryFee: originalOrder.deliveryFee,
        totalAmount: originalOrder.totalAmount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

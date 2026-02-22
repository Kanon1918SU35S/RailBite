const Order = require('../models/Order');
const User = require('../models/User');
const DeliveryStaff = require('../models/DeliveryStaff');

exports.getStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      totalRevenueAgg,
      activeUsers,
      pendingOrders,
      deliveredOrders,
      completedToday,
      deliveryStaffCount
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      User.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'delivered', updatedAt: { $gte: startOfToday } }),
      DeliveryStaff.countDocuments()
    ]);

    const totalRevenue = totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;

    return res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        activeUsers,
        pendingOrders,
        deliveredOrders,
        completedToday,
        deliveryStaffCount
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

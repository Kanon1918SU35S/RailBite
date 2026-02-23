const Order = require('../models/Order');
const User = require('../models/User');
const DeliveryStaff = require('../models/DeliveryStaff');
const Menu = require('../models/Menu');
const Review = require('../models/Review');

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

// GET /api/dashboard/analytics - advanced analytics for admin dashboard
exports.getAnalytics = async (req, res) => {
  try {
    const { range = '7d' } = req.query;

    // Determine date range
    let startDate = new Date();
    switch (range) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Summary stats for the selected period
    const [periodOrdersAgg, periodRevenueAgg, periodOrderCount] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Order.countDocuments({ createdAt: { $gte: startDate } })
    ]);

    const periodRevenue = periodOrdersAgg.length > 0 ? periodOrdersAgg[0].total : 0;
    const periodOrders = periodOrderCount;

    // Revenue over time (daily)
    const revenueOverTime = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Most popular items
    const popularItems = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalOrdered: { $sum: '$items.quantity' },
          totalRevenue: {
            $sum: { $multiply: ['$items.price', '$items.quantity'] }
          }
        }
      },
      { $sort: { totalOrdered: -1 } },
      { $limit: 10 }
    ]);

    // Peak ordering hours
    const peakHours = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Order type distribution (train vs station)
    const orderTypeDistribution = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$orderType',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Payment method distribution
    const paymentMethodDistribution = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Average order value
    const avgOrderValue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          avgValue: { $avg: '$totalAmount' },
          minValue: { $min: '$totalAmount' },
          maxValue: { $max: '$totalAmount' }
        }
      }
    ]);

    // Customer retention: repeat customers in period
    const customerStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          repeatCustomers: {
            $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] }
          }
        }
      }
    ]);

    // Delivery staff performance
    const deliveryPerformance = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          assignedTo: { $ne: null },
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          deliveriesCompleted: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staffInfo'
        }
      },
      { $unwind: { path: '$staffInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: '$staffInfo.name',
          deliveriesCompleted: 1,
          totalRevenue: 1
        }
      },
      { $sort: { deliveriesCompleted: -1 } },
      { $limit: 10 }
    ]);

    // New customers over time
    const newCustomers = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          role: 'customer'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        // Period summary
        periodRevenue,
        periodOrders,
        // Detailed analytics
        revenueOverTime,
        ordersByStatus,
        popularItems,
        peakHours,
        orderTypeDistribution,
        paymentMethodDistribution,
        avgOrderValue: avgOrderValue[0] || { avgValue: 0, minValue: 0, maxValue: 0 },
        customerStats: customerStats[0] || { totalCustomers: 0, repeatCustomers: 0 },
        deliveryPerformance,
        newCustomers,
        range
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

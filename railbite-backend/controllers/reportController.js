const Order = require('../models/Order');

exports.getReport = async (req, res) => {
  try {
    const { range = 'today' } = req.query;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startDate;
    switch (range) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = null;
    }

    const dateFilter = startDate ? { createdAt: { $gte: startDate } } : {};

    // 1) summary stats
    const [totalOrdersCount, revenueAgg, avgAgg] = await Promise.all([
      Order.countDocuments(dateFilter),
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
      ])
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const averageOrderValue = avgAgg[0]?.avg || 0;

    // 2) top selling items
    const topItemsAgg = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          count: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { name: '$_id', count: 1, revenue: 1, _id: 0 } }
    ]);

    // 3) revenue by payment method (category breakdown)
    const paymentBreakdown = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $project: { category: '$_id', revenue: 1, count: 1, _id: 0 } }
    ]);

    // 4) revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' }
                ]
              }
            ]
          },
          revenue: 1,
          orders: 1
        }
      }
    ]);

    // 5) orders by status
    const statusBreakdown = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } }
    ]);

    return res.json({
      success: true,
      data: {
        summary: {
          totalOrders: totalOrdersCount,
          totalRevenue,
          averageOrderValue
        },
        topItems: topItemsAgg,
        paymentBreakdown,
        monthlyRevenue,
        statusBreakdown
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPopularItems = async (req, res) => {
  try {
    const popularItems = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          orders: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { orders: -1 } },
      { $limit: 5 },
      { $project: { name: '$_id', orders: 1, revenue: 1, _id: 0 } }
    ]);

    res.json({ success: true, data: popularItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



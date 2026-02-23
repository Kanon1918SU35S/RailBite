const TrainInfo = require('../models/TrainInfo');
const Order = require('../models/Order');

// GET /api/trains/search?q=123 - search trains by number or name
exports.searchTrains = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    const trains = await TrainInfo.find({
      isActive: true,
      $or: [
        { trainNumber: { $regex: q, $options: 'i' } },
        { trainName: { $regex: q, $options: 'i' } }
      ]
    })
      .select('trainNumber trainName trainType route runDays')
      .limit(10)
      .sort({ trainNumber: 1 });
    res.json({ success: true, data: trains });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/trains/:trainNumber - get train details by number
exports.getTrainByNumber = async (req, res) => {
  try {
    const train = await TrainInfo.findOne({
      trainNumber: req.params.trainNumber,
      isActive: true
    });
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }
    res.json({ success: true, data: train });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/trains/:trainNumber/stations - get all stations for a train
exports.getTrainStations = async (req, res) => {
  try {
    const train = await TrainInfo.findOne({
      trainNumber: req.params.trainNumber,
      isActive: true
    }).select('trainNumber trainName route');
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }
    const stations = train.route
      .sort((a, b) => a.stopOrder - b.stopOrder)
      .map((s) => ({
        stationCode: s.stationCode,
        stationName: s.stationName,
        arrivalTime: s.arrivalTime,
        departureTime: s.departureTime,
        haltMinutes: s.haltMinutes
      }));
    res.json({
      success: true,
      data: {
        trainNumber: train.trainNumber,
        trainName: train.trainName,
        stations
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/trains - admin: add a new train
exports.createTrain = async (req, res) => {
  try {
    const { trainNumber, trainName, route, runDays, trainType } = req.body;
    if (!trainNumber || !trainName) {
      return res.status(400).json({
        success: false,
        message: 'trainNumber and trainName are required'
      });
    }
    const exists = await TrainInfo.findOne({ trainNumber });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Train with this number already exists'
      });
    }
    const train = await TrainInfo.create({
      trainNumber,
      trainName,
      route: route || [],
      runDays: runDays || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      trainType: trainType || 'express'
    });
    res.status(201).json({ success: true, data: train });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/trains/:id - admin: update train info
exports.updateTrain = async (req, res) => {
  try {
    const train = await TrainInfo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }
    res.json({ success: true, data: train });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/trains/:id - admin: delete a train
exports.deleteTrain = async (req, res) => {
  try {
    const train = await TrainInfo.findByIdAndDelete(req.params.id);
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }
    res.json({ success: true, message: 'Train deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/trains - admin: get all trains (including inactive)
exports.getAllTrains = async (req, res) => {
  try {
    const trains = await TrainInfo.find().sort({ trainNumber: 1 });
    res.json({ success: true, data: trains });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/trains/:id/toggle-active - admin: toggle train active status
exports.toggleTrainActive = async (req, res) => {
  try {
    const train = await TrainInfo.findById(req.params.id);
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }
    train.isActive = !train.isActive;
    await train.save();
    res.json({
      success: true,
      data: train,
      message: `Train ${train.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/trains/stats - admin: get train statistics
exports.getTrainStats = async (req, res) => {
  try {
    const [totalTrains, activeTrains, trainTypeStats, trainOrderStats] = await Promise.all([
      TrainInfo.countDocuments(),
      TrainInfo.countDocuments({ isActive: true }),
      TrainInfo.aggregate([
        { $group: { _id: '$trainType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Order.aggregate([
        { $match: { orderType: 'train', trainNumber: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$trainNumber',
            orderCount: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { orderCount: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalTrains,
        activeTrains,
        inactiveTrains: totalTrains - activeTrains,
        trainTypeStats,
        topTrainsByOrders: trainOrderStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

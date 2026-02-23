const express = require('express');
const router = express.Router();
const {
    searchTrains,
    getTrainByNumber,
    getTrainStations,
    createTrain,
    updateTrain,
    deleteTrain,
    getAllTrains
} = require('../controllers/trainController');
const { protect, admin } = require('../middleware/auth');

// Public routes (authenticated users can search trains)
router.get('/search', protect, searchTrains);
router.get('/:trainNumber', protect, getTrainByNumber);
router.get('/:trainNumber/stations', protect, getTrainStations);

// Admin routes
router.get('/', protect, admin, getAllTrains);
router.post('/', protect, admin, createTrain);
router.put('/:id', protect, admin, updateTrain);
router.delete('/:id', protect, admin, deleteTrain);

module.exports = router;

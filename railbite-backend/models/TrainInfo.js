const mongoose = require('mongoose');

const trainInfoSchema = new mongoose.Schema(
    {
        trainNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        trainName: {
            type: String,
            required: true,
            trim: true
        },
        route: [
            {
                stationCode: { type: String, required: true },
                stationName: { type: String, required: true },
                arrivalTime: { type: String, default: '' },
                departureTime: { type: String, default: '' },
                stopOrder: { type: Number, required: true },
                haltMinutes: { type: Number, default: 0 }
            }
        ],
        runDays: {
            type: [String],
            enum: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            default: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        },
        trainType: {
            type: String,
            enum: ['express', 'mail', 'local', 'intercity', 'commuter', 'other'],
            default: 'express'
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// Text index for search by train name or number
trainInfoSchema.index({ trainNumber: 'text', trainName: 'text' });

module.exports = mongoose.model('TrainInfo', trainInfoSchema);

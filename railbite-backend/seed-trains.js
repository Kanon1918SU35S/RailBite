/**
 * Seed script for TrainInfo collection.
 * Run: node seed-trains.js
 */
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
const mongoose = require('mongoose');
const TrainInfo = require('./models/TrainInfo');

const sampleTrains = [
    {
        trainNumber: '705',
        trainName: 'Subarna Express',
        trainType: 'express',
        runDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        route: [
            { stationCode: 'DAC', stationName: 'Dhaka (Kamalapur)', departureTime: '06:40', stopOrder: 1, haltMinutes: 0 },
            { stationCode: 'NRS', stationName: 'Narayanganj', arrivalTime: '07:15', departureTime: '07:17', stopOrder: 2, haltMinutes: 2 },
            { stationCode: 'BHR', stationName: 'Bhairab Bazar', arrivalTime: '08:30', departureTime: '08:32', stopOrder: 3, haltMinutes: 2 },
            { stationCode: 'COM', stationName: 'Comilla', arrivalTime: '09:45', departureTime: '09:50', stopOrder: 4, haltMinutes: 5 },
            { stationCode: 'FEN', stationName: 'Feni', arrivalTime: '10:40', departureTime: '10:42', stopOrder: 5, haltMinutes: 2 },
            { stationCode: 'CTG', stationName: 'Chittagong', arrivalTime: '12:15', stopOrder: 6, haltMinutes: 0 }
        ]
    },
    {
        trainNumber: '701',
        trainName: 'Turna Express',
        trainType: 'express',
        runDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        route: [
            { stationCode: 'DAC', stationName: 'Dhaka (Kamalapur)', departureTime: '23:00', stopOrder: 1, haltMinutes: 0 },
            { stationCode: 'BHR', stationName: 'Bhairab Bazar', arrivalTime: '00:30', departureTime: '00:32', stopOrder: 2, haltMinutes: 2 },
            { stationCode: 'COM', stationName: 'Comilla', arrivalTime: '02:00', departureTime: '02:05', stopOrder: 3, haltMinutes: 5 },
            { stationCode: 'FEN', stationName: 'Feni', arrivalTime: '03:15', departureTime: '03:17', stopOrder: 4, haltMinutes: 2 },
            { stationCode: 'CTG', stationName: 'Chittagong', arrivalTime: '05:30', stopOrder: 5, haltMinutes: 0 }
        ]
    },
    {
        trainNumber: '735',
        trainName: 'Sonar Bangla Express',
        trainType: 'express',
        runDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        route: [
            { stationCode: 'DAC', stationName: 'Dhaka (Kamalapur)', departureTime: '07:00', stopOrder: 1, haltMinutes: 0 },
            { stationCode: 'COM', stationName: 'Comilla', arrivalTime: '09:30', departureTime: '09:35', stopOrder: 2, haltMinutes: 5 },
            { stationCode: 'CTG', stationName: 'Chittagong', arrivalTime: '12:00', stopOrder: 3, haltMinutes: 0 }
        ]
    },
    {
        trainNumber: '759',
        trainName: 'Ekota Express',
        trainType: 'express',
        runDays: ['Sat', 'Mon', 'Wed', 'Thu'],
        route: [
            { stationCode: 'DAC', stationName: 'Dhaka (Kamalapur)', departureTime: '15:30', stopOrder: 1, haltMinutes: 0 },
            { stationCode: 'BHR', stationName: 'Bhairab Bazar', arrivalTime: '17:00', departureTime: '17:02', stopOrder: 2, haltMinutes: 2 },
            { stationCode: 'COM', stationName: 'Comilla', arrivalTime: '18:30', departureTime: '18:35', stopOrder: 3, haltMinutes: 5 },
            { stationCode: 'CTG', stationName: 'Chittagong', arrivalTime: '21:00', stopOrder: 4, haltMinutes: 0 }
        ]
    },
    {
        trainNumber: '771',
        trainName: 'Silk City Express',
        trainType: 'express',
        runDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        route: [
            { stationCode: 'DAC', stationName: 'Dhaka (Kamalapur)', departureTime: '06:20', stopOrder: 1, haltMinutes: 0 },
            { stationCode: 'ISR', stationName: 'Ishurdi', arrivalTime: '10:00', departureTime: '10:05', stopOrder: 2, haltMinutes: 5 },
            { stationCode: 'RAJ', stationName: 'Rajshahi', arrivalTime: '11:30', stopOrder: 3, haltMinutes: 0 }
        ]
    },
    {
        trainNumber: '773',
        trainName: 'Padma Express',
        trainType: 'express',
        runDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        route: [
            { stationCode: 'DAC', stationName: 'Dhaka (Kamalapur)', departureTime: '21:00', stopOrder: 1, haltMinutes: 0 },
            { stationCode: 'ISR', stationName: 'Ishurdi', arrivalTime: '01:00', departureTime: '01:05', stopOrder: 2, haltMinutes: 5 },
            { stationCode: 'RAJ', stationName: 'Rajshahi', arrivalTime: '02:45', stopOrder: 3, haltMinutes: 0 }
        ]
    },
    {
        trainNumber: '787',
        trainName: 'Rangpur Express',
        trainType: 'express',
        runDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        route: [
            { stationCode: 'DAC', stationName: 'Dhaka (Kamalapur)', departureTime: '21:40', stopOrder: 1, haltMinutes: 0 },
            { stationCode: 'BPC', stationName: 'B. Sirajul Islam', arrivalTime: '00:30', departureTime: '00:32', stopOrder: 2, haltMinutes: 2 },
            { stationCode: 'RGP', stationName: 'Rangpur', arrivalTime: '06:00', stopOrder: 3, haltMinutes: 0 }
        ]
    },
    {
        trainNumber: '741',
        trainName: 'Parabat Express',
        trainType: 'express',
        runDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        route: [
            { stationCode: 'DAC', stationName: 'Dhaka (Kamalapur)', departureTime: '06:40', stopOrder: 1, haltMinutes: 0 },
            { stationCode: 'BHR', stationName: 'Bhairab Bazar', arrivalTime: '08:10', departureTime: '08:12', stopOrder: 2, haltMinutes: 2 },
            { stationCode: 'SHJ', stationName: 'Srimangal', arrivalTime: '10:20', departureTime: '10:25', stopOrder: 3, haltMinutes: 5 },
            { stationCode: 'SYL', stationName: 'Sylhet', arrivalTime: '13:00', stopOrder: 4, haltMinutes: 0 }
        ]
    }
];

async function seedTrains() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');

        const existing = await TrainInfo.countDocuments();
        if (existing > 0) {
            console.log(`Already have ${existing} trains. Skipping seed.`);
            process.exit(0);
        }

        await TrainInfo.insertMany(sampleTrains);
        console.log(`Seeded ${sampleTrains.length} trains successfully!`);
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error.message);
        process.exit(1);
    }
}

seedTrains();

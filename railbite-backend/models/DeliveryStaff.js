const mongoose = require('mongoose');

const deliveryStaffSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'available'
    },
    assignedOrders: { type: Number, default: 0 },
    completedToday: { type: Number, default: 0 },
    totalDeliveries: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    onTimeRate: { type: Number, default: 100 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeliveryStaff', deliveryStaffSchema);

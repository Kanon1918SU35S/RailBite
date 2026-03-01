const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['promotion', 'alert', 'order', 'delivery', 'payment', 'info', 'system'],
      default: 'info'
    },
    title: { type: String, required: true },
    message: { type: String, required: true },

    // Broadcast target: which role group to reach
    targetRole: {
      type: String,
      enum: ['all', 'customer', 'delivery', 'admin'],
      default: 'all'
    },

    // Specific user target (for order-specific notifications)
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // Related order (for order notifications)
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },

    // Who sent it (admin for broadcast, system for auto)
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // Per-user read tracking
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

// Index for fast per-user queries
notificationSchema.index({ targetUser: 1, createdAt: -1 });
notificationSchema.index({ targetRole: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

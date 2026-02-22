const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    section: {
      type: String,
      required: true,
      enum: ['breakfast', 'lunch', 'dinner', 'snacksanddrinks']
    },
    category: {
      type: String,
      default: 'general',
      enum: ['burger', 'pizza', 'shwarma', 'smoothie', 'beverage', 'general']
    },
    image: { type: String, default: '' },
    available: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Menu', menuSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    role: {
      type: String,
      enum: ['admin', 'delivery', 'customer'],
      default: 'customer'
    },
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active'
    },
    // 👉 add these two fields:
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpire: { type: Date, default: null },

    // Web Push subscription
    pushSubscription: {
      endpoint: { type: String, default: null },
      keys: {
        p256dh: { type: String, default: null },
        auth: { type: String, default: null }
      }
    },
    pushEnabled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

const DeliveryStaff = require('../models/DeliveryStaff');
const User = require('../models/User');
const Order = require('../models/Order');

// Helper: sync a single staff profile's counters with live Order data
const syncStaffProfile = async (staff) => {
  if (!staff.userId) return staff;
  const [activeOrders, totalDeliveries] = await Promise.all([
    Order.countDocuments({
      assignedTo: staff.userId,
      status: { $nin: ['delivered', 'cancelled'] }
    }),
    Order.countDocuments({
      assignedTo: staff.userId,
      status: 'delivered'
    })
  ]);
  let changed = false;
  if (staff.assignedOrders !== activeOrders) {
    staff.assignedOrders = activeOrders;
    changed = true;
  }
  if (staff.totalDeliveries !== totalDeliveries) {
    staff.totalDeliveries = totalDeliveries;
    changed = true;
  }
  if (activeOrders === 0 && staff.status === 'busy') {
    staff.status = 'available';
    changed = true;
  }
  if (changed) await staff.save();
  return staff;
};

// GET /api/delivery-staff
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await DeliveryStaff.find().populate('userId', 'email').sort({ createdAt: -1 });
    // Sync each profile with live order data
    await Promise.all(staff.map(s => syncStaffProfile(s)));
    const data = staff.map(s => {
      const obj = s.toObject();
      obj.email = obj.userId?.email || '';
      return obj;
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/delivery-staff/available - get available staff for assignment
exports.getAvailableStaff = async (req, res) => {
  try {
    const staff = await DeliveryStaff.find({ status: { $ne: 'offline' } })
      .populate('userId', 'email')
      .sort({ assignedOrders: 1, status: 1 });
    // Sync each profile with live order data
    await Promise.all(staff.map(s => syncStaffProfile(s)));
    // Re-sort after sync since values may have changed
    staff.sort((a, b) => a.assignedOrders - b.assignedOrders || (a.status === 'available' ? -1 : 1));
    const data = staff.map(s => {
      const obj = s.toObject();
      obj.email = obj.userId?.email || '';
      return obj;
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/delivery-staff
exports.createStaff = async (req, res) => {
  try {
    const { name, phone, email, password, status } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required for delivery staff login'
      });
    }

    // Check if email already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create User account with delivery role
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: 'delivery',
      status: 'active'
    });

    // Create DeliveryStaff profile linked to User
    const staff = await DeliveryStaff.create({
      userId: user._id,
      name,
      phone,
      status: status || 'available'
    });

    const staffObj = staff.toObject();
    staffObj.email = email;

    res.status(201).json({ success: true, data: staffObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/delivery-staff/:id
exports.updateStaff = async (req, res) => {
  try {
    // Only allow safe fields to be updated
    const { name, phone, status, email } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (status !== undefined) updateData.status = status;

    const staff = await DeliveryStaff.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/delivery-staff/:id
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await DeliveryStaff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }
    // Also remove the linked User account
    if (staff.userId) {
      await User.findByIdAndDelete(staff.userId);
    }
    res.json({ success: true, message: 'Delivery staff deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

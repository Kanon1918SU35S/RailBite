const Notification = require('../models/Notification');

// ──────────────────────────────────────────────
// Helper: create a notification (used by other controllers too)
// ──────────────────────────────────────────────
exports.createNotification = async ({
  type = 'info',
  title,
  message,
  targetRole = 'all',
  targetUser = null,
  relatedOrder = null,
  sentBy = null
}) => {
  try {
    return await Notification.create({
      type,
      title,
      message,
      targetRole,
      targetUser,
      relatedOrder,
      sentBy
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

// ──────────────────────────────────────────────
// GET /api/notifications/my – notifications for the logged-in user
// Returns notifications targeted at the user specifically OR at their role group OR at 'all'
// ──────────────────────────────────────────────
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role; // 'customer', 'admin', 'delivery'

    // Map role to targetRole values
    const roleMap = {
      customer: 'customer',
      admin: 'admin',
      delivery: 'delivery'
    };
    const myTargetRole = roleMap[userRole] || 'customer';

    const notifications = await Notification.find({
      $or: [
        { targetUser: userId },                     // specifically for me
        { targetRole: 'all', targetUser: null },    // broadcast to all
        { targetRole: myTargetRole, targetUser: null } // broadcast to my role
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Add `read` boolean per user
    const data = notifications.map(n => ({
      ...n,
      read: (n.readBy || []).some(id => id.toString() === userId.toString())
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// PATCH /api/notifications/:id/read – mark one notification as read
// ──────────────────────────────────────────────
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: userId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// PATCH /api/notifications/read-all – mark all my notifications as read
// ──────────────────────────────────────────────
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const roleMap = { customer: 'customer', admin: 'admin', delivery: 'delivery' };
    const myTargetRole = roleMap[userRole] || 'customer';

    await Notification.updateMany(
      {
        $or: [
          { targetUser: userId },
          { targetRole: 'all', targetUser: null },
          { targetRole: myTargetRole, targetUser: null }
        ],
        readBy: { $ne: userId }
      },
      { $addToSet: { readBy: userId } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// GET /api/notifications/unread-count – quick badge count
// ──────────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const roleMap = { customer: 'customer', admin: 'admin', delivery: 'delivery' };
    const myTargetRole = roleMap[userRole] || 'customer';

    const count = await Notification.countDocuments({
      $or: [
        { targetUser: userId },
        { targetRole: 'all', targetUser: null },
        { targetRole: myTargetRole, targetUser: null }
      ],
      readBy: { $ne: userId }
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// GET /api/notifications – all notifications (admin only)
// ──────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('sentBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// POST /api/notifications – send broadcast notification (admin only)
// ──────────────────────────────────────────────
exports.send = async (req, res) => {
  try {
    const { type, title, message, targetRole } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    const validTargets = ['all', 'customer', 'delivery', 'admin'];
    const target = validTargets.includes(targetRole) ? targetRole : 'all';

    const notification = await Notification.create({
      type: type || 'info',
      title,
      message,
      targetRole: target,
      sentBy: req.user._id
    });

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// DELETE /api/notifications/:id – delete notification (admin only)
// ──────────────────────────────────────────────
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

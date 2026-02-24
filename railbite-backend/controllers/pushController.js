const User = require('../models/User');
const { vapidPublicKey, sendPushToUsers } = require('../utils/pushNotification');

// GET /api/push/vapid-key – return public VAPID key
exports.getVapidKey = async (req, res) => {
    res.json({ success: true, vapidPublicKey });
};

// POST /api/push/subscribe – store browser push subscription
exports.subscribe = async (req, res) => {
    try {
        const { subscription } = req.body;
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ success: false, message: 'Invalid subscription' });
        }

        await User.findByIdAndUpdate(req.user._id, {
            pushSubscription: {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                },
            },
            pushEnabled: true,
        });

        res.json({ success: true, message: 'Push subscription saved' });
    } catch (err) {
        console.error('Push subscribe error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /api/push/unsubscribe – remove push subscription
exports.unsubscribe = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            pushSubscription: { endpoint: null, keys: { p256dh: null, auth: null } },
            pushEnabled: false,
        });
        res.json({ success: true, message: 'Push subscription removed' });
    } catch (err) {
        console.error('Push unsubscribe error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /api/push/send-broadcast – admin send push to all subscribed users
exports.sendBroadcast = async (req, res) => {
    try {
        const { title, body, url, targetRole } = req.body;
        if (!title || !body) {
            return res.status(400).json({ success: false, message: 'Title and body are required' });
        }

        const query = { pushEnabled: true, 'pushSubscription.endpoint': { $ne: null } };
        if (targetRole && targetRole !== 'all') {
            query.role = targetRole;
        }

        const users = await User.find(query).select('pushSubscription pushEnabled _id');
        const results = await sendPushToUsers(users, { title, body, url: url || '/' });

        // Clean up expired subscriptions
        const expired = results.filter(r => r.result && r.result.expired);
        for (const exp of expired) {
            await User.findByIdAndUpdate(exp.userId, {
                pushSubscription: { endpoint: null, keys: { p256dh: null, auth: null } },
                pushEnabled: false,
            });
        }

        res.json({
            success: true,
            message: `Push sent to ${results.length} users (${expired.length} expired)`,
        });
    } catch (err) {
        console.error('Push broadcast error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

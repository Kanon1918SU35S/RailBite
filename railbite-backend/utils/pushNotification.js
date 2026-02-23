const webpush = require('web-push');

// VAPID keys – generate once: npx web-push generate-vapid-keys
// Store these in your .env file:
//   VAPID_PUBLIC_KEY=...
//   VAPID_PRIVATE_KEY=...
//   VAPID_EMAIL=mailto:admin@railbite.com
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@railbite.com';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

/**
 * Send push notification to a specific user's subscription
 * @param {Object} subscription - { endpoint, keys: { p256dh, auth } }
 * @param {Object} payload - { title, body, icon, url, tag }
 */
const sendPushNotification = async (subscription, payload) => {
    if (!vapidPublicKey || !vapidPrivateKey) {
        console.log('VAPID keys not configured – skipping push notification');
        return null;
    }

    if (!subscription || !subscription.endpoint) {
        return null;
    }

    try {
        const result = await webpush.sendNotification(
            subscription,
            JSON.stringify({
                title: payload.title || 'RailBite',
                body: payload.body || '',
                icon: payload.icon || '/images/logo.png',
                badge: '/images/logo.png',
                url: payload.url || '/',
                tag: payload.tag || 'railbite-notification',
            })
        );
        return result;
    } catch (error) {
        // 410 Gone = subscription expired, should remove from DB
        if (error.statusCode === 410 || error.statusCode === 404) {
            console.log('Push subscription expired, should be removed');
            return { expired: true };
        }
        console.error('Push notification error:', error.message);
        return null;
    }
};

/**
 * Send push notification to multiple users
 * @param {Array} users - Array of User documents with pushSubscription
 * @param {Object} payload - { title, body, icon, url, tag }
 */
const sendPushToUsers = async (users, payload) => {
    const results = [];
    for (const user of users) {
        if (user.pushEnabled && user.pushSubscription && user.pushSubscription.endpoint) {
            const result = await sendPushNotification(user.pushSubscription, payload);
            results.push({ userId: user._id, result });
        }
    }
    return results;
};

module.exports = {
    sendPushNotification,
    sendPushToUsers,
    vapidPublicKey,
};

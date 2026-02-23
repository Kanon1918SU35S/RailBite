import { useState, useCallback } from 'react';
import { pushAPI } from '../services/api';

/**
 * Helper to convert a base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const usePushNotifications = () => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported] = useState(() => 'serviceWorker' in navigator && 'PushManager' in window);
    const [loading, setLoading] = useState(false);

    /**
     * Check if browser is already subscribed
     */
    const checkSubscription = useCallback(async () => {
        if (!isSupported) return false;
        try {
            const registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
            if (!registration) return false;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
            return !!subscription;
        } catch {
            return false;
        }
    }, [isSupported]);

    /**
     * Subscribe to push notifications
     */
    const subscribe = useCallback(async (token) => {
        if (!isSupported) return false;
        setLoading(true);
        try {
            // Register service worker
            const registration = await navigator.serviceWorker.register('/sw-push.js');
            await navigator.serviceWorker.ready;

            // Get VAPID key from server
            const { data } = await pushAPI.getVapidKey();
            if (!data.vapidPublicKey) {
                console.warn('Push notifications not configured on server');
                setLoading(false);
                return false;
            }

            // Subscribe browser
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(data.vapidPublicKey),
            });

            // Send subscription to server
            await pushAPI.subscribe(subscription.toJSON(), token);
            setIsSubscribed(true);
            setLoading(false);
            return true;
        } catch (err) {
            console.error('Push subscribe failed:', err);
            setLoading(false);
            return false;
        }
    }, [isSupported]);

    /**
     * Unsubscribe from push notifications
     */
    const unsubscribe = useCallback(async (token) => {
        if (!isSupported) return false;
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
            if (registration) {
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                }
            }
            await pushAPI.unsubscribe(token);
            setIsSubscribed(false);
            setLoading(false);
            return true;
        } catch (err) {
            console.error('Push unsubscribe failed:', err);
            setLoading(false);
            return false;
        }
    }, [isSupported]);

    return {
        isSupported,
        isSubscribed,
        loading,
        subscribe,
        unsubscribe,
        checkSubscription,
    };
};

export default usePushNotifications;

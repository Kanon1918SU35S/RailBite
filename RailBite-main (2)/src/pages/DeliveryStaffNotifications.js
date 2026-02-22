import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DeliveryStaffSidebar from '../components/DeliveryStaffSidebar';
import { notificationAPI } from '../services/api';

const DeliveryStaffNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const getToken = () => localStorage.getItem('railbite_delivery_token');

    const fetchNotifications = useCallback(async () => {
        const token = getToken();
        if (!token) { setLoading(false); return; }
        try {
            setLoading(true);
            const res = await notificationAPI.getMyNotifications(token);
            if (res.data.success) {
                setNotifications(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = async (id) => {
        const token = getToken();
        if (!token) return;
        try {
            await notificationAPI.markAsRead(id, token);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, read: true } : n)
            );
        } catch (err) {
            console.error('Failed to mark as read:', err.message);
        }
    };

    const markAllAsRead = async () => {
        const token = getToken();
        if (!token) return;
        try {
            await notificationAPI.markAllAsRead(token);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark all as read:', err.message);
        }
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification._id);
        if (notification.relatedOrder) {
            navigate(`/delivery/order/${notification.relatedOrder}`);
        }
    };

    const getIcon = (type) => {
        const icons = { promotion: '🎉', alert: '⚠️', order: '📦', delivery: '🚚', info: 'ℹ️', system: '🔧' };
        return icons[type] || '🔔';
    };

    const getRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
        return Math.floor(diff / 604800) + 'w ago';
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'read') return n.read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="admin-layout">
            <DeliveryStaffSidebar />
            <div className="admin-content">
                <div className="admin-header">
                    <div>
                        <h1>Notifications</h1>
                        <p>{unreadCount > 0
                            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                            : 'All caught up!'}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button className="admin-btn-primary" onClick={markAllAsRead}>
                            Mark All Read
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="admin-filters">
                    {['all', 'unread', 'read'].map(f => (
                        <button
                            key={f}
                            className={`admin-btn-secondary ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                            style={filter === f ? {
                                background: 'var(--primary-orange)',
                                color: 'var(--text-white)',
                                borderColor: 'var(--primary-orange)'
                            } : {}}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)} ({
                                f === 'all' ? notifications.length :
                                    f === 'unread' ? unreadCount :
                                        notifications.filter(n => n.read).length
                            })
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div className="admin-card">
                        <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '2rem' }}>
                            Loading notifications...
                        </p>
                    </div>
                ) : filteredNotifications.length > 0 ? (
                    <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                        {filteredNotifications.map((notif, idx) => (
                            <div
                                key={notif._id}
                                onClick={() => handleNotificationClick(notif)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '1rem',
                                    padding: '1rem 1.4rem',
                                    borderBottom: idx < filteredNotifications.length - 1
                                        ? '1px solid var(--border-dark)' : 'none',
                                    background: !notif.read
                                        ? 'rgba(232, 126, 30, 0.06)' : 'transparent',
                                    cursor: notif.relatedOrder ? 'pointer' : 'default',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <div style={{
                                    fontSize: '1.5rem',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '10px',
                                    background: 'rgba(232, 126, 30, 0.12)',
                                    flexShrink: 0
                                }}>
                                    {getIcon(notif.type)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <strong style={{ color: 'var(--text-white)', fontSize: '0.95rem' }}>
                                            {notif.title}
                                        </strong>
                                        {!notif.read && (
                                            <span style={{
                                                width: '8px', height: '8px',
                                                borderRadius: '50%',
                                                background: 'var(--primary-orange)',
                                                flexShrink: 0
                                            }} />
                                        )}
                                    </div>
                                    <p style={{
                                        color: 'var(--text-gray)',
                                        fontSize: '0.88rem',
                                        margin: '0.25rem 0',
                                        lineHeight: '1.4'
                                    }}>
                                        {notif.message}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.3rem' }}>
                                        <span style={{ color: 'var(--text-gray)', fontSize: '0.8rem', opacity: 0.7 }}>
                                            {getRelativeTime(notif.createdAt)}
                                        </span>
                                        {!notif.read && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--primary-orange)',
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer',
                                                    padding: 0
                                                }}
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                        {notif.relatedOrder && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleNotificationClick(notif); }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--primary-orange)',
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer',
                                                    padding: 0
                                                }}
                                            >
                                                View order →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="admin-card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔕</div>
                        <h3 style={{ color: 'var(--text-white)', marginBottom: '0.5rem' }}>
                            No {filter !== 'all' ? filter : ''} notifications
                        </h3>
                        <p style={{ color: 'var(--text-gray)' }}>
                            Check back later for delivery updates and announcements.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryStaffNotifications;

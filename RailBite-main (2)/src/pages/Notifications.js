import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getToken = () =>
    localStorage.getItem('railbiteToken') ||
    localStorage.getItem('railbite_token') ||
    null;

  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
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
      navigate(`/order-details/${notification.relatedOrder}`);
    }
  };

  const getIcon = (type) => {
    const icons = {
      promotion: '🎉',
      alert: '⚠️',
      order: '📦',
      delivery: '🚚',
      info: 'ℹ️',
      system: '🔧'
    };
    return icons[type] || '🔔';
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60);
      return mins + ' minute' + (mins > 1 ? 's' : '') + ' ago';
    }
    if (diffInSeconds < 86400) {
      const hrs = Math.floor(diffInSeconds / 3600);
      return hrs + ' hour' + (hrs > 1 ? 's' : '') + ' ago';
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return days + ' day' + (days > 1 ? 's' : '') + ' ago';
    }
    const weeks = Math.floor(diffInSeconds / 604800);
    return weeks + ' week' + (weeks > 1 ? 's' : '') + ' ago';
  };

  const getFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="container">
          <div className="notifications-header">
            <h1>Notifications</h1>
            <p className="notifications-subtitle">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="container">
        <div className="notifications-header">
          <div>
            <h1>Notifications</h1>
            <p className="notifications-subtitle">
              {unreadCount > 0
                ? 'You have ' + unreadCount + ' unread notification' + (unreadCount > 1 ? 's' : '')
                : 'All caught up!'}
            </p>
          </div>
          <div className="notifications-actions">
            {notifications.length > 0 && unreadCount > 0 && (
              <button className="btn-secondary" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>
        </div>

        <div className="notifications-filter">
          <button
            className={'filter-tab ' + (filter === 'all' ? 'active' : '')}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button
            className={'filter-tab ' + (filter === 'unread' ? 'active' : '')}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={'filter-tab ' + (filter === 'read' ? 'active' : '')}
            onClick={() => setFilter('read')}
          >
            Read ({readCount})
          </button>
        </div>

        <div className="notifications-list">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={'notification-card ' + (!notification.read ? 'unread' : '')}
                onClick={() => handleNotificationClick(notification)}
                style={{ cursor: notification.relatedOrder ? 'pointer' : 'default' }}
              >
                <div className="notification-card-icon">
                  {getIcon(notification.type)}
                </div>
                <div className="notification-card-content">
                  <div className="notification-card-header">
                    <h3>{notification.title}</h3>
                    {!notification.read && <span className="unread-dot"></span>}
                  </div>
                  <p className="notification-card-message">{notification.message}</p>
                  <div className="notification-card-footer">
                    <span className="notification-card-time">
                      {getRelativeTime(notification.createdAt)}
                    </span>
                    <span className="notification-card-date">
                      {getFullDate(notification.createdAt)}
                    </span>
                  </div>
                  <div className="notification-card-actions">
                    {notification.relatedOrder && (
                      <button
                        className="btn-link-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationClick(notification);
                        }}
                      >
                        View details →
                      </button>
                    )}
                    {!notification.read && (
                      <button
                        className="btn-link-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification._id);
                        }}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-notifications-page">
              <div className="no-notifications-icon">🔕</div>
              <h2>No {filter !== 'all' ? filter : ''} notifications</h2>
              <p>You are all caught up! Check back later for updates.</p>
              <button className="btn-primary" onClick={() => navigate('/')}>
                Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;
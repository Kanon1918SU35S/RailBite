import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const getToken = () =>
    localStorage.getItem('railbiteToken') ||
    localStorage.getItem('railbite_token') ||
    localStorage.getItem('railbite_delivery_token') ||
    null;

  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await notificationAPI.getMyNotifications(token);
      if (res.data.success) {
        const data = res.data.data || [];
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err.message);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await notificationAPI.getUnreadCount(token);
      if (res.data.success) {
        setUnreadCount(res.data.data.count);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err.message);
    }
  }, []);

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

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    const token = getToken();
    if (token && !notification.read) {
      try {
        await notificationAPI.markAsRead(notification._id, token);
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark as read:', err.message);
      }
    }

    setIsOpen(false);

    if (notification.relatedOrder) {
      navigate(`/order-details/${notification.relatedOrder}`);
    }
  };

  const markAllAsRead = async () => {
    const token = getToken();
    if (!token) return;

    try {
      await notificationAPI.markAllAsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err.message);
    }
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60);
      return mins + 'm ago';
    }
    if (diffInSeconds < 86400) {
      const hrs = Math.floor(diffInSeconds / 3600);
      return hrs + 'h ago';
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return days + 'd ago';
    }
    const weeks = Math.floor(diffInSeconds / 604800);
    return weeks + 'w ago';
  };

  return (
    <>
      {isOpen && (
        <div
          className="notification-overlay active"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="notification-wrapper" ref={wrapperRef}>
        <button
          className="notification-btn"
          onClick={() => {
            if (!isOpen) fetchNotifications();
            setIsOpen(!isOpen);
          }}
        >
          🔔
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </button>

        <div className={'notification-dropdown ' + (isOpen ? 'show active' : '')}>
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-header-actions">
              {unreadCount > 0 && (
                <button
                  className="notification-action-btn"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification._id}
                  className={'notification-item ' + (!notification.read ? 'unread' : '')}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">{getIcon(notification.type)}</div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">
                      {notification.message.length > 60
                        ? notification.message.substring(0, 60) + '...'
                        : notification.message}
                    </div>
                    <div className="notification-time">
                      {getRelativeTime(notification.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <div className="no-notifications-icon">🔕</div>
                <p>No notifications yet</p>
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button
                className="view-all-notifications"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default NotificationBell;

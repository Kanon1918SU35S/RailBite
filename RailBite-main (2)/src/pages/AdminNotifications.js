import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { notificationAPI } from '../services/api';

const AdminNotifications = () => {
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'manage'
  const navigate = useNavigate();

  // --- My Notifications state ---
  const [myNotifications, setMyNotifications] = useState([]);
  const [myLoading, setMyLoading] = useState(true);
  const [myFilter, setMyFilter] = useState('all');

  // --- Send & Manage state ---
  const [allNotifications, setAllNotifications] = useState([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    type: 'promotion',
    title: '',
    message: '',
    targetRole: 'all'
  });

  const getToken = () => localStorage.getItem('railbite_token');

  // --- Fetch admin's own notifications ---
  const fetchMyNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) { setMyLoading(false); return; }
    try {
      setMyLoading(true);
      const res = await notificationAPI.getMyNotifications(token);
      if (res.data.success) {
        setMyNotifications(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch my notifications:', err.message);
    } finally {
      setMyLoading(false);
    }
  }, []);

  // --- Fetch all notifications (for manage tab) ---
  const fetchAllNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setManageLoading(true);
      setManageError(null);
      const res = await notificationAPI.getAll(token);
      if (res.data.success) {
        setAllNotifications(res.data.data || []);
      } else {
        setManageError(res.data.message || 'Failed to load notifications');
      }
    } catch (err) {
      setManageError(err.response?.data?.message || err.message || 'Error loading notifications');
    } finally {
      setManageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyNotifications();
  }, [fetchMyNotifications]);

  useEffect(() => {
    if (activeTab === 'manage' && allNotifications.length === 0 && !manageLoading) {
      fetchAllNotifications();
    }
  }, [activeTab, allNotifications.length, manageLoading, fetchAllNotifications]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- My Notifications actions ---
  const markAsRead = async (id) => {
    const token = getToken();
    if (!token) return;
    try {
      await notificationAPI.markAsRead(id, token);
      setMyNotifications(prev =>
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
      setMyNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err.message);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    if (notification.relatedOrder) {
      navigate(`/admin/orders`);
    }
  };

  // --- Send & Manage actions ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }
    setSending(true);
    try {
      const token = getToken();
      const res = await notificationAPI.send(formData, token);
      if (res.data.success) {
        setAllNotifications(prev => [res.data.data, ...prev]);
        setToast({ message: 'Notification sent successfully!', type: 'success' });
        setFormData({ type: 'promotion', title: '', message: '', targetRole: 'all' });
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message || 'Failed to send',
        type: 'error'
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      const token = getToken();
      const res = await notificationAPI.delete(id, token);
      if (res.data.success) {
        setAllNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete');
    }
  };

  // --- Helpers ---
  const getTypeIcon = (type) => {
    const icons = { promotion: '🎉', alert: '⚠️', order: '📦', delivery: '🚚', payment: '💳', info: 'ℹ️', system: '🔧' };
    return icons[type] || '🔔';
  };

  const getTargetLabel = (target) => {
    const labels = { all: '👥 All Users', customer: '🧑‍💻 Customers', delivery: '🚚 Delivery Staff', admin: '👑 Admins' };
    return labels[target] || target;
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

  // --- Computed ---
  const myUnreadCount = myNotifications.filter(n => !n.read).length;
  const filteredMyNotifications = myNotifications.filter(n => {
    if (myFilter === 'unread') return !n.read;
    if (myFilter === 'read') return n.read;
    return true;
  });

  const totalSent = allNotifications.length;
  const broadcastCount = allNotifications.filter(n => !n.targetUser).length;
  const orderNotifCount = allNotifications.filter(n => n.type === 'order' || n.type === 'delivery').length;

  // --- Tab style helper ---
  const tabStyle = (tab) => ({
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderBottom: activeTab === tab ? '3px solid var(--primary-orange)' : '3px solid transparent',
    background: 'transparent',
    color: activeTab === tab ? 'var(--primary-orange)' : 'var(--text-gray)',
    fontWeight: activeTab === tab ? '600' : '400',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative'
  });

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <div>
            <h1>Notifications</h1>
            <p>{activeTab === 'my'
              ? (myUnreadCount > 0 ? `You have ${myUnreadCount} unread notification${myUnreadCount > 1 ? 's' : ''}` : 'All caught up!')
              : 'Send and manage notifications for all users'}
            </p>
          </div>
          {activeTab === 'my' && myUnreadCount > 0 && (
            <button className="admin-btn-primary" onClick={markAllAsRead}>
              Mark All Read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          borderBottom: '1px solid var(--border-dark)',
          marginBottom: '1.5rem'
        }}>
          <button style={tabStyle('my')} onClick={() => setActiveTab('my')}>
            🔔 My Notifications
            {myUnreadCount > 0 && (
              <span style={{
                marginLeft: '0.5rem',
                background: '#f44336',
                color: '#fff',
                borderRadius: '10px',
                padding: '2px 7px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {myUnreadCount}
              </span>
            )}
          </button>
          <button style={tabStyle('manage')} onClick={() => setActiveTab('manage')}>
            📤 Send &amp; Manage
          </button>
        </div>

        {/* ========== MY NOTIFICATIONS TAB ========== */}
        {activeTab === 'my' && (
          <>
            {/* Filters */}
            <div className="admin-filters">
              {['all', 'unread', 'read'].map(f => (
                <button
                  key={f}
                  className={`admin-btn-secondary ${myFilter === f ? 'active' : ''}`}
                  onClick={() => setMyFilter(f)}
                  style={myFilter === f ? {
                    background: 'var(--primary-orange)',
                    color: 'var(--text-white)',
                    borderColor: 'var(--primary-orange)'
                  } : {}}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)} ({
                    f === 'all' ? myNotifications.length :
                    f === 'unread' ? myUnreadCount :
                    myNotifications.filter(n => n.read).length
                  })
                </button>
              ))}
            </div>

            {/* Notification List */}
            {myLoading ? (
              <div className="admin-card">
                <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '2rem' }}>
                  Loading notifications...
                </p>
              </div>
            ) : filteredMyNotifications.length > 0 ? (
              <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                {filteredMyNotifications.map((notif, idx) => (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      padding: '1rem 1.4rem',
                      borderBottom: idx < filteredMyNotifications.length - 1
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
                      {getTypeIcon(notif.type)}
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
                            View orders →
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
                  No {myFilter !== 'all' ? myFilter : ''} notifications
                </h3>
                <p style={{ color: 'var(--text-gray)' }}>
                  You'll receive notifications for new orders, payments, deliveries, and more.
                </p>
              </div>
            )}
          </>
        )}

        {/* ========== SEND & MANAGE TAB ========== */}
        {activeTab === 'manage' && (
          <>
            {/* Stats */}
            <div className="admin-stats-grid admin-stats-grid-small">
              <div className="admin-stat-card admin-stat-card-staff-total">
                <div className="admin-stat-icon">📤</div>
                <div className="admin-stat-content">
                  <span className="admin-stat-label">Total Sent</span>
                  <span className="admin-stat-value">{totalSent}</span>
                </div>
              </div>
              <div className="admin-stat-card admin-stat-card-active">
                <div className="admin-stat-icon">📢</div>
                <div className="admin-stat-content">
                  <span className="admin-stat-label">Broadcasts</span>
                  <span className="admin-stat-value">{broadcastCount}</span>
                </div>
              </div>
              <div className="admin-stat-card admin-stat-card-users">
                <div className="admin-stat-icon">📦</div>
                <div className="admin-stat-content">
                  <span className="admin-stat-label">Order Notifications</span>
                  <span className="admin-stat-value">{orderNotifCount}</span>
                </div>
              </div>
            </div>

            {/* Send Form */}
            <div className="admin-card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: 'var(--text-white)', marginBottom: '1rem' }}>📤 Send New Notification</h3>
              <form onSubmit={handleSubmit} className="admin-form">
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} required>
                      <option value="promotion">🎉 Promotion</option>
                      <option value="alert">⚠️ Alert</option>
                      <option value="order">📦 Order Update</option>
                      <option value="info">ℹ️ Information</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Target Audience</label>
                    <select name="targetRole" value={formData.targetRole} onChange={handleChange} required>
                      <option value="all">👥 All Users</option>
                      <option value="customer">🧑‍💻 Customers Only</option>
                      <option value="delivery">🚚 Delivery Staff Only</option>
                      <option value="admin">👑 Admins Only</option>
                    </select>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Special Offer!"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Enter your notification message..."
                    rows="4"
                    required
                  />
                </div>

                {toast && (
                  <div className={`admin-toast ${toast.type === 'success' ? 'admin-toast-success' : 'admin-toast-error'}`}>
                    {toast.message}
                  </div>
                )}

                <div className="admin-modal-footer">
                  <button type="submit" className="admin-btn-primary" disabled={sending}>
                    {sending ? 'Sending...' : '📤 Send Notification'}
                  </button>
                </div>
              </form>
            </div>

            {/* Notification History Table */}
            <div className="admin-card">
              <h3 style={{ color: 'var(--text-white)', marginBottom: '1rem' }}>
                Sent Notifications ({allNotifications.length})
              </h3>

              {manageLoading ? (
                <p style={{ color: 'var(--text-gray)' }}>Loading notifications...</p>
              ) : manageError ? (
                <p className="admin-error-text">Error: {manageError}</p>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Title</th>
                        <th>Message</th>
                        <th>Target</th>
                        <th>Sent At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allNotifications.length > 0 ? (
                        allNotifications.map((notif) => (
                          <tr key={notif._id}>
                            <td>
                              <span className="admin-category-badge">
                                {getTypeIcon(notif.type)} {notif.type}
                              </span>
                            </td>
                            <td><strong>{notif.title}</strong></td>
                            <td className="admin-table-description">
                              {notif.message.length > 60
                                ? notif.message.substring(0, 60) + '...'
                                : notif.message}
                            </td>
                            <td>{getTargetLabel(notif.targetRole)}</td>
                            <td>
                              {new Date(notif.createdAt).toLocaleDateString('en-BD', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td>
                              <button
                                className="admin-btn-delete"
                                onClick={() => handleDelete(notif._id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="admin-empty-cell">
                            No notifications sent yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;

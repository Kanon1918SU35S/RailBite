import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { notificationAPI } from '../services/api';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    type: 'promotion',
    title: '',
    message: '',
    targetRole: 'all'
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('railbite_token');
      const res = await notificationAPI.getAll(token);
      if (res.data.success) {
        setNotifications(res.data.data || []);
      } else {
        setError(res.data.message || 'Failed to load notifications');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading notifications');
    } finally {
      setLoading(false);
    }
  };

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
      const token = localStorage.getItem('railbite_token');
      const res = await notificationAPI.send(formData, token);
      if (res.data.success) {
        setNotifications(prev => [res.data.data, ...prev]);
        setToast({ message: 'Notification sent successfully!', type: 'success' });
        setFormData({
          type: 'promotion',
          title: '',
          message: '',
          targetRole: 'all'
        });
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
      const token = localStorage.getItem('railbite_token');
      const res = await notificationAPI.delete(id, token);
      if (res.data.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete');
    }
  };

  const getTargetLabel = (target) => {
    const labels = {
      all: '👥 All Users',
      customer: '🧑‍💻 Customers',
      delivery: '🚚 Delivery Staff',
      admin: '👑 Admins'
    };
    return labels[target] || target;
  };

  const getTypeIcon = (type) => {
    const icons = { promotion: '🎉', alert: '⚠️', order: '📦', delivery: '🚚', info: 'ℹ️', system: '🔧' };
    return icons[type] || '🔔';
  };

  // Stats
  const totalSent = notifications.length;
  const broadcastCount = notifications.filter(n => !n.targetUser).length;
  const orderNotifCount = notifications.filter(n => n.type === 'order' || n.type === 'delivery').length;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <div>
            <h1>Notifications</h1>
            <p>Send and manage notifications for all users</p>
          </div>
        </div>

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
            Recent Notifications ({notifications.length})
          </h3>

          {loading ? (
            <p style={{ color: 'var(--text-gray)' }}>Loading notifications...</p>
          ) : error ? (
            <p className="admin-error-text">Error: {error}</p>
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
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
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
      </div>
    </div>
  );
};

export default AdminNotifications;

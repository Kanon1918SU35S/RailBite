import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { contactAPI } from '../services/api';

const AdminContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('railbite_token');
      const res = await contactAPI.getAll(token);
      if (res.data.success) {
        setMessages(res.data.data || []);
      } else {
        setError(res.data.message || 'Failed to load messages');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading messages');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem('railbite_token');
      const res = await contactAPI.updateStatus(id, status, token);
      if (res.data.success) {
        setMessages(prev =>
          prev.map(m => m._id === id ? res.data.data : m)
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      const token = localStorage.getItem('railbite_token');
      const res = await contactAPI.delete(id, token);
      if (res.data.success) {
        setMessages(prev => prev.filter(m => m._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete message');
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  const getStatusBadge = (status) => {
    const badges = {
      unread: { color: '#FF6B35', bg: '#FF6B3520' },
      read: { color: '#4ECDC4', bg: '#4ECDC420' },
      replied: { color: '#95E1D3', bg: '#95E1D320' }
    };
    return badges[status] || badges.unread;
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-header">
            <h1>Contact Messages</h1>
            <p>Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-header">
            <h1>Contact Messages</h1>
            <p style={{ color: 'red' }}>Error: {error}</p>
            <button className="admin-btn-primary" onClick={fetchMessages}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <div>
            <h1>Contact Messages</h1>
            <p>View and manage customer contact messages</p>
          </div>
          {unreadCount > 0 && (
            <div style={{
              background: '#FF6B3520',
              color: '#FF6B35',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="admin-stats-grid admin-stats-grid-small">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">📩</div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Total Messages</p>
              <h3 className="admin-stat-value">{messages.length}</h3>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">🔴</div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Unread</p>
              <h3 className="admin-stat-value">
                {messages.filter(m => m.status === 'unread').length}
              </h3>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">👁️</div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Read</p>
              <h3 className="admin-stat-value">
                {messages.filter(m => m.status === 'read').length}
              </h3>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">✅</div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Replied</p>
              <h3 className="admin-stat-value">
                {messages.filter(m => m.status === 'replied').length}
              </h3>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          {['all', 'unread', 'read', 'replied'].map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && ` (${messages.filter(m => m.status === f).length})`}
              {f === 'all' && ` (${messages.length})`}
            </button>
          ))}
        </div>

        {/* Messages Table */}
        <div className="admin-card">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Received</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.length > 0 ? (
                  filteredMessages.map((msg) => {
                    const badge = getStatusBadge(msg.status);
                    return (
                      <tr key={msg._id}>
                        <td><strong>{msg.name}</strong></td>
                        <td>{msg.email}</td>
                        <td style={{ maxWidth: '300px' }}>
                          <p style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '300px'
                          }}>
                            {msg.message}
                          </p>
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: badge.color,
                            backgroundColor: badge.bg
                          }}>
                            {msg.status}
                          </span>
                        </td>
                        <td>
                          {new Date(msg.createdAt).toLocaleDateString('en-BD', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td>
                          <div className="admin-action-buttons">
                            {msg.status === 'unread' && (
                              <button
                                className="admin-btn-edit"
                                onClick={() => handleStatusChange(msg._id, 'read')}
                              >
                                Mark Read
                              </button>
                            )}
                            {msg.status === 'read' && (
                              <button
                                className="admin-btn-edit"
                                onClick={() => handleStatusChange(msg._id, 'replied')}
                              >
                                Mark Replied
                              </button>
                            )}
                            <button
                              className="admin-btn-delete"
                              onClick={() => handleDelete(msg._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                      No messages found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContactMessages;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import { userAPI } from '../services/api';
import { orderAPI } from '../services/api';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Stats
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);

  // Edit form
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      const token = localStorage.getItem('railbiteToken');
      if (!token) return;

      const res = await orderAPI.getMyOrders(token);
      if (res.data.success) {
        const orders = res.data.data || [];
        setTotalOrders(orders.length);
        setTotalSpent(
          orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
        );
        setRecentOrders(orders.slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to load orders:', err.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    // Validate password if user wants to change it
    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        setErrorMsg('New password must be at least 8 characters');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setErrorMsg('New passwords do not match');
        return;
      }
      if (!formData.currentPassword) {
        setErrorMsg('Please enter your current password');
        return;
      }
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('railbiteToken');
      const payload = {
        name: formData.name,
        phone: formData.phone
      };

      // Only include password fields if user wants to change password
      if (formData.newPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      const res = await userAPI.updateProfile(payload, token);

      if (res.data.success) {
        // Update context + localStorage with new user info
        const updatedUser = res.data.user;
        updateUser(updatedUser);

        setSuccessMsg('Profile updated successfully!');
        setEditMode(false);

        // Sync form data with the new values
        setFormData(prev => ({
          ...prev,
          name: updatedUser.name || prev.name,
          phone: updatedUser.phone || prev.phone,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : new Date().getFullYear();

  return (
    <div className="profile-page">
      <BackButton />
      <div className="container">
        <div className="profile-container">

          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="profile-avatar">👤</div>
            <div className="profile-name">{user?.name || 'Guest User'}</div>

            <button
              className="btn btn-primary"
              style={{ marginBottom: '0.5rem', width: '100%' }}
              onClick={() => {
                setEditMode(!editMode);
                setSuccessMsg('');
                setErrorMsg('');
              }}
            >
              {editMode ? '✕ Cancel Edit' : '✏️ Edit Profile'}
            </button>

            <button className="btn btn-logout" onClick={handleLogout}>
              Logout
            </button>

            <div className="profile-info">
              <div className="profile-info-item">
                <span>📧</span>
                <span>{user?.email || 'N/A'}</span>
              </div>
              <div className="profile-info-item">
                <span>📞</span>
                <span>{user?.phone || 'Not set'}</span>
              </div>
              <div className="profile-info-item">
                <span>👤</span>
                <span style={{ textTransform: 'capitalize' }}>
                  {user?.role || 'customer'}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="profile-content">

            {/* Edit Form */}
            {editMode && (
              <div className="profile-section">
                <h3>✏️ Edit Profile</h3>

                {successMsg && (
                  <div style={{
                    padding: '10px',
                    marginBottom: '1rem',
                    borderRadius: '6px',
                    backgroundColor: '#d4edda',
                    color: '#155724'
                  }}>
                    ✅ {successMsg}
                  </div>
                )}

                {errorMsg && (
                  <div style={{
                    padding: '10px',
                    marginBottom: '1rem',
                    borderRadius: '6px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24'
                  }}>
                    ❌ {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="01712345678"
                    />
                  </div>

                  <hr style={{ margin: '1.5rem 0', borderColor: 'var(--border-color)' }} />

                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-gray)' }}>
                    Change Password (optional)
                  </h4>

                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter new password"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : '💾 Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Stats */}
            {!editMode && (
              <>
                <div className="profile-section">
                  <h3><span>📊</span> Statistics</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-label">Total Orders</div>
                      <div className="stat-value">{totalOrders}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Total Spent</div>
                      <div className="stat-value">৳{totalSpent.toFixed(2)}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Member Since</div>
                      <div className="stat-value">{memberSince}</div>
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="profile-section">
                  <h3><span>📦</span> Recent Orders</h3>
                  <div className="order-list">
                    {recentOrders.length === 0 ? (
                      <p style={{ color: 'var(--text-gray)', textAlign: 'center' }}>
                        No orders yet. Start ordering now!
                      </p>
                    ) : (
                      recentOrders.map(order => (
                        <div key={order._id} className="order-item">
                          <div className="order-header">
                            <span className="order-id">
                              Order #{order.orderNumber}
                            </span>
                            <span className={`order-status ${order.status}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="order-date">
                            {new Date(order.createdAt).toLocaleDateString('en-GB')}
                          </div>
                          <div className="order-items">
                            {order.items?.map(item => item.name).join(', ')}
                          </div>
                          <div className="order-footer">
                            <span className="order-total">
                              ৳{order.totalAmount?.toFixed(2)}
                            </span>
                            <button
                              className="btn-view-details"
                              onClick={() => navigate(`/order-tracking/${order.orderNumber}`)}
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {totalOrders > 3 && (
                    <button
                      className="btn-view-all"
                      onClick={() => navigate('/order-history')}
                    >
                      View All Orders
                    </button>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;


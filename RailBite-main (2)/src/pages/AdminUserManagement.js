import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { userAPI } from '../services/api';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'customer',
    status: 'active'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('railbite_token');
      const res = await userAPI.getAll(token);
      if (res.data.success) {
        setUsers(res.data.data || []);
      } else {
        setError(res.data.message || 'Failed to load users');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.phone?.includes(searchQuery);
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, filterRole]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('railbite_token');

      if (editingUser) {
        const res = await userAPI.update(editingUser._id, formData, token);
        if (res.data.success) {
          setUsers(prev =>
            prev.map(u => u._id === editingUser._id ? res.data.data : u)
          );
          setToast({ message: 'User updated successfully.', type: 'success' });
        }
      } else {
        const res = await userAPI.create(formData, token);
        if (res.data.success) {
          setUsers(prev => [res.data.data, ...prev]);
          setToast({ message: 'User created successfully. Default password: railbite123', type: 'success' });
        }
      }

      resetForm();
    } catch (err) {
      setToast({ message: err.response?.data?.message || err.message || 'Failed to save user', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status
    });
    setShowAddModal(true);
  };

  const handleDelete = (user) => {
    setConfirmModal({
      message: `Delete user "${user.name}"? This cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('railbite_token');
          const res = await userAPI.delete(user._id, token);
          if (res.data.success) {
            setUsers(prev => prev.filter(u => u._id !== user._id));
            setToast({ message: 'User deleted.', type: 'success' });
          }
        } catch (err) {
          setToast({ message: err.response?.data?.message || err.message || 'Failed to delete user', type: 'error' });
        }
      }
    });
  };

  const handleToggleStatus = async (user) => {
    try {
      const token = localStorage.getItem('railbite_token');
      const res = await userAPI.toggleStatus(user._id, token);
      if (res.data.success) {
        setUsers(prev =>
          prev.map(u => u._id === user._id ? res.data.data : u)
        );
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || err.message || 'Failed to toggle status', type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'customer',
      status: 'active'
    });
    setEditingUser(null);
    setShowAddModal(false);
  };

  // Stats
  const totalUsers = users.length;
  const customerCount = users.filter(u => u.role === 'customer').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const activeUsers = users.filter(u => u.status === 'active').length;

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-header">
            <h1>User Management</h1>
            <p>Loading users...</p>
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
            <h1>User Management</h1>
            <p style={{ color: 'red' }}>Error: {error}</p>
            <button className="admin-btn-primary" onClick={loadUsers}>
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
            <h1>User Management</h1>
            <p>Manage registered users and their roles</p>
          </div>
          <button
            className="admin-btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            + Add New User
          </button>
        </div>

        {/* Stats cards */}
        <div className="admin-stats-grid admin-stats-grid-small">
          <div className="admin-stat-card admin-stat-users">
            <div className="admin-stat-icon">👥</div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Total Users</p>
              <h3 className="admin-stat-value">{totalUsers}</h3>
              <span className="admin-stat-sub">All registered accounts</span>
            </div>
          </div>
          <div className="admin-stat-card admin-stat-customers">
            <div className="admin-stat-icon">🧑‍💻</div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Customers</p>
              <h3 className="admin-stat-value">{customerCount}</h3>
              <span className="admin-stat-sub">Customer profiles</span>
            </div>
          </div>
          <div className="admin-stat-card admin-stat-active">
            <div className="admin-stat-icon">✅</div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Active</p>
              <h3 className="admin-stat-value">{activeUsers}</h3>
              <span className="admin-stat-sub">Currently active</span>
            </div>
          </div>
          <div className="admin-stat-card admin-stat-admins">
            <div className="admin-stat-icon">👑</div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Admins</p>
              <h3 className="admin-stat-value">{adminCount}</h3>
              <span className="admin-stat-sub">Admin accounts</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="admin-card">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td><strong>{user.name}</strong></td>
                      <td>{user.email}</td>
                      <td>{user.phone || '-'}</td>
                      <td>
                        <span className={`admin-role-badge role-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`admin-toggle-btn ${user.status === 'active' ? 'active' : ''}`}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.status}
                        </button>
                      </td>
                      <td>
                        {new Date(user.createdAt).toLocaleDateString('en-BD', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td>
                        <div className="admin-action-buttons">
                          <button
                            className="admin-btn-edit"
                            onClick={() => handleEdit(user)}
                          >
                            Edit
                          </button>
                          <button
                            className="admin-btn-delete"
                            onClick={() => handleDelete(user)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add / Edit Modal */}
        {showAddModal && (
          <div className="admin-modal-overlay" onClick={resetForm}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
                <button className="admin-modal-close" onClick={resetForm}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="admin-form">
                <div className="admin-form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter full name"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="user@example.com"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="01712345678"
                  />
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Role *</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Status *</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                {!editingUser && (
                  <div className="admin-form-group">
                    <label>Password</label>
                    <input
                      type="text"
                      name="password"
                      onChange={handleInputChange}
                      placeholder="Leave blank for default: railbite123"
                    />
                  </div>
                )}

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn-primary"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving...'
                      : editingUser
                      ? 'Update User'
                      : 'Add User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          type={confirmModal.type}
          onConfirm={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};

export default AdminUserManagement;

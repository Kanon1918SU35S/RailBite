import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { deliveryStaffAPI } from '../services/api';

const AdminDeliveryManagement = () => {
  const [deliveryStaff, setDeliveryStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    status: 'available'
  });

  useEffect(() => {
    loadDeliveryStaff();
  }, []);

  const loadDeliveryStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('railbite_token');
      const res = await deliveryStaffAPI.getAll(token);
      if (res.data.success) {
        setDeliveryStaff(res.data.data || []);
      } else {
        setError(res.data.message || 'Failed to load delivery staff');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading staff');
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = useMemo(() => {
    return deliveryStaff.filter((staff) =>
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.phone.includes(searchQuery)
    );
  }, [deliveryStaff, searchQuery]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('railbite_token');
      if (editingStaff) {
        const res = await deliveryStaffAPI.update(editingStaff._id, formData, token);
        if (res.data.success) {
          setDeliveryStaff(prev =>
            prev.map(s => s._id === editingStaff._id ? res.data.data : s)
          );
          alert('Staff updated successfully.');
        }
      } else {
        const res = await deliveryStaffAPI.create(formData, token);
        if (res.data.success) {
          setDeliveryStaff(prev => [res.data.data, ...prev]);
          alert('Staff added successfully.');
        }
      }
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to save staff');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      phone: staff.phone,
      email: staff.email || '',
      password: '',
      status: staff.status
    });
    setShowAddModal(true);
  };

  const handleDelete = async (staff) => {
    if (!window.confirm(`Delete "${staff.name}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('railbite_token');
      const res = await deliveryStaffAPI.delete(staff._id, token);
      if (res.data.success) {
        setDeliveryStaff(prev => prev.filter(s => s._id !== staff._id));
        alert('Staff deleted.');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      password: '',
      status: 'available'
    });
    setEditingStaff(null);
    setShowAddModal(false);
  };

  const totalStaff = deliveryStaff.length;
  const availableCount = deliveryStaff.filter(s => s.status === 'available').length;
  const busyCount = deliveryStaff.filter(s => s.status === 'busy').length;
  const offlineCount = deliveryStaff.filter(s => s.status === 'offline').length;

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-header">
            <h1>Delivery Staff Management</h1>
            <p>Loading delivery staff...</p>
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
            <h1>Delivery Staff Management</h1>
            <p style={{ color: 'red' }}>Error: {error}</p>
            <button className="admin-btn-primary" onClick={loadDeliveryStaff}>
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
            <h1>Delivery Staff Management</h1>
            <p>Manage delivery personnel and assignments</p>
          </div>
          <button
            className="admin-btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            + Add Delivery Staff
          </button>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid admin-stats-grid-small">
          <div className="admin-stat-card admin-stat-staff-total">
            <div className="admin-stat-icon">🚚</div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Total Staff</p>
              <h3 className="admin-stat-value">{totalStaff}</h3>
              <span className="admin-stat-sub">All delivery personnel</span>
            </div>
          </div>

          <div className="admin-stat-card admin-stat-staff-available">
            <div className="admin-stat-icon">✅</div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Available</p>
              <h3 className="admin-stat-value">{availableCount}</h3>
              <span className="admin-stat-sub">Ready to take orders</span>
            </div>
          </div>

          <div className="admin-stat-card admin-stat-staff-busy">
            <div className="admin-stat-icon">📦</div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Busy</p>
              <h3 className="admin-stat-value">{busyCount}</h3>
              <span className="admin-stat-sub">Currently delivering</span>
            </div>
          </div>

          <div className="admin-stat-card admin-stat-staff-offline">
            <div className="admin-stat-icon">⏸</div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Offline</p>
              <h3 className="admin-stat-value">{offlineCount}</h3>
              <span className="admin-stat-sub">Not available</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <input
            type="text"
            placeholder="Search delivery staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>

        {/* Table */}
        <div className="admin-card">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Assigned Orders</th>
                  <th>Completed Today</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((staff) => (
                    <tr key={staff._id}>
                      <td><strong>{staff.name}</strong></td>
                      <td>{staff.phone}</td>
                      <td>
                        <span className={`admin-status-badge status-${staff.status}`}>
                          {staff.status}
                        </span>
                      </td>
                      <td>{staff.assignedOrders}</td>
                      <td>{staff.completedToday}</td>
                      <td>
                        <div className="admin-action-buttons">
                          <button
                            className="admin-btn-edit"
                            onClick={() => handleEdit(staff)}
                          >
                            Edit
                          </button>
                          <button
                            className="admin-btn-delete"
                            onClick={() => handleDelete(staff)}
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
                      No delivery staff found
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
                <h2>{editingStaff ? 'Edit Delivery Staff' : 'Add Delivery Staff'}</h2>
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
                  <label>Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="01712345678"
                  />
                </div>

                {!editingStaff && (
                  <>
                    <div className="admin-form-group">
                      <label>Email * (for login)</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="staff@railbite.com"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Password * (for login)</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        placeholder="Min 6 characters"
                        minLength={6}
                      />
                    </div>
                  </>
                )}

                <div className="admin-form-group">
                  <label>Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

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
                      : editingStaff
                        ? 'Update Staff'
                        : 'Add Staff'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDeliveryManagement;


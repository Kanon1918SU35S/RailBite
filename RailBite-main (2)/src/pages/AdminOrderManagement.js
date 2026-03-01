import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { orderAPI, deliveryStaffAPI } from '../services/api';

const AdminOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Assignment modal state
  const [assignModal, setAssignModal] = useState({ open: false, order: null });
  const [availableStaff, setAvailableStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);

  // Assignment stats
  const [assignStats, setAssignStats] = useState(null);

  const token = localStorage.getItem('railbite_token');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!token) { setError('Not authenticated'); setLoading(false); return; }

      const res = await orderAPI.getAll(token);
      if (res.data.success) {
        setOrders(res.data.data || []);
      } else {
        setError(res.data.message || 'Failed to load orders');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading orders');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    try {
      if (!token) return;
      const res = await orderAPI.getAssignmentStats(token);
      if (res.data.success) setAssignStats(res.data.data);
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  const handleStatusUpdate = async (order, newStatus) => {
    const statusLabels = {
      confirmed: 'confirm',
      preparing: 'mark as preparing',
      on_the_way: 'dispatch'
    };

    if (!window.confirm(`Are you sure you want to ${statusLabels[newStatus]} order #${order.orderNumber}?`)) return;

    try {
      const res = await orderAPI.updateStatus(order._id, { status: newStatus }, token);
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === order._id ? res.data.data : o));
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update order status');
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await orderAPI.updateStatus(order._id, { status: 'cancelled' }, token);
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === order._id ? res.data.data : o));
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to cancel');
    }
  };

  // ── Assignment modal ──
  const openAssignModal = async (order) => {
    setAssignModal({ open: true, order });
    setSelectedStaff('');
    setStaffLoading(true);
    try {
      const res = await deliveryStaffAPI.getAvailable(token);
      if (res.data.success) setAvailableStaff(res.data.data || []);
    } catch (err) {
      alert('Failed to load delivery staff');
    } finally {
      setStaffLoading(false);
    }
  };

  const closeAssignModal = () => {
    setAssignModal({ open: false, order: null });
    setSelectedStaff('');
    setAvailableStaff([]);
  };

  const handleAssignStaff = async () => {
    if (!selectedStaff || !assignModal.order) return;
    setAssigning(true);
    try {
      const res = await orderAPI.assignStaff(assignModal.order._id, selectedStaff, token);
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === assignModal.order._id ? res.data.data : o));
        closeAssignModal();
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to assign staff');
    } finally {
      setAssigning(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    if (filter === 'unassigned') return orders.filter(o => ['confirmed', 'preparing'].includes(o.status) && !o.assignedTo);
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);

  const getStatusConfig = (status) => {
    const map = {
      pending: { text: 'Pending', cls: 'status-pending' },
      confirmed: { text: 'Confirmed', cls: 'status-preparing' },
      preparing: { text: 'Preparing', cls: 'status-preparing' },
      on_the_way: { text: 'Dispatched', cls: 'status-sent' },
      delivered: { text: 'Completed', cls: 'status-delivered' },
      cancelled: { text: 'Cancelled', cls: 'status-cancelled' }
    };
    return map[status] || map.pending;
  };

  const unassignedCount = orders.filter(o => ['confirmed', 'preparing'].includes(o.status) && !o.assignedTo).length;

  if (loading) {
    return (
      <div className="admin-dashboard">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-header">
            <h1>📦 Order Management</h1>
            <p>Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-header">
            <h1>📦 Order Management</h1>
            <p style={{ color: 'red' }}>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h1>📦 Order Management</h1>
          <p>Manage orders and assign delivery staff</p>
        </div>

        {/* Delivery Stats Bar */}
        {assignStats && (
          <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.8rem' }}>
            <div className="admin-stat-card" style={{ borderLeftColor: '#4caf50' }}>
              <div className="admin-stat-icon" style={{ background: 'rgba(76,175,80,0.18)', color: '#4caf50' }}>🟢</div>
              <div className="admin-stat-content">
                <p className="admin-stat-label">Available Riders</p>
                <h3 className="admin-stat-value">{assignStats.availableRiders}</h3>
              </div>
            </div>
            <div className="admin-stat-card" style={{ borderLeftColor: '#ff9800' }}>
              <div className="admin-stat-icon" style={{ background: 'rgba(255,152,0,0.18)', color: '#ff9800' }}>🔴</div>
              <div className="admin-stat-content">
                <p className="admin-stat-label">Busy Riders</p>
                <h3 className="admin-stat-value">{assignStats.busyRiders}</h3>
              </div>
            </div>
            <div className="admin-stat-card" style={{ borderLeftColor: '#bb86fc' }}>
              <div className="admin-stat-icon" style={{ background: 'rgba(187,134,252,0.18)', color: '#bb86fc' }}>🚚</div>
              <div className="admin-stat-content">
                <p className="admin-stat-label">In Transit</p>
                <h3 className="admin-stat-value">{assignStats.ordersInTransit}</h3>
              </div>
            </div>
            <div className="admin-stat-card" style={{ borderLeftColor: '#f44336' }}>
              <div className="admin-stat-icon" style={{ background: 'rgba(244,67,54,0.18)', color: '#f44336' }}>⏳</div>
              <div className="admin-stat-content">
                <p className="admin-stat-label">Unassigned</p>
                <h3 className="admin-stat-value">{assignStats.unassignedOrders}</h3>
              </div>
            </div>
            <div className="admin-stat-card" style={{ borderLeftColor: '#4ecdc4' }}>
              <div className="admin-stat-icon" style={{ background: 'rgba(78,205,196,0.18)', color: '#4ecdc4' }}>✅</div>
              <div className="admin-stat-content">
                <p className="admin-stat-label">Delivered Today</p>
                <h3 className="admin-stat-value">{assignStats.deliveredToday}</h3>
              </div>
            </div>
            <div className="admin-stat-card" style={{ borderLeftColor: '#ffe66d' }}>
              <div className="admin-stat-icon" style={{ background: 'rgba(255,230,109,0.18)', color: '#ffe66d' }}>👥</div>
              <div className="admin-stat-content">
                <p className="admin-stat-label">Total Active Riders</p>
                <h3 className="admin-stat-value">{assignStats.totalActiveRiders}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="admin-filters">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All ({orders.length})
          </button>
          <button className={`filter-btn ${filter === 'unassigned' ? 'active' : ''}`} onClick={() => setFilter('unassigned')}
            style={unassignedCount > 0 ? { animation: 'pulse 2s infinite' } : {}}>
            🔔 Unassigned ({unassignedCount})
          </button>
          <button className={`filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
            Pending ({orders.filter(o => o.status === 'pending').length})
          </button>
          <button className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`} onClick={() => setFilter('confirmed')}>
            Confirmed ({orders.filter(o => o.status === 'confirmed').length})
          </button>
          <button className={`filter-btn ${filter === 'preparing' ? 'active' : ''}`} onClick={() => setFilter('preparing')}>
            Preparing ({orders.filter(o => o.status === 'preparing').length})
          </button>
          <button className={`filter-btn ${filter === 'on_the_way' ? 'active' : ''}`} onClick={() => setFilter('on_the_way')}>
            Dispatched ({orders.filter(o => o.status === 'on_the_way').length})
          </button>
          <button className={`filter-btn ${filter === 'delivered' ? 'active' : ''}`} onClick={() => setFilter('delivered')}>
            Completed ({orders.filter(o => o.status === 'delivered').length})
          </button>
          <button className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`} onClick={() => setFilter('cancelled')}>
            Cancelled ({orders.filter(o => o.status === 'cancelled').length})
          </button>
        </div>

        {/* Orders Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Station / Train</th>
                <th>Total</th>
                <th>Date</th>
                <th>Status</th>
                <th>Assigned Staff</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const sc = getStatusConfig(order.status);
                  const isAssignable = ['confirmed', 'preparing'].includes(order.status);
                  const hasStaff = !!order.assignedTo;
                  return (
                    <tr key={order._id}>
                      <td>#{order.orderNumber || String(order._id).slice(-6)}</td>
                      <td>
                        <div>{order.user?.name || 'Customer'}</div>
                        <small style={{ color: 'var(--text-gray)' }}>{order.user?.email || ''}</small>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {order.bookingDetails?.pickupStation || '—'}
                        </div>
                        {order.bookingDetails?.trainNumber && (
                          <small style={{ color: 'var(--text-gray)' }}>
                            Train: {order.bookingDetails.trainNumber}
                            {order.bookingDetails.coachNumber ? ` / Coach: ${order.bookingDetails.coachNumber}` : ''}
                          </small>
                        )}
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--primary-orange)' }}>
                        ৳{order.totalAmount?.toFixed(2)}
                      </td>
                      <td>
                        {new Date(order.createdAt).toLocaleDateString('en-BD', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <span className={`badge ${sc.cls}`}>{sc.text}</span>
                      </td>
                      <td>
                        {hasStaff ? (
                          <div>
                            <div style={{ color: 'var(--text-white)', fontWeight: 500, fontSize: '0.9rem' }}>
                              {order.assignedTo?.name || 'Assigned'}
                            </div>
                            <small style={{ color: 'var(--text-gray)' }}>
                              {order.assignedTo?.email || ''}
                            </small>
                            {isAssignable && (
                              <div style={{ marginTop: '0.3rem' }}>
                                <button
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                                  onClick={() => openAssignModal(order)}
                                >
                                  🔄 Reassign
                                </button>
                              </div>
                            )}
                          </div>
                        ) : isAssignable ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => openAssignModal(order)}
                            style={{ background: '#4caf50', borderColor: '#4caf50' }}
                          >
                            👤 Assign Staff
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {order.status === 'pending' && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(order, 'confirmed')}>
                              ✅ Confirm
                            </button>
                          )}
                          {order.status === 'confirmed' && hasStaff && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(order, 'preparing')}>
                              👨‍🍳 Preparing
                            </button>
                          )}
                          {order.status === 'confirmed' && !hasStaff && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', fontStyle: 'italic' }}>
                              Assign staff first
                            </span>
                          )}
                          {order.status === 'preparing' && hasStaff && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(order, 'on_the_way')}>
                              🚚 Dispatch
                            </button>
                          )}
                          {order.status === 'on_the_way' && (
                            <span style={{ fontSize: '0.8rem', color: '#4ecdc4', fontStyle: 'italic' }}>
                              ⏳ Waiting for delivery confirmation
                            </span>
                          )}
                          {order.status === 'delivered' && (
                            <span style={{ fontSize: '0.85rem', color: '#4caf50', fontWeight: 600 }}>
                              ✅ Completed
                            </span>
                          )}
                          {!['cancelled', 'delivered'].includes(order.status) && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleCancelOrder(order)}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Assignment Modal ── */}
        {assignModal.open && (
          <div style={modalOverlayStyle} onClick={closeAssignModal}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
              <div style={modalHeaderStyle}>
                <h2 style={{ color: 'var(--text-white)', fontSize: '1.3rem', margin: 0 }}>
                  Assign Delivery Staff
                </h2>
                <button onClick={closeAssignModal} style={modalCloseBtnStyle}>&times;</button>
              </div>

              {/* Order Summary */}
              <div style={orderSummaryStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--primary-orange)', fontWeight: 600 }}>
                    #{assignModal.order?.orderNumber}
                  </span>
                  <span className={`badge ${getStatusConfig(assignModal.order?.status).cls}`}>
                    {getStatusConfig(assignModal.order?.status).text}
                  </span>
                </div>
                <div style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>
                  <div>Customer: {assignModal.order?.user?.name || 'N/A'}</div>
                  <div>Station: {assignModal.order?.bookingDetails?.pickupStation || 'N/A'}</div>
                  <div>Train: {assignModal.order?.bookingDetails?.trainNumber || 'N/A'}</div>
                  <div>Amount: ৳{assignModal.order?.totalAmount?.toFixed(2)}</div>
                  <div>Items: {assignModal.order?.items?.length || 0}</div>
                </div>
              </div>

              {/* Staff Selection */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ color: 'var(--text-gray)', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>
                  Select Delivery Staff
                </label>
                {staffLoading ? (
                  <p style={{ color: 'var(--text-gray)' }}>Loading staff...</p>
                ) : availableStaff.length === 0 ? (
                  <p style={{ color: '#f44336' }}>No delivery staff available. Create staff from Delivery Management page.</p>
                ) : (
                  <>
                    <select
                      value={selectedStaff}
                      onChange={e => setSelectedStaff(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="">-- Choose a delivery partner --</option>
                      {availableStaff.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.name} — {s.status === 'available' ? '🟢 Available' : '🔴 Busy'}
                          {' '}({s.assignedOrders || 0} active, {s.totalDeliveries || 0} total)
                          {s.rating ? ` ⭐ ${s.rating.toFixed(1)}` : ''}
                        </option>
                      ))}
                    </select>

                    {/* Staff cards for quick overview */}
                    <div style={{ marginTop: '0.8rem', maxHeight: '220px', overflowY: 'auto' }}>
                      {availableStaff.map(s => (
                        <div
                          key={s._id}
                          onClick={() => setSelectedStaff(s._id)}
                          style={{
                            ...staffCardStyle,
                            borderColor: selectedStaff === s._id ? 'var(--primary-orange)' : 'var(--border-dark)',
                            background: selectedStaff === s._id ? 'rgba(232,126,30,0.1)' : 'var(--dark-card)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ color: 'var(--text-white)', fontWeight: 600 }}>{s.name}</div>
                              <div style={{ color: 'var(--text-gray)', fontSize: '0.8rem' }}>{s.phone} &middot; {s.email}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: s.status === 'available' ? 'rgba(76,175,80,0.2)' : 'rgba(255,152,0,0.2)',
                                color: s.status === 'available' ? '#4caf50' : '#ff9800',
                                border: `1px solid ${s.status === 'available' ? '#4caf50' : '#ff9800'}`
                              }}>
                                {s.status === 'available' ? '🟢 Available' : '🔴 Busy'}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-gray)' }}>
                            <span>📦 {s.assignedOrders || 0} active</span>
                            <span>✅ {s.completedToday || 0} today</span>
                            <span>🏆 {s.totalDeliveries || 0} total</span>
                            <span>⭐ {(s.rating || 5.0).toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button onClick={closeAssignModal} style={cancelBtnStyle}>Cancel</button>
                <button
                  onClick={handleAssignStaff}
                  disabled={!selectedStaff || assigning}
                  style={{
                    ...assignBtnStyle,
                    opacity: (!selectedStaff || assigning) ? 0.5 : 1,
                    cursor: (!selectedStaff || assigning) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {assigning ? 'Assigning...' : '🚀 Assign & Notify'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Inline styles for the modal ──
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.7)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(4px)'
};

const modalStyle = {
  background: 'var(--dark-bg, #1a1a2e)',
  borderRadius: '20px',
  border: '1px solid var(--border-dark, #2d2d44)',
  padding: '2rem',
  width: '100%', maxWidth: '560px',
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
};

const modalHeaderStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: '1.5rem', paddingBottom: '1rem',
  borderBottom: '1px solid var(--border-dark, #2d2d44)'
};

const modalCloseBtnStyle = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '8px', color: 'var(--text-gray)',
  fontSize: '1.8rem', cursor: 'pointer', lineHeight: 1,
  backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)'
};

const orderSummaryStyle = {
  background: 'rgba(232,126,30,0.08)',
  border: '1px solid rgba(232,126,30,0.2)',
  borderRadius: '12px', padding: '1rem',
  marginBottom: '1.2rem'
};

const selectStyle = {
  width: '100%', padding: '0.7rem 1rem',
  borderRadius: '10px',
  border: '1px solid var(--border-dark, #2d2d44)',
  background: 'var(--dark-card, #16213e)',
  color: 'var(--text-white, #fff)',
  fontSize: '0.9rem', cursor: 'pointer'
};

const staffCardStyle = {
  padding: '0.8rem', borderRadius: '10px',
  border: '1px solid var(--border-dark, #2d2d44)',
  marginBottom: '0.5rem', cursor: 'pointer',
  transition: 'border-color 0.2s, background 0.2s'
};

const cancelBtnStyle = {
  padding: '0.6rem 1.2rem', borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)', color: 'var(--text-gray, #aaa)',
  fontSize: '0.9rem', cursor: 'pointer',
  backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)'
};

const assignBtnStyle = {
  padding: '0.6rem 1.4rem', borderRadius: '10px',
  border: '1px solid rgba(255,180,100,0.25)',
  background: 'rgba(232,126,30,0.85)',
  color: '#fff', fontSize: '0.9rem', fontWeight: 600,
  boxShadow: '0 4px 16px rgba(232,126,30,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
  backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
  transition: 'opacity 0.2s'
};

export default AdminOrderManagement;

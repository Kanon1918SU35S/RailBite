import React, { useState, useEffect, useMemo } from 'react';
import DeliveryStaffSidebar from '../components/DeliveryStaffSidebar';
import { useDeliveryStaff } from '../context/DeliveryStaffContext';
import { deliveryPortalAPI } from '../services/api';

const DeliveryStaffHistory = () => {
    const { getToken } = useDeliveryStaff();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateFilter, setDateFilter] = useState('today');

    useEffect(() => {
        fetchHistory();
    }, [dateFilter]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = getToken();
            const res = await deliveryPortalAPI.getMyHistory(token, dateFilter);
            if (res.data.success) {
                setOrders(res.data.data || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error loading history');
        } finally {
            setLoading(false);
        }
    };

    const summarize = useMemo(() => {
        const delivered = orders.filter(o => o.status === 'delivered');
        const totalEarn = delivered.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
        return {
            total: orders.length,
            delivered: delivered.length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
            earnings: totalEarn
        };
    }, [orders]);

    const getStatusClass = (status) => {
        const statusMap = {
            delivered: 'status-delivered',
            cancelled: 'status-cancelled'
        };
        return statusMap[status] || 'status-default';
    };

    const dateFilterTabs = [
        { key: 'today', label: 'Today' },
        { key: 'week', label: 'This Week' },
        { key: 'month', label: 'This Month' },
        { key: 'all', label: 'All Time' }
    ];

    if (loading) {
        return (
            <div className="admin-layout ds-layout">
                <DeliveryStaffSidebar />
                <div className="admin-content">
                    <div className="admin-header">
                        <h1>Delivery History</h1>
                        <p>Loading history...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout ds-layout">
            <DeliveryStaffSidebar />
            <div className="admin-content">
                <div className="admin-header">
                    <div>
                        <h1>Delivery History</h1>
                        <p>Review your past deliveries and performance</p>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="admin-stats-grid admin-stats-grid-small">
                    <div className="admin-stat-card" style={{ borderLeftColor: '#4ECDC4' }}>
                        <div className="admin-stat-icon" style={{ backgroundColor: '#4ECDC420', color: '#4ECDC4' }}>📦</div>
                        <div className="admin-stat-content">
                            <p className="admin-stat-label">Total Orders</p>
                            <h3 className="admin-stat-value">{summarize.total}</h3>
                        </div>
                    </div>
                    <div className="admin-stat-card" style={{ borderLeftColor: '#95E1D3' }}>
                        <div className="admin-stat-icon" style={{ backgroundColor: '#95E1D320', color: '#95E1D3' }}>✅</div>
                        <div className="admin-stat-content">
                            <p className="admin-stat-label">Delivered</p>
                            <h3 className="admin-stat-value">{summarize.delivered}</h3>
                        </div>
                    </div>
                    <div className="admin-stat-card" style={{ borderLeftColor: '#f44336' }}>
                        <div className="admin-stat-icon" style={{ backgroundColor: '#f4433620', color: '#f44336' }}>❌</div>
                        <div className="admin-stat-content">
                            <p className="admin-stat-label">Cancelled</p>
                            <h3 className="admin-stat-value">{summarize.cancelled}</h3>
                        </div>
                    </div>
                    <div className="admin-stat-card" style={{ borderLeftColor: '#FF6B35' }}>
                        <div className="admin-stat-icon" style={{ backgroundColor: '#FF6B3520', color: '#FF6B35' }}>💰</div>
                        <div className="admin-stat-content">
                            <p className="admin-stat-label">Earnings</p>
                            <h3 className="admin-stat-value">৳{summarize.earnings.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>

                {/* Date Filters */}
                <div className="ds-filters-bar">
                    <div className="ds-filter-tabs">
                        {dateFilterTabs.map(tab => (
                            <button
                                key={tab.key}
                                className={`ds-filter-tab ${dateFilter === tab.key ? 'active' : ''}`}
                                onClick={() => setDateFilter(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="ds-error-banner">
                        <p>{error}</p>
                        <button className="admin-btn-link" onClick={fetchHistory}>Retry</button>
                    </div>
                )}

                {/* History Table */}
                <div className="admin-card">
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Address</th>
                                    <th>Items</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length > 0 ? (
                                    orders.map(order => (
                                        <tr key={order._id}>
                                            <td>#{order.orderNumber || String(order._id).slice(-6)}</td>
                                            <td>{order.customerName || order.user?.name || 'Customer'}</td>
                                            <td>{order.deliveryAddress || 'N/A'}</td>
                                            <td>{order.items?.length || 0} items</td>
                                            <td>৳{order.totalAmount?.toFixed(2)}</td>
                                            <td>
                                                <span className={`admin-status-badge ${getStatusClass(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                {new Date(order.createdAt).toLocaleDateString('en-BD', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                                            No delivery history found for this period
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

export default DeliveryStaffHistory;

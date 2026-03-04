import React, { useState, useEffect, useMemo } from 'react';
import DeliveryStaffSidebar from '../components/DeliveryStaffSidebar';
import { useDeliveryStaff } from '../context/DeliveryStaffContext';
import { deliveryPortalAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';

const DeliveryStaffOrders = () => {
    const { getToken } = useDeliveryStaff();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = getToken();
            const res = await deliveryPortalAPI.getMyOrders(token);
            if (res.data.success) {
                setOrders(res.data.data || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error loading orders');
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = useMemo(() => {
        let result = orders;

        if (filter !== 'all') {
            result = result.filter(order => order.status === filter);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(order =>
                (order.orderNumber || '').toLowerCase().includes(q) ||
                (order.customerName || order.user?.name || '').toLowerCase().includes(q) ||
                (order.deliveryAddress || '').toLowerCase().includes(q)
            );
        }

        return result;
    }, [orders, filter, searchQuery]);

    const getStatusClass = (status) => {
        const statusMap = {
            pending: 'status-placed',
            confirmed: 'status-preparing',
            preparing: 'status-preparing',
            on_the_way: 'status-ontheway',
            delivered: 'status-delivered',
            cancelled: 'status-cancelled'
        };
        return statusMap[status] || 'status-default';
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const token = getToken();
            const res = await deliveryPortalAPI.updateDeliveryStatus(orderId, { status: newStatus }, token);
            if (res.data.success) {
                fetchOrders();
            }
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Failed to update status', type: 'error' });
        }
    };

    const filterTabs = [
        { key: 'all', label: 'All Orders', icon: '📋' },
        { key: 'confirmed', label: 'Confirmed', icon: '📋' },
        { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
        { key: 'on_the_way', label: 'Dispatched', icon: '🚚' },
        { key: 'delivered', label: 'Delivered', icon: '🎉' },
        { key: 'cancelled', label: 'Cancelled', icon: '❌' }
    ];

    if (loading) {
        return (
            <div className="admin-layout ds-layout">
                <DeliveryStaffSidebar />
                <div className="admin-content">
                    <div className="admin-header">
                        <h1>My Deliveries</h1>
                        <p>Loading orders...</p>
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
                        <h1>My Deliveries</h1>
                        <p>Manage and track all your assigned orders</p>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="ds-filters-bar">
                    <input
                        type="text"
                        className="admin-search-input"
                        placeholder="Search orders by ID, customer, address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="ds-filter-tabs">
                        {filterTabs.map(tab => (
                            <button
                                key={tab.key}
                                className={`ds-filter-tab ${filter === tab.key ? 'active' : ''}`}
                                onClick={() => setFilter(tab.key)}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="ds-error-banner">
                        <p>{error}</p>
                        <button className="admin-btn-link" onClick={fetchOrders}>Retry</button>
                    </div>
                )}

                {/* Orders Grid */}
                {filteredOrders.length > 0 ? (
                    <div className="ds-orders-grid">
                        {filteredOrders.map((order) => (
                            <div key={order._id} className="ds-order-card">
                                <div className="ds-order-card-header">
                                    <span className="ds-order-id">#{order.orderNumber || String(order._id).slice(-6)}</span>
                                    <span className={`admin-status-badge ${getStatusClass(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="ds-order-details">
                                    <div className="ds-order-detail-row">
                                        <span className="ds-detail-icon">👤</span>
                                        <span>{order.customerName || order.user?.name || 'Customer'}</span>
                                    </div>
                                    <div className="ds-order-detail-row">
                                        <span className="ds-detail-icon">📍</span>
                                        <span>{order.deliveryAddress || 'Address not provided'}</span>
                                    </div>
                                    <div className="ds-order-detail-row">
                                        <span className="ds-detail-icon">📞</span>
                                        <span>{order.customerPhone || order.user?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="ds-order-detail-row">
                                        <span className="ds-detail-icon">🍽️</span>
                                        <span>{order.items?.length || 0} items &middot; ৳{order.totalAmount?.toFixed(2)}</span>
                                    </div>
                                    <div className="ds-order-detail-row">
                                        <span className="ds-detail-icon">🕐</span>
                                        <span>{new Date(order.createdAt).toLocaleString('en-BD')}</span>
                                    </div>
                                </div>

                                <div className="ds-order-actions">
                                    {(order.status === 'confirmed' || order.status === 'preparing') && (
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', fontStyle: 'italic' }}>
                                            ⏳ Waiting for dispatch
                                        </span>
                                    )}
                                    {order.status === 'on_the_way' && (
                                        <button
                                            className="ds-btn ds-btn-deliver"
                                            onClick={() => handleUpdateStatus(order._id, 'delivered')}
                                        >
                                            ✅ Confirm Delivery
                                        </button>
                                    )}
                                    <button
                                        className="ds-btn ds-btn-details"
                                        onClick={() => navigate(`/delivery/order/${order._id}`)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="ds-empty-state">
                        <div className="ds-empty-icon">📭</div>
                        <h3>No Orders Found</h3>
                        <p>
                            {filter !== 'all'
                                ? `No orders with status "${filter}" found.`
                                : 'You don\'t have any assigned orders yet.'}
                        </p>
                    </div>
                )}
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default DeliveryStaffOrders;

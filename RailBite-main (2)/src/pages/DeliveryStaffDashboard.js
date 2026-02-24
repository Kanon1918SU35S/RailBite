import React, { useState, useEffect, useMemo } from 'react';
import DeliveryStaffSidebar from '../components/DeliveryStaffSidebar';
import { useDeliveryStaff } from '../context/DeliveryStaffContext';
import { deliveryPortalAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const DeliveryStaffDashboard = () => {
    const { staffUser, getToken } = useDeliveryStaff();
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
        // Poll for new orders every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setError(null);
            const token = getToken();
            if (!token) {
                setError('Not authenticated');
                setLoading(false);
                return;
            }

            const [statsRes, ordersRes] = await Promise.all([
                deliveryPortalAPI.getMyStats(token),
                deliveryPortalAPI.getMyActiveOrders(token)
            ]);

            if (statsRes.data.success) {
                setStats(statsRes.data.data);
            }
            if (ordersRes.data.success) {
                setActiveOrders(ordersRes.data.data || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error loading dashboard');
        } finally {
            setLoading(false);
        }
    };

    const statsData = useMemo(() => {
        const s = stats || {
            todayDeliveries: 0,
            activeOrders: 0,
            completedToday: 0,
            totalEarnings: 0,
            rating: 0,
            onTimeRate: 0
        };

        return [
            {
                label: "Today's Deliveries",
                value: s.todayDeliveries,
                icon: '🚚',
                color: '#4ECDC4',
                sub: 'Assigned today'
            },
            {
                label: 'Active Orders',
                value: s.activeOrders,
                icon: '📦',
                color: '#FFE66D',
                sub: 'In progress'
            },
            {
                label: 'Completed Today',
                value: s.completedToday,
                icon: '✅',
                color: '#95E1D3',
                sub: 'Successfully delivered'
            },
            {
                label: "Today's Earnings",
                value: `৳${(s.totalEarnings || 0).toFixed(2)}`,
                icon: '💰',
                color: '#FF6B35',
                sub: 'Delivery earnings'
            },
            {
                label: 'My Rating',
                value: `${(s.rating || 0).toFixed(1)} ⭐`,
                icon: '🌟',
                color: '#E9C46A',
                sub: 'Customer feedback'
            },
            {
                label: 'On-Time Rate',
                value: `${s.onTimeRate || 0}%`,
                icon: '⏱️',
                color: '#A8DADC',
                sub: 'Punctuality score'
            }
        ];
    }, [stats]);

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
                fetchDashboardData();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    if (loading) {
        return (
            <div className="admin-layout ds-layout">
                <DeliveryStaffSidebar />
                <div className="admin-content">
                    <div className="admin-header">
                        <h1>Delivery Dashboard</h1>
                        <p>Loading your dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-layout ds-layout">
                <DeliveryStaffSidebar />
                <div className="admin-content">
                    <div className="admin-header">
                        <h1>Delivery Dashboard</h1>
                        <p style={{ color: 'red' }}>Error: {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout ds-layout">
            <DeliveryStaffSidebar />
            <div className="admin-content">
                {/* Header */}
                <div className="admin-header ds-header">
                    <div>
                        <h1>Welcome back, {staffUser?.name || 'Delivery Partner'} 👋</h1>
                        <p>Here's your delivery overview for today</p>
                    </div>
                    <div className="ds-status-toggle">
                        <span className="ds-status-dot ds-status-online"></span>
                        <span className="ds-status-text">Online</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="admin-stats-grid">
                    {statsData.map((stat, index) => (
                        <div
                            key={index}
                            className="admin-stat-card"
                            style={{ borderLeftColor: stat.color }}
                        >
                            <div
                                className="admin-stat-icon"
                                style={{ backgroundColor: stat.color + '20', color: stat.color }}
                            >
                                {stat.icon}
                            </div>
                            <div className="admin-stat-content">
                                <p className="admin-stat-label">{stat.label}</p>
                                <h3 className="admin-stat-value">{stat.value}</h3>
                                <span className="admin-stat-sub">{stat.sub}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Active Deliveries */}
                <div className="ds-section">
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h2>🚚 Active Deliveries</h2>
                            <button className="admin-btn-link" onClick={() => navigate('/delivery/my-orders')}>
                                View All
                            </button>
                        </div>

                        {activeOrders.length > 0 ? (
                            <div className="ds-orders-grid">
                                {activeOrders.map((order) => (
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
                                        </div>

                                        <div className="ds-order-actions">
                                            {order.status === 'confirmed' || order.status === 'preparing' ? (
                                                <button
                                                    className="ds-btn ds-btn-pickup"
                                                    onClick={() => handleUpdateStatus(order._id, 'picked_up')}
                                                >
                                                    🏃 Pick Up
                                                </button>
                                            ) : null}
                                            {order.status === 'on_the_way' ? (
                                                <button
                                                    className="ds-btn ds-btn-deliver"
                                                    onClick={() => handleUpdateStatus(order._id, 'delivered')}
                                                >
                                                    ✅ Mark Delivered
                                                </button>
                                            ) : null}
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
                                <h3>No Active Deliveries</h3>
                                <p>You don't have any active deliveries right now. New orders will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryStaffDashboard;

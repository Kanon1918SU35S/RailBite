import React, { useState, useEffect } from 'react';
import DeliveryStaffSidebar from '../components/DeliveryStaffSidebar';
import { useDeliveryStaff } from '../context/DeliveryStaffContext';
import { deliveryPortalAPI } from '../services/api';

const DeliveryStaffActive = () => {
    const { getToken } = useDeliveryStaff();

    const [activeOrder, setActiveOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchActiveDelivery();
        const interval = setInterval(fetchActiveDelivery, 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchActiveDelivery = async () => {
        try {
            setError(null);
            const token = getToken();
            const res = await deliveryPortalAPI.getActiveDelivery(token);
            if (res.data.success) {
                setActiveOrder(res.data.data || null);
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                setError(err.response?.data?.message || err.message || 'Error loading active delivery');
            } else {
                setActiveOrder(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!activeOrder) return;
        try {
            const token = getToken();
            const res = await deliveryPortalAPI.updateDeliveryStatus(activeOrder._id, { status: newStatus }, token);
            if (res.data.success) {
                fetchActiveDelivery();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    const statusTimeline = [
        { id: 'confirmed', label: 'Order Confirmed', icon: '📋' },
        { id: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
        { id: 'on_the_way', label: 'On The Way', icon: '🚚' },
        { id: 'delivered', label: 'Delivered', icon: '🎉' }
    ];

    const getCurrentStepIndex = (status) => {
        const idx = statusTimeline.findIndex(s => s.id === status);
        return idx >= 0 ? idx : 0;
    };

    if (loading) {
        return (
            <div className="admin-layout ds-layout">
                <DeliveryStaffSidebar />
                <div className="admin-content">
                    <div className="admin-header">
                        <h1>Active Delivery</h1>
                        <p>Loading...</p>
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
                        <h1>Active Delivery</h1>
                        <p>Track and manage your current delivery in real-time</p>
                    </div>
                </div>

                {error && (
                    <div className="ds-error-banner">
                        <p>{error}</p>
                        <button className="admin-btn-link" onClick={fetchActiveDelivery}>Retry</button>
                    </div>
                )}

                {activeOrder ? (
                    <div className="ds-active-delivery">
                        {/* Order Summary Card */}
                        <div className="admin-card ds-active-card">
                            <div className="ds-active-header">
                                <div>
                                    <h2>Order #{activeOrder.orderNumber || String(activeOrder._id).slice(-6)}</h2>
                                    <p className="ds-active-time">
                                        Placed at {new Date(activeOrder.createdAt).toLocaleTimeString('en-BD', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <span className={`admin-status-badge status-${activeOrder.status?.replace(/\s+/g, '')}`}>
                                    {activeOrder.status}
                                </span>
                            </div>

                            {/* Status Timeline */}
                            <div className="ds-timeline">
                                {statusTimeline.map((step, index) => {
                                    const currentIdx = getCurrentStepIndex(activeOrder.status);
                                    const isCompleted = index <= currentIdx;
                                    const isCurrent = index === currentIdx;

                                    return (
                                        <div
                                            key={step.id}
                                            className={`ds-timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                                        >
                                            <div className="ds-timeline-icon">{step.icon}</div>
                                            <div className="ds-timeline-label">{step.label}</div>
                                            {index < statusTimeline.length - 1 && (
                                                <div className={`ds-timeline-line ${isCompleted ? 'completed' : ''}`}></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Delivery Details */}
                        <div className="ds-active-grid">
                            <div className="admin-card">
                                <h3 className="ds-card-title">📍 Delivery Details</h3>
                                <div className="ds-info-list">
                                    <div className="ds-info-row">
                                        <span className="ds-info-label">Customer</span>
                                        <span className="ds-info-value">{activeOrder.customerName || activeOrder.user?.name || 'Customer'}</span>
                                    </div>
                                    <div className="ds-info-row">
                                        <span className="ds-info-label">Phone</span>
                                        <span className="ds-info-value">{activeOrder.customerPhone || activeOrder.user?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="ds-info-row">
                                        <span className="ds-info-label">Address</span>
                                        <span className="ds-info-value">{activeOrder.deliveryAddress || 'Not specified'}</span>
                                    </div>
                                    <div className="ds-info-row">
                                        <span className="ds-info-label">Train / Coach</span>
                                        <span className="ds-info-value">{activeOrder.trainNumber || 'N/A'} / {activeOrder.coachNumber || 'N/A'}</span>
                                    </div>
                                    <div className="ds-info-row">
                                        <span className="ds-info-label">Seat</span>
                                        <span className="ds-info-value">{activeOrder.seatNumber || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="admin-card">
                                <h3 className="ds-card-title">🍽️ Order Items</h3>
                                <div className="ds-items-list">
                                    {(activeOrder.items || []).map((item, index) => (
                                        <div key={index} className="ds-item-row">
                                            <div className="ds-item-info">
                                                <span className="ds-item-name">{item.name}</span>
                                                <span className="ds-item-qty">x{item.quantity}</span>
                                            </div>
                                            <span className="ds-item-price">৳{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="ds-item-total">
                                        <span>Total</span>
                                        <span>৳{activeOrder.totalAmount?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="ds-action-bar">
                            {(activeOrder.status === 'confirmed' || activeOrder.status === 'preparing') && (
                                <button
                                    className="ds-btn ds-btn-pickup ds-btn-lg"
                                    onClick={() => handleUpdateStatus('picked_up')}
                                >
                                    🏃 Pick Up Order
                                </button>
                            )}
                            {activeOrder.status === 'on_the_way' && (
                                <button
                                    className="ds-btn ds-btn-deliver ds-btn-lg"
                                    onClick={() => handleUpdateStatus('delivered')}
                                >
                                    ✅ Mark Delivered
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="ds-empty-state ds-empty-large">
                        <div className="ds-empty-icon">🛵</div>
                        <h3>No Active Delivery</h3>
                        <p>You don't have an active delivery right now. Check "My Deliveries" for new assignments.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryStaffActive;

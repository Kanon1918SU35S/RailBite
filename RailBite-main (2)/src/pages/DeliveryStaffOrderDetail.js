import React, { useState, useEffect } from 'react';
import DeliveryStaffSidebar from '../components/DeliveryStaffSidebar';
import { useDeliveryStaff } from '../context/DeliveryStaffContext';
import { deliveryPortalAPI } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';

const DeliveryStaffOrderDetail = () => {
    const { orderId } = useParams();
    const { getToken } = useDeliveryStaff();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = getToken();
            const res = await deliveryPortalAPI.getOrderDetail(orderId, token);
            if (res.data.success) {
                setOrder(res.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error loading order');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        try {
            const token = getToken();
            const res = await deliveryPortalAPI.updateDeliveryStatus(orderId, { status: newStatus }, token);
            if (res.data.success) {
                fetchOrder();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

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

    if (loading) {
        return (
            <div className="admin-layout ds-layout">
                <DeliveryStaffSidebar />
                <div className="admin-content">
                    <div className="admin-header">
                        <h1>Order Details</h1>
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="admin-layout ds-layout">
                <DeliveryStaffSidebar />
                <div className="admin-content">
                    <div className="admin-header">
                        <h1>Order Details</h1>
                        <p style={{ color: 'red' }}>{error || 'Order not found'}</p>
                    </div>
                    <button className="admin-btn-primary" onClick={() => navigate('/delivery/my-orders')}>
                        ← Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout ds-layout">
            <DeliveryStaffSidebar />
            <div className="admin-content">
                <div className="admin-header ds-header">
                    <div>
                        <button className="ds-back-btn" onClick={() => navigate(-1)}>← Back</button>
                        <h1>Order #{order.orderNumber || String(order._id).slice(-6)}</h1>
                        <p>Order placed on {new Date(order.createdAt).toLocaleString('en-BD')}</p>
                    </div>
                    <span className={`admin-status-badge ${getStatusClass(order.status)}`}>
                        {order.status}
                    </span>
                </div>

                <div className="ds-detail-grid">
                    {/* Customer Info */}
                    <div className="admin-card">
                        <h3 className="ds-card-title">👤 Customer Information</h3>
                        <div className="ds-info-list">
                            <div className="ds-info-row">
                                <span className="ds-info-label">Name</span>
                                <span className="ds-info-value">{order.customerName || order.user?.name || 'Customer'}</span>
                            </div>
                            <div className="ds-info-row">
                                <span className="ds-info-label">Phone</span>
                                <span className="ds-info-value">{order.customerPhone || order.user?.phone || 'N/A'}</span>
                            </div>
                            <div className="ds-info-row">
                                <span className="ds-info-label">Email</span>
                                <span className="ds-info-value">{order.user?.email || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="admin-card">
                        <h3 className="ds-card-title">📍 Delivery Location</h3>
                        <div className="ds-info-list">
                            <div className="ds-info-row">
                                <span className="ds-info-label">Address</span>
                                <span className="ds-info-value">{order.deliveryAddress || 'Not specified'}</span>
                            </div>
                            <div className="ds-info-row">
                                <span className="ds-info-label">Train No.</span>
                                <span className="ds-info-value">{order.trainNumber || 'N/A'}</span>
                            </div>
                            <div className="ds-info-row">
                                <span className="ds-info-label">Coach</span>
                                <span className="ds-info-value">{order.coachNumber || 'N/A'}</span>
                            </div>
                            <div className="ds-info-row">
                                <span className="ds-info-label">Seat</span>
                                <span className="ds-info-value">{order.seatNumber || 'N/A'}</span>
                            </div>
                            <div className="ds-info-row">
                                <span className="ds-info-label">Station</span>
                                <span className="ds-info-value">{order.station || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="admin-card ds-full-width">
                        <h3 className="ds-card-title">🍽️ Order Items</h3>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(order.items || []).map((item, index) => (
                                        <tr key={index}>
                                            <td><strong>{item.name}</strong></td>
                                            <td>x{item.quantity}</td>
                                            <td>৳{item.price?.toFixed(2)}</td>
                                            <td>৳{(item.price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="ds-order-total">
                            <span>Total Amount</span>
                            <span className="ds-total-value">৳{order.totalAmount?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="ds-action-bar">
                    {(order.status === 'confirmed' || order.status === 'preparing') && (
                        <button
                            className="ds-btn ds-btn-pickup ds-btn-lg"
                            onClick={() => handleUpdateStatus('picked_up')}
                        >
                            🏃 Pick Up Order
                        </button>
                    )}
                    {order.status === 'on_the_way' && (
                        <button
                            className="ds-btn ds-btn-deliver ds-btn-lg"
                            onClick={() => handleUpdateStatus('delivered')}
                        >
                            ✅ Mark Delivered
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliveryStaffOrderDetail;

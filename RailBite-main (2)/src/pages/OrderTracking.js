import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Toast from '../components/Toast';
import { orderAPI } from '../services/api';
import useSocket from '../hooks/useSocket';

function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Real-time WebSocket connection
  const { socket, isConnected, joinOrder, leaveOrder } = useSocket();

  const statusSteps = useMemo(() => [
    { id: 'pending', label: 'Order Placed', icon: '📋', description: 'Your order has been received', estimatedMinutes: 0 },
    { id: 'confirmed', label: 'Order Confirmed', icon: '✅', description: 'Restaurant confirmed your order', estimatedMinutes: 2 },
    { id: 'preparing', label: 'Preparing Food', icon: '👨‍🍳', description: 'Chef is preparing your meal', estimatedMinutes: 15 },
    { id: 'on_the_way', label: 'Out for Delivery', icon: '🚚', description: 'Delivery partner on the way', estimatedMinutes: 30 },
    { id: 'delivered', label: 'Delivered', icon: '🎉', description: 'Enjoy your meal!', estimatedMinutes: 0 }
  ], []);

  useEffect(() => {
    // Initial fetch
    fetchOrder();
  }, [orderId]);

  // Join socket room for this order and listen for real-time updates
  useEffect(() => {
    if (!socket || !order) return;

    // Join the order-specific room
    joinOrder(order._id || orderId);

    const handleStatusUpdate = (data) => {
      console.log('[Socket.IO] Order status update:', data);
      // Re-fetch full order data when we get a real-time update
      fetchOrder();
      if (data.status) {
        setToast({ message: `Order status updated to: ${data.status.replace('_', ' ')}`, type: 'success' });
      }
    };

    socket.on('orderStatusUpdate', handleStatusUpdate);

    return () => {
      socket.off('orderStatusUpdate', handleStatusUpdate);
      leaveOrder(order._id || orderId);
    };
  }, [socket, order?._id, orderId, joinOrder, leaveOrder]);

  // Fallback polling (every 30s) when WebSocket is not connected
  useEffect(() => {
    if (isConnected) return; // No need to poll when socket is live

    const interval = setInterval(() => {
      const token = localStorage.getItem('railbiteToken');
      if (!token) return;

      orderAPI.getById(orderId, token)
        .then(res => {
          if (res.data.success) {
            setOrder(prev => {
              if (prev && prev.status !== res.data.data.status) {
                return res.data.data;
              }
              return prev;
            });
          }
        })
        .catch(err => console.error('Polling error:', err.message));
    }, 30000); // every 30 seconds as fallback

    return () => clearInterval(interval);
  }, [orderId, isConnected]);


  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('railbiteToken');
      if (!token) {
        setError('Please login to track your order');
        setLoading(false);
        return;
      }
      const res = await orderAPI.getById(orderId, token);
      if (res.data.success) {
        setOrder(res.data.data);
      } else {
        setError(res.data.message || 'Order not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const token = localStorage.getItem('railbiteToken');
      const res = await orderAPI.cancel(order.orderNumber, token);
      if (res.data.success) {
        setOrder(res.data.data);
        setToast({ message: 'Order cancelled successfully', type: 'success' });
        setTimeout(() => navigate('/order-history'), 2000);
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Order cannot be cancelled at this stage',
        type: 'error'
      });
    }
  };

  const getStatusIndex = (status) =>
    statusSteps.findIndex((step) => step.id === status);

  const currentIndex = order ? getStatusIndex(order.status) : 0;
  const progressPercentage =
    currentIndex === -1 ? 0 : ((currentIndex + 1) / statusSteps.length) * 100;

  const getEstimatedTime = () => {
    if (currentIndex === -1 || currentIndex === statusSteps.length - 1) {
      return 'Order completed';
    }
    const nextStep = statusSteps[currentIndex + 1];
    const mins = nextStep.estimatedMinutes;
    return mins <= 5 ? `${mins} minutes` : `${mins - 5}-${mins} minutes`;
  };

  if (loading) {
    return (
      <div className="order-tracking-page">
        <BackButton />
        <div className="container">
          <div className="empty-cart">
            <div className="empty-cart-icon">📦</div>
            <h2>Loading order...</h2>
          </div>
        </div>
      </div>
    );
  }


  if (error || !order) {
    return (
      <div className="order-tracking-page">
        <BackButton />
        <div className="container">
          <div className="empty-cart">
            <div className="empty-cart-icon">📦</div>
            <h2>Order Not Found</h2>
            <p>{error || 'The order you are looking for does not exist.'}</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/order-history')}
            >
              View Order History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-tracking-page">
      <BackButton />
      <div className="container">

        {/* Header */}
        <div className="tracking-header">
          <h1>🚚 Track Your Order</h1>
          <p className="tracking-order-id">
            Order ID: <strong>{order.orderNumber}</strong>
          </p>
          <p className="tracking-order-date">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* 👉 Live update indicator with real-time connection status */}
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            color: isConnected ? '#28a745' : '#ffc107',
            marginBottom: '1rem'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#28a745' : '#ffc107',
              display: 'inline-block',
              animation: 'pulse 2s infinite'
            }}></span>
            {isConnected
              ? 'Live tracking — real-time updates via WebSocket'
              : 'Live tracking — polling for updates (reconnecting...)'}
          </div>
        )}


        {/* Progress Bar */}
        {order.status !== 'cancelled' && (
          <div className="tracking-progress-card">
            <div className="tracking-progress-header">
              <h3>Order Progress</h3>
              <span className="tracking-progress-percent">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="tracking-progress-bar">
              <div
                className="tracking-progress-bar-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            {currentIndex < statusSteps.length - 1 && (
              <p className="tracking-estimated">
                ⏱️ Estimated time: <strong>{getEstimatedTime()}</strong>
              </p>
            )}
          </div>
        )}

        {/* Cancelled banner */}
        {order.status === 'cancelled' && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            ❌ This order has been cancelled
          </div>
        )}

        {/* Main Layout */}
        <div className="tracking-layout">

          {/* Left: Timeline */}
          <div className="order-status-timeline">
            <h3 className="tracking-section-title">Order Status</h3>
            {statusSteps.map((step, index) => (
              <div
                key={step.id}
                className={`timeline-step ${index < currentIndex
                    ? 'completed'
                    : index === currentIndex
                      ? 'active'
                      : 'pending'
                  }`}
              >
                <div className="timeline-icon-wrapper">
                  <div className="timeline-icon">{step.icon}</div>
                  {index < statusSteps.length - 1 && (
                    <div className={`timeline-line ${index < currentIndex ? 'completed' : ''}`} />
                  )}
                </div>
                <div className="timeline-content">
                  <h4>{step.label}</h4>
                  <p className="timeline-description">{step.description}</p>
                  {index === currentIndex && index < statusSteps.length - 1 && (
                    <p className="timeline-status-current">🔄 In progress...</p>
                  )}
                  {index < currentIndex && (
                    <p className="timeline-status-done">✓ Completed</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Details */}
          <div className="tracking-details-column">

            {/* Order Details Card */}
            <div className="order-details-card">
              <h3>Order Details</h3>

              <div className="detail-row">
                <span>Order Number</span>
                <strong>{order.orderNumber}</strong>
              </div>
              <div className="detail-row">
                <span>Status</span>
                <strong>{order.status}</strong>
              </div>
              <div className="detail-row">
                <span>Payment Method</span>
                <strong>{order.paymentMethod?.toUpperCase()}</strong>
              </div>
              <div className="detail-row">
                <span>Total Items</span>
                <strong>{order.items?.length || 0}</strong>
              </div>

              {order.bookingDetails?.trainNumber && (
                <div className="detail-row">
                  <span>Train Number</span>
                  <strong>{order.bookingDetails.trainNumber}</strong>
                </div>
              )}
              {order.bookingDetails?.coachNumber && (
                <div className="detail-row">
                  <span>Coach</span>
                  <strong>{order.bookingDetails.coachNumber}</strong>
                </div>
              )}
              {order.bookingDetails?.seatNumber && (
                <div className="detail-row">
                  <span>Seat</span>
                  <strong>{order.bookingDetails.seatNumber}</strong>
                </div>
              )}
              {order.bookingDetails?.pickupStation && (
                <div className="detail-row">
                  <span>Pickup Station</span>
                  <strong>{order.bookingDetails.pickupStation}</strong>
                </div>
              )}

              {/* Items list */}
              <div className="order-items-list" style={{ marginTop: '1rem' }}>
                <h4>Items Ordered</h4>
                {order.items?.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                    <span>{item.name} x {item.quantity}</span>
                    <span>৳{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="detail-row" style={{ marginTop: '0.5rem' }}>
                <span>Subtotal</span>
                <strong>৳{order.subtotal?.toFixed(2)}</strong>
              </div>
              <div className="detail-row">
                <span>VAT (5%)</span>
                <strong>৳{order.vat?.toFixed(2)}</strong>
              </div>
              <div className="detail-row">
                <span>Delivery Fee</span>
                <strong>৳{order.deliveryFee?.toFixed(2)}</strong>
              </div>
              <div className="detail-row detail-total-row">
                <span>Total Amount</span>
                <strong className="detail-total-amount">
                  ৳{order.totalAmount?.toFixed(2)}
                </strong>
              </div>

              {/* Actions */}
              <div className="tracking-actions" style={{ marginTop: '1.5rem' }}>
                {['pending', 'confirmed'].includes(order.status) && (
                  <button
                    className="btn btn-secondary btn-block tracking-cancel-btn"
                    onClick={handleCancelOrder}
                  >
                    ❌ Cancel Order
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-block"
                  onClick={() => window.location.href = 'tel:16123'}
                >
                  📞 Contact Support
                </button>
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => navigate('/order-history')}
                >
                  📋 View Order History
                </button>
                <button
                  className="btn btn-secondary btn-block"
                  onClick={() => navigate('/')}
                >
                  🏠 Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default OrderTracking;


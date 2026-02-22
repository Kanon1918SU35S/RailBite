import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { useCart } from '../context/CartContext';
import BackButton from '../components/BackButton';
import Toast from '../components/Toast';

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const { getOrderById } = useOrder();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const foundOrder = getOrderById(orderId);
    if (foundOrder) {
      setOrder(foundOrder);
    } else {
      navigate('/order-history');
    }
  }, [orderId, getOrderById, navigate]);

  const handleReorder = () => {
    if (!order) return;

    order.items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        addToCart(item.name, item.price, item.image || null);
      }
    });
    setToast({ message: 'Items added to cart!', type: 'success' });
    setTimeout(() => {
      navigate('/cart');
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!order) return null;

  return (
    <div className="order-details-page">
      <BackButton />

      <div className="container">
        <div className="receipt-container">
          {/* Receipt Header with Logo */}
          <div className="receipt-header">
            <div className="receipt-logo-section">
              <img
                src="/images/logo.png"
                alt="RailBite Logo"
                className="receipt-logo"
              />
            </div>
            <h1>ORDER RECEIPT</h1>
            <div className="receipt-company-info">
              <p><strong>RailBite BD</strong></p>
              <p>Bangladesh Railway Food Service</p>
              <p>Kamalapur Railway Station, Dhaka-1217</p>
            </div>
          </div>

          {/* Billed To Section */}
          <div className="receipt-billed-to">
            <div className="billed-to-left">
              <h3 className="receipt-label">Billed To</h3>
              <p className="customer-name">{order.customer?.fullName || 'Customer Name'}</p>
              <p>Train: {order.trainInfo?.trainNumber || 'N/A'}</p>
              <p>Coach {order.trainInfo?.coachNumber || 'N/A'}, Seat {order.trainInfo?.seatNumber || 'N/A'}</p>
            </div>
            <div className="billed-to-right">
              <div className="receipt-info-row">
                <span className="receipt-label-orange">Receipt #</span>
                <span className="receipt-value-bold">{order.id}</span>
              </div>
              <div className="receipt-info-row">
                <span className="receipt-label-orange">Receipt date</span>
                <span className="receipt-value-bold">
                  {new Date(order.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          <table className="receipt-table">
            <thead>
              <tr>
                <th>QTY</th>
                <th>Description</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="text-center">{item.quantity}</td>
                  <td>{item.name}</td>
                  <td className="text-right">৳{item.price.toFixed(2)}</td>
                  <td className="text-right">৳{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Section */}
          <div className="receipt-summary-section">
            <div className="receipt-summary-row">
              <span>Subtotal</span>
              <span>৳{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="receipt-summary-row">
              <span>Sales Tax (5%)</span>
              <span>৳{order.vat.toFixed(2)}</span>
            </div>
            <div className="receipt-summary-row total-row">
              <span><strong>Total (BDT)</strong></span>
              <span className="total-amount"><strong>৳{order.total.toFixed(2)}</strong></span>
            </div>
          </div>

          {/* Notes Section */}
          <div className="receipt-notes">
            <h3>Notes</h3>
            <p>
              Thank you for your order! Your food will be delivered to your seat within 30-45 minutes.
              Please retain this receipt for reference.
            </p>
            <p>
              For questions or support, contact us at support@railbitebd.com or +880 1XXX-XXXXXX.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="receipt-actions">
            <button
              className="btn btn-primary btn-block"
              onClick={handleReorder}
            >
              Reorder These Items
            </button>
            <button
              className="btn btn-secondary btn-block"
              onClick={handlePrint}
            >
              Print Receipt
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default OrderDetails;
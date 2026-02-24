import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import BackButton from '../components/BackButton';

/* Animated number that smoothly counts to target */
const AnimatedPrice = ({ value }) => {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    if (from === to) return;
    const duration = 350;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(from + (to - from) * t));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    prev.current = value;
  }, [value]);
  return <>{display}</>;
};

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getSubtotal, getTotal, clearCart } = useCart();
  const { menuItems } = useMenu();
  const navigate = useNavigate();
  const [poppedId, setPoppedId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const imageMap = useMemo(() => {
    const map = {};
    menuItems.forEach(item => { if (item.image) map[item.name] = item.image; });
    return map;
  }, [menuItems]);

  const subtotal = getSubtotal();
  const vat = Math.round(subtotal * 0.05);
  const deliveryFee = 50;
  const total = getTotal();

  const handleQtyChange = (id, delta) => {
    setPoppedId(id);
    updateQuantity(id, delta);
    setTimeout(() => setPoppedId(null), 300);
  };

  const handleRemove = (id) => {
    setRemovingId(id);
    setTimeout(() => { removeFromCart(id); setRemovingId(null); }, 400);
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <BackButton />
        <div className="container">
          <div className="cart-header"><h1>Your Cart</h1></div>
          <div className="empty-cart cart-empty--animated">
            {/* Animated empty plate SVG */}
            <div className="cart-empty__icon">
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border-dark)" strokeWidth="2" className="cart-empty__plate" />
                <ellipse cx="60" cy="60" rx="35" ry="35" fill="none" stroke="var(--border-dark)" strokeWidth="1.5" opacity="0.5" />
                <path d="M50 45 Q60 25 70 45" stroke="var(--primary-orange)" strokeWidth="2" fill="none" className="cart-empty__steam cart-empty__steam--1" />
                <path d="M55 48 Q65 28 75 48" stroke="var(--primary-orange)" strokeWidth="2" fill="none" className="cart-empty__steam cart-empty__steam--2" />
                <path d="M45 47 Q55 30 65 47" stroke="var(--primary-orange)" strokeWidth="2" fill="none" className="cart-empty__steam cart-empty__steam--3" />
              </svg>
            </div>
            <h2>Your cart is empty</h2>
            <p>Add some delicious items to get started!</p>
            <button className="btn btn-primary" onClick={() => navigate('/menu-categories')}>Start Ordering</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <BackButton />
      <div className="container">
        <div className="cart-header"><h1>Your Cart</h1></div>

        <div className="cart-container">
          <div className="cart-items">
            {cart.map((item, index) => (
              <div
                key={item.id}
                className={`cart-item cart-item--animated ${removingId === item.id ? 'cart-item--removing' : ''}`}
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div className="item-image">
                  {(item.image || imageMap[item.name]) ? (
                    <img src={item.image || imageMap[item.name]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    <span>🍽️</span>
                  )}
                </div>
                <div className="item-details">
                  <h3 className="item-name">{item.name}</h3>
                  <p className="item-price">৳{item.price}</p>
                  <div className="item-quantity">
                    <button className="qty-btn qty-btn--animated" onClick={() => handleQtyChange(item.id, -1)}>−</button>
                    <span className={`qty-value ${poppedId === item.id ? 'qty-value--pop' : ''}`}>{item.quantity}</span>
                    <button className="qty-btn qty-btn--animated" onClick={() => handleQtyChange(item.id, 1)}>+</button>
                  </div>
                </div>
                <button className="remove-btn remove-btn--animated" onClick={() => handleRemove(item.id)} aria-label="Remove item">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary cart-summary--animated">
            <h3>Order Summary</h3>
            <div className="summary-row"><span>Subtotal</span><span>৳<AnimatedPrice value={subtotal} /></span></div>
            <div className="summary-row"><span>VAT (5%)</span><span>৳<AnimatedPrice value={vat} /></span></div>
            <div className="summary-row"><span>Delivery Fee</span><span>৳{deliveryFee}</span></div>
            <div className="summary-row"><span><strong>Total</strong></span><span><strong>৳<AnimatedPrice value={total} /></strong></span></div>
            <button className="btn btn-primary btn-block" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
            <button className="btn btn-secondary btn-block" style={{ marginTop: '1rem' }} onClick={() => navigate('/menu-categories')}>Continue Shopping</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
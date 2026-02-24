import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

/* Tiny confetti burst — pure JS, no deps */
const fireConfetti = (canvas) => {
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#e87e1e', '#ff9d42', '#ffc170', '#4CAF50', '#fff', '#fbbf24'];
  const pieces = Array.from({ length: 120 }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 200,
    y: canvas.height / 2,
    vx: (Math.random() - 0.5) * 18,
    vy: -Math.random() * 20 - 5,
    size: Math.random() * 8 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * 360,
    rv: (Math.random() - 0.5) * 12,
    gravity: 0.45,
    opacity: 1
  }));
  let frame = 0;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx;
      p.vy += p.gravity;
      p.y += p.vy;
      p.rot += p.rv;
      if (frame > 50) p.opacity -= 0.015;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    frame++;
    if (frame < 140) requestAnimationFrame(animate);
  };
  animate();
};

const OrderSuccess = () => {
  const [orderId, setOrderId] = useState(null);
  const [showContent, setShowContent] = useState(false);
  const [displayNum, setDisplayNum] = useState('');
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.orderId) {
      setOrderId(location.state.orderId);
      return;
    }
    const lastOrder = localStorage.getItem('railbiteLastOrder');
    if (lastOrder) {
      const parsed = JSON.parse(lastOrder);
      setOrderId(parsed.orderNumber || parsed.orderId || parsed.id);
      return;
    }
    navigate('/');
  }, [location, navigate]);

  // Fire confetti + staggered content
  useEffect(() => {
    if (!orderId) return;
    if (canvasRef.current) fireConfetti(canvasRef.current);
    setTimeout(() => setShowContent(true), 400);
  }, [orderId]);

  // Counter roll-up for order number
  useEffect(() => {
    if (!orderId || !showContent) return;
    const target = String(orderId);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i >= target.length) {
        setDisplayNum(target);
        clearInterval(interval);
      } else {
        setDisplayNum(target.slice(0, i) + Array(target.length - i).fill('0').join('').slice(0, target.length - i));
      }
    }, 80);
    return () => clearInterval(interval);
  }, [orderId, showContent]);

  if (!orderId) return null;

  return (
    <div className="os-page">
      <canvas ref={canvasRef} className="os-confetti" />

      <div className={`os-card ${showContent ? 'os-card--visible' : ''}`}>
        {/* Animated SVG checkmark */}
        <div className="os-check">
          <svg className="os-check__svg" viewBox="0 0 52 52">
            <circle className="os-check__circle" cx="26" cy="26" r="24" fill="none" />
            <path className="os-check__tick" fill="none" d="M14 27l7 7 16-16" />
          </svg>
        </div>

        <h1 className="os-title">Order Placed!</h1>
        <p className="os-subtitle">Thank you — your delicious meal is on its way.</p>

        <div className="os-info">
          <div className="os-info__row">
            <span className="os-info__label">Order Number</span>
            <span className="os-info__value os-info__value--highlight">{displayNum || orderId}</span>
          </div>
          <div className="os-info__row">
            <span className="os-info__label">Estimated Delivery</span>
            <span className="os-info__value">30 – 45 min to your seat</span>
          </div>
        </div>

        <div className="os-actions">
          <Link to={`/order-tracking/${orderId}`} className="os-btn os-btn--primary">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 10h14M13 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Track My Order
          </Link>
          <Link to="/order-history" className="os-btn os-btn--ghost">Order History</Link>
          <Link to="/" className="os-btn os-btn--ghost">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;

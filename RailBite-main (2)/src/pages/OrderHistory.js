import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { orderAPI, reviewAPI } from '../services/api';

/* ---------- tiny helpers ---------- */
const AnimNum = ({ value, prefix = '' }) => {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    const from = cur, to = value, dur = 500, start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      setCur(Math.round(from + (to - from) * t));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <>{prefix}{cur}</>;
};

const Skeleton = ({ w = '100%', h = '16px', r = '8px' }) => (
  <span className="oh-skel" style={{ width: w, height: h, borderRadius: r }} />
);

const SkeletonCard = () => (
  <div className="oh-card oh-card--skel">
    <div className="oh-card__head"><Skeleton w="140px" h="18px" /><Skeleton w="90px" h="26px" r="99px" /></div>
    <div className="oh-card__body"><Skeleton w="80%" h="14px" /><Skeleton w="60%" h="14px" /><Skeleton w="50%" h="14px" /></div>
    <div className="oh-card__foot"><Skeleton w="80px" h="20px" /><Skeleton w="110px" h="34px" r="10px" /></div>
  </div>
);

/* ---------- status config ---------- */
const STATUS_MAP = {
  pending: { label: 'Pending', cls: 'pending', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg> },
  confirmed: { label: 'Confirmed', cls: 'confirmed', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg> },
  preparing: { label: 'Preparing', cls: 'preparing', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z" /><path d="M8 12h8" /></svg> },
  on_the_way: { label: 'On the Way', cls: 'on-the-way', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg> },
  delivered: { label: 'Delivered', cls: 'delivered', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg> },
  cancelled: { label: 'Cancelled', cls: 'cancelled', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg> },
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'on_the_way', label: 'En Route' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

/* ================================================ */
function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => { fetchMyOrders(); setTimeout(() => setMounted(true), 50); }, []);

  const fetchMyOrders = async () => {
    try {
      setLoading(true); setError(null);
      const token = localStorage.getItem('railbiteToken');
      if (!token) { setError('Please login to view your orders'); setLoading(false); return; }
      const res = await orderAPI.getMyOrders(token);
      if (res.data.success) {
        setOrders(res.data.data || []);
        const delivered = (res.data.data || []).filter(o => o.status === 'delivered');
        const reviewChecks = {};
        for (const o of delivered) {
          try {
            const rRes = await reviewAPI.getByOrder(o._id, token);
            if (rRes.data.success && rRes.data.data) reviewChecks[o._id] = true;
          } catch (e) { /* not reviewed */ }
        }
        setReviewedOrders(reviewChecks);
      } else {
        setError(res.data.message || 'Failed to load orders');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading orders');
    } finally { setLoading(false); }
  };

  /* derived data */
  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;
    const activeCount = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
    return { total: orders.length, spent: Math.round(totalSpent), delivered: deliveredCount, active: activeCount };
  }, [orders]);

  const countForFilter = (key) => key === 'all' ? orders.length : orders.filter(o => o.status === key).length;

  /* ---- renders ---- */
  return (
    <div className={`oh-page ${mounted ? 'oh-page--visible' : ''}`}>
      <BackButton />
      <div className="container">
        {/* ---- Header ---- */}
        <header className="oh-header">
          <div className="oh-header__text">
            <h1 className="oh-header__title">Order History</h1>
            <p className="oh-header__sub">Track, review and reorder your meals</p>
          </div>
        </header>

        {/* ---- Stats strip ---- */}
        {!loading && !error && orders.length > 0 && (
          <div className="oh-stats">
            {[
              { label: 'Total Orders', value: stats.total, prefix: '', color: 'var(--primary-orange)' },
              { label: 'Active Now', value: stats.active, prefix: '', color: '#facc15' },
              { label: 'Delivered', value: stats.delivered, prefix: '', color: '#4ade80' },
              { label: 'Total Spent', value: stats.spent, prefix: '৳', color: 'var(--primary-orange)' },
            ].map((s, i) => (
              <div key={i} className="oh-stat" style={{ '--accent': s.color }}>
                <span className="oh-stat__val"><AnimNum value={s.value} prefix={s.prefix} /></span>
                <span className="oh-stat__label">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ---- Filters ---- */}
        {!loading && !error && orders.length > 0 && (
          <div className="oh-filters">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`oh-filter ${filterStatus === f.key ? 'oh-filter--active' : ''}`}
                onClick={() => setFilterStatus(f.key)}
              >
                {f.label}
                <span className="oh-filter__count">{countForFilter(f.key)}</span>
              </button>
            ))}
          </div>
        )}

        {/* ---- Loading skeleton ---- */}
        {loading && (
          <div className="oh-list">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ---- Error ---- */}
        {error && (
          <div className="oh-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchMyOrders}>Retry</button>
          </div>
        )}

        {/* ---- Empty state ---- */}
        {!loading && !error && filteredOrders.length === 0 && (
          <div className="oh-empty">
            <div className="oh-empty__icon">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="var(--border-dark)" strokeWidth="1.2" strokeLinecap="round">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a4 4 0 00-8 0v2" />
              </svg>
            </div>
            <h2>No Orders Found</h2>
            <p>{filterStatus === 'all' ? "You haven't placed any orders yet." : `No ${filterStatus} orders.`}</p>
            <button className="oh-btn oh-btn--primary" onClick={() => filterStatus !== 'all' ? setFilterStatus('all') : navigate('/order-selection')}>
              {filterStatus !== 'all' ? 'Show All Orders' : 'Start Ordering'}
            </button>
          </div>
        )}

        {/* ---- Order list ---- */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="oh-list">
            {filteredOrders.map((order, idx) => {
              const s = STATUS_MAP[order.status] || STATUS_MAP.pending;
              return (
                <div
                  key={order._id}
                  className="oh-card"
                  style={{ animationDelay: `${idx * 0.06}s` }}
                >
                  {/* timeline dot */}
                  <div className={`oh-card__dot oh-card__dot--${s.cls}`} />

                  {/* head */}
                  <div className="oh-card__head">
                    <div className="oh-card__meta">
                      <span className="oh-card__order-num">#{order.orderNumber}</span>
                      <span className="oh-card__date">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className={`oh-badge oh-badge--${s.cls}`}>
                      {s.icon}
                      {s.label}
                    </span>
                  </div>

                  {/* items */}
                  <div className="oh-card__body">
                    <div className="oh-card__items">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="oh-item">
                          <span className="oh-item__name">{item.name}</span>
                          <span className="oh-item__qty">×{item.quantity}</span>
                          <span className="oh-item__price">৳{item.price * item.quantity}</span>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <span className="oh-card__more">+{order.items.length - 3} more items</span>
                      )}
                    </div>

                    {order.bookingDetails?.trainNumber && (
                      <div className="oh-card__train">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M12 17v4M8 21h8M9 3v4M15 3v4" /></svg>
                        <span>
                          Train {order.bookingDetails.trainNumber}
                          {order.bookingDetails.coachNumber && <> &middot; Coach {order.bookingDetails.coachNumber}</>}
                          {order.bookingDetails.seatNumber && <> &middot; Seat {order.bookingDetails.seatNumber}</>}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* footer */}
                  <div className="oh-card__foot">
                    <span className="oh-card__total">৳{order.totalAmount?.toFixed(0)}</span>
                    <div className="oh-card__actions">
                      <button className="oh-btn oh-btn--primary oh-btn--sm" onClick={() => navigate(`/order-tracking/${order.orderNumber}`)}>
                        View Details
                      </button>
                      {order.status === 'delivered' && (
                        reviewedOrders[order._id] ? (
                          <button className="oh-btn oh-btn--ghost oh-btn--sm oh-btn--rated" onClick={() => navigate(`/review/${order._id}`)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" /></svg>
                            Reviewed
                          </button>
                        ) : (
                          <button className="oh-btn oh-btn--accent oh-btn--sm" onClick={() => navigate(`/review/${order._id}`)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" /></svg>
                            Rate
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderHistory;

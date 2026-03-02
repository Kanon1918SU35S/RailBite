import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { useMenu } from '../context/MenuContext';
import { couponAPI, paymentAPI, loyaltyAPI } from '../services/api';
import BackButton from '../components/BackButton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

/* ─── Provider config ─── */
const MOBILE_PROVIDERS = [
  { id: 'bkash', name: 'bKash', color: '#E2136E', number: '01XXXXXXXXX', icon: '🅱️' },
  { id: 'nagad', name: 'Nagad', color: '#F6921E', number: '01XXXXXXXXX', icon: '🟠' },
  { id: 'rocket', name: 'Rocket', color: '#8B2F89', number: '01XXXXXXXXX', icon: '🚀' },
  { id: 'upay', name: 'Upay', color: '#00B9AE', number: '01XXXXXXXXX', icon: '💚' },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { addOrder, orderType, bookingDetails } = useOrder();
  const { menuItems } = useMenu();

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [codAgreed, setCodAgreed] = useState(false);

  const [contactInfo, setContactInfo] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: bookingDetails?.phone || user?.phone || ''
  });

  const [mobileBankingInfo, setMobileBankingInfo] = useState({
    provider: '',
    accountNumber: '',
    transactionId: ''
  });

  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: ''
  });

  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Loyalty points state
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loyaltyPointsToUse, setLoyaltyPointsToUse] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [loyaltyApplied, setLoyaltyApplied] = useState(false);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  // Image lookup for items without stored images
  const imageMap = useMemo(() => {
    const map = {};
    menuItems.forEach(item => { if (item.image) map[item.name] = item.image; });
    return map;
  }, [menuItems]);

  useEffect(() => {
    if (cart.length === 0) navigate('/cart');
  }, [cart, navigate]);

  // Fetch loyalty points on mount
  useEffect(() => {
    const fetchLoyalty = async () => {
      const token = localStorage.getItem('railbiteToken');
      if (!token) return;
      try {
        const res = await loyaltyAPI.getMyPoints(token);
        if (res.data.success) {
          setLoyaltyData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch loyalty points:', err);
      }
    };
    fetchLoyalty();
  }, []);

  const showToast = (message, type) => setToast({ show: true, message, type });
  const hideToast = () => setToast({ show: false, message: '', type: '' });

  /* ─── Calculations ─── */
  const subtotal = useMemo(() => cart.reduce((t, i) => t + i.price * i.quantity, 0), [cart]);
  const vat = useMemo(() => Math.round(subtotal * 0.05), [subtotal]);
  const deliveryFee = 50;
  const total = subtotal + vat + deliveryFee - couponDiscount - loyaltyDiscount;
  const totalItems = useMemo(() => cart.reduce((t, i) => t + i.quantity, 0), [cart]);
  const advanceAmount = Math.ceil(total * 0.5);
  const dueAmount = total - advanceAmount;

  /* ─── Coupon handler ─── */
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      showToast('Please enter a coupon code', 'error');
      return;
    }
    const token = localStorage.getItem('railbiteToken');
    if (!token) { showToast('Please login first', 'error'); return; }

    setCouponLoading(true);
    try {
      const res = await couponAPI.validate(
        { code: couponCode, subtotal, orderType: orderType || 'train' },
        token
      );
      if (res.data.success) {
        const { calculatedDiscount, code, description } = res.data.data;
        setCouponDiscount(calculatedDiscount);
        setCouponApplied(res.data.data);
        showToast(`Coupon applied! You save ৳${calculatedDiscount}`, 'success');
      }
    } catch (err) {
      setCouponDiscount(0);
      setCouponApplied(null);
      showToast(err.response?.data?.message || 'Invalid coupon code', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponApplied(null);
    showToast('Coupon removed', 'info');
  };

  /* ─── Loyalty Points handlers ─── */
  const handleApplyLoyalty = () => {
    if (!loyaltyData || loyaltyData.points < 50) {
      showToast('Minimum 50 points required to redeem', 'error');
      return;
    }
    const pts = parseInt(loyaltyPointsToUse);
    if (!pts || pts < 50) {
      showToast('Enter at least 50 points to redeem', 'error');
      return;
    }
    if (pts > loyaltyData.points) {
      showToast(`You only have ${loyaltyData.points} points available`, 'error');
      return;
    }
    const discount = pts * 0.5;
    const maxDiscount = subtotal + vat + deliveryFee - couponDiscount;
    const finalDiscount = Math.min(discount, maxDiscount);
    const finalPoints = Math.ceil(finalDiscount / 0.5);

    setLoyaltyDiscount(finalDiscount);
    setLoyaltyPointsToUse(finalPoints);
    setLoyaltyApplied(true);
    showToast(`${finalPoints} loyalty points applied! You save ৳${finalDiscount.toFixed(0)}`, 'success');
  };

  const handleRemoveLoyalty = () => {
    setLoyaltyPointsToUse(0);
    setLoyaltyDiscount(0);
    setLoyaltyApplied(false);
    showToast('Loyalty points removed', 'info');
  };

  /* ─── Detect card type ─── */
  const detectCardType = (num) => {
    const n = num.replace(/\s/g, '');
    if (/^4/.test(n)) return 'visa';
    if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
    if (/^3[47]/.test(n)) return 'amex';
    return '';
  };

  const cardType = detectCardType(cardInfo.cardNumber);

  /* ─── Handlers ─── */
  const handleContactChange = (e) =>
    setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });

  const handleMobileBankingChange = (e) =>
    setMobileBankingInfo({ ...mobileBankingInfo, [e.target.name]: e.target.value });

  const handleCardInfoChange = (e) => {
    let { name, value } = e.target;
    if (name === 'cardNumber') {
      value = value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (value.length > 19) return;
    }
    if (name === 'expiryDate') {
      value = value.replace(/\D/g, '');
      if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
      if (value.length > 5) return;
    }
    if (name === 'cvv') {
      value = value.replace(/\D/g, '');
      if (value.length > (cardType === 'amex' ? 4 : 3)) return;
    }
    setCardInfo({ ...cardInfo, [name]: value });
  };

  /* ─── Validation ─── */
  const validateContactInfo = () => {
    if (!contactInfo.fullName.trim()) { showToast('Please enter your full name', 'error'); return false; }
    if (!contactInfo.email.trim()) { showToast('Please enter your email', 'error'); return false; }
    if (!contactInfo.phone.trim()) { showToast('Please enter your phone number', 'error'); return false; }
    return true;
  };

  const validateMobileBanking = () => {
    if (!mobileBankingInfo.provider) { showToast('Please select a mobile banking provider', 'error'); return false; }
    if (!mobileBankingInfo.accountNumber.trim() || mobileBankingInfo.accountNumber.length < 11) {
      showToast('Please enter a valid 11-digit account number', 'error'); return false;
    }
    if (!mobileBankingInfo.transactionId.trim() || mobileBankingInfo.transactionId.length < 8) {
      showToast('Transaction ID must be at least 8 characters', 'error'); return false;
    }
    return true;
  };

  const validateCardPayment = () => {
    const digits = cardInfo.cardNumber.replace(/\s/g, '');
    if (digits.length !== 16) { showToast('Card number must be 16 digits', 'error'); return false; }
    if (!cardInfo.cardholderName.trim()) { showToast('Please enter cardholder name', 'error'); return false; }
    if (!cardInfo.expiryDate.trim() || cardInfo.expiryDate.length !== 5) {
      showToast('Please enter valid expiry (MM/YY)', 'error'); return false;
    }
    const [m, y] = cardInfo.expiryDate.split('/');
    if (new Date(2000 + parseInt(y), parseInt(m) - 1) < new Date()) {
      showToast('Card has expired', 'error'); return false;
    }
    const cvvLen = cardType === 'amex' ? 4 : 3;
    if (cardInfo.cvv.length !== cvvLen) { showToast(`Please enter valid ${cvvLen}-digit CVV`, 'error'); return false; }
    return true;
  };

  const validateCOD = () => {
    if (!codAgreed) { showToast('Please acknowledge the 50% advance payment requirement', 'error'); return false; }
    return true;
  };

  /* ─── Submit ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateContactInfo()) return;
    if (paymentMethod === 'mobile' && !validateMobileBanking()) return;
    if (paymentMethod === 'card' && !validateCardPayment()) return;
    if (paymentMethod === 'cash' && !validateCOD()) return;
    // 'online' (SSLCommerz) needs no extra validation

    const token = localStorage.getItem('railbiteToken');
    if (!token) { showToast('You must be logged in to place an order', 'error'); return; }

    setSubmitting(true);

    let paymentInfo = {};
    let paymentStatus = 'unpaid';
    let orderAdvance = 0;
    let orderDue = total;

    if (paymentMethod === 'cash') {
      orderAdvance = advanceAmount;
      orderDue = dueAmount;
      paymentStatus = 'partial';
    } else if (paymentMethod === 'mobile') {
      paymentInfo = {
        provider: mobileBankingInfo.provider,
        accountNumber: mobileBankingInfo.accountNumber,
        transactionId: mobileBankingInfo.transactionId
      };
      paymentStatus = 'paid';
      orderAdvance = total;
      orderDue = 0;
    } else if (paymentMethod === 'card') {
      paymentInfo = {
        cardLastFour: cardInfo.cardNumber.replace(/\s/g, '').slice(-4),
        cardholderName: cardInfo.cardholderName,
        cardType
      };
      paymentStatus = 'paid';
      orderAdvance = total;
      orderDue = 0;
    } else if (paymentMethod === 'online') {
      // SSLCommerz — order created as unpaid, then redirected to payment gateway
      paymentStatus = 'unpaid';
      orderAdvance = 0;
      orderDue = total;
    }

    const payload = {
      items: cart.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || ''
      })),
      contactInfo,
      orderType: orderType || bookingDetails?.orderType || 'train',
      bookingDetails: bookingDetails
        ? {
          passengerName: bookingDetails.passengerName,
          phone: bookingDetails.phone,
          trainNumber: bookingDetails.trainNumber,
          coachNumber: bookingDetails.coachNumber,
          seatNumber: bookingDetails.seatNumber,
          pickupStation: bookingDetails.pickupStation
        }
        : null,
      paymentMethod,
      paymentInfo,
      paymentStatus,
      advanceAmount: orderAdvance,
      dueAmount: orderDue,
      couponCode: couponApplied ? couponApplied.code : '',
      couponDiscount: couponDiscount || 0,
      loyaltyPointsUsed: loyaltyApplied ? loyaltyPointsToUse : 0,
      loyaltyDiscount: loyaltyApplied ? loyaltyDiscount : 0,
      subtotal,
      vat,
      deliveryFee,
      total
    };

    try {
      const res = await axios.post(`${API_URL}/orders`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const order = res.data.data;

        // Apply coupon usage on backend
        if (couponApplied) {
          try {
            await couponAPI.apply(
              { code: couponApplied.code, orderId: order._id },
              token
            );
          } catch (e) {
            console.error('Coupon apply tracking failed:', e.message);
          }
        }

        // Redeem loyalty points on backend
        if (loyaltyApplied && loyaltyPointsToUse >= 50) {
          try {
            await loyaltyAPI.redeem(
              { orderId: order._id, points: loyaltyPointsToUse },
              token
            );
          } catch (e) {
            console.error('Loyalty redeem failed:', e.message);
          }
        }

        // ── SSLCommerz online payment: redirect to gateway ──
        if (paymentMethod === 'online') {
          try {
            const payRes = await paymentAPI.initiate({
              orderId: order._id,
              amount: total,
              customerName: contactInfo.fullName,
              customerEmail: contactInfo.email,
              customerPhone: contactInfo.phone
            }, token);

            if (payRes.data.success) {
              addOrder(order);
              clearCart();

              const payData = payRes.data.data;
              // Dev mode → redirect to local simulation page
              if (payData.mode === 'development') {
                navigate(`/payment-process?tran_id=${payData.transactionId}&amount=${payData.amount}&order=${order.orderId || order._id}`);
              } else {
                // Production → redirect to SSLCommerz gateway
                window.location.href = payData.gatewayUrl;
              }
              return;
            } else {
              showToast('Failed to initiate payment gateway', 'error');
            }
          } catch (payErr) {
            showToast(payErr.response?.data?.message || 'Payment gateway error', 'error');
          }
          setSubmitting(false);
          return;
        }

        // ── Non-gateway payments (mobile, card, COD) ──
        addOrder(order);
        clearCart();
        navigate('/order-success', { state: { orderId: order.orderId } });
      } else {
        showToast(res.data.message || 'Failed to place order', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to place order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProvider = MOBILE_PROVIDERS.find(p => p.id === mobileBankingInfo.provider);

  return (
    <div className="checkout-page">
      <div className="container">
        <BackButton />
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center', color: '#fff' }}>
          Checkout
        </h1>

        <div className="checkout-container">
          {/* ── LEFT COLUMN ── */}
          <div>
            {/* Contact Information */}
            <div className="checkout-section">
              <h3>📝 Contact Information</h3>
              <form id="checkoutForm" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" name="fullName" value={contactInfo.fullName} readOnly className="checkout-readonly" placeholder="John Doe" required />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" value={contactInfo.email} readOnly className="checkout-readonly" placeholder="john@example.com" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" name="phone" value={contactInfo.phone} readOnly className="checkout-readonly" placeholder="01712345678" required />
                </div>
              </form>
            </div>

            {/* Payment Method Selection */}
            <div className="checkout-section">
              <h3>💳 Payment Method</h3>
              <div className="payment-methods">
                <div className={`payment-method ${paymentMethod === 'mobile' ? 'active' : ''}`} onClick={() => setPaymentMethod('mobile')}>
                  <div className="payment-method-icon">📱</div>
                  <h4>Mobile Banking</h4>
                  <p>bKash, Nagad, Rocket, Upay</p>
                  {paymentMethod === 'mobile' && <div className="payment-check">✓</div>}
                </div>
                <div className={`payment-method ${paymentMethod === 'card' ? 'active' : ''}`} onClick={() => setPaymentMethod('card')}>
                  <div className="payment-method-icon">💳</div>
                  <h4>Card Payment</h4>
                  <p>Visa, Mastercard, Amex</p>
                  {paymentMethod === 'card' && <div className="payment-check">✓</div>}
                </div>
                <div className={`payment-method ${paymentMethod === 'online' ? 'active' : ''}`} onClick={() => setPaymentMethod('online')}>
                  <div className="payment-method-icon">🌐</div>
                  <h4>Online Payment</h4>
                  <p>SSLCommerz Gateway</p>
                  {paymentMethod === 'online' && <div className="payment-check">✓</div>}
                </div>
                <div className={`payment-method ${paymentMethod === 'cash' ? 'active' : ''}`} onClick={() => setPaymentMethod('cash')}>
                  <div className="payment-method-icon">💵</div>
                  <h4>Cash on Delivery</h4>
                  <p>50% advance required</p>
                  {paymentMethod === 'cash' && <div className="payment-check">✓</div>}
                </div>
              </div>

              {/* ── ONLINE PAYMENT (SSLCommerz) ── */}
              {paymentMethod === 'online' && (
                <div className="payment-details">
                  <h4>🌐 Online Payment via SSLCommerz</h4>
                  <p className="mb-pay-total">Amount to pay: <strong>৳{total.toFixed(2)}</strong></p>
                  <div style={{
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginTop: '1rem',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '2rem' }}>🔒</span>
                      <div>
                        <h5 style={{ color: '#fff', margin: 0, fontSize: '1rem' }}>Secure Payment Gateway</h5>
                        <p style={{ color: '#b0b0b0', margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
                          You'll be redirected to SSLCommerz to complete your payment securely.
                        </p>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      {['bKash', 'Nagad', 'Rocket', 'VISA', 'Mastercard', 'AMEX', 'Net Banking'].map(method => (
                        <span key={method} style={{
                          background: 'rgba(255,255,255,0.1)',
                          padding: '0.3rem 0.7rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          color: '#ccc'
                        }}>
                          {method}
                        </span>
                      ))}
                    </div>
                    <div style={{
                      background: 'rgba(249,115,22,0.1)',
                      border: '1px solid rgba(249,115,22,0.3)',
                      borderRadius: '8px',
                      padding: '0.8rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>💡</span>
                      <p style={{ color: '#f97316', margin: 0, fontSize: '0.85rem' }}>
                        After clicking "Place Order", you'll be redirected to a secure payment page.
                        {process.env.NODE_ENV === 'development' && ' (Dev mode: simulated payment)'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CASH ON DELIVERY ── */}
              {paymentMethod === 'cash' && (
                <div className="payment-details">
                  <h4>💵 Cash on Delivery — 50% Advance Required</h4>
                  <div className="cod-info-box">
                    <p className="cod-reason">
                      For order safety and to confirm your commitment, we require <strong>50% advance payment</strong> at the time of placing your order. The remaining amount will be collected by our delivery partner upon delivery.
                    </p>
                    <div className="cod-breakdown">
                      <div className="cod-row">
                        <span>Total Order Amount</span>
                        <span className="cod-amount">৳{total.toFixed(2)}</span>
                      </div>
                      <div className="cod-row cod-highlight">
                        <span>Advance Payment (50%)</span>
                        <span className="cod-amount cod-advance">৳{advanceAmount.toFixed(2)}</span>
                      </div>
                      <div className="cod-row">
                        <span>Due on Delivery</span>
                        <span className="cod-amount">৳{dueAmount.toFixed(2)}</span>
                      </div>
                    </div>
                    <label className="cod-agree">
                      <input type="checkbox" checked={codAgreed} onChange={(e) => setCodAgreed(e.target.checked)} />
                      <span>I agree to pay <strong>৳{advanceAmount.toFixed(2)}</strong> advance now and the remaining <strong>৳{dueAmount.toFixed(2)}</strong> upon delivery.</span>
                    </label>
                  </div>
                </div>
              )}

              {/* ── MOBILE BANKING ── */}
              {paymentMethod === 'mobile' && (
                <div className="payment-details">
                  <h4>📱 Mobile Banking Payment</h4>
                  <p className="mb-pay-total">Amount to pay: <strong>৳{total.toFixed(2)}</strong></p>

                  {/* Provider Selection */}
                  <div className="mb-provider-grid">
                    {MOBILE_PROVIDERS.map(p => (
                      <div
                        key={p.id}
                        className={`mb-provider-card ${mobileBankingInfo.provider === p.id ? 'active' : ''}`}
                        onClick={() => setMobileBankingInfo({ ...mobileBankingInfo, provider: p.id })}
                        style={{ '--provider-color': p.color }}
                      >
                        <span className="mb-provider-icon">{p.icon}</span>
                        <span className="mb-provider-name">{p.name}</span>
                        {mobileBankingInfo.provider === p.id && <span className="mb-provider-check">✓</span>}
                      </div>
                    ))}
                  </div>

                  {/* Instructions when provider is selected */}
                  {selectedProvider && (
                    <div className="mb-instructions">
                      <div className="mb-step-header">
                        <h5>Payment Instructions for {selectedProvider.name}</h5>
                      </div>

                      {/* ── bKash / Nagad: API-flow (redirect) ── */}
                      {selectedProvider.apiFlow ? (
                        <>
                          <div className="mb-steps">
                            <div className="mb-step">
                              <span className="mb-step-num">1</span>
                              <span>Click <strong>"Place Order"</strong> below</span>
                            </div>
                            <div className="mb-step">
                              <span className="mb-step-num">2</span>
                              <span>You'll be redirected to <strong>{selectedProvider.name}</strong> secure checkout</span>
                            </div>
                            <div className="mb-step">
                              <span className="mb-step-num">3</span>
                              <span>Complete payment of <strong>৳{total.toFixed(2)}</strong> on {selectedProvider.name}</span>
                            </div>
                            <div className="mb-step">
                              <span className="mb-step-num">4</span>
                              <span>You'll be redirected back to RailBite automatically</span>
                            </div>
                          </div>
                          <div style={{
                            background: `rgba(${selectedProvider.id === 'bkash' ? '226,19,110' : '246,146,30'},0.1)`,
                            border: `1px solid ${selectedProvider.color}44`,
                            borderRadius: '10px',
                            padding: '1rem',
                            marginTop: '1rem',
                            textAlign: 'center'
                          }}>
                            <span style={{ fontSize: '2rem' }}>{selectedProvider.icon}</span>
                            <p style={{ color: selectedProvider.color, margin: '0.5rem 0 0', fontWeight: 600 }}>
                              Pay ৳{total.toFixed(2)} via {selectedProvider.name}
                            </p>
                            <small style={{ color: '#b0b0b0' }}>Merchant: <code className="mb-number">01720216708</code></small>
                          </div>
                        </>
                      ) : (
                        /* ── Rocket / Upay: Manual send-money ── */
                        <>
                          <div className="mb-steps">
                            <div className="mb-step">
                              <span className="mb-step-num">1</span>
                              <span>Open your <strong>{selectedProvider.name}</strong> app</span>
                            </div>
                            <div className="mb-step">
                              <span className="mb-step-num">2</span>
                              <span>Select <strong>"Send Money"</strong></span>
                            </div>
                            <div className="mb-step">
                              <span className="mb-step-num">3</span>
                              <span>Send <strong>৳{total.toFixed(2)}</strong> to: <code className="mb-number">{selectedProvider.number}</code></span>
                            </div>
                            <div className="mb-step">
                              <span className="mb-step-num">4</span>
                              <span>Enter the <strong>Transaction ID</strong> and your <strong>account number</strong> below</span>
                            </div>
                          </div>

                          <div className="form-group">
                            <label>Your {selectedProvider.name} Number <span style={{ color: '#ff6b6b' }}>*</span></label>
                            <input
                              type="tel"
                              name="accountNumber"
                              placeholder="01XXXXXXXXX"
                              value={mobileBankingInfo.accountNumber}
                              onChange={handleMobileBankingChange}
                              maxLength="11"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Transaction ID <span style={{ color: '#ff6b6b' }}>*</span></label>
                            <input
                              type="text"
                              name="transactionId"
                              placeholder="e.g. TXN8A7B3C2D1E"
                              value={mobileBankingInfo.transactionId}
                              onChange={handleMobileBankingChange}
                              required
                            />
                            <small style={{ color: '#b0b0b0' }}>Enter the Transaction ID from your {selectedProvider.name} confirmation SMS</small>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── CARD PAYMENT ── */}
              {paymentMethod === 'card' && (
                <div className="payment-details">
                  <h4>💳 Card Payment</h4>
                  <p className="mb-pay-total">Amount to pay: <strong>৳{total.toFixed(2)}</strong></p>

                  <div className="card-type-badges">
                    <span className={`card-badge ${cardType === 'visa' ? 'active' : ''}`}>VISA</span>
                    <span className={`card-badge ${cardType === 'mastercard' ? 'active' : ''}`}>MC</span>
                    <span className={`card-badge ${cardType === 'amex' ? 'active' : ''}`}>AMEX</span>
                  </div>

                  <div className="form-group">
                    <label>Card Number <span style={{ color: '#ff6b6b' }}>*</span></label>
                    <div className="card-input-wrapper">
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardInfo.cardNumber}
                        onChange={handleCardInfoChange}
                        className="card-number-input"
                        required
                      />
                      {cardType && <span className="card-type-indicator">{cardType === 'visa' ? '🔵' : cardType === 'mastercard' ? '🔴' : '🟡'}</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Cardholder Name <span style={{ color: '#ff6b6b' }}>*</span></label>
                    <input
                      type="text"
                      name="cardholderName"
                      placeholder="JOHN DOE"
                      value={cardInfo.cardholderName}
                      onChange={handleCardInfoChange}
                      style={{ textTransform: 'uppercase' }}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date <span style={{ color: '#ff6b6b' }}>*</span></label>
                      <input type="text" name="expiryDate" placeholder="MM/YY" value={cardInfo.expiryDate} onChange={handleCardInfoChange} required />
                    </div>
                    <div className="form-group">
                      <label>CVV <span style={{ color: '#ff6b6b' }}>*</span></label>
                      <input type="password" name="cvv" placeholder={cardType === 'amex' ? '1234' : '123'} value={cardInfo.cvv} onChange={handleCardInfoChange} maxLength={cardType === 'amex' ? 4 : 3} required />
                    </div>
                  </div>
                </div>
              )}

              <div className="security-note">
                🔒 Your payment information is secure and encrypted
              </div>
            </div>
          </div>

          {/* ── ORDER SUMMARY (Right) ── */}
          <div className="checkout-summary">
            <div className="checkout-summary-header">
              <h3>Order Summary</h3>
              <span className="checkout-summary-count">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
            </div>

            <div className="checkout-items-list">
              {cart.map((item) => {
                const img = item.image || imageMap[item.name];
                return (
                  <div key={item.id} className="checkout-item-row">
                    <div className="checkout-item-img">
                      {img ? (
                        <img src={img} alt={item.name} />
                      ) : (
                        <span className="checkout-item-emoji">🍽️</span>
                      )}
                    </div>
                    <div className="checkout-item-info">
                      <p className="checkout-item-name">{item.name}</p>
                      <p className="checkout-item-unit">৳{item.price} × {item.quantity}</p>
                    </div>
                    <span className="checkout-item-qty">×{item.quantity}</span>
                    <p className="checkout-item-total">৳{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                );
              })}
            </div>

            <div className="checkout-summary-divider" />

            {/* ── COUPON CODE SECTION ── */}
            <div style={{
              padding: '1rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
              marginBottom: '0.5rem'
            }}>
              <h4 style={{ color: '#fff', marginBottom: '0.8rem', fontSize: '0.95rem' }}>🎟️ Have a Coupon?</h4>
              {couponApplied ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(40,167,69,0.15)',
                  border: '1px solid rgba(40,167,69,0.3)',
                  borderRadius: '8px',
                  padding: '0.8rem 1rem'
                }}>
                  <div>
                    <span style={{ color: '#28a745', fontWeight: '700', fontSize: '0.95rem' }}>
                      ✅ {couponApplied.code}
                    </span>
                    <p style={{ color: '#b0b0b0', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                      {couponApplied.discountType === 'percentage'
                        ? `${couponApplied.discountValue}% off`
                        : `৳${couponApplied.discountValue} off`}
                      {couponApplied.description ? ` — ${couponApplied.description}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{
                      background: 'rgba(255,107,107,0.2)',
                      border: '1px solid rgba(255,107,107,0.4)',
                      color: '#ff6b6b',
                      borderRadius: '6px',
                      padding: '0.4rem 0.8rem',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      padding: '0.7rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      fontSize: '0.9rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    style={{
                      padding: '0.7rem 1.2rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #f97316, #ea580c)',
                      color: '#fff',
                      fontWeight: '600',
                      cursor: couponLoading ? 'wait' : 'pointer',
                      fontSize: '0.85rem',
                      opacity: couponLoading ? 0.7 : 1
                    }}
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* ── LOYALTY POINTS SECTION ── */}
            {loyaltyData && loyaltyData.points >= 50 && (
              <div style={{
                padding: '1rem',
                background: 'rgba(255,215,0,0.06)',
                borderRadius: '10px',
                marginBottom: '0.5rem',
                border: '1px solid rgba(255,215,0,0.15)'
              }}>
                <h4 style={{ color: '#ffd700', marginBottom: '0.8rem', fontSize: '0.95rem' }}>
                  🎖️ Loyalty Points ({loyaltyData.points} pts = ৳{(loyaltyData.points * 0.5).toFixed(0)})
                </h4>
                {loyaltyApplied ? (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,215,0,0.12)',
                    border: '1px solid rgba(255,215,0,0.3)',
                    borderRadius: '8px',
                    padding: '0.8rem 1rem'
                  }}>
                    <div>
                      <span style={{ color: '#ffd700', fontWeight: '700', fontSize: '0.95rem' }}>
                        ✅ {loyaltyPointsToUse} points applied
                      </span>
                      <p style={{ color: '#b0b0b0', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                        Saving ৳{loyaltyDiscount.toFixed(0)} on this order
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveLoyalty}
                      style={{
                        background: 'rgba(255,107,107,0.2)',
                        border: '1px solid rgba(255,107,107,0.4)',
                        color: '#ff6b6b',
                        borderRadius: '6px',
                        padding: '0.4rem 0.8rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: '#9ca3af', fontSize: '0.82rem', marginBottom: '0.6rem' }}>
                      Min. 50 points · 1 point = ৳0.50 discount
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        placeholder="Points to use"
                        min="50"
                        max={loyaltyData.points}
                        value={loyaltyPointsToUse || ''}
                        onChange={(e) => setLoyaltyPointsToUse(Math.min(parseInt(e.target.value) || 0, loyaltyData.points))}
                        style={{
                          flex: 1,
                          padding: '0.7rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,215,0,0.25)',
                          background: 'rgba(255,255,255,0.08)',
                          color: '#fff',
                          fontSize: '0.9rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setLoyaltyPointsToUse(loyaltyData.points)}
                        style={{
                          padding: '0.7rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,215,0,0.3)',
                          background: 'rgba(255,215,0,0.1)',
                          color: '#ffd700',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Use All
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyLoyalty}
                        style={{
                          padding: '0.7rem 1.2rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #ffd700, #daa520)',
                          color: '#1a1a2e',
                          fontWeight: '700',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Apply
                      </button>
                    </div>
                    {loyaltyPointsToUse >= 50 && (
                      <p style={{ color: '#ffd700', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        = ৳{(loyaltyPointsToUse * 0.5).toFixed(0)} discount
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="checkout-calc-rows">
              <div className="checkout-calc-row">
                <span>Subtotal</span>
                <span>৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="checkout-calc-row">
                <span>VAT (5%)</span>
                <span>৳{vat.toFixed(2)}</span>
              </div>
              <div className="checkout-calc-row">
                <span>Delivery Fee</span>
                <span>৳{deliveryFee.toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="checkout-calc-row" style={{ color: '#28a745' }}>
                  <span>🎟️ Coupon Discount</span>
                  <span>-৳{couponDiscount.toFixed(2)}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className="checkout-calc-row" style={{ color: '#ffd700' }}>
                  <span>🎖️ Loyalty Discount</span>
                  <span>-৳{loyaltyDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="checkout-summary-divider" />

            <div className="checkout-total-row">
              <span>Total</span>
              <span>৳{total.toFixed(2)}</span>
            </div>

            {/* Payment summary for COD */}
            {paymentMethod === 'cash' && (
              <div className="checkout-payment-split">
                <div className="checkout-split-row advance">
                  <span>🟢 Pay Now (50%)</span>
                  <span>৳{advanceAmount.toFixed(2)}</span>
                </div>
                <div className="checkout-split-row due">
                  <span>🔵 Due on Delivery</span>
                  <span>৳{dueAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              form="checkoutForm"
              type="submit"
              className="checkout-place-btn"
              disabled={submitting}
            >
              {submitting
                ? 'Placing Order...'
                : paymentMethod === 'cash'
                  ? `Pay ৳${advanceAmount.toFixed(2)} & Place Order`
                  : paymentMethod === 'online'
                    ? `Pay ৳${total.toFixed(2)} via Gateway`
                    : `Pay ৳${total.toFixed(2)} & Place Order`}
            </button>

            <button onClick={() => navigate('/cart')} className="checkout-back-btn">
              ← Back to Cart
            </button>
          </div>
        </div>
      </div>

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default Checkout;
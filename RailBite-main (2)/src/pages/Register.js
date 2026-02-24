import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState('customer');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shake, setShake] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 600); };

  const validatePhone = (p) => /^(\+?880|0)?1[3-9]\d{8}$/.test(p.replace(/[-\s]/g, ''));

  const passwordChecks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'A number', ok: /\d/.test(password) },
    { label: 'Special character (!@#$%^&*)', ok: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
  ];

  const allPasswordChecksPass = passwordChecks.every(c => c.ok);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !password) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      triggerShake(); return;
    }
    if (!validatePhone(phone)) {
      setToast({ message: 'Please enter a valid Bangladeshi phone number', type: 'error' });
      triggerShake(); return;
    }
    if (!allPasswordChecksPass) {
      setToast({ message: 'Password must meet all 5 requirements below', type: 'error' });
      triggerShake(); return;
    }
    try {
      setLoading(true);
      const result = await register(fullName, email, phone, password, role);
      if (result.success) {
        setToast({ message: 'Registration successful!', type: 'success' });
        setTimeout(() => {
          if (role === 'delivery') { navigate('/delivery/login'); return; }
          const intended = localStorage.getItem('railbiteIntendedUrl');
          if (intended) { localStorage.removeItem('railbiteIntendedUrl'); navigate(intended); }
          else navigate('/order-selection');
        }, 1000);
      } else {
        setToast({ message: result.message || 'Registration failed', type: 'error' });
        triggerShake();
      }
    } catch {
      setToast({ message: 'An error occurred. Please try again.', type: 'error' });
      triggerShake();
    } finally { setLoading(false); }
  };

  return (
    <div className={`lg-page ${mounted ? 'lg-page--in' : ''}`}>
      <div className="lg-bg-orb lg-bg-orb--1" />
      <div className="lg-bg-orb lg-bg-orb--2" />
      <div className="lg-bg-orb lg-bg-orb--3" />

      <div className="lg-form-panel">
        <div className="lg-form-inner">
          <img src="/images/logo.png" alt="RailBite" className="lg-top-logo" onError={(e) => { e.target.style.display = 'none'; }} />

          <div className={`lg-card ${shake ? 'lg-card--shake' : ''}`}>
            <h2 className="lg-card__title">Create Account</h2>
            <p className="lg-card__sub">Join RailBite and order food on the go</p>

            <form onSubmit={handleSubmit} className="lg-form" autoComplete="off">
              {/* full name */}
              <div className={`lg-field ${focusedField === 'name' ? 'lg-field--focus' : ''}`} style={{ animationDelay: '0.1s' }}>
                <label className="lg-label">Full Name</label>
                <div className="lg-input-wrap">
                  <svg className="lg-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  <input className="lg-input" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} placeholder="Rashid Mostafa" required />
                </div>
              </div>

              {/* email */}
              <div className={`lg-field ${focusedField === 'email' ? 'lg-field--focus' : ''}`} style={{ animationDelay: '0.15s' }}>
                <label className="lg-label">Email Address</label>
                <div className="lg-input-wrap">
                  <svg className="lg-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg>
                  <input className="lg-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} placeholder="your.email@example.com" required />
                </div>
              </div>

              {/* phone */}
              <div className={`lg-field ${focusedField === 'phone' ? 'lg-field--focus' : ''}`} style={{ animationDelay: '0.2s' }}>
                <label className="lg-label">Phone Number</label>
                <div className="lg-input-wrap">
                  <svg className="lg-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                  <input className="lg-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)} placeholder="01898942731" required />
                </div>
              </div>

              {/* password */}
              <div className={`lg-field ${focusedField === 'password' ? 'lg-field--focus' : ''}`} style={{ animationDelay: '0.25s' }}>
                <label className="lg-label">Password</label>
                <div className="lg-input-wrap">
                  <svg className="lg-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                  <input className="lg-input" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} placeholder="Create a strong password" required />
                  <button type="button" className="lg-pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1} aria-label="Toggle password visibility">
                    {showPw ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="lg-pw-checks">
                    {passwordChecks.map((c, i) => (
                      <span key={i} className={`lg-pw-check ${c.ok ? 'lg-pw-check--ok' : ''}`}>
                        {c.ok ? '✓' : '○'} {c.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* role selector */}
              <div className="lg-field" style={{ animationDelay: '0.3s' }}>
                <label className="lg-label">Register as</label>
                <div className="lg-role-tabs">
                  {[
                    { key: 'customer', label: '👤 Customer' },
                    { key: 'delivery', label: '🚚 Delivery Staff' },
                  ].map((r) => (
                    <button key={r.key} type="button" className={`lg-role-tab ${role === r.key ? 'lg-role-tab--active' : ''}`} onClick={() => setRole(r.key)}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* submit */}
              <button type="submit" className="lg-submit" disabled={loading} style={{ animationDelay: '0.35s' }}>
                {loading ? <span className="lg-submit__spinner" /> : (
                  <>
                    Create Account
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </>
                )}
              </button>
            </form>

            <p className="lg-switch">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Register;

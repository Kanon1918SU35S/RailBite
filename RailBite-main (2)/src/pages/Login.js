import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import Toast from '../components/Toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [showPw, setShowPw] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shake, setShake] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resending, setResending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 600); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      triggerShake();
      return;
    }
    try {
      setLoading(true);
      const result = await login(email, password);
      if (result.success) {
        setToast({ message: 'Login successful!', type: 'success' });
        setTimeout(() => {
          const intended = localStorage.getItem('railbiteIntendedUrl');
          if (intended) { localStorage.removeItem('railbiteIntendedUrl'); navigate(intended); }
          else navigate('/order-selection');
        }, 1000);
      } else if (result.needsVerification) {
        setNeedsVerification(true);
        setVerificationEmail(result.email || email);
      } else {
        setToast({ message: result.message || 'Login failed', type: 'error' });
        triggerShake();
      }
    } catch {
      setToast({ message: 'An error occurred. Please try again.', type: 'error' });
      triggerShake();
    } finally { setLoading(false); }
  };

  return (
    <div className={`lg-page ${mounted ? 'lg-page--in' : ''}`}>
      {/* background orbs */}
      <div className="lg-bg-orb lg-bg-orb--1" />
      <div className="lg-bg-orb lg-bg-orb--2" />
      <div className="lg-bg-orb lg-bg-orb--3" />

      <div className="lg-form-panel">
        <div className="lg-form-inner">
          {/* top-center logo */}
          <img src="/images/logo.png" alt="RailBite" className="lg-top-logo" onError={(e) => { e.target.style.display = 'none'; }} />

          <div className={`lg-card ${shake ? 'lg-card--shake' : ''}`}>
            {needsVerification ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📧</div>
                <h2 className="lg-card__title">Email Not Verified</h2>
                <p className="lg-card__sub" style={{ marginBottom: '1.2rem' }}>
                  Please verify your email before logging in.<br />
                  <strong style={{ color: '#f97316' }}>{verificationEmail}</strong>
                </p>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Check your inbox (and spam folder) for the verification link we sent you.
                </p>
                <button
                  type="button"
                  className="lg-submit"
                  disabled={resending}
                  onClick={async () => {
                    try {
                      setResending(true);
                      await authAPI.resendVerification(verificationEmail);
                      setToast({ message: 'Verification email resent!', type: 'success' });
                    } catch {
                      setToast({ message: 'Failed to resend. Try again later.', type: 'error' });
                    } finally { setResending(false); }
                  }}
                  style={{ marginBottom: '1rem' }}
                >
                  {resending ? <span className="lg-submit__spinner" /> : 'Resend Verification Email'}
                </button>
                <p className="lg-switch">
                  <span style={{ cursor: 'pointer', color: '#f97316' }} onClick={() => setNeedsVerification(false)}>Back to Login</span>
                </p>
              </div>
            ) : (
            <>
            <h2 className="lg-card__title">Welcome back</h2>
            <p className="lg-card__sub">Sign in to continue your journey</p>

            <form onSubmit={handleSubmit} className="lg-form" autoComplete="off">
              {/* role selector */}
              <div className="lg-field" style={{ animationDelay: '0.1s' }}>
                <label className="lg-label">Login as</label>
                <div className="lg-role-tabs">
                  {[
                    { key: 'customer', label: '👤 Customer' },
                    { key: 'admin', label: '🛡️ Admin' },
                    { key: 'delivery', label: '🚚 Delivery' },
                  ].map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      className={`lg-role-tab ${role === r.key ? 'lg-role-tab--active' : ''}`}
                      onClick={() => {
                        setRole(r.key);
                        if (r.key === 'admin') navigate('/admin/login');
                        else if (r.key === 'delivery') navigate('/delivery/login');
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* email */}
              <div className={`lg-field ${focusedField === 'email' ? 'lg-field--focus' : ''}`} style={{ animationDelay: '0.2s' }}>
                <label className="lg-label">Email Address</label>
                <div className="lg-input-wrap">
                  <svg className="lg-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg>
                  <input
                    className="lg-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              {/* password */}
              <div className={`lg-field ${focusedField === 'password' ? 'lg-field--focus' : ''}`} style={{ animationDelay: '0.3s' }}>
                <div className="lg-label-row">
                  <label className="lg-label">Password</label>
                  <Link to="/forgot-password" className="lg-forgot">Forgot?</Link>
                </div>
                <div className="lg-input-wrap">
                  <svg className="lg-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                  <input
                    className="lg-input"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your password"
                    required
                  />
                  <button type="button" className="lg-pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1} aria-label="Toggle password visibility">
                    {showPw ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* submit */}
              <button type="submit" className="lg-submit" disabled={loading} style={{ animationDelay: '0.4s' }}>
                {loading ? (
                  <span className="lg-submit__spinner" />
                ) : (
                  <>
                    Sign In
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </>
                )}
              </button>
            </form>

            <p className="lg-switch">
              Don't have an account? <Link to="/register">Create one</Link>
            </p>
            </>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Login;





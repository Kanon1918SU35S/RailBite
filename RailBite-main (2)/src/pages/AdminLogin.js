import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { authAPI } from '../services/api';
import Toast from '../components/Toast';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shake, setShake] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { isAdminAuthenticated, adminLoginSuccess } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdminAuthenticated) navigate('/admin/dashboard');
  }, [isAdminAuthenticated, navigate]);

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
      const res = await authAPI.login({ email, password });
      if (res.data.success) {
        const { token, user } = res.data;
        if (user.role !== 'admin') {
          setToast({ message: 'Access denied. Not an administrator.', type: 'error' });
          triggerShake();
          setLoading(false);
          return;
        }
        localStorage.setItem('railbite_token', token);
        localStorage.setItem('railbite_user', JSON.stringify(user));
        if (adminLoginSuccess) adminLoginSuccess(user, token);
        setToast({ message: 'Welcome back, Admin!', type: 'success' });
        setTimeout(() => navigate('/admin/dashboard'), 800);
      } else {
        setToast({ message: res.data.message || 'Invalid credentials', type: 'error' });
        triggerShake();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Login failed', type: 'error' });
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
            <div className="lg-card__badge lg-card__badge--admin">🛡️ Administrator</div>
            <h2 className="lg-card__title">Admin Portal</h2>
            <p className="lg-card__sub">Secure access to the RailBite dashboard</p>

            <form onSubmit={handleSubmit} className="lg-form" autoComplete="off">
              {/* email */}
              <div className={`lg-field ${focusedField === 'email' ? 'lg-field--focus' : ''}`} style={{ animationDelay: '0.1s' }}>
                <label className="lg-label">Admin Email</label>
                <div className="lg-input-wrap">
                  <svg className="lg-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg>
                  <input
                    className="lg-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="admin@railbite.com"
                    required
                  />
                </div>
              </div>

              {/* password */}
              <div className={`lg-field ${focusedField === 'password' ? 'lg-field--focus' : ''}`} style={{ animationDelay: '0.2s' }}>
                <label className="lg-label">Password</label>
                <div className="lg-input-wrap">
                  <svg className="lg-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                  <input
                    className="lg-input"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter password"
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

              <button type="submit" className="lg-submit" disabled={loading} style={{ animationDelay: '0.3s' }}>
                {loading ? <span className="lg-submit__spinner" /> : (
                  <>
                    Sign In
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </>
                )}
              </button>
            </form>

            <p className="lg-switch" style={{ marginTop: '1.25rem' }}>
              Not an admin? <a href="/login">Customer Login</a>
            </p>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminLogin;

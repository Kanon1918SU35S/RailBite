import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import Toast from '../components/Toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authAPI.forgotPassword(email);

      if (res.data.success) {
        setEmailSent(true);
      } else {
        setToast({ message: res.data.message || 'Failed to send reset email', type: 'error' });
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message || 'Error sending reset request',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Show email-sent screen after successful request
  if (emailSent) {
    return (
      <div className="status-page">
        <div className="status-container">
          <div className="status-icon warning">📧</div>
          <h2 className="status-title">Check Your Email</h2>
          <p className="status-message">
            We've sent a password reset link to:<br />
            <strong style={{ color: 'var(--primary-orange)' }}>{email}</strong>
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: '8px',
            padding: '1rem',
            margin: '1.5rem 0',
            fontSize: '0.9rem',
            color: '#9ca3af',
            lineHeight: 1.6,
            textAlign: 'center'
          }}>
            Click the link in the email to reset your password.<br />
            The link is valid for <strong style={{ color: '#fff' }}>1 hour</strong>.<br />
            Check your spam folder if you don't see it.
          </div>

          <button
            className="btn btn-primary btn-block"
            onClick={() => { setEmailSent(false); setEmail(''); }}
          >
            Try Another Email
          </button>

          <Link
            to="/login"
            className="btn btn-secondary btn-block"
            style={{ marginTop: '1rem' }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="hero-content">
            <img
              src="/images/logo.png"
              alt="RailBite Logo"
              style={{ width: '135px', height: '45px', display: 'block', margin: '0 auto' }}
            />
          </div>
          <p style={{ color: 'var(--text-gray)' }}>Bangladesh Railway Food Service</p>
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Forgot Password?</h2>
        <p style={{ color: 'var(--text-gray)', marginBottom: '2rem' }}>
          Enter your email address and we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div
            className="back-link"
            onClick={() => navigate('/login')}
            style={{ cursor: 'pointer', marginTop: '1rem', textAlign: 'center' }}
          >
            <span>← Back to Login</span>
          </div>
        </form>
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
};

export default ForgotPassword;

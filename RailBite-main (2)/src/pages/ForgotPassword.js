import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import Toast from '../components/Toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authAPI.forgotPassword(email);

      if (res.data.success) {
        setResetToken(res.data.resetToken);
      } else {
        setToast({ message: res.data.message || 'Failed to generate reset token', type: 'error' });
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

  // Show token screen after successful request
  if (resetToken) {
    return (
      <div className="status-page">
        <div className="status-container">
          <div className="status-icon warning">🔑</div>
          <h2 className="status-title">Reset Token Generated</h2>
          <p className="status-message">
            Use this token to reset your password for:<br />
            <strong style={{ color: 'var(--primary-orange)' }}>{email}</strong>
          </p>

          {/* Token display box */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--primary-orange)',
            borderRadius: '8px',
            padding: '1rem',
            margin: '1.5rem 0',
            wordBreak: 'break-all',
            fontSize: '0.85rem',
            color: '#fff',
            textAlign: 'left'
          }}>
            <p style={{ color: 'var(--text-gray)', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
              YOUR RESET TOKEN (valid for 1 hour):
            </p>
            <strong>{resetToken}</strong>
          </div>

          <button
            className="btn btn-primary btn-block"
            onClick={() => navigate('/reset-password', { state: { token: resetToken, email } })}
          >
            Continue to Reset Password
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
          Enter your email address and we'll generate a reset token for you.
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
            {loading ? 'Generating...' : 'Get Reset Token'}
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

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying | success | error | expired
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  const verify = useCallback(async () => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    try {
      const res = await authAPI.verifyEmail(token);
      if (res.data.success) {
        setStatus('success');
        setMessage(res.data.message);

        // Auto-login the user
        if (res.data.token && res.data.user) {
          localStorage.setItem('railbiteToken', res.data.token);
          localStorage.setItem('railbiteUser', JSON.stringify(res.data.user));
          // Redirect after a short delay
          setTimeout(() => navigate('/order-selection'), 3000);
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Verification failed';
      if (errMsg.toLowerCase().includes('expired')) {
        setStatus('expired');
      } else {
        setStatus('error');
      }
      setMessage(errMsg);
    }
  }, [token, navigate]);

  useEffect(() => {
    verify();
  }, [verify]);

  const handleResend = async () => {
    if (!resendEmail.trim()) {
      setToast({ message: 'Please enter your email address', type: 'error' });
      return;
    }
    setResending(true);
    try {
      const res = await authAPI.resendVerification(resendEmail.trim());
      if (res.data.success) {
        setToast({ message: res.data.message, type: 'success' });
      } else {
        setToast({ message: res.data.message || 'Failed to resend', type: 'error' });
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Failed to resend verification email',
        type: 'error'
      });
    } finally {
      setResending(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#111',
    padding: '2rem'
  };

  const cardStyle = {
    background: '#1a1a2e',
    borderRadius: '16px',
    padding: '3rem 2.5rem',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    border: '1px solid #2a2a3e'
  };

  const iconStyle = {
    fontSize: '4rem',
    marginBottom: '1.5rem',
    display: 'block'
  };

  const titleStyle = {
    color: '#fff',
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '0.75rem'
  };

  const msgStyle = {
    color: '#aaa',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    marginBottom: '1.5rem'
  };

  const btnStyle = {
    display: 'inline-block',
    padding: '12px 28px',
    background: '#e87e1e',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background 0.2s'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: '#222',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.9rem',
    marginBottom: '1rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Verifying */}
        {status === 'verifying' && (
          <>
            <div style={iconStyle}>⏳</div>
            <h2 style={titleStyle}>Verifying Your Email...</h2>
            <p style={msgStyle}>
              Please wait while we verify your email address.
            </p>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #333',
              borderTop: '4px solid #e87e1e',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <div style={iconStyle}>✅</div>
            <h2 style={titleStyle}>Email Verified!</h2>
            <p style={msgStyle}>{message}</p>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              You'll be redirected to the app in a few seconds...
            </p>
            <Link to="/order-selection" style={btnStyle}>
              🍔 Start Ordering
            </Link>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <div style={iconStyle}>❌</div>
            <h2 style={titleStyle}>Verification Failed</h2>
            <p style={msgStyle}>{message}</p>
            <Link to="/login" style={btnStyle}>
              Back to Login
            </Link>
          </>
        )}

        {/* Expired */}
        {status === 'expired' && (
          <>
            <div style={iconStyle}>⏰</div>
            <h2 style={titleStyle}>Link Expired</h2>
            <p style={msgStyle}>
              {message}<br />
              Enter your email below to receive a new verification link.
            </p>

            <input
              type="email"
              placeholder="your.email@example.com"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={handleResend}
              disabled={resending}
              style={{ ...btnStyle, width: '100%', marginBottom: '1rem' }}
            >
              {resending ? 'Sending...' : '📧 Resend Verification Email'}
            </button>
            <br />
            <Link to="/login" style={{ color: '#e87e1e', fontSize: '0.9rem' }}>
              ← Back to Login
            </Link>
          </>
        )}
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

export default VerifyEmail;

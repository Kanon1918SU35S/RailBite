import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import Toast from '../components/Toast';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Read token from URL query params (?token=xxx) or from navigation state
  const urlToken = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('token') || '';
  }, [location.search]);

  const [token, setToken] = useState(urlToken || location.state?.token || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }

    if (!allPasswordChecksPass) {
      setToast({ message: 'Password must meet all 5 requirements below', type: 'error' });
      return;
    }

    if (!token.trim()) {
      setToast({ message: 'Please enter your reset token', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.resetPassword(token.trim(), newPassword);

      if (res.data.success) {
        setToast({ message: 'Password reset successful! Redirecting to login...', type: 'success' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setToast({ message: res.data.message || 'Reset failed', type: 'error' });
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message || 'Reset failed',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)
  };

  const allPasswordChecksPass = Object.values(passwordChecks).every(Boolean);

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

        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Reset Password</h2>
        <p style={{ color: 'var(--text-gray)', marginBottom: '2rem' }}>
          {token ? 'Enter your new password below.' : 'Enter your reset token and new password below.'}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Token field - hidden when pre-filled from email link */}
          {!urlToken && (
          <div className="form-group">
            <label>Reset Token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your reset token here"
              required
            />
          </div>
          )}

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />
          </div>

          <div className="password-requirements">
            <p><strong>Password must contain:</strong></p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{
                color: passwordChecks.length ? '#28a745' : 'var(--text-gray)',
                listStyle: 'none',
                paddingLeft: 0,
                marginBottom: '4px'
              }}>
                {passwordChecks.length ? '✅' : '○'} At least 8 characters
              </li>
              <li style={{
                color: passwordChecks.uppercase ? '#28a745' : 'var(--text-gray)',
                listStyle: 'none',
                paddingLeft: 0,
                marginBottom: '4px'
              }}>
                {passwordChecks.uppercase ? '✅' : '○'} One uppercase letter
              </li>
              <li style={{
                color: passwordChecks.lowercase ? '#28a745' : 'var(--text-gray)',
                listStyle: 'none',
                paddingLeft: 0,
                marginBottom: '4px'
              }}>
                {passwordChecks.lowercase ? '✅' : '○'} One lowercase letter
              </li>
              <li style={{
                color: passwordChecks.number ? '#28a745' : 'var(--text-gray)',
                listStyle: 'none',
                paddingLeft: 0,
                marginBottom: '4px'
              }}>
                {passwordChecks.number ? '✅' : '○'} One number
              </li>
              <li style={{
                color: passwordChecks.special ? '#28a745' : 'var(--text-gray)',
                listStyle: 'none',
                paddingLeft: 0,
                marginBottom: '4px'
              }}>
                {passwordChecks.special ? '✅' : '○'} One special character (!@#$%^&*)
              </li>
            </ul>
          </div>


          <button
            type="submit" className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <div
            style={{ cursor: 'pointer', marginTop: '1rem', textAlign: 'center' }}
            onClick={() => navigate('/forgot-password')}
          >
            <span style={{ color: 'var(--text-gray)' }}>← Back to Forgot Password</span>
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

export default ResetPassword;


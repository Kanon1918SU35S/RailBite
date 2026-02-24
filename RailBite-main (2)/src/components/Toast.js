import React, { useEffect, useState } from 'react';

const ICONS = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <path d="M6 10.5l2.5 2.5L14 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3L1.5 17h17L10 3z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M10 8v4M10 14v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <path d="M10 9v5M10 6v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

const Toast = ({ message, type = 'success', onClose }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const autoClose = setTimeout(() => dismiss(), 3000);
    return () => clearTimeout(autoClose);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => onClose(), 350);
  };

  return (
    <div className={`toast toast--modern ${type} ${exiting ? 'toast--exit' : ''}`} onClick={dismiss}>
      <span className="toast__icon">{ICONS[type] || ICONS.info}</span>
      <span className="toast__msg">{message}</span>
      <span className="toast__progress" />
    </div>
  );
};

export default Toast;
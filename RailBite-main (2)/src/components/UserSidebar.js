import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const UserSidebar = ({ isOpen, onClose }) => {
    const { user, isAuthenticated, logout } = useAuth();
    const { getCartCount } = useCart();
    const navigate = useNavigate();

    // Lock body scroll when sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close sidebar on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleNavigate = (path) => {
        navigate(path);
        onClose();
    };

    const handleLogout = () => {
        logout();
        onClose();
        navigate('/');
    };

    const cartCount = getCartCount();

    return (
        <>
            {/* Overlay */}
            <div
                className={`user-sidebar-overlay ${isOpen ? 'active' : ''}`}
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <aside className={`user-sidebar ${isOpen ? 'active' : ''}`}>

                {/* Close button */}
                <button className="user-sidebar-close" onClick={onClose} aria-label="Close sidebar">
                    ✕
                </button>

                {/* User Info Header */}
                <div className="user-sidebar-header">
                    {isAuthenticated() && user ? (
                        <>
                            <div className="user-sidebar-avatar">
                                {(user.name || 'U')[0].toUpperCase()}
                            </div>
                            <div className="user-sidebar-user-info">
                                <p className="user-sidebar-name">{user.name || 'User'}</p>
                                <p className="user-sidebar-email">{user.email || ''}</p>
                            </div>
                        </>
                    ) : (
                        <div className="user-sidebar-guest">
                            <div className="user-sidebar-avatar">G</div>
                            <p className="user-sidebar-name">Guest</p>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="user-sidebar-divider" />

                {/* Navigation Links */}
                <nav className="user-sidebar-nav">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) => `user-sidebar-link ${isActive ? 'active' : ''}`}
                        onClick={onClose}
                    >
                        <span className="user-sidebar-icon">🏠</span>
                        <span>Home</span>
                    </NavLink>

                    <NavLink
                        to="/about"
                        className={({ isActive }) => `user-sidebar-link ${isActive ? 'active' : ''}`}
                        onClick={onClose}
                    >
                        <span className="user-sidebar-icon">ℹ️</span>
                        <span>About Us</span>
                    </NavLink>

                    <NavLink
                        to="/contact"
                        className={({ isActive }) => `user-sidebar-link ${isActive ? 'active' : ''}`}
                        onClick={onClose}
                    >
                        <span className="user-sidebar-icon">📞</span>
                        <span>Contact</span>
                    </NavLink>

                    {isAuthenticated() && (
                        <>
                            <div className="user-sidebar-divider" />
                            <p className="user-sidebar-section-title">Orders & Food</p>

                            <NavLink
                                to="/menu-categories"
                                className={({ isActive }) => `user-sidebar-link ${isActive ? 'active' : ''}`}
                                onClick={onClose}
                            >
                                <span className="user-sidebar-icon">🍽️</span>
                                <span>Menu</span>
                            </NavLink>

                            <button className="user-sidebar-link" onClick={() => handleNavigate('/cart')}>
                                <span className="user-sidebar-icon">🛒</span>
                                <span>Cart</span>
                                {cartCount > 0 && (
                                    <span className="user-sidebar-badge">{cartCount}</span>
                                )}
                            </button>

                            <NavLink
                                to="/order-history"
                                className={({ isActive }) => `user-sidebar-link ${isActive ? 'active' : ''}`}
                                onClick={onClose}
                            >
                                <span className="user-sidebar-icon">📦</span>
                                <span>My Orders</span>
                            </NavLink>

                            <NavLink
                                to="/notifications"
                                className={({ isActive }) => `user-sidebar-link ${isActive ? 'active' : ''}`}
                                onClick={onClose}
                            >
                                <span className="user-sidebar-icon">🔔</span>
                                <span>Notifications</span>
                            </NavLink>

                            <div className="user-sidebar-divider" />
                            <p className="user-sidebar-section-title">Account</p>

                            <NavLink
                                to="/profile"
                                className={({ isActive }) => `user-sidebar-link ${isActive ? 'active' : ''}`}
                                onClick={onClose}
                            >
                                <span className="user-sidebar-icon">👤</span>
                                <span>My Profile</span>
                            </NavLink>
                        </>
                    )}
                </nav>

                {/* Footer */}
                <div className="user-sidebar-footer">
                    {isAuthenticated() ? (
                        <button className="user-sidebar-logout" onClick={handleLogout}>
                            <span className="user-sidebar-icon">🚪</span>
                            <span>Logout</span>
                        </button>
                    ) : (
                        <button
                            className="user-sidebar-login-btn"
                            onClick={() => handleNavigate('/login')}
                        >
                            Login / Register
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
};

export default UserSidebar;

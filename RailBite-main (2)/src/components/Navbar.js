import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import NotificationBell from './NotificationBell';
import UserSidebar from './UserSidebar';
import LoyaltyPointsBadge from './LoyaltyPointsBadge';

const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = () => {
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <>
      <nav className={`navbar navbar-3d ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="nav-wrapper">

            {/* Logo with 3D hover */}
            <div className="logo logo-3d" onClick={handleLogoClick}>
              <img
                src="/images/logo.png"
                alt="RailBite Logo"
                style={{ width: '135px', height: '45px', objectFit: 'contain', cursor: 'pointer' }}
              />
            </div>

            {/* Navigation Menu (desktop only) */}
            <ul className="nav-menu" id="navMenu">
              <li>
                <Link to="/" className={`nav-link-3d ${isActive('/') ? 'active' : ''}`}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className={`nav-link-3d ${isActive('/about') ? 'active' : ''}`}>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className={`nav-link-3d ${isActive('/contact') ? 'active' : ''}`}>
                  Contact
                </Link>
              </li>
              {isAuthenticated() && (
                <li>
                  <Link
                    to="/order-history"
                    className={`nav-link-3d ${isActive('/order-history') ? 'active' : ''}`}
                  >
                    My Orders
                  </Link>
                </li>
              )}
              {!isAuthenticated() && (
                <li id="authNavItem">
                  <Link to="/login" className="btn-nav-orange btn-3d">
                    Login / Register
                  </Link>
                </li>
              )}
            </ul>


            {/* Right Side Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {isAuthenticated() && (
                <>
                  {/* Loyalty Points Badge */}
                  <LoyaltyPointsBadge />

                  {/* Notification Bell */}
                  <NotificationBell />

                  {/* Cart Icon */}
                  <div
                    className="cart-icon"
                    onClick={() => navigate('/cart')}
                    style={{ position: 'relative', cursor: 'pointer' }}
                  >
                    <img
                      src="/images/shopping-cart.png"
                      alt="Cart"
                      style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                    />
                    {getCartCount() > 0 && (
                      <span className="cart-badge" id="cartCount">
                        {getCartCount()}
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Sidebar Toggle - always visible */}
              <button
                className="sidebar-toggle-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Open menu"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* User Sidebar */}
      <UserSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
    </>
  );
};

export default Navbar;

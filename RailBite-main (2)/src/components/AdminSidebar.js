import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

const AdminSidebar = () => {
  const { adminLogout, adminUser } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = () => {
    adminLogout();
    navigate('/');
  };

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-header">
        <h2>Admin Panel</h2>
      </div>

      <div className="admin-user-info">
        <div className="admin-user-details">
          <p className="admin-user-name">{adminUser?.name || 'Admin'}</p>
          <p className="admin-user-role">{adminUser?.role || 'Administrator'}</p>
        </div>
      </div>

      <nav className="admin-nav">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
        >
          <span className="admin-nav-icon">📊</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/menu"
          className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
        >
          <span className="admin-nav-icon">🍽️</span>
          <span>Menu Management</span>
        </NavLink>

        <NavLink
          to="/admin/orders"
          className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
        >
          <span className="admin-nav-icon">📦</span>
          <span>Orders</span>
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
        >
          <span className="admin-nav-icon">👥</span>
          <span>Users</span>
        </NavLink>

        <NavLink
          to="/admin/delivery"
          className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
        >
          <span className="admin-nav-icon">🚚</span>
          <span>Delivery Staff</span>
        </NavLink>

        <NavLink
          to="/admin/reports"
          className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
        >
          <span className="admin-nav-icon">📈</span>
          <span>Reports</span>
        </NavLink>

        <NavLink
          to="/admin/notifications"
          className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
        >
          <span className="admin-nav-icon">🔔</span>
          <span>Notifications</span>
        </NavLink>

        {/* 👉 add this: */}
        <NavLink
          to="/admin/contact-messages"
          className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
        >
          <span className="admin-nav-icon">📩</span>
          <span>Contact Messages</span>
        </NavLink>

        <NavLink
          to="/admin/reviews"
          className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
        >
          <span className="admin-nav-icon">⭐</span>
          <span>Reviews</span>
        </NavLink>

        <NavLink
          to="/admin/coupons"
          className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
        >
          <span className="admin-nav-icon">🎟️</span>
          <span>Coupons</span>
        </NavLink>
      </nav>

      <div className="admin-sidebar-footer">
        <button onClick={handleLogout} className="admin-logout-btn">
          <span className="admin-nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDeliveryStaff } from '../context/DeliveryStaffContext';

const DeliveryStaffSidebar = () => {
    const { staffLogout, staffUser } = useDeliveryStaff();
    const navigate = useNavigate();

    const handleLogout = () => {
        staffLogout();
        navigate('/');
    };

    return (
        <div className="admin-sidebar ds-sidebar">
            <div className="admin-sidebar-header">
                <h2>Delivery Portal</h2>
            </div>

            <div className="admin-user-info">
                <div className="admin-user-details">
                    <p className="admin-user-name">{staffUser?.name || 'Delivery Staff'}</p>
                    <p className="admin-user-role">Delivery Partner</p>
                </div>
            </div>

            <nav className="admin-nav">
                <NavLink
                    to="/delivery/dashboard"
                    className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
                >
                    <span className="admin-nav-icon">📊</span>
                    <span>Dashboard</span>
                </NavLink>

                <NavLink
                    to="/delivery/my-orders"
                    className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
                >
                    <span className="admin-nav-icon">📦</span>
                    <span>My Deliveries</span>
                </NavLink>

                <NavLink
                    to="/delivery/active"
                    className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
                >
                    <span className="admin-nav-icon">🚚</span>
                    <span>Active Delivery</span>
                </NavLink>

                <NavLink
                    to="/delivery/history"
                    className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
                >
                    <span className="admin-nav-icon">📋</span>
                    <span>Delivery History</span>
                </NavLink>

                <NavLink
                    to="/delivery/profile"
                    className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
                >
                    <span className="admin-nav-icon">👤</span>
                    <span>My Profile</span>
                </NavLink>

                <NavLink
                    to="/delivery/notifications"
                    className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
                >
                    <span className="admin-nav-icon">🔔</span>
                    <span>Notifications</span>
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

export default DeliveryStaffSidebar;

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

const AdminProtectedRoute = ({ children }) => {
  const { isAdminAuthenticated, adminUser } = useAdmin();

  // Not authenticated at all
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Authenticated but not admin role
  if (adminUser?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminProtectedRoute;

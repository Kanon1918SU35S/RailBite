import React from 'react';
import { Navigate } from 'react-router-dom';
import { useDeliveryStaff } from '../context/DeliveryStaffContext';

const DeliveryStaffProtectedRoute = ({ children }) => {
    const { isStaffAuthenticated, staffUser } = useDeliveryStaff();

    if (!isStaffAuthenticated) {
        return <Navigate to="/delivery/login" replace />;
    }

    if (staffUser?.role !== 'delivery') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default DeliveryStaffProtectedRoute;

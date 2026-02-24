import React, { createContext, useContext, useState, useEffect } from 'react';

const DeliveryStaffContext = createContext();

export const useDeliveryStaff = () => useContext(DeliveryStaffContext);

export const DeliveryStaffProvider = ({ children }) => {
    const [staffUser, setStaffUser] = useState(null);
    const [isStaffAuthenticated, setIsStaffAuthenticated] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('railbite_delivery_user');
        const storedToken = localStorage.getItem('railbite_delivery_token');
        if (storedUser && storedToken) {
            const parsed = JSON.parse(storedUser);
            if (parsed.role === 'delivery') {
                setStaffUser(parsed);
                setIsStaffAuthenticated(true);
            } else {
                localStorage.removeItem('railbite_delivery_token');
                localStorage.removeItem('railbite_delivery_user');
            }
        }
    }, []);

    const staffLoginSuccess = (user, token) => {
        if (user.role !== 'delivery') {
            return { success: false, message: 'Access denied. Delivery staff only.' };
        }
        localStorage.setItem('railbite_delivery_token', token);
        localStorage.setItem('railbite_delivery_user', JSON.stringify(user));
        setStaffUser(user);
        setIsStaffAuthenticated(true);
        return { success: true };
    };

    const staffLogout = () => {
        localStorage.removeItem('railbite_delivery_token');
        localStorage.removeItem('railbite_delivery_user');
        setStaffUser(null);
        setIsStaffAuthenticated(false);
    };

    const getToken = () => localStorage.getItem('railbite_delivery_token');

    return (
        <DeliveryStaffContext.Provider
            value={{
                staffUser,
                isStaffAuthenticated,
                staffLoginSuccess,
                staffLogout,
                getToken
            }}
        >
            {children}
        </DeliveryStaffContext.Provider>
    );
};

import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('railbite_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      // 👇 Only allow admin role
      if (parsed.role === 'admin') {
        setAdminUser(parsed);
        setIsAdminAuthenticated(true);
      } else {
        // Clear any non-admin data
        localStorage.removeItem('railbite_token');
        localStorage.removeItem('railbite_user');
      }
    }
  }, []);

  const adminLoginSuccess = (user, token) => {
    // 👇 Only allow admin role
    if (user.role !== 'admin') {
      return { success: false, message: 'Access denied. Admin only.' };
    }
    setAdminUser(user);
    setIsAdminAuthenticated(true);
    return { success: true };
  };

  const adminLogout = () => {
    localStorage.removeItem('railbite_token');
    localStorage.removeItem('railbite_user');
    setAdminUser(null);
    setIsAdminAuthenticated(false);
  };

  return (
    <AdminContext.Provider
      value={{
        adminUser,
        isAdminAuthenticated,
        adminLoginSuccess,
        adminLogout
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

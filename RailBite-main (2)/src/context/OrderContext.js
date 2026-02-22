import React, { createContext, useState, useContext, useEffect } from 'react';

const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [orderHistory, setOrderHistory] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderType, setOrderType] = useState('train');
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    // Load order type
    const storedOrderType = localStorage.getItem('railbiteOrderType');
    if (storedOrderType) {
      setOrderType(storedOrderType);
    }

    // Load booking details
    const storedBooking = localStorage.getItem('railbiteBooking');
    if (storedBooking) {
      setBookingDetails(JSON.parse(storedBooking));
    }

    // Optional: load last order from localStorage for quick display
    const lastOrder = localStorage.getItem('railbiteLastOrder');
    if (lastOrder) {
      setCurrentOrder(JSON.parse(lastOrder));
    }
  }, []);

  // Called from OrderTrain / OrderStation
  const saveOrderType = (type) => {
    setOrderType(type);
    localStorage.setItem('railbiteOrderType', type);
  };

  const saveBookingDetails = (details) => {
    setBookingDetails(details);
    localStorage.setItem('railbiteBooking', JSON.stringify(details));
  };

  /**
   * addOrder will be called after a successful backend POST /api/orders.
   * You pass the created order (from backend) into this, so the context
   * can keep latest order & local history for UI convenience.
   */
  const addOrder = (orderFromBackend) => {
    if (!orderFromBackend) return null;

    const newOrder = {
      ...orderFromBackend,
      id: orderFromBackend.orderId || orderFromBackend.id, // for compatibility
      date: orderFromBackend.createdAt || new Date().toISOString(),
    };

    const updatedHistory = [newOrder, ...orderHistory];
    setOrderHistory(updatedHistory);
    localStorage.setItem('railbiteOrderHistory', JSON.stringify(updatedHistory));

    setCurrentOrder(newOrder);
    localStorage.setItem('railbiteLastOrder', JSON.stringify(newOrder));

    return newOrder;
  };

  const setOrdersFromBackend = (ordersArray) => {
    // helper to set full history when you fetch from GET /api/orders
    setOrderHistory(ordersArray || []);
    localStorage.setItem('railbiteOrderHistory', JSON.stringify(ordersArray || []));
  };

  const getOrderById = (orderId) => {
    return orderHistory.find((order) => order.orderId === orderId || order.id === orderId);
  };

  const value = {
    orderHistory,
    currentOrder,
    orderType,
    bookingDetails,
    saveOrderType,
    saveBookingDetails,
    addOrder,              // use after POST /api/orders
    setOrdersFromBackend,  // use after GET /api/orders
    getOrderById,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const authAPI = {
  login: (data) => axios.post(`${API_BASE_URL}/auth/login`, data),
  register: (data) => axios.post(`${API_BASE_URL}/auth/register`, data),
  getMe: (token) =>
    axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  forgotPassword: (email) =>
    axios.post(`${API_BASE_URL}/auth/forgot-password`, { email }),
  resetPassword: (token, newPassword) =>
    axios.post(`${API_BASE_URL}/auth/reset-password`, { token, newPassword }),
  verifyEmail: (token) =>
    axios.get(`${API_BASE_URL}/auth/verify-email/${token}`),
  resendVerification: (email) =>
    axios.post(`${API_BASE_URL}/auth/resend-verification`, { email })
};


export const dashboardAPI = {
  getStats: (token) =>
    axios.get(`${API_BASE_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const orderAPI = {
  getAll: (token) =>
    axios.get(`${API_BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getRecent: (token, limit = 5) =>
    axios.get(`${API_BASE_URL}/orders/recent?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getMyOrders: (token) =>
    axios.get(`${API_BASE_URL}/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getById: (id, token) =>
    axios.get(`${API_BASE_URL}/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  create: (data, token) =>
    axios.post(`${API_BASE_URL}/orders`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  updateStatus: (id, payload, token) =>
    axios.patch(`${API_BASE_URL}/orders/${id}/status`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  cancel: (id, token) =>
    axios.patch(`${API_BASE_URL}/orders/${id}/cancel`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  assignStaff: (orderId, staffId, token) =>
    axios.post(`${API_BASE_URL}/orders/${orderId}/assign`, { staffId }, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getAssignmentStats: (token) =>
    axios.get(`${API_BASE_URL}/orders/assignment-stats`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  reorder: (id, token) =>
    axios.post(`${API_BASE_URL}/orders/${id}/reorder`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
};


// 👉 add this:
export const menuAPI = {
  getAll: (params) =>
    axios.get(`${API_BASE_URL}/menu`, { params }),

  getBySection: (section) =>
    axios.get(`${API_BASE_URL}/menu/section/${section}`),

  getByCategory: (category, section) => {
    const params = section ? { section } : {};
    return axios.get(`${API_BASE_URL}/menu/category/${category}`, { params });
  },

  create: (data, token) =>
    axios.post(`${API_BASE_URL}/menu`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    }),

  update: (id, data, token) =>
    axios.put(`${API_BASE_URL}/menu/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    }),

  delete: (id, token) =>
    axios.delete(`${API_BASE_URL}/menu/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  toggleAvailability: (id, available, token) =>
    axios.put(`${API_BASE_URL}/menu/${id}`, { available }, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  bulkDelete: (ids, token) =>
    axios.post(`${API_BASE_URL}/menu/bulk-delete`, { ids }, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  bulkToggleAvailability: (ids, available, token) =>
    axios.put(`${API_BASE_URL}/menu/bulk-availability`, { ids, available }, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const userAPI = {
  getAll: (token) =>
    axios.get(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  create: (data, token) =>
    axios.post(`${API_BASE_URL}/users`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  updateProfile: (data, token) =>
    axios.put(`${API_BASE_URL}/users/profile`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  update: (id, data, token) =>
    axios.put(`${API_BASE_URL}/users/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  toggleStatus: (id, token) =>
    axios.patch(`${API_BASE_URL}/users/${id}/toggle-status`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  delete: (id, token) =>
    axios.delete(`${API_BASE_URL}/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};


export const deliveryStaffAPI = {
  getAll: (token) =>
    axios.get(`${API_BASE_URL}/delivery-staff`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  getAvailable: (token) =>
    axios.get(`${API_BASE_URL}/delivery-staff/available`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  create: (data, token) =>
    axios.post(`${API_BASE_URL}/delivery-staff`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  update: (id, data, token) =>
    axios.put(`${API_BASE_URL}/delivery-staff/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  delete: (id, token) =>
    axios.delete(`${API_BASE_URL}/delivery-staff/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const reportAPI = {
  get: (range, token) =>
    axios.get(`${API_BASE_URL}/reports?range=${range}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  getPopularItems: (token) =>
    axios.get(`${API_BASE_URL}/reports/popular-items`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const notificationAPI = {
  // Get my notifications (any authenticated user)
  getMyNotifications: (token) =>
    axios.get(`${API_BASE_URL}/notifications/my`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Get unread count (any authenticated user)
  getUnreadCount: (token) =>
    axios.get(`${API_BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Mark single notification as read
  markAsRead: (id, token) =>
    axios.patch(`${API_BASE_URL}/notifications/${id}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Mark all as read
  markAllAsRead: (token) =>
    axios.patch(`${API_BASE_URL}/notifications/read-all`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Admin: get all notifications
  getAll: (token) =>
    axios.get(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Admin: send broadcast notification
  send: (data, token) =>
    axios.post(`${API_BASE_URL}/notifications`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Admin: delete notification
  delete: (id, token) =>
    axios.delete(`${API_BASE_URL}/notifications/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

// Delivery Staff Portal API
export const deliveryPortalAPI = {
  getMyStats: (token) =>
    axios.get(`${API_BASE_URL}/delivery-portal/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getMyActiveOrders: (token) =>
    axios.get(`${API_BASE_URL}/delivery-portal/active-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getActiveDelivery: (token) =>
    axios.get(`${API_BASE_URL}/delivery-portal/active-delivery`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getMyOrders: (token) =>
    axios.get(`${API_BASE_URL}/delivery-portal/my-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getMyHistory: (token, range = 'today') =>
    axios.get(`${API_BASE_URL}/delivery-portal/history?range=${range}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getOrderDetail: (id, token) =>
    axios.get(`${API_BASE_URL}/delivery-portal/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  updateDeliveryStatus: (id, data, token) =>
    axios.patch(`${API_BASE_URL}/delivery-portal/orders/${id}/status`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getMyProfile: (token) =>
    axios.get(`${API_BASE_URL}/delivery-portal/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  updateMyProfile: (data, token) =>
    axios.put(`${API_BASE_URL}/delivery-portal/profile`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const contactAPI = {
  send: (data, token) =>
    axios.post(`${API_BASE_URL}/contact`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getAll: (token) =>
    axios.get(`${API_BASE_URL}/contact`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  updateStatus: (id, status, token) =>
    axios.patch(`${API_BASE_URL}/contact/${id}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  delete: (id, token) =>
    axios.delete(`${API_BASE_URL}/contact/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const reviewAPI = {
  create: (data, token) =>
    axios.post(`${API_BASE_URL}/reviews`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getByOrder: (orderId, token) =>
    axios.get(`${API_BASE_URL}/reviews/order/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getMyReviews: (token) =>
    axios.get(`${API_BASE_URL}/reviews/my-reviews`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getAll: (token) =>
    axios.get(`${API_BASE_URL}/reviews`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getPublic: () =>
    axios.get(`${API_BASE_URL}/reviews/public`),

  getStats: (token) =>
    axios.get(`${API_BASE_URL}/reviews/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  delete: (id, token) =>
    axios.delete(`${API_BASE_URL}/reviews/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  approve: (id, token) =>
    axios.put(`${API_BASE_URL}/reviews/${id}/approve`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  reject: (id, token) =>
    axios.put(`${API_BASE_URL}/reviews/${id}/reject`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

// ── Coupon / Promo Code API ──
export const couponAPI = {
  validate: (data, token) =>
    axios.post(`${API_BASE_URL}/coupons/validate`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  apply: (data, token) =>
    axios.post(`${API_BASE_URL}/coupons/apply`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Admin
  getAll: (token) =>
    axios.get(`${API_BASE_URL}/coupons`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getStats: (token) =>
    axios.get(`${API_BASE_URL}/coupons/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  create: (data, token) =>
    axios.post(`${API_BASE_URL}/coupons`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  update: (id, data, token) =>
    axios.put(`${API_BASE_URL}/coupons/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  delete: (id, token) =>
    axios.delete(`${API_BASE_URL}/coupons/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

// ── Payment Gateway API ──
export const paymentAPI = {
  initiate: (data, token) =>
    axios.post(`${API_BASE_URL}/payments/initiate`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  confirmDev: (data, token) =>
    axios.post(`${API_BASE_URL}/payments/confirm-dev`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getByOrder: (orderId, token) =>
    axios.get(`${API_BASE_URL}/payments/order/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Admin
  getAll: (token) =>
    axios.get(`${API_BASE_URL}/payments`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

// ── Train Info API ──
export const trainAPI = {
  search: (query, token) =>
    axios.get(`${API_BASE_URL}/trains/search?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getByNumber: (trainNumber, token) =>
    axios.get(`${API_BASE_URL}/trains/${trainNumber}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getStations: (trainNumber, token) =>
    axios.get(`${API_BASE_URL}/trains/${trainNumber}/stations`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Admin
  getAll: (token) =>
    axios.get(`${API_BASE_URL}/trains`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  create: (data, token) =>
    axios.post(`${API_BASE_URL}/trains`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  update: (id, data, token) =>
    axios.put(`${API_BASE_URL}/trains/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  delete: (id, token) =>
    axios.delete(`${API_BASE_URL}/trains/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

// ── Loyalty Points API ──
export const loyaltyAPI = {
  getMyPoints: (token) =>
    axios.get(`${API_BASE_URL}/loyalty/my-points`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getHistory: (token) =>
    axios.get(`${API_BASE_URL}/loyalty/history`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  redeem: (data, token) =>
    axios.post(`${API_BASE_URL}/loyalty/redeem`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Admin
  getAll: (token) =>
    axios.get(`${API_BASE_URL}/loyalty/admin/all`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  awardBonus: (data, token) =>
    axios.post(`${API_BASE_URL}/loyalty/admin/bonus`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

// ── Dashboard Analytics API (enhanced) ──
export const analyticsAPI = {
  getAnalytics: (range, token) =>
    axios.get(`${API_BASE_URL}/dashboard/analytics?range=${range}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

// ── Push Notifications API ──
export const pushAPI = {
  getVapidKey: () => axios.get(`${API_BASE_URL}/push/vapid-key`),
  subscribe: (subscription, token) =>
    axios.post(`${API_BASE_URL}/push/subscribe`, { subscription }, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  unsubscribe: (token) =>
    axios.post(`${API_BASE_URL}/push/unsubscribe`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  broadcast: (data, token) =>
    axios.post(`${API_BASE_URL}/push/broadcast`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

export default axios;

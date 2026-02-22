import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { dashboardAPI, orderAPI, reportAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {

  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [recentOrders, setRecentOrders] = useState([]);
  const [popularItems, setPopularItems] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('railbite_token');
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        // Fetch stats and recent orders at the same time
        const [statsRes, recentRes, popularRes] = await Promise.all([
          dashboardAPI.getStats(token),
          orderAPI.getRecent(token, 5),
          reportAPI.getPopularItems(token)
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }

        if (recentRes.data.success) {
          const mapped = recentRes.data.data.map(order => ({
            id: order._id,
            orderNumber: order.orderNumber,
            customer: order.user?.name || 'Customer',
            email: order.user?.email || '',
            items: order.items?.length || 0,
            total: order.totalAmount,
            status: order.status,
            time: new Date(order.createdAt).toLocaleTimeString('en-BD', {
              hour: '2-digit',
              minute: '2-digit'
            })
          }));
          setRecentOrders(mapped);
        }

        if (popularRes.data.success) {
          setPopularItems(popularRes.data.data); // 👈 real data now
        }

      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error loading dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  const statsData = useMemo(() => {
    const s = stats || {
      totalOrders: 0,
      pendingOrders: 0,
      completedToday: 0,
      totalRevenue: 0,
      activeUsers: 0,
      deliveryStaffCount: 0
    };

    return [
      {
        label: "Today's Orders",
        value: s.totalOrders,
        icon: '📦',
        color: '#4ECDC4',
        change: '+12%'
      },
      {
        label: 'Pending Orders',
        value: s.pendingOrders,
        icon: '⏳',
        color: '#FFE66D',
        change: '+5%'
      },
      {
        label: 'Completed Today',
        value: s.completedToday,
        icon: '✅',
        color: '#95E1D3',
        change: '+8%'
      },
      {
        label: 'Revenue (Today)',
        value: `৳${s.totalRevenue.toFixed(2)}`,
        icon: '💰',
        color: '#FF6B35',
        change: '+15%'
      },
      {
        label: 'Active Users',
        value: s.activeUsers,
        icon: '👥',
        color: '#A8DADC',
        change: '+3%'
      },
      {
        label: 'Delivery Staff',
        value: s.deliveryStaffCount,
        icon: '🚚',
        color: '#E9C46A',
        change: '0%'
      }
    ];
  }, [stats]);

  const getStatusClass = (status) => {
    const statusMap = {
      placed: 'status-placed',
      preparing: 'status-preparing',
      'on the way': 'status-ontheway',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled'
    };
    return statusMap[status] || 'status-default';
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-header">
            <h1>Dashboard Overview</h1>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-header">
            <h1>Dashboard Overview</h1>
            <p style={{ color: 'red' }}>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Here's what's happening today.</p>
        </div>

        <div className="admin-stats-grid">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className="admin-stat-card"
              style={{ borderLeftColor: stat.color }}
            >
              <div
                className="admin-stat-icon"
                style={{ backgroundColor: stat.color + '20', color: stat.color }}
              >
                {stat.icon}
              </div>
              <div className="admin-stat-content">
                <p className="admin-stat-label">{stat.label}</p>
                <h3 className="admin-stat-value">{stat.value}</h3>
                <span className="admin-stat-change">
                  {stat.change} from yesterday
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-dashboard-grid">
          <div className="admin-card admin-recent-orders">
            <div className="admin-card-header">
              <h2>Recent Orders</h2>
              <button className="admin-btn-link" onClick={() => navigate('/admin/orders')}>
                View All
              </button>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map(order => (
                      <tr key={order.id}>
                        <td>#{order.orderNumber || String(order.id).slice(-6)}</td>
                        <td>
                          <div>{order.customer}</div>
                          <small style={{ color: 'var(--text-gray)' }}>
                            {order.email}
                          </small>
                        </td>
                        <td>{order.items} items</td>
                        <td>৳{order.total?.toFixed(2)}</td>
                        <td>
                          <span className={`admin-status-badge ${getStatusClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{order.time}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                        No recent orders
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-card admin-popular-items">
            <div className="admin-card-header">
              <h2>Popular Items</h2>
              <button className="admin-btn-link" onClick={() => navigate('/admin/reports')}>
                View Report
              </button>
            </div>
            <div className="popular-items-list">
              {popularItems.map((item, index) => (
                <div key={index} className="popular-item">
                  <div className="popular-item-rank">{index + 1}</div>
                  <div className="popular-item-info">
                    <h4>{item.name}</h4>
                    <p>{item.orders} orders</p>
                  </div>
                  <div className="popular-item-revenue">
                    ৳{typeof item.revenue === 'number' ? item.revenue.toFixed(2) : item.revenue}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

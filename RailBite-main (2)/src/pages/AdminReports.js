import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { reportAPI } from '../services/api';

const AdminReports = () => {
  const [dateRange, setDateRange] = useState('today');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [dateRange]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('railbite_token');
      const res = await reportAPI.get(dateRange, token);
      if (res.data.success) {
        setReportData(res.data.data);
      } else {
        setError(res.data.message || 'Failed to load report');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    const { summary, topItems, paymentBreakdown, statusBreakdown } = reportData;

    const reportText = `
RailBite Sales Report
Date Range: ${dateRange}
Generated: ${new Date().toLocaleString()}

Summary:
- Total Orders: ${summary.totalOrders}
- Total Revenue: ৳${summary.totalRevenue.toFixed(2)}
- Average Order Value: ৳${summary.averageOrderValue.toFixed(2)}

Top Selling Items:
${topItems.map((item, i) => `${i + 1}. ${item.name} - ${item.count} orders - ৳${item.revenue.toFixed(2)}`).join('\n')}

Payment Breakdown:
${paymentBreakdown.map(p => `${p.category}: ৳${p.revenue.toFixed(2)} (${p.count} orders)`).join('\n')}

Orders by Status:
${statusBreakdown.map(s => `${s.status}: ${s.count}`).join('\n')}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `railbite-report-${dateRange}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-header">
            <h1>Reports & Analytics</h1>
            <p>Loading report...</p>
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
            <h1>Reports & Analytics</h1>
            <p style={{ color: 'red' }}>Error: {error}</p>
            <button className="admin-btn-primary" onClick={fetchReport}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const { summary, topItems, paymentBreakdown, monthlyRevenue, statusBreakdown } = reportData;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <div>
            <h1>Reports & Analytics</h1>
            <p>View sales reports and business insights</p>
          </div>
          <button className="admin-btn-primary" onClick={exportReport}>
            📥 Export Report
          </button>
        </div>

        {/* Date filter */}
        <div className="admin-filters">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="admin-filter-select"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Summary cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ backgroundColor: '#4ECDC420', color: '#4ECDC4' }}>
              📦
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Total Orders</p>
              <h3 className="admin-stat-value">{summary.totalOrders}</h3>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ backgroundColor: '#FF6B3520', color: '#FF6B35' }}>
              💰
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Total Revenue</p>
              <h3 className="admin-stat-value">৳{summary.totalRevenue.toFixed(2)}</h3>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ backgroundColor: '#95E1D320', color: '#95E1D3' }}>
              📊
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Avg Order Value</p>
              <h3 className="admin-stat-value">৳{summary.averageOrderValue.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        <div className="admin-dashboard-grid">

          {/* Top Selling Items */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2>Top Selling Items</h2>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Item Name</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.length > 0 ? (
                    topItems.map((item, index) => (
                      <tr key={index}>
                        <td><strong>#{index + 1}</strong></td>
                        <td>{item.name}</td>
                        <td>{item.count}</td>
                        <td>৳{item.revenue.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2>Revenue by Payment Method</h2>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentBreakdown.length > 0 ? (
                    paymentBreakdown.map((p, index) => {
                      const percentage = summary.totalRevenue > 0
                        ? ((p.revenue / summary.totalRevenue) * 100).toFixed(1)
                        : 0;
                      return (
                        <tr key={index}>
                          <td><strong>{p.category}</strong></td>
                          <td>{p.count}</td>
                          <td>৳{p.revenue.toFixed(2)}</td>
                          <td>
                            <div className="percentage-bar">
                              <div
                                className="percentage-fill"
                                style={{ width: `${percentage}%` }}
                              ></div>
                              <span>{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2>Monthly Revenue (Last 6 Months)</h2>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRevenue.length > 0 ? (
                    monthlyRevenue.map((m, index) => (
                      <tr key={index}>
                        <td><strong>{m.month}</strong></td>
                        <td>{m.orders}</td>
                        <td>৳{m.revenue.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Orders by Status */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2>Orders by Status</h2>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {statusBreakdown.length > 0 ? (
                    statusBreakdown.map((s, index) => {
                      const percentage = summary.totalOrders > 0
                        ? ((s.count / summary.totalOrders) * 100).toFixed(1)
                        : 0;
                      return (
                        <tr key={index}>
                          <td>
                            <span className={`badge status-${s.status}`}>
                              {s.status}
                            </span>
                          </td>
                          <td>{s.count}</td>
                          <td>
                            <div className="percentage-bar">
                              <div
                                className="percentage-fill"
                                style={{ width: `${percentage}%` }}
                              ></div>
                              <span>{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminReports;


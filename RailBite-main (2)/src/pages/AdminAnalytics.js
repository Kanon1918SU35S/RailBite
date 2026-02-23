
import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/admin-dashboard.css';

const RANGES = [
    { label: '24 Hours', value: '24h' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: '1 Year', value: '1y' }
];

export default function AdminAnalytics() {
    const [range, setRange] = useState('7d');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [range]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('railbiteToken');
            const res = await analyticsAPI.getAnalytics(range, token);
            setAnalytics(res.data.data);
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => `৳${(val || 0).toLocaleString()}`;

    return (
        <div className="admin-dashboard-layout">
            <AdminSidebar />
            <div className="admin-dashboard-content">
                <div className="admin-dashboard-header">
                    <h1 className="admin-dashboard-title">📊 Analytics Dashboard</h1>
                    <div className="admin-dashboard-range-selector">
                        {RANGES.map(r => (
                            <button
                                key={r.value}
                                onClick={() => setRange(r.value)}
                                className={
                                    'admin-dashboard-range-btn' + (range === r.value ? ' active' : '')
                                }
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="admin-dashboard-empty-text">Loading analytics...</div>
                ) : analytics ? (
                    <>
                        {/* Summary Cards */}
                        <div className="admin-dashboard-cards">
                            <div className="admin-dashboard-card">
                                <h3>Avg Order Value</h3>
                                <p className="card-value">
                                    {formatCurrency(analytics.avgOrderValue?.avgValue?.toFixed(0))}
                                </p>
                                <small>Min: {formatCurrency(analytics.avgOrderValue?.minValue)} | Max: {formatCurrency(analytics.avgOrderValue?.maxValue)}</small>
                            </div>
                            <div className="admin-dashboard-card">
                                <h3>Total Customers</h3>
                                <p className="card-value">{analytics.customerStats?.totalCustomers || 0}</p>
                                <small>{analytics.customerStats?.repeatCustomers || 0} repeat customers</small>
                            </div>
                            <div className="admin-dashboard-card">
                                <h3>Retention Rate</h3>
                                <p className="card-value">
                                    {analytics.customerStats?.totalCustomers > 0
                                        ? ((analytics.customerStats.repeatCustomers / analytics.customerStats.totalCustomers) * 100).toFixed(1)
                                        : 0}%
                                </p>
                                <small>Repeat vs total customers</small>
                            </div>
                        </div>

                        {/* Revenue Over Time */}
                        <div className="admin-dashboard-section">
                            <h2 className="admin-dashboard-section-title">Revenue Over Time</h2>
                            {analytics.revenueOverTime?.length > 0 ? (
                                <div className="admin-dashboard-bar-chart">
                                    {analytics.revenueOverTime.map((item, i) => {
                                        const maxRev = Math.max(...analytics.revenueOverTime.map(r => r.revenue));
                                        const height = maxRev > 0 ? (item.revenue / maxRev) * 100 : 0;
                                        return (
                                            <div
                                                key={i}
                                                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
                                                title={`${item._id}: ${formatCurrency(item.revenue)} (${item.orders} orders)`}
                                            >
                                                <div className="admin-dashboard-bar" style={{ height: `${height}%` }} />
                                                <span className="admin-dashboard-bar-label">{item._id.slice(5)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="admin-dashboard-empty-text">No revenue data for this period</p>
                            )}
                        </div>

                        {/* Popular Items & Peak Hours */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                            <div className="admin-dashboard-section">
                                <h2 className="admin-dashboard-section-title">🔥 Popular Items</h2>
                                {analytics.popularItems?.slice(0, 8).map((item, i) => (
                                    <div key={i} className="admin-dashboard-list-item">
                                        <span className="admin-dashboard-rank">#{i + 1}</span>
                                        <span className="admin-dashboard-item-name">{item._id}</span>
                                        <span className="admin-dashboard-item-stat">{item.totalOrdered} orders</span>
                                        <span className="admin-dashboard-item-rev">{formatCurrency(item.totalRevenue)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="admin-dashboard-section">
                                <h2 className="admin-dashboard-section-title">⏰ Peak Hours</h2>
                                {analytics.peakHours?.sort((a, b) => b.count - a.count).slice(0, 8).map((item, i) => (
                                    <div key={i} className="admin-dashboard-list-item">
                                        <span className="admin-dashboard-hour-label">
                                            {item._id.toString().padStart(2, '0')}:00
                                        </span>
                                        <div className="admin-dashboard-hour-bar">
                                            <div
                                                className="admin-dashboard-hour-fill"
                                                style={{ width: `${(item.count / Math.max(...analytics.peakHours.map(h => h.count))) * 100}%` }}
                                            />
                                        </div>
                                        <span className="admin-dashboard-hour-count">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Status & Payment Distribution */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                            <div className="admin-dashboard-section">
                                <h2 className="admin-dashboard-section-title">📋 Orders by Status</h2>
                                {analytics.ordersByStatus?.map((s, i) => (
                                    <div key={i} className="admin-dashboard-status-row">
                                        <span
                                            className="admin-dashboard-status-dot"
                                            style={{ backgroundColor: s._id === 'delivered' ? '#2ecc71' : s._id === 'cancelled' ? '#e74c3c' : s._id === 'pending' ? '#f39c12' : '#3498db' }}
                                        />
                                        <span className="admin-dashboard-status-name">{s._id}</span>
                                        <span className="admin-dashboard-status-count">{s.count}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="admin-dashboard-section">
                                <h2 className="admin-dashboard-section-title">💳 Payment Methods</h2>
                                {analytics.paymentMethodDistribution?.map((p, i) => (
                                    <div key={i} className="admin-dashboard-status-row">
                                        <span className="admin-dashboard-status-name">{p._id || 'Unknown'}</span>
                                        <span className="admin-dashboard-status-count">{p.count} orders</span>
                                        <span className="admin-dashboard-item-rev">{formatCurrency(p.revenue)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Staff Performance */}
                        <div className="admin-dashboard-section">
                            <h2 className="admin-dashboard-section-title">🚴 Delivery Staff Performance</h2>
                            <table className="admin-dashboard-table">
                                <thead>
                                    <tr>
                                        <th className="admin-dashboard-th">Staff</th>
                                        <th className="admin-dashboard-th">Deliveries</th>
                                        <th className="admin-dashboard-th">Revenue Handled</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.deliveryPerformance?.map((staff, i) => (
                                        <tr key={i}>
                                            <td className="admin-dashboard-td">{staff.name || 'Unknown'}</td>
                                            <td className="admin-dashboard-td">{staff.deliveriesCompleted}</td>
                                            <td className="admin-dashboard-td">{formatCurrency(staff.totalRevenue)}</td>
                                        </tr>
                                    ))}
                                    {(!analytics.deliveryPerformance || analytics.deliveryPerformance.length === 0) && (
                                        <tr><td colSpan={3} className="admin-dashboard-td" style={{ textAlign: 'center' }}>No delivery data</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Order Type Distribution */}
                        <div className="admin-dashboard-section">
                            <h2 className="admin-dashboard-section-title">🚂 Order Type Distribution</h2>
                            <div className="admin-dashboard-type-grid">
                                {analytics.orderTypeDistribution?.map((t, i) => (
                                    <div key={i} className="admin-dashboard-type-card">
                                        <span className="admin-dashboard-type-icon">{t._id === 'train' ? '🚂' : '🏪'}</span>
                                        <h3>{t._id === 'train' ? 'Train Orders' : 'Station Orders'}</h3>
                                        <p className="admin-dashboard-type-count">{t.count} orders</p>
                                        <p className="admin-dashboard-type-rev">{formatCurrency(t.revenue)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="admin-dashboard-empty-text">No data available</p>
                )}
            </div>
        </div>
    );
}


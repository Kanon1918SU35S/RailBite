import React, { useState, useEffect } from 'react';
import { analyticsAPI, dashboardAPI } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';

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
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, [range]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('railbite_token');
            if (!token) {
                setError('Authentication token not found. Please login again.');
                setLoading(false);
                return;
            }
            const res = await analyticsAPI.getAnalytics(range, token);
            console.log('Analytics API Response:', res);
            if (res.data?.data) {
                setAnalytics(res.data.data);
            } else {
                setError(`No analytics data received. Response: ${JSON.stringify(res.data)}`);
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch analytics data';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => `৳${(val || 0).toLocaleString()}`;

    return (
        <div style={styles.layout}>
            <AdminSidebar />
            <div style={styles.content}>
                <div style={styles.header}>
                    <h1 style={styles.title}>📊 Analytics Dashboard</h1>
                    <div style={styles.rangeSelector}>
                        {RANGES.map(r => (
                            <button
                                key={r.value}
                                onClick={() => setRange(r.value)}
                                style={range === r.value ? styles.activeRange : styles.rangeBtn}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {error && <div style={styles.errorMsg}>Error: {error}</div>}

                {loading ? (
                    <div style={styles.loading}>Loading analytics...</div>
                ) : !analytics ? (
                    <div style={styles.emptyMsg}>No analytics data available for this period.</div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div style={styles.cardsGrid}>
                            <div style={{ ...styles.card, borderLeft: '4px solid #3498db' }}>
                                <h3>Avg Order Value</h3>
                                <p style={styles.cardValue}>
                                    {formatCurrency((analytics.avgOrderValue?.avgValue || 0).toFixed(0))}
                                </p>
                                <small>Min: {formatCurrency(analytics.avgOrderValue?.minValue || 0)} | Max: {formatCurrency(analytics.avgOrderValue?.maxValue || 0)}</small>
                            </div>
                            <div style={{ ...styles.card, borderLeft: '4px solid #2ecc71' }}>
                                <h3>Total Customers</h3>
                                <p style={styles.cardValue}>{analytics.customerStats?.totalCustomers || 0}</p>
                                <small>{analytics.customerStats?.repeatCustomers || 0} repeat customers</small>
                            </div>
                            <div style={{ ...styles.card, borderLeft: '4px solid #e74c3c' }}>
                                <h3>Retention Rate</h3>
                                <p style={styles.cardValue}>
                                    {analytics.customerStats?.totalCustomers > 0
                                        ? ((analytics.customerStats.repeatCustomers / analytics.customerStats.totalCustomers) * 100).toFixed(1)
                                        : 0}%
                                </p>
                                <small>Repeat vs total customers</small>
                            </div>
                        </div>

                        {/* Revenue Over Time */}
                        <div style={styles.section}>
                            <h2 style={styles.sectionTitle}>Revenue Over Time</h2>
                            <div style={styles.chartPlaceholder}>
                                {analytics.revenueOverTime && analytics.revenueOverTime.length > 0 ? (
                                    <div style={styles.barChart}>
                                        {analytics.revenueOverTime.map((item, i) => {
                                            const maxRev = Math.max(...analytics.revenueOverTime.map(r => r.revenue || 0), 1);
                                            const height = maxRev > 0 ? ((item.revenue || 0) / maxRev) * 100 : 0;
                                            return (
                                                <div key={i} style={styles.barWrapper} title={`${item._id}: ${formatCurrency(item.revenue)} (${item.orders} orders)`}>
                                                    <div style={{ ...styles.bar, height: `${height}%` }} />
                                                    <span style={styles.barLabel}>{item._id.slice(5)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p style={styles.emptyText}>No revenue data for this period</p>
                                )}
                            </div>
                        </div>

                        {/* Popular Items & Peak Hours */}
                        <div style={styles.twoCol}>
                            <div style={styles.section}>
                                <h2 style={styles.sectionTitle}>🔥 Popular Items</h2>
                                {analytics.popularItems && analytics.popularItems.length > 0 ? (
                                    analytics.popularItems.slice(0, 8).map((item, i) => (
                                        <div key={i} style={styles.listItem}>
                                            <span style={styles.rank}>#{i + 1}</span>
                                            <span style={styles.itemName}>{item._id}</span>
                                            <span style={styles.itemStat}>{item.totalOrdered || 0} orders</span>
                                            <span style={styles.itemRev}>{formatCurrency(item.totalRevenue || 0)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p style={styles.emptyText}>No popular items data</p>
                                )}
                            </div>

                            <div style={styles.section}>
                                <h2 style={styles.sectionTitle}>⏰ Peak Hours</h2>
                                {analytics.peakHours && analytics.peakHours.length > 0 ? (
                                    analytics.peakHours.sort((a, b) => b.count - a.count).slice(0, 8).map((item, i) => (
                                        <div key={i} style={styles.listItem}>
                                            <span style={styles.hourLabel}>
                                                {(item._id || 0).toString().padStart(2, '0')}:00
                                            </span>
                                            <div style={styles.hourBar}>
                                                <div style={{
                                                    ...styles.hourFill,
                                                    width: `${(item.count / Math.max(...analytics.peakHours.map(h => h.count || 0), 1)) * 100}%`
                                                }} />
                                            </div>
                                            <span style={styles.hourCount}>{item.count || 0}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p style={styles.emptyText}>No peak hours data</p>
                                )}
                            </div>
                        </div>

                        {/* Order Status & Payment Distribution */}
                        <div style={styles.twoCol}>
                            <div style={styles.section}>
                                <h2 style={styles.sectionTitle}>📋 Orders by Status</h2>
                                {analytics.ordersByStatus && analytics.ordersByStatus.length > 0 ? (
                                    analytics.ordersByStatus.map((s, i) => (
                                        <div key={i} style={styles.statusRow}>
                                            <span style={{
                                                ...styles.statusDot,
                                                backgroundColor: s._id === 'delivered' ? '#2ecc71' : s._id === 'cancelled' ? '#e74c3c' : s._id === 'pending' ? '#f39c12' : '#3498db'
                                            }} />
                                            <span style={styles.statusName}>{s._id}</span>
                                            <span style={styles.statusCount}>{s.count || 0}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p style={styles.emptyText}>No orders data</p>
                                )}
                            </div>

                            <div style={styles.section}>
                                <h2 style={styles.sectionTitle}>💳 Payment Methods</h2>
                                {analytics.paymentMethodDistribution && analytics.paymentMethodDistribution.length > 0 ? (
                                    analytics.paymentMethodDistribution.map((p, i) => (
                                        <div key={i} style={styles.statusRow}>
                                            <span style={styles.statusName}>{p._id || 'Unknown'}</span>
                                            <span style={styles.statusCount}>{p.count || 0} orders</span>
                                            <span style={styles.itemRev}>{formatCurrency(p.revenue || 0)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p style={styles.emptyText}>No payment data</p>
                                )}
                            </div>
                        </div>

                        {/* Delivery Staff Performance */}
                        <div style={styles.section}>
                            <h2 style={styles.sectionTitle}>🚴 Delivery Staff Performance</h2>
                            {analytics.deliveryPerformance && analytics.deliveryPerformance.length > 0 ? (
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Staff</th>
                                            <th style={styles.th}>Deliveries</th>
                                            <th style={styles.th}>Revenue Handled</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.deliveryPerformance.map((staff, i) => (
                                            <tr key={i}>
                                                <td style={styles.td}>{staff.name || 'Unknown'}</td>
                                                <td style={styles.td}>{staff.deliveriesCompleted || 0}</td>
                                                <td style={styles.td}>{formatCurrency(staff.totalRevenue || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p style={styles.emptyText}>No delivery data</p>
                            )}
                        </div>

                        {/* Order Type Distribution */}
                        <div style={styles.section}>
                            <h2 style={styles.sectionTitle}>🚂 Order Type Distribution</h2>
                            {analytics.orderTypeDistribution && analytics.orderTypeDistribution.length > 0 ? (
                                <div style={styles.typeGrid}>
                                    {analytics.orderTypeDistribution.map((t, i) => (
                                        <div key={i} style={styles.typeCard}>
                                            <span style={styles.typeIcon}>{t._id === 'train' ? '🚂' : '🏪'}</span>
                                            <h3>{t._id === 'train' ? 'Train Orders' : 'Station Orders'}</h3>
                                            <p style={styles.typeCount}>{t.count || 0} orders</p>
                                            <p style={styles.typeRev}>{formatCurrency(t.revenue || 0)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={styles.emptyText}>No order type data</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const styles = {
    layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#030409' },
    content: { flex: 1, padding: '2rem 2.5rem', marginLeft: '260px', overflowY: 'auto' },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 24,
        gap: 16
    },
    title: { fontSize: 26, fontWeight: 700, color: '#ffffff' },
    rangeSelector: { display: 'flex', gap: 8 },
    rangeBtn: {
        padding: '8px 16px',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        backgroundColor: '#0a0f14',
        color: '#b0b0b0',
        cursor: 'pointer',
        fontSize: 13
    },
    activeRange: {
        padding: '8px 16px',
        border: '1px solid #e87e1e',
        borderRadius: 8,
        backgroundColor: '#e87e1e',
        color: '#fff',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600
    },
    errorMsg: {
        padding: '14px 16px',
        backgroundColor: 'rgba(244,67,54,0.15)',
        border: '1px solid rgba(244,67,54,0.4)',
        borderRadius: 8,
        color: '#ff9999',
        marginBottom: 16,
        fontSize: 14
    },
    emptyMsg: {
        padding: 32,
        textAlign: 'center',
        color: '#888',
        fontSize: 16
    },
    loading: { textAlign: 'center', padding: 60, fontSize: 18, color: '#aaa' },
    cardsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24
    },
    card: {
        background: '#0a0f14',
        borderRadius: 12,
        padding: 20,
        border: '1px solid #2A2A2A',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    },
    cardValue: { fontSize: 28, fontWeight: 700, margin: '8px 0 4px', color: '#ffffff' },
    section: {
        background: '#0a0f14',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        border: '1px solid #2A2A2A',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    },
    sectionTitle: { fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#ffffff' },
    twoCol: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20
    },
    barChart: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: 4,
        height: 200,
        padding: '0 8px'
    },
    barWrapper: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        justifyContent: 'flex-end'
    },
    bar: {
        width: '100%',
        maxWidth: 40,
        backgroundColor: '#e87e1e',
        borderRadius: '4px 4px 0 0',
        minHeight: 2,
        transition: 'height 0.3s ease'
    },
    barLabel: { fontSize: 10, color: '#888', marginTop: 4, whiteSpace: 'nowrap' },
    chartPlaceholder: { minHeight: 200 },
    listItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid #2A2A2A'
    },
    rank: { fontWeight: 700, color: '#e87e1e', width: 30 },
    itemName: { flex: 1, fontWeight: 500, color: '#ddd' },
    itemStat: { color: '#888', fontSize: 13 },
    itemRev: { fontWeight: 600, color: '#4caf50', fontSize: 13 },
    hourLabel: { fontWeight: 600, width: 60, color: '#ddd' },
    hourBar: {
        flex: 1,
        height: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        overflow: 'hidden'
    },
    hourFill: {
        height: '100%',
        backgroundColor: '#3498db',
        borderRadius: 8,
        transition: 'width 0.3s ease'
    },
    hourCount: { fontWeight: 600, width: 40, textAlign: 'right', color: '#ddd' },
    statusRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid #2A2A2A'
    },
    statusDot: { width: 10, height: 10, borderRadius: '50%' },
    statusName: { flex: 1, fontWeight: 500, textTransform: 'capitalize', color: '#ddd' },
    statusCount: { fontWeight: 600, color: '#ddd' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        textAlign: 'left',
        padding: '12px 16px',
        backgroundColor: 'rgba(0,0,0,0.2)',
        fontWeight: 600,
        fontSize: 13,
        borderBottom: '2px solid #2A2A2A',
        color: '#ddd'
    },
    td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#aaa' },
    typeGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16
    },
    typeCard: { textAlign: 'center', padding: 20, borderRadius: 12, backgroundColor: '#0a0f14', border: '1px solid #2A2A2A' },
    typeIcon: { fontSize: 40, display: 'block', marginBottom: 8 },
    typeCount: { fontSize: 22, fontWeight: 700, color: '#ffffff' },
    typeRev: { color: '#4caf50', fontWeight: 600 },
    emptyText: { textAlign: 'center', color: '#888', padding: 40 }
};

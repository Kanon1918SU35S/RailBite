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

                {loading ? (
                    <div style={styles.loading}>Loading analytics...</div>
                ) : analytics ? (
                    <>
                        {/* Summary Cards */}
                        <div style={styles.cardsGrid}>
                            <div style={{ ...styles.card, borderLeft: '4px solid #3498db' }}>
                                <h3>Avg Order Value</h3>
                                <p style={styles.cardValue}>
                                    {formatCurrency(analytics.avgOrderValue?.avgValue?.toFixed(0))}
                                </p>
                                <small>Min: {formatCurrency(analytics.avgOrderValue?.minValue)} | Max: {formatCurrency(analytics.avgOrderValue?.maxValue)}</small>
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
                                {analytics.revenueOverTime?.length > 0 ? (
                                    <div style={styles.barChart}>
                                        {analytics.revenueOverTime.map((item, i) => {
                                            const maxRev = Math.max(...analytics.revenueOverTime.map(r => r.revenue));
                                            const height = maxRev > 0 ? (item.revenue / maxRev) * 100 : 0;
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
                                {analytics.popularItems?.slice(0, 8).map((item, i) => (
                                    <div key={i} style={styles.listItem}>
                                        <span style={styles.rank}>#{i + 1}</span>
                                        <span style={styles.itemName}>{item._id}</span>
                                        <span style={styles.itemStat}>{item.totalOrdered} orders</span>
                                        <span style={styles.itemRev}>{formatCurrency(item.totalRevenue)}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={styles.section}>
                                <h2 style={styles.sectionTitle}>⏰ Peak Hours</h2>
                                {analytics.peakHours?.sort((a, b) => b.count - a.count).slice(0, 8).map((item, i) => (
                                    <div key={i} style={styles.listItem}>
                                        <span style={styles.hourLabel}>
                                            {item._id.toString().padStart(2, '0')}:00
                                        </span>
                                        <div style={styles.hourBar}>
                                            <div style={{
                                                ...styles.hourFill,
                                                width: `${(item.count / Math.max(...analytics.peakHours.map(h => h.count))) * 100}%`
                                            }} />
                                        </div>
                                        <span style={styles.hourCount}>{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Status & Payment Distribution */}
                        <div style={styles.twoCol}>
                            <div style={styles.section}>
                                <h2 style={styles.sectionTitle}>📋 Orders by Status</h2>
                                {analytics.ordersByStatus?.map((s, i) => (
                                    <div key={i} style={styles.statusRow}>
                                        <span style={{
                                            ...styles.statusDot,
                                            backgroundColor: s._id === 'delivered' ? '#2ecc71' : s._id === 'cancelled' ? '#e74c3c' : s._id === 'pending' ? '#f39c12' : '#3498db'
                                        }} />
                                        <span style={styles.statusName}>{s._id}</span>
                                        <span style={styles.statusCount}>{s.count}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={styles.section}>
                                <h2 style={styles.sectionTitle}>💳 Payment Methods</h2>
                                {analytics.paymentMethodDistribution?.map((p, i) => (
                                    <div key={i} style={styles.statusRow}>
                                        <span style={styles.statusName}>{p._id || 'Unknown'}</span>
                                        <span style={styles.statusCount}>{p.count} orders</span>
                                        <span style={styles.itemRev}>{formatCurrency(p.revenue)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Staff Performance */}
                        <div style={styles.section}>
                            <h2 style={styles.sectionTitle}>🚴 Delivery Staff Performance</h2>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Staff</th>
                                        <th style={styles.th}>Deliveries</th>
                                        <th style={styles.th}>Revenue Handled</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.deliveryPerformance?.map((staff, i) => (
                                        <tr key={i}>
                                            <td style={styles.td}>{staff.name || 'Unknown'}</td>
                                            <td style={styles.td}>{staff.deliveriesCompleted}</td>
                                            <td style={styles.td}>{formatCurrency(staff.totalRevenue)}</td>
                                        </tr>
                                    ))}
                                    {(!analytics.deliveryPerformance || analytics.deliveryPerformance.length === 0) && (
                                        <tr><td colSpan={3} style={{ ...styles.td, textAlign: 'center' }}>No delivery data</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Order Type Distribution */}
                        <div style={styles.section}>
                            <h2 style={styles.sectionTitle}>🚂 Order Type Distribution</h2>
                            <div style={styles.typeGrid}>
                                {analytics.orderTypeDistribution?.map((t, i) => (
                                    <div key={i} style={styles.typeCard}>
                                        <span style={styles.typeIcon}>{t._id === 'train' ? '🚂' : '🏪'}</span>
                                        <h3>{t._id === 'train' ? 'Train Orders' : 'Station Orders'}</h3>
                                        <p style={styles.typeCount}>{t.count} orders</p>
                                        <p style={styles.typeRev}>{formatCurrency(t.revenue)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <p>No data available</p>
                )}
            </div>
        </div>
    );
}

const styles = {
    layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#f5f6fa' },
    content: { flex: 1, padding: '24px 32px', overflowY: 'auto' },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 24,
        gap: 16
    },
    title: { fontSize: 26, fontWeight: 700, color: '#1a1a2e' },
    rangeSelector: { display: 'flex', gap: 8 },
    rangeBtn: {
        padding: '8px 16px',
        border: '1px solid #ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        cursor: 'pointer',
        fontSize: 13
    },
    activeRange: {
        padding: '8px 16px',
        border: '1px solid #e74c3c',
        borderRadius: 8,
        backgroundColor: '#e74c3c',
        color: '#fff',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600
    },
    loading: { textAlign: 'center', padding: 60, fontSize: 18 },
    cardsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24
    },
    card: {
        background: '#fff',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    },
    cardValue: { fontSize: 28, fontWeight: 700, margin: '8px 0 4px', color: '#1a1a2e' },
    section: {
        background: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    },
    sectionTitle: { fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#1a1a2e' },
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
        backgroundColor: '#e74c3c',
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
        borderBottom: '1px solid #f0f0f0'
    },
    rank: { fontWeight: 700, color: '#e74c3c', width: 30 },
    itemName: { flex: 1, fontWeight: 500 },
    itemStat: { color: '#666', fontSize: 13 },
    itemRev: { fontWeight: 600, color: '#2ecc71', fontSize: 13 },
    hourLabel: { fontWeight: 600, width: 60 },
    hourBar: {
        flex: 1,
        height: 16,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        overflow: 'hidden'
    },
    hourFill: {
        height: '100%',
        backgroundColor: '#3498db',
        borderRadius: 8,
        transition: 'width 0.3s ease'
    },
    hourCount: { fontWeight: 600, width: 40, textAlign: 'right' },
    statusRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid #f0f0f0'
    },
    statusDot: { width: 10, height: 10, borderRadius: '50%' },
    statusName: { flex: 1, fontWeight: 500, textTransform: 'capitalize' },
    statusCount: { fontWeight: 600 },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        textAlign: 'left',
        padding: '12px 16px',
        backgroundColor: '#f8f9fa',
        fontWeight: 600,
        fontSize: 13,
        borderBottom: '2px solid #eee'
    },
    td: { padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontSize: 14 },
    typeGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16
    },
    typeCard: { textAlign: 'center', padding: 20, borderRadius: 12, backgroundColor: '#f8f9fa' },
    typeIcon: { fontSize: 40, display: 'block', marginBottom: 8 },
    typeCount: { fontSize: 22, fontWeight: 700, color: '#1a1a2e' },
    typeRev: { color: '#2ecc71', fontWeight: 600 },
    emptyText: { textAlign: 'center', color: '#888', padding: 40 }
};

import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
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
              <div style={{ ...styles.card, borderLeft: '4px solid #e67e22' }}>
                <h3>Period Revenue</h3>
                <p style={{ ...styles.cardValue, color: '#e67e22' }}>
                  {formatCurrency(analytics.periodRevenue)}
                </p>
                <small>For the last {RANGES.find(r => r.value === range)?.label}</small>
              </div>
              <div style={{ ...styles.card, borderLeft: '4px solid #3498db' }}>
                <h3>Orders</h3>
                <p style={{ ...styles.cardValue, color: '#3498db' }}>{analytics.periodOrders}</p>
                <small>Total orders in period</small>
              </div>
              <div style={{ ...styles.card, borderLeft: '4px solid #2ecc71' }}>
                <h3>Avg Order Value</h3>
                <p style={{ ...styles.cardValue, color: '#2ecc71' }}>
                  {formatCurrency(analytics.avgOrderValue?.avgValue?.toFixed(0))}
                </p>
                <small>Min: {formatCurrency(analytics.avgOrderValue?.minValue)}</small>
              </div>
              <div style={{ ...styles.card, borderLeft: '4px solid #9b59b6' }}>
                <h3>Repeat Customers</h3>
                <p style={{ ...styles.cardValue, color: '#9b59b6' }}>
                  {analytics.customerStats?.repeatCustomers || 0}
                </p>
                <small>Of {analytics.customerStats?.totalCustomers} total</small>
              </div>
            </div>

            {/* Revenue Over Time */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Revenue Trend</h2>
              <div style={styles.chartPlaceholder}>
                {analytics.revenueOverTime?.length > 0 ? (
                  <div style={styles.barChart}>
                    {analytics.revenueOverTime.map((item, i) => {
                      const maxRev = Math.max(...analytics.revenueOverTime.map(r => r.revenue));
                      const height = maxRev > 0 ? (item.revenue / maxRev) * 100 : 0;
                      return (
                        <div key={i} style={styles.barWrapper} title={`${item._id}: ${formatCurrency(item.revenue)}`}>
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

            {/* Two Column Section */}
            <div style={styles.twoCol}>
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>🔥 Popular Items</h2>
                {analytics.popularItems?.slice(0, 6).map((item, i) => (
                  <div key={i} style={styles.listItem}>
                    <span style={styles.rank}>#{i + 1}</span>
                    <span style={styles.itemName}>{item._id}</span>
                    <span style={styles.itemStat}>{item.totalOrdered} ordered</span>
                  </div>
                ))}
              </div>

              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>💳 Payment Methods</h2>
                {analytics.paymentMethodDistribution?.map((p, i) => (
                  <div key={i} style={styles.statusRow}>
                    <span style={styles.statusName}>{p._id || 'Unknown'}</span>
                    <div style={styles.progressContainer}>
                      <div style={{ ...styles.progressBar, width: `${(p.count / analytics.periodOrders) * 100}%` }} />
                    </div>
                    <span style={styles.statusCount}>{p.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.twoCol}>
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>📋 Orders by Status</h2>
                {analytics.ordersByStatus?.map((s, i) => (
                  <div key={i} style={styles.statusRow}>
                    <span style={{ 
                      ...styles.statusDot, 
                      backgroundColor: s._id === 'delivered' ? '#2ecc71' : s._id === 'cancelled' ? '#e74c3c' : '#f39c12' 
                    }} />
                    <span style={styles.statusName}>{s._id}</span>
                    <span style={styles.statusCount}>{s.count}</span>
                  </div>
                ))}
              </div>

              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>🚴 Top Delivery Staff</h2>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Staff</th>
                      <th style={styles.th}>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.deliveryPerformance?.slice(0, 5).map((staff, i) => (
                      <tr key={i}>
                        <td style={styles.td}>{staff.name || 'Unknown'}</td>
                        <td style={styles.td}>{staff.deliveriesCompleted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 700, color: '#1a1a2e' },
  rangeSelector: { display: 'flex', gap: 8 },
  rangeBtn: { padding: '8px 16px', border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#fff', cursor: 'pointer', fontSize: 13 },
  activeRange: { padding: '8px 16px', border: '1px solid #e74c3c', borderRadius: 8, backgroundColor: '#e74c3c', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  loading: { textAlign: 'center', padding: 60, fontSize: 18 },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 },
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  cardValue: { fontSize: 28, fontWeight: 700, margin: '8px 0 4px' },
  section: { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  sectionTitle: { fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#1a1a2e' },
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 },
  barChart: { display: 'flex', alignItems: 'flex-end', gap: 8, height: 200, padding: '0 10px' },
  barWrapper: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', maxWidth: 35, backgroundColor: '#e74c3c', borderRadius: '4px 4px 0 0', minHeight: 2 },
  barLabel: { fontSize: 10, color: '#888', marginTop: 6, whiteSpace: 'nowrap' },
  chartPlaceholder: { minHeight: 200 },
  listItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  rank: { fontWeight: 700, color: '#e74c3c', width: 25 },
  itemName: { flex: 1, fontWeight: 500 },
  itemStat: { color: '#666', fontSize: 13 },
  statusRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' },
  statusDot: { width: 8, height: 8, borderRadius: '50%' },
  statusName: { flex: 1, fontWeight: 500, fontSize: 14, textTransform: 'capitalize' },
  statusCount: { fontWeight: 600, fontSize: 14 },
  progressContainer: { flex: 2, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#3498db' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px', backgroundColor: '#f8f9fa', color: '#666', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #eee' },
  td: { padding: '10px', borderBottom: '1px solid #f0f0f0', fontSize: 13 },
  emptyText: { textAlign: 'center', color: '#888', padding: 40 }
};

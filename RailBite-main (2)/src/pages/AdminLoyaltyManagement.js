import React, { useState, useEffect } from 'react';
import { loyaltyAPI } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';

const tierColors = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2'
};

export default function AdminLoyaltyManagement() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('bonus'); // 'bonus' or 'deduct'
  const [form, setForm] = useState({ userId: '', points: '', description: '' });
  const [filters, setFilters] = useState({ search: '', tier: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('railbiteToken');
      const [usersRes, statsRes] = await Promise.all([
        loyaltyAPI.getAll(token, filters),
        loyaltyAPI.getStats(token)
      ]);
      setUsers(usersRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('railbiteToken');
      const payload = {
        userId: form.userId,
        points: parseInt(form.points),
        description: form.description
      };

      if (formType === 'bonus') {
        await loyaltyAPI.awardBonus(payload, token);
        setMsg('Bonus points awarded successfully!');
      } else {
        await loyaltyAPI.deductPoints(payload, token);
        setMsg('Points deducted successfully!');
      }
      
      setForm({ userId: '', points: '', description: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error processing action');
    }
  };

  return (
    <div style={styles.layout}>
      <AdminSidebar />
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎖️ Loyalty Management</h1>
          <div style={styles.headerActions}>
            <button 
              onClick={() => { setFormType('bonus'); setShowForm(true); }} 
              style={{ ...styles.addBtn, backgroundColor: '#2ecc71' }}
            >
              🎁 Award Bonus
            </button>
            <button 
              onClick={() => { setFormType('deduct'); setShowForm(true); }} 
              style={{ ...styles.addBtn, backgroundColor: '#e67e22', marginLeft: 10 }}
            >
              ➖ Deduct Points
            </button>
          </div>
        </div>

        {msg && <div style={styles.msg}>{msg}</div>}

        {/* Stats Summary */}
        {stats && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <h3>Total Members</h3>
              <p style={styles.statValue}>{stats.totals.totalMembers}</p>
            </div>
            <div style={styles.statCard}>
              <h3>Active Points</h3>
              <p style={{ ...styles.statValue, color: '#3498db' }}>{stats.totals.totalActivePoints.toLocaleString()}</p>
            </div>
            <div style={styles.statCard}>
              <h3>Points Earned</h3>
              <p style={{ ...styles.statValue, color: '#2ecc71' }}>{stats.totals.totalEverEarned.toLocaleString()}</p>
            </div>
            <div style={styles.statCard}>
              <h3>Points Redeemed</h3>
              <p style={{ ...styles.statValue, color: '#e74c3c' }}>{stats.totals.totalEverRedeemed.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div style={styles.filterBar}>
          <input 
            placeholder="Search by name or email..." 
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            style={styles.filterInput}
          />
          <select 
            value={filters.tier}
            onChange={e => setFilters({ ...filters, tier: e.target.value })}
            style={styles.filterSelect}
          >
            <option value="">All Tiers</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>

        {/* Action Form Modal-ish */}
        {showForm && (
          <div style={styles.modalOverlay}>
            <form onSubmit={handleAction} style={styles.form}>
              <div style={styles.formHeader}>
                <h3>{formType === 'bonus' ? '🎁 Award Bonus Points' : '➖ Deduct Points'}</h3>
                <button type="button" onClick={() => setShowForm(false)} style={styles.closeBtn}>✕</button>
              </div>
              
              <div style={styles.formGroup}>
                <label>Select Member</label>
                <select 
                  value={form.userId} 
                  onChange={e => setForm({ ...form, userId: e.target.value })}
                  required
                  style={styles.input}
                >
                  <option value="">Choose a user...</option>
                  {users.map(u => (
                    <option key={u._id} value={u.user?._id}>
                      {u.user?.name} ({u.points} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label>Points</label>
                <input 
                  type="number" min="1" required
                  value={form.points}
                  onChange={e => setForm({ ...form, points: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label>Reason / Note</label>
                <input 
                  placeholder="e.g. Compensation for late delivery"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={styles.input}
                />
              </div>

              <button type="submit" style={{ 
                ...styles.submitBtn, 
                backgroundColor: formType === 'bonus' ? '#2ecc71' : '#e67e22' 
              }}>
                {formType === 'bonus' ? 'Award Points' : 'Deduct Points'}
              </button>
            </form>
          </div>
        )}

        {/* Members Table */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Member</th>
                <th style={styles.th}>Tier</th>
                <th style={styles.th}>Points</th>
                <th style={styles.th}>Total Earned</th>
                <th style={styles.th}>Total Redeemed</th>
                <th style={styles.th}>Phone</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading members...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>No members found</td></tr>
              ) : users.map(u => (
                <tr key={u._id}>
                  <td style={styles.td}>
                    <div style={styles.userName}>{u.user?.name || 'N/A'}</div>
                    <div style={styles.userEmail}>{u.user?.email}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={{ 
                      ...styles.tierBadge, 
                      backgroundColor: `${tierColors[u.tier]}20`,
                      color: tierColors[u.tier],
                      borderColor: tierColors[u.tier]
                    }}>
                      {u.tier?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontWeight: 700 }}>{u.points.toLocaleString()}</td>
                  <td style={{ ...styles.td, color: '#2ecc71' }}>{u.totalEarned.toLocaleString()}</td>
                  <td style={{ ...styles.td, color: '#e74c3c' }}>{u.totalRedeemed.toLocaleString()}</td>
                  <td style={styles.td}>{u.user?.phone || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#f5f6fa' },
  content: { flex: 1, padding: '24px 32px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 700, color: '#1a1a2e' },
  headerActions: { display: 'flex' },
  addBtn: { padding: '10px 18px', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  msg: { padding: 12, backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 8, marginBottom: 16, color: '#155724' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', textAlign: 'center' },
  statValue: { fontSize: 28, fontWeight: 700, margin: '8px 0 0', color: '#1a1a2e' },
  filterBar: { display: 'flex', gap: 12, marginBottom: 20 },
  filterInput: { flex: 1, padding: '10px 15px', borderRadius: 8, border: '1px solid #ddd' },
  filterSelect: { padding: '10px', borderRadius: 8, border: '1px solid #ddd', width: 150 },
  tableWrapper: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', backgroundColor: '#f8f9fa', color: '#666', fontWeight: 600, fontSize: 13, borderBottom: '1px solid #eee' },
  td: { padding: '14px 16px', borderBottom: '1px solid #f0f0f0', fontSize: 14 },
  userName: { fontWeight: 600, color: '#2c3e50' },
  userEmail: { fontSize: 12, color: '#888' },
  tierBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  form: { background: '#fff', padding: 24, borderRadius: 16, width: '100%', maxWidth: 450, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' },
  formGroup: { marginBottom: 16 },
  input: { width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '12px', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 16, marginTop: 10 }
};

import React, { useState, useEffect } from 'react';
import { loyaltyAPI, userAPI } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';

const tierColors = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e4e2'
};

export default function AdminLoyaltyManagement() {
    const [users, setUsers] = useState([]);
    const [allCustomers, setAllCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBonus, setShowBonus] = useState(false);
    const [bonusLoading, setBonusLoading] = useState(false);
    const [bonusForm, setBonusForm] = useState({ userId: '', points: '', description: '' });
    const [msg, setMsg] = useState('');
    const [msgType, setMsgType] = useState('success');

    useEffect(() => {
        fetchLoyalty();
        fetchAllCustomers();
    }, []);

    const fetchAllCustomers = async () => {
        try {
            const token = localStorage.getItem('railbite_token');
            if (!token) return;
            const res = await userAPI.getAll(token);
            if (res.data?.data) {
                const customers = res.data.data.filter(u => u.role === 'customer');
                setAllCustomers(customers);
            }
        } catch (err) {
            console.error('Error fetching customers:', err);
        }
    };

    const fetchLoyalty = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('railbite_token');
            if (!token) {
                setError('Authentication token not found. Please login again.');
                setLoading(false);
                return;
            }
            const res = await loyaltyAPI.getAll(token);
            console.log('Loyalty API Response:', res);
            if (res.data?.data) {
                setUsers(res.data.data);
            } else {
                setError(`No loyalty data received. Response: ${JSON.stringify(res.data)}`);
            }
        } catch (err) {
            console.error('Error fetching loyalty data:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch loyalty data';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleAwardBonus = async (e) => {
        e.preventDefault();
        if (!bonusForm.userId || !bonusForm.points) {
            setMsg('Please fill in all required fields');
            setMsgType('error');
            return;
        }

        const points = parseInt(bonusForm.points);
        if (isNaN(points) || points <= 0) {
            setMsg('Points must be a valid positive number');
            setMsgType('error');
            return;
        }

        setBonusLoading(true);
        try {
            const token = localStorage.getItem('railbite_token');
            await loyaltyAPI.awardBonus({
                userId: bonusForm.userId,
                points: points,
                description: bonusForm.description || 'Admin bonus'
            }, token);
            setMsg('Bonus points awarded successfully!');
            setMsgType('success');
            setBonusForm({ userId: '', points: '', description: '' });
            setShowBonus(false);
            setTimeout(() => fetchLoyalty(), 500);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Error awarding bonus';
            setMsg(errorMsg);
            setMsgType('error');
            console.error('Error awarding bonus:', err);
        } finally {
            setBonusLoading(false);
        }
    };

    const totalPoints = users.reduce((sum, u) => sum + (u.points || 0), 0);
    const totalEarned = users.reduce((sum, u) => sum + (u.totalEarned || 0), 0);
    const totalRedeemed = users.reduce((sum, u) => sum + (u.totalRedeemed || 0), 0);

    return (
        <div style={styles.layout}>
            <AdminSidebar />
            <div style={styles.content}>
                <div style={styles.header}>
                    <h1 style={styles.title}>🎖️ Loyalty Management</h1>
                    <button onClick={() => setShowBonus(!showBonus)} style={styles.addBtn}>
                        {showBonus ? '✕ Cancel' : '🎁 Award Bonus'}
                    </button>
                </div>

                {error && <div style={{ ...styles.msg, backgroundColor: 'rgba(244,67,54,0.15)', borderColor: 'rgba(244,67,54,0.4)', color: '#ff9999' }}>{error}</div>}
                {msg && <div style={{ ...styles.msg, backgroundColor: msgType === 'success' ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)', borderColor: msgType === 'success' ? 'rgba(76,175,80,0.4)' : 'rgba(244,67,54,0.4)', color: msgType === 'success' ? '#a9e9a3' : '#ff9999' }}>{msg}</div>}

                {/* Stats */}
                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <h3 style={{ color: '#ddd', margin: '0 0 0.5rem 0' }}>Total Active Points</h3>
                        <p style={styles.statValue}>{totalPoints.toLocaleString()}</p>
                    </div>
                    <div style={styles.statCard}>
                        <h3 style={{ color: '#ddd', margin: '0 0 0.5rem 0' }}>Total Earned</h3>
                        <p style={{ ...styles.statValue, color: '#4caf50' }}>{totalEarned.toLocaleString()}</p>
                    </div>
                    <div style={styles.statCard}>
                        <h3 style={{ color: '#ddd', margin: '0 0 0.5rem 0' }}>Total Redeemed</h3>
                        <p style={{ ...styles.statValue, color: '#e87e1e' }}>{totalRedeemed.toLocaleString()}</p>
                    </div>
                    <div style={styles.statCard}>
                        <h3 style={{ color: '#ddd', margin: '0 0 0.5rem 0' }}>Members</h3>
                        <p style={styles.statValue}>{users.length}</p>
                    </div>
                </div>

                {/* Bonus Form */}
                {showBonus && (
                    <form onSubmit={handleAwardBonus} style={styles.form}>
                        <h3>Award Bonus Points</h3>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label>Select User *</label>
                                <select
                                    value={bonusForm.userId}
                                    onChange={e => setBonusForm({ ...bonusForm, userId: e.target.value })}
                                    required
                                    style={styles.input}
                                >
                                    <option value="">Choose a user...</option>
                                    {allCustomers.map(c => {
                                        const loyaltyRecord = users.find(u => u.user?._id === c._id);
                                        const pts = loyaltyRecord ? loyaltyRecord.points : 0;
                                        return (
                                            <option key={c._id} value={c._id}>
                                                {c.name} ({c.email}) - {pts} pts
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label>Points to Award *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={bonusForm.points}
                                    onChange={e => setBonusForm({ ...bonusForm, points: e.target.value })}
                                    required
                                    style={styles.input}
                                    placeholder="e.g., 100"
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Reason</label>
                                <input
                                    value={bonusForm.description}
                                    onChange={e => setBonusForm({ ...bonusForm, description: e.target.value })}
                                    style={styles.input}
                                    placeholder="e.g., Birthday bonus"
                                />
                            </div>
                        </div>
                        <button type="submit" style={styles.submitBtn} disabled={bonusLoading}>
                            {bonusLoading ? 'Awarding...' : 'Award Points'}
                        </button>
                    </form>
                )}

                {/* Users Table */}
                {loading ? (
                    <p style={styles.loading}>Loading loyalty data...</p>
                ) : users.length === 0 ? (
                    <div style={styles.emptyMsg}>No loyalty members found yet. Members are created when users make orders.</div>
                ) : (
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>User</th>
                                    <th style={styles.th}>Email</th>
                                    <th style={styles.th}>Tier</th>
                                    <th style={styles.th}>Points</th>
                                    <th style={styles.th}>Total Earned</th>
                                    <th style={styles.th}>Total Redeemed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => {
                                    const userName = u.user?.name || 'Unknown';
                                    const userEmail = u.user?.email || 'N/A';
                                    const tier = u.tier || 'bronze';
                                    return (
                                        <tr key={u._id}>
                                            <td style={styles.td}>{userName}</td>
                                            <td style={styles.td}>{userEmail}</td>
                                            <td style={styles.td}>
                                                <span style={{
                                                    ...styles.tierBadge,
                                                    backgroundColor: `${tierColors[tier] || tierColors.bronze}30`,
                                                    color: tierColors[tier] || tierColors.bronze,
                                                    borderColor: tierColors[tier] || tierColors.bronze
                                                }}>
                                                    {tier.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ ...styles.td, fontWeight: 700 }}>{u.points || 0}</td>
                                            <td style={{ ...styles.td, color: '#4caf50' }}>{u.totalEarned || 0}</td>
                                            <td style={{ ...styles.td, color: '#e87e1e' }}>{u.totalRedeemed || 0}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#030409' },
    content: { flex: 1, padding: '2rem 2.5rem', marginLeft: '260px', overflowY: 'auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 26, fontWeight: 700, color: '#ffffff' },
    addBtn: {
        padding: '10px 20px', backgroundColor: '#e87e1e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600
    },
    msg: { padding: 12, backgroundColor: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.4)', borderRadius: 8, marginBottom: 16, color: '#a9e9a3' },
    statsGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24
    },
    statCard: {
        background: '#0a0f14', borderRadius: 12, padding: 20, border: '1px solid #2A2A2A', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', textAlign: 'center'
    },
    statValue: { fontSize: 28, fontWeight: 700, margin: '8px 0 0', color: '#ffffff' },
    form: { background: '#0a0f14', padding: 24, borderRadius: 12, marginBottom: 24, border: '1px solid #2A2A2A', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
    formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 },
    formGroup: { marginBottom: 12 },
    input: { width: '100%', padding: '10px 12px', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', backgroundColor: '#030409', color: '#ddd' },
    submitBtn: { padding: '10px 20px', backgroundColor: 'rgba(232, 126, 30, 0.85)', color: '#fff', border: '1px solid rgba(255, 180, 100, 0.25)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginTop: 8, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 4px 16px rgba(232, 126, 30, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)' },
    tableWrapper: { background: '#0a0f14', borderRadius: 12, overflow: 'hidden', border: '1px solid #2A2A2A', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '14px 16px', backgroundColor: 'rgba(0,0,0,0.2)', fontWeight: 600, fontSize: 13, borderBottom: '2px solid #2A2A2A', color: '#ddd' },
    td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#aaa' },
    tierBadge: {
        display: 'inline-block', padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, border: '1px solid'
    },
    loading: { textAlign: 'center', padding: 40, fontSize: 16, color: '#666' },
    emptyMsg: { textAlign: 'center', padding: 40, fontSize: 16, color: '#888', backgroundColor: '#0a0f14', borderRadius: 12, border: '1px solid #2A2A2A', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }
};

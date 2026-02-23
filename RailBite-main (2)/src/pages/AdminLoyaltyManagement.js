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
    const [loading, setLoading] = useState(true);
    const [showBonus, setShowBonus] = useState(false);
    const [bonusForm, setBonusForm] = useState({ userId: '', points: '', description: '' });
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetchLoyalty();
    }, []);

    const fetchLoyalty = async () => {
        try {
            const token = localStorage.getItem('railbiteToken');
            const res = await loyaltyAPI.getAll(token);
            setUsers(res.data.data || []);
        } catch (err) {
            console.error('Error fetching loyalty data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAwardBonus = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('railbiteToken');
            await loyaltyAPI.awardBonus({
                userId: bonusForm.userId,
                points: parseInt(bonusForm.points),
                description: bonusForm.description
            }, token);
            setMsg('Bonus points awarded successfully!');
            setBonusForm({ userId: '', points: '', description: '' });
            setShowBonus(false);
            fetchLoyalty();
        } catch (err) {
            setMsg(err.response?.data?.message || 'Error awarding bonus');
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

                {msg && <div style={styles.msg}>{msg}</div>}

                {/* Stats */}
                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <h3>Total Active Points</h3>
                        <p style={styles.statValue}>{totalPoints.toLocaleString()}</p>
                    </div>
                    <div style={styles.statCard}>
                        <h3>Total Earned</h3>
                        <p style={{ ...styles.statValue, color: '#2ecc71' }}>{totalEarned.toLocaleString()}</p>
                    </div>
                    <div style={styles.statCard}>
                        <h3>Total Redeemed</h3>
                        <p style={{ ...styles.statValue, color: '#e74c3c' }}>{totalRedeemed.toLocaleString()}</p>
                    </div>
                    <div style={styles.statCard}>
                        <h3>Members</h3>
                        <p style={styles.statValue}>{users.length}</p>
                    </div>
                </div>

                {/* Bonus Form */}
                {showBonus && (
                    <form onSubmit={handleAwardBonus} style={styles.form}>
                        <h3>Award Bonus Points</h3>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label>Select User</label>
                                <select
                                    value={bonusForm.userId}
                                    onChange={e => setBonusForm({ ...bonusForm, userId: e.target.value })}
                                    required
                                    style={styles.input}
                                >
                                    <option value="">Choose a user...</option>
                                    {users.map(u => (
                                        <option key={u._id} value={u.user?._id}>
                                            {u.user?.name} ({u.user?.email}) - {u.points} pts
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label>Points to Award</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={bonusForm.points}
                                    onChange={e => setBonusForm({ ...bonusForm, points: e.target.value })}
                                    required
                                    style={styles.input}
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
                        <button type="submit" style={styles.submitBtn}>Award Points</button>
                    </form>
                )}

                {/* Users Table */}
                {loading ? (
                    <p>Loading...</p>
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
                                {users.map(u => (
                                    <tr key={u._id}>
                                        <td style={styles.td}>{u.user?.name || 'N/A'}</td>
                                        <td style={styles.td}>{u.user?.email || 'N/A'}</td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.tierBadge,
                                                backgroundColor: `${tierColors[u.tier]}30`,
                                                color: tierColors[u.tier],
                                                borderColor: tierColors[u.tier]
                                            }}>
                                                {u.tier?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ ...styles.td, fontWeight: 700 }}>{u.points}</td>
                                        <td style={{ ...styles.td, color: '#2ecc71' }}>{u.totalEarned}</td>
                                        <td style={{ ...styles.td, color: '#e74c3c' }}>{u.totalRedeemed}</td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center' }}>No loyalty members yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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
    addBtn: {
        padding: '10px 20px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600
    },
    msg: { padding: 12, backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 8, marginBottom: 16, color: '#155724' },
    statsGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24
    },
    statCard: {
        background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center'
    },
    statValue: { fontSize: 28, fontWeight: 700, margin: '8px 0 0', color: '#1a1a2e' },
    form: { background: '#fff', padding: 24, borderRadius: 12, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 },
    formGroup: { marginBottom: 12 },
    input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
    submitBtn: { padding: '10px 20px', backgroundColor: 'rgba(232, 126, 30, 0.85)', color: '#fff', border: '1px solid rgba(255, 180, 100, 0.25)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginTop: 8, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 4px 16px rgba(232, 126, 30, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)' },
    tableWrapper: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '14px 16px', backgroundColor: '#f8f9fa', fontWeight: 600, fontSize: 13, borderBottom: '2px solid #eee' },
    td: { padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontSize: 14 },
    tierBadge: {
        display: 'inline-block', padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, border: '1px solid'
    }
};

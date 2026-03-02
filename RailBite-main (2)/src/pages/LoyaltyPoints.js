import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loyaltyAPI } from '../services/api';
import BackButton from '../components/BackButton';

const tierColors = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e4e2'
};

const tierGradients = {
    bronze: 'linear-gradient(135deg, #cd7f32 0%, #a0522d 100%)',
    silver: 'linear-gradient(135deg, #c0c0c0 0%, #808080 100%)',
    gold: 'linear-gradient(135deg, #ffd700 0%, #daa520 100%)',
    platinum: 'linear-gradient(135deg, #e5e4e2 0%, #b0b0b0 100%)'
};

const tierIcons = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎'
};

export default function LoyaltyPoints() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('railbiteToken');
            const [pointsRes, historyRes] = await Promise.all([
                loyaltyAPI.getMyPoints(token),
                loyaltyAPI.getHistory(token)
            ]);
            setData(pointsRes.data.data);
            setHistory(historyRes.data.data || []);
        } catch (err) {
            console.error('Error fetching loyalty data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loyalty-page">
                <BackButton />
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <div className="loyalty-spinner" />
                    <p style={{ color: 'var(--text-gray)', marginTop: 16 }}>Loading loyalty points...</p>
                </div>
            </div>
        );
    }

    const tier = data?.tier || 'bronze';
    const nextTier = tier === 'bronze' ? 'silver' : tier === 'silver' ? 'gold' : tier === 'gold' ? 'platinum' : null;
    const nextTierThreshold = tier === 'bronze' ? 500 : tier === 'silver' ? 2000 : tier === 'gold' ? 5000 : null;
    const progressPercent = nextTierThreshold
        ? Math.min(100, ((data?.totalEarned || 0) / nextTierThreshold) * 100)
        : 100;

    return (
        <div className="loyalty-page">
            <BackButton />
            <h1 className="loyalty-title">🎖️ Loyalty Rewards</h1>

            {/* Tier Card */}
            <div className="loyalty-tier-card" style={{ borderColor: tierColors[tier] }}>
                <div className="loyalty-tier-badge" style={{ background: tierGradients[tier] }}>
                    <span className="loyalty-tier-icon">{tierIcons[tier]}</span>
                </div>

                <div className="loyalty-tier-header">
                    <h2 className="loyalty-tier-name" style={{ color: tierColors[tier] }}>
                        {tier.charAt(0).toUpperCase() + tier.slice(1)} Member
                    </h2>
                    <p className="loyalty-user-name">{user?.name}</p>
                </div>

                <div className="loyalty-points-display">
                    <span className="loyalty-points-number">{data?.points || 0}</span>
                    <span className="loyalty-points-label">Available Points</span>
                    <span className="loyalty-points-value">Worth ৳{((data?.points || 0) * 0.5).toFixed(0)}</span>
                </div>

                <div className="loyalty-stats-row">
                    <div className="loyalty-stat">
                        <span className="loyalty-stat-value">{data?.totalEarned || 0}</span>
                        <span className="loyalty-stat-label">Total Earned</span>
                    </div>
                    <div className="loyalty-stat-divider" />
                    <div className="loyalty-stat">
                        <span className="loyalty-stat-value">{data?.totalRedeemed || 0}</span>
                        <span className="loyalty-stat-label">Total Redeemed</span>
                    </div>
                </div>

                {nextTier && (
                    <div className="loyalty-progress-section">
                        <p className="loyalty-progress-text">
                            {Math.max(0, nextTierThreshold - (data?.totalEarned || 0))} points to {nextTier.charAt(0).toUpperCase() + nextTier.slice(1)}
                        </p>
                        <div className="loyalty-progress-bar">
                            <div
                                className="loyalty-progress-fill"
                                style={{ width: `${progressPercent}%`, background: tierGradients[nextTier] }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* How it works */}
            <div className="loyalty-info-card">
                <h3 className="loyalty-section-title">How It Works</h3>
                <div className="loyalty-info-grid">
                    {[
                        { icon: '🛒', title: 'Earn Points', desc: 'Get 1 point for every ৳10 spent' },
                        { icon: '💰', title: 'Redeem', desc: '1 point = ৳0.50 discount' },
                        { icon: '⭐', title: 'Level Up', desc: 'Earn more to unlock higher tiers' },
                        { icon: '🎁', title: 'Min. Redeem', desc: 'Minimum 50 points to redeem' }
                    ].map((item, i) => (
                        <div key={i} className="loyalty-info-item">
                            <span className="loyalty-info-icon">{item.icon}</span>
                            <p className="loyalty-info-name">{item.title}</p>
                            <p className="loyalty-info-desc">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Redeem CTA */}
            {(data?.points || 0) >= 50 && (
                <div className="loyalty-info-card" style={{ 
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(218,165,32,0.08))',
                    border: '1px solid rgba(255,215,0,0.25)',
                    textAlign: 'center',
                    padding: '1.5rem'
                }}>
                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>💰</span>
                    <h3 className="loyalty-section-title" style={{ color: '#ffd700' }}>
                        Ready to Redeem?
                    </h3>
                    <p style={{ color: '#b0b0b0', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        You have <strong style={{ color: '#ffd700' }}>{data.points} points</strong> worth{' '}
                        <strong style={{ color: '#ffd700' }}>৳{(data.points * 0.5).toFixed(0)}</strong>.
                        Use them at checkout to get a discount on your next order!
                    </p>
                    <button
                        onClick={() => navigate('/menu-categories')}
                        style={{
                            padding: '0.8rem 2rem',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #ffd700, #daa520)',
                            color: '#1a1a2e',
                            fontWeight: '700',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        🛒 Order Now & Redeem
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="loyalty-tabs">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`loyalty-tab ${activeTab === 'overview' ? 'active' : ''}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`loyalty-tab ${activeTab === 'history' ? 'active' : ''}`}
                >
                    History
                </button>
            </div>

            {activeTab === 'history' && (
                <div className="loyalty-history">
                    {history.length === 0 ? (
                        <p className="loyalty-empty">No point transactions yet. Start ordering to earn points!</p>
                    ) : (
                        history.map((entry, index) => (
                            <div key={index} className="loyalty-history-item">
                                <div className="loyalty-history-left">
                                    <span className="loyalty-history-type">
                                        {entry.type === 'earned' ? '🟢' : entry.type === 'redeemed' ? '🔴' : '🟡'}
                                        {' '}{entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                                    </span>
                                    <span className="loyalty-history-desc">{entry.description}</span>
                                </div>
                                <div className="loyalty-history-right">
                                    <span className={`loyalty-history-points ${entry.points > 0 ? 'earned' : 'redeemed'}`}>
                                        {entry.points > 0 ? '+' : ''}{entry.points} pts
                                    </span>
                                    <span className="loyalty-history-date">
                                        {new Date(entry.date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'overview' && (
                <div className="loyalty-tiers-overview">
                    <h3 className="loyalty-section-title">Tier Benefits</h3>
                    {['bronze', 'silver', 'gold', 'platinum'].map(t => (
                        <div
                            key={t}
                            className={`loyalty-tier-row ${t === tier ? 'current' : ''}`}
                            style={t === tier ? { borderLeftColor: tierColors[t], background: `${tierColors[t]}15` } : {}}
                        >
                            <span>{tierIcons[t]} <strong>{t.charAt(0).toUpperCase() + t.slice(1)}</strong></span>
                            <span className="loyalty-tier-threshold">
                                {t === 'bronze' ? '0+' : t === 'silver' ? '500+' : t === 'gold' ? '2000+' : '5000+'} pts
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loyaltyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LoyaltyPointsBadge = () => {
    const [points, setPoints] = useState(null);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated()) return;
        const fetchPoints = async () => {
            try {
                const token = localStorage.getItem('railbiteToken');
                if (!token) return;
                const res = await loyaltyAPI.getMyPoints(token);
                if (res.data?.data?.points !== undefined) {
                    setPoints(res.data.data.points);
                }
            } catch {
                setPoints(0);
            }
        };
        fetchPoints();
    }, [isAuthenticated]);

    if (points === null) return null;

    return (
        <div
            onClick={() => navigate('/loyalty')}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                padding: '6px 14px',
                borderRadius: '20px',
                background: 'rgba(232, 126, 30, 0.12)',
                border: '1px solid rgba(232, 126, 30, 0.25)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(232, 126, 30, 0.22)';
                e.currentTarget.style.borderColor = 'rgba(232, 126, 30, 0.5)';
                e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(232, 126, 30, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(232, 126, 30, 0.25)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
            title="Loyalty Points"
        >
            <span style={{ fontSize: '14px' }}>🎖️</span>
            <span style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#e87e1e',
                letterSpacing: '0.3px',
            }}>
                {points} pts
            </span>
        </div>
    );
};

export default LoyaltyPointsBadge;

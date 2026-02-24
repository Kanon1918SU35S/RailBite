import React, { useState, useEffect } from 'react';
import DeliveryStaffSidebar from '../components/DeliveryStaffSidebar';
import { useDeliveryStaff } from '../context/DeliveryStaffContext';
import { deliveryPortalAPI } from '../services/api';

const DeliveryStaffProfile = () => {
    const { staffUser, getToken, staffLoginSuccess } = useDeliveryStaff();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = getToken();
            const res = await deliveryPortalAPI.getMyProfile(token);
            if (res.data.success) {
                const p = res.data.data;
                setProfile(p);
                setFormData({
                    name: p.name || '',
                    phone: p.phone || ''
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error loading profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = getToken();
            const res = await deliveryPortalAPI.updateMyProfile(formData, token);
            if (res.data.success) {
                setProfile(res.data.data);
                setEditing(false);
                alert('Profile updated successfully!');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-layout ds-layout">
                <DeliveryStaffSidebar />
                <div className="admin-content">
                    <div className="admin-header">
                        <h1>My Profile</h1>
                        <p>Loading profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout ds-layout">
            <DeliveryStaffSidebar />
            <div className="admin-content">
                <div className="admin-header">
                    <div>
                        <h1>My Profile</h1>
                        <p>View and update your delivery staff profile</p>
                    </div>
                    {!editing && (
                        <button className="admin-btn-primary" onClick={() => setEditing(true)}>
                            ✏️ Edit Profile
                        </button>
                    )}
                </div>

                {error && (
                    <div className="ds-error-banner">
                        <p>{error}</p>
                        <button className="admin-btn-link" onClick={fetchProfile}>Retry</button>
                    </div>
                )}

                <div className="ds-profile-grid">
                    {/* Profile Card */}
                    <div className="admin-card ds-profile-card">
                        <div className="ds-profile-avatar">
                            <div className="ds-avatar-circle">
                                {(profile?.name || staffUser?.name || 'D')[0].toUpperCase()}
                            </div>
                            <h2>{profile?.name || staffUser?.name || 'Delivery Staff'}</h2>
                            <p className="ds-profile-role">Delivery Partner</p>
                            <span className={`admin-status-badge status-${profile?.status || 'available'}`}>
                                {profile?.status || 'Available'}
                            </span>
                        </div>

                        <div className="ds-profile-stats">
                            <div className="ds-profile-stat">
                                <span className="ds-profile-stat-value">{profile?.totalDeliveries || 0}</span>
                                <span className="ds-profile-stat-label">Total Deliveries</span>
                            </div>
                            <div className="ds-profile-stat">
                                <span className="ds-profile-stat-value">{(profile?.rating || 0).toFixed(1)} ⭐</span>
                                <span className="ds-profile-stat-label">Rating</span>
                            </div>
                            <div className="ds-profile-stat">
                                <span className="ds-profile-stat-value">{profile?.onTimeRate || 0}%</span>
                                <span className="ds-profile-stat-label">On-Time</span>
                            </div>
                        </div>
                    </div>

                    {/* Details / Edit Form */}
                    <div className="admin-card ds-profile-details">
                        {editing ? (
                            <form onSubmit={handleSubmit} className="admin-form">
                                <h3 className="ds-card-title">Edit Profile</h3>

                                <div className="admin-form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter your name"
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        placeholder="01712345678"
                                    />
                                </div>

                                <div className="ds-form-actions">
                                    <button
                                        type="button"
                                        className="admin-btn-secondary"
                                        onClick={() => setEditing(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="admin-btn-primary"
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <h3 className="ds-card-title">Profile Information</h3>
                                <div className="ds-info-list">
                                    <div className="ds-info-row">
                                        <span className="ds-info-label">Full Name</span>
                                        <span className="ds-info-value">{profile?.name || 'N/A'}</span>
                                    </div>
                                    <div className="ds-info-row">
                                        <span className="ds-info-label">Email</span>
                                        <span className="ds-info-value">{profile?.email || staffUser?.email || 'N/A'}</span>
                                    </div>
                                    <div className="ds-info-row">
                                        <span className="ds-info-label">Phone</span>
                                        <span className="ds-info-value">{profile?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="ds-info-row">
                                        <span className="ds-info-label">Joined</span>
                                        <span className="ds-info-value">
                                            {profile?.createdAt
                                                ? new Date(profile.createdAt).toLocaleDateString('en-BD', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })
                                                : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryStaffProfile;

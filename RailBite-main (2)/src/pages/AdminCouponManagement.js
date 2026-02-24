import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import Toast from '../components/Toast';
import { couponAPI } from '../services/api';
import '../styles/admin.css';
import '../styles/admin-menu.css';
import '../styles/admin-coupons.css';

const EMPTY_FORM = {
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscount: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    perUserLimit: '1',
    applicableTo: 'all',
    isActive: true
};

const FILTER_OPTIONS = [
    { key: 'all', label: 'All', icon: '🎟️' },
    { key: 'active', label: 'Active', icon: '✅' },
    { key: 'expired', label: 'Expired', icon: '⏰' },
    { key: 'scheduled', label: 'Scheduled', icon: '📅' },
    { key: 'inactive', label: 'Inactive', icon: '⏸️' },
    { key: 'depleted', label: 'Depleted', icon: '🚫' }
];

const AdminCouponManagement = () => {
    const [coupons, setCoupons] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [form, setForm] = useState(EMPTY_FORM);

    const token = localStorage.getItem('railbite_token');

    useEffect(() => {
        fetchCoupons();
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── Data fetching ── */

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const res = await couponAPI.getAll(token);
            if (res.data.success) setCoupons(res.data.data);
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Failed to load coupons', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await couponAPI.getStats(token);
            if (res.data.success) setStats(res.data.data);
        } catch (err) {
            console.error('Stats fetch error:', err.message);
        }
    };

    /* ── Filtering & search ── */

    const filteredCoupons = useMemo(() => {
        let list = [...coupons];

        // Status filter
        if (filter !== 'all') {
            list = list.filter(c => c.computedStatus === filter);
        }

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(c =>
                c.code.toLowerCase().includes(q) ||
                (c.description && c.description.toLowerCase().includes(q))
            );
        }

        return list;
    }, [coupons, filter, search]);

    const filterCounts = useMemo(() => {
        const counts = { all: coupons.length };
        FILTER_OPTIONS.slice(1).forEach(f => {
            counts[f.key] = coupons.filter(c => c.computedStatus === f.key).length;
        });
        return counts;
    }, [coupons]);

    /* ── Form handlers ── */

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditing(null);
        setShowModal(false);
    };

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setEditing(null);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...form,
                discountValue: Number(form.discountValue),
                minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
                maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
                usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
                perUserLimit: Number(form.perUserLimit) || 1
            };

            if (editing) {
                await couponAPI.update(editing, payload, token);
                setToast({ message: 'Coupon updated successfully', type: 'success' });
            } else {
                await couponAPI.create(payload, token);
                setToast({ message: 'Coupon created successfully', type: 'success' });
            }
            resetForm();
            fetchCoupons();
            fetchStats();
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Failed to save coupon', type: 'error' });
        }
    };

    const handleEdit = (coupon) => {
        setForm({
            code: coupon.code,
            description: coupon.description || '',
            discountType: coupon.discountType,
            discountValue: coupon.discountValue.toString(),
            minOrderAmount: coupon.minOrderAmount ? coupon.minOrderAmount.toString() : '',
            maxDiscount: coupon.maxDiscount ? coupon.maxDiscount.toString() : '',
            validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 16) : '',
            validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 16) : '',
            usageLimit: coupon.usageLimit ? coupon.usageLimit.toString() : '',
            perUserLimit: coupon.perUserLimit ? coupon.perUserLimit.toString() : '1',
            applicableTo: coupon.applicableTo || 'all',
            isActive: coupon.isActive
        });
        setEditing(coupon._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await couponAPI.delete(id, token);
            setToast({ message: 'Coupon deleted', type: 'success' });
            fetchCoupons();
            fetchStats();
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Failed to delete', type: 'error' });
        }
    };

    const handleToggleActive = async (coupon) => {
        try {
            await couponAPI.update(coupon._id, { isActive: !coupon.isActive }, token);
            fetchCoupons();
        } catch (err) {
            setToast({ message: 'Failed to toggle status', type: 'error' });
        }
    };

    /* ── Helpers ── */

    const getStatusBadge = (coupon) => {
        const s = coupon.computedStatus || 'inactive';
        const labels = { active: 'Active', expired: 'Expired', scheduled: 'Scheduled', depleted: 'Depleted', inactive: 'Inactive' };
        return (
            <span className={`coupon-badge coupon-badge--${s}`}>
                <span className="coupon-badge__dot" />
                {labels[s] || 'Inactive'}
            </span>
        );
    };

    const getUsageBar = (coupon) => {
        const used = coupon.usedCount || 0;
        const limit = coupon.usageLimit;
        const pct = limit ? Math.min((used / limit) * 100, 100) : 0;
        return (
            <div className="coupon-usage-bar-wrapper">
                <span className="coupon-usage-text">
                    {used}{limit ? ` / ${limit}` : ' uses'}
                </span>
                {limit > 0 && (
                    <div className="coupon-usage-bar">
                        <div className="coupon-usage-bar__fill" style={{ width: `${pct}%` }} />
                    </div>
                )}
            </div>
        );
    };

    /* ── Render ── */

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <div className="admin-content">

                {/* ── Header ── */}
                <div className="admin-header">
                    <div>
                        <h1>🎟️ Coupon Management</h1>
                        <p>Create and manage promotional coupons</p>
                    </div>
                    <button className="admin-btn-primary" onClick={openCreate}>
                        + Create Coupon
                    </button>
                </div>

                {/* ── Stats Grid ── */}
                {stats && (
                    <div className="admin-stats-grid-small">
                        <div className="admin-stat-card admin-stat-coupons-total">
                            <div className="admin-stat-icon">🎟️</div>
                            <div className="admin-stat-content">
                                <div className="admin-stat-label">Total Coupons</div>
                                <div className="admin-stat-value">{stats.totalCoupons}</div>
                                <div className="admin-stat-sub">All time</div>
                            </div>
                        </div>
                        <div className="admin-stat-card admin-stat-coupons-active">
                            <div className="admin-stat-icon">✅</div>
                            <div className="admin-stat-content">
                                <div className="admin-stat-label">Active</div>
                                <div className="admin-stat-value">{stats.activeCoupons}</div>
                                <div className="admin-stat-sub">Currently valid</div>
                            </div>
                        </div>
                        <div className="admin-stat-card admin-stat-coupons-expired">
                            <div className="admin-stat-icon">⏰</div>
                            <div className="admin-stat-content">
                                <div className="admin-stat-label">Expired</div>
                                <div className="admin-stat-value">{stats.expiredCoupons}</div>
                                <div className="admin-stat-sub">Past validity</div>
                            </div>
                        </div>
                        <div className="admin-stat-card admin-stat-coupons-usage">
                            <div className="admin-stat-icon">📊</div>
                            <div className="admin-stat-content">
                                <div className="admin-stat-label">Total Uses</div>
                                <div className="admin-stat-value">{stats.totalUsages}</div>
                                <div className="admin-stat-sub">Redemptions</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Toolbar: search + filters ── */}
                <div className="coupon-toolbar">
                    <div className="coupon-toolbar-left">
                        <div className="coupon-search-bar">
                            <span className="coupon-search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search by code or description…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="coupon-filter-row">
                            {FILTER_OPTIONS.map(f => (
                                <button
                                    key={f.key}
                                    className={`coupon-filter-chip${filter === f.key ? ' coupon-filter-chip--active' : ''}`}
                                    onClick={() => setFilter(f.key)}
                                >
                                    {f.icon} {f.label}
                                    <span className="coupon-filter-chip__count">{filterCounts[f.key] ?? 0}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Coupon Table ── */}
                {loading ? (
                    <div className="coupon-loading">Loading coupons…</div>
                ) : filteredCoupons.length === 0 ? (
                    <div className="coupon-empty-state">
                        <div className="coupon-empty-icon">🎟️</div>
                        <h3>{coupons.length === 0 ? 'No Coupons Yet' : 'No Matching Coupons'}</h3>
                        <p>
                            {coupons.length === 0
                                ? 'Create your first coupon to offer discounts to customers.'
                                : 'Try adjusting your search or filter.'}
                        </p>
                    </div>
                ) : (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Discount</th>
                                    <th>Min Order</th>
                                    <th>Valid Until</th>
                                    <th>Usage</th>
                                    <th>Scope</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCoupons.map((coupon) => (
                                    <tr key={coupon._id}>
                                        <td>
                                            <div className="coupon-code-cell">
                                                <span className="coupon-code-text">{coupon.code}</span>
                                                {coupon.description && (
                                                    <span className="coupon-code-desc">{coupon.description}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="coupon-discount-cell">
                                                <span className="coupon-discount-value">
                                                    {coupon.discountType === 'percentage'
                                                        ? `${coupon.discountValue}%`
                                                        : `৳${coupon.discountValue}`}
                                                </span>
                                                {coupon.maxDiscount > 0 && (
                                                    <span className="coupon-discount-cap">
                                                        Max: ৳{coupon.maxDiscount}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>৳{coupon.minOrderAmount || 0}</td>
                                        <td>
                                            {new Date(coupon.validUntil).toLocaleDateString('en-US', {
                                                month: 'short', day: 'numeric', year: 'numeric'
                                            })}
                                        </td>
                                        <td>{getUsageBar(coupon)}</td>
                                        <td>
                                            <span className="coupon-badge coupon-badge--active" style={{ textTransform: 'capitalize' }}>
                                                {coupon.applicableTo === 'all' ? '🌐 All' : coupon.applicableTo === 'train' ? '🚂 Train' : '🏪 Station'}
                                            </span>
                                        </td>
                                        <td>{getStatusBadge(coupon)}</td>
                                        <td>
                                            <div className="admin-actions">
                                                <button className="admin-btn-edit" onClick={() => handleEdit(coupon)} title="Edit">
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    className={`coupon-btn-toggle ${coupon.isActive ? 'coupon-btn-toggle--pause' : 'coupon-btn-toggle--resume'}`}
                                                    onClick={() => handleToggleActive(coupon)}
                                                    title={coupon.isActive ? 'Pause' : 'Resume'}
                                                >
                                                    {coupon.isActive ? '⏸️' : '▶️'}
                                                </button>
                                                <button className="admin-btn-delete" onClick={() => handleDelete(coupon._id)} title="Delete">
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Create / Edit Modal ── */}
                {showModal && (
                    <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}>
                        <div className="admin-modal" style={{ maxWidth: '700px' }}>
                            <div className="admin-modal-header">
                                <h2>{editing ? '✏️ Edit Coupon' : '🎟️ Create New Coupon'}</h2>
                                <button className="admin-modal-close" onClick={resetForm}>&times;</button>
                            </div>

                            <form className="admin-form" onSubmit={handleSubmit}>
                                {/* Row 1: Code + Description */}
                                <div className="admin-form-row">
                                    <div className="admin-form-group">
                                        <label>Coupon Code *</label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={form.code}
                                            onChange={handleFormChange}
                                            placeholder="e.g. RAIL20"
                                            required
                                            style={{ textTransform: 'uppercase' }}
                                            disabled={!!editing}
                                        />
                                    </div>
                                    <div className="admin-form-group">
                                        <label>Description</label>
                                        <input
                                            type="text"
                                            name="description"
                                            value={form.description}
                                            onChange={handleFormChange}
                                            placeholder="20% off on all orders"
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Discount Type + Value */}
                                <div className="admin-form-row">
                                    <div className="admin-form-group">
                                        <label>Discount Type *</label>
                                        <select name="discountType" value={form.discountType} onChange={handleFormChange}>
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="flat">Flat Amount (৳)</option>
                                        </select>
                                    </div>
                                    <div className="admin-form-group">
                                        <label>Discount Value *</label>
                                        <input
                                            type="number"
                                            name="discountValue"
                                            value={form.discountValue}
                                            onChange={handleFormChange}
                                            placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 100'}
                                            required
                                            min="0"
                                        />
                                    </div>
                                </div>

                                {/* Row 3: Min Order + Max Discount */}
                                <div className="admin-form-row">
                                    <div className="admin-form-group">
                                        <label>Min Order Amount (৳)</label>
                                        <input
                                            type="number"
                                            name="minOrderAmount"
                                            value={form.minOrderAmount}
                                            onChange={handleFormChange}
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>
                                    <div className="admin-form-group">
                                        <label>Max Discount (৳)</label>
                                        <input
                                            type="number"
                                            name="maxDiscount"
                                            value={form.maxDiscount}
                                            onChange={handleFormChange}
                                            placeholder="No limit"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                {/* Row 4: Valid From + Until */}
                                <div className="admin-form-row">
                                    <div className="admin-form-group">
                                        <label>Valid From *</label>
                                        <input
                                            type="datetime-local"
                                            name="validFrom"
                                            value={form.validFrom}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="admin-form-group">
                                        <label>Valid Until *</label>
                                        <input
                                            type="datetime-local"
                                            name="validUntil"
                                            value={form.validUntil}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Row 5: Usage + Per User + Applicable */}
                                <div className="admin-form-row">
                                    <div className="admin-form-group">
                                        <label>Total Usage Limit</label>
                                        <input
                                            type="number"
                                            name="usageLimit"
                                            value={form.usageLimit}
                                            onChange={handleFormChange}
                                            placeholder="Unlimited"
                                            min="1"
                                        />
                                    </div>
                                    <div className="admin-form-group">
                                        <label>Per User Limit</label>
                                        <input
                                            type="number"
                                            name="perUserLimit"
                                            value={form.perUserLimit}
                                            onChange={handleFormChange}
                                            placeholder="1"
                                            min="1"
                                        />
                                    </div>
                                    <div className="admin-form-group">
                                        <label>Applicable To</label>
                                        <select name="applicableTo" value={form.applicableTo} onChange={handleFormChange}>
                                            <option value="all">All Orders</option>
                                            <option value="train">Train Orders Only</option>
                                            <option value="station">Station Orders Only</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Active toggle */}
                                <label className="admin-checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={form.isActive}
                                        onChange={handleFormChange}
                                    />
                                    Active on creation
                                </label>

                                {/* Footer buttons */}
                                <div className="admin-modal-footer">
                                    <button type="button" className="admin-btn-secondary" onClick={resetForm}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="admin-btn-primary">
                                        {editing ? '💾 Update Coupon' : '🎟️ Create Coupon'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default AdminCouponManagement;

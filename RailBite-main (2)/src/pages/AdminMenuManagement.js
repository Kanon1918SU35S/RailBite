import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { menuAPI } from '../services/api';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

/* ───────── Registry ───────── */
const SECTIONS = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '🍛' },
  { value: 'dinner', label: 'Dinner', icon: '🌙' },
  { value: 'snacksanddrinks', label: 'Snacks & Drinks', icon: '🍟' },
];

const CATEGORIES = [
  { value: 'general', label: 'General', icon: '🍽️' },
  { value: 'burger', label: 'Burger', icon: '🍔' },
  { value: 'pizza', label: 'Pizza', icon: '🍕' },
  { value: 'shwarma', label: 'Shwarma', icon: '🌯' },
  { value: 'smoothie', label: 'Smoothie', icon: '🥤' },
  { value: 'beverage', label: 'Beverage', icon: '🥂' },
  { value: 'biryani', label: 'Biryani', icon: '🍛' },
];

const AdminMenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [activeSection, setActiveSection] = useState('breakfast');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    section: 'breakfast',
    category: 'general',
    available: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  /* ── Counts ── */
  const sectionCounts = useMemo(() => {
    const c = {};
    SECTIONS.forEach(s => { c[s.value] = 0; });
    menuItems.forEach(item => {
      if (c[item.section] !== undefined) c[item.section]++;
    });
    return c;
  }, [menuItems]);

  const sectionItems = useMemo(
    () => menuItems.filter(i => i.section === activeSection),
    [menuItems, activeSection]
  );

  const categoryCounts = useMemo(() => {
    const c = { all: sectionItems.length };
    CATEGORIES.forEach(cat => { c[cat.value] = 0; });
    sectionItems.forEach(item => {
      if (c[item.category] !== undefined) c[item.category]++;
    });
    return c;
  }, [sectionItems]);

  const filteredItems = useMemo(() => {
    return sectionItems.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === 'all' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [sectionItems, searchQuery, activeCategory]);

  /* ── Load all items ── */
  useEffect(() => { loadMenuItems(); }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await menuAPI.getAll();
      if (res.data.success) {
        setMenuItems(res.data.data || []);
      } else {
        setError(res.data.message || 'Failed to load menu');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading menu');
    } finally {
      setLoading(false);
    }
  };

  /* ── Selection ── */
  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every(i => selectedIds.has(i._id));

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredItems.forEach(i => next.delete(i._id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredItems.forEach(i => next.add(i._id));
        return next;
      });
    }
  };

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // Clear selection on section / category change
  useEffect(() => { clearSelection(); }, [activeSection, activeCategory, clearSelection]);

  /* ── Bulk actions ── */
  const handleBulkDelete = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    setConfirmModal({
      message: `Delete ${count} item(s)? This cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          setBulkLoading(true);
          const token = localStorage.getItem('railbite_token');
          const res = await menuAPI.bulkDelete([...selectedIds], token);
          if (res.data.success) {
            setMenuItems(prev => prev.filter(m => !selectedIds.has(m._id)));
            clearSelection();
            setToast({ message: `${res.data.deleted} item(s) deleted.`, type: 'success' });
          }
        } catch (err) {
          setToast({ message: err.response?.data?.message || err.message || 'Bulk delete failed', type: 'error' });
        } finally { setBulkLoading(false); }
      }
    });
  };

  const handleBulkAvailability = (available) => {
    const count = selectedIds.size;
    if (count === 0) return;
    const action = available ? 'enable' : 'disable';
    setConfirmModal({
      message: `${action.charAt(0).toUpperCase() + action.slice(1)} ${count} item(s)?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          setBulkLoading(true);
          const token = localStorage.getItem('railbite_token');
          const res = await menuAPI.bulkToggleAvailability([...selectedIds], available, token);
          if (res.data.success) {
            const updatedMap = {};
            (res.data.data || []).forEach(item => { updatedMap[item._id] = item; });
            setMenuItems(prev => prev.map(m => updatedMap[m._id] ? updatedMap[m._id] : m));
            setToast({ message: `${res.data.modified} item(s) ${action}d.`, type: 'success' });
          }
        } catch (err) {
          setToast({ message: err.response?.data?.message || err.message || 'Bulk update failed', type: 'error' });
        } finally { setBulkLoading(false); }
      }
    });
  };

  const selectEntireSection = () => {
    const ids = sectionItems.map(i => i._id);
    setSelectedIds(new Set(ids));
    setActiveCategory('all');
  };

  /* ── Form handlers ── */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('railbite_token');
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('price', parseFloat(formData.price));
      fd.append('description', formData.description);
      fd.append('section', formData.section);
      fd.append('category', formData.category);
      fd.append('available', formData.available);
      if (imageFile) fd.append('image', imageFile);

      if (editingItem) {
        const res = await menuAPI.update(editingItem._id, fd, token);
        if (res.data.success) {
          setMenuItems(prev => prev.map(item => item._id === editingItem._id ? res.data.data : item));
          setToast({ message: 'Menu item updated successfully.', type: 'success' });
        }
      } else {
        const res = await menuAPI.create(fd, token);
        if (res.data.success) {
          setMenuItems(prev => [res.data.data, ...prev]);
          setToast({ message: 'Menu item added successfully.', type: 'success' });
        }
      }
      resetForm();
    } catch (err) {
      setToast({ message: err.response?.data?.message || err.message || 'Failed to save item', type: 'error' });
    } finally { setSaving(false); }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price,
      description: item.description,
      section: item.section,
      category: item.category,
      available: item.available
    });
    setImageFile(null);
    setImagePreview(item.image || '');
    setShowAddModal(true);
  };

  const handleDelete = (item) => {
    setConfirmModal({
      message: `Delete "${item.name}"? This cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('railbite_token');
          const res = await menuAPI.delete(item._id, token);
          if (res.data.success) {
            setMenuItems(prev => prev.filter(m => m._id !== item._id));
            setToast({ message: 'Menu item deleted.', type: 'success' });
          }
        } catch (err) {
          setToast({ message: err.response?.data?.message || err.message || 'Failed to delete', type: 'error' });
        }
      }
    });
  };

  const toggleAvailability = async (item) => {
    try {
      const token = localStorage.getItem('railbite_token');
      const res = await menuAPI.toggleAvailability(item._id, !item.available, token);
      if (res.data.success) {
        setMenuItems(prev => prev.map(m => m._id === item._id ? res.data.data : m));
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || err.message || 'Failed to toggle availability', type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      section: activeSection,
      category: 'general',
      available: true
    });
    setImageFile(null);
    setImagePreview('');
    setEditingItem(null);
    setShowAddModal(false);
  };

  const openAddModal = () => {
    setFormData(prev => ({
      ...prev,
      section: activeSection,
      category: activeCategory !== 'all' ? activeCategory : 'general'
    }));
    setShowAddModal(true);
  };

  /* ── Helper to get label ── */
  const sectionLabel = (val) => SECTIONS.find(s => s.value === val)?.label || val;
  const categoryLabel = (val) => CATEGORIES.find(c => c.value === val)?.label || val;

  /* ── Render ── */
  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-header"><h1>Menu Management</h1><p>Loading menu items...</p></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-header">
            <h1>Menu Management</h1>
            <p className="admin-error-text">Error: {error}</p>
            <button className="admin-btn-primary" onClick={loadMenuItems}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <div>
            <h1>Menu Management</h1>
            <p>Manage items across all menu sections and categories</p>
          </div>
          <button className="admin-btn-primary" onClick={openAddModal}>
            + Add New Item
          </button>
        </div>

        {/* ── Section Tabs ── */}
        <div className="admin-section-tabs">
          {SECTIONS.map(s => (
            <button
              key={s.value}
              className={`admin-section-tab ${activeSection === s.value ? 'admin-section-tab--active' : ''}`}
              onClick={() => { setActiveSection(s.value); setActiveCategory('all'); }}
            >
              <span className="admin-section-tab__icon">{s.icon}</span>
              <span className="admin-section-tab__label">{s.label}</span>
              <span className="admin-section-tab__count">{sectionCounts[s.value]}</span>
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="admin-filters" style={{ marginBottom: '0.5rem' }}>
          <input
            type="text"
            placeholder={`Search in ${sectionLabel(activeSection)}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>

        {/* ── Category Chips ── */}
        <div className="admin-category-chips-wrapper">
          <button
            className={`admin-chip ${activeCategory === 'all' ? 'admin-chip--active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All <span className="admin-chip__count">{categoryCounts.all}</span>
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              className={`admin-chip ${activeCategory === c.value ? 'admin-chip--active' : ''}`}
              onClick={() => setActiveCategory(c.value)}
            >
              {c.icon} {c.label} <span className="admin-chip__count">{categoryCounts[c.value]}</span>
            </button>
          ))}
        </div>

        {/* ── Bulk Action Bar ── */}
        {selectedIds.size > 0 && (
          <div className="admin-bulk-bar">
            <span className="admin-bulk-bar__info">
              {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="admin-bulk-bar__actions">
              <button className="admin-bulk-btn admin-bulk-btn--enable" disabled={bulkLoading} onClick={() => handleBulkAvailability(true)}>Enable All</button>
              <button className="admin-bulk-btn admin-bulk-btn--disable" disabled={bulkLoading} onClick={() => handleBulkAvailability(false)}>Disable All</button>
              <button className="admin-bulk-btn admin-bulk-btn--delete" disabled={bulkLoading} onClick={handleBulkDelete}>Delete Selected</button>
              <button className="admin-bulk-btn admin-bulk-btn--clear" onClick={clearSelection}>Clear</button>
            </div>
          </div>
        )}

        {/* Section quick-select */}
        {selectedIds.size === 0 && sectionItems.length > 0 && (
          <div className="admin-section-bar">
            <span>
              Viewing <strong>{sectionCounts[activeSection]}</strong> item{sectionCounts[activeSection] !== 1 ? 's' : ''} in <strong>{sectionLabel(activeSection)}</strong>
            </span>
            <button className="admin-bulk-btn admin-bulk-btn--select" onClick={selectEntireSection}>
              Select Entire Section
            </button>
          </div>
        )}

        {/* ── Table ── */}
        <div className="admin-card">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" checked={allFilteredSelected && filteredItems.length > 0} onChange={toggleSelectAll} title="Select all visible items" />
                  </th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <tr key={item._id} className={selectedIds.has(item._id) ? 'admin-row--selected' : ''}>
                      <td>
                        <input type="checkbox" checked={selectedIds.has(item._id)} onChange={() => toggleSelectOne(item._id)} />
                      </td>
                      <td>
                        <img
                          src={item.image ? (item.image.startsWith('/uploads') ? `${(process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace('/api', '')}${item.image}` : item.image) : '/images/placeholder.jpg'}
                          alt={item.name} className="admin-table-img"
                        />
                      </td>
                      <td>
                        <div>
                          <strong>{item.name}</strong>
                          <p className="admin-table-description">{item.description}</p>
                        </div>
                      </td>
                      <td>
                        <span className="admin-category-badge">{categoryLabel(item.category)}</span>
                      </td>
                      <td>৳{item.price}</td>
                      <td>
                        <button
                          className={`admin-toggle-btn ${item.available ? 'active' : ''}`}
                          onClick={() => toggleAvailability(item)}
                        >
                          {item.available ? 'Available' : 'Unavailable'}
                        </button>
                      </td>
                      <td>
                        <div className="admin-action-buttons">
                          <button className="admin-btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                          <button className="admin-btn-delete" onClick={() => handleDelete(item)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="admin-empty-cell">
                      <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                          {activeCategory !== 'all'
                            ? `No ${categoryLabel(activeCategory)} items in ${sectionLabel(activeSection)}.`
                            : `No items in ${sectionLabel(activeSection)}.`}
                        </p>
                        <button className="admin-btn-primary" style={{ marginTop: '0.75rem' }} onClick={openAddModal}>
                          + Add Item to {sectionLabel(activeSection)}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Add / Edit Modal ── */}
        {showAddModal && (
          <div className="admin-modal-overlay" onClick={resetForm}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
                <button className="admin-modal-close" onClick={resetForm}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="admin-form">
                <div className="admin-form-group">
                  <label>Item Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Enter item name" />
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Price (৳) *</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" step="0.01" placeholder="0.00" />
                  </div>
                  <div className="admin-form-group">
                    <label>Section *</label>
                    <select name="section" value={formData.section} onChange={handleInputChange} required>
                      {SECTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Category *</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} required>
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Description</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" placeholder="Enter item description" />
                </div>

                <div className="admin-form-group">
                  <label>Image</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="admin-file-input"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  {imagePreview && (
                    <div className="admin-image-preview">
                      <img src={imagePreview.startsWith('blob:') || imagePreview.startsWith('data:') || imagePreview.startsWith('http') ? imagePreview : `${(process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace('/api', '')}${imagePreview}`} alt="Preview" />
                    </div>
                  )}
                </div>

                <div className="admin-form-group">
                  <label className="admin-checkbox-label">
                    <input type="checkbox" name="available" checked={formData.available} onChange={handleInputChange} />
                    <span>Available for order</span>
                  </label>
                </div>

                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn-secondary" onClick={resetForm}>Cancel</button>
                  <button type="submit" className="admin-btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          type={confirmModal.type}
          onConfirm={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};

export default AdminMenuManagement;
import React, { useState, useEffect } from 'react';
import { trainAPI } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminTrainManagement() {
    const [trains, setTrains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [form, setForm] = useState({
        trainNumber: '',
        trainName: '',
        trainType: 'express',
        runDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        route: []
    });
    const [stationForm, setStationForm] = useState({
        stationCode: '',
        stationName: '',
        arrivalTime: '',
        departureTime: '',
        stopOrder: 1,
        haltMinutes: 0
    });
    const [msg, setMsg] = useState('');
    const [msgType, setMsgType] = useState('success');

    useEffect(() => {
        fetchTrains();
    }, []);

    const fetchTrains = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('railbite_token');
            if (!token) {
                setError('Authentication token not found. Please login again.');
                setLoading(false);
                return;
            }
            const res = await trainAPI.getAll(token);
            console.log('Trains API Response:', res);
            setTrains(res.data?.data || []);
            if (!res.data?.data || res.data.data.length === 0) {
                console.warn('No train data received from backend');
            }
        } catch (err) {
            console.error('Error fetching trains:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch trains';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const validateTrainForm = () => {
        if (!form.trainNumber.trim()) {
            setMsg('Train number is required');
            setMsgType('error');
            return false;
        }
        if (!form.trainName.trim()) {
            setMsg('Train name is required');
            setMsgType('error');
            return false;
        }
        if (form.runDays.length === 0) {
            setMsg('Please select at least one running day');
            setMsgType('error');
            return false;
        }
        if (form.route.length === 0) {
            setMsg('Please add at least one station to the route');
            setMsgType('error');
            return false;
        }
        return true;
    };

    const validateStationForm = () => {
        if (!stationForm.stationCode.trim()) {
            setMsg('Station code is required');
            setMsgType('error');
            return false;
        }
        if (!stationForm.stationName.trim()) {
            setMsg('Station name is required');
            setMsgType('error');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateTrainForm()) return;

        setSubmitLoading(true);
        try {
            const token = localStorage.getItem('railbite_token');
            if (editingId) {
                await trainAPI.update(editingId, form, token);
                setMsg('Train updated successfully!');
            } else {
                await trainAPI.create(form, token);
                setMsg('Train added successfully!');
            }
            setMsgType('success');
            resetForm();
            fetchTrains();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Error saving train';
            setMsg(errorMsg);
            setMsgType('error');
            console.error('Error saving train:', err);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEdit = (train) => {
        setEditingId(train._id);
        setForm({
            trainNumber: train.trainNumber,
            trainName: train.trainName,
            trainType: train.trainType,
            runDays: train.runDays || [],
            route: train.route || []
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this train? This action cannot be undone.')) return;
        try {
            const token = localStorage.getItem('railbite_token');
            await trainAPI.delete(id, token);
            setMsg('Train deleted successfully');
            setMsgType('success');
            fetchTrains();
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Error deleting train';
            setMsg(errorMsg);
            setMsgType('error');
            console.error('Error deleting train:', err);
        }
    };

    const addStation = () => {
        if (!validateStationForm()) return;
        setForm({
            ...form,
            route: [...form.route, { ...stationForm, stopOrder: form.route.length + 1 }]
        });
        setStationForm({ stationCode: '', stationName: '', arrivalTime: '', departureTime: '', stopOrder: 1, haltMinutes: 0 });
        setMsg('Station added to route');
        setMsgType('success');
    };

    const removeStation = (index) => {
        const updated = form.route.filter((_, i) => i !== index);
        setForm({ ...form, route: updated.map((s, i) => ({ ...s, stopOrder: i + 1 })) });
    };

    const toggleDay = (day) => {
        setForm({
            ...form,
            runDays: form.runDays.includes(day)
                ? form.runDays.filter(d => d !== day)
                : [...form.runDays, day]
        });
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm({ trainNumber: '', trainName: '', trainType: 'express', runDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], route: [] });
        setStationForm({ stationCode: '', stationName: '', arrivalTime: '', departureTime: '', stopOrder: 1, haltMinutes: 0 });
        setMsg('');
    };

    const allDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div style={styles.layout}>
            <AdminSidebar />
            <div style={styles.content}>
                <div style={styles.header}>
                    <h1 style={styles.title}>🚂 Train Management</h1>
                    <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={styles.addBtn}>
                        {showForm ? '✕ Cancel' : '+ Add Train'}
                    </button>
                </div>

                {error && <div style={{ ...styles.msg, backgroundColor: 'rgba(244,67,54,0.15)', borderColor: 'rgba(244,67,54,0.4)', color: '#ff9999' }}>{error}</div>}
                {msg && <div style={{ ...styles.msg, backgroundColor: msgType === 'success' ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)', borderColor: msgType === 'success' ? 'rgba(76,175,80,0.4)' : 'rgba(244,67,54,0.4)', color: msgType === 'success' ? '#a9e9a3' : '#ff9999' }}>{msg}</div>}

                {showForm && (
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <h3 style={{ color: '#ddd', margin: '0 0 16px 0' }}>{editingId ? 'Edit Train' : 'Add New Train'}</h3>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label>Train Number *</label>
                                <input
                                    value={form.trainNumber}
                                    onChange={e => setForm({ ...form, trainNumber: e.target.value })}
                                    required
                                    style={styles.input}
                                    placeholder="e.g., 705"
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Train Name *</label>
                                <input
                                    value={form.trainName}
                                    onChange={e => setForm({ ...form, trainName: e.target.value })}
                                    required
                                    style={styles.input}
                                    placeholder="e.g., Subarna Express"
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Type</label>
                                <select value={form.trainType} onChange={e => setForm({ ...form, trainType: e.target.value })} style={styles.input}>
                                    <option value="express">Express</option>
                                    <option value="mail">Mail</option>
                                    <option value="local">Local</option>
                                    <option value="intercity">Intercity</option>
                                    <option value="commuter">Commuter</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label>Running Days * ({form.runDays.length} selected)</label>
                            <div style={styles.daysRow}>
                                {allDays.map(day => (
                                    <button
                                        type="button"
                                        key={day}
                                        onClick={() => toggleDay(day)}
                                        style={form.runDays.includes(day) ? styles.dayActive : styles.dayBtn}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Route / Stations */}
                        <div style={styles.routeSection}>
                            <h4>Route Stations ({form.route.length}) *</h4>
                            {form.route.length > 0 ? (
                                form.route.map((station, i) => (
                                    <div key={i} style={styles.stationRow}>
                                        <span style={styles.stopNum}>{station.stopOrder}.</span>
                                        <span style={{ flex: 1 }}>{station.stationName} ({station.stationCode})</span>
                                        <span style={styles.timeText}>
                                            {station.arrivalTime ? `Arr: ${station.arrivalTime}` : ''}
                                            {station.arrivalTime && station.departureTime ? ' | ' : ''}
                                            {station.departureTime ? `Dep: ${station.departureTime}` : ''}
                                        </span>
                                        <button type="button" onClick={() => removeStation(i)} style={styles.removeBtn}>✕</button>
                                    </div>
                                ))
                            ) : (
                                <p style={styles.emptyRoute}>No stations added yet. Add at least one below.</p>
                            )}

                            <div style={styles.addStationForm}>
                                <input
                                    placeholder="Station Code *"
                                    value={stationForm.stationCode}
                                    onChange={e => setStationForm({ ...stationForm, stationCode: e.target.value })}
                                    style={styles.smallInput}
                                />
                                <input
                                    placeholder="Station Name *"
                                    value={stationForm.stationName}
                                    onChange={e => setStationForm({ ...stationForm, stationName: e.target.value })}
                                    style={styles.smallInput}
                                />
                                <input
                                    type="time"
                                    placeholder="Arrival"
                                    value={stationForm.arrivalTime}
                                    onChange={e => setStationForm({ ...stationForm, arrivalTime: e.target.value })}
                                    style={styles.timeInput}
                                />
                                <input
                                    type="time"
                                    placeholder="Departure"
                                    value={stationForm.departureTime}
                                    onChange={e => setStationForm({ ...stationForm, departureTime: e.target.value })}
                                    style={styles.timeInput}
                                />
                                <button type="button" onClick={addStation} style={styles.addStationBtn}>+ Add Stop</button>
                            </div>
                        </div>

                        <button type="submit" style={styles.submitBtn} disabled={submitLoading}>
                            {submitLoading ? 'Saving...' : (editingId ? 'Update Train' : 'Create Train')}
                        </button>
                    </form>
                )}

                {/* Train List */}
                {loading ? (
                    <p style={styles.loading}>Loading trains...</p>
                ) : trains.length === 0 ? (
                    <div style={styles.emptyMsg}>No trains added yet. Add your first train to get started!</div>
                ) : (
                    <div style={styles.trainList}>
                        {trains.map(train => (
                            <div key={train._id} style={styles.trainCard}>
                                <div style={styles.trainHeader}>
                                    <div>
                                        <h3 style={styles.trainName}>
                                            🚂 {train.trainName}
                                            <span style={styles.trainNum}>#{train.trainNumber}</span>
                                        </h3>
                                        <span style={styles.trainType}>{train.trainType}</span>
                                        <span style={styles.trainDays}>{train.runDays?.join(', ') || 'No days'}</span>
                                    </div>
                                    <div style={styles.trainActions}>
                                        <button onClick={() => handleEdit(train)} style={styles.editBtn}>Edit</button>
                                        <button onClick={() => handleDelete(train._id)} style={styles.deleteBtn}>Delete</button>
                                    </div>
                                </div>
                                <div style={styles.routePreview}>
                                    <strong>Route:</strong> {' '}
                                    {train.route && train.route.length > 0 ? (
                                        train.route.sort((a, b) => a.stopOrder - b.stopOrder).map((s, i) => (
                                            <span key={i} style={styles.routeStop}>
                                                {s.stationName}{i < train.route.length - 1 ? ' → ' : ''}
                                            </span>
                                        ))
                                    ) : (
                                        <span style={{ color: '#999' }}>No stations</span>
                                    )}
                                </div>
                            </div>
                        ))}
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
        padding: '10px 20px',
        backgroundColor: '#e87e1e',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        fontWeight: 600
    },
    msg: {
        padding: 12,
        backgroundColor: 'rgba(76,175,80,0.15)',
        border: '1px solid rgba(76,175,80,0.4)',
        borderRadius: 8,
        marginBottom: 16,
        color: '#a9e9a3'
    },
    form: {
        background: '#0a0f14',
        padding: 24,
        borderRadius: 12,
        marginBottom: 24,
        border: '1px solid #2A2A2A',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    },
    formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 },
    formGroup: { marginBottom: 16 },
    input: { width: '100%', padding: '10px 12px', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', backgroundColor: '#030409', color: '#ddd' },
    daysRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    dayBtn: { padding: '6px 14px', border: '1px solid #2A2A2A', borderRadius: 6, backgroundColor: '#0a0f14', color: '#aaa', cursor: 'pointer', fontSize: 13 },
    dayActive: { padding: '6px 14px', border: '1px solid #e87e1e', borderRadius: 6, backgroundColor: '#e87e1e', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
    routeSection: { marginTop: 16, padding: 16, backgroundColor: '#0a0f14', borderRadius: 8, border: '1px solid #2A2A2A' },
    stationRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #2A2A2A' },
    stopNum: { fontWeight: 700, color: '#e87e1e' },
    timeText: { flex: 1, fontSize: 13, color: '#888' },
    removeBtn: { background: 'none', border: 'none', color: '#e87e1e', cursor: 'pointer', fontSize: 16 },
    emptyRoute: { fontSize: 13, color: '#555', textAlign: 'center', padding: 12 },
    addStationForm: { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' },
    smallInput: { padding: '8px 10px', border: '1px solid #2A2A2A', borderRadius: 6, fontSize: 13, width: 130, backgroundColor: '#030409', color: '#ddd' },
    timeInput: { padding: '8px 10px', border: '1px solid #2A2A2A', borderRadius: 6, fontSize: 13, width: 100, backgroundColor: '#030409', color: '#ddd' },
    addStationBtn: { padding: '8px 14px', backgroundColor: 'rgba(52, 152, 219, 0.85)', color: '#fff', border: '1px solid rgba(52, 152, 219, 0.3)', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' },
    submitBtn: {
        marginTop: 16,
        padding: '12px 24px',
        backgroundColor: 'rgba(232, 126, 30, 0.85)',
        color: '#fff',
        border: '1px solid rgba(255, 180, 100, 0.25)',
        borderRadius: 8,
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: 15,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 16px rgba(232, 126, 30, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
    },
    trainList: {},
    trainCard: {
        background: '#0a0f14',
        borderRadius: 12,
        padding: 20,
        marginBottom: 14,
        border: '1px solid #2A2A2A',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    },
    trainHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
    trainName: { fontSize: 18, fontWeight: 600, margin: 0, color: '#ffffff' },
    trainNum: { fontWeight: 400, color: '#888', fontSize: 14, marginLeft: 8 },
    trainType: {
        display: 'inline-block',
        padding: '2px 10px',
        backgroundColor: 'rgba(232, 126, 30, 0.2)',
        borderRadius: 10,
        fontSize: 12,
        marginRight: 8,
        textTransform: 'capitalize',
        color: '#e87e1e',
        border: '1px solid rgba(232, 126, 30, 0.3)'
    },
    trainDays: { fontSize: 12, color: '#888' },
    trainActions: { display: 'flex', gap: 8 },
    editBtn: { padding: '6px 14px', border: '1px solid #3498db', borderRadius: 6, backgroundColor: 'transparent', color: '#3498db', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
    deleteBtn: { padding: '6px 14px', border: '1px solid #e87e1e', borderRadius: 6, backgroundColor: 'transparent', color: '#e87e1e', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
    routePreview: { marginTop: 10, fontSize: 13, color: '#aaa' },
    routeStop: {},
    loading: { textAlign: 'center', padding: 40, fontSize: 16, color: '#666' },
    emptyMsg: { textAlign: 'center', padding: 40, fontSize: 16, color: '#888', backgroundColor: '#0a0f14', borderRadius: 12, border: '1px solid #2A2A2A', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }
};

import React, { useState, useEffect } from 'react';
import { trainAPI } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminTrainManagement() {
    const [trains, setTrains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
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

    useEffect(() => {
        fetchTrains();
    }, []);

    const fetchTrains = async () => {
        try {
            const token = localStorage.getItem('railbiteToken');
            const res = await trainAPI.getAll(token);
            setTrains(res.data.data || []);
        } catch (err) {
            console.error('Error fetching trains:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('railbiteToken');
            if (editingId) {
                await trainAPI.update(editingId, form, token);
                setMsg('Train updated successfully!');
            } else {
                await trainAPI.create(form, token);
                setMsg('Train added successfully!');
            }
            resetForm();
            fetchTrains();
        } catch (err) {
            setMsg(err.response?.data?.message || 'Error saving train');
        }
    };

    const handleEdit = (train) => {
        setEditingId(train._id);
        setForm({
            trainNumber: train.trainNumber,
            trainName: train.trainName,
            trainType: train.trainType,
            runDays: train.runDays,
            route: train.route || []
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this train?')) return;
        try {
            const token = localStorage.getItem('railbiteToken');
            await trainAPI.delete(id, token);
            setMsg('Train deleted');
            fetchTrains();
        } catch (err) {
            setMsg('Error deleting train');
        }
    };

    const addStation = () => {
        setForm({
            ...form,
            route: [...form.route, { ...stationForm, stopOrder: form.route.length + 1 }]
        });
        setStationForm({ stationCode: '', stationName: '', arrivalTime: '', departureTime: '', stopOrder: 1, haltMinutes: 0 });
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

                {msg && <div style={styles.msg}>{msg}</div>}

                {showForm && (
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <h3>{editingId ? 'Edit Train' : 'Add New Train'}</h3>
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
                            <label>Running Days</label>
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
                            <h4>Route Stations ({form.route.length})</h4>
                            {form.route.map((station, i) => (
                                <div key={i} style={styles.stationRow}>
                                    <span style={styles.stopNum}>{station.stopOrder}.</span>
                                    <span>{station.stationName} ({station.stationCode})</span>
                                    <span style={styles.timeText}>
                                        {station.departureTime ? `Dep: ${station.departureTime}` : ''}
                                        {station.arrivalTime ? ` Arr: ${station.arrivalTime}` : ''}
                                    </span>
                                    <button type="button" onClick={() => removeStation(i)} style={styles.removeBtn}>✕</button>
                                </div>
                            ))}

                            <div style={styles.addStationForm}>
                                <input
                                    placeholder="Station Code"
                                    value={stationForm.stationCode}
                                    onChange={e => setStationForm({ ...stationForm, stationCode: e.target.value })}
                                    style={styles.smallInput}
                                />
                                <input
                                    placeholder="Station Name"
                                    value={stationForm.stationName}
                                    onChange={e => setStationForm({ ...stationForm, stationName: e.target.value })}
                                    style={styles.smallInput}
                                />
                                <input
                                    placeholder="Arrival"
                                    value={stationForm.arrivalTime}
                                    onChange={e => setStationForm({ ...stationForm, arrivalTime: e.target.value })}
                                    style={styles.timeInput}
                                />
                                <input
                                    placeholder="Departure"
                                    value={stationForm.departureTime}
                                    onChange={e => setStationForm({ ...stationForm, departureTime: e.target.value })}
                                    style={styles.timeInput}
                                />
                                <button type="button" onClick={addStation} style={styles.addStationBtn}>+ Add Stop</button>
                            </div>
                        </div>

                        <button type="submit" style={styles.submitBtn}>
                            {editingId ? 'Update Train' : 'Create Train'}
                        </button>
                    </form>
                )}

                {/* Train List */}
                {loading ? (
                    <p>Loading trains...</p>
                ) : (
                    <div style={styles.trainList}>
                        {trains.length === 0 ? (
                            <p style={styles.emptyText}>No trains added yet. Add your first train!</p>
                        ) : (
                            trains.map(train => (
                                <div key={train._id} style={styles.trainCard}>
                                    <div style={styles.trainHeader}>
                                        <div>
                                            <h3 style={styles.trainName}>
                                                🚂 {train.trainName}
                                                <span style={styles.trainNum}>#{train.trainNumber}</span>
                                            </h3>
                                            <span style={styles.trainType}>{train.trainType}</span>
                                            <span style={styles.trainDays}>{train.runDays?.join(', ')}</span>
                                        </div>
                                        <div style={styles.trainActions}>
                                            <button onClick={() => handleEdit(train)} style={styles.editBtn}>Edit</button>
                                            <button onClick={() => handleDelete(train._id)} style={styles.deleteBtn}>Delete</button>
                                        </div>
                                    </div>
                                    <div style={styles.routePreview}>
                                        {train.route?.sort((a, b) => a.stopOrder - b.stopOrder).map((s, i) => (
                                            <span key={i} style={styles.routeStop}>
                                                {s.stationName}{i < train.route.length - 1 ? ' → ' : ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
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
        padding: '10px 20px',
        backgroundColor: '#e74c3c',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        fontWeight: 600
    },
    msg: {
        padding: 12,
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        borderRadius: 8,
        marginBottom: 16,
        color: '#155724'
    },
    form: {
        background: '#fff',
        padding: 24,
        borderRadius: 12,
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    },
    formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 },
    formGroup: { marginBottom: 16 },
    input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
    daysRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    dayBtn: { padding: '6px 14px', border: '1px solid #ddd', borderRadius: 6, backgroundColor: '#f8f9fa', cursor: 'pointer' },
    dayActive: { padding: '6px 14px', border: '1px solid #e74c3c', borderRadius: 6, backgroundColor: '#e74c3c', color: '#fff', cursor: 'pointer' },
    routeSection: { marginTop: 16, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8 },
    stationRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #eee' },
    stopNum: { fontWeight: 700, color: '#e74c3c' },
    timeText: { flex: 1, fontSize: 13, color: '#666' },
    removeBtn: { background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 16 },
    addStationForm: { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' },
    smallInput: { padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, width: 130 },
    timeInput: { padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, width: 90 },
    addStationBtn: { padding: '8px 14px', backgroundColor: 'rgba(52, 152, 219, 0.85)', color: '#fff', border: '1px solid rgba(52, 152, 219, 0.3)', borderRadius: 6, cursor: 'pointer', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' },
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
        background: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    },
    trainHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    trainName: { fontSize: 18, fontWeight: 600, margin: 0, color: '#1a1a2e' },
    trainNum: { fontWeight: 400, color: '#888', fontSize: 14, marginLeft: 8 },
    trainType: {
        display: 'inline-block',
        padding: '2px 10px',
        backgroundColor: '#eee',
        borderRadius: 10,
        fontSize: 12,
        marginRight: 8,
        textTransform: 'capitalize'
    },
    trainDays: { fontSize: 12, color: '#888' },
    trainActions: { display: 'flex', gap: 8 },
    editBtn: { padding: '6px 14px', border: '1px solid #3498db', borderRadius: 6, backgroundColor: '#fff', color: '#3498db', cursor: 'pointer' },
    deleteBtn: { padding: '6px 14px', border: '1px solid #e74c3c', borderRadius: 6, backgroundColor: '#fff', color: '#e74c3c', cursor: 'pointer' },
    routePreview: { marginTop: 10, fontSize: 13, color: '#555' },
    routeStop: {},
    emptyText: { textAlign: 'center', color: '#888', padding: 40 }
};

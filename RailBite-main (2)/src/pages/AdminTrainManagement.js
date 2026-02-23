import React, { useState, useEffect } from 'react';
import { trainAPI } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminTrainManagement() {
  const [trains, setTrains] = useState([]);
  const [stats, setStats] = useState(null);
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
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('railbiteToken');
      const [trainsRes, statsRes] = await Promise.all([
        trainAPI.getAll(token),
        trainAPI.getStats(token)
      ]);
      setTrains(trainsRes.data.data || []);
      setStats(statsRes.data.data);
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
      fetchData();
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleActive = async (id) => {
    try {
      const token = localStorage.getItem('railbiteToken');
      await trainAPI.toggleActive(id, token);
      fetchData();
    } catch (err) {
      setMsg('Error toggling train status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this train permanently?')) return;
    try {
      const token = localStorage.getItem('railbiteToken');
      await trainAPI.delete(id, token);
      setMsg('Train deleted');
      fetchData();
    } catch (err) {
      setMsg('Error deleting train');
    }
  };

  const addStation = () => {
    if (!stationForm.stationCode || !stationForm.stationName) return;
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
            {showForm ? '✕ Cancel' : '+ Add New Train'}
          </button>
        </div>

        {msg && <div style={styles.msg}>{msg}</div>}

        {/* Train Stats */}
        {stats && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <h3>Total Trains</h3>
              <p style={styles.statValue}>{stats.totalTrains}</p>
            </div>
            <div style={styles.statCard}>
              <h3>Active Trains</h3>
              <p style={{ ...styles.statValue, color: '#2ecc71' }}>{stats.activeTrains}</p>
            </div>
            <div style={styles.statCard}>
              <h3>Types</h3>
              <div style={styles.typeStats}>
                {Object.entries(stats.byType).map(([type, count]) => (
                  <span key={type} style={styles.typeBadge}>{type}: {count}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <h3 style={{ marginBottom: 20 }}>{editingId ? '📝 Edit Train' : '🆕 Add New Train'}</h3>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Train Number *</label>
                <input
                  value={form.trainNumber}
                  onChange={e => setForm({ ...form, trainNumber: e.target.value })}
                  required style={styles.input} placeholder="e.g. 705"
                />
              </div>
              <div style={styles.formGroup}>
                <label>Train Name *</label>
                <input
                  value={form.trainName}
                  onChange={e => setForm({ ...form, trainName: e.target.value })}
                  required style={styles.input} placeholder="e.g. Subarna Express"
                />
              </div>
              <div style={styles.formGroup}>
                <label>Type</label>
                <select value={form.trainType} onChange={e => setForm({ ...form, trainType: e.target.value })} style={styles.input}>
                  <option value="express">Express</option>
                  <option value="intercity">Intercity</option>
                  <option value="mail">Mail</option>
                  <option value="local">Local</option>
                  <option value="commuter">Commuter</option>
                </select>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label>Running Days</label>
              <div style={styles.daysRow}>
                {allDays.map(day => (
                  <button
                    type="button" key={day}
                    onClick={() => toggleDay(day)}
                    style={form.runDays.includes(day) ? styles.dayActive : styles.dayBtn}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Route Section */}
            <div style={styles.routeSection}>
              <h4 style={{ marginBottom: 15 }}>📍 Route Stations ({form.route.length})</h4>
              <div style={styles.stationList}>
                {form.route.map((station, i) => (
                  <div key={i} style={styles.stationRow}>
                    <span style={styles.stopNum}>{station.stopOrder}.</span>
                    <div style={styles.stationInfo}>
                      <strong>{station.stationName}</strong> ({station.stationCode})
                      <div style={styles.timeInfo}>
                        {station.arrivalTime && <span>Arr: {station.arrivalTime}</span>}
                        {station.departureTime && <span style={{ marginLeft: 10 }}>Dep: {station.departureTime}</span>}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeStation(i)} style={styles.removeBtn}>✕</button>
                  </div>
                ))}
              </div>

              <div style={styles.addStationForm}>
                <input placeholder="Code" value={stationForm.stationCode} onChange={e => setStationForm({ ...stationForm, stationCode: e.target.value.toUpperCase() })} style={styles.smallInput} />
                <input placeholder="Station Name" value={stationForm.stationName} onChange={e => setStationForm({ ...stationForm, stationName: e.target.value })} style={styles.medInput} />
                <input type="time" value={stationForm.arrivalTime} onChange={e => setStationForm({ ...stationForm, arrivalTime: e.target.value })} style={styles.timeInput} title="Arrival" />
                <input type="time" value={stationForm.departureTime} onChange={e => setStationForm({ ...stationForm, departureTime: e.target.value })} style={styles.timeInput} title="Departure" />
                <button type="button" onClick={addStation} style={styles.addStationBtn}>Add Stop</button>
              </div>
            </div>

            <button type="submit" style={styles.submitBtn}>
              {editingId ? 'Update Train Information' : 'Create Train Listing'}
            </button>
          </form>
        )}

        {/* Train Table */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Train</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Route</th>
                <th style={styles.th}>Schedule</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading trains...</td></tr>
              ) : trains.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>No trains configured</td></tr>
              ) : trains.map(train => (
                <tr key={train._id}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600 }}>{train.trainName}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>#{train.trainNumber}</div>
                  </td>
                  <td style={styles.td}><span style={styles.typeTag}>{train.trainType}</span></td>
                  <td style={styles.td}>
                    <div style={styles.routePreview}>
                      {train.route?.[0]?.stationCode} ➔ {train.route?.[train.route.length-1]?.stationCode}
                      <div style={{ fontSize: 11, color: '#999' }}>{train.route?.length} stops</div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontSize: 12 }}>{train.runDays?.length === 7 ? 'Daily' : train.runDays?.join(', ')}</div>
                  </td>
                  <td style={styles.td}>
                    <button 
                      onClick={() => toggleActive(train._id)}
                      style={{ 
                        ...styles.statusBtn, 
                        backgroundColor: train.isActive ? '#2ecc7120' : '#e74c3c20',
                        color: train.isActive ? '#2ecc71' : '#e74c3c',
                        borderColor: train.isActive ? '#2ecc71' : '#e74c3c'
                      }}
                    >
                      {train.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => handleEdit(train)} style={styles.iconBtn} title="Edit">✏️</button>
                      <button onClick={() => handleDelete(train._id)} style={styles.iconBtn} title="Delete">🗑️</button>
                    </div>
                  </td>
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
  addBtn: { padding: '10px 20px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  msg: { padding: 12, backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 8, marginBottom: 16, color: '#155724' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', textAlign: 'center' },
  statValue: { fontSize: 28, fontWeight: 700, margin: '8px 0 0', color: '#1a1a2e' },
  typeStats: { display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginTop: 10 },
  typeBadge: { fontSize: 11, backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: 4, color: '#666' },
  form: { background: '#fff', padding: 24, borderRadius: 12, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 },
  formGroup: { marginBottom: 16 },
  input: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  daysRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  dayBtn: { padding: '6px 12px', border: '1px solid #ddd', borderRadius: 6, backgroundColor: '#f8f9fa', cursor: 'pointer', fontSize: 12 },
  dayActive: { padding: '6px 12px', border: '1px solid #e74c3c', borderRadius: 6, backgroundColor: '#e74c3c', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  routeSection: { marginTop: 20, padding: 20, backgroundColor: '#f9f9fb', borderRadius: 10, border: '1px solid #eee' },
  stationList: { marginBottom: 15 },
  stationRow: { display: 'flex', alignItems: 'center', gap: 15, padding: '10px 0', borderBottom: '1px solid #eee' },
  stopNum: { fontWeight: 700, color: '#e74c3c', width: 25 },
  stationInfo: { flex: 1, fontSize: 14 },
  timeInfo: { fontSize: 12, color: '#777', marginTop: 2 },
  removeBtn: { background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 16 },
  addStationForm: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  smallInput: { padding: '10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, width: 80 },
  medInput: { padding: '10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, flex: 1, minWidth: 150 },
  timeInput: { padding: '10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, width: 110 },
  addStationBtn: { padding: '10px 15px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
  submitBtn: { width: '100%', marginTop: 20, padding: '14px', backgroundColor: '#2c3e50', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 16 },
  tableWrapper: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', backgroundColor: '#f8f9fa', color: '#666', fontWeight: 600, fontSize: 13, borderBottom: '1px solid #eee' },
  td: { padding: '14px 16px', borderBottom: '1px solid #f0f0f0', fontSize: 14 },
  typeTag: { padding: '2px 8px', backgroundColor: '#eee', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' },
  routePreview: { fontSize: 13, color: '#333' },
  statusBtn: { padding: '4px 10px', borderRadius: 6, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 },
};

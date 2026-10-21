'use client';

import { useStore } from '@/lib/store';
import { FileText, Plus, X, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import { BLOOD_TYPES, COMPONENT_TYPES, BloodType, ComponentType } from '@/lib/types';

export default function RequestsPage() {
  const requests = useStore((s) => s.requests);
  const bloodBanks = useStore((s) => s.bloodBanks);
  const addRequest = useStore((s) => s.addRequest);
  const cancelRequest = useStore((s) => s.cancelRequest);
  const getNow = useStore((s) => s.getNow);
  const now = getNow();

  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [form, setForm] = useState({
    destinationBankId: '', bloodType: 'O+' as BloodType, componentType: 'Packed RBC' as ComponentType,
    quantity: '1', priority: 'routine' as 'routine' | 'urgent' | 'emergency', neededByHours: '24', notes: '',
  });

  const filtered = useMemo(() => {
    let items = [...requests];
    if (filterStatus) items = items.filter((r) => r.status === filterStatus);
    if (filterPriority) items = items.filter((r) => r.priority === filterPriority);
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [requests, filterStatus, filterPriority]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRequest({
      destinationBankId: form.destinationBankId, bloodType: form.bloodType, componentType: form.componentType,
      quantity: parseInt(form.quantity) || 1, priority: form.priority,
      neededBy: new Date(now + parseInt(form.neededByHours || '24') * 3600000).toISOString(),
      notes: form.notes,
    });
    setShowForm(false);
    setForm({ destinationBankId: '', bloodType: 'O+', componentType: 'Packed RBC', quantity: '1', priority: 'routine', neededByHours: '24', notes: '' });
  };

  const getBankName = (id: string) => bloodBanks.find((b) => b.id === id)?.name || id;

  const priorityColors = { emergency: 'badge-critical', urgent: 'badge-warning', routine: 'badge-info' };

  return (
    <>
      <div className="page-header"><h1>Blood Requests</h1><p>Manage blood component requests from participating blood banks</p></div>
      <div className="page-content">
        <div className="toolbar">
          <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 150 }}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="matched">Matched</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="form-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ width: 150 }}>
            <option value="">All Priorities</option>
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="routine">Routine</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> New Request</button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h2>Create Blood Request</h2></div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Destination</label>
                    <select className="form-select" value={form.destinationBankId} onChange={(e) => setForm({ ...form, destinationBankId: e.target.value })} required>
                      <option value="">Select blood bank...</option>
                      {bloodBanks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood Type</label>
                    <select className="form-select" value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value as BloodType })}>
                      {BLOOD_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Component</label>
                    <select className="form-select" value={form.componentType} onChange={(e) => setForm({ ...form, componentType: e.target.value as ComponentType })}>
                      {COMPONENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input className="form-input" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as 'routine' | 'urgent' | 'emergency' })}>
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Needed Within (hours)</label>
                    <input className="form-input" type="number" min="1" value={form.neededByHours} onChange={(e) => setForm({ ...form, neededByHours: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="btn btn-primary">Submit Request</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header"><h2>Requests ({filtered.length})</h2></div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Destination</th><th>Type</th><th>Component</th><th>Qty</th><th>Priority</th><th>Status</th><th>Needed By</th><th>Notes</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.id}</td>
                    <td style={{ fontSize: 12 }}>{getBankName(r.destinationBankId)}</td>
                    <td><span className="badge badge-info">{r.bloodType}</span></td>
                    <td style={{ fontSize: 12 }}>{r.componentType}</td>
                    <td style={{ fontWeight: 600 }}>{r.quantity}</td>
                    <td><span className={`badge ${priorityColors[r.priority]}`}>{r.priority}</span></td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                    <td style={{ fontSize: 11 }}>{new Date(r.neededBy).toLocaleString()}</td>
                    <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.notes}</td>
                    <td>
                      {(r.status === 'pending' || r.status === 'processing') && (
                        <button className="btn btn-danger btn-sm" onClick={() => cancelRequest(r.id)}><X size={12} /> Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={10}><div className="empty-state"><p>No requests found</p></div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

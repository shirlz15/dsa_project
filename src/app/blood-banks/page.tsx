'use client';

import { useStore } from '@/lib/store';
import { MapPin, Plus, Edit2, Phone, Building } from 'lucide-react';
import { useState } from 'react';
import { BloodBank } from '@/lib/types';

export default function BloodBanksPage() {
  const bloodBanks = useStore((s) => s.bloodBanks);
  const inventory = useStore((s) => s.inventory);
  const addBloodBank = useStore((s) => s.addBloodBank);
  const updateBloodBank = useStore((s) => s.updateBloodBank);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', city: '', address: '', lat: '', lng: '', capacity: '', contact: '', emergencyActive: false });

  const filtered = bloodBanks.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name, city: form.city, address: form.address,
      lat: parseFloat(form.lat) || 0, lng: parseFloat(form.lng) || 0,
      capacity: parseInt(form.capacity) || 0, contact: form.contact,
      emergencyActive: form.emergencyActive,
    };
    if (editId) {
      updateBloodBank(editId, data);
      setEditId(null);
    } else {
      addBloodBank(data);
    }
    setForm({ name: '', city: '', address: '', lat: '', lng: '', capacity: '', contact: '', emergencyActive: false });
    setShowForm(false);
  };

  const startEdit = (bank: BloodBank) => {
    setForm({
      name: bank.name, city: bank.city, address: bank.address,
      lat: String(bank.lat), lng: String(bank.lng),
      capacity: String(bank.capacity), contact: bank.contact,
      emergencyActive: bank.emergencyActive,
    });
    setEditId(bank.id);
    setShowForm(true);
  };

  return (
    <>
      <div className="page-header">
        <h1>Blood Bank Management</h1>
        <p>Manage participating simulated blood banks</p>
      </div>
      <div className="page-content">
        <div className="toolbar">
          <input className="form-input" placeholder="Search blood banks..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 280 }} />
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', city: '', address: '', lat: '', lng: '', capacity: '', contact: '', emergencyActive: false }); }}>
            <Plus size={16} /> Add Blood Bank
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h2>{editId ? 'Edit' : 'Add'} Blood Bank</h2></div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact</label>
                    <input className="form-input" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Latitude</label>
                    <input className="form-input" type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude</label>
                    <input className="form-input" type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Capacity</label>
                    <input className="form-input" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 28 }}>
                    <input type="checkbox" checked={form.emergencyActive} onChange={(e) => setForm({ ...form, emergencyActive: e.target.checked })} />
                    <label className="form-label" style={{ margin: 0 }}>Emergency Active</label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Add'} Blood Bank</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>City</th>
                  <th>Contact</th>
                  <th>Capacity</th>
                  <th>Stock</th>
                  <th>Emergency</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bank) => {
                  const stock = inventory.filter((u) => u.bloodBankId === bank.id && u.status === 'available').reduce((s, u) => s + u.quantity, 0);
                  return (
                    <tr key={bank.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Building size={16} style={{ color: 'var(--accent-primary)' }} />
                          {bank.name}
                        </div>
                      </td>
                      <td>{bank.city}</td>
                      <td style={{ fontSize: 12 }}>{bank.contact}</td>
                      <td>{bank.capacity}</td>
                      <td><span className="badge badge-info">{stock} units</span></td>
                      <td><span className={`badge ${bank.emergencyActive ? 'badge-normal' : 'badge-warning'}`}>{bank.emergencyActive ? 'Active' : 'Inactive'}</span></td>
                      <td><button className="btn btn-secondary btn-sm" onClick={() => startEdit(bank)}><Edit2 size={14} /> Edit</button></td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="empty-state"><p>No blood banks found</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

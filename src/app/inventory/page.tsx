'use client';

import { useStore } from '@/lib/store';
import { Package, Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { BLOOD_TYPES, COMPONENT_TYPES, InventoryUnit, BloodType, ComponentType } from '@/lib/types';

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours > 48) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${mins}m`;
}

export default function InventoryPage() {
  const inventory = useStore((s) => s.inventory);
  const bloodBanks = useStore((s) => s.bloodBanks);
  const addInventoryUnit = useStore((s) => s.addInventoryUnit);
  const updateInventoryUnit = useStore((s) => s.updateInventoryUnit);
  const deleteInventoryUnit = useStore((s) => s.deleteInventoryUnit);
  const getNow = useStore((s) => s.getNow);
  const now = getNow();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [sortBy, setSortBy] = useState<'expiry' | 'quantity' | 'id'>('expiry');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    bloodBankId: '', componentType: 'Packed RBC' as ComponentType, bloodType: 'O+' as BloodType,
    collectionTimestamp: '', expiryTimestamp: '', quantity: '1', status: 'available' as const,
    storageTemp: '2-6°C', transportEligible: true,
  });

  const filtered = useMemo(() => {
    let items = [...inventory];
    if (search) items = items.filter((u) => u.id.toLowerCase().includes(search.toLowerCase()) || u.bloodType.includes(search));
    if (filterType) items = items.filter((u) => u.bloodType === filterType);
    if (filterStatus) items = items.filter((u) => u.status === filterStatus);
    if (filterBank) items = items.filter((u) => u.bloodBankId === filterBank);

    items.sort((a, b) => {
      if (sortBy === 'expiry') return new Date(a.expiryTimestamp).getTime() - new Date(b.expiryTimestamp).getTime();
      if (sortBy === 'quantity') return b.quantity - a.quantity;
      return a.id.localeCompare(b.id);
    });
    return items;
  }, [inventory, search, filterType, filterStatus, filterBank, sortBy]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addInventoryUnit({
      bloodBankId: form.bloodBankId, componentType: form.componentType, bloodType: form.bloodType,
      collectionTimestamp: form.collectionTimestamp || new Date().toISOString(),
      expiryTimestamp: form.expiryTimestamp || new Date(Date.now() + 168 * 3600000).toISOString(),
      quantity: parseInt(form.quantity) || 1, status: form.status,
      storageTemp: form.storageTemp, transportEligible: form.transportEligible,
    });
    setShowForm(false);
  };

  const getBankName = (id: string) => bloodBanks.find((b) => b.id === id)?.name || id;

  return (
    <>
      <div className="page-header">
        <h1>Blood Inventory</h1>
        <p>Manage all blood inventory units across participating blood banks</p>
      </div>
      <div className="page-content">
        <div className="toolbar">
          <input className="form-input" placeholder="Search by ID or blood type..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
          <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: 120 }}>
            <option value="">All Types</option>
            {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 140 }}>
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="quarantined">Quarantined</option>
            <option value="expired">Expired</option>
            <option value="in_transit">In Transit</option>
          </select>
          <select className="form-select" value={filterBank} onChange={(e) => setFilterBank(e.target.value)} style={{ width: 180 }}>
            <option value="">All Banks</option>
            {bloodBanks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'expiry' | 'quantity' | 'id')} style={{ width: 140 }}>
            <option value="expiry">Sort: Expiry</option>
            <option value="quantity">Sort: Quantity</option>
            <option value="id">Sort: ID</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> Add Unit</button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h2>Add Inventory Unit</h2></div>
            <div className="card-body">
              <form onSubmit={handleAdd}>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Blood Bank</label>
                    <select className="form-select" value={form.bloodBankId} onChange={(e) => setForm({ ...form, bloodBankId: e.target.value })} required>
                      <option value="">Select...</option>
                      {bloodBanks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood Type</label>
                    <select className="form-select" value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value as BloodType })}>
                      {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Component</label>
                    <select className="form-select" value={form.componentType} onChange={(e) => setForm({ ...form, componentType: e.target.value as ComponentType })}>
                      {COMPONENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input className="form-input" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expiry (hours from now)</label>
                    <input className="form-input" type="number" placeholder="e.g. 48" onChange={(e) => setForm({ ...form, expiryTimestamp: new Date(Date.now() + parseInt(e.target.value || '168') * 3600000).toISOString() })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Storage Temp</label>
                    <input className="form-input" value={form.storageTemp} onChange={(e) => setForm({ ...form, storageTemp: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button type="submit" className="btn btn-primary">Add Unit</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2>Inventory ({filtered.length} units)</h2>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Blood Bank</th>
                  <th>Type</th>
                  <th>Component</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Remaining</th>
                  <th>Temp</th>
                  <th>Transport</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const remaining = new Date(u.expiryTimestamp).getTime() - now;
                  const isExpired = remaining <= 0;
                  return (
                    <tr key={u.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{u.id}</td>
                      <td style={{ fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getBankName(u.bloodBankId)}</td>
                      <td><span className="badge badge-info">{u.bloodType}</span></td>
                      <td style={{ fontSize: 12 }}>{u.componentType}</td>
                      <td style={{ fontWeight: 600 }}>{u.quantity}</td>
                      <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                      <td>
                        <span className={`badge ${isExpired ? 'badge-critical' : remaining < 12 * 3600000 ? 'badge-critical' : remaining < 48 * 3600000 ? 'badge-warning' : 'badge-normal'}`}>
                          {formatTimeRemaining(remaining)}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>{u.storageTemp}</td>
                      <td><span className={`badge ${u.transportEligible ? 'badge-normal' : 'badge-warning'}`}>{u.transportEligible ? 'Yes' : 'No'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => deleteInventoryUnit(u.id)}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={10}><div className="empty-state"><p>No inventory units found</p></div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

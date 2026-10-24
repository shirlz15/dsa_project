'use client';

import { useStore } from '@/lib/store';
import {
  MapPin, Plus, Edit2, Phone, Building, ShieldAlert, CheckCircle,
  XCircle, RotateCw, Hash, Package, Search, ChevronRight, X, AlertTriangle, Info
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { BloodBank, InventoryUnit } from '@/lib/types';
import { HashTable, CircularLinkedList } from '@/lib/dsa-engine';

export default function BloodBanksPage() {
  const bloodBanks = useStore((s) => s.bloodBanks);
  const inventory = useStore((s) => s.inventory);
  const addBloodBank = useStore((s) => s.addBloodBank);
  const updateBloodBank = useStore((s) => s.updateBloodBank);
  const deactivateBloodBank = useStore((s) => s.deactivateBloodBank);
  const activateBloodBank = useStore((s) => s.activateBloodBank);
  const getNow = useStore((s) => s.getNow);
  const now = getNow();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [inspectBankId, setInspectBankId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '', city: '', address: '', lat: '', lng: '',
    capacity: '', contact: '', emergencyActive: false, status: 'active' as 'active' | 'deactivated'
  });

  // ─── DSA 1: Hash Table for O(1) Bank ID Lookup ─────────────────────────────
  const bankHashTable = useMemo(() => {
    const table = new HashTable<string, BloodBank>(19);
    bloodBanks.forEach((b) => table.insert(b.id, b));
    return table;
  }, [bloodBanks]);

  // ─── DSA 2: Circular Linked List for Round-Robin Audit Inspection Rotation ─
  const bankCircularList = useMemo(() => {
    const cll = new CircularLinkedList<BloodBank>();
    bloodBanks.forEach((b) => cll.insert(b));
    return cll;
  }, [bloodBanks]);

  const cycleBankList = useMemo(() => bankCircularList.traverseOneCycle(), [bankCircularList]);
  const [auditCycleIndex, setAuditCycleIndex] = useState(0);

  const currentAuditedBank = cycleBankList[auditCycleIndex % (cycleBankList.length || 1)] || bloodBanks[0] || null;
  const nextAuditedBank = cycleBankList[(auditCycleIndex + 1) % (cycleBankList.length || 1)] || null;

  const handleNextInAuditCycle = () => {
    if (cycleBankList.length === 0) return;
    const nextIdx = (auditCycleIndex + 1) % cycleBankList.length;
    setAuditCycleIndex(nextIdx);
    if (cycleBankList[nextIdx]) {
      setInspectBankId(cycleBankList[nextIdx].id);
    }
  };

  const filtered = useMemo(() => {
    return bloodBanks.filter((b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [bloodBanks, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      city: form.city,
      address: form.address,
      lat: parseFloat(form.lat) || 0,
      lng: parseFloat(form.lng) || 0,
      capacity: parseInt(form.capacity) || 0,
      contact: form.contact,
      emergencyActive: form.emergencyActive,
      status: form.status,
    };
    if (editId) {
      updateBloodBank(editId, data);
      setEditId(null);
    } else {
      addBloodBank(data);
    }
    setForm({ name: '', city: '', address: '', lat: '', lng: '', capacity: '', contact: '', emergencyActive: false, status: 'active' });
    setShowForm(false);
  };

  const startEdit = (bank: BloodBank) => {
    setForm({
      name: bank.name,
      city: bank.city,
      address: bank.address,
      lat: String(bank.lat),
      lng: String(bank.lng),
      capacity: String(bank.capacity),
      contact: bank.contact,
      emergencyActive: bank.emergencyActive,
      status: bank.status === 'deactivated' ? 'deactivated' : 'active',
    });
    setEditId(bank.id);
    setShowForm(true);
  };

  // Units for inspected bank retrieved via Hash Table
  const inspectedBank = inspectBankId ? bankHashTable.get(inspectBankId) || null : null;
  const inspectedBankUnits = useMemo(() => {
    if (!inspectBankId) return [];
    return inventory.filter((u) => u.bloodBankId === inspectBankId);
  }, [inventory, inspectBankId]);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Blood Banks</h1>
          <p>Authorize participating regional blood banks, oversee operational statuses, and inspect facility-held stock.</p>
        </div>
      </div>

      <div className="page-content">
        {/* Key Information — 4 Standard Metrics */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: '#38bdf8' }}>{bloodBanks.length}</div>
            <div className="stat-card-label">Total Facilities</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: '#10b981' }}>{bloodBanks.filter((b) => b.emergencyActive).length}</div>
            <div className="stat-card-label">Emergency Hubs</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: '#f59e0b' }}>{bloodBanks.reduce((s, b) => s + b.capacity, 0).toLocaleString()}</div>
            <div className="stat-card-label">Network Capacity (Units)</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: '#f87171', fontSize: '15px', lineHeight: 1.2, marginTop: 4 }}>
              {currentAuditedBank ? currentAuditedBank.name.replace(' Blood Bank', '').replace(' Blood Centre', '') : '—'}
            </div>
            <div className="stat-card-label">Active Audit Node</div>
          </div>
        </div>

        {/* Compact Audit Cycle Toolbar */}
        <div className="card" style={{ marginBottom: 18, padding: '10px 16px', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px' }}>
              <RotateCw size={14} color="#f59e0b" />
              <span style={{ color: '#94a3b8' }}>Audit Rotation Node:</span>
              <strong style={{ color: '#f1f5f9' }}>{currentAuditedBank?.name || '—'}</strong>
              <span style={{ color: '#64748b' }}>&rarr; Next: {nextAuditedBank?.name || '—'}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => currentAuditedBank && setInspectBankId(currentAuditedBank.id)}
              >
                <Package size={13} /> Inspect Current
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleNextInAuditCycle}
              >
                <RotateCw size={13} /> Advance Cycle
              </button>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 300 }}>
              <input
                className="form-input"
                placeholder="Search by ID, name, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: 32 }}
              />
              <Search size={14} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Showing {filtered.length} of {bloodBanks.length} facilities
            </span>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => {
              setShowForm(!showForm);
              setEditId(null);
              setForm({ name: '', city: '', address: '', lat: '', lng: '', capacity: '', contact: '', emergencyActive: false, status: 'active' });
            }}
          >
            <Plus size={16} /> Register New Blood Bank
          </button>
        </div>

        {/* Add/Edit Bank Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(220, 38, 38, 0.4)' }}>
            <div className="card-header">
              <h2>{editId ? `Edit Facility (${editId})` : 'Register New Regional Blood Bank'}</h2>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Administrative registration creates an audited facility record</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Facility Name</label>
                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ramanathapuram District Blood Centre" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City / Jurisdiction</label>
                    <input className="form-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Ramanathapuram" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Physical Address</label>
                    <input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Hospital premises, Road name" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emergency Phone / Hotline</label>
                    <input className="form-input" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="+91 4567 222 345" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Latitude Coordinate</label>
                    <input className="form-input" type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="9.3639" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude Coordinate</label>
                    <input className="form-input" type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="78.8395" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Storage Capacity (Units)</label>
                    <input className="form-input" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="1200" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Operational Status</label>
                    <select
                      className="form-select"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'deactivated' })}
                    >
                      <option value="active">Active (Operational & Redistribution Ready)</option>
                      <option value="deactivated">Deactivated (Offline / Suspended)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <input
                    type="checkbox"
                    id="emergencyActive"
                    checked={form.emergencyActive}
                    onChange={(e) => setForm({ ...form, emergencyActive: e.target.checked })}
                  />
                  <label htmlFor="emergencyActive" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                    Designate as Regional Emergency Hub (24/7 Priority Transfusion Center)
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                  <button type="submit" className="btn btn-primary">{editId ? 'Save Changes' : 'Authorize & Register'}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Blood Banks Table */}
        <div className="card">
          <div className="card-header">
            <h2>Participating Blood Banks ({filtered.length})</h2>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Hash table indexing enabled for constant-time ID verification
            </span>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Facility & ID</th>
                  <th>Location</th>
                  <th>Contact</th>
                  <th>Capacity</th>
                  <th>Available Stock</th>
                  <th>Network Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bank) => {
                  const availableUnits = inventory.filter((u) => u.bloodBankId === bank.id && u.status === 'available');
                  const totalStock = availableUnits.reduce((s, u) => s + u.quantity, 0);
                  const isDeactivated = bank.status === 'deactivated';

                  return (
                    <tr key={bank.id} style={{ opacity: isDeactivated ? 0.65 : 1 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Building size={16} style={{ color: isDeactivated ? '#64748b' : 'var(--accent-primary)', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{bank.name}</div>
                            <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{bank.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="#60a5fa" />
                          <span>{bank.city}</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{bank.lat.toFixed(4)}, {bank.lng.toFixed(4)}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{bank.contact || 'N/A'}</td>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{bank.capacity}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>max units</div>
                      </td>
                      <td>
                        <span className={`badge ${totalStock > 0 ? 'badge-info' : 'badge-warning'}`}>
                          {totalStock} units
                        </span>
                      </td>
                      <td>
                        {isDeactivated ? (
                          <span className="badge badge-critical" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <XCircle size={10} /> Deactivated
                          </span>
                        ) : bank.emergencyActive ? (
                          <span className="badge badge-normal" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={10} /> Emergency Hub
                          </span>
                        ) : (
                          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={10} /> Active
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setInspectBankId(bank.id)}
                            title="Inspect units stored at this bank"
                          >
                            <Package size={13} /> Stock
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => startEdit(bank)}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          {isDeactivated ? (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => activateBloodBank(bank.id)}
                              title="Reactivate participating facility"
                            >
                              Activate
                            </button>
                          ) : (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => deactivateBloodBank(bank.id)}
                              title="Halt facility transfers and deactivate"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      <p>No participating blood banks found matching search</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Collapsible Inventory Inspection Drawer */}
        {inspectedBank && (
          <div className="card" style={{ marginTop: 24, border: '1px solid rgba(59, 130, 246, 0.4)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
                  <Package size={16} color="#60a5fa" />
                  Facility Inventory Inspection: {inspectedBank.name}
                </h2>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Bank ID: {inspectedBank.id} • Physical Capacity: {inspectedBank.capacity} units • Current Stock: {inspectedBankUnits.length} batch records
                </span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setInspectBankId(null)}
              >
                <X size={14} /> Close Inspection
              </button>
            </div>
            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
              {inspectedBankUnits.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Unit ID</th>
                      <th>Group</th>
                      <th>Component</th>
                      <th>Qty</th>
                      <th>Status</th>
                      <th>Storage Temp</th>
                      <th>Expiry Date & Time</th>
                      <th>Remaining Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectedBankUnits.map((u) => {
                      const remMs = new Date(u.expiryTimestamp).getTime() - now;
                      const remHours = Math.floor(remMs / 3600000);
                      const isExpired = remMs <= 0;
                      return (
                        <tr key={u.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{u.id}</td>
                          <td>
                            <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{u.bloodType}</span>
                          </td>
                          <td style={{ fontSize: 12 }}>{u.componentType}</td>
                          <td style={{ fontWeight: 600 }}>{u.quantity}</td>
                          <td>
                            <span className={`badge badge-${u.status}`}>{u.status}</span>
                          </td>
                          <td style={{ fontSize: 11, color: '#94a3b8' }}>{u.storageTemp}</td>
                          <td style={{ fontSize: 11 }}>{new Date(u.expiryTimestamp).toLocaleString()}</td>
                          <td>
                            <span style={{
                              fontWeight: 600,
                              color: isExpired ? 'var(--status-critical)' : remHours < 24 ? 'var(--status-warning)' : 'var(--status-normal)',
                              fontSize: 12,
                            }}>
                              {isExpired ? 'EXPIRED' : `${remHours}h ${Math.floor((remMs % 3600000) / 60000)}m`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No blood units currently logged at this facility.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapsible How the Algorithm Works Section (Requirement 7) */}
        <details className="card" style={{ marginTop: 24, padding: '12px 18px', background: 'rgba(255, 255, 255, 0.02)' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '12px', color: '#94a3b8' }}>
            How the algorithm works: Circular Linked List &amp; Hash Table
          </summary>
          <div style={{ marginTop: 12, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5 }}>
            <p style={{ margin: '0 0 6px' }}>
              <strong>Circular Linked List:</strong> Participating facilities form a closed cycle where the terminal node points back to the head. This guarantees equitable, round-robin compliance audits without dead ends or starvation.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Hash Table Indexing:</strong> Facility records and inventory queries utilize polynomial rolling hash buckets with separate chaining, achieving constant-time $O(1)$ lookups during emergency triage.
            </p>
          </div>
        </details>
      </div>
    </>
  );
}

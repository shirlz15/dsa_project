'use client';

import { useStore } from '@/lib/store';
import {
  FileText, Plus, X, ArrowRight, Play, CheckCircle, Clock,
  AlertTriangle, Check, Filter
} from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { BLOOD_TYPES, COMPONENT_TYPES, BloodType, ComponentType, BloodRequest } from '@/lib/types';
import { Queue } from '@/lib/dsa-engine';
import DsaUsedSection from '@/components/DsaUsedSection';

export default function RequestsPage() {
  const requests = useStore((s) => s.requests);
  const bloodBanks = useStore((s) => s.bloodBanks);
  const addRequest = useStore((s) => s.addRequest);
  const updateRequest = useStore((s) => s.updateRequest);
  const cancelRequest = useStore((s) => s.cancelRequest);
  const getNow = useStore((s) => s.getNow);
  const now = getNow();

  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [lastProcessed, setLastProcessed] = useState<{ id: string; destination: string; type: string } | null>(null);

  const [form, setForm] = useState({
    destinationBankId: '', bloodType: 'O+' as BloodType, componentType: 'Packed RBC' as ComponentType,
    quantity: '1', priority: 'urgent' as 'routine' | 'urgent' | 'emergency', neededByHours: '24', notes: '',
  });

  // ─── DSA: Custom Queues partitioned by Priority Class (FIFO within class) ──
  const { emergencyQueue, urgentQueue, routineQueue, unifiedQueueList } = useMemo(() => {
    const qEmergency = new Queue<BloodRequest>();
    const qUrgent = new Queue<BloodRequest>();
    const qRoutine = new Queue<BloodRequest>();

    const pendingChronological = requests
      .filter((r) => r.status === 'pending')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    pendingChronological.forEach((r) => {
      if (r.priority === 'emergency') qEmergency.enqueue(r);
      else if (r.priority === 'urgent') qUrgent.enqueue(r);
      else qRoutine.enqueue(r);
    });

    const unified: { request: BloodRequest; queuePosition: number; tier: string }[] = [];
    let pos = 1;
    qEmergency.toArray().forEach((r) => unified.push({ request: r, queuePosition: pos++, tier: 'Emergency (Tier 1)' }));
    qUrgent.toArray().forEach((r) => unified.push({ request: r, queuePosition: pos++, tier: 'Urgent (Tier 2)' }));
    qRoutine.toArray().forEach((r) => unified.push({ request: r, queuePosition: pos++, tier: 'Routine (Tier 3)' }));

    return {
      emergencyQueue: qEmergency,
      urgentQueue: qUrgent,
      routineQueue: qRoutine,
      unifiedQueueList: unified,
    };
  }, [requests]);

  // Front of current priority tier
  const nextRequestToProcess = emergencyQueue.peek() || urgentQueue.peek() || routineQueue.peek() || null;

  const handleProcessNextInQueue = () => {
    if (!nextRequestToProcess) return;
    updateRequest(nextRequestToProcess.id, { status: 'processing' });
    setLastProcessed({
      id: nextRequestToProcess.id,
      destination: bloodBanks.find((b) => b.id === nextRequestToProcess.destinationBankId)?.name || nextRequestToProcess.destinationBankId,
      type: `${nextRequestToProcess.bloodType} ${nextRequestToProcess.componentType}`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.destinationBankId) return;
    addRequest({
      destinationBankId: form.destinationBankId,
      bloodType: form.bloodType,
      componentType: form.componentType,
      quantity: parseInt(form.quantity) || 1,
      priority: form.priority,
      neededBy: new Date(now + parseInt(form.neededByHours) * 3600000).toISOString(),
      notes: form.notes,
    });
    setForm({
      destinationBankId: '', bloodType: 'O+', componentType: 'Packed RBC',
      quantity: '1', priority: 'urgent', neededByHours: '24', notes: '',
    });
    setShowForm(false);
  };

  const getBankName = (id: string) => bloodBanks.find((b) => b.id === id)?.name || id;

  const priorityColors = { emergency: 'badge-critical', urgent: 'badge-warning', routine: 'badge-info' };

  const filteredHistory = useMemo(() => {
    let list = [...requests].reverse();
    if (filterStatus) list = list.filter((r) => r.status === filterStatus);
    if (filterPriority) list = list.filter((r) => r.priority === filterPriority);
    return list;
  }, [requests, filterStatus, filterPriority]);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Hospital Requests</h1>
          <p>Receive and prioritize incoming clinical blood requisitions ordered by urgency tier and FIFO arrival.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Create Request
        </button>
      </div>

      <div className="page-content">
        {/* Processing Notification */}
        {lastProcessed && (
          <div
            className="card"
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              borderLeft: '4px solid #10b981',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <CheckCircle size={18} color="#10b981" />
              <span>
                Processed Front Request <strong>{lastProcessed.id}</strong> ({lastProcessed.type} for {lastProcessed.destination}) &mdash; Moved to <em>processing</em> state.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href={`/redistribution?requestId=${lastProcessed.id}`} className="btn btn-primary btn-sm">
                Open Redistribution Planner <ArrowRight size={13} />
              </Link>
              <button className="btn btn-secondary btn-sm" onClick={() => setLastProcessed(null)}>Dismiss</button>
            </div>
          </div>
        )}

        {/* 3-4 Key Information Metrics */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-card-value">{requests.length}</div>
            <div className="stat-card-label">Total Requisitions</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: '#38bdf8' }}>{unifiedQueueList.length}</div>
            <div className="stat-card-label">Pending Queue</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: '#ef4444' }}>
              {emergencyQueue.size() + urgentQueue.size()}
            </div>
            <div className="stat-card-label">Emergency &amp; Urgent</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: nextRequestToProcess ? '#f59e0b' : '#94a3b8', fontSize: '16px', marginTop: 4 }}>
              {nextRequestToProcess ? nextRequestToProcess.id : 'None'}
            </div>
            <div className="stat-card-label">Front of Priority Queue</div>
          </div>
        </div>

        {/* Create Request Form Drawer */}
        {showForm && (
          <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(220, 38, 38, 0.4)' }}>
            <div className="card-header">
              <h2>Register New Hospital Blood Requisition</h2>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Enqueues request into priority FIFO queue</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Destination Facility</label>
                    <select className="form-select" value={form.destinationBankId} onChange={(e) => setForm({ ...form, destinationBankId: e.target.value })} required>
                      <option value="">Select facility...</option>
                      {bloodBanks.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.city})</option>)}
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
                    <label className="form-label">Quantity (Units)</label>
                    <input className="form-input" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority Tier</label>
                    <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as 'routine' | 'urgent' | 'emergency' })}>
                      <option value="emergency">Emergency (Tier 1 FIFO)</option>
                      <option value="urgent">Urgent (Tier 2 FIFO)</option>
                      <option value="routine">Routine (Tier 3 FIFO)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Needed Within (Hours)</label>
                    <input className="form-input" type="number" min="1" value={form.neededByHours} onChange={(e) => setForm({ ...form, neededByHours: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Clinical Indication &amp; Notes</label>
                  <input className="form-input" placeholder="e.g. Acute surgical hemorrhage, trauma ICU transfusion" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button type="submit" className="btn btn-primary">Enqueue Request</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Main Working Area: One Clear Active Request Card */}
        <div className="card" style={{ marginBottom: 20, border: nextRequestToProcess ? '1px solid rgba(220, 38, 38, 0.4)' : undefined }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color="#f87171" />
              <h2 style={{ fontSize: 14 }}>Active Request Front of Priority Queue</h2>
            </div>
            {nextRequestToProcess && (
              <span className={`badge ${priorityColors[nextRequestToProcess.priority]}`} style={{ textTransform: 'uppercase', fontWeight: 800 }}>
                {nextRequestToProcess.priority} (Tier 1 Priority)
              </span>
            )}
          </div>
          <div className="card-body">
            {nextRequestToProcess ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#f87171' }}>{nextRequestToProcess.bloodType}</span>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>{nextRequestToProcess.componentType}</span>
                    <span style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', fontWeight: 700 }}>
                      {nextRequestToProcess.quantity} units requested
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                    <div><strong>Destination Facility:</strong> {getBankName(nextRequestToProcess.destinationBankId)} ({nextRequestToProcess.destinationBankId})</div>
                    <div><strong>Needed By:</strong> {new Date(nextRequestToProcess.neededBy).toLocaleString()} &bull; <strong>Clinical Notes:</strong> {nextRequestToProcess.notes || 'Routine restocking'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button className="btn btn-secondary" onClick={handleProcessNextInQueue}>
                    <Play size={14} /> Dequeue to Processing
                  </button>
                  <Link
                    href={`/redistribution?requestId=${nextRequestToProcess.id}`}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                  >
                    <span>Match in Redistribution Planner</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b' }}>
                <CheckCircle size={32} style={{ margin: '0 auto 8px', color: '#10b981', opacity: 0.8 }} />
                <h3 style={{ fontSize: '15px', color: '#f1f5f9', margin: '0 0 4px' }}>All Requisitions Serviced</h3>
                <p style={{ fontSize: '12px', margin: 0 }}>No pending hospital orders in the active queue.</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Request Queue & History (Requirement 6) */}
        <details className="card" open style={{ marginBottom: 20 }}>
          <summary style={{ padding: '14px 18px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', color: '#f1f5f9', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            Request Queue &amp; History ({filteredHistory.length} total)
          </summary>
          <div className="card-body" style={{ padding: 0 }}>
            {/* Filter toolbar */}
            <div style={{ padding: '10px 16px', display: 'flex', gap: 10, borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: 'rgba(255, 255, 255, 0.01)' }}>
              <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 140, fontSize: 11, height: 30 }}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="matched">Matched</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select className="form-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ width: 140, fontSize: 11, height: 30 }}>
                <option value="">All Priorities</option>
                <option value="emergency">Emergency</option>
                <option value="urgent">Urgent</option>
                <option value="routine">Routine</option>
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Destination</th>
                    <th>Group</th>
                    <th>Component</th>
                    <th>Qty</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Needed By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.id}</td>
                      <td style={{ fontSize: 12 }}>{getBankName(r.destinationBankId)}</td>
                      <td><span className="badge badge-info">{r.bloodType}</span></td>
                      <td style={{ fontSize: 12 }}>{r.componentType}</td>
                      <td style={{ fontWeight: 600 }}>{r.quantity}</td>
                      <td><span className={`badge ${priorityColors[r.priority]}`}>{r.priority}</span></td>
                      <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                      <td style={{ fontSize: 11 }}>{new Date(r.neededBy).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {(r.status === 'pending' || r.status === 'processing') && (
                            <>
                              <Link href={`/redistribution?requestId=${r.id}`} className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: '2px 8px' }}>
                                Plan
                              </Link>
                              <button className="btn btn-danger btn-sm" onClick={() => cancelRequest(r.id)} title="Cancel request">
                                <X size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr><td colSpan={9} className="empty-state"><p>No requests found matching filter</p></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </details>

        {/* ─── DSA USED ON THIS PAGE ────────────────────────────────────────── */}
        <DsaUsedSection
          pageContext="Multi-tier clinical requisition triage and FIFO servicing"
          items={[
            {
              name: 'Queue',
              purpose: 'Maintains chronological arrival order of requests within each priority tier.',
              application: 'Three separate Queue instances partition requests into Emergency (Tier 1), Urgent (Tier 2), and Routine (Tier 3). Requests are enqueued in arrival order and dequeued FIFO within each tier.',
              timeComplexity: 'O(n) dequeue via Array.shift(); O(1) enqueue via Array.push().',
            },
          ]}
        />
      </div>
    </>
  );
}

'use client';

import { useStore } from '@/lib/store';
import {
  FileText, Plus, X, ArrowRight, Play, CheckCircle, Clock,
  AlertTriangle, Layers, ListOrdered, Sparkles, Filter
} from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { BLOOD_TYPES, COMPONENT_TYPES, BloodType, ComponentType, BloodRequest } from '@/lib/types';
import { Queue } from '@/lib/dsa-engine';

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
  const [activeQueueTab, setActiveQueueTab] = useState<'all' | 'emergency' | 'urgent' | 'routine'>('all');
  const [lastProcessed, setLastProcessed] = useState<{ id: string; destination: string; type: string } | null>(null);

  const [form, setForm] = useState({
    destinationBankId: '', bloodType: 'O+' as BloodType, componentType: 'Packed RBC' as ComponentType,
    quantity: '1', priority: 'routine' as 'routine' | 'urgent' | 'emergency', neededByHours: '24', notes: '',
  });

  // ─── DSA: Custom Queues partitioned by Priority Class (FIFO within class) ──
  const { emergencyQueue, urgentQueue, routineQueue, unifiedQueueList } = useMemo(() => {
    const qEmergency = new Queue<BloodRequest>();
    const qUrgent = new Queue<BloodRequest>();
    const qRoutine = new Queue<BloodRequest>();

    // Sort chronologically by arrival time (createdAt) to enforce strict FIFO arrival order
    const pendingChronological = requests
      .filter((r) => r.status === 'pending' || r.status === 'processing')
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

    // Transition status to processing (Dequeue / Servicing step)
    updateRequest(nextRequestToProcess.id, { status: 'processing' });
    setLastProcessed({
      id: nextRequestToProcess.id,
      destination: bloodBanks.find((b) => b.id === nextRequestToProcess.destinationBankId)?.name || nextRequestToProcess.destinationBankId,
      type: `${nextRequestToProcess.bloodType} ${nextRequestToProcess.componentType}`,
    });
  };

  const filtered = useMemo(() => {
    let items = [...requests];
    if (filterStatus) items = items.filter((r) => r.status === filterStatus);
    if (filterPriority) items = items.filter((r) => r.priority === filterPriority);
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [requests, filterStatus, filterPriority]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRequest({
      destinationBankId: form.destinationBankId,
      bloodType: form.bloodType,
      componentType: form.componentType,
      quantity: parseInt(form.quantity) || 1,
      priority: form.priority,
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Blood Requests & Processing Queue</h1>
          <p>Prioritized incoming blood requests serviced via custom FIFO queues with transparent priority classes</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={handleProcessNextInQueue}
            disabled={!nextRequestToProcess}
            title={nextRequestToProcess ? `Process ${nextRequestToProcess.id} (${nextRequestToProcess.priority})` : 'Queue is empty'}
          >
            <Play size={16} /> Process Front Request (FIFO)
          </button>
          <button className="btn btn-secondary" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> New Request (Enqueue)
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Processing Notification */}
        {lastProcessed && (
          <div
            className="card"
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              borderLeft: '4px solid var(--color-success)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <CheckCircle size={18} color="var(--color-success)" />
              <span>
                Processed Front Request <strong>{lastProcessed.id}</strong> ({lastProcessed.type} for {lastProcessed.destination}) — Moved to <em>processing</em> state.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/redistribution" className="btn btn-primary btn-sm">
                Open Redistribution Planner <ArrowRight size={13} />
              </Link>
              <button className="btn btn-secondary btn-sm" onClick={() => setLastProcessed(null)}>Dismiss</button>
            </div>
          </div>
        )}

        {/* ─── Integrated Queue Inspector Panel ──────────────────────────────── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ListOrdered size={18} color="var(--color-primary)" />
              <h2 style={{ fontSize: 15 }}>Incoming Request Queue (FIFO by Urgency Tier)</h2>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className={`btn btn-sm ${activeQueueTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveQueueTab('all')}
              >
                All Enqueued ({unifiedQueueList.length})
              </button>
              <button
                className={`btn btn-sm ${activeQueueTab === 'emergency' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveQueueTab('emergency')}
              >
                Emergency ({emergencyQueue.size()})
              </button>
              <button
                className={`btn btn-sm ${activeQueueTab === 'urgent' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveQueueTab('urgent')}
              >
                Urgent ({urgentQueue.size()})
              </button>
              <button
                className={`btn btn-sm ${activeQueueTab === 'routine' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveQueueTab('routine')}
              >
                Routine ({routineQueue.size()})
              </button>
            </div>
          </div>

          <div className="card-body">
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              <strong>DSA Queue Integration:</strong> Requests are enqueued in strict chronological arrival order (FIFO) within each priority class. Emergency requests (Tier 1) are serviced before Urgent (Tier 2), which precede Routine (Tier 3). Dequeue operation is O(1) conceptually, returning the front element for redistribution planning.
            </div>

            {/* Current Front Request Showcase */}
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                marginBottom: 16,
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Current Front of Queue (Next to Review / Dequeue)
                </div>
                {nextRequestToProcess ? (
                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-info" style={{ fontFamily: 'monospace' }}>{nextRequestToProcess.id}</span>
                    <span className={`badge ${priorityColors[nextRequestToProcess.priority]}`}>{nextRequestToProcess.priority}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {nextRequestToProcess.quantity}u {nextRequestToProcess.bloodType} {nextRequestToProcess.componentType}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      for {getBankName(nextRequestToProcess.destinationBankId)}
                    </span>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    No pending requests in queue. Create a request to enqueue.
                  </div>
                )}
              </div>

              {nextRequestToProcess && (
                <button className="btn btn-primary btn-sm" onClick={handleProcessNextInQueue}>
                  <Play size={13} /> Dequeue & Process Front Request
                </button>
              )}
            </div>

            {/* Traversal view of the Queue */}
            {unifiedQueueList.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>Queue Pos</th>
                      <th>Priority Tier</th>
                      <th>Request ID</th>
                      <th>Destination</th>
                      <th>Component</th>
                      <th>Qty</th>
                      <th>Enqueued At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unifiedQueueList
                      .filter((item) => activeQueueTab === 'all' || item.request.priority === activeQueueTab)
                      .map((item) => {
                        const isFront = item.request.id === nextRequestToProcess?.id;
                        return (
                          <tr key={item.request.id} style={{ background: isFront ? 'rgba(220, 38, 38, 0.05)' : undefined }}>
                            <td style={{ fontWeight: 600 }}>
                              {isFront ? (
                                <span className="badge badge-critical" style={{ fontSize: 10 }}>#1 FRONT</span>
                              ) : (
                                `#${item.queuePosition}`
                              )}
                            </td>
                            <td><span className={`badge ${priorityColors[item.request.priority]}`}>{item.tier}</span></td>
                            <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{item.request.id}</td>
                            <td style={{ fontSize: 12 }}>{getBankName(item.request.destinationBankId)}</td>
                            <td style={{ fontSize: 12 }}>{item.request.bloodType} {item.request.componentType}</td>
                            <td style={{ fontWeight: 600 }}>{item.request.quantity}</td>
                            <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(item.request.createdAt).toLocaleTimeString()}</td>
                            <td>
                              <Link
                                href="/redistribution"
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: 11, padding: '2px 8px' }}
                              >
                                Match in Planner <ArrowRight size={10} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>
                Queue is empty.
              </div>
            )}
          </div>
        </div>

        {/* ─── Standard Toolbar & All Requests Table ────────────────────────── */}
        <div className="toolbar" style={{ marginTop: 20 }}>
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
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> New Request (Enqueue)
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h2>Create Blood Request (Enqueues into FIFO Queue)</h2></div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Destination Blood Bank</label>
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
                    <label className="form-label">Priority Tier</label>
                    <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as 'routine' | 'urgent' | 'emergency' })}>
                      <option value="routine">Routine (Tier 3 FIFO)</option>
                      <option value="urgent">Urgent (Tier 2 FIFO)</option>
                      <option value="emergency">Emergency (Tier 1 FIFO)</option>
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
                  <button type="submit" className="btn btn-primary">Enqueue Request</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header"><h2>All Historical & Active Requests ({filtered.length})</h2></div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Destination</th>
                  <th>Type</th>
                  <th>Component</th>
                  <th>Qty</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Needed By</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
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
                    <td style={{ fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(r.status === 'pending' || r.status === 'processing') && (
                          <>
                            <Link href="/redistribution" className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: '2px 8px' }}>
                              Plan
                            </Link>
                            <button className="btn btn-danger btn-sm" onClick={() => cancelRequest(r.id)}><X size={12} /></button>
                          </>
                        )}
                      </div>
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

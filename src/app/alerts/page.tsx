'use client';

import { useStore } from '@/lib/store';
import { Bell, Check, Eye, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function AlertsPage() {
  const alerts = useStore((s) => s.alerts);
  const markAlertRead = useStore((s) => s.markAlertRead);
  const resolveAlert = useStore((s) => s.resolveAlert);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const filtered = useMemo(() => {
    let items = [...alerts];
    if (filterSeverity) items = items.filter((a) => a.severity === filterSeverity);
    if (filterStatus === 'unread') items = items.filter((a) => !a.read);
    if (filterStatus === 'unresolved') items = items.filter((a) => !a.resolved);
    if (filterStatus === 'resolved') items = items.filter((a) => a.resolved);
    if (filterType) items = items.filter((a) => a.type === filterType);
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [alerts, filterSeverity, filterStatus, filterType]);

  const alertTypes = [...new Set(alerts.map((a) => a.type))];

  return (
    <>
      <div className="page-header"><h1>Alerts & Notifications</h1><p>System alerts based on inventory state, expiry, and transfer events</p></div>
      <div className="page-content">
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
          <div className="stat-card"><div className="stat-card-value">{alerts.length}</div><div className="stat-card-label">Total Alerts</div></div>
          <div className="stat-card"><div className="stat-card-value" style={{ color: 'var(--status-critical)' }}>{alerts.filter((a) => !a.resolved && a.severity === 'critical').length}</div><div className="stat-card-label">Critical Active</div></div>
          <div className="stat-card"><div className="stat-card-value" style={{ color: 'var(--status-warning)' }}>{alerts.filter((a) => !a.read).length}</div><div className="stat-card-label">Unread</div></div>
          <div className="stat-card"><div className="stat-card-value" style={{ color: 'var(--status-normal)' }}>{alerts.filter((a) => a.resolved).length}</div><div className="stat-card-label">Resolved</div></div>
        </div>

        <div className="toolbar">
          <select className="form-select" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} style={{ width: 150 }}>
            <option value="">All Severities</option>
            <option value="critical">Critical</option><option value="warning">Warning</option><option value="info">Info</option>
          </select>
          <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 150 }}>
            <option value="">All States</option>
            <option value="unread">Unread</option><option value="unresolved">Unresolved</option><option value="resolved">Resolved</option>
          </select>
          <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: 180 }}>
            <option value="">All Types</option>
            {alertTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {filtered.length > 0 ? (
              <table className="data-table">
                <thead><tr><th>Severity</th><th>Type</th><th>Message</th><th>Read</th><th>Resolved</th><th>Time</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} style={{ background: !a.read ? 'var(--accent-light)' : undefined }}>
                      <td><span className={`badge badge-${a.severity}`}>{a.severity}</span></td>
                      <td style={{ fontSize: 12 }}>{a.type.replace(/_/g, ' ')}</td>
                      <td style={{ fontSize: 12 }}>{a.message}</td>
                      <td><span className={`badge ${a.read ? 'badge-normal' : 'badge-warning'}`}>{a.read ? 'Yes' : 'No'}</span></td>
                      <td><span className={`badge ${a.resolved ? 'badge-normal' : 'badge-critical'}`}>{a.resolved ? 'Yes' : 'No'}</span></td>
                      <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{new Date(a.createdAt).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {!a.read && <button className="btn btn-secondary btn-sm" onClick={() => markAlertRead(a.id)}><Eye size={12} /> Read</button>}
                          {!a.resolved && <button className="btn btn-success btn-sm" onClick={() => resolveAlert(a.id)}><Check size={12} /> Resolve</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state"><Bell size={48} /><h3>No Alerts</h3><p>No alerts match the current filters</p></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

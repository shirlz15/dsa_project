'use client';

import { useStore } from '@/lib/store';
import { ScrollText, Download, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function AuditPage() {
  const auditTrail = useStore((s) => s.auditTrail);
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const entityTypes = [...new Set(auditTrail.map((e) => e.entityType))];
  const actionTypes = [...new Set(auditTrail.map((e) => e.action))];

  const filtered = useMemo(() => {
    let items = [...auditTrail];
    if (filterEntity) items = items.filter((e) => e.entityType === filterEntity);
    if (filterAction) items = items.filter((e) => e.action === filterAction);
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditTrail, filterEntity, filterAction]);

  const exportCSV = () => {
    const header = 'ID,Entity Type,Entity ID,Action,Description,Before,After,Timestamp\n';
    const rows = filtered.map((e) =>
      `"${e.id}","${e.entityType}","${e.entityId}","${e.action}","${e.description}","${(e.beforeValue || '').replace(/"/g, '""')}","${(e.afterValue || '').replace(/"/g, '""')}","${e.timestamp}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit_trail.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="page-header"><h1>Audit Trail</h1><p>Complete history of state changes with before/after values</p></div>
      <div className="page-content">
        <div className="toolbar">
          <select className="form-select" value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} style={{ width: 160 }}>
            <option value="">All Entities</option>
            {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="form-select" value={filterAction} onChange={(e) => setFilterAction(e.target.value)} style={{ width: 160 }}>
            <option value="">All Actions</option>
            {actionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={exportCSV}><Download size={16} /> Export CSV</button>
        </div>

        <div className="card">
          <div className="card-header"><h2>Events ({filtered.length})</h2></div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            {filtered.length > 0 ? (
              <table className="data-table">
                <thead><tr><th>Timestamp</th><th>Entity</th><th>Entity ID</th><th>Action</th><th>Description</th><th>Before</th><th>After</th></tr></thead>
                <tbody>
                  {filtered.slice(0, 100).map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{new Date(e.timestamp).toLocaleString()}</td>
                      <td><span className="badge badge-info">{e.entityType}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{e.entityId}</td>
                      <td><span className={`badge ${e.action === 'created' ? 'badge-normal' : e.action === 'approved' ? 'badge-approved' : e.action === 'rejected' ? 'badge-critical' : 'badge-warning'}`}>{e.action}</span></td>
                      <td style={{ fontSize: 12 }}>{e.description}</td>
                      <td style={{ fontSize: 10, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.beforeValue ? <details><summary>View</summary><pre style={{ fontSize: 10, whiteSpace: 'pre-wrap' }}>{e.beforeValue}</pre></details> : '—'}</td>
                      <td style={{ fontSize: 10, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.afterValue ? <details><summary>View</summary><pre style={{ fontSize: 10, whiteSpace: 'pre-wrap' }}>{e.afterValue}</pre></details> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state"><ScrollText size={48} /><h3>No Audit Events</h3></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

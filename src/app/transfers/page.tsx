'use client';

import { useStore } from '@/lib/store';
import { ArrowRightLeft } from 'lucide-react';

function formatMin(m: number): string {
  const h = Math.floor(m / 60); const mins = Math.round(m % 60);
  return h > 0 ? `${h}h ${mins}m` : `${mins}m`;
}

export default function TransfersPage() {
  const transfers = useStore((s) => s.transfers);
  const bloodBanks = useStore((s) => s.bloodBanks);
  const approveTransfer = useStore((s) => s.approveTransfer);
  const rejectTransfer = useStore((s) => s.rejectTransfer);
  const getBankName = (id: string) => bloodBanks.find((b) => b.id === id)?.name || id;

  return (
    <>
      <div className="page-header"><h1>Transfer Tracking</h1><p>Track all redistribution transfers and their lifecycle</p></div>
      <div className="page-content">
        {transfers.length > 0 ? (
          <div className="card">
            <div className="card-header"><h2>All Transfers ({transfers.length})</h2></div>
            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>ID</th><th>Source</th><th>Destination</th><th>Units</th><th>Status</th><th>Transport</th><th>Processing</th><th>Safety</th><th>Usable After</th><th>Created</th><th>Actions</th></tr></thead>
                <tbody>
                  {[...transfers].reverse().map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{t.id}</td>
                      <td style={{ fontSize: 12 }}>{getBankName(t.sourceBankId)}</td>
                      <td style={{ fontSize: 12 }}>{getBankName(t.destinationBankId)}</td>
                      <td>{t.sourceUnitIds.length}</td>
                      <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                      <td>{formatMin(t.transportDuration)}</td>
                      <td>{formatMin(t.receivingProcessingDuration)}</td>
                      <td>{formatMin(t.safetyMargin)}</td>
                      <td style={{ fontWeight: 600, color: t.usableTimeAfterTransfer > 0 ? 'var(--status-normal)' : 'var(--status-critical)' }}>{formatMin(t.usableTimeAfterTransfer)}</td>
                      <td style={{ fontSize: 11 }}>{new Date(t.createdAt).toLocaleString()}</td>
                      <td>
                        {t.status === 'proposed' && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-success btn-sm" onClick={() => approveTransfer(t.id)}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => rejectTransfer(t.id, 'Manual rejection')}>Reject</button>
                          </div>
                        )}
                        {t.rejectionReason && <span style={{ fontSize: 11, color: 'var(--status-critical)' }}>{t.rejectionReason}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="empty-state"><ArrowRightLeft size={48} /><h3>No Transfers Yet</h3><p>Create transfer proposals from the Redistribution Planner.</p></div>
        )}
      </div>
    </>
  );
}

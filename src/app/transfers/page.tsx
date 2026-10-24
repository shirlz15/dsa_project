'use client';

import { useStore } from '@/lib/store';
import {
  ArrowRightLeft, CheckCircle, Clock, AlertTriangle, Plane, X,
  ShieldAlert, Package, Check, RefreshCw, Send, ArrowRight, Info
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { TransferStatus } from '@/lib/types';

function formatMin(m: number): string {
  const h = Math.floor(m / 60);
  const mins = Math.round(m % 60);
  return h > 0 ? `${h}h ${mins}m` : `${mins}m`;
}

export default function TransfersPage() {
  const transfers = useStore((s) => s.transfers);
  const bloodBanks = useStore((s) => s.bloodBanks);
  const approveTransfer = useStore((s) => s.approveTransfer);
  const rejectTransfer = useStore((s) => s.rejectTransfer);
  const dispatchTransfer = useStore((s) => s.dispatchTransfer);
  const delayTransfer = useStore((s) => s.delayTransfer);
  const completeTransfer = useStore((s) => s.completeTransfer);
  const failTransfer = useStore((s) => s.failTransfer);
  const getNow = useStore((s) => s.getNow);
  const now = getNow();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [feedbackNotice, setFeedbackNotice] = useState<{ message: string; success: boolean } | null>(null);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);

  // URL query parameter support: ?transferId=...&created=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tid = params.get('transferId');
      const created = params.get('created');
      if (tid) {
        setSelectedTransferId(tid);
        if (created === 'true') {
          setFeedbackNotice({
            message: `Transfer ${tid} created and authorized successfully. Custody record active in network tracking.`,
            success: true,
          });
        }
      }
    }
  }, []);

  const getBankName = (id: string) => bloodBanks.find((b) => b.id === id)?.name || id;

  const filteredTransfers = useMemo(() => {
    let list = [...transfers].reverse();
    if (filterStatus !== 'all') {
      list = list.filter((t) => t.status === filterStatus);
    }
    return list;
  }, [transfers, filterStatus]);

  const handleComplete = (id: string) => {
    const res = completeTransfer(id);
    setFeedbackNotice(res);
  };

  const handleInjectDelay = (id: string, mins: number) => {
    delayTransfer(id, mins);
    setFeedbackNotice({
      message: `Injected simulated delay of +${mins}m on transfer ${id}. Time feasibility recalculated.`,
      success: true,
    });
  };

  const statusBadgeClass: Record<TransferStatus, string> = {
    proposed: 'badge-warning',
    approved: 'badge-info',
    dispatched: 'badge-info',
    in_transit: 'badge-info',
    delayed: 'badge-warning',
    arrived: 'badge-normal',
    received: 'badge-normal',
    rejected: 'badge-critical',
    cancelled: 'badge-critical',
    failed: 'badge-critical',
  };

  // Key metrics
  const activeCount = useMemo(() => transfers.filter((t) => t.status === 'in_transit' || t.status === 'dispatched' || t.status === 'delayed').length, [transfers]);
  const deliveredCount = useMemo(() => transfers.filter((t) => t.status === 'received').length, [transfers]);
  const delayWarningCount = useMemo(() => transfers.filter((t) => t.status === 'delayed' || t.usableTimeAfterTransfer <= 0).length, [transfers]);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Transfer Tracking</h1>
          <p>Track active custody handovers, enforce exactly-once receipt verification, and monitor delay recalculations.</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/redistribution" className="btn btn-primary">
            + Propose Redistribution
          </Link>
        </div>
      </div>

      <div className="page-content">
        {/* ─── Key Operational Metrics ────────────────────────────────────── */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-label">Total Custody Records</div>
            <div className="stat-value">{transfers.length}</div>
            <div className="stat-desc">All historical simulated transfers</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active / In-Transit</div>
            <div className="stat-value" style={{ color: activeCount > 0 ? 'var(--color-info)' : 'var(--text-muted)' }}>
              {activeCount}
            </div>
            <div className="stat-desc">Airborne or approved for dispatch</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Received & Verified</div>
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>{deliveredCount}</div>
            <div className="stat-desc">Successfully stocked at destination</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Delay & Viability Warnings</div>
            <div className="stat-value" style={{ color: delayWarningCount > 0 ? 'var(--color-warning)' : 'var(--text-muted)' }}>
              {delayWarningCount}
            </div>
            <div className="stat-desc">Delayed corridors or tight margins</div>
          </div>
        </div>

        {/* Action Feedback Notice */}
        {feedbackNotice && (
          <div
            className="card"
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              borderLeft: `4px solid ${feedbackNotice.success ? 'var(--color-success)' : 'var(--color-danger)'}`,
              background: feedbackNotice.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(220, 38, 38, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)' }}>
              {feedbackNotice.success ? <CheckCircle size={18} color="var(--color-success)" /> : <AlertTriangle size={18} color="var(--color-danger)" />}
              <span>{feedbackNotice.message}</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setFeedbackNotice(null)}>Dismiss</button>
          </div>
        )}

        {/* Status Filter Toolbar */}
        <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['all', 'proposed', 'approved', 'in_transit', 'delayed', 'received', 'failed'].map((st) => (
              <button
                key={st}
                className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus(st)}
                style={{ textTransform: 'capitalize' }}
              >
                {st.replace(/_/g, ' ')}
                {st === 'all' ? ` (${transfers.length})` : ` (${transfers.filter((t) => t.status === st).length})`}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Showing <strong>{filteredTransfers.length}</strong> of {transfers.length} records
          </div>
        </div>

        {/* Transfers Table */}
        {filteredTransfers.length > 0 ? (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Active & Historical Transfer Records</h2>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Deterministic Exactly-Once Inventory Handover
              </span>
            </div>
            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Transfer ID / Request</th>
                    <th>Source Bank</th>
                    <th>Destination Bank</th>
                    <th>Units</th>
                    <th>Status</th>
                    <th>Transport Time</th>
                    <th>Safety Margin</th>
                    <th>Usable Time Remaining</th>
                    <th>Simulated Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransfers.map((t) => {
                    const isFeasible = t.usableTimeAfterTransfer > 0;
                    const isSelected = selectedTransferId === t.id;

                    return (
                      <tr
                        key={t.id}
                        style={{
                          background: isSelected ? 'rgba(124, 58, 237, 0.08)' : undefined,
                          borderLeft: isSelected ? '3px solid #8b5cf6' : undefined,
                        }}
                      >
                        <td>
                          <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#f8fafc' }}>
                            {t.id}
                          </div>
                          {t.requestId && (
                            <div style={{ fontSize: 10, color: '#60a5fa' }}>
                              Req: {t.requestId}
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {new Date(t.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td style={{ fontSize: 12 }}>{getBankName(t.sourceBankId)}</td>
                        <td style={{ fontSize: 12 }}>{getBankName(t.destinationBankId)}</td>
                        <td>
                          <span className="badge badge-info">{t.sourceUnitIds.length} unit(s)</span>
                        </td>
                        <td>
                          <span className={`badge ${statusBadgeClass[t.status] || 'badge-info'}`}>
                            {t.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{formatMin(t.transportDuration)}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>proc: {formatMin(t.receivingProcessingDuration)}</div>
                        </td>
                        <td style={{ fontSize: 12 }}>{formatMin(t.safetyMargin)}</td>
                        <td>
                          <div style={{
                            fontWeight: 700,
                            color: isFeasible ? 'var(--status-normal)' : 'var(--status-critical)',
                            fontSize: 12,
                          }}>
                            {formatMin(t.usableTimeAfterTransfer)}
                          </div>
                          {!isFeasible && (
                            <span style={{ fontSize: 10, color: 'var(--status-critical)', fontWeight: 600 }}>
                              INFEASIBLE
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {/* Proposed State: Approve / Reject */}
                            {t.status === 'proposed' && (
                              <>
                                <button className="btn btn-success btn-sm" onClick={() => approveTransfer(t.id)}>
                                  <Check size={12} /> Approve
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => rejectTransfer(t.id, 'Administrator cancelled proposal')}>
                                  <X size={12} /> Reject
                                </button>
                              </>
                            )}

                            {/* Approved State: Dispatch or Simulate in Drone */}
                            {t.status === 'approved' && (
                              <>
                                <button className="btn btn-primary btn-sm" onClick={() => dispatchTransfer(t.id)}>
                                  <Send size={12} /> Dispatch
                                </button>
                                <Link
                                  href={`/drone-simulation?transferId=${t.id}`}
                                  className="btn btn-secondary btn-sm"
                                  title="Open Drone Operations simulator for this transfer"
                                >
                                  <Plane size={12} /> Drone Flight
                                </Link>
                              </>
                            )}

                            {/* In-Transit, Delayed, or Arrived: Simulate Delay, Complete, or Fail */}
                            {(t.status === 'in_transit' || t.status === 'delayed' || t.status === 'arrived') && (
                              <>
                                <Link
                                  href={`/drone-simulation?transferId=${t.id}`}
                                  className="btn btn-secondary btn-sm"
                                  title="Monitor drone flight"
                                >
                                  <Plane size={12} /> Monitor
                                </Link>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleInjectDelay(t.id, 20)}
                                  title="Inject +20m delay and recalculate feasibility"
                                >
                                  +20m Delay
                                </button>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleComplete(t.id)}
                                  disabled={!isFeasible}
                                  title={isFeasible ? 'Accept delivery and credit stock into destination bank' : 'Cannot deliver: transfer breached shelf-life'}
                                >
                                  <CheckCircle size={12} /> Complete
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => failTransfer(t.id, 'Transfer aborted by administrator')}
                                >
                                  Abort
                                </button>
                              </>
                            )}

                            {/* Completed State */}
                            {t.status === 'received' && (
                              <span style={{ fontSize: 11, color: 'var(--status-normal)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle size={13} /> Stock Handover Complete
                              </span>
                            )}

                            {/* Failed State */}
                            {(t.status === 'failed' || t.status === 'rejected') && (
                              <span style={{ fontSize: 11, color: 'var(--status-critical)' }}>
                                {t.rejectionReason || 'Transfer terminated'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <ArrowRightLeft size={48} />
            <h3>No Transfers Logged</h3>
            <p>Select a hospital request and authorize candidate transfers in the Redistribution Planner.</p>
            <div style={{ marginTop: 14 }}>
              <Link href="/redistribution" className="btn btn-primary">
                Go to Redistribution Planner <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* ─── Collapsible: How the algorithm works ────────────────────────── */}
        <details className="card" style={{ marginTop: 24, border: '1px solid var(--border-color)' }}>
          <summary style={{ padding: '14px 18px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
            <CheckCircle size={16} color="var(--color-primary)" />
            <span>How the algorithm works: Exactly-Once State Transition & Feasibility Invariant</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 400 }}>Click to expand operational proof</span>
          </summary>
          <div className="card-body" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-success)', marginBottom: 6 }}>
                  Exactly-Once Handover Invariant
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  When completing a simulated transfer, inventory units at the source bank are atomically marked transferred, and counterpart units are stocked at the destination bank. Duplicate completions are strictly rejected via transfer status guards (<code>status !== 'in_transit' && status !== 'delayed'</code>).
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-warning)', marginBottom: 6 }}>
                  Continuous Usable Time Recalculation
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Injecting en-route delay recalculates <code>usableTimeAfterTransfer = remainingTime - transportDuration - receivingProcessingDuration - delay</code>. If usable time drops below zero, delivery completion is locked out to prevent clinical hazard.
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </>
  );
}

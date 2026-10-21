'use client';

import { useStore } from '@/lib/store';
import { Route, Play, Check, X, RefreshCw, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { calculateFeasibility, rankResults } from '@/lib/feasibility-engine';

function formatMin(m: number): string {
  if (m <= 0) return '0m';
  const h = Math.floor(m / 60);
  const mins = Math.round(m % 60);
  return h > 0 ? `${h}h ${mins}m` : `${mins}m`;
}

export default function RedistributionPage() {
  const bloodBanks = useStore((s) => s.bloodBanks);
  const inventory = useStore((s) => s.inventory);
  const requests = useStore((s) => s.requests);
  const getNow = useStore((s) => s.getNow);
  const createTransfer = useStore((s) => s.createTransfer);
  const approveTransfer = useStore((s) => s.approveTransfer);
  const rejectTransfer = useStore((s) => s.rejectTransfer);
  const transfers = useStore((s) => s.transfers);
  const setFeasibilityResults = useStore((s) => s.setFeasibilityResults);
  const lastFeasibilityResults = useStore((s) => s.lastFeasibilityResults);

  const [sourceBankId, setSourceBankId] = useState('');
  const [destBankId, setDestBankId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [transportDuration, setTransportDuration] = useState(120);
  const [processingDuration, setProcessingDuration] = useState(60);
  const [safetyMargin, setSafetyMargin] = useState(60);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  const now = getNow();

  const sourceBank = bloodBanks.find((b) => b.id === sourceBankId);
  const destBank = bloodBanks.find((b) => b.id === destBankId);
  const selectedRequest = requests.find((r) => r.id === requestId);
  const pendingRequests = requests.filter((r) => r.status === 'pending' || r.status === 'processing');

  const sourceUnits = useMemo(() => {
    return inventory.filter((u) => u.bloodBankId === sourceBankId && u.status === 'available' && u.transportEligible);
  }, [inventory, sourceBankId]);

  const handleRunAnalysis = () => {
    if (!destBankId || selectedUnits.length === 0) return;
    const units = inventory.filter((u) => selectedUnits.includes(u.id));
    const destination = bloodBanks.find((b) => b.id === destBankId);
    if (!destination) return;

    const results = calculateFeasibility({
      sourceUnits: units, destinationBank: destination,
      request: selectedRequest || null,
      transportDuration, receivingProcessingDuration: processingDuration,
      safetyMargin, now, allInventory: inventory,
    });

    setFeasibilityResults(rankResults(results));
  };

  const handleCompareDestinations = () => {
    if (selectedUnits.length === 0) return;
    const units = inventory.filter((u) => selectedUnits.includes(u.id));
    const allResults = bloodBanks
      .filter((b) => b.id !== sourceBankId)
      .flatMap((dest) =>
        calculateFeasibility({
          sourceUnits: units, destinationBank: dest,
          request: selectedRequest || null,
          transportDuration, receivingProcessingDuration: processingDuration,
          safetyMargin, now, allInventory: inventory,
        })
      );
    setFeasibilityResults(rankResults(allResults));
    setCompareMode(true);
  };

  const handleApprove = (result: typeof lastFeasibilityResults[0]) => {
    const unit = inventory.find((u) => u.id === result.unitId);
    if (!unit) return;
    const dest = bloodBanks.find((b) => b.id === result.destinationBankId);
    if (!dest) return;

    const transferId = createTransfer({
      sourceUnitIds: [result.unitId], sourceBankId: unit.bloodBankId,
      destinationBankId: result.destinationBankId, requestId: requestId || null,
      status: 'proposed', transportDuration: result.transportDuration,
      receivingProcessingDuration: result.receivingProcessingDuration,
      safetyMargin: result.safetyMargin, estimatedArrival: result.estimatedArrival,
      estimatedReadiness: result.estimatedReadiness,
      usableTimeAfterTransfer: result.usableTimeAfterTransfer,
      quantity: unit.quantity, approvedAt: null, dispatchedAt: null,
      arrivedAt: null, receivedAt: null, rejectionReason: null,
    });
    approveTransfer(transferId);
  };

  const toggleUnit = (id: string) => {
    setSelectedUnits((prev) => prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]);
  };

  return (
    <>
      <div className="page-header">
        <h1>Time-Aware Redistribution Planner</h1>
        <p>Evaluate feasibility of blood redistribution considering expiry, transport time, processing, and safety margins</p>
      </div>
      <div className="page-content">
        {/* Configuration */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h2>Transfer Configuration</h2></div>
          <div className="card-body">
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Source Blood Bank</label>
                <select className="form-select" value={sourceBankId} onChange={(e) => { setSourceBankId(e.target.value); setSelectedUnits([]); }}>
                  <option value="">Select source...</option>
                  {bloodBanks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Destination Blood Bank</label>
                <select className="form-select" value={destBankId} onChange={(e) => setDestBankId(e.target.value)}>
                  <option value="">Select destination...</option>
                  {bloodBanks.filter((b) => b.id !== sourceBankId).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Link to Request (optional)</label>
                <select className="form-select" value={requestId} onChange={(e) => setRequestId(e.target.value)}>
                  <option value="">No linked request</option>
                  {pendingRequests.map((r) => <option key={r.id} value={r.id}>{r.id} — {r.bloodType} {r.componentType} ×{r.quantity}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Transport Duration (min)</label>
                <input className="form-input" type="number" value={transportDuration} onChange={(e) => setTransportDuration(parseInt(e.target.value) || 0)} />
              </div>
              <div className="form-group">
                <label className="form-label">Receiving/Processing (min)</label>
                <input className="form-input" type="number" value={processingDuration} onChange={(e) => setProcessingDuration(parseInt(e.target.value) || 0)} />
              </div>
              <div className="form-group">
                <label className="form-label">Safety Margin (min)</label>
                <input className="form-input" type="number" value={safetyMargin} onChange={(e) => setSafetyMargin(parseInt(e.target.value) || 0)} />
              </div>
            </div>
            <div style={{ fontSize: 12, padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 6, marginTop: 8 }}>
              <strong>Formula:</strong> requiredTime = transport ({transportDuration}min) + processing ({processingDuration}min) + safety ({safetyMargin}min) = <strong>{transportDuration + processingDuration + safetyMargin}min</strong> |
              usableTimeAfterTransfer = remainingTime − requiredTime
            </div>
          </div>
        </div>

        {/* Source Inventory Selection */}
        {sourceBankId && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2>Select Inventory Units ({selectedUnits.length} selected)</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUnits(sourceUnits.map((u) => u.id))}>Select All</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUnits([])}>Clear</button>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th></th><th>ID</th><th>Type</th><th>Component</th><th>Qty</th><th>Remaining</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {sourceUnits.map((u) => {
                    const remaining = new Date(u.expiryTimestamp).getTime() - now;
                    return (
                      <tr key={u.id} onClick={() => toggleUnit(u.id)} style={{ cursor: 'pointer' }}>
                        <td><input type="checkbox" checked={selectedUnits.includes(u.id)} onChange={() => toggleUnit(u.id)} /></td>
                        <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{u.id}</td>
                        <td><span className="badge badge-info">{u.bloodType}</span></td>
                        <td style={{ fontSize: 12 }}>{u.componentType}</td>
                        <td>{u.quantity}</td>
                        <td><span className={`badge ${remaining < 12 * 3600000 ? 'badge-critical' : 'badge-normal'}`}>{formatMin(remaining / 60000)}</span></td>
                        <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                      </tr>
                    );
                  })}
                  {sourceUnits.length === 0 && <tr><td colSpan={7}><div className="empty-state"><p>No eligible units at this source</p></div></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={handleRunAnalysis} disabled={!destBankId || selectedUnits.length === 0}>
            <Play size={16} /> Run Analysis
          </button>
          <button className="btn btn-secondary" onClick={handleCompareDestinations} disabled={selectedUnits.length === 0}>
            <ArrowRight size={16} /> Compare All Destinations
          </button>
          <button className="btn btn-secondary" onClick={() => { setFeasibilityResults([]); setCompareMode(false); }}>
            <RefreshCw size={16} /> Reset
          </button>
        </div>

        {/* Results Table */}
        {lastFeasibilityResults.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2>Feasibility Results ({lastFeasibilityResults.length})</h2>
              <span className={`badge ${lastFeasibilityResults.some((r) => r.feasible) ? 'badge-normal' : 'badge-critical'}`}>
                {lastFeasibilityResults.filter((r) => r.feasible).length} feasible
              </span>
            </div>
            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {compareMode && <th>Destination</th>}
                    <th>Unit</th><th>Remaining</th><th>Transport</th><th>Processing</th><th>Safety</th>
                    <th>Required</th><th>Usable After</th><th>Readiness Est.</th><th>Qty</th>
                    <th>Eligibility</th><th>Deadline</th><th>Feasible</th><th>Score</th><th>Reasons</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lastFeasibilityResults.map((r, i) => {
                    const destName = bloodBanks.find((b) => b.id === r.destinationBankId)?.name || r.destinationBankId;
                    return (
                      <tr key={i} style={{ background: r.feasible ? 'var(--status-normal-bg)' : undefined }}>
                        {compareMode && <td style={{ fontSize: 12, fontWeight: 500 }}>{destName}</td>}
                        <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.unitId}</td>
                        <td style={{ fontWeight: 600 }}>{formatMin(r.remainingTime)}</td>
                        <td>{formatMin(r.transportDuration)}</td>
                        <td>{formatMin(r.receivingProcessingDuration)}</td>
                        <td>{formatMin(r.safetyMargin)}</td>
                        <td style={{ fontWeight: 600 }}>{formatMin(r.requiredTime)}</td>
                        <td style={{ fontWeight: 700, color: r.usableTimeAfterTransfer > 0 ? 'var(--status-normal)' : 'var(--status-critical)' }}>
                          {formatMin(r.usableTimeAfterTransfer)}
                        </td>
                        <td style={{ fontSize: 11 }}>{new Date(r.estimatedReadiness).toLocaleTimeString()}</td>
                        <td>{r.quantityAvailable}/{r.quantityRequested}</td>
                        <td><span className={`badge ${r.eligibilityPassed ? 'badge-normal' : 'badge-critical'}`}>{r.eligibilityPassed ? 'Pass' : 'Fail'}</span></td>
                        <td><span className={`badge ${r.deadlineMet ? 'badge-normal' : 'badge-critical'}`}>{r.deadlineMet ? 'Met' : 'Missed'}</span></td>
                        <td><span className={`badge ${r.feasible ? 'badge-normal' : 'badge-critical'}`}>{r.feasible ? '✓ Feasible' : '✗ Not Feasible'}</span></td>
                        <td style={{ fontWeight: 600 }}>{r.score.toFixed(2)}</td>
                        <td style={{ fontSize: 11, maxWidth: 200 }}>
                          {r.reasons.map((reason, j) => <div key={j}>{reason}</div>)}
                          {r.scoreFactors.length > 0 && (
                            <details style={{ marginTop: 4 }}>
                              <summary style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>Score factors</summary>
                              {r.scoreFactors.map((f, k) => (
                                <div key={k} style={{ fontSize: 10 }}>{f.factor}: {f.value.toFixed(1)} × {f.weight}%</div>
                              ))}
                            </details>
                          )}
                        </td>
                        <td>
                          {r.feasible && (
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(r)}>
                              <Check size={12} /> Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Transfers */}
        {transfers.length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><h2>Recent Transfer Proposals</h2></div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead><tr><th>ID</th><th>Source</th><th>Destination</th><th>Status</th><th>Usable Time</th><th>Created</th><th>Actions</th></tr></thead>
                <tbody>
                  {transfers.slice(-5).reverse().map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{t.id}</td>
                      <td style={{ fontSize: 12 }}>{bloodBanks.find((b) => b.id === t.sourceBankId)?.name || t.sourceBankId}</td>
                      <td style={{ fontSize: 12 }}>{bloodBanks.find((b) => b.id === t.destinationBankId)?.name || t.destinationBankId}</td>
                      <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                      <td>{formatMin(t.usableTimeAfterTransfer)}</td>
                      <td style={{ fontSize: 11 }}>{new Date(t.createdAt).toLocaleString()}</td>
                      <td>
                        {t.status === 'proposed' && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-success btn-sm" onClick={() => approveTransfer(t.id)}><Check size={12} /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => rejectTransfer(t.id, 'Manual rejection')}><X size={12} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

'use client';

import { useStore } from '@/lib/store';
import {
  Clock, AlertTriangle, Timer, Settings, Route, ArrowRight,
  Search, ShieldAlert, CheckCircle, Info, ChevronRight, Binary
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ExpiryRisk, InventoryUnit } from '@/lib/types';
import { mergeSortBy, binarySearch } from '@/lib/dsa-engine';

function formatTime(ms: number): string {
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

export default function ExpiryMonitoringPage() {
  const inventory = useStore((s) => s.inventory);
  const bloodBanks = useStore((s) => s.bloodBanks);
  const getNow = useStore((s) => s.getNow);
  const expiryThresholds = useStore((s) => s.expiryThresholds);
  const setExpiryThresholds = useStore((s) => s.setExpiryThresholds);
  const demoClockOffset = useStore((s) => s.demoClockOffset);
  const setDemoClockOffset = useStore((s) => s.setDemoClockOffset);
  const [tick, setTick] = useState(0);
  const [showDsaBisector, setShowDsaBisector] = useState(false);

  // Auto-refresh expiry calculations periodically
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const now = getNow();

  // ─── DSA: MergeSort by Expiry Timestamp Ascending ──────────────────────────
  const sortedInventory = useMemo(() => {
    const available = inventory.filter((u) => u.status === 'available' || u.status === 'reserved');
    const keyFn = (u: InventoryUnit) => new Date(u.expiryTimestamp).getTime();
    const tieBreaker = (a: InventoryUnit, b: InventoryUnit) => a.id.localeCompare(b.id);
    return mergeSortBy(available, keyFn, tieBreaker, false).sorted;
  }, [inventory]);

  // ─── DSA: Binary Search to Locate Expiry Threshold Bisector (O(log n)) ─────
  const thresholdBisector = useMemo(() => {
    if (sortedInventory.length === 0) return { criticalIndex: -1, warningIndex: -1, comparisons: 0 };

    const timestamps = sortedInventory.map((u) => new Date(u.expiryTimestamp).getTime());
    const criticalCutoffTime = now + expiryThresholds.criticalHours * 3600000;
    const warningCutoffTime = now + expiryThresholds.warningHours * 3600000;

    // Binary search for first index exceeding critical threshold
    let low = 0, high = timestamps.length - 1, critIdx = timestamps.length, comparisons = 0;
    while (low <= high) {
      comparisons++;
      const mid = Math.floor((low + high) / 2);
      if (timestamps[mid] > criticalCutoffTime) {
        critIdx = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    // Binary search for first index exceeding warning threshold
    low = 0; high = timestamps.length - 1;
    let warnIdx = timestamps.length;
    while (low <= high) {
      comparisons++;
      const mid = Math.floor((low + high) / 2);
      if (timestamps[mid] > warningCutoffTime) {
        warnIdx = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    return {
      criticalIndex: critIdx,
      warningIndex: warnIdx,
      comparisons,
      criticalCutoffTime,
      warningCutoffTime,
    };
  }, [sortedInventory, now, expiryThresholds]);

  // Categorize
  const categorized = useMemo(() => {
    const result: { risk: ExpiryRisk; units: InventoryUnit[]; reason: string }[] = [
      {
        risk: 'expired',
        units: [],
        reason: 'Shelf-life has elapsed (remainingTime <= 0). Units must be quarantined immediately to prevent accidental clinical issue.',
      },
      {
        risk: 'critical',
        units: [],
        reason: `Expires within ${expiryThresholds.criticalHours}h. Immediate redistribution required or units will be wasted.`,
      },
      {
        risk: 'warning',
        units: [],
        reason: `Expires within ${expiryThresholds.warningHours}h. High priority candidate for scheduled hospital transfer.`,
      },
      {
        risk: 'normal',
        units: [],
        reason: 'Adequate shelf-life remaining (>48h). Standard inventory maintenance.',
      },
    ];

    sortedInventory.forEach((u) => {
      const remaining = new Date(u.expiryTimestamp).getTime() - now;
      if (remaining <= 0) result[0].units.push(u);
      else if (remaining < expiryThresholds.criticalHours * 3600000) result[1].units.push(u);
      else if (remaining < expiryThresholds.warningHours * 3600000) result[2].units.push(u);
      else result[3].units.push(u);
    });

    return result;
  }, [sortedInventory, now, expiryThresholds, tick]);

  const getBankName = (id: string) => bloodBanks.find((b) => b.id === id)?.name || id;

  const riskConfig = {
    expired: { label: 'Expired', color: '#DC2626', bg: '#FEF2F2', icon: AlertTriangle },
    critical: { label: 'Critical Risk (<12h)', color: '#D97706', bg: '#FFFBEB', icon: AlertTriangle },
    warning: { label: 'Warning Risk (<48h)', color: '#EA580C', bg: '#FFF7ED', icon: Clock },
    normal: { label: 'Stable (>48h)', color: '#059669', bg: '#ECFDF5', icon: Timer },
  };

  const totalActionable = categorized[1].units.length + categorized[2].units.length;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Expiry Monitoring</h1>
          <p>Monitor inventory ordered by shelf-life urgency and initiate redistribution review for high-risk stock.</p>
        </div>

        {/* Primary Administrative Action */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/redistribution" className="btn btn-primary">
            <Route size={15} /> Launch Redistribution Planner
          </Link>
        </div>
      </div>

      <div className="page-content">
        {/* Summary Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
          {categorized.map(({ risk, units }) => {
            const cfg = riskConfig[risk];
            const Icon = cfg.icon;
            return (
              <div className="stat-card" key={risk}>
                <div className="stat-label">{cfg.label}</div>
                <div className="stat-value" style={{ color: cfg.color }}>{units.length}</div>
                <div className="stat-desc">
                  {risk === 'expired' && 'Requires quarantine'}
                  {risk === 'critical' && `Under ${expiryThresholds.criticalHours}h remaining`}
                  {risk === 'warning' && `Under ${expiryThresholds.warningHours}h remaining`}
                  {risk === 'normal' && 'Safe shelf-life margin'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Collapsible: Simulation Clock & Expiry Threshold Controls */}
        <details className="card" style={{ marginBottom: 20, border: '1px solid var(--border-color)' }}>
          <summary style={{ padding: '12px 16px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
            <Settings size={15} color="var(--color-primary)" />
            <span>Simulation Clock & Expiry Threshold Settings</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 400 }}>Click to configure time-decay</span>
          </summary>
          <div className="card-body" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Simulated Clock Offset (Hours)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input"
                    type="number"
                    value={Math.round(demoClockOffset / 3600000)}
                    onChange={(e) => setDemoClockOffset(parseInt(e.target.value || '0') * 3600000)}
                  />
                  <button className="btn btn-secondary btn-sm" onClick={() => setDemoClockOffset(0)}>Reset (0h)</button>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Fast-forward time to simulate natural shelf-life decay across blood batches
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Warning Threshold (Hours)</label>
                <input
                  className="form-input"
                  type="number"
                  value={expiryThresholds.warningHours}
                  onChange={(e) => setExpiryThresholds({ ...expiryThresholds, warningHours: parseInt(e.target.value) || 48 })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Critical Threshold (Hours)</label>
                <input
                  className="form-input"
                  type="number"
                  value={expiryThresholds.criticalHours}
                  onChange={(e) => setExpiryThresholds({ ...expiryThresholds, criticalHours: parseInt(e.target.value) || 12 })}
                />
              </div>
            </div>
            <div style={{ fontSize: 12, padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 6, marginTop: 10, color: 'var(--text-muted)' }}>
              <strong>Current Simulated System Clock:</strong> {new Date(now).toLocaleString()} (Offset: {Math.round(demoClockOffset / 3600000)}h) • Total Active Batch Records Evaluated: {sortedInventory.length}
            </div>
          </div>
        </details>

        {/* Expiry Tables by Risk */}
        {categorized.map(({ risk, units, reason }) => {
          if (units.length === 0) return null;
          const cfg = riskConfig[risk];
          const isCriticalOrWarning = risk === 'critical' || risk === 'warning';

          return (
            <div className="card" key={risk} style={{ marginBottom: 18, borderLeft: `4px solid ${cfg.color}` }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ color: cfg.color, fontSize: 15 }}>{cfg.label} ({units.length} units)</h2>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{reason}</div>
                </div>
                {isCriticalOrWarning && (
                  <Link
                    href={`/redistribution?sourceBankId=${units[0]?.bloodBankId || ''}&unitId=${units[0]?.id || ''}`}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11 }}
                  >
                    <Route size={12} /> Plan Redistribution
                  </Link>
                )}
              </div>
              <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Unit ID</th>
                      <th>Holding Facility</th>
                      <th>Blood Group</th>
                      <th>Component</th>
                      <th>Qty</th>
                      <th>Storage</th>
                      <th>Remaining Usable Time</th>
                      <th>Expiry Timestamp</th>
                      <th>Operational Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((u) => {
                      const remaining = new Date(u.expiryTimestamp).getTime() - now;
                      const isExpired = remaining <= 0;
                      return (
                        <tr key={u.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{u.id}</td>
                          <td style={{ fontSize: 12 }}>{getBankName(u.bloodBankId)}</td>
                          <td><span className="badge badge-info">{u.bloodType}</span></td>
                          <td style={{ fontSize: 12 }}>{u.componentType}</td>
                          <td style={{ fontWeight: 600 }}>{u.quantity}</td>
                          <td style={{ fontSize: 11, color: '#94a3b8' }}>{u.storageTemp}</td>
                          <td style={{ fontWeight: 700, color: cfg.color }}>
                            {formatTime(remaining)}
                          </td>
                          <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {new Date(u.expiryTimestamp).toLocaleString()}
                          </td>
                          <td>
                            {isExpired ? (
                              <span style={{ fontSize: 11, color: 'var(--status-critical)', fontWeight: 600 }}>
                                Quarantine for disposal
                              </span>
                            ) : (
                              <Link
                                href={`/redistribution?sourceBankId=${u.bloodBankId}&unitId=${u.id}`}
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 11 }}
                              >
                                Redistribute <ArrowRight size={11} />
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {categorized.every((c) => c.units.length === 0) && (
          <div className="empty-state">
            <Clock size={48} />
            <h3>No Inventory Units Logged</h3>
            <p>Load the demo scenario from Admin Overview to monitor shelf-life.</p>
          </div>
        )}

        {/* ─── Collapsible: How the algorithm works ────────────────────────── */}
        <details className="card" style={{ marginTop: 24, border: '1px solid var(--border-color)' }}>
          <summary style={{ padding: '14px 18px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
            <Binary size={16} color="var(--color-primary)" />
            <span>How the algorithm works: Priority Sorting & Binary Search Bisector</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 400 }}>Click to expand operational proof</span>
          </summary>
          <div className="card-body" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
              Inventory units are ordered ascending by expiry timestamp via deterministic <strong>MergeSort (O(n log n))</strong>. Rather than scanning each record linearly, <strong>Binary Search (O(log n))</strong> locates the exact cutoff boundaries in <strong>{thresholdBisector.comparisons} comparisons</strong>.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div style={{ background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.2)', padding: '12px 14px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 700 }}>CRITICAL BISECTOR INDEX</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Index #{thresholdBisector.criticalIndex}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Units before this boundary have &lt; {expiryThresholds.criticalHours}h remaining shelf-life.
                </div>
              </div>
              <div style={{ background: 'rgba(234, 88, 12, 0.08)', border: '1px solid rgba(234, 88, 12, 0.2)', padding: '12px 14px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--color-warning)', fontWeight: 700 }}>WARNING BISECTOR INDEX</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Index #{thresholdBisector.warningIndex}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Units before this boundary have &lt; {expiryThresholds.warningHours}h remaining shelf-life.
                </div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--color-info)', fontWeight: 700 }}>SEARCH COMPLEXITY</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>O(log n)</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Total {thresholdBisector.comparisons} probe comparisons executed against {sortedInventory.length} sorted batches.
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </>
  );
}

'use client';

import { useStore } from '@/lib/store';
import { Clock, AlertTriangle, Timer, Settings } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { ExpiryRisk } from '@/lib/types';

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

  // Re-render every 30 seconds to update expiry times
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const now = getNow();

  const categorized = useMemo(() => {
    const available = inventory.filter((u) => u.status === 'available' || u.status === 'reserved');
    const result: { risk: ExpiryRisk; units: typeof available }[] = [
      { risk: 'expired', units: [] },
      { risk: 'critical', units: [] },
      { risk: 'warning', units: [] },
      { risk: 'normal', units: [] },
    ];

    available.forEach((u) => {
      const remaining = new Date(u.expiryTimestamp).getTime() - now;
      if (remaining <= 0) result[0].units.push(u);
      else if (remaining < expiryThresholds.criticalHours * 3600000) result[1].units.push(u);
      else if (remaining < expiryThresholds.warningHours * 3600000) result[2].units.push(u);
      else result[3].units.push(u);
    });

    // Sort each category by expiry ascending
    result.forEach((r) => r.units.sort((a, b) =>
      new Date(a.expiryTimestamp).getTime() - new Date(b.expiryTimestamp).getTime()
    ));

    return result;
  }, [inventory, now, expiryThresholds, tick]);

  const getBankName = (id: string) => bloodBanks.find((b) => b.id === id)?.name || id;

  const riskConfig = {
    expired: { label: 'Expired', color: '#DC2626', bg: '#FEF2F2', icon: AlertTriangle },
    critical: { label: 'Critical', color: '#D97706', bg: '#FFFBEB', icon: AlertTriangle },
    warning: { label: 'Warning', color: '#EA580C', bg: '#FFF7ED', icon: Clock },
    normal: { label: 'Normal', color: '#059669', bg: '#ECFDF5', icon: Timer },
  };

  return (
    <>
      <div className="page-header">
        <h1>Expiry Monitoring</h1>
        <p>Track blood unit expiry calculated from timestamps — remainingTime = expiryTimestamp − currentTime</p>
      </div>
      <div className="page-content">
        {/* Demo Clock & Threshold Controls */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2><Settings size={16} style={{ display: 'inline', marginRight: 8 }} />Demo Clock & Thresholds</h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              These are illustrative demonstration settings, not universal medical standards
            </span>
          </div>
          <div className="card-body">
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Demo Clock Offset (hours)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" type="number" value={Math.round(demoClockOffset / 3600000)}
                    onChange={(e) => setDemoClockOffset(parseInt(e.target.value || '0') * 3600000)} />
                  <button className="btn btn-secondary btn-sm" onClick={() => setDemoClockOffset(0)}>Reset</button>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Advance simulated time to demonstrate expiry changes
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Warning Threshold (hours)</label>
                <input className="form-input" type="number" value={expiryThresholds.warningHours}
                  onChange={(e) => setExpiryThresholds({ ...expiryThresholds, warningHours: parseInt(e.target.value) || 48 })} />
              </div>
              <div className="form-group">
                <label className="form-label">Critical Threshold (hours)</label>
                <input className="form-input" type="number" value={expiryThresholds.criticalHours}
                  onChange={(e) => setExpiryThresholds({ ...expiryThresholds, criticalHours: parseInt(e.target.value) || 12 })} />
              </div>
            </div>
            <div style={{ fontSize: 12, padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 6, marginTop: 8 }}>
              <strong>Current simulated time:</strong> {new Date(now).toLocaleString()} | 
              <strong> Offset:</strong> {Math.round(demoClockOffset / 3600000)}h
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {categorized.map(({ risk, units }) => {
            const cfg = riskConfig[risk];
            const Icon = cfg.icon;
            return (
              <div className="stat-card" key={risk}>
                <div className="stat-card-icon" style={{ background: cfg.bg, color: cfg.color }}>
                  <Icon size={20} />
                </div>
                <div className="stat-card-value" style={{ color: cfg.color }}>{units.length}</div>
                <div className="stat-card-label">{cfg.label} Units</div>
              </div>
            );
          })}
        </div>

        {/* Expiry Tables by Risk */}
        {categorized.map(({ risk, units }) => {
          if (units.length === 0) return null;
          const cfg = riskConfig[risk];
          return (
            <div className="card" key={risk} style={{ marginBottom: 16 }}>
              <div className="card-header">
                <h2 style={{ color: cfg.color }}>{cfg.label} ({units.length})</h2>
                <span className={`badge badge-${risk}`}>{cfg.label}</span>
              </div>
              <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>ID</th><th>Bank</th><th>Type</th><th>Component</th><th>Qty</th><th>Status</th><th>Remaining</th><th>Expiry</th></tr>
                  </thead>
                  <tbody>
                    {units.map((u) => {
                      const remaining = new Date(u.expiryTimestamp).getTime() - now;
                      return (
                        <tr key={u.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{u.id}</td>
                          <td style={{ fontSize: 12 }}>{getBankName(u.bloodBankId)}</td>
                          <td><span className="badge badge-info">{u.bloodType}</span></td>
                          <td style={{ fontSize: 12 }}>{u.componentType}</td>
                          <td>{u.quantity}</td>
                          <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                          <td style={{ fontWeight: 700, color: cfg.color }}>{formatTime(remaining)}</td>
                          <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(u.expiryTimestamp).toLocaleString()}</td>
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
            <h3>No Inventory Units</h3>
            <p>Load the demo scenario to see expiry monitoring in action.</p>
          </div>
        )}
      </div>
    </>
  );
}

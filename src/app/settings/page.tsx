'use client';

import { useStore } from '@/lib/store';
import { Settings, Play, RotateCcw, Clock, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const loadDemoScenario = useStore((s) => s.loadDemoScenario);
  const resetDemo = useStore((s) => s.resetDemo);
  const demoClockOffset = useStore((s) => s.demoClockOffset);
  const setDemoClockOffset = useStore((s) => s.setDemoClockOffset);
  const expiryThresholds = useStore((s) => s.expiryThresholds);
  const setExpiryThresholds = useStore((s) => s.setExpiryThresholds);
  const getNow = useStore((s) => s.getNow);
  const inventory = useStore((s) => s.inventory);
  const requests = useStore((s) => s.requests);
  const transfers = useStore((s) => s.transfers);
  const alerts = useStore((s) => s.alerts);
  const missions = useStore((s) => s.missions);
  const auditTrail = useStore((s) => s.auditTrail);

  const now = getNow();

  return (
    <>
      <div className="page-header"><h1>Settings & Demo Controls</h1><p>Application configuration and demonstration controls</p></div>
      <div className="page-content">
        {/* Demo Controls */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h2>Demo Scenario</h2></div>
          <div className="card-body">
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Load the demo scenario to populate the application with sample blood banks, inventory with various expiry times, requests, and alerts. The demo includes the editable example described in the assessment specification.
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <button className="btn btn-primary" onClick={loadDemoScenario}>
                <Play size={16} /> Load Demo Scenario
              </button>
              <button className="btn btn-secondary" onClick={resetDemo}>
                <RotateCcw size={16} /> Reset Demo Data
              </button>
            </div>
            <div style={{ fontSize: 12, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
              <strong>Demo scenario includes:</strong>
              <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                <li>5 simulated blood banks (Ramanathapuram, Paramakudi, Rameswaram, Kamuthi, Madurai)</li>
                <li>40+ inventory units with varying expiry timestamps</li>
                <li>Source unit with <strong>10 hours remaining</strong> before expiry (for redistribution demo)</li>
                <li>Destination B: estimated 6h transport + processing (feasible)</li>
                <li>Destination C: estimated 15h transport + processing (not feasible with 10h remaining)</li>
                <li>Configurable safety margin applied dynamically</li>
                <li>5 pending requests of different priorities</li>
                <li>4 active alerts</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Demo Clock */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h2><Clock size={16} style={{ display: 'inline', marginRight: 8 }} />Demo Clock Control</h2></div>
          <div className="card-body">
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Advance the simulated clock to demonstrate how expiry-risk categories change over time. This affects all time-dependent calculations throughout the application.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Clock Offset (hours)</label>
                <input className="form-input" type="number" value={Math.round(demoClockOffset / 3600000)} onChange={(e) => setDemoClockOffset(parseInt(e.target.value || '0') * 3600000)} style={{ width: 120 }} />
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setDemoClockOffset(demoClockOffset + 3600000)}>+1h</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setDemoClockOffset(demoClockOffset + 6 * 3600000)}>+6h</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setDemoClockOffset(demoClockOffset + 12 * 3600000)}>+12h</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setDemoClockOffset(demoClockOffset + 24 * 3600000)}>+24h</button>
              <button className="btn btn-danger btn-sm" onClick={() => setDemoClockOffset(0)}><RotateCcw size={14} /> Reset Clock</button>
            </div>
            <div style={{ marginTop: 12, padding: 8, background: 'var(--status-info-bg)', borderRadius: 6, fontSize: 13 }}>
              <strong>Current simulated time:</strong> {new Date(now).toLocaleString()} (offset: {Math.round(demoClockOffset / 3600000)} hours)
            </div>
          </div>
        </div>

        {/* Expiry Thresholds */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h2>Expiry Thresholds</h2><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Illustrative settings — not universal medical standards</span></div>
          <div className="card-body">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Warning Threshold (hours)</label>
                <input className="form-input" type="number" value={expiryThresholds.warningHours} onChange={(e) => setExpiryThresholds({ ...expiryThresholds, warningHours: parseInt(e.target.value) || 48 })} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Units with less than this remaining time are flagged as warning</span>
              </div>
              <div className="form-group">
                <label className="form-label">Critical Threshold (hours)</label>
                <input className="form-input" type="number" value={expiryThresholds.criticalHours} onChange={(e) => setExpiryThresholds({ ...expiryThresholds, criticalHours: parseInt(e.target.value) || 12 })} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Units with less than this remaining time are flagged as critical</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Summary */}
        <div className="card">
          <div className="card-header"><h2>Current Data Summary</h2></div>
          <div className="card-body">
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[
                { label: 'Inventory Units', value: inventory.length },
                { label: 'Requests', value: requests.length },
                { label: 'Transfers', value: transfers.length },
                { label: 'Alerts', value: alerts.length },
                { label: 'Drone Missions', value: missions.length },
                { label: 'Audit Events', value: auditTrail.length },
              ].map(({ label, value }) => (
                <div key={label} className="stat-card">
                  <div className="stat-card-value">{value}</div>
                  <div className="stat-card-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

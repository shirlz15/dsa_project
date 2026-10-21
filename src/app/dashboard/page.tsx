'use client';

import { useStore } from '@/lib/store';
import {
  Droplets, Package, Clock, AlertTriangle, FileText, Route, Plane,
  ArrowRightLeft, Activity, TrendingUp, RefreshCw, Play
} from 'lucide-react';
import { useMemo } from 'react';

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours > 48) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${mins}m`;
}

export default function DashboardPage() {
  const bloodBanks = useStore((s) => s.bloodBanks);
  const inventory = useStore((s) => s.inventory);
  const requests = useStore((s) => s.requests);
  const transfers = useStore((s) => s.transfers);
  const alerts = useStore((s) => s.alerts);
  const missions = useStore((s) => s.missions);
  const auditTrail = useStore((s) => s.auditTrail);
  const demoLoaded = useStore((s) => s.demoLoaded);
  const loadDemoScenario = useStore((s) => s.loadDemoScenario);
  const getNow = useStore((s) => s.getNow);
  const expiryThresholds = useStore((s) => s.expiryThresholds);

  const now = getNow();

  const metrics = useMemo(() => {
    const available = inventory.filter((u) => u.status === 'available');
    const totalUnits = available.reduce((s, u) => s + u.quantity, 0);
    const expiringCount = inventory.filter((u) => {
      const remaining = new Date(u.expiryTimestamp).getTime() - now;
      return u.status === 'available' && remaining > 0 && remaining < expiryThresholds.warningHours * 3600000;
    }).length;
    const expiredCount = inventory.filter((u) => u.status === 'expired' || new Date(u.expiryTimestamp).getTime() < now).length;
    const pendingRequests = requests.filter((r) => r.status === 'pending' || r.status === 'processing').length;
    const activeTransfers = transfers.filter((t) => ['proposed', 'approved', 'dispatched', 'in_transit'].includes(t.status)).length;
    const activeMissions = missions.filter((m) => ['flying', 'approved', 'planned'].includes(m.status)).length;
    const unreadAlerts = alerts.filter((a) => !a.read && !a.resolved).length;

    // Blood type distribution
    const typeDistribution: Record<string, number> = {};
    available.forEach((u) => {
      typeDistribution[u.bloodType] = (typeDistribution[u.bloodType] || 0) + u.quantity;
    });

    // Bank-level stock
    const bankStock = bloodBanks.map((b) => ({
      name: b.name.replace(' Blood Bank', '').replace(' Blood Centre', ''),
      units: inventory.filter((u) => u.bloodBankId === b.id && u.status === 'available')
        .reduce((s, u) => s + u.quantity, 0),
    }));

    return {
      totalBanks: bloodBanks.length,
      totalUnits,
      expiringCount,
      expiredCount,
      pendingRequests,
      activeTransfers,
      activeMissions,
      unreadAlerts,
      typeDistribution,
      bankStock,
    };
  }, [bloodBanks, inventory, requests, transfers, alerts, missions, now, expiryThresholds]);

  // Recent activities from audit trail
  const recentActivities = auditTrail.slice(-8).reverse();

  // Expiring soon units
  const expiringSoon = useMemo(() => {
    return inventory
      .filter((u) => {
        const remaining = new Date(u.expiryTimestamp).getTime() - now;
        return u.status === 'available' && remaining > 0 && remaining < expiryThresholds.warningHours * 3600000;
      })
      .sort((a, b) => new Date(a.expiryTimestamp).getTime() - new Date(b.expiryTimestamp).getTime())
      .slice(0, 6);
  }, [inventory, now, expiryThresholds]);

  if (!demoLoaded) {
    return (
      <div className="page-content" style={{ textAlign: 'center', paddingTop: 80 }}>
        <Droplets size={48} style={{ color: 'var(--accent-primary)', margin: '0 auto 16px' }} />
        <h2 style={{ marginBottom: 8 }}>Welcome to Blood Navigator</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Load the demo scenario to begin exploring the application.
        </p>
        <button className="btn btn-primary" onClick={loadDemoScenario}>
          <Play size={16} /> Load Demo Scenario
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Overview Dashboard</h1>
        <p>Real-time metrics from the Blood Navigator simulation</p>
      </div>

      <div className="page-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          {[
            { icon: Droplets, label: 'Blood Banks', value: metrics.totalBanks, color: '#8B1A2B', bg: '#FDF2F4' },
            { icon: Package, label: 'Available Units', value: metrics.totalUnits, color: '#059669', bg: '#ECFDF5' },
            { icon: Clock, label: 'Approaching Expiry', value: metrics.expiringCount, color: '#D97706', bg: '#FFFBEB' },
            { icon: AlertTriangle, label: 'Expired Units', value: metrics.expiredCount, color: '#DC2626', bg: '#FEF2F2' },
            { icon: FileText, label: 'Pending Requests', value: metrics.pendingRequests, color: '#2563EB', bg: '#EFF6FF' },
            { icon: Route, label: 'Active Transfers', value: metrics.activeTransfers, color: '#7C3AED', bg: '#F5F3FF' },
            { icon: Plane, label: 'Active Missions', value: metrics.activeMissions, color: '#0891B2', bg: '#ECFEFF' },
            { icon: Activity, label: 'Unread Alerts', value: metrics.unreadAlerts, color: '#EA580C', bg: '#FFF7ED' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div className="stat-card" key={label}>
              <div className="stat-card-icon" style={{ background: bg, color }}>
                <Icon size={20} />
              </div>
              <div className="stat-card-value">{value}</div>
              <div className="stat-card-label">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2">
          {/* Inventory Distribution by Blood Type */}
          <div className="card">
            <div className="card-header">
              <h2>Inventory by Blood Type</h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(metrics.typeDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const maxVal = Math.max(...Object.values(metrics.typeDistribution), 1);
                    return (
                      <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ width: 36, fontWeight: 700, fontSize: 13, color: 'var(--accent-primary)' }}>{type}</span>
                        <div style={{ flex: 1, height: 24, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{
                            width: `${(count / maxVal) * 100}%`, height: '100%',
                            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                            borderRadius: 4, transition: 'width 0.5s ease',
                          }} />
                        </div>
                        <span style={{ width: 40, textAlign: 'right', fontWeight: 600, fontSize: 13 }}>{count}</span>
                      </div>
                    );
                  })}
                {Object.keys(metrics.typeDistribution).length === 0 && (
                  <div className="empty-state"><p>No available inventory</p></div>
                )}
              </div>
            </div>
          </div>

          {/* Bank-Level Stock Comparison */}
          <div className="card">
            <div className="card-header">
              <h2>Stock by Blood Bank</h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {metrics.bankStock.map((bank) => {
                  const maxVal = Math.max(...metrics.bankStock.map((b) => b.units), 1);
                  return (
                    <div key={bank.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 130, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {bank.name}
                      </span>
                      <div style={{ flex: 1, height: 24, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          width: `${(bank.units / maxVal) * 100}%`, height: '100%',
                          background: 'linear-gradient(90deg, #1B2A4A, #2D4170)',
                          borderRadius: 4, transition: 'width 0.5s ease',
                        }} />
                      </div>
                      <span style={{ width: 40, textAlign: 'right', fontWeight: 600, fontSize: 13 }}>{bank.units}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 20 }}>
          {/* Expiry Risk */}
          <div className="card">
            <div className="card-header">
              <h2>Expiry Risk — Approaching Units</h2>
              <span className="badge badge-warning">{expiringSoon.length} units</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {expiringSoon.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Unit ID</th>
                      <th>Type</th>
                      <th>Component</th>
                      <th>Remaining</th>
                      <th>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringSoon.map((u) => {
                      const remaining = new Date(u.expiryTimestamp).getTime() - now;
                      const isCritical = remaining < expiryThresholds.criticalHours * 3600000;
                      return (
                        <tr key={u.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{u.id}</td>
                          <td><span className="badge badge-info">{u.bloodType}</span></td>
                          <td style={{ fontSize: 12 }}>{u.componentType}</td>
                          <td>
                            <span className={`badge ${isCritical ? 'badge-critical' : 'badge-warning'}`}>
                              {formatTimeRemaining(remaining)}
                            </span>
                          </td>
                          <td>{u.quantity}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <Clock size={32} />
                  <p>No units approaching expiry within the warning threshold</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="card">
            <div className="card-header">
              <h2>Recent Activity</h2>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {recentActivities.length > 0 ? (
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {recentActivities.map((event) => (
                    <div key={event.id} style={{
                      padding: '10px 20px', borderBottom: '1px solid var(--border-light)',
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                        background: event.action === 'created' ? 'var(--status-normal)' :
                          event.action === 'approved' ? 'var(--status-info)' :
                          event.action === 'rejected' ? 'var(--status-critical)' : 'var(--status-warning)',
                      }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{event.description}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Activity size={32} />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h2>Active Alerts</h2>
            <span className="badge badge-critical">{alerts.filter((a) => !a.resolved).length} active</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {alerts.filter((a) => !a.resolved).slice(0, 5).length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Type</th>
                    <th>Message</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.filter((a) => !a.resolved).slice(0, 5).map((alert) => (
                    <tr key={alert.id}>
                      <td><span className={`badge badge-${alert.severity}`}>{alert.severity}</span></td>
                      <td style={{ fontSize: 12 }}>{alert.type.replace(/_/g, ' ')}</td>
                      <td style={{ fontSize: 12 }}>{alert.message}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(alert.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state"><p>No active alerts</p></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

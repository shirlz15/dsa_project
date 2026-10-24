'use client';

import { useStore } from '@/lib/store';
import {
  Bell, Check, Eye, Filter, Route, ArrowRight, ShieldAlert,
  AlertTriangle, Clock, Droplets, Package, RefreshCw, Info,
  ExternalLink, CheckCircle, XCircle, Search, Sparkles
} from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Alert, AlertSeverity, AlertType } from '@/lib/types';
import { formatMinutes } from '@/lib/recommendation-engine';

type CategoryFilter = 'all' | 'critical_expiry' | 'upcoming_expiry' | 'infeasible_transfers' | 'delayed_transfers' | 'unresolved_requests';

export default function AlertsPage() {
  const alerts = useStore((s) => s.alerts);
  const markAlertRead = useStore((s) => s.markAlertRead);
  const resolveAlert = useStore((s) => s.resolveAlert);
  const markAllAlertsRead = useStore((s) => s.markAllAlertsRead);
  const syncExpiryAlerts = useStore((s) => s.syncExpiryAlerts);
  const expiryThresholds = useStore((s) => s.expiryThresholds);
  const getNow = useStore((s) => s.getNow);

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('unresolved');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ─── Filter Logic ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = [...alerts];

    // Category filter tab
    if (categoryFilter === 'critical_expiry') {
      items = items.filter(
        (a) => (a.type === 'expiring_soon' && a.severity === 'critical') || a.type === 'expired'
      );
    } else if (categoryFilter === 'upcoming_expiry') {
      items = items.filter(
        (a) => a.type === 'expiring_soon' && a.severity === 'warning'
      );
    } else if (categoryFilter === 'infeasible_transfers') {
      items = items.filter((a) => a.type === 'feasibility_failed');
    } else if (categoryFilter === 'delayed_transfers') {
      items = items.filter((a) => a.type === 'transport_delay');
    } else if (categoryFilter === 'unresolved_requests') {
      items = items.filter((a) => a.type === 'pending_request');
    }

    // Severity filter
    if (filterSeverity) {
      items = items.filter((a) => a.severity === filterSeverity);
    }

    // Status filter
    if (filterStatus === 'unread') {
      items = items.filter((a) => !a.read);
    } else if (filterStatus === 'unresolved') {
      items = items.filter((a) => !a.resolved);
    } else if (filterStatus === 'resolved') {
      items = items.filter((a) => a.resolved);
    }

    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (a) =>
          a.message.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.metadata?.bloodBankName.toLowerCase().includes(q) ||
          a.metadata?.unitId.toLowerCase().includes(q) ||
          a.metadata?.bloodType.toLowerCase().includes(q)
      );
    }

    // Sort: Unread and critical first, then newest
    return items.sort((a, b) => {
      if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
      if (a.read !== b.read) return a.read ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [alerts, categoryFilter, filterSeverity, filterStatus, searchQuery]);

  // Counts for summary metrics
  const criticalExpiryCount = alerts.filter(
    (a) => !a.resolved && ((a.type === 'expiring_soon' && a.severity === 'critical') || a.type === 'expired')
  ).length;

  const upcomingExpiryCount = alerts.filter(
    (a) => !a.resolved && a.type === 'expiring_soon' && a.severity === 'warning'
  ).length;

  const infeasibleTransfersCount = alerts.filter(
    (a) => !a.resolved && a.type === 'feasibility_failed'
  ).length;

  const delayedTransfersCount = alerts.filter(
    (a) => !a.resolved && a.type === 'transport_delay'
  ).length;

  const unresolvedRequestsCount = alerts.filter(
    (a) => !a.resolved && a.type === 'pending_request'
  ).length;

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(220, 38, 38, 0.12)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', color: '#f87171', fontWeight: 700, marginBottom: '6px' }}>
            PROACTIVE SURVEILLANCE &amp; REDISTRIBUTION ADVISORY
          </div>
          <h1>Alerts &amp; Reports</h1>
          <p>
            Proactively monitor inventory approaching expiry, evaluate mathematical corridor feasibility, and review ranked redistribution recommendations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => syncExpiryAlerts()}
            title="Recalculate and re-evaluate recommendations against current inventory"
          >
            <RefreshCw size={13} />
            <span>Recalculate Recommendations</span>
          </button>
          {unreadCount > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => markAllAlertsRead()}
            >
              <Check size={13} />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Metric Cards */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 20 }}>
          <div
            className="stat-card"
            style={{ cursor: 'pointer', border: categoryFilter === 'critical_expiry' ? '1px solid #dc2626' : undefined }}
            onClick={() => setCategoryFilter('critical_expiry')}
          >
            <div className="stat-card-value" style={{ color: '#ef4444' }}>{criticalExpiryCount}</div>
            <div className="stat-card-label">Critical Expiry</div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', border: categoryFilter === 'upcoming_expiry' ? '1px solid #f59e0b' : undefined }}
            onClick={() => setCategoryFilter('upcoming_expiry')}
          >
            <div className="stat-card-value" style={{ color: '#f59e0b' }}>{upcomingExpiryCount}</div>
            <div className="stat-card-label">Upcoming (&lt;{expiryThresholds.warningHours}h)</div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', border: categoryFilter === 'infeasible_transfers' ? '1px solid #ef4444' : undefined }}
            onClick={() => setCategoryFilter('infeasible_transfers')}
          >
            <div className="stat-card-value" style={{ color: '#ef4444' }}>{infeasibleTransfersCount}</div>
            <div className="stat-card-label">Infeasible Transfers</div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', border: categoryFilter === 'delayed_transfers' ? '1px solid #f59e0b' : undefined }}
            onClick={() => setCategoryFilter('delayed_transfers')}
          >
            <div className="stat-card-value" style={{ color: '#f59e0b' }}>{delayedTransfersCount}</div>
            <div className="stat-card-label">Delayed Transfers</div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', border: categoryFilter === 'unresolved_requests' ? '1px solid #38bdf8' : undefined }}
            onClick={() => setCategoryFilter('unresolved_requests')}
          >
            <div className="stat-card-value" style={{ color: '#38bdf8' }}>{unresolvedRequestsCount}</div>
            <div className="stat-card-label">Pending Requests</div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="card" style={{ padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            {/* Category Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All Alerts (${alerts.length})` },
                { id: 'critical_expiry', label: `Critical Expiry (${criticalExpiryCount})` },
                { id: 'upcoming_expiry', label: `Upcoming Expiry (${upcomingExpiryCount})` },
                { id: 'infeasible_transfers', label: `Infeasible (${infeasibleTransfersCount})` },
                { id: 'delayed_transfers', label: `Delayed (${delayedTransfersCount})` },
                { id: 'unresolved_requests', label: `Unresolved Requests (${unresolvedRequestsCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id as CategoryFilter)}
                  style={{
                    background: categoryFilter === tab.id ? 'rgba(220, 38, 38, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                    border: categoryFilter === tab.id ? '1px solid rgba(220, 38, 38, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: categoryFilter === tab.id ? '#f87171' : '#94a3b8',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: categoryFilter === tab.id ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-Filters */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search alert, bank, unit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ width: 190, paddingLeft: 28, fontSize: '11px', height: '32px' }}
                />
              </div>

              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: 130, fontSize: '11px', height: '32px' }}
              >
                <option value="">All States</option>
                <option value="unresolved">Unresolved</option>
                <option value="unread">Unread Only</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                className="form-select"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                style={{ width: 120, fontSize: '11px', height: '32px' }}
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts & Recommendations List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <CheckCircle size={42} style={{ margin: '0 auto 12px', color: '#10b981', opacity: 0.8 }} />
              <h3 style={{ fontSize: '16px', color: '#f1f5f9', marginBottom: 4 }}>No Alerts Matching Filter</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>
                All monitored inventory and corridor activities are currently within acceptable thresholds.
              </p>
            </div>
          ) : (
            filtered.map((alert) => {
              const meta = alert.metadata;
              const isExpiryAlert = alert.type === 'expiring_soon' || alert.type === 'expired';
              const hasCandidate = meta?.bestCandidate != null;

              return (
                <div
                  key={alert.id}
                  className="card"
                  style={{
                    background: !alert.read
                      ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.08), rgba(15, 23, 42, 0.95))'
                      : 'rgba(13, 17, 29, 0.95)',
                    border: alert.severity === 'critical'
                      ? '1px solid rgba(220, 38, 38, 0.4)'
                      : alert.severity === 'warning'
                      ? '1px solid rgba(245, 158, 11, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Top Bar of Alert Card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={`badge badge-${alert.severity}`} style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800 }}>
                        {alert.severity}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                        {alert.type.replace(/_/g, ' ')}
                      </span>
                      {!alert.read && (
                        <span style={{ background: '#dc2626', color: 'white', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>
                          NEW
                        </span>
                      )}
                      {alert.resolved && (
                        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px' }}>
                          RESOLVED
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#64748b' }}>
                      <span>Alert ID: {alert.id}</span>
                      <span>•</span>
                      <span>Logged: {new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Main Alert Message */}
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>
                    {alert.message}
                  </div>

                  {/* Expiry Details Grid (Requirement 4) */}
                  {meta && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      marginBottom: 14,
                      fontSize: '12px',
                    }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>
                          Blood Bank &amp; Facility ID
                        </div>
                        <Link href="/blood-banks" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Droplets size={12} /> {meta.bloodBankName} ({meta.bloodBankId})
                        </Link>
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>
                          Unit / Batch ID
                        </div>
                        <Link href={`/inventory?search=${meta.unitId}`} style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Package size={12} /> {meta.unitId}
                        </Link>
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>
                          Blood Group &amp; Component
                        </div>
                        <div style={{ fontWeight: 700, color: '#e2e8f0' }}>
                          <span style={{ color: '#f87171', marginRight: 4 }}>{meta.bloodType}</span>
                          <span>{meta.componentType}</span>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>
                          Available Quantity
                        </div>
                        <div style={{ fontWeight: 700, color: '#f1f5f9' }}>
                          {meta.quantity} units
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>
                          Expiry &amp; Remaining Time
                        </div>
                        <div style={{ fontWeight: 700, color: meta.remainingMinutes <= 0 ? '#ef4444' : meta.remainingMinutes <= 720 ? '#f87171' : '#f59e0b' }}>
                          {meta.remainingMinutes <= 0 ? 'Expired' : `${formatMinutes(meta.remainingMinutes)} remaining`}
                          <span style={{ fontSize: '10px', color: '#64748b', marginLeft: 4, fontWeight: 400 }}>
                            ({new Date(meta.expiryTimestamp).toLocaleDateString()})
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Redistribution Recommendation Section (Requirements 5, 6, 7) */}
                  {meta && (
                    <div style={{
                      background: hasCandidate ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      border: hasCandidate ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      marginBottom: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasCandidate ? '#38bdf8' : '#94a3b8', fontWeight: 700, fontSize: '11px' }}>
                          <Route size={13} />
                          <span>REDISTRIBUTION ADVISORY EVALUATION</span>
                        </div>
                        {hasCandidate && meta.bestCandidate && (
                          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                            Feasibility Score: {meta.bestCandidate.score}/100 • Feasible Clinical Delivery
                          </div>
                        )}
                      </div>

                      {hasCandidate && meta.bestCandidate ? (
                        <div>
                          <div style={{ fontSize: '12px', color: '#f1f5f9', marginBottom: 8, lineHeight: 1.4 }}>
                            <strong>Optimal Candidate:</strong> {meta.bestCandidate.destinationBankName} ({meta.bestCandidate.hospitalName})
                            <span style={{ color: '#94a3b8', marginLeft: 8 }}>
                              Corridor Distance: {meta.bestCandidate.distanceKm} km • Drone Flight: ~{meta.bestCandidate.transportDurationMin} min
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '11px', color: '#cbd5e1', marginBottom: 10, background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '6px' }}>
                            <div><strong>Flight Time:</strong> {meta.bestCandidate.transportDurationMin} min</div>
                            <div><strong>Receipt Handling:</strong> {meta.bestCandidate.receivingDurationMin} min</div>
                            <div><strong>Safety Buffer:</strong> {meta.bestCandidate.safetyMarginMin} min</div>
                            <div><strong>Total Required:</strong> {meta.bestCandidate.totalRequiredTimeMin} min</div>
                            <div style={{ color: '#10b981', fontWeight: 700 }}>
                              <strong>Usable Time After Transfer:</strong> {meta.bestCandidate.usableTimeAfterTransferMin} min ({formatMinutes(meta.bestCandidate.usableTimeAfterTransferMin)})
                            </div>
                          </div>

                          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: 10 }}>
                            <strong>Policy Rationale:</strong> {meta.bestCandidate.reason}
                          </div>

                          {/* Review Recommendation Action (Requirement 6) */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Link
                              href={`/redistribution?unitId=${meta.unitId}&sourceBankId=${meta.bloodBankId}&destBankId=${meta.bestCandidate.destinationBankId}&requestId=${meta.bestCandidate.requestId || ''}`}
                              className="btn btn-primary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                            >
                              <Route size={13} />
                              <span>Review Recommendation</span>
                              <ArrowRight size={13} />
                            </Link>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>
                              Prefills Redistribution Planner for explicit administrator review. No drone is automatically dispatched.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: 6 }}>
                            <strong>Evaluation Status:</strong> {meta.rejectionReasonSummary || meta.recommendedAction}
                          </div>
                          <div style={{ fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle size={12} />
                            <span>Administrative Action Suggested: Local priority reservation or manual hospital contact advised. No artificial destination invented.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {meta && (
                        <Link href={`/inventory?search=${meta.unitId}`} className="btn btn-secondary btn-sm" style={{ fontSize: '11px' }}>
                          <Package size={12} /> View Unit
                        </Link>
                      )}
                      {meta && (
                        <Link href="/blood-banks" className="btn btn-secondary btn-sm" style={{ fontSize: '11px' }}>
                          <Droplets size={12} /> View Facility
                        </Link>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      {!alert.read && (
                        <button className="btn btn-secondary btn-sm" onClick={() => markAlertRead(alert.id)}>
                          <Eye size={12} /> Mark Read
                        </button>
                      )}
                      {!alert.resolved && (
                        <button className="btn btn-success btn-sm" onClick={() => resolveAlert(alert.id)}>
                          <Check size={12} /> Resolve Alert
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Clinical Disclaimer Notice (Requirement 10 & 12) */}
        <div style={{ marginTop: 28, padding: '16px 20px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Info size={18} color="#38bdf8" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong style={{ color: '#cbd5e1' }}>Educational Decision-Support Simulation Notice:</strong> Blood Navigator algorithms and redistribution feasibility scores evaluate shelf life, corridor transit durations, and simulated ABO/Rh compatibility for academic optimization. Blood-group matching alone does not establish full transfusion compatibility. In clinical operations, crossmatching, serological testing, and formal authorized clinical verification are mandatory before any real unit release or infusion.
          </div>
        </div>
      </div>
    </>
  );
}

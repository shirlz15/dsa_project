'use client';

import { useStore } from '@/lib/store';
import {
  FileText, Clock, Route, ArrowRightLeft, ArrowRight,
  AlertTriangle, CheckCircle, Package, Droplets, Sparkles,
  ChevronRight, RefreshCw, Play, ShieldAlert, Check
} from 'lucide-react';
import { useMemo } from 'react';
import Link from 'next/link';
import { formatMinutes } from '@/lib/recommendation-engine';

export default function DashboardPage() {
  const bloodBanks = useStore((s) => s.bloodBanks);
  const inventory = useStore((s) => s.inventory);
  const requests = useStore((s) => s.requests);
  const transfers = useStore((s) => s.transfers);
  const alerts = useStore((s) => s.alerts);
  const getNow = useStore((s) => s.getNow);
  const expiryThresholds = useStore((s) => s.expiryThresholds);
  const demoLoaded = useStore((s) => s.demoLoaded);
  const loadDemoScenario = useStore((s) => s.loadDemoScenario);

  const now = getNow();

  // Exactly the 4 core decision metrics required
  const metrics = useMemo(() => {
    // 1. Pending hospital requests
    const pendingReqs = requests.filter((r) => r.status === 'pending' || r.status === 'processing');

    // 2. Expiring inventory requiring review
    const nearExpiryUnits = inventory.filter((u) => {
      const remainingMs = new Date(u.expiryTimestamp).getTime() - now;
      return u.status === 'available' && remainingMs > 0 && remainingMs <= expiryThresholds.warningHours * 3600000;
    });

    // 3. Feasible redistribution recommendations
    const feasibleAlerts = alerts.filter(
      (a) => !a.resolved && a.metadata?.bestCandidate != null && a.metadata.bestCandidate.feasible
    );

    // 4. Active simulated transfers
    const activeTransfersList = transfers.filter((t) =>
      ['proposed', 'approved', 'dispatched', 'in_transit'].includes(t.status)
    );

    return {
      pendingRequestsCount: pendingReqs.length,
      expiringCount: nearExpiryUnits.length,
      feasibleRecsCount: feasibleAlerts.length,
      activeTransfersCount: activeTransfersList.length,
      pendingReqs,
      nearExpiryUnits,
      feasibleAlerts,
      activeTransfersList,
    };
  }, [requests, inventory, alerts, transfers, now, expiryThresholds]);

  // Urgent items requiring attention
  const attentionItems = useMemo(() => {
    const items: {
      id: string;
      title: string;
      subtitle: string;
      severity: 'critical' | 'warning';
      actionLabel: string;
      actionHref: string;
      type: 'request' | 'expiry' | 'transfer';
    }[] = [];

    // Urgent pending requests
    const urgentReq = metrics.pendingReqs.find((r) => r.priority === 'urgent' || r.priority === 'emergency') || metrics.pendingReqs[0];
    if (urgentReq) {
      const destBank = bloodBanks.find((b) => b.id === urgentReq.destinationBankId);
      items.push({
        id: urgentReq.id,
        title: `${urgentReq.priority.toUpperCase()} REQUISITION: ${urgentReq.quantity}u ${urgentReq.bloodType} ${urgentReq.componentType}`,
        subtitle: `Requested by ${destBank?.name || urgentReq.destinationBankId} (${destBank?.city || 'Regional'}) • Needed within ${urgentReq.neededBy ? Math.max(1, Math.round((new Date(urgentReq.neededBy).getTime() - now) / 3600000)) : 12}h`,
        severity: urgentReq.priority === 'emergency' ? 'critical' : 'warning',
        actionLabel: 'Triage Request',
        actionHref: '/requests',
        type: 'request',
      });
    }

    // Top near-expiry recommendation
    const topFeasibleAlert = metrics.feasibleAlerts[0];
    const cand = topFeasibleAlert?.metadata?.bestCandidate;
    if (topFeasibleAlert?.metadata && cand) {
      const m = topFeasibleAlert.metadata;
      items.push({
        id: topFeasibleAlert.id,
        title: `CRITICAL EXPIRY: ${m.quantity}u ${m.bloodType} ${m.componentType} at ${m.bloodBankName}`,
        subtitle: `Expires in ${formatMinutes(m.remainingMinutes)} • Recommended transfer to ${cand.destinationBankName} (${cand.usableTimeAfterTransferMin}m usable margin)`,
        severity: m.remainingMinutes <= expiryThresholds.criticalHours * 60 ? 'critical' : 'warning',
        actionLabel: 'Review Redistribution',
        actionHref: `/redistribution?unitId=${m.unitId}&sourceBankId=${m.bloodBankId}&destBankId=${cand.destinationBankId}&requestId=${cand.requestId || ''}`,
        type: 'expiry',
      });
    } else if (metrics.nearExpiryUnits.length > 0) {
      const u = metrics.nearExpiryUnits[0];
      const bank = bloodBanks.find((b) => b.id === u.bloodBankId);
      const remMs = new Date(u.expiryTimestamp).getTime() - now;
      items.push({
        id: u.id,
        title: `NEAR-EXPIRY UNIT: ${u.quantity}u ${u.bloodType} ${u.componentType} (${u.id})`,
        subtitle: `Facility: ${bank?.name || u.bloodBankId} • ${formatMinutes(Math.floor(remMs / 60000))} shelf life remaining`,
        severity: remMs <= expiryThresholds.criticalHours * 3600000 ? 'critical' : 'warning',
        actionLabel: 'Inspect Expiry',
        actionHref: '/expiry-monitoring',
        type: 'expiry',
      });
    }

    // Delayed or infeasible transfers
    const delayedTransfer = transfers.find((t) => t.status === 'delayed' || (t.usableTimeAfterTransfer <= 0 && t.status !== 'received' && t.status !== 'failed'));
    if (delayedTransfer) {
      items.push({
        id: delayedTransfer.id,
        title: `TRANSFER DELAY ALERT: Transfer ${delayedTransfer.id}`,
        subtitle: `Status: ${delayedTransfer.status.toUpperCase()} • Route duration +${delayedTransfer.transportDuration}m. Usable margin: ${delayedTransfer.usableTimeAfterTransfer}m.`,
        severity: delayedTransfer.usableTimeAfterTransfer <= 0 ? 'critical' : 'warning',
        actionLabel: 'Track Transfer',
        actionHref: `/transfers?transferId=${delayedTransfer.id}`,
        type: 'transfer',
      });
    }

    return items;
  }, [metrics, bloodBanks, now, expiryThresholds, transfers]);

  // Primary continue workflow destination
  const continueWorkflow = useMemo(() => {
    if (metrics.pendingRequestsCount > 0) {
      return {
        label: 'Triage Pending Hospital Requests',
        sub: `${metrics.pendingRequestsCount} requisitions awaiting matching in priority queue`,
        href: '/requests',
        icon: FileText,
      };
    }
    if (metrics.feasibleRecsCount > 0) {
      return {
        label: 'Execute Feasible Redistribution',
        sub: `${metrics.feasibleRecsCount} verified matches ready for corridor simulation`,
        href: '/redistribution',
        icon: Route,
      };
    }
    if (metrics.expiringCount > 0) {
      return {
        label: 'Review Expiring Inventory',
        sub: `${metrics.expiringCount} units approaching threshold`,
        href: '/expiry-monitoring',
        icon: Clock,
      };
    }
    return {
      label: 'Explore Redistribution Planner',
      sub: 'All requisitions serviced; review corridor capacity',
      href: '/redistribution',
      icon: Route,
    };
  }, [metrics]);

  if (!demoLoaded) {
    return (
      <div className="page-content" style={{ textAlign: 'center', paddingTop: 80 }}>
        <Droplets size={48} style={{ color: 'var(--accent-primary)', margin: '0 auto 16px' }} />
        <h2 style={{ marginBottom: 8 }}>Welcome to Blood Navigator</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Initialize the administrative data environment to begin oversight operations.
        </p>
        <button className="btn btn-primary" onClick={loadDemoScenario}>
          <Play size={16} /> Load Scenario Data
        </button>
      </div>
    );
  }

  const ContinueIcon = continueWorkflow.icon;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Overview</h1>
          <p>Supervise hospital requests, near-expiry stock, redistribution advisories, and active simulated transfers across the network.</p>
        </div>
      </div>

      <div className="page-content">
        {/* Key Information — Exactly the 4 relevant metrics */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
          <Link href="/requests" style={{ textDecoration: 'none' }}>
            <div className="stat-card hover-card" style={{ cursor: 'pointer' }}>
              <div className="stat-card-value" style={{ color: metrics.pendingRequestsCount > 0 ? '#38bdf8' : '#94a3b8' }}>
                {metrics.pendingRequestsCount}
              </div>
              <div className="stat-card-label">Pending Hospital Requests</div>
            </div>
          </Link>

          <Link href="/expiry-monitoring" style={{ textDecoration: 'none' }}>
            <div className="stat-card hover-card" style={{ cursor: 'pointer' }}>
              <div className="stat-card-value" style={{ color: metrics.expiringCount > 0 ? '#f59e0b' : '#94a3b8' }}>
                {metrics.expiringCount}
              </div>
              <div className="stat-card-label">Expiring Stock for Review</div>
            </div>
          </Link>

          <Link href="/redistribution" style={{ textDecoration: 'none' }}>
            <div className="stat-card hover-card" style={{ cursor: 'pointer' }}>
              <div className="stat-card-value" style={{ color: metrics.feasibleRecsCount > 0 ? '#10b981' : '#94a3b8' }}>
                {metrics.feasibleRecsCount}
              </div>
              <div className="stat-card-label">Feasible Recommendations</div>
            </div>
          </Link>

          <Link href="/transfers" style={{ textDecoration: 'none' }}>
            <div className="stat-card hover-card" style={{ cursor: 'pointer' }}>
              <div className="stat-card-value" style={{ color: metrics.activeTransfersCount > 0 ? '#a855f7' : '#94a3b8' }}>
                {metrics.activeTransfersCount}
              </div>
              <div className="stat-card-label">Active Simulated Transfers</div>
            </div>
          </Link>
        </div>

        {/* Primary Action — Continue Workflow */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.12), rgba(15, 23, 42, 0.95))',
            border: '1px solid rgba(220, 38, 38, 0.35)',
            borderRadius: '12px',
            padding: '18px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(220, 38, 38, 0.2)',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171',
              flexShrink: 0,
            }}>
              <ContinueIcon size={22} />
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f87171', fontWeight: 800 }}>
                Next Priority Operational Action
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                {continueWorkflow.label}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 2 }}>
                {continueWorkflow.sub}
              </div>
            </div>
          </div>

          <Link
            href={continueWorkflow.href}
            className="btn btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>Continue Workflow</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Compact Requires Attention Section */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color="#f59e0b" />
              <h2 style={{ fontSize: '14px', fontWeight: 700 }}>Requires Attention</h2>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {attentionItems.length} urgent item{attentionItems.length === 1 ? '' : 's'} identified
            </span>
          </div>

          <div className="card-body" style={{ padding: '8px 16px' }}>
            {attentionItems.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b' }}>
                <CheckCircle size={28} style={{ margin: '0 auto 8px', color: '#10b981', opacity: 0.8 }} />
                <p style={{ margin: 0, fontSize: '12px' }}>No critical issues requiring immediate intervention</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '6px 0' }}>
                {attentionItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: item.severity === 'critical' ? 'rgba(220, 38, 38, 0.06)' : 'rgba(245, 158, 11, 0.05)',
                      border: `1px solid ${item.severity === 'critical' ? 'rgba(220, 38, 38, 0.25)' : 'rgba(245, 158, 11, 0.2)'}`,
                      borderRadius: '8px',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span className={`badge badge-${item.severity}`} style={{ fontSize: '9px', fontWeight: 800, padding: '1px 6px' }}>
                          {item.severity.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9' }}>
                          {item.title}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {item.subtitle}
                      </div>
                    </div>

                    <Link
                      href={item.actionHref}
                      className={item.severity === 'critical' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                      style={{ fontSize: '11px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <span>{item.actionLabel}</span>
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Operational Flow Quick Navigation */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { num: '01', title: 'Blood Inventory', desc: 'Maintain regional stock & batch verification', href: '/inventory', icon: Package },
            { num: '02', title: 'Expiry Monitoring', desc: 'Real-time shelf life & countdown tracking', href: '/expiry-monitoring', icon: Clock },
            { num: '03', title: 'Hospital Requests', desc: 'FIFO queue triage for clinical orders', href: '/requests', icon: FileText },
            { num: '04', title: 'Redistribution Planner', desc: 'Time-feasibility & Dijkstra route analysis', href: '/redistribution', icon: Route },
            { num: '05', title: 'Transfer Tracking', desc: 'Simulated drone sortie dispatch & handoff', href: '/transfers', icon: ArrowRightLeft },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.num}
                href={step.href}
                className="card hover-card"
                style={{
                  padding: '14px',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 800 }}>STEP {step.num}</span>
                  <Icon size={14} color="#64748b" />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>{step.title}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{step.desc}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

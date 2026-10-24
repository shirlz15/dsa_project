'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import {
  Shield, User, LogOut, Lock, Key, ChevronDown, Activity,
  Server, AlertTriangle, CheckCircle, Clock, ShieldCheck, Info,
  Bell, ExternalLink, Route, Check, CheckCheck, Package, Droplets, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function AdminTopBar() {
  const currentUser = useStore((s) => s.currentUser);
  const operatingMode = useStore((s) => s.operatingMode);
  const loginAdmin = useStore((s) => s.loginAdmin);
  const logoutAdmin = useStore((s) => s.logoutAdmin);
  const alerts = useStore((s) => s.alerts);
  const markAlertRead = useStore((s) => s.markAlertRead);
  const markAllAlertsRead = useStore((s) => s.markAllAlertsRead);
  const resolveAlert = useStore((s) => s.resolveAlert);
  const getNow = useStore((s) => s.getNow);
  const demoClockOffset = useStore((s) => s.demoClockOffset);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [alertFilterTab, setAlertFilterTab] = useState<'all' | 'unread' | 'critical'>('all');
  const [showModeModal, setShowModeModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [clockTick, setClockTick] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const alertPanelRef = useRef<HTMLDivElement>(null);

  // Avoid hydration mismatch — only render dynamic content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Live clock ticking every second
  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => setClockTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [mounted]);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (alertPanelRef.current && !alertPanelRef.current.contains(e.target as Node)) {
        setShowAlertPanel(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadAlerts = alerts.filter((a) => !a.read && !a.resolved).length;
  const criticalAlerts = alerts.filter((a) => !a.resolved && a.severity === 'critical').length;

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    logoutAdmin();
    window.location.href = '/login';
  };



  // Format clock time (only after mount to prevent hydration mismatch)
  const clockDisplay = mounted ? new Date(getNow()).toLocaleTimeString() : '--:--:--';
  const clockDate = mounted ? new Date(getNow()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      height: '52px',
      background: 'rgba(5, 8, 16, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Left: Operating Mode & System Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Operating Mode Badge */}
        <button
          onClick={() => setShowModeModal(!showModeModal)}
          style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '6px',
            padding: '4px 10px',
            color: '#f87171',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
          title="Click to view operating mode details"
        >
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%', background: '#dc2626',
            boxShadow: '0 0 6px #dc2626', display: 'inline-block', flexShrink: 0,
          }} />
          <span>DEMO MODE</span>
          <Info size={10} style={{ opacity: 0.7 }} />
        </button>

        {/* Live Assessment Clock */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11px',
          color: '#94a3b8',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '4px 10px',
          borderRadius: '6px',
          fontVariantNumeric: 'tabular-nums',
        }}>
          <Clock size={11} color="#38bdf8" />
          <span>{clockDisplay}</span>
          {mounted && demoClockOffset !== 0 && (
            <span style={{ color: '#f59e0b', fontSize: '10px', fontWeight: 600 }}>
              (+{Math.round(demoClockOffset / 3600000)}h)
            </span>
          )}
        </div>
      </div>

      {/* Right: Quick Alerts & Admin Profile Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Notification Bell with Panel */}
        <div style={{ position: 'relative' }} ref={alertPanelRef}>
          <button
            onClick={() => setShowAlertPanel(!showAlertPanel)}
            style={{
              position: 'relative',
              background: unreadAlerts > 0 ? 'rgba(220, 38, 38, 0.14)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${unreadAlerts > 0 ? 'rgba(220, 38, 38, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: '7px',
              padding: '6px 11px',
              color: unreadAlerts > 0 ? '#f87171' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            title="Proactive Expiry & Redistribution Notifications"
          >
            <Bell size={13} className={unreadAlerts > 0 ? 'pulse-dot' : ''} />
            <span>Alerts</span>
            {unreadAlerts > 0 && (
              <span style={{
                background: '#dc2626',
                color: 'white',
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '999px',
                lineHeight: '14px',
                boxShadow: '0 0 8px rgba(220, 38, 38, 0.6)',
              }}>
                {unreadAlerts}
              </span>
            )}
          </button>

          {/* Compact Notification Panel */}
          {showAlertPanel && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: -40,
              width: '420px',
              maxWidth: '92vw',
              maxHeight: '520px',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(11, 15, 25, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(220, 38, 38, 0.15)',
              zIndex: 60,
              backdropFilter: 'blur(20px)',
              animation: 'fadeIn 0.2s ease',
            }}>
              {/* Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={14} color="#f87171" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
                    Notifications &amp; Recommendations
                  </span>
                  {unreadAlerts > 0 && (
                    <span style={{
                      background: 'rgba(220, 38, 38, 0.2)',
                      color: '#f87171',
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}>
                      {unreadAlerts} unread
                    </span>
                  )}
                </div>
                {unreadAlerts > 0 && (
                  <button
                    onClick={() => markAllAlertsRead()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Mark all alerts as read"
                  >
                    <CheckCheck size={12} /> Mark read
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '4px 12px',
                gap: '6px',
              }}>
                {[
                  { id: 'all', label: `All (${alerts.length})` },
                  { id: 'unread', label: `Unread (${unreadAlerts})` },
                  { id: 'critical', label: `Critical (${criticalAlerts})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAlertFilterTab(tab.id as any)}
                    style={{
                      background: alertFilterTab === tab.id ? 'rgba(220, 38, 38, 0.16)' : 'transparent',
                      border: alertFilterTab === tab.id ? '1px solid rgba(220, 38, 38, 0.35)' : '1px solid transparent',
                      color: alertFilterTab === tab.id ? '#f87171' : '#94a3b8',
                      borderRadius: '5px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: alertFilterTab === tab.id ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Alert Items List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {alerts.filter((a) => {
                  if (alertFilterTab === 'unread') return !a.read && !a.resolved;
                  if (alertFilterTab === 'critical') return !a.resolved && (a.severity === 'critical' || a.type === 'expiring_soon');
                  return true;
                }).length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
                    <CheckCircle size={28} style={{ margin: '0 auto 8px', opacity: 0.5, color: '#10b981' }} />
                    <p style={{ fontSize: '12px', margin: 0 }}>No active alerts in this category</p>
                  </div>
                ) : (
                  alerts
                    .filter((a) => {
                      if (alertFilterTab === 'unread') return !a.read && !a.resolved;
                      if (alertFilterTab === 'critical') return !a.resolved && (a.severity === 'critical' || a.type === 'expiring_soon');
                      return true;
                    })
                    .slice(0, 15)
                    .map((alert) => {
                      const isExpiry = alert.type === 'expiring_soon' || alert.type === 'expired';
                      const meta = alert.metadata;
                      const hasRec = meta?.bestCandidate;

                      return (
                        <div
                          key={alert.id}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            background: !alert.read ? 'rgba(220, 38, 38, 0.07)' : 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${!alert.read ? 'rgba(220, 38, 38, 0.22)' : 'rgba(255, 255, 255, 0.05)'}`,
                            marginBottom: '6px',
                            fontSize: '12px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span className={`badge badge-${alert.severity}`} style={{ fontSize: '9px', textTransform: 'uppercase', padding: '1px 5px' }}>
                                {alert.severity}
                              </span>
                              {meta && (
                                <span style={{
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  borderRadius: '4px',
                                  padding: '1px 5px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  color: '#e2e8f0',
                                }}>
                                  {meta.bloodType} {meta.componentType} ({meta.quantity}u)
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap' }}>
                              {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div style={{ color: '#cbd5e1', lineHeight: 1.4, marginBottom: '6px', fontSize: '11px' }}>
                            {alert.message}
                          </div>

                          {/* Unit & Bank Deep Links */}
                          {meta && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: '#94a3b8', marginBottom: '6px' }}>
                              <Link
                                href={`/inventory?search=${meta.unitId}`}
                                onClick={() => setShowAlertPanel(false)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#38bdf8', textDecoration: 'none' }}
                              >
                                <Package size={10} /> Unit {meta.unitId}
                              </Link>
                              <span>•</span>
                              <Link
                                href={`/blood-banks`}
                                onClick={() => setShowAlertPanel(false)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#cbd5e1', textDecoration: 'none' }}
                              >
                                <Droplets size={10} /> {meta.bloodBankName}
                              </Link>
                            </div>
                          )}

                          {/* Proactive Redistribution Recommendation Banner */}
                          {hasRec && meta.bestCandidate && (
                            <div style={{
                              background: 'rgba(56, 189, 248, 0.06)',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              marginTop: '4px',
                              marginBottom: '6px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38bdf8', fontWeight: 700, fontSize: '10px', marginBottom: '2px' }}>
                                <Route size={11} />
                                <span>RECOMMENDED ACTION:</span>
                              </div>
                              <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.3 }}>
                                Match with {meta.bestCandidate.destinationBankName} ({meta.bestCandidate.usableTimeAfterTransferMin}m usable margin after {meta.bestCandidate.transportDurationMin}m transit).
                              </div>
                            </div>
                          )}

                          {/* Quick Actions */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {hasRec && meta.bestCandidate && (
                                <Link
                                  href={`/redistribution?unitId=${meta.unitId}&sourceBankId=${meta.bloodBankId}&destBankId=${meta.bestCandidate.destinationBankId}&requestId=${meta.bestCandidate.requestId || ''}`}
                                  onClick={() => setShowAlertPanel(false)}
                                  style={{
                                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                                    color: 'white',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                >
                                  Review Recommendation <ArrowRight size={10} />
                                </Link>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '4px' }}>
                              {!alert.read && (
                                <button
                                  onClick={() => markAlertRead(alert.id)}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: '#94a3b8',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                  }}
                                  title="Mark as read"
                                >
                                  Mark read
                                </button>
                              )}
                              {!alert.resolved && (
                                <button
                                  onClick={() => resolveAlert(alert.id)}
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.25)',
                                    color: '#10b981',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                  }}
                                  title="Resolve alert"
                                >
                                  <Check size={10} /> Dismiss
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '10px 16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(5, 8, 16, 0.95)',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Link
                  href="/alerts"
                  onClick={() => setShowAlertPanel(false)}
                  style={{
                    color: '#f87171',
                    fontSize: '11px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Dedicated Alerts &amp; Reports <ExternalLink size={11} />
                </Link>
                <Link
                  href="/redistribution"
                  onClick={() => setShowAlertPanel(false)}
                  style={{
                    color: '#94a3b8',
                    fontSize: '11px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Redistribution Planner <Route size={11} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: '#f1f5f9',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{
              width: '26px', height: '26px', borderRadius: '6px',
              background: 'linear-gradient(135deg, #b91c1c, #450a0a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              color: 'white', fontSize: '10px', fontWeight: 800,
              flexShrink: 0,
            }}>
              {currentUser?.name
                ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                : 'AD'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9' }}>
                {currentUser?.name || 'Authorized Admin'}
              </div>
              <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                {currentUser?.role || 'Network Operations'}
              </div>
            </div>
            <ChevronDown size={12} color="#64748b" style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              width: '280px',
              background: 'rgba(13, 17, 29, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(220, 38, 38, 0.1)',
              padding: '16px',
              zIndex: 50,
              animation: 'fadeInDown 0.15s ease',
            }}>
              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#dc2626', fontWeight: 700 }}>
                  Authorized Admin Profile
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                  {currentUser?.name || 'Dr. Ramesh Kumar'}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {currentUser?.email || 'admin@bloodnavigator.org'}
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '14px' }}>
                <div><strong>Admin ID:</strong> <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{currentUser?.id || 'ADMIN-NA-7701'}</span></div>
                <div><strong>Facility:</strong> {currentUser?.facility || 'State Emergency Logistics Command'}</div>
                <div><strong>Access Level:</strong> Regional Network Oversight</div>
                <div><strong>Session:</strong> <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{currentUser?.sessionToken || 'SES-ACTIVE'}</span></div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  background: 'rgba(220, 38, 38, 0.12)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#f87171',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.12)'}
              >
                <LogOut size={14} />
                Sign Out & Lock Console
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Operating Mode Transparency Modal */}
      {showModeModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }} onClick={() => setShowModeModal(false)}>
          <div style={{
            maxWidth: '500px', width: '100%', background: '#0d111d',
            border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '14px',
            padding: '24px', color: '#f1f5f9',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Server size={20} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>System Implementation & Operating Mode</h3>
                <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>Demo Simulation Architecture</span>
              </div>
            </div>

            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '20px' }}>
              <p style={{ marginBottom: '10px' }}>
                <strong>Transparent Disclosure:</strong> This project is currently operating in <strong>Demo Simulation Mode</strong>. All data structures, drone simulations, inventory adjustments, and time-aware feasibility computations run client-side in React memory with browser local-storage persistence.
              </p>
              <p style={{ marginBottom: '10px' }}>
                There is <em>no external hospital HL7 / FHIR database</em> connected in this assessment build. Authentication is handled through a simulated administrative identity check.
              </p>
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)', padding: '10px 12px',
                borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '12px'
              }}>
                <div>• <strong>Operational DSA Engine:</strong> 11 genuine algorithms active</div>
                <div>• <strong>State Model:</strong> Single shared Zustand store</div>
                <div>• <strong>Clinical Safeguard:</strong> Time-aware redistribution formula strictly enforced</div>
              </div>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => setShowModeModal(false)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Close Information
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Droplets, Package, Clock, FileText, Route, Plane,
  ArrowRightLeft, Bell, ScrollText, FileDown,
  Network, Info, Settings, Menu, X, Heart
} from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/lib/store';

const NAV_ITEMS = [
  { section: 'Overview' },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { section: 'Blood Management' },
  { href: '/blood-banks', label: 'Blood Bank Management', icon: Droplets },
  { href: '/inventory', label: 'Blood Inventory', icon: Package },
  { href: '/expiry-monitoring', label: 'Expiry Monitoring', icon: Clock },
  { href: '/requests', label: 'Blood Requests', icon: FileText },
  { section: 'Logistics' },
  { href: '/redistribution', label: 'Redistribution Planner', icon: Route },
  { href: '/drone-simulation', label: 'Drone Simulation', icon: Plane },
  { href: '/transfers', label: 'Transfer Tracking', icon: ArrowRightLeft },
  { section: 'Monitoring' },
  { href: '/alerts', label: 'Alerts & Notifications', icon: Bell, badge: true },
  { href: '/audit', label: 'Audit Trail', icon: ScrollText },
  { section: 'Reports & Info' },
  { href: '/reports', label: 'Reports & Export', icon: FileDown },
  { href: '/architecture', label: 'Project Architecture', icon: Network },
  { href: '/about', label: 'Project Information', icon: Info },
  { href: '/settings', label: 'Settings & Demo Controls', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const alerts = useStore((s) => s.alerts);
  const unreadAlerts = alerts.filter((a) => !a.read && !a.resolved).length;

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed', top: 12, left: 12, zIndex: 60,
          background: 'var(--bg-sidebar)', color: 'white',
          border: 'none', borderRadius: 8, padding: '8px 10px',
          cursor: 'pointer', display: 'none',
        }}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} style={{
        background: 'rgba(5, 8, 16, 0.95)',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Original Blood-Line Navigator Brand Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #dc2626, #7f1d1d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(220, 38, 38, 0.5)',
              flexShrink: 0,
            }}>
              <Droplets size={16} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                Blood-Line
              </div>
              <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Navigator
              </div>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
            Emergency Hematology Logistics
          </div>
        </div>

        {/* Original Live Status Indicator */}
        <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#34d399' }}>
            <div className="pulse-dot" />
            System Live — Realtime Active
          </div>
        </div>

        <nav className="sidebar-nav" style={{ padding: '8px 10px' }}>
          {NAV_ITEMS.map((item, i) => {
            if ('section' in item && !('href' in item)) {
              return (
                <div key={i} className="sidebar-section" style={{
                  padding: '12px 10px 4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#475569',
                }}>
                  {item.section}
                </div>
              );
            }

            if (!('href' in item)) return null;
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href!));

            return (
              <Link
                key={item.href}
                href={item.href!}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  marginBottom: '2px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none',
                  background: isActive ? 'rgba(220, 38, 38, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid transparent',
                  color: isActive ? '#f87171' : '#64748b',
                  transition: 'all 0.15s ease',
                }}
              >
                {Icon && <Icon size={16} />}
                <span>{item.label}</span>
                {item.badge && unreadAlerts > 0 && (
                  <span className="sidebar-badge">{unreadAlerts}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div style={{
          padding: '14px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '11px', color: '#475569', lineHeight: 1.5,
        }}>
          <div>SET-2 · Autonomous Hematology</div>
          <div style={{ color: '#334155' }}>DSA Assessment Engine Active</div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 40, display: 'none',
          }}
        />
      )}

      <style jsx global>{`
        @media (max-width: 1024px) {
          .sidebar-mobile-toggle { display: block !important; }
          .sidebar.open { transform: translateX(0) !important; }
          div[style*="rgba(0,0,0,0.5)"] { display: block !important; }
        }
      `}</style>
    </>
  );
}

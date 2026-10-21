'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Droplets, Package, Clock, FileText, Route, Plane,
  ArrowRightLeft, Bell, ScrollText, FlaskConical, BarChart3, FileDown,
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
  { section: 'DSA Assessment' },
  { href: '/dsa-lab', label: 'DSA Laboratory', icon: FlaskConical },
  { href: '/performance-lab', label: 'Algorithm Performance Lab', icon: BarChart3 },
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

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Heart size={18} />
          </div>
          <div>
            <h1>Blood Navigator</h1>
            <span>DSA Assessment Project</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, i) => {
            if ('section' in item && !('href' in item)) {
              return (
                <div key={i} className="sidebar-section">
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
              >
                {Icon && <Icon size={18} />}
                <span>{item.label}</span>
                {item.badge && unreadAlerts > 0 && (
                  <span className="sidebar-badge">{unreadAlerts}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div style={{
          padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: 11, color: 'var(--text-muted)',
        }}>
          <div>Blood Navigator v1.0</div>
          <div>DSA Internal Assessment</div>
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

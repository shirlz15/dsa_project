'use client';

import { Info, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <div className="page-header"><h1>Project Information</h1><p>About Blood Navigator — DSA Internal Assessment</p></div>
      <div className="page-content">
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body" style={{ textAlign: 'center', padding: 40 }}>
            <Heart size={48} style={{ color: 'var(--accent-primary)', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>Blood Navigator</h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 16px' }}>
              A Time-Aware Blood Expiry Monitoring and Inventory Redistribution System with Drone Simulation
            </p>
            <span className="badge badge-info" style={{ fontSize: 13, padding: '4px 16px' }}>DSA Internal Assessment Project</span>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-header"><h2>Problem Statement</h2></div>
            <div className="card-body" style={{ fontSize: 14, lineHeight: 1.7 }}>
              <p>Blood products have limited shelf lives. When stored blood approaches expiry at one location while another location faces shortages, redistribution can prevent wastage and save lives. However, any transfer must be completed <em>before</em> the blood expires, accounting for transport time, receiving/processing delays, and safety margins.</p>
              <p style={{ marginTop: 12 }}>This project demonstrates how data structures and algorithms can model and solve this logistics challenge within a simulated environment.</p>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h2>Proposed Contribution</h2></div>
            <div className="card-body" style={{ fontSize: 14, lineHeight: 1.7 }}>
              <p><strong>Time-aware blood expiry monitoring and redistribution planning</strong> combined with an interactive drone route simulation.</p>
              <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>
                <em>Disclaimer:</em> This is an educational demonstration for a DSA internal assessment. It does not claim to be globally novel, medically validated, or deployed in real blood banks. The simulated eligibility rules are illustrative and do not independently establish clinical compatibility.
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header"><h2>Key Features</h2></div>
          <div className="card-body">
            <div className="grid-3">
              {[
                'Real-time expiry monitoring from timestamps',
                'Time-aware redistribution feasibility calculation',
                'Interactive drone simulation with graph algorithms',
                'Custom DSA implementations (not built-in wrappers)',
                'DSA Laboratory with step-by-step visualization',
                'Algorithm performance benchmarking',
                'Audit trail with before/after values',
                'CSV export for all data',
                'Configurable demo clock for live demonstrations',
                'Local persistence across page reloads',
                'Professional healthcare dashboard UI',
                'Transparent scoring with explained factors',
              ].map((f, i) => (
                <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 6, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--status-normal)' }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header"><h2>Known Limitations</h2></div>
          <div className="card-body" style={{ fontSize: 14 }}>
            <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>All data is simulated — no real blood bank integration</li>
              <li>Drone simulation is 2D browser-based, not actual drone control</li>
              <li>Blood compatibility checks are simplified simulations, not clinical-grade</li>
              <li>No actual medical validation or regulatory compliance</li>
              <li>Performance benchmarks use browser timing which can be noisy</li>
              <li>Local storage persistence — no multi-user or server-side storage</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

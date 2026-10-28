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
          <div className="card-header">
            <h2>Team Members &amp; Source Code Responsibilities</h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Four-Member DSA Internal Assessment Architecture</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong style={{ color: 'var(--accent-primary)', fontSize: 14 }}>Member 1: Shirley Y. S.</strong>
                  <span className="badge badge-info" style={{ fontSize: 11 }}>URK25CS1081</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', marginBottom: 6 }}>Inventory Storage, Searching &amp; Sorting</div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
                  Responsible for key-based unit indexing, remaining shelf-life binary search, multi-algorithm inventory ordering, and BST range queries.
                </p>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#38bdf8' }}>
                  • inventoryHashTable.ts<br />
                  • binarySearch.ts<br />
                  • inventorySorting.ts<br />
                  • binarySearchTree.ts
                </div>
              </div>

              <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong style={{ color: 'var(--accent-primary)', fontSize: 14 }}>Member 2: Kaitlyn Grace J</strong>
                  <span className="badge badge-info" style={{ fontSize: 11 }}>URK25CS1209</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', marginBottom: 6 }}>Hospital Request Processing</div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
                  Responsible for FIFO requisition queuing and emergency clinical dispatch prioritization using priority queues.
                </p>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#38bdf8' }}>
                  • requestQueue.ts<br />
                  • requestPriorityQueue.ts
                </div>
              </div>

              <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong style={{ color: 'var(--accent-primary)', fontSize: 14 }}>Member 3: Aneesha M</strong>
                  <span className="badge badge-info" style={{ fontSize: 11 }}>URK25CS1219</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', marginBottom: 6 }}>Redistribution Planning &amp; Validation</div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
                  Responsible for double-ended review worklists (Deque), cyclic blood bank rotation, and transfer-feasibility validation.
                </p>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#38bdf8' }}>
                  • redistributionDeque.ts<br />
                  • circularLinkedList.ts<br />
                  • transferFeasibility.ts
                </div>
              </div>

              <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong style={{ color: 'var(--accent-primary)', fontSize: 14 }}>Member 4: Angeline Maria S</strong>
                  <span className="badge badge-info" style={{ fontSize: 11 }}>URK25CS1224</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', marginBottom: 6 }}>Drone Delivery Operations &amp; Graphs</div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
                  Responsible for graph traversals (BFS/DFS), Dijkstra shortest weighted route, and fixed-capacity circular queue telemetry buffers.
                </p>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#38bdf8' }}>
                  • graphTraversal.ts<br />
                  • dijkstra.ts<br />
                  • circularQueue.ts
                </div>
              </div>
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

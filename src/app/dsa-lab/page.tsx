'use client';

import Link from 'next/link';
import { Layers, Package, FileText, Route, Plane, ArrowRight, Sparkles } from 'lucide-react';

export default function DsaLabRedirectPage() {
  return (
    <>
      <div className="page-header">
        <h1>DSA Integrated Architecture</h1>
        <p>Data Structures and Algorithms are fully embedded into real Blood Navigator application workflows</p>
      </div>

      <div className="page-content">
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Sparkles size={22} color="var(--color-primary)" />
            <h2 style={{ fontSize: 18, margin: 0 }}>DSA Laboratory Has Moved In-Place</h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 800 }}>
            Per assessment requirements, all 17 custom data structures and algorithms have been migrated from standalone demonstration pages directly into the active business logic and real-world workflows of Blood Navigator.
          </p>
        </div>

        <div className="grid-2" style={{ gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Package size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: 15, margin: 0 }}>Blood Inventory</h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Integrated DSA topics:
              <br />• <strong>Stack</strong> — LIFO Action History &amp; Reversible Undo
              <br />• <strong>Linked List</strong> — Node-based inventory unit chain
              <br />• <strong>Hash Table</strong> — Fast O(1) inventory &amp; bank ID lookup
              <br />• <strong>Searches</strong> — Linear, Binary, and Interpolation search
              <br />• <strong>Sorting</strong> — Bubble, Selection, Insertion, and Merge sort
            </p>
            <Link href="/inventory" className="btn btn-primary btn-sm">
              Open Inventory Workflow <ArrowRight size={13} />
            </Link>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <FileText size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: 15, margin: 0 }}>Blood Requests</h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Integrated DSA topics:
              <br />• <strong>Queue (FIFO)</strong> — Prioritized incoming blood request servicing
              <br />• <strong>Priority Tiers</strong> — Emergency (Tier 1), Urgent (Tier 2), Routine (Tier 3)
              <br />• <strong>Enqueue / Dequeue</strong> — Position tracking and processing transitions
            </p>
            <Link href="/requests" className="btn btn-primary btn-sm">
              Open Blood Requests Workflow <ArrowRight size={13} />
            </Link>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Route size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: 15, margin: 0 }}>Redistribution Planner</h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Integrated DSA topics:
              <br />• <strong>Circular Linked List</strong> — Closed cyclic blood bank review (A → B → C → A)
              <br />• <strong>Deque</strong> — Double-ended review task worklist (Front for emergency, Rear for routine)
              <br />• <strong>Feasibility Engine</strong> — Time-aware expiry, transport, processing &amp; safety margins
              <br />• <strong>Candidate Sorting</strong> — Dynamic ranking via Merge, Insertion, Selection, Bubble sort
            </p>
            <Link href="/redistribution" className="btn btn-primary btn-sm">
              Open Redistribution Planner <ArrowRight size={13} />
            </Link>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Plane size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: 15, margin: 0 }}>Drone Route Simulation</h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Integrated DSA topics:
              <br />• <strong>Graph Representation</strong> — Vertices (banks, waypoints) &amp; weighted flight corridors
              <br />• <strong>BFS &amp; DFS Traversal</strong> — Level-order vs depth-first exploration
              <br />• <strong>Dijkstra Algorithm</strong> — Shortest path calculation feeding into planner duration
              <br />• <strong>Circular Queue</strong> — Fixed-capacity (ring buffer) noncritical simulation telemetry
            </p>
            <Link href="/drone-simulation" className="btn btn-primary btn-sm">
              Open Drone Simulation <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

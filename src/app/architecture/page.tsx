'use client';

import { Network } from 'lucide-react';

export default function ArchitecturePage() {
  return (
    <>
      <div className="page-header"><h1>Project Architecture</h1><p>Technical architecture and data flow of Blood Navigator</p></div>
      <div className="page-content">
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h2>Technology Stack</h2></div>
          <div className="card-body">
            <table className="data-table">
              <thead><tr><th>Layer</th><th>Technology</th><th>Purpose</th></tr></thead>
              <tbody>
                <tr><td>Framework</td><td>Next.js 16 (App Router)</td><td>Server-side rendering, file-based routing</td></tr>
                <tr><td>Language</td><td>TypeScript</td><td>Type safety, IDE support</td></tr>
                <tr><td>Styling</td><td>Tailwind CSS v4 + Custom CSS</td><td>Design system with healthcare color palette</td></tr>
                <tr><td>State</td><td>Zustand + localStorage</td><td>Client-side state with persistence</td></tr>
                <tr><td>Icons</td><td>Lucide React</td><td>Consistent icon system</td></tr>
                <tr><td>DSA Engine</td><td>Custom TypeScript</td><td>All data structures and algorithms from scratch</td></tr>
                <tr><td>Visualization</td><td>HTML Canvas</td><td>2D drone simulation rendering</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h2>DSA-to-Feature Mapping</h2></div>
          <div className="card-body">
            <table className="data-table">
              <thead><tr><th>DSA Topic</th><th>Application Feature</th><th>Why This DS/Algorithm</th></tr></thead>
              <tbody>
                <tr><td>Stack</td><td>Reversible action history</td><td>LIFO for undo — O(1) push/pop</td></tr>
                <tr><td>Queue</td><td>Request processing order</td><td>FIFO ensures fair arrival-order processing</td></tr>
                <tr><td>Circular Queue</td><td>Recent event buffer</td><td>Fixed-size bounded buffer with wraparound</td></tr>
                <tr><td>Linked List</td><td>Dynamic inventory records</td><td>Efficient insertions/deletions without reallocation</td></tr>
                <tr><td>Circular Linked List</td><td>Cyclic blood bank review</td><td>Round-robin review cycle (A→B→C→A)</td></tr>
                <tr><td>Deque</td><td>Review task worklist</td><td>Priority insertion at both ends</td></tr>
                <tr><td>Hash Table</td><td>Inventory/bank ID lookup</td><td>O(1) average-case lookups</td></tr>
                <tr><td>Linear Search</td><td>Inventory search</td><td>Simple sequential scan for unsorted data</td></tr>
                <tr><td>Binary Search</td><td>Sorted inventory lookup</td><td>O(log n) on sorted data</td></tr>
                <tr><td>Interpolation Search</td><td>Numeric key search</td><td>Probe position based on value distribution</td></tr>
                <tr><td>Sorting Algorithms</td><td>Inventory sorting by expiry/ID</td><td>Comparison of quadratic vs. divide-and-conquer</td></tr>
                <tr><td>BFS</td><td>Drone route — level traversal</td><td>Shortest path in unweighted graphs</td></tr>
                <tr><td>DFS</td><td>Drone route — deep traversal</td><td>Alternative exploration strategy</td></tr>
                <tr><td>Dijkstra</td><td>Drone shortest path</td><td>Optimal route with weighted edges</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Data Flow</h2></div>
          <div className="card-body">
            <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 2, background: 'var(--bg-tertiary)', padding: 16, borderRadius: 8 }}>
              <div>1. <strong>Blood Banks</strong> → register with system</div>
              <div>2. <strong>Inventory Units</strong> → created with collection/expiry timestamps</div>
              <div>3. <strong>Expiry Monitor</strong> → remainingTime = expiryTimestamp − currentTime</div>
              <div>4. <strong>Blood Requests</strong> → destination needs blood component</div>
              <div>5. <strong>Redistribution Planner</strong> → evaluates feasibility:</div>
              <div style={{ paddingLeft: 20 }}>requiredTime = transport + processing + safety</div>
              <div style={{ paddingLeft: 20 }}>usableTimeAfterTransfer = remainingTime − requiredTime</div>
              <div style={{ paddingLeft: 20 }}>feasible iff usableTimeAfterTransfer &gt; 0 AND all checks pass</div>
              <div>6. <strong>Transfer Approval</strong> → reserves inventory, creates audit trail</div>
              <div>7. <strong>Drone Simulation</strong> → graph algorithms calculate route</div>
              <div>8. <strong>Drone Flight</strong> → animated along calculated path (SIMULATED)</div>
              <div>9. <strong>Arrival</strong> → requires explicit receipt confirmation</div>
              <div>10. <strong>Audit Trail</strong> → all state changes logged with before/after</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

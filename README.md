# Blood Navigator

**A Time-Aware Blood Expiry Monitoring and Inventory Redistribution System with Drone Simulation**

> DSA Internal Assessment Project — Second-Year CSE, Data Structures and Algorithms

---

## Project Overview

Blood products have limited shelf lives. When stored blood approaches expiry at one location while another location faces shortages, redistribution can prevent wastage. However, any transfer must complete *before* the blood expires, accounting for transport time, receiving/processing delays, and safety margins.

**Blood Navigator** demonstrates how data structures and algorithms can model and solve this logistics challenge within a simulated environment.

### Proposed Contribution

Time-aware blood expiry monitoring and redistribution planning combined with an interactive drone route simulation.

> **Disclaimer:** This is an educational demonstration for a DSA internal assessment. It does not claim to be globally novel, medically validated, or deployed in real blood banks. All simulated eligibility rules are illustrative and do not independently establish clinical compatibility.

---

## Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Real-time metrics: available units, expiry counts, pending requests, active transfers |
| **Blood Bank Management** | CRUD operations for simulated blood banks |
| **Blood Inventory** | Full inventory with filtering by type, status, bank; sorting by expiry/quantity |
| **Expiry Monitoring** | Live countdown from timestamps with configurable warning/critical thresholds |
| **Blood Requests** | Create and manage blood component requests with priorities |
| **Redistribution Planner** | Time-aware feasibility calculation with transparent scoring |
| **Drone Simulation** | Interactive 2D Canvas simulation with BFS/DFS/Dijkstra pathfinding |
| **Transfer Tracking** | Full lifecycle tracking with approval/rejection workflow |
| **Alerts & Notifications** | System alerts based on inventory state, expiry, and events |
| **Audit Trail** | Complete state change history with before/after values |
| **DSA Laboratory** | Interactive demonstrations of all 17 DSA topics |
| **Algorithm Performance Lab** | Benchmarking with actual measurements and visual comparison |
| **Reports & Export** | CSV export for inventory, requests, and transfers |
| **Demo Clock** | Advance simulated time to demonstrate expiry changes live |

---

## DSA Topics Implemented

All data structures and algorithms are implemented **from scratch** in TypeScript — no wrappers around built-in `Map`, `Set`, or `Array.sort()`.

| # | Topic | Application Feature | Complexity |
|---|-------|---------------------|------------|
| 1 | **Stack** | Reversible action history (LIFO) | Push/Pop: O(1) |
| 2 | **Queue** | Request processing order (FIFO) | Enqueue: O(1), Dequeue: O(n) |
| 3 | **Circular Queue** | Fixed-size event buffer with wraparound | Enqueue/Dequeue: O(1) |
| 4 | **Linked List** | Dynamic inventory records | Insert head: O(1), Search: O(n) |
| 5 | **Circular Linked List** | Cyclic blood bank review (A→B→C→A) | Insert: O(n), Traverse cycle: O(n) |
| 6 | **Deque** | Review task worklist (both-end operations) | Insert/Delete front/rear: O(1) |
| 7 | **Hash Table** | Inventory/bank ID lookup (separate chaining) | Average lookup: O(1) |
| 8 | **Linear Search** | Sequential inventory scan | O(n) |
| 9 | **Binary Search** | Sorted inventory lookup | O(log n) |
| 10 | **Interpolation Search** | Numeric key search with probe estimation | Avg O(log log n)* |
| 11 | **Bubble Sort** | Comparison baseline | O(n²) |
| 12 | **Selection Sort** | Find-minimum approach | O(n²) |
| 13 | **Insertion Sort** | Build sorted sequence | O(n²) worst, O(n) best |
| 14 | **Merge Sort** | Divide and conquer | O(n log n) |
| 15 | **BFS** | Drone route — level-order traversal | O(V + E) |
| 16 | **DFS** | Drone route — depth-first exploration | O(V + E) |
| 17 | **Dijkstra** | Drone shortest weighted path | O(V²) |

\* Interpolation search O(log log n) average assumes approximately uniform distribution.

---

## Core Feasibility Formula

```
remainingTime = expiryTimestamp − currentTime
requiredTime  = transportDuration + receivingProcessingDuration + safetyMargin
usableTimeAfterTransfer = remainingTime − requiredTime

feasible iff:
  usableTimeAfterTransfer > 0
  AND unit.status === 'available'
  AND unit.transportEligible === true
  AND bloodType compatibility passes
  AND deadline is met (if specified)
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | Server-side rendering, routing |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS v4 + Custom CSS | Design system |
| State | Zustand + localStorage | Client-side persistence |
| Icons | Lucide React | Icon system |
| DSA Engine | Custom TypeScript | All DS/algorithms from scratch |
| Visualization | HTML Canvas | 2D drone simulation |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
git clone https://github.com/shirlz15/dsa_project.git
cd dsa_project
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## Demo Walkthrough

1. **Load Demo Scenario** — Navigate to Settings or the Dashboard and click "Load Demo Scenario"
2. **Dashboard** — View real-time metrics across all blood banks
3. **Expiry Monitoring** — See units categorized by expiry risk; advance the demo clock to see changes
4. **Redistribution Planner** — Select source bank, destination, units → run feasibility analysis
5. **Drone Simulation** — Choose source/destination nodes, pick BFS/DFS/Dijkstra, calculate route, start simulation
6. **DSA Laboratory** — Click through each DSA topic tab, interact with operations, observe step logs
7. **Performance Lab** — Run benchmarks at different dataset sizes, compare algorithms

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with sidebar
│   ├── page.tsx                # Root redirect to dashboard
│   ├── globals.css             # Design system
│   ├── dashboard/page.tsx      # Overview dashboard
│   ├── blood-banks/page.tsx    # Blood bank CRUD
│   ├── inventory/page.tsx      # Inventory management
│   ├── expiry-monitoring/page.tsx  # Expiry risk monitoring
│   ├── requests/page.tsx       # Blood requests
│   ├── redistribution/page.tsx # Time-aware feasibility planner
│   ├── drone-simulation/page.tsx # Interactive drone simulation
│   ├── transfers/page.tsx      # Transfer lifecycle tracking
│   ├── alerts/page.tsx         # Alert management
│   ├── audit/page.tsx          # Audit trail
│   ├── dsa-lab/page.tsx        # DSA Laboratory (17 topics)
│   ├── performance-lab/page.tsx # Algorithm benchmarking
│   ├── reports/page.tsx        # CSV export
│   ├── architecture/page.tsx   # Technical architecture
│   ├── about/page.tsx          # Project information
│   └── settings/page.tsx       # Demo controls
├── components/
│   ├── Sidebar.tsx             # Navigation sidebar
│   └── StoreInitializer.tsx    # Zustand hydration
└── lib/
    ├── types.ts                # Core type definitions
    ├── blood-compat.ts         # Blood compatibility matrix
    ├── demo-data.ts            # Demo scenario generator
    ├── dsa-engine.ts           # All DSA implementations
    ├── feasibility-engine.ts   # Redistribution feasibility calculator
    └── store.ts                # Zustand store with persistence
```

---

## Known Limitations

- All data is simulated — no real blood bank integration
- Drone simulation is 2D browser-based, not actual drone control
- Blood compatibility checks are simplified simulations, not clinical-grade
- No actual medical validation or regulatory compliance
- Performance benchmarks use browser timing which can be noisy
- Local storage persistence — no multi-user or server-side storage

---

## License

This project is created for educational purposes as part of a DSA internal assessment.

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

## Features & Workflow Integration

Every DSA concept has an active, functional role directly within the core operational workflows:

| Feature Route | Primary DSA Concept | Operational Role in System |
|---|---|---|
| **`/inventory`** | **Stack, Hash Table, Linked List, Linear/Binary/Interpolation Search, Sorting** | LIFO undo history; O(1) unit ID lookup with separate chaining; node-chain inventory operations; sorted expiry/ID search probes; 4 sorting algorithms |
| **`/requests`** | **Queue (FIFO)** | Strict arrival queueing & processing order for emergency blood component requests |
| **`/drone-simulation`** | **Circular Queue, Graph (BFS, DFS, Dijkstra)** | Bounded ring buffer for live flight telemetry events; optimal shortest route planning over waypoint graph corridors |
| **`/redistribution`** | **Circular Linked List, Deque, Sorting, Feasibility Engine** | Closed-loop multi-bank review rotation (Bank A → B → C → A); double-ended priority review worklist; time-aware redistribution candidates |
| **`/audit`** | **Stack** | Stack-based state history tracking with non-destructive undo and audit verification |
| **`/transfers`** | **State Graph** | Comprehensive lifecycle tracking (Proposed → In-Transit → Delivered/Cancelled) |
| **`/dashboard`** | **Live Metrics & Visuals** | Operations center with original Blood Navigator KPIs, live status telemetry, and blood inventory breakdown |

---

## DSA Topics Implemented & Workflow Mapping

All data structures and algorithms are implemented **from scratch** in TypeScript (`src/lib/dsa-engine.ts`) — with **zero reliance** on built-in wrappers. Each concept is embedded directly into the application's actual workflows rather than isolated in demo playgrounds:

| # | DSA Topic | System Workflow | Implementation File & Symbol | Complexity | Practical Role |
|---|---|---|---|---|---|
| 1 | **Stack** | Inventory Action History & Undo | `src/lib/dsa-engine.ts` → `Stack<T>` | Push: O(1), Pop: O(1) | Records reversible inventory edits; provides "Undo Last Change" with LIFO rollback |
| 2 | **Queue** | Blood Request Processing | `src/lib/dsa-engine.ts` → `Queue<T>` | Enqueue: O(1), Dequeue: O(n) / O(1) | Enforces arrival sequence for emergency blood requests awaiting fulfillment |
| 3 | **Circular Queue** | Drone Telemetry Ring Buffer | `src/lib/dsa-engine.ts` → `CircularQueue<T>` | Enqueue/Dequeue: O(1) | Bounded buffer for flight telemetry (waypoints, battery status, delay events) with explicit wraparound |
| 4 | **Linked List** | Inventory Node Operations | `src/lib/dsa-engine.ts` → `LinkedList<T>` | Insert: O(1), Search/Delete: O(n) | Demonstrates dynamic node chaining and pointer updates for inventory units |
| 5 | **Circular Linked List** | Participating Bank Review Cycle | `src/lib/dsa-engine.ts` → `CircularLinkedList<T>` | Cycle traversal: O(n) | Executes closed-loop review cycles across blood banks (A → B → C → A) with clean one-cycle termination |
| 6 | **Deque** | Redistribution Review Worklist | `src/lib/dsa-engine.ts` → `Deque<T>` | Insert/Delete Front/Rear: O(1) | Double-ended queue prioritizing urgent review candidates at the front and routine tasks at the rear |
| 7 | **Hash Table** | O(1) Unit & Bank ID Lookup | `src/lib/dsa-engine.ts` → `HashTable<K, V>` | Avg: O(1), Worst: O(n) | Hash index with separate chaining collision resolution for fast unit lookup |
| 8 | **Linear Search** | Unsorted Inventory Discovery | `src/lib/dsa-engine.ts` → `linearSearch()` | O(n) | Scans unsorted collections and records comparison counts |
| 9 | **Binary Search** | Sorted Expiry & Sequence Search | `src/lib/dsa-engine.ts` → `binarySearch()` | O(log n) | Probes sorted timestamps/keys with low, high, and mid index tracking |
| 10 | **Interpolation Search** | Sorted Numeric Index Probing | `src/lib/dsa-engine.ts` → `interpolationSearch()` | Avg: O(log log n), Worst: O(n) | Probes uniformly distributed numeric unit sequence IDs with safe zero-division handling |
| 11 | **Bubble Sort** | Inventory & Expiry Sorting | `src/lib/dsa-engine.ts` → `bubbleSort()` | O(n²) | Baseline comparison sort with deterministic tie-breaking |
| 12 | **Selection Sort** | Inventory & Expiry Sorting | `src/lib/dsa-engine.ts` → `selectionSort()` | O(n²) | In-place minimum extraction sort |
| 13 | **Insertion Sort** | Inventory & Expiry Sorting | `src/lib/dsa-engine.ts` → `insertionSort()` | O(n²) worst, O(n) best | Incremental sorted subarray construction |
| 14 | **Merge Sort** | Expiry & Redistribution Priority | `src/lib/dsa-engine.ts` → `mergeSort()` | O(n log n) | Stable divide-and-conquer sort for expiry timestamps and candidate priorities |
| 15 | **Breadth-First Search (BFS)** | Drone Operating Area Exploration | `src/lib/dsa-engine.ts` → `bfs()` | O(V + E) | Unweighted shortest path finding across flight waypoints |
| 16 | **Depth-First Search (DFS)** | Reachability & Corridor Traversal | `src/lib/dsa-engine.ts` → `dfs()` | O(V + E) | Recursive pathway discovery across aerial corridor networks |
| 17 | **Dijkstra's Algorithm** | Optimal Drone Flight Path | `src/lib/dsa-engine.ts` → `dijkstra()` | O(V²) | Shortest weighted distance calculation determining route duration for time-aware feasibility |

---

## Core Feasibility Formula

The central logistics contribution of the system calculates whether an expiring blood unit can be safely relocated to save a patient:

```
remainingTime = expiryTimestamp − currentTime
requiredTime  = transportDuration + receivingProcessingDuration + safetyMargin
usableTimeAfterTransfer = remainingTime − requiredTime

feasible iff:
  usableTimeAfterTransfer > 0
  AND unit.status === 'available'
  AND unit.transportEligible === true
  AND bloodType compatibility passes
  AND destination capacity available
  AND drone battery reserve >= required flight reserve
```

If a simulated transport delay occurs during flight, the system dynamically recalculates `usableTimeAfterTransfer` using the actual Dijkstra flight duration, updating the transfer outcome in real time.

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

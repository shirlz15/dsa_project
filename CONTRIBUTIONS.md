# Blood Navigator: DSA Contributions & Architecture Documentation

**Project Title:** Blood Navigator: A Time-Aware Blood Expiry Monitoring and Inventory Redistribution System Using DSA  
**Course:** Data Structures and Algorithms (CSE 2nd Year)  
**Academic Architecture:** Four-Member Module Separation  

---

## Executive Summary

Blood Navigator solves the clinical logistics challenge of blood wastage due to expiry by using core Data Structures and Algorithms. The codebase in `src/lib/dsa/` is partitioned into distinct, modular, and beginner-friendly files, with each algorithm clearly documented for second-year CSE students to explain line-by-line during a DSA viva.

Each algorithm file contains:
1. **Searchable comment headings** matching the project specification.
2. **Clear variable names** (`front`, `rear`, `mid`, `visited`, `distance`, `left`, `right`).
3. **Step-by-step viva explanations** describing pointer updates, edge relaxation, comparisons, and swaps.
4. **Time and space complexity** analyses ($O(1)$, $O(\log n)$, $O(n)$, $O(V + E)$, $O(V^2)$).

---

## Team Members & Assigned Responsibilities

| Member | Register Number | Role & Responsibility | Primary Directory |
|---|---|---|---|
| **Shirley Y. S.** | `URK25CS1081` | Inventory Storage, Searching & Sorting | `src/lib/dsa/` |
| **Kaitlyn Grace J** | `URK25CS1209` | Hospital Request Processing & Emergency Prioritization | `src/lib/dsa/` |
| **Aneesha M** | `URK25CS1219` | Redistribution Review Worklist & Transfer Feasibility | `src/lib/dsa/` |
| **Angeline Maria S** | `URK25CS1224` | Drone Delivery Operations & Graph Algorithms | `src/lib/dsa/` |

---

## 1. Member 1 — Shirley Y. S. (URK25CS1081)

### Responsibility
**Inventory storage, searching and sorting:**
Managing blood unit inventory records, rapid $O(1)$ indexing by unique barcode/unit ID, searching by remaining shelf-life hours, multi-criteria inventory sorting, and expiry range queries using binary search trees.

### Exact Source Filenames
- `src/lib/dsa/inventoryHashTable.ts`
- `src/lib/dsa/binarySearch.ts`
- `src/lib/dsa/inventorySorting.ts`
- `src/lib/dsa/binarySearchTree.ts`

### Implemented Algorithms & Classes

#### 1. Hash Table
- **Exact Searchable Heading:**  
  `// DSA: HASH TABLE — INVENTORY STORAGE AND RETRIEVAL`
- **Class / Function:** `InventoryHashTableManager` (`lookup`, `insert`, `buildFromInventory`)
- **Viva Concept:** Uses polynomial rolling hash function (`hash = (hash * 31 + charCode) % capacity`) with separate chaining (linked list buckets) to resolve collisions.
- **Complexity:** Average $O(1)$ lookup/insert, Worst-case $O(n)$ when collisions cluster; Space $O(n + M)$.

#### 2. Binary Search
- **Exact Searchable Heading:**  
  `// DSA: BINARY SEARCH — EXPIRY-BASED SEARCH`
- **Class / Function:** `inventoryBinarySearch(units, targetRemainingHours, nowMs)`
- **Viva Concept:** Divides sorted inventory in half each step (`mid = Math.floor((left + right) / 2)`), comparing target hours against remaining shelf life until found or search interval is exhausted.
- **Complexity:** Time $O(\log n)$, Space $O(1)$ auxiliary.

#### 3. Bubble Sort
- **Exact Searchable Heading:**  
  `// DSA: BUBBLE SORT — INVENTORY SORTING`
- **Class / Function:** `bubbleSortBy(items, getVal, desc)`
- **Viva Concept:** Repeatedly steps through the inventory array, compares adjacent elements (`items[j]` and `items[j + 1]`), and swaps them if out of order. Optimized with an `earlyExit` flag when no swaps occur.
- **Complexity:** Time $O(n^2)$ worst/average, $O(n)$ best; Space $O(1)$ auxiliary.

#### 4. Selection Sort
- **Exact Searchable Heading:**  
  `// DSA: SELECTION SORT — INVENTORY SORTING`
- **Class / Function:** `selectionSortBy(items, getVal, desc)`
- **Viva Concept:** Divides array into sorted and unsorted subarrays; finds the minimum/maximum element in the unsorted portion and swaps it into its final sorted position `items[i]`.
- **Complexity:** Time $O(n^2)$ in all cases; Space $O(1)$ auxiliary.

#### 5. Insertion Sort
- **Exact Searchable Heading:**  
  `// DSA: INSERTION SORT — INVENTORY SORTING`
- **Class / Function:** `insertionSortBy(items, getVal, desc)`
- **Viva Concept:** Takes elements one by one (`current = items[i]`) and shifts larger elements to the right (`items[j + 1] = items[j]`) to insert `current` in its correct position.
- **Complexity:** Time $O(n^2)$ worst/average, $O(n)$ best; Space $O(1)$ auxiliary.

#### 6. Merge Sort
- **Exact Searchable Heading:**  
  `// DSA: MERGE SORT — INVENTORY SORTING`
- **Class / Function:** `mergeSortBy(items, getVal, desc)`
- **Viva Concept:** Divide-and-conquer algorithm. Recursively splits array into halves until singletons remain, then merges two sorted halves by pointer comparison (`leftPtr`, `rightPtr`). Stable sort.
- **Complexity:** Time $O(n \log n)$ in all cases; Space $O(n)$ for auxiliary arrays.

#### 7. Binary Search Tree (BST)
- **Exact Searchable Heading:**  
  `// DSA: BINARY SEARCH TREE — EXPIRY RANGE QUERY`
- **Class / Function:** `BinarySearchTree` (`insert`, `rangeSearch`, `inOrderTraversal`)
- **Viva Concept:** Hierarchical tree where left child $\le$ parent $<$ right child based on remaining shelf life. Range search efficiently prunes subtrees that lie outside $[minHours, maxHours]$.
- **Complexity:** Range query Time $O(h + k)$ where $h$ is height and $k$ is matches; Space $O(n)$.

### Connected Website Pages & Workflows
- **`/inventory` (Blood Inventory):** Real-time unit lookup by ID via Hash Table, remaining shelf-life search via Binary Search, dynamic inventory sorting (Bubble, Insertion, Selection, Merge) by expiry, quantity, and blood type, and BST range queries.
- **`/dsa-lab` (DSA Laboratory):** Step-by-step interactive Hash Table separate chaining and sorting algorithm benchmark visualizations.

---

## 2. Member 2 — Kaitlyn Grace J (URK25CS1209)

### Responsibility
**Hospital request processing:**
Managing incoming clinical transfusion requests from hospitals, tiered FIFO scheduling, and emergency triage prioritization using priority queues.

### Exact Source Filenames
- `src/lib/dsa/requestQueue.ts`
- `src/lib/dsa/requestPriorityQueue.ts`

### Implemented Algorithms & Classes

#### 1. Queue (FIFO)
- **Exact Searchable Heading:**  
  `// DSA: QUEUE — FIFO HOSPITAL REQUEST PROCESSING`
- **Class / Function:** `RequestQueue` (`enqueue`, `dequeue`, `peek`, `size`, `isEmpty`), `buildPriorityQueues`
- **Viva Concept:** First-In, First-Out (FIFO) discipline. Maintains three independent queues: Emergency, Urgent, and Routine. Requests within each priority band are processed in strict arrival order (`enqueue` at rear, `dequeue` from front).
- **Complexity:** Time $O(1)$ for enqueue and dequeue; Space $O(n)$.

#### 2. Priority Queue (Min-Heap)
- **Exact Searchable Heading:**  
  `// DSA: PRIORITY QUEUE — EMERGENCY REQUEST PRIORITISATION`
- **Class / Function:** `RequestPriorityQueue` (`insert`, `extractMin`, `peek`, `pop`), `buildRequestPriorityQueue`
- **Viva Concept:** Complete binary tree stored in a flat array where parent index is `Math.floor((i - 1) / 2)` and children are `2i + 1` and `2i + 2`. Min-heap property ensures root always holds the highest urgency request (Emergency rank 0 < Urgent rank 1 < Routine rank 2, with arrival timestamp tiebreaker). Uses `bubbleUp` on insertion and `sinkDown` on extraction.
- **Complexity:** Insert $O(\log n)$, Extract-Min $O(\log n)$, Peek $O(1)$; Space $O(n)$.

### Connected Website Pages & Workflows
- **`/requests` (Hospital Requests):** Clinical requisitions are partitioned into priority queues, allowing triage nurses to dispatch highest-urgency patients first.
- **`/dsa-lab` (DSA Laboratory):** Queue and Priority Queue interactive step traces showing heap percolation.

---

## 3. Member 3 — Aneesha M (URK25CS1219)

### Responsibility
**Redistribution planning:**
Managing the double-ended review worklist, cyclic blood bank rotation, and transfer-feasibility validation.

### Exact Source Filenames
- `src/lib/dsa/redistributionDeque.ts`
- `src/lib/dsa/circularLinkedList.ts`
- `src/lib/dsa/transferFeasibility.ts`

### Implemented Algorithms & Classes

#### 1. Double-Ended Queue (Deque)
- **Exact Searchable Heading:**  
  `// DSA: DEQUE — REDISTRIBUTION REVIEW WORKLIST`
- **Class / Function:** `RedistributionDeque` (`insertFront`, `insertRear`, `deleteFront`, `deleteRear`, `peekFront`, `peekRear`)
- **Viva Concept:** Allows insertion and removal at both ends. Emergency tasks (critical blood expiring in $< 24$h) are inserted at `front` (`insertFront`), while routine stock-balancing reviews are appended to `rear` (`insertRear`).
- **Complexity:** Time $O(1)$ insertion and peek; Space $O(n)$.

#### 2. Circular Linked List
- **Exact Searchable Heading:**  
  `// DSA: CIRCULAR LINKED LIST — BLOOD BANK ROTATION`
- **Class / Function:** `BloodBankCircularList` (`insert`, `advance`, `traverseOneCycle`)
- **Viva Concept:** Linked list where each node has `data` and `next`, with the last node pointing back to `head`. Enables fair round-robin cyclic rotation across all registered blood banks to guarantee audit completeness without infinite loops.
- **Complexity:** Advance $O(1)$, Full cycle traversal $O(n)$ where $n$ is number of blood banks; Space $O(n)$.

#### 3. Transfer Feasibility Engine
- **Exact Searchable Heading:**  
  `// DSA: TRANSFER FEASIBILITY — TIME AND EXPIRY VALIDATION`
- **Class / Function:** `checkTransferFeasibility(input)`, `checkBatchFeasibility(units, ...)`
- **Viva Concept:** Validates whether redistributing a blood unit to another facility is mathematically viable:
  $$\text{Total Required Time} = \text{Transport Duration} + \text{Processing Handling} + \text{Safety Buffer}$$
  $$\text{Feasible} \iff \text{Remaining Usable Shelf Life} \ge \text{Total Required Time}$$
  Prevents dispatching units that would expire mid-flight or upon arrival.
- **Complexity:** Single unit check $O(1)$ time and $O(1)$ space; Batch check $O(m)$ time for $m$ units.

### Connected Website Pages & Workflows
- **`/redistribution` (Redistribution Planner):** Generates surplus/shortage transfer plans, prioritizes urgent reviews using Deque, traverses participating blood banks using Circular Linked List, and validates each planned transfer with Transfer Feasibility.
- **`/transfer-tracking` (Transfer Tracking):** Displays verified, feasible transfers in transit with live progress.

---

## 4. Member 4 — Angeline Maria S (URK25CS1224)

### Responsibility
**Drone delivery operations & graph algorithms:**
Aerial delivery pathfinding across blood bank nodes, shortest weighted route calculations, and fixed-capacity drone telemetry buffering.

### Exact Source Filenames
- `src/lib/dsa/graphTraversal.ts`
- `src/lib/dsa/dijkstra.ts`
- `src/lib/dsa/circularQueue.ts`

### Implemented Algorithms & Classes

#### 1. Breadth-First Search (BFS)
- **Exact Searchable Heading:**  
  `// DSA: BFS — BREADTH-FIRST GRAPH TRAVERSAL`
- **Class / Function:** `runBFS(nodes, edges, startId, endId)`
- **Viva Concept:** Traverses drone delivery network level-by-level using a FIFO queue and visited Set. Guarantees the path with minimum number of flight hops in an unweighted network.
- **Complexity:** Time $O(V + E)$, Space $O(V)$ for queue, visited set, and parent map.

#### 2. Depth-First Search (DFS)
- **Exact Searchable Heading:**  
  `// DSA: DFS — DEPTH-FIRST GRAPH TRAVERSAL`
- **Class / Function:** `runDFS(nodes, edges, startId, endId)`
- **Viva Concept:** Explores as deep as possible along corridor branches using a LIFO stack before backtracking. Used for connectivity and corridor reachability analysis.
- **Complexity:** Time $O(V + E)$, Space $O(V)$ for stack and visited set.

#### 3. Dijkstra's Algorithm
- **Exact Searchable Heading:**  
  `// DSA: DIJKSTRA — SHORTEST WEIGHTED ROUTE`
- **Class / Function:** `runDijkstra(nodes, edges, startId, endId)`, `getShortestDistance`, `estimateFlightTime`
- **Viva Concept:** Finds the minimum physical flight distance (km) route. Maintains a tentative distance map initialized to $\infty$ (except start $= 0$). At each step, picks the unvisited node with minimum tentative distance and relaxes its outgoing corridor edges:
  $$\text{if } d[u] + w(u, v) < d[v] \implies d[v] = d[u] + w(u, v), \quad \text{parent}[v] = u$$
  Requires non-negative edge weights (validated at runtime). Backtracks via parent pointers.
- **Complexity:** Time $O(V^2)$ linear scan / $O((V + E) \log V)$ priority queue; Space $O(V)$.

#### 4. Circular Queue (Ring Buffer)
- **Exact Searchable Heading:**  
  `// DSA: CIRCULAR QUEUE — DRONE TELEMETRY BUFFER`
- **Class / Function:** `TelemetryCircularQueue` (`push`, `dequeue`, `peek`, `getSnapshot`, `enqueueWithOverwrite`)
- **Viva Concept:** Fixed-capacity array of size $K$ (e.g., 8 slots) with `front` and `rear` pointers. Wraparound achieved via modular arithmetic:
  $$\text{rear} = (\text{rear} + 1) \pmod{\text{capacity}}$$
  When the ring buffer is full, the oldest event at `front` is evicted (overwritten) in $O(1)$ time, maintaining bounded memory for continuous telemetry logs.
- **Complexity:** Enqueue with overwrite $O(1)$, Dequeue $O(1)$, Peek $O(1)$; Space $O(K)$ bounded memory.

### Connected Website Pages & Workflows
- **`/drone-simulation` (Drone Simulation):** Interactive canvas rendering real-time drone flights between blood banks. Allows switching pathfinding between Dijkstra (shortest distance), BFS (minimum hops), and DFS (deep traversal). Renders live ring buffer telemetry events.
- **`/transfer-tracking`:** Uses shortest route distances and flight times for tracking.

---

## 5. Verification & Build Status

- **TypeScript Compilation:** Passed with 0 errors (`npm run build`).
- **Core Engine DSA Tests (`dsa-engine.test.ts`):** 92/92 passed.
- **Member-Specific DSA Tests (`member-dsa.test.ts`):** 46/46 passed (including BST range query).
- **Authentication & Security Tests (`auth.test.ts`):** 69/69 passed.
- **Total Test Suite:** 207 tests passed, 0 failures.
- **Next.js Production Build:** All 26 static/dynamic routes successfully compiled.

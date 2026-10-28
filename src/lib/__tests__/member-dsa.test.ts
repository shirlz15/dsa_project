// ═══════════════════════════════════════════════════════════════════════════════
// Blood Navigator — Team Members DSA Verification Test Suite
//
// Validates all DSA modules implemented by the four team members:
// Member 1 — Shirley Y. S. (URK25CS1081): Inventory Management
// Member 2 — Kaitlyn Grace J (URK25CS1209): Hospital Requests & Prioritization
// Member 3 — Aneesha M (URK25CS1219): Redistribution Review & Feasibility
// Member 4 — Angeline Maria S (URK25CS1224): Drone Delivery Network & Telemetry
// ═══════════════════════════════════════════════════════════════════════════════

import {
  InventoryHashTableManager,
  inventoryBinarySearch,
  sortInventory,
  BinarySearchTree,
  RequestQueue,
  buildPriorityQueues,
  RequestPriorityQueue,
  buildRequestPriorityQueue,
  RedistributionDeque,
  BloodBankCircularList,
  checkTransferFeasibility,
  runBFS,
  runDFS,
  runDijkstra,
  getShortestDistance,
  estimateFlightTime,
  TelemetryCircularQueue,
} from '../dsa';

import { InventoryUnit, BloodRequest, BloodBank, GraphNode, GraphEdge } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('\n=== RUNNING FOUR-MEMBER DSA CONTRIBUTION TEST SUITE ===\n');

// ─── MEMBER 1: Shirley Y. S. (URK25CS1081) ──────────────────────────────────
console.log('--- Member 1: Shirley Y. S. (URK25CS1081) — Inventory Management ---');

const nowMs = Date.now();

const sampleUnits: InventoryUnit[] = [
  {
    id: 'INV-001',
    bloodBankId: 'bb-1',
    bloodType: 'O+',
    componentType: 'Packed RBC',
    quantity: 5,
    collectionTimestamp: new Date(nowMs - 5 * 86400000).toISOString(),
    expiryTimestamp: new Date(nowMs + 30 * 3600000).toISOString(),
    status: 'available',
    storageTemp: '2-6°C',
    transportEligible: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'INV-002',
    bloodBankId: 'bb-2',
    bloodType: 'A-',
    componentType: 'Platelets',
    quantity: 2,
    collectionTimestamp: new Date(nowMs - 2 * 86400000).toISOString(),
    expiryTimestamp: new Date(nowMs + 10 * 3600000).toISOString(),
    status: 'available',
    storageTemp: '20-24°C',
    transportEligible: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'INV-003',
    bloodBankId: 'bb-1',
    bloodType: 'B+',
    componentType: 'Fresh Frozen Plasma',
    quantity: 8,
    collectionTimestamp: new Date(nowMs - 10 * 86400000).toISOString(),
    expiryTimestamp: new Date(nowMs + 50 * 3600000).toISOString(),
    status: 'available',
    storageTemp: '-18°C',
    transportEligible: true,
    lastUpdated: new Date().toISOString(),
  },
];

const hashMgr = new InventoryHashTableManager(31);
hashMgr.buildFromInventory(sampleUnits);

const lookup1 = hashMgr.lookup('INV-001');
assert(lookup1.found === true, 'Member 1: InventoryHashTableManager finds existing unit INV-001');
assert(lookup1.unit?.id === 'INV-001', 'Member 1: Retrieved unit data is exact');
assert(lookup1.capacity === 31, 'Member 1: Capacity matches prime bucket allocation (31)');

const lookupMissing = hashMgr.lookup('INV-MISSING');
assert(lookupMissing.found === false, 'Member 1: Returns found: false for absent key');
assert(lookupMissing.unit === undefined, 'Member 1: Unit is undefined for absent key');

// Test inventoryBinarySearch
const bSearchRes = inventoryBinarySearch(sampleUnits, 10, nowMs);
assert(bSearchRes.found === true, 'Member 1: inventoryBinarySearch locates exact 10h remaining shelf-life');
assert(bSearchRes.unit?.id === 'INV-002', 'Member 1: Binary search returns matching unit');
assert(bSearchRes.steps.length > 0, 'Member 1: Binary search logs comparison steps');

const bSearchMiss = inventoryBinarySearch(sampleUnits, 999, nowMs);
assert(bSearchMiss.found === false, 'Member 1: Binary search correctly returns found: false for non-matching hours');

// Test sortInventory
const sortedByQty = sortInventory(sampleUnits, 'quantity', 'insertion', nowMs);
assert(sortedByQty.sorted[0].quantity === 8, 'Member 1: sortInventory correctly orders by quantity descending');
assert(sortedByQty.metrics.algoName.includes('Insertion'), 'Member 1: Insertion sort metrics recorded');

const sortedByExpiry = sortInventory(sampleUnits, 'expiry', 'merge', nowMs);
assert(sortedByExpiry.sorted[0].id === 'INV-002', 'Member 1: Merge sort orders earliest expiry first');

// Test BinarySearchTree range query
const bst = new BinarySearchTree<InventoryUnit>();
// INV-002 has 10h remaining, INV-001 has 30h remaining, INV-003 has 50h remaining
bst.insert(10, sampleUnits[1]);
bst.insert(30, sampleUnits[0]);
bst.insert(50, sampleUnits[2]);

const bstRange = bst.rangeSearch(5, 35);
assert(bstRange.items.length === 2, 'Member 1: BST range search finds 2 units between 5h and 35h');
assert(bstRange.items[0].id === 'INV-002' && bstRange.items[1].id === 'INV-001', 'Member 1: BST range query preserves sorted order');

// ─── MEMBER 2: Kaitlyn Grace J (URK25CS1209) ────────────────────────────────
console.log('\n--- Member 2: Kaitlyn Grace J (URK25CS1209) — Hospital Requests & Prioritization ---');

const sampleRequests: BloodRequest[] = [
  {
    id: 'REQ-001',
    destinationBankId: 'bb-5',
    bloodType: 'O-',
    componentType: 'Packed RBC',
    quantity: 2,
    priority: 'emergency',
    status: 'pending',
    createdAt: new Date(nowMs - 300000).toISOString(),
    neededBy: new Date(nowMs + 3600000).toISOString(),
    notes: 'Emergency trauma transfusion',
  },
  {
    id: 'REQ-002',
    destinationBankId: 'bb-5',
    bloodType: 'A+',
    componentType: 'Fresh Frozen Plasma',
    quantity: 1,
    priority: 'routine',
    status: 'pending',
    createdAt: new Date(nowMs - 600000).toISOString(),
    neededBy: new Date(nowMs + 72000000).toISOString(),
    notes: 'Elective surgical reserve',
  },
  {
    id: 'REQ-003',
    destinationBankId: 'bb-3',
    bloodType: 'B+',
    componentType: 'Platelets',
    quantity: 3,
    priority: 'urgent',
    status: 'pending',
    createdAt: new Date(nowMs - 400000).toISOString(),
    neededBy: new Date(nowMs + 18000000).toISOString(),
    notes: 'Thrombocytopenia urgent replacement',
  },
];

// Test RequestQueue and buildPriorityQueues
const { emergencyQueue, urgentQueue, routineQueue, unifiedQueueList } = buildPriorityQueues(sampleRequests);
assert(emergencyQueue.size() === 1, 'Member 2: Emergency queue contains 1 item');
assert(urgentQueue.size() === 1, 'Member 2: Urgent queue contains 1 item');
assert(routineQueue.size() === 1, 'Member 2: Routine queue contains 1 item');
assert(unifiedQueueList[0].request.priority === 'emergency', 'Member 2: Unified list orders emergency tier first');
assert(unifiedQueueList[1].request.priority === 'urgent', 'Member 2: Unified list orders urgent tier second');
assert(unifiedQueueList[2].request.priority === 'routine', 'Member 2: Unified list orders routine tier third');

// Test RequestPriorityQueue (Min-Heap)
const pq = buildRequestPriorityQueue(sampleRequests);
assert(pq.size() === 3, 'Member 2: Priority queue builds heap of 3 requests');
const highestPriority = pq.pop();
assert(highestPriority?.id === 'REQ-001', 'Member 2: Priority queue pops emergency request first');
const secondHighest = pq.pop();
assert(secondHighest?.id === 'REQ-003', 'Member 2: Priority queue pops urgent request second');
const thirdHighest = pq.pop();
assert(thirdHighest?.id === 'REQ-002', 'Member 2: Priority queue pops routine request third');
assert(pq.isEmpty(), 'Member 2: Priority queue is empty after popping all requests');

// ─── MEMBER 3: Aneesha M (URK25CS1219) ──────────────────────────────────────
console.log('\n--- Member 3: Aneesha M (URK25CS1219) — Redistribution Review & Feasibility ---');

// Test RedistributionDeque
const deque = new RedistributionDeque();
deque.insertRear({
  id: 'TASK-ROUTINE',
  title: 'Routine check',
  description: 'Weekly scheduled surplus inventory alignment',
  reason: 'Periodic rebalancing policy',
  priority: 'routine',
  queueEnd: 'rear',
  timestamp: new Date().toISOString(),
});
deque.insertFront({
  id: 'TASK-EMERGENCY',
  title: 'Urgent expiry hazard',
  description: 'Unit approaching 12h expiry window at Ramanathapuram',
  reason: 'Critical expiry threat requires immediate planner action',
  priority: 'emergency',
  queueEnd: 'front',
  timestamp: new Date().toISOString(),
});

assert(deque.size() === 2, 'Member 3: RedistributionDeque stores 2 tasks');
assert(deque.peekFront()?.id === 'TASK-EMERGENCY', 'Member 3: Front task is emergency priority');
assert(deque.peekRear()?.id === 'TASK-ROUTINE', 'Member 3: Rear task is routine priority');
const poppedFront = deque.deleteFront();
assert(poppedFront?.id === 'TASK-EMERGENCY', 'Member 3: deleteFront extracts emergency task');

// Test BloodBankCircularList
const sampleBanks: BloodBank[] = [
  { id: 'bb-1', name: 'Bank 1', city: 'City 1', address: '123 Main St', lat: 9.3, lng: 78.8, capacity: 200, contact: '111', emergencyActive: false, status: 'active', createdAt: new Date().toISOString() },
  { id: 'bb-2', name: 'Bank 2', city: 'City 2', address: '456 Cross St', lat: 9.4, lng: 78.9, capacity: 150, contact: '222', emergencyActive: false, status: 'active', createdAt: new Date().toISOString() },
  { id: 'bb-3', name: 'Bank 3', city: 'City 3', address: '789 High St', lat: 9.5, lng: 79.0, capacity: 100, contact: '333', emergencyActive: false, status: 'active', createdAt: new Date().toISOString() },
];

const circularList = new BloodBankCircularList();
circularList.buildFromBanks(sampleBanks);
const cycleTraversal = circularList.traverseOneCycle();
assert(cycleTraversal.length === 3, 'Member 3: BloodBankCircularList traverses exactly one cycle of 3 banks');
assert(cycleTraversal[0].id === 'bb-1' && cycleTraversal[2].id === 'bb-3', 'Member 3: Cyclic traversal preserves sequence');

// Test checkTransferFeasibility
const feasibleCheck = checkTransferFeasibility({
  unit: sampleUnits[0], // 30h remaining
  transportDurationMin: 60,
  processingDurationMin: 30,
  safetyMarginMin: 30,
  nowMs,
});
assert(feasibleCheck.feasible === true, 'Member 3: checkTransferFeasibility accepts viable unit');
assert(feasibleCheck.usableTimeAfterTransferMin > 0, 'Member 3: Usable time after transfer is positive');

const expiredUnit: InventoryUnit = {
  ...sampleUnits[0],
  id: 'INV-EXPIRED',
  expiryTimestamp: new Date(nowMs - 3600000).toISOString(),
  lastUpdated: new Date().toISOString(),
};
const infeasibleCheck = checkTransferFeasibility({
  unit: expiredUnit,
  transportDurationMin: 60,
  processingDurationMin: 30,
  safetyMarginMin: 30,
  nowMs,
});
assert(infeasibleCheck.feasible === false, 'Member 3: Expired unit is rejected as infeasible');
assert(infeasibleCheck.reason.includes('expired'), 'Member 3: Clear rejection reason provided');

// ─── MEMBER 4: Angeline Maria S (URK25CS1224) ───────────────────────────────
console.log('\n--- Member 4: Angeline Maria S (URK25CS1224) — Drone Delivery Network & Telemetry ---');

const nodes: GraphNode[] = [
  { id: 'N1', label: 'Ramanathapuram GH', x: 100, y: 100, type: 'blood_bank' },
  { id: 'N2', label: 'Paramakudi GH', x: 200, y: 100, type: 'blood_bank' },
  { id: 'N3', label: 'Madurai GRH', x: 300, y: 100, type: 'blood_bank' },
];

const edges: GraphEdge[] = [
  { from: 'N1', to: 'N2', weight: 30, blocked: false },
  { from: 'N2', to: 'N3', weight: 40, blocked: false },
];

// Test runBFS and runDFS
const bfsRes = runBFS(nodes, edges, 'N1', 'N3');
assert(bfsRes.path.length === 3, 'Member 4: runBFS finds path across 3 nodes');
assert(bfsRes.path[0] === 'N1' && bfsRes.path[2] === 'N3', 'Member 4: BFS path start and end match');

const dfsRes = runDFS(nodes, edges, 'N1', 'N3');
assert(dfsRes.path.length === 3, 'Member 4: runDFS traverses corridor to destination');

// Test runDijkstra
const dijkstraRes = runDijkstra(nodes, edges, 'N1', 'N3');
assert(dijkstraRes.distance === 70, 'Member 4: runDijkstra computes optimal 70km distance');
assert(dijkstraRes.path.join('->') === 'N1->N2->N3', 'Member 4: Dijkstra path sequence is exact');

const shortestDist = getShortestDistance(nodes, edges, 'N1', 'N3');
assert(shortestDist === 70, 'Member 4: getShortestDistance helper returns 70');

const estTime = estimateFlightTime(nodes, edges, 'N1', 'N3', 60, 5); // 70km @ 60km/h = 70 min + 5 min delay
assert(estTime === 75, 'Member 4: estimateFlightTime calculates flight time + delay accurately (75m)');

// Test TelemetryCircularQueue
const ringBuffer = new TelemetryCircularQueue(3);
assert(ringBuffer.capacity === 3, 'Member 4: Ring buffer capacity is 3');
ringBuffer.enqueueWithOverwrite({
  id: 'tel-1',
  timestamp: '10:00:00',
  eventType: 'mission_started',
  message: 'Drone launched',
  droneId: 'alpha-1',
  batteryPercent: 100,
  currentCoord: { x: 100, y: 100 },
});
ringBuffer.enqueueWithOverwrite({
  id: 'tel-2',
  timestamp: '10:05:00',
  eventType: 'waypoint_reached',
  message: 'Passed waypoint 1',
  droneId: 'alpha-1',
  batteryPercent: 90,
  currentCoord: { x: 200, y: 100 },
});
ringBuffer.enqueueWithOverwrite({
  id: 'tel-3',
  timestamp: '10:10:00',
  eventType: 'eta_updated',
  message: 'Approaching destination corridor',
  droneId: 'alpha-1',
  batteryPercent: 80,
  currentCoord: { x: 300, y: 100 },
});
assert(ringBuffer.isFull() === true, 'Member 4: Ring buffer is full at capacity 3');

// Overwrite test
ringBuffer.enqueueWithOverwrite({
  id: 'tel-4',
  timestamp: '10:12:00',
  eventType: 'battery_changed',
  message: 'Payload delivered',
  droneId: 'alpha-1',
  batteryPercent: 78,
  currentCoord: { x: 300, y: 100 },
});
assert(ringBuffer.size() === 3, 'Member 4: Ring buffer maintains capacity 3 after overwrite');
const snapshot = ringBuffer.getSnapshot();
assert(snapshot.buffer.some((e) => e?.id === 'tel-4'), 'Member 4: Overwritten buffer contains newest telemetry event');

console.log('\n=============================================');
console.log(`FOUR-MEMBER DSA TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log('=============================================\n');

if (failed > 0) {
  process.exit(1);
}

// ─── Blood Navigator — Comprehensive DSA & Feasibility Test Suite ─────────────
// Tests all custom data structures, search algorithms, sort algorithms,
// graph algorithms, feasibility formulas, and undo stack mechanics.

import {
  Stack, Queue, CircularQueue, LinkedList, CircularLinkedList, Deque,
  HashTable, linearSearch, binarySearch, interpolationSearch,
  bubbleSort, selectionSort, insertionSort, mergeSort,
  bubbleSortBy, selectionSortBy, insertionSortBy, mergeSortBy,
  bfs, dfs, dijkstra, BinarySearchTree
} from '../dsa-engine';
import { calculateFeasibility } from '../feasibility-engine';
import { BloodBank, InventoryUnit, BloodRequest, GraphNode, GraphEdge } from '../types';

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

console.log('\n=== RUNNING BLOOD NAVIGATOR DSA TEST SUITE ===\n');

// ─── 1. STACK TESTS ─────────────────────────────────────────────────────────
console.log('--- 1. Testing Stack (LIFO for Action History & Undo) ---');
const stack = new Stack<string>();
assert(stack.isEmpty(), 'Stack initializes empty');
assert(stack.size() === 0, 'Stack initial size is 0');
assert(stack.pop() === undefined, 'Stack underflow returns undefined safely');

stack.push('action-1');
stack.push('action-2');
stack.push('action-3');
assert(stack.size() === 3, 'Stack pushes elements correctly');
assert(stack.peek() === 'action-3', 'Stack peek returns top element without popping (LIFO)');
assert(stack.pop() === 'action-3', 'Stack pop removes top element (LIFO)');
assert(stack.size() === 2, 'Stack size decrements after pop');
assert(stack.pop() === 'action-2', 'Stack pop returns second element');
assert(stack.pop() === 'action-1', 'Stack pop returns first element');
assert(stack.isEmpty(), 'Stack is empty after popping all elements');

// ─── 2. QUEUE TESTS ─────────────────────────────────────────────────────────
console.log('\n--- 2. Testing Queue (FIFO for Blood Request Processing) ---');
const queue = new Queue<string>();
assert(queue.isEmpty(), 'Queue initializes empty');
assert(queue.dequeue() === undefined, 'Queue underflow returns undefined safely');

queue.enqueue('req-001');
queue.enqueue('req-002');
queue.enqueue('req-003');
assert(queue.size() === 3, 'Queue enqueues elements correctly');
assert(queue.peek() === 'req-001', 'Queue peek returns front element (FIFO)');
assert(queue.front() === 'req-001', 'Queue front returns first enqueued element');
assert(queue.rear() === 'req-003', 'Queue rear returns last enqueued element');
assert(queue.dequeue() === 'req-001', 'Queue dequeue returns first element in (FIFO)');
assert(queue.dequeue() === 'req-002', 'Queue dequeue maintains strict arrival order');
assert(queue.size() === 1, 'Queue size is 1 after 2 dequeues');

// ─── 3. CIRCULAR QUEUE TESTS ────────────────────────────────────────────────
console.log('\n--- 3. Testing Circular Queue (Ring Buffer for Telemetry Events) ---');
const cq = new CircularQueue<string>(3);
assert(cq.isEmpty(), 'Circular queue initializes empty');
assert(cq.capacity === 3, 'Circular queue capacity is set to 3');
assert(cq.enqueue('event-A'), 'Enqueues item 1');
assert(cq.enqueue('event-B'), 'Enqueues item 2');
assert(cq.enqueue('event-C'), 'Enqueues item 3');
assert(cq.isFull(), 'Circular queue reports full when capacity reached');
assert(!cq.enqueue('event-D'), 'Standard enqueue rejects when full (does not silently overwrite)');

// Test enqueueWithOverwrite wraparound
const ovRes = cq.enqueueWithOverwrite('event-D');
assert(ovRes.overwritten, 'enqueueWithOverwrite handles full buffer by evicting oldest');
assert(ovRes.evicted === 'event-A', 'Oldest event (event-A) was evicted');
assert(cq.peek() === 'event-B', 'New front is event-B after wraparound');

// ─── 4. LINKED LIST TESTS ───────────────────────────────────────────────────
console.log('\n--- 4. Testing Linked List (Node Chain for Inventory Management) ---');
const ll = new LinkedList<{ id: string; qty: number }>();
assert(ll.isEmpty(), 'Linked list initializes empty');
ll.insertAtHead({ id: 'inv-2', qty: 2 });
ll.insertAtHead({ id: 'inv-1', qty: 1 });
ll.insertAtTail({ id: 'inv-3', qty: 3 });

const traversed = ll.traverse();
assert(traversed.length === 3, 'Linked list traverses all 3 nodes');
assert(traversed[0].id === 'inv-1' && traversed[2].id === 'inv-3', 'Linked list maintains correct node order');

const searchFound = ll.search({ id: 'inv-2', qty: 2 });
assert(searchFound.found && searchFound.position === 1, 'Linked list searches and finds node at position 1');

ll.deleteByValue({ id: 'inv-2', qty: 2 });
assert(ll.size() === 2, 'Linked list deletes node by value and updates size');
assert(ll.traverse().map((x) => x.id).join(',') === 'inv-1,inv-3', 'Node links reconnected properly after deletion');

// ─── 5. CIRCULAR LINKED LIST TESTS ──────────────────────────────────────────
console.log('\n--- 5. Testing Circular Linked List (Closed Bank Review Rotation) ---');
const cll = new CircularLinkedList<string>();
assert(cll.isEmpty(), 'Circular linked list initializes empty');
cll.insert('Bank-A');
cll.insert('Bank-B');
cll.insert('Bank-C');

assert(cll.size() === 3, 'Circular linked list contains 3 nodes');
assert(cll.head?.next?.next?.next === cll.head, 'Tail node points back to head node (closed cycle)');

const cycleNodes = cll.traverseOneCycle();
assert(cycleNodes.length === 3, 'traverseOneCycle terminates after exactly one round (3 nodes)');
assert(cycleNodes.join(' -> ') === 'Bank-A -> Bank-B -> Bank-C', 'Cycle traversal visits nodes in insertion sequence');

cll.delete('Bank-B');
assert(cll.size() === 2, 'Deleted middle node from circular linked list');
assert(cll.head?.next?.next === cll.head, 'Cycle intact after deletion: Bank-A -> Bank-C -> Bank-A');

// ─── 6. DEQUE TESTS ─────────────────────────────────────────────────────────
console.log('\n--- 6. Testing Deque (Double-Ended Review Worklist) ---');
const deque = new Deque<string>();
assert(deque.isEmpty(), 'Deque initializes empty');
deque.insertRear('routine-1');
deque.insertFront('emergency-1');
deque.insertRear('routine-2');
deque.insertFront('emergency-0');

assert(deque.size() === 4, 'Deque inserts at both front and rear');
assert(deque.peekFront() === 'emergency-0', 'Front peek returns highest priority task');
assert(deque.peekRear() === 'routine-2', 'Rear peek returns routine task');
assert(deque.deleteFront() === 'emergency-0', 'deleteFront removes from front');
assert(deque.deleteRear() === 'routine-2', 'deleteRear removes from rear');
assert(deque.size() === 2, 'Deque size updated after deletions at both ends');

// ─── 7. HASH TABLE TESTS ────────────────────────────────────────────────────
console.log('\n--- 7. Testing Hash Table (O(1) Unit & Bank ID Lookup with Separate Chaining) ---');
const ht = new HashTable<string, { type: string; units: number }>(5); // small capacity to force collision test
ht.insert('INV-01', { type: 'A+', units: 10 });
ht.insert('INV-02', { type: 'O-', units: 5 });
ht.insert('INV-03', { type: 'B+', units: 8 });

const lookup1 = ht.lookup('INV-01');
assert(lookup1.found && lookup1.value?.type === 'A+', 'Hash table successfully retrieves existing key');

const lookupMissing = ht.lookup('INV-999');
assert(!lookupMissing.found && lookupMissing.value === undefined, 'Hash table reports not found for missing key');

ht.delete('INV-01');
const lookupDeleted = ht.lookup('INV-01');
assert(!lookupDeleted.found, 'Hash table successfully deletes key from bucket');

// ─── 8. SEARCH ALGORITHMS TESTS ─────────────────────────────────────────────
console.log('\n--- 8. Testing Search Algorithms (Linear, Binary, Interpolation) ---');
const unsorted = [42, 10, 88, 23, 7, 55];
const linRes = linearSearch(unsorted, 23);
assert(linRes.found && linRes.index === 3, 'Linear search finds target in unsorted array');
assert(linRes.comparisons === 4, 'Linear search comparison count is accurate');

const sorted = [10, 20, 30, 40, 50, 60, 70, 80];
const binRes = binarySearch(sorted, 50);
assert(binRes.found && binRes.index === 4, 'Binary search finds target in sorted array');
assert(binRes.comparisons <= 4, 'Binary search logarithmic comparison bound holds');

const binMissing = binarySearch(sorted, 95);
assert(!binMissing.found && binMissing.index === -1, 'Binary search handles absent key correctly');

// Interpolation search tests
const uniformKeys = [100, 200, 300, 400, 500, 600, 700];
const interpRes = interpolationSearch(uniformKeys, 400);
assert(interpRes.found && interpRes.index === 3, 'Interpolation search finds target via numeric probe');

// Edge cases for interpolation search
assert(!interpolationSearch([], 100).found, 'Interpolation search handles empty array');
assert(!interpolationSearch(uniformKeys, 50).found, 'Interpolation search handles target below minimum');
assert(!interpolationSearch(uniformKeys, 999).found, 'Interpolation search handles target above maximum');
const equalEndpoints = [10, 10, 10, 10];
assert(interpolationSearch(equalEndpoints, 10).found, 'Interpolation search handles equal endpoints without zero division');

// ─── 9. SORTING ALGORITHMS TESTS ────────────────────────────────────────────
console.log('\n--- 9. Testing Sorting Algorithms (Bubble, Selection, Insertion, Merge) ---');
const rawNums = [64, 34, 25, 12, 22, 11, 90];
const expectedSorted = [11, 12, 22, 25, 34, 64, 90];

assert(JSON.stringify(bubbleSort(rawNums).sorted) === JSON.stringify(expectedSorted), 'Bubble sort sorts correctly');
assert(JSON.stringify(selectionSort(rawNums).sorted) === JSON.stringify(expectedSorted), 'Selection sort sorts correctly');
assert(JSON.stringify(insertionSort(rawNums).sorted) === JSON.stringify(expectedSorted), 'Insertion sort sorts correctly');
assert(JSON.stringify(mergeSort(rawNums).sorted) === JSON.stringify(expectedSorted), 'Merge sort sorts correctly');

// Record sorting with deterministic tie-breaking
interface DummyUnit { id: string; expiry: number }
const unitsToSort: DummyUnit[] = [
  { id: 'u-3', expiry: 300 },
  { id: 'u-1', expiry: 100 },
  { id: 'u-2b', expiry: 200 },
  { id: 'u-2a', expiry: 200 },
];
const tieBreak = (a: DummyUnit, b: DummyUnit) => a.id.localeCompare(b.id);
const sortedRecords = mergeSortBy(unitsToSort, (u) => u.expiry, tieBreak);
assert(sortedRecords.sorted[0].id === 'u-1', 'MergeSortBy sorts ascending by expiry key');
assert(sortedRecords.sorted[1].id === 'u-2a' && sortedRecords.sorted[2].id === 'u-2b', 'MergeSortBy resolves ties deterministically via tie-breaker');

// ─── 10. GRAPH ALGORITHMS TESTS (BFS, DFS, Dijkstra) ────────────────────────
console.log('\n--- 10. Testing Graph Algorithms (Corridor Routing) ---');
const nodes: GraphNode[] = [
  { id: 'A', label: 'Bank A', x: 0, y: 0, type: 'blood_bank' },
  { id: 'B', label: 'Waypoint B', x: 10, y: 10, type: 'waypoint' },
  { id: 'C', label: 'Waypoint C', x: 20, y: 20, type: 'waypoint' },
  { id: 'D', label: 'Bank D', x: 30, y: 30, type: 'blood_bank' },
  { id: 'Isolated', label: 'Unreachable', x: 100, y: 100, type: 'waypoint' },
];

const edges: GraphEdge[] = [
  { from: 'A', to: 'B', weight: 10, blocked: false },
  { from: 'B', to: 'C', weight: 15, blocked: false },
  { from: 'C', to: 'D', weight: 10, blocked: false },
  { from: 'A', to: 'D', weight: 50, blocked: false }, // longer direct edge
];

const bfsRes = bfs(nodes, edges, 'A', 'D');
assert(bfsRes.path.length > 0 && bfsRes.path[0] === 'A' && bfsRes.path[bfsRes.path.length - 1] === 'D', 'BFS finds reachable path');

const dfsRes = dfs(nodes, edges, 'A', 'D');
assert(dfsRes.path.length > 0 && dfsRes.path[0] === 'A' && dfsRes.path[dfsRes.path.length - 1] === 'D', 'DFS finds reachable path');

const dijkstraRes = dijkstra(nodes, edges, 'A', 'D');
assert(dijkstraRes.distance === 35, 'Dijkstra finds optimal shortest weighted route: A -> B -> C -> D (35km < 50km)');
assert(JSON.stringify(dijkstraRes.path) === JSON.stringify(['A', 'B', 'C', 'D']), 'Dijkstra path sequence is exact');

const unreachableRes = dijkstra(nodes, edges, 'A', 'Isolated');
assert(unreachableRes.path.length === 0, 'Dijkstra reports unreachable when no path exists');

// ─── 11. FEASIBILITY FORMULA & TIME-AWARE ENGINE TESTS ──────────────────────
console.log('\n--- 11. Testing Time-Aware Feasibility Engine & Route Delay ---');
const now = Date.now();
const testBank: BloodBank = {
  id: 'bb-test', name: 'Test Centre', city: 'Test City', address: '123 Test St',
  lat: 0, lng: 0, capacity: 50, contact: '123', emergencyActive: false, createdAt: new Date().toISOString()
};

// Unit with 4 hours remaining (240 minutes)
const freshUnit: InventoryUnit = {
  id: 'inv-fresh', bloodBankId: 'bb-src', componentType: 'Packed RBC', bloodType: 'O+',
  collectionTimestamp: new Date(now - 86400000).toISOString(),
  expiryTimestamp: new Date(now + 240 * 60000).toISOString(),
  quantity: 5, status: 'available', storageTemp: '4C', transportEligible: true,
  lastUpdated: new Date().toISOString(),
};

// Test feasibility under normal transport (30 min transport + 30 min processing + 30 min safety = 90 min)
// remaining = 240, required = 90 -> usable = 150 > 0 -> Feasible!
const normalFeasibility = calculateFeasibility({
  sourceUnits: [freshUnit],
  destinationBank: testBank,
  request: null,
  transportDuration: 30,
  receivingProcessingDuration: 30,
  safetyMargin: 30,
  now,
  allInventory: [freshUnit],
});
assert(normalFeasibility[0].feasible, 'Normal transport evaluates as feasible');
assert(normalFeasibility[0].usableTimeAfterTransfer === 150, 'usableTimeAfterTransfer calculated accurately (150 min)');

// Test route delay introducing infeasibility
// Transport delayed to 200 min -> required = 200 + 30 + 30 = 260 min > 240 min remaining -> Infeasible!
const delayedFeasibility = calculateFeasibility({
  sourceUnits: [freshUnit],
  destinationBank: testBank,
  request: null,
  transportDuration: 200, // delay
  receivingProcessingDuration: 30,
  safetyMargin: 30,
  now,
  allInventory: [freshUnit],
});
assert(!delayedFeasibility[0].feasible, 'Excessive route delay triggers recalculation and marks candidate as infeasible');
assert(delayedFeasibility[0].usableTimeAfterTransfer < 0, 'usableTimeAfterTransfer correctly drops below 0');

// ─── 12. BINARY SEARCH TREE (BST) TESTS (CO4) ────────────────────────────────
console.log('\n--- 12. Testing Binary Search Tree (CO4: Engineering Expiry Tree Index & Range Retrieval) ---');
const bst = new BinarySearchTree<{ id: string; bloodType: string }>();
assert(bst.isEmpty(), 'BST initializes empty');
assert(bst.size === 0, 'BST initial size is 0');
assert(bst.findMin() === null, 'BST findMin returns null on empty tree');

// Insert timestamp keys (simulated expiry hours: 10h, 5h, 20h, 15h, 2h, 30h)
bst.insert(10, { id: 'unit-10', bloodType: 'O+' });
bst.insert(5, { id: 'unit-5', bloodType: 'A+' });
bst.insert(20, { id: 'unit-20', bloodType: 'B+' });
bst.insert(15, { id: 'unit-15', bloodType: 'AB+' });
bst.insert(2, { id: 'unit-2', bloodType: 'O-' });
bst.insert(30, { id: 'unit-30', bloodType: 'A-' });
assert(bst.size === 6, 'BST correctly inserts all 6 units across hierarchy');
assert(!bst.isEmpty(), 'BST is not empty after inserts');

// Test Min and Max
const minExpiry = bst.findMin();
assert(minExpiry !== null && minExpiry.key === 2, 'BST findMin correctly locates earliest expiring unit (key = 2)');
const maxExpiry = bst.findMax();
assert(maxExpiry !== null && maxExpiry.key === 30, 'BST findMax correctly locates furthest expiring unit (key = 30)');

// Test exact key search
const searchRes = bst.search(15);
assert(searchRes.found, 'BST search finds existing key 15 in O(log n)');
assert(searchRes.items[0].id === 'unit-15', 'BST search returns correct item');
const searchMissing = bst.search(99);
assert(!searchMissing.found, 'BST search correctly reports not found for absent key');

// Test duplicate key insertion into same bucket
bst.insert(15, { id: 'unit-15-dup', bloodType: 'B-' });
const searchDup = bst.search(15);
assert(searchDup.items.length === 2, 'BST appends item to bucket when keys collide at same expiry');
assert(bst.size === 7, 'BST tracks total items correctly with duplicates');

// Test In-Order Traversal (Sorted order)
const inOrder = bst.inOrderTraversal();
const keys = inOrder.map((n) => n.key);
assert(JSON.stringify(keys) === JSON.stringify([2, 5, 10, 15, 20, 30]), 'BST in-order traversal yields strictly sorted keys: [2, 5, 10, 15, 20, 30]');

// Test Range Search [5, 20] (critical shelf life window)
const rangeRes = bst.rangeSearch(5, 20);
const rangeIds = rangeRes.items.map((u) => u.id).sort();
assert(rangeRes.items.length === 5, 'BST rangeSearch returns all units expiring between 5h and 20h');
assert(rangeRes.keysExamined.length > 0, 'BST records examined keys during branch traversal');

// ─── SUMMARY ────────────────────────────────────────────────────────────────
console.log('\n=============================================');
console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log('=============================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

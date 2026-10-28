// ═══════════════════════════════════════════════════════════════════════════════
// DSA Module Index — src/lib/dsa/index.ts
//
// Barrel re-export for all member-specific DSA modules.
// Pages can import from '@/lib/dsa' or from individual module files.
// ═══════════════════════════════════════════════════════════════════════════════

// Member 1 — Shirley Y. S. (URK25CS1081): Inventory Management
export { InventoryHashTableManager } from './inventoryHashTable';
export type { InventoryHashLookupResult } from './inventoryHashTable';
export { inventoryBinarySearch } from './binarySearch';
export type { InventoryBinarySearchResult, BinarySearchStep } from './binarySearch';
export { sortInventory, bubbleSortBy, selectionSortBy, insertionSortBy, mergeSortBy } from './inventorySorting';
export type { InventorySortField, InventorySortAlgo, InventorySortMetrics } from './inventorySorting';
export { BinarySearchTree } from './binarySearchTree';
export type { BSTNode } from './binarySearchTree';

// Member 2 — Kaitlyn Grace J (URK25CS1209): Hospital Requests
export { RequestQueue, buildPriorityQueues } from './requestQueue';
export { RequestPriorityQueue, buildRequestPriorityQueue } from './requestPriorityQueue';

// Member 3 — Aneesha M (URK25CS1219): Redistribution Planning
export { RedistributionDeque, buildRedistributionDeque } from './redistributionDeque';
export type { PlannerReviewTask } from './redistributionDeque';
export { BloodBankCircularList } from './circularLinkedList';
export { checkTransferFeasibility, checkBatchFeasibility } from './transferFeasibility';
export type { TransferFeasibilityInput, TransferFeasibilityResult } from './transferFeasibility';

// Member 4 — Angeline Maria S (URK25CS1224): Drone Operations
export { runBFS, runDFS, isReachable, getReachableNodes } from './graphTraversal';
export { runDijkstra, getShortestDistance, estimateFlightTime } from './dijkstra';
export { TelemetryCircularQueue } from './circularQueue';
export type { TelemetryQueueSnapshot } from './circularQueue';

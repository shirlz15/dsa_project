// ═══════════════════════════════════════════════════════════════════════════════
// Member 1 — Shirley Y. S. (URK25CS1081)
// Module: binarySearch.ts
// Responsibility: Binary search on inventory sorted by remaining shelf life
//
// Performs binary search over an array of InventoryUnit records pre-sorted by
// remaining shelf-life hours (ascending). Used on the Inventory page to let
// administrators locate units whose remaining shelf life exactly matches a
// target hour value — or to confirm no such unit exists.
//
// Complexity:
//   Time:  O(n log n) for sorting + O(log n) for search = O(n log n) overall
//   Space: O(n) for the sorted copy
// ═══════════════════════════════════════════════════════════════════════════════

import { InventoryUnit } from '../types';

/** One step recorded during binary search execution. */
export interface BinarySearchStep {
  low: number;
  high: number;
  mid: number;
  midValue: number;
  comparison: string;
}

/** Complete result of a binary search over inventory shelf-life values. */
export interface InventoryBinarySearchResult {
  /** Target shelf-life hours that were searched for */
  targetHours: number;
  /** Whether an exact match was found */
  found: boolean;
  /** The matching inventory unit, if found */
  unit: InventoryUnit | null;
  /** Number of comparisons performed (O(log n) in the worst case) */
  comparisons: number;
  /** Step-by-step trace of the binary search for UI visualization */
  steps: BinarySearchStep[];
  /** First few entries of the sorted array, for context display */
  sortedSample: { id: string; hours: number }[];
}

// DSA: BINARY SEARCH — EXPIRY-BASED SEARCH
/**
 * Binary Search on Inventory Sorted by Remaining Shelf Life.
 *
 * Purpose in Blood Navigator:
 *   Quickly locates blood units with an exact remaining shelf-life hour value.
 *   Useful for matching requests needing units with specific remaining lifespan.
 *
 * Viva Explanation:
 *   1. Prerequisite: The array MUST be sorted ascending by shelf-life hours.
 *   2. Pointers: Maintains `low` (start index) and `high` (end index).
 *   3. Midpoint: Calculates `mid = Math.floor((low + high) / 2)`.
 *   4. Comparison:
 *      - If midValue == targetHours: Match found! Stop search.
 *      - If midValue < targetHours: Target lies in the upper half -> set low = mid + 1.
 *      - If midValue > targetHours: Target lies in the lower half -> set high = mid - 1.
 *   5. Halving: Each probe cuts the remaining search space in half.
 *
 * Complexity:
 *   - Search Time: O(log n) comparisons
 *   - Initial Sort Time: O(n log n)
 *   - Auxiliary Space: O(n) for the sorted copy array
 */
export function inventoryBinarySearch(
  inventory: InventoryUnit[],
  targetHours: number,
  nowMs: number
): InventoryBinarySearchResult {
  // Step 1: Sort inventory by remaining shelf-life hours ascending
  const sortedByExpiry = [...inventory].sort((a, b) => {
    const remA = Math.max(0, (new Date(a.expiryTimestamp).getTime() - nowMs) / 3600000);
    const remB = Math.max(0, (new Date(b.expiryTimestamp).getTime() - nowMs) / 3600000);
    return remA - remB;
  });

  // Step 2: Extract integer hours array (search keys)
  const hoursArr = sortedByExpiry.map((u) =>
    Math.round(Math.max(0, (new Date(u.expiryTimestamp).getTime() - nowMs) / 3600000))
  );

  // Step 3: Binary search
  let low = 0;
  let high = hoursArr.length - 1;
  let comparisons = 0;
  let foundIndex = -1;
  const steps: BinarySearchStep[] = [];

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    comparisons++;
    const midVal = hoursArr[mid];

    if (midVal === targetHours) {
      steps.push({
        low, high, mid, midValue: midVal,
        comparison: `arr[${mid}] = ${midVal}h == ${targetHours}h (Match Found ✓)`,
      });
      foundIndex = mid;
      break;
    } else if (midVal < targetHours) {
      steps.push({
        low, high, mid, midValue: midVal,
        comparison: `arr[${mid}] = ${midVal}h < ${targetHours}h → search RIGHT [${mid + 1}..${high}]`,
      });
      low = mid + 1;
    } else {
      steps.push({
        low, high, mid, midValue: midVal,
        comparison: `arr[${mid}] = ${midVal}h > ${targetHours}h → search LEFT [${low}..${mid - 1}]`,
      });
      high = mid - 1;
    }
  }

  // Step 4: Build result
  return {
    targetHours,
    found: foundIndex !== -1,
    unit: foundIndex !== -1 ? sortedByExpiry[foundIndex] : null,
    comparisons,
    steps,
    sortedSample: sortedByExpiry.slice(0, 8).map((u) => ({
      id: u.id,
      hours: Math.round(Math.max(0, (new Date(u.expiryTimestamp).getTime() - nowMs) / 3600000)),
    })),
  };
}

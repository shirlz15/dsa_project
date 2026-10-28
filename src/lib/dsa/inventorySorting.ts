// ═══════════════════════════════════════════════════════════════════════════════
// Member 1 — Shirley Y. S. (URK25CS1081)
// Module: inventorySorting.ts
// Responsibility: Sorting algorithms for inventory records
// ═══════════════════════════════════════════════════════════════════════════════

import { InventoryUnit } from '../types';

/** Generic result returned by all four sorting algorithms. */
export interface GenericSortResult<T> {
  sorted: T[];
  comparisons: number;
  swaps: number;
  timeMs: number;
  algorithmName: string;
}

/** Fields available for sorting inventory records. */
export type InventorySortField = 'expiry' | 'remaining' | 'quantity' | 'id';

/** Available sorting algorithm names. */
export type InventorySortAlgo = 'bubble' | 'insertion' | 'selection' | 'merge';

/** Metrics captured from a sort execution. */
export interface InventorySortMetrics {
  comparisons: number;
  swaps: number;
  timeMs: number;
  algoName: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DSA: BUBBLE SORT — INVENTORY SORTING
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Bubble Sort on Inventory Records.
 *
 * Purpose in Blood Navigator:
 *   Sorts inventory records by repeatedly comparing adjacent pairs and swapping
 *   them if they are out of order, bubbling the largest value to the end.
 *
 * Viva Explanation:
 *   1. Outer loop runs (n - 1) passes.
 *   2. Inner loop compares adjacent elements: arr[j] and arr[j + 1].
 *   3. If arr[j] is greater than arr[j + 1], swap them.
 *   4. After each pass, the largest remaining element is in its final position.
 *   5. Tie-breaker: If keys are identical, compare unique unit IDs deterministically.
 *
 * Complexity:
 *   - Worst & Average Time: O(n²) comparisons and swaps
 *   - Best Time: O(n) on already-sorted data
 *   - Auxiliary Space: O(1) in-place sorting
 */
export function bubbleSortBy<T>(
  arr: T[],
  keyFn: (item: T) => number,
  tieBreaker?: (a: T, b: T) => number,
  descending: boolean = false
): GenericSortResult<T> {
  const items = [...arr];
  let comparisons = 0;
  let swaps = 0;
  const startTime = performance.now();

  for (let i = 0; i < items.length - 1; i++) {
    for (let j = 0; j < items.length - 1 - i; j++) {
      comparisons++;
      const keyA = keyFn(items[j]);
      const keyB = keyFn(items[j + 1]);

      let shouldSwap = descending ? keyA < keyB : keyA > keyB;
      if (keyA === keyB && tieBreaker) {
        shouldSwap = tieBreaker(items[j], items[j + 1]) > 0;
      }

      if (shouldSwap) {
        const temp = items[j];
        items[j] = items[j + 1];
        items[j + 1] = temp;
        swaps++;
      }
    }
  }

  return {
    sorted: items,
    comparisons,
    swaps,
    timeMs: performance.now() - startTime,
    algorithmName: 'Bubble Sort',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DSA: SELECTION SORT — INVENTORY SORTING
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Selection Sort on Inventory Records.
 *
 * Purpose in Blood Navigator:
 *   Finds the minimum (or maximum) element from the unsorted portion of the
 *   inventory array and swaps it with the first unsorted element.
 *
 * Viva Explanation:
 *   1. Divide array into sorted (left) and unsorted (right) portions.
 *   2. Find the minimum element in the unsorted portion: scan indices i+1 to n-1.
 *   3. Swap the found minimum with the element at index i.
 *   4. Exactly (n - 1) swaps occur in total — minimal memory writes.
 *
 * Complexity:
 *   - Time: O(n²) in all cases (always performs n(n-1)/2 comparisons)
 *   - Swaps: O(n) swaps (at most 1 swap per outer pass)
 *   - Auxiliary Space: O(1) in-place
 */
export function selectionSortBy<T>(
  arr: T[],
  keyFn: (item: T) => number,
  tieBreaker?: (a: T, b: T) => number,
  descending: boolean = false
): GenericSortResult<T> {
  const items = [...arr];
  let comparisons = 0;
  let swaps = 0;
  const startTime = performance.now();

  for (let i = 0; i < items.length - 1; i++) {
    let targetIndex = i;

    for (let j = i + 1; j < items.length; j++) {
      comparisons++;
      const keyJ = keyFn(items[j]);
      const keyTarget = keyFn(items[targetIndex]);

      let isBetter = descending ? keyJ > keyTarget : keyJ < keyTarget;
      if (keyJ === keyTarget && tieBreaker) {
        isBetter = tieBreaker(items[j], items[targetIndex]) < 0;
      }

      if (isBetter) {
        targetIndex = j;
      }
    }

    if (targetIndex !== i) {
      const temp = items[i];
      items[i] = items[targetIndex];
      items[targetIndex] = temp;
      swaps++;
    }
  }

  return {
    sorted: items,
    comparisons,
    swaps,
    timeMs: performance.now() - startTime,
    algorithmName: 'Selection Sort',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DSA: INSERTION SORT — INVENTORY SORTING
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Insertion Sort on Inventory Records.
 *
 * Purpose in Blood Navigator:
 *   Builds the sorted inventory array one item at a time by inserting each
 *   record into its correct relative position among the previously sorted items.
 *
 * Viva Explanation:
 *   1. Pick the current item at index i (starting at i = 1).
 *   2. Compare it with items in the sorted subarray to its left (index j = i - 1 down to 0).
 *   3. Shift larger items one position to the right to make room.
 *   4. Place the current item into the vacant slot (j + 1).
 *   5. Highly efficient for nearly sorted inventory records.
 *
 * Complexity:
 *   - Worst & Average Time: O(n²) comparisons and shifts
 *   - Best Time: O(n) when input is already sorted (only 1 comparison per element)
 *   - Auxiliary Space: O(1) in-place
 */
export function insertionSortBy<T>(
  arr: T[],
  keyFn: (item: T) => number,
  tieBreaker?: (a: T, b: T) => number,
  descending: boolean = false
): GenericSortResult<T> {
  const items = [...arr];
  let comparisons = 0;
  let swaps = 0;
  const startTime = performance.now();

  for (let i = 1; i < items.length; i++) {
    const current = items[i];
    const currentKey = keyFn(current);
    let j = i - 1;

    while (j >= 0) {
      comparisons++;
      const jKey = keyFn(items[j]);

      let shouldShift = descending ? jKey < currentKey : jKey > currentKey;
      if (jKey === currentKey && tieBreaker) {
        shouldShift = tieBreaker(items[j], current) > 0;
      }

      if (!shouldShift) break;

      items[j + 1] = items[j];
      swaps++;
      j--;
    }

    items[j + 1] = current;
  }

  return {
    sorted: items,
    comparisons,
    swaps,
    timeMs: performance.now() - startTime,
    algorithmName: 'Insertion Sort',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DSA: MERGE SORT — INVENTORY SORTING
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Merge Sort on Inventory Records.
 *
 * Purpose in Blood Navigator:
 *   Divide-and-conquer sorting algorithm that guarantees O(n log n) sorting
 *   time regardless of the initial order of blood inventory units.
 *
 * Viva Explanation:
 *   1. Divide: Split the array into two halves at `mid = Math.floor(length / 2)`.
 *   2. Conquer: Recursively sort the left half and right half.
 *   3. Combine (Merge): Compare front items of both sorted halves and append the
 *      smaller one to the result array until both halves are exhausted.
 *   4. Stable: Preserves original relative order of units with equal expiry.
 *
 * Complexity:
 *   - Time: O(n log n) in all cases (Best, Average, and Worst)
 *   - Auxiliary Space: O(n) for merging temporary arrays
 */
export function mergeSortBy<T>(
  arr: T[],
  keyFn: (item: T) => number,
  tieBreaker?: (a: T, b: T) => number,
  descending: boolean = false
): GenericSortResult<T> {
  let comparisons = 0;
  let swaps = 0;
  const startTime = performance.now();

  function merge(left: T[], right: T[]): T[] {
    const result: T[] = [];
    let i = 0;
    let j = 0;

    while (i < left.length && j < right.length) {
      comparisons++;
      const keyL = keyFn(left[i]);
      const keyR = keyFn(right[j]);

      let pickLeft = descending ? keyL >= keyR : keyL <= keyR;
      if (keyL === keyR && tieBreaker) {
        pickLeft = tieBreaker(left[i], right[j]) <= 0;
      }

      if (pickLeft) {
        result.push(left[i++]);
      } else {
        result.push(right[j++]);
        swaps++;
      }
    }

    return result.concat(left.slice(i)).concat(right.slice(j));
  }

  function sort(list: T[]): T[] {
    if (list.length <= 1) return list;
    const mid = Math.floor(list.length / 2);
    const leftSorted = sort(list.slice(0, mid));
    const rightSorted = sort(list.slice(mid));
    return merge(leftSorted, rightSorted);
  }

  const sorted = sort([...arr]);
  return {
    sorted,
    comparisons,
    swaps,
    timeMs: performance.now() - startTime,
    algorithmName: 'Merge Sort',
  };
}

/**
 * Key extractor helper: derives a numeric sort key from an InventoryUnit.
 */
function keyExtractor(field: InventorySortField, nowMs: number): (u: InventoryUnit) => number {
  switch (field) {
    case 'expiry':
      return (u) => new Date(u.expiryTimestamp).getTime();
    case 'remaining':
      return (u) => Math.max(0, new Date(u.expiryTimestamp).getTime() - nowMs);
    case 'quantity':
      return (u) => u.quantity;
    case 'id':
    default:
      return (u) => {
        let code = 0;
        for (let i = 0; i < u.id.length; i++) {
          code = (code * 31 + u.id.charCodeAt(i)) % 1000000;
        }
        return code;
      };
  }
}

/** Deterministic tie-breaker: lexicographic comparison of unit IDs. */
function tieBreaker(a: InventoryUnit, b: InventoryUnit): number {
  return a.id.localeCompare(b.id);
}

/**
 * High-level sorting entry point for the Inventory Page.
 * Dispatches to Bubble, Insertion, Selection, or Merge Sort.
 */
export function sortInventory(
  items: InventoryUnit[],
  field: InventorySortField,
  algo: InventorySortAlgo,
  nowMs: number
): { sorted: InventoryUnit[]; metrics: InventorySortMetrics } {
  const keyFn = keyExtractor(field, nowMs);
  const descending = field === 'remaining' || field === 'quantity';

  let result: GenericSortResult<InventoryUnit>;

  switch (algo) {
    case 'bubble':
      result = bubbleSortBy(items, keyFn, tieBreaker, descending);
      break;
    case 'selection':
      result = selectionSortBy(items, keyFn, tieBreaker, descending);
      break;
    case 'insertion':
      result = insertionSortBy(items, keyFn, tieBreaker, descending);
      break;
    case 'merge':
    default:
      result = mergeSortBy(items, keyFn, tieBreaker, descending);
      break;
  }

  return {
    sorted: result.sorted,
    metrics: {
      comparisons: result.comparisons,
      swaps: result.swaps,
      timeMs: Number(result.timeMs.toFixed(2)),
      algoName: result.algorithmName,
    },
  };
}

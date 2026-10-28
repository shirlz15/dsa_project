// Member 2 — Kaitlyn Grace J (URK25CS1209)
// Module: requestPriorityQueue.ts
// Responsibility: Emergency/routine request prioritisation

import { BloodRequest } from '../types';
import { DSAStep } from '../dsa-engine';

/** Numeric priority mapping: lower number = higher priority. */
const PRIORITY_RANK: Record<BloodRequest['priority'], number> = {
  emergency: 0,
  urgent: 1,
  routine: 2,
};

// DSA: PRIORITY QUEUE — EMERGENCY REQUEST PRIORITISATION
/**
 * RequestPriorityQueue — Binary Min-Heap Priority Queue for Clinical Requisitions.
 *
 * Purpose in Blood Navigator:
 *   Ensures immediate priority dispatching where critical emergency blood requisitions
 *   are extracted and serviced before urgent or routine orders, regardless of arrival order.
 *
 * Viva Explanation:
 *   1. Heap Property: A binary tree where the parent node has higher priority than its children.
 *   2. Priority Rank: Emergency (rank 0) > Urgent (rank 1) > Routine (rank 2).
 *   3. Tie-breaking: If two requests have equal rank, the earlier `createdAt` timestamp wins (FIFO tiebreaker).
 *   4. Insertion (bubbleUp): Appends to heap end and repeatedly swaps with parent `(i - 1) / 2`
 *      until heap order is satisfied: O(log n).
 *   5. Extraction (bubbleDown): Removes root (index 0), moves last item to root, and bubbles down
 *      by swapping with the higher-priority child `2i + 1` or `2i + 2`: O(log n).
 *
 * Complexity:
 *   - Insertion: O(log n)
 *   - Extract Highest: O(log n)
 *   - Peek Highest: O(1)
 *   - Auxiliary Space: O(n) array storage
 */
export class RequestPriorityQueue {
  private heap: BloodRequest[] = [];
  private _steps: DSAStep[] = [];

  get steps(): DSAStep[] {
    return [...this._steps];
  }
  clearSteps(): void {
    this._steps = [];
  }

  /**
   * Compare two requests. Returns true if `a` should be served before `b`.
   *
   * Priority order: emergency < urgent < routine.
   * FIFO within same priority: earlier createdAt comes first.
   */
  private hasHigherPriority(a: BloodRequest, b: BloodRequest): boolean {
    const rankA = PRIORITY_RANK[a.priority];
    const rankB = PRIORITY_RANK[b.priority];
    if (rankA !== rankB) return rankA < rankB;
    // Same priority tier — FIFO by creation time
    return new Date(a.createdAt).getTime() <= new Date(b.createdAt).getTime();
  }

  /** Swap two elements in the heap by index. */
  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  /**
   * Bubble-up the element at index `i` to restore the heap property.
   * Time: O(log n).
   */
  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.hasHigherPriority(this.heap[i], this.heap[parent])) {
        this.swap(i, parent);
        i = parent;
      } else {
        break;
      }
    }
  }

  /**
   * Bubble-down the element at index `i` to restore the heap property.
   * Time: O(log n).
   */
  private bubbleDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      if (left < n && this.hasHigherPriority(this.heap[left], this.heap[smallest])) {
        smallest = left;
      }
      if (right < n && this.hasHigherPriority(this.heap[right], this.heap[smallest])) {
        smallest = right;
      }
      if (smallest === i) break;

      this.swap(i, smallest);
      i = smallest;
    }
  }

  /**
   * Insert a request into the priority queue.
   * Time: O(log n).
   */
  insert(request: BloodRequest): void {
    this.heap.push(request);
    this.bubbleUp(this.heap.length - 1);
    this._steps.push({
      operation: 'insert',
      detail: `Inserted request ${request.id} (priority: ${request.priority}) — heap size: ${this.heap.length}`,
      stateSnapshot: this.heap.map((r) => `${r.id}[${r.priority}]`).join(', '),
    });
  }

  /**
   * Remove and return the highest-priority request.
   * Returns undefined if the queue is empty.
   * Time: O(log n).
   */
  extractNext(): BloodRequest | undefined {
    if (this.heap.length === 0) {
      this._steps.push({
        operation: 'extractNext',
        detail: 'Priority queue is empty — no request to extract',
        stateSnapshot: '[]',
      });
      return undefined;
    }

    const top = this.heap[0];
    const last = this.heap.pop()!;

    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }

    this._steps.push({
      operation: 'extractNext',
      detail: `Extracted request ${top.id} (priority: ${top.priority}) — heap size: ${this.heap.length}`,
      stateSnapshot: this.heap.map((r) => `${r.id}[${r.priority}]`).join(', '),
    });

    return top;
  }

  /**
   * View the highest-priority request without removing it.
   * Time: O(1).
   */
  peek(): BloodRequest | undefined {
    return this.heap.length > 0 ? this.heap[0] : undefined;
  }

  /**
   * Alias for extractNext() — removes and returns highest-priority request.
   */
  pop(): BloodRequest | undefined {
    return this.extractNext();
  }

  /** Number of requests in the priority queue (method). */
  size(): number {
    return this.heap.length;
  }

  /** Number of requests in the priority queue (getter). */
  get length(): number {
    return this.heap.length;
  }

  /** Whether the priority queue is empty. */
  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * Return all requests in priority-heap order (note: not fully sorted,
   * but index 0 is always the highest priority).
   * For a fully sorted view, extract all elements.
   */
  toArray(): BloodRequest[] {
    return [...this.heap];
  }

  /**
   * Return requests in fully sorted priority order by repeatedly extracting.
   * This drains the queue — use toSortedArray() only for display.
   * Time: O(n log n).
   */
  toSortedArray(): BloodRequest[] {
    const copy = new RequestPriorityQueue();
    for (const r of this.heap) copy.insert(r);
    const sorted: BloodRequest[] = [];
    while (!copy.isEmpty()) {
      const next = copy.extractNext();
      if (next) sorted.push(next);
    }
    return sorted;
  }

  /** Clear all requests. */
  clear(): void {
    this.heap = [];
    this._steps = [];
  }
}

/**
 * Convenience: build a RequestPriorityQueue from an array of requests,
 * filtering to only pending ones.
 */
export function buildRequestPriorityQueue(requests: BloodRequest[]): RequestPriorityQueue {
  const pq = new RequestPriorityQueue();
  const pending = requests.filter((r) => r.status === 'pending');
  for (const r of pending) {
    pq.insert(r);
  }
  return pq;
}

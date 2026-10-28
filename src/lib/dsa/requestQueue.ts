// Member 2 — Kaitlyn Grace J (URK25CS1209)
// Module: requestQueue.ts
// Responsibility: FIFO queue operations for hospital blood request processing

import { Queue, DSAStep } from '../dsa-engine';
import { BloodRequest } from '../types';

// DSA: QUEUE — FIFO HOSPITAL REQUEST PROCESSING
/**
 * RequestQueue — FIFO Hospital Blood Requisition Queue.
 *
 * Purpose in Blood Navigator:
 *   Ensures fair, sequential processing of hospital blood requests.
 *   Within each urgency tier (Emergency, Urgent, Routine), requests are
 *   enqueued in arrival order and dequeued First-In, First-Out (FIFO).
 *
 * Viva Explanation:
 *   1. Discipline: First-In, First-Out (FIFO).
 *   2. Enqueue: Adds an incoming requisition to the rear of the queue.
 *   3. Dequeue: Removes and returns the oldest waiting requisition from the front.
 *   4. Peek: Inspects the next requisition to be processed without removal.
 *   5. Priority Tiers: Three separate queues partition requests so emergency orders
 *      are processed before urgent and routine orders.
 *
 * Complexity:
 *   - Enqueue: O(1) amortized
 *   - Dequeue: O(n) array shift / O(1) with pointer-based queue
 *   - Peek: O(1)
 *   - Auxiliary Space: O(n) where n is pending requests
 */
export class RequestQueue {
  private queue: Queue<BloodRequest>;
  private _tier: string;

  /**
   * @param tier Human-readable label for this priority tier
   *   (e.g., "Emergency (Tier 1)", "Urgent (Tier 2)", "Routine (Tier 3)")
   */
  constructor(tier: string) {
    this.queue = new Queue<BloodRequest>();
    this._tier = tier;
  }

  /** The priority tier label for this queue. */
  get tier(): string {
    return this._tier;
  }

  /**
   * Add a request to the rear of the queue (FIFO).
   * Time: O(1) amortized.
   */
  enqueue(request: BloodRequest): void {
    this.queue.enqueue(request);
  }

  /**
   * Remove and return the request at the front of the queue (FIFO).
   * Returns undefined if the queue is empty.
   * Time: O(n) due to array shift.
   */
  dequeue(): BloodRequest | undefined {
    return this.queue.dequeue();
  }

  /**
   * View the front request without removing it.
   * Time: O(1).
   */
  peek(): BloodRequest | undefined {
    return this.queue.peek();
  }

  /** Number of requests currently in this queue. */
  size(): number {
    return this.queue.size();
  }

  /** Whether this queue is empty. */
  isEmpty(): boolean {
    return this.queue.isEmpty();
  }

  /** Return all requests in queue order (front to rear) without modification. */
  toArray(): BloodRequest[] {
    return this.queue.toArray();
  }

  /** Clear all requests from this queue. */
  clear(): void {
    this.queue.clear();
  }

  /** Retrieve DSA trace steps recorded during enqueue/dequeue operations. */
  get steps(): DSAStep[] {
    return this.queue.steps;
  }

  /** Clear accumulated DSA trace steps. */
  clearSteps(): void {
    this.queue.clearSteps();
  }
}

/**
 * Build three priority-tier FIFO queues from an array of BloodRequest records.
 *
 * 1. Filters to pending requests only.
 * 2. Sorts by createdAt (arrival order) to guarantee FIFO within each tier.
 * 3. Partitions into emergency / urgent / routine queues.
 * 4. Builds a unified ordered list with queue positions and tier labels,
 *    where emergency requests come first, then urgent, then routine.
 *
 * @param requests All BloodRequest records from the store
 * @returns The three queues plus a unified ordered list for display
 */
export function buildPriorityQueues(requests: BloodRequest[]): {
  emergencyQueue: RequestQueue;
  urgentQueue: RequestQueue;
  routineQueue: RequestQueue;
  unifiedQueueList: { request: BloodRequest; queuePosition: number; tier: string }[];
} {
  const qEmergency = new RequestQueue('Emergency (Tier 1)');
  const qUrgent = new RequestQueue('Urgent (Tier 2)');
  const qRoutine = new RequestQueue('Routine (Tier 3)');

  // Sort pending requests by creation time (FIFO arrival order)
  const pendingChronological = requests
    .filter((r) => r.status === 'pending')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Partition into priority tiers
  for (const r of pendingChronological) {
    if (r.priority === 'emergency') qEmergency.enqueue(r);
    else if (r.priority === 'urgent') qUrgent.enqueue(r);
    else qRoutine.enqueue(r);
  }

  // Build unified ordered list: emergency first, then urgent, then routine
  const unified: { request: BloodRequest; queuePosition: number; tier: string }[] = [];
  let pos = 1;

  for (const r of qEmergency.toArray()) {
    unified.push({ request: r, queuePosition: pos++, tier: qEmergency.tier });
  }
  for (const r of qUrgent.toArray()) {
    unified.push({ request: r, queuePosition: pos++, tier: qUrgent.tier });
  }
  for (const r of qRoutine.toArray()) {
    unified.push({ request: r, queuePosition: pos++, tier: qRoutine.tier });
  }

  return { emergencyQueue: qEmergency, urgentQueue: qUrgent, routineQueue: qRoutine, unifiedQueueList: unified };
}

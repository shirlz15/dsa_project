// Member 3 — Aneesha M (URK25CS1219)
// Module: redistributionDeque.ts
// Responsibility: Insert/remove tasks at both ends of the planner worklist

import { Deque, DSAStep } from '../dsa-engine';
import { ReviewTask } from '../types';

/**
 * Extended review task type with additional redistribution-specific fields.
 * Matches the PlannerReviewTask interface used in the redistribution page.
 */
export interface PlannerReviewTask extends ReviewTask {
  sourceBankName?: string;
  destBankName?: string;
  targetDestBankId?: string;
  associatedRequestId?: string;
  actionLabel?: string;
  expiryHoursRemaining?: number;
}

// DSA: DEQUE — REDISTRIBUTION REVIEW WORKLIST
/**
 * RedistributionDeque — Double-Ended Queue for Planner Tasks.
 *
 * Purpose in Blood Navigator:
 *   Manages clinical review tasks where high-urgency expiry risks are placed
 *   at the FRONT of the queue for immediate attention, while routine audits
 *   are appended to the REAR.
 *
 * Viva Explanation:
 *   1. Double-Ended: Elements can be inserted and deleted at BOTH the front and rear.
 *   2. Emergency Insertion: `insertFront(task)` puts critical items at the head.
 *   3. Routine Insertion: `insertRear(task)` places routine items at the tail.
 *   4. Operator Servicing: `deleteFront()` removes and returns the highest-priority front item.
 *   5. Cancellation/Deferral: `deleteRear()` drops or defers routine items from the rear.
 *
 * Complexity:
 *   - Rear insert/delete: O(1) amortized
 *   - Front insert/delete: O(n) with array unshift/shift / O(1) with doubly linked list
 *   - Peek (front/rear): O(1)
 *   - Auxiliary Space: O(n)
 */
export class RedistributionDeque {
  private deque: Deque<PlannerReviewTask>;

  constructor() {
    this.deque = new Deque<PlannerReviewTask>();
  }

  /**
   * Insert a high-priority (emergency/critical) task at the front of the worklist.
   * Time: O(n) due to array unshift.
   */
  insertFront(task: PlannerReviewTask): void {
    this.deque.insertFront(task);
  }

  /**
   * Append a routine/scheduled task at the rear of the worklist.
   * Time: O(1) amortized (array push).
   */
  insertRear(task: PlannerReviewTask): void {
    this.deque.insertRear(task);
  }

  /**
   * Remove and return the highest-priority task from the front.
   * Returns undefined if the deque is empty.
   * Time: O(n) due to array shift.
   */
  popFront(): PlannerReviewTask | undefined {
    return this.deque.deleteFront();
  }

  /** Alias for popFront() */
  deleteFront(): PlannerReviewTask | undefined {
    return this.popFront();
  }

  /**
   * Remove and return the lowest-priority (deferred) task from the rear.
   * Returns undefined if the deque is empty.
   * Time: O(1) (array pop).
   */
  popRear(): PlannerReviewTask | undefined {
    return this.deque.deleteRear();
  }

  /** Alias for popRear() */
  deleteRear(): PlannerReviewTask | undefined {
    return this.popRear();
  }

  /** View the front task without removing it. */
  peekFront(): PlannerReviewTask | undefined {
    return this.deque.peekFront();
  }

  /** View the rear task without removing it. */
  peekRear(): PlannerReviewTask | undefined {
    return this.deque.peekRear();
  }

  /** Number of tasks currently in the deque. */
  size(): number {
    return this.deque.size();
  }

  /** Number of tasks currently in the deque (getter). */
  get length(): number {
    return this.deque.size();
  }

  /** Whether the deque is empty. */
  isEmpty(): boolean {
    return this.deque.isEmpty();
  }

  /** Return all tasks in order (front to rear) without modification. */
  toArray(): PlannerReviewTask[] {
    return this.deque.toArray();
  }

  /** Clear all tasks. */
  clear(): void {
    this.deque.clear();
  }

  /** DSA trace steps for visualization. */
  get steps(): DSAStep[] {
    return this.deque.steps;
  }

  /** Clear DSA trace steps. */
  clearSteps(): void {
    this.deque.clearSteps();
  }
}

/**
 * Create a pre-populated deque from an array of tasks, inserting each
 * according to its queueEnd ('front' or 'rear') property.
 */
export function buildRedistributionDeque(tasks: PlannerReviewTask[]): RedistributionDeque {
  const deque = new RedistributionDeque();
  for (const task of tasks) {
    if (task.queueEnd === 'front') {
      deque.insertFront(task);
    } else {
      deque.insertRear(task);
    }
  }
  return deque;
}

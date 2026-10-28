// Member 3 — Aneesha M (URK25CS1219)
// Module: circularLinkedList.ts
// Responsibility: Circular traversal of participating blood banks

import { CircularLinkedList, DSAStep } from '../dsa-engine';
import { BloodBank } from '../types';

// DSA: CIRCULAR LINKED LIST — BLOOD BANK ROTATION
/**
 * BloodBankCircularList — Circular Linked List for Closed-Loop Facility Audits.
 *
 * Purpose in Blood Navigator:
 *   Enables cyclical, round-robin inspection of participating regional blood banks.
 *   The administrator steps through facility inventories in a continuous rotation;
 *   the tail node points back to the head node so traversal wraps seamlessly.
 *
 * Viva Explanation:
 *   1. Node Chain: Each node contains a BloodBank record and a `next` pointer.
 *   2. Circular Link: The final node's `next` pointer references `head` instead of null.
 *   3. Cycle Traversal: Starts at `head` and advances `curr = curr.next` until `curr.next === head`,
 *      visiting each facility exactly once per complete rotation without infinite looping.
 *   4. Step-by-Step Navigation: `nextInCycle()` advances one step at a time for manual review.
 *
 * Complexity:
 *   - Traverse One Cycle: O(n) where n is number of blood banks
 *   - Step to Next Bank: O(1)
 *   - Insertion at Tail: O(n) to reach tail / O(1) with maintained tail pointer
 *   - Space: O(1) auxiliary memory
 */
export class BloodBankCircularList {
  private cll: CircularLinkedList<BloodBank>;
  private _currentIndex: number = 0;
  private _visitedCount: number = 0;
  private _cycleActive: boolean = false;
  private _cycleCompleted: boolean = false;

  constructor() {
    this.cll = new CircularLinkedList<BloodBank>();
  }

  /**
   * Build the circular linked list from an array of blood banks.
   * Clears any existing list and inserts all banks in order.
   */
  buildFromBanks(banks: BloodBank[]): void {
    this.cll.clear();
    for (const bank of banks) {
      this.cll.insert(bank);
    }
    this._currentIndex = 0;
    this._visitedCount = 0;
    this._cycleActive = false;
    this._cycleCompleted = false;
  }

  /**
   * Traverse exactly one full cycle, returning all visited banks in order.
   * The traversal starts at the head and follows `next` pointers until
   * it loops back to the head.
   *
   * Time: O(n).
   */
  traverseOneCycle(): BloodBank[] {
    return this.cll.traverseOneCycle();
  }

  /**
   * Start a new review cycle from the first bank.
   * Returns the first bank in the cycle, or null if the list is empty.
   */
  startCycle(): BloodBank | null {
    const cycle = this.traverseOneCycle();
    if (cycle.length === 0) return null;

    this._currentIndex = 0;
    this._visitedCount = 1;
    this._cycleActive = true;
    this._cycleCompleted = false;

    return cycle[0];
  }

  /**
   * Advance to the next bank in the review cycle.
   *
   * Returns the next bank, or null if the full cycle is completed.
   * When all banks have been visited exactly once, the cycle is marked
   * complete and the method returns null.
   */
  nextInCycle(): BloodBank | null {
    const cycle = this.traverseOneCycle();
    if (cycle.length === 0 || !this._cycleActive) return null;

    if (this._visitedCount >= cycle.length) {
      // Full cycle completed
      this._cycleActive = false;
      this._cycleCompleted = true;
      return null;
    }

    this._currentIndex = (this._currentIndex + 1) % cycle.length;
    this._visitedCount++;
    return cycle[this._currentIndex];
  }

  /** The bank currently being reviewed. */
  get currentBank(): BloodBank | null {
    const cycle = this.traverseOneCycle();
    if (cycle.length === 0) return null;
    return cycle[this._currentIndex % cycle.length];
  }

  /** The next bank to be reviewed (peek without advancing). */
  get nextBank(): BloodBank | null {
    const cycle = this.traverseOneCycle();
    if (cycle.length === 0) return null;
    return cycle[(this._currentIndex + 1) % cycle.length];
  }

  /** Current review position (0-indexed). */
  get currentIndex(): number {
    return this._currentIndex;
  }

  /** Number of banks visited so far in this cycle. */
  get visitedCount(): number {
    return this._visitedCount;
  }

  /** Whether a review cycle is currently in progress. */
  get cycleActive(): boolean {
    return this._cycleActive;
  }

  /** Whether the last cycle completed a full rotation. */
  get cycleCompleted(): boolean {
    return this._cycleCompleted;
  }

  /** Total number of banks in the circular list. */
  size(): number {
    return this.cll.size();
  }

  /** Whether the list is empty. */
  isEmpty(): boolean {
    return this.cll.isEmpty();
  }

  /** Insert a new blood bank into the circular list. */
  insert(bank: BloodBank): void {
    this.cll.insert(bank);
  }

  /** Remove a blood bank from the circular list by value. */
  delete(bank: BloodBank): boolean {
    return this.cll.delete(bank);
  }

  /** DSA trace steps for visualization. */
  get steps(): DSAStep[] {
    return this.cll.steps;
  }

  /** Clear DSA trace steps. */
  clearSteps(): void {
    this.cll.clearSteps();
  }

  /** Clear the list and reset cycle state. */
  clear(): void {
    this.cll.clear();
    this._currentIndex = 0;
    this._visitedCount = 0;
    this._cycleActive = false;
    this._cycleCompleted = false;
  }
}

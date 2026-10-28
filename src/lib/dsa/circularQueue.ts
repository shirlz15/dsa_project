// ═══════════════════════════════════════════════════════════════════════════════
// Member 4 — Angeline Maria S (URK25CS1224)
// Module: circularQueue.ts
// Responsibility: Fixed-capacity circular queue for drone telemetry events
//
// Circular Queue (Ring Buffer) for recent drone telemetry flight events.
//
// A circular queue connects the end of a fixed-size buffer back to the beginning
// using modular arithmetic: nextIndex = (currentIndex + 1) % capacity.
//
// In Blood Navigator:
//   - Drones emit continuous telemetry (position, battery, waypoint status, weather alerts).
//   - Unbounded storage would exhaust memory.
//   - A fixed-capacity circular buffer (e.g., 8 slots) retains the N most recent events.
//   - When the buffer is full, the oldest event at `front` is evicted (FIFO overwrite).
//
// Viva Key Concepts:
//   - front: index of the oldest active item in the buffer.
//   - rear: index of the most recently inserted item.
//   - Modular arithmetic handles wraparound without shifting elements.
//
// Complexity:
//   Enqueue (with overwrite): O(1)
//   Dequeue:                  O(1)
//   Peek:                     O(1)
//   isFull / isEmpty / size:  O(1)
//   Space:                    O(K) where K = capacity (fixed memory footprint)
// ═══════════════════════════════════════════════════════════════════════════════

import { CircularQueue, DSAStep } from '../dsa-engine';
import { DroneTelemetryEvent } from '../types';

/** Snapshot of the circular queue state for UI rendering. */
export interface TelemetryQueueSnapshot {
  /** The raw buffer array (fixed size, may contain null slots) */
  buffer: (DroneTelemetryEvent | null)[];
  /** Current front index (-1 if empty) */
  front: number;
  /** Current rear index (-1 if empty) */
  rear: number;
  /** Number of events currently stored */
  size: number;
  /** Maximum capacity of the ring buffer */
  capacity: number;
}

/**
 * Circular Queue Telemetry Buffer.
 *
 * Viva Explanation:
 * 1. Maintain a fixed-size array of length `capacity`.
 * 2. On enqueue:
 *    a. If empty, front = 0, rear = 0, store event at buffer[0].
 *    b. If full, advance front = (front + 1) % capacity (evict oldest),
 *       advance rear = (rear + 1) % capacity, and store new event.
 *    c. If not full, advance rear = (rear + 1) % capacity, increment size.
 * 3. On dequeue:
 *    a. Retrieve item at buffer[front].
 *    b. If size === 1, reset front = -1, rear = -1.
 *    c. Otherwise, advance front = (front + 1) % capacity, decrement size.
 *
 * Time Complexity:  O(1) strictly for all operations.
 * Space Complexity: O(K) where K is capacity.
 */
// DSA: CIRCULAR QUEUE — DRONE TELEMETRY BUFFER
export class TelemetryCircularQueue {
  private queue: CircularQueue<DroneTelemetryEvent>;

  /**
   * @param capacity Maximum number of telemetry events to retain.
   *   Default is 8 (matching the RING_CAPACITY in the drone page).
   */
  constructor(capacity: number = 8) {
    this.queue = new CircularQueue<DroneTelemetryEvent>(capacity);
  }

  /**
   * Push a new telemetry event into the ring buffer.
   *
   * If the buffer is full, the oldest event is automatically evicted
   * (FIFO overwrite) to make room.  This guarantees O(1) insertion
   * with bounded memory.
   *
   * @param event  The telemetry event to record
   * @returns Info about whether an overwrite occurred and what was evicted
   */
  push(event: DroneTelemetryEvent): { overwritten: boolean; evicted: DroneTelemetryEvent | null } {
    const result = this.queue.enqueueWithOverwrite(event);
    return {
      overwritten: result.overwritten,
      evicted: result.evicted as DroneTelemetryEvent | null,
    };
  }

  /** Alias for push() */
  enqueueWithOverwrite(event: DroneTelemetryEvent): { overwritten: boolean; evicted: DroneTelemetryEvent | null } {
    return this.push(event);
  }

  /** Standard enqueue alias */
  enqueue(event: DroneTelemetryEvent): boolean {
    this.push(event);
    return true;
  }

  /**
   * Remove and return the oldest telemetry event.
   * Returns null if the buffer is empty.
   */
  dequeue(): DroneTelemetryEvent | null {
    return this.queue.dequeue();
  }

  /**
   * View the oldest telemetry event without removing it.
   * Returns null if the buffer is empty.
   */
  peek(): DroneTelemetryEvent | null {
    return this.queue.peek();
  }

  /** Whether the buffer is at maximum capacity. */
  isFull(): boolean {
    return this.queue.isFull();
  }

  /** Whether the buffer is empty. */
  isEmpty(): boolean {
    return this.queue.isEmpty();
  }

  /** Number of events currently stored. */
  size(): number {
    return this.queue.size();
  }

  /** Maximum capacity of the ring buffer. */
  get capacity(): number {
    return this.queue.capacity;
  }

  /** Front index of the circular buffer. */
  get frontIndex(): number {
    return this.queue.frontIndex;
  }

  /** Rear index of the circular buffer. */
  get rearIndex(): number {
    return this.queue.rearIndex;
  }

  /**
   * Get a snapshot of the current queue state for UI rendering.
   * Includes the raw buffer, front/rear indices, size, and capacity.
   */
  getSnapshot(): TelemetryQueueSnapshot {
    return {
      buffer: this.queue.toArray() as (DroneTelemetryEvent | null)[],
      front: this.queue.frontIndex,
      rear: this.queue.rearIndex,
      size: this.queue.size(),
      capacity: this.queue.capacity,
    };
  }

  /** DSA trace steps for visualization. */
  get steps(): DSAStep[] {
    return this.queue.steps;
  }

  /** Clear DSA trace steps. */
  clearSteps(): void {
    this.queue.clearSteps();
  }

  /** Reset the buffer to empty state. */
  clear(): void {
    this.queue.clear();
  }
}

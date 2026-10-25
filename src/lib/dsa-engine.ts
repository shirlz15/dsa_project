// ─── Blood Navigator — Custom DSA Implementations ─────────────────────────────
// Each data structure and algorithm is implemented from scratch for educational
// demonstration. These are NOT wrappers around built-in collections.

// ═══════════════════════════════════════════════════════════════════════════════
// 1. STACK — LIFO structure for reversible action history
// Push/Pop/Peek: O(1) using array-backed implementation
// ═══════════════════════════════════════════════════════════════════════════════

export interface DSAStep {
  operation: string;
  detail: string;
  stateSnapshot: string;
}

export class Stack<T> {
  private items: T[] = [];
  private _steps: DSAStep[] = [];

  get steps() { return [...this._steps]; }
  clearSteps() { this._steps = []; }

  push(item: T): void {
    this.items.push(item);
    this._steps.push({
      operation: 'push',
      detail: `Pushed ${JSON.stringify(item)} onto stack`,
      stateSnapshot: JSON.stringify(this.items),
    });
  }

  pop(): T | undefined {
    if (this.isEmpty()) {
      this._steps.push({ operation: 'pop', detail: 'Stack is empty — cannot pop', stateSnapshot: '[]' });
      return undefined;
    }
    const item = this.items.pop();
    this._steps.push({
      operation: 'pop',
      detail: `Popped ${JSON.stringify(item)} from stack`,
      stateSnapshot: JSON.stringify(this.items),
    });
    return item;
  }

  peek(): T | undefined {
    if (this.isEmpty()) return undefined;
    return this.items[this.items.length - 1];
  }

  size(): number { return this.items.length; }
  isEmpty(): boolean { return this.items.length === 0; }
  toArray(): T[] { return [...this.items]; }
  clear(): void { this.items = []; this._steps = []; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. QUEUE — FIFO structure for request processing
// Enqueue/Dequeue: O(1) amortized with array shift, O(n) worst-case for shift
// For educational purposes — production would use a doubly-linked list or ring buffer
// ═══════════════════════════════════════════════════════════════════════════════

export class Queue<T> {
  private items: T[] = [];
  private _steps: DSAStep[] = [];

  get steps() { return [...this._steps]; }
  clearSteps() { this._steps = []; }

  enqueue(item: T): void {
    this.items.push(item);
    this._steps.push({
      operation: 'enqueue',
      detail: `Enqueued ${JSON.stringify(item)}`,
      stateSnapshot: JSON.stringify(this.items),
    });
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) {
      this._steps.push({ operation: 'dequeue', detail: 'Queue is empty — cannot dequeue', stateSnapshot: '[]' });
      return undefined;
    }
    const item = this.items.shift();
    this._steps.push({
      operation: 'dequeue',
      detail: `Dequeued ${JSON.stringify(item)}`,
      stateSnapshot: JSON.stringify(this.items),
    });
    return item;
  }

  peek(): T | undefined { return this.items[0]; }
  rear(): T | undefined { return this.items[this.items.length - 1]; }
  front(): T | undefined { return this.items[0]; }
  size(): number { return this.items.length; }
  isEmpty(): boolean { return this.items.length === 0; }
  toArray(): T[] { return [...this.items]; }
  clear(): void { this.items = []; this._steps = []; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CIRCULAR QUEUE — Fixed-capacity bounded buffer
// Uses front/rear indices with wraparound. O(1) enqueue/dequeue.
// Full-buffer policy: rejects new items when full (does NOT overwrite).
// ═══════════════════════════════════════════════════════════════════════════════

export class CircularQueue<T> {
  private buffer: (T | null)[];
  private frontIdx: number = -1;
  private rearIdx: number = -1;
  private count: number = 0;
  private _capacity: number;
  private _steps: DSAStep[] = [];

  get steps() { return [...this._steps]; }
  clearSteps() { this._steps = []; }
  get capacity() { return this._capacity; }
  get frontIndex() { return this.frontIdx; }
  get rearIndex() { return this.rearIdx; }

  constructor(capacity: number) {
    this._capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
  }

  enqueue(item: T): boolean {
    if (this.isFull()) {
      this._steps.push({
        operation: 'enqueue',
        detail: `Queue is full (capacity ${this._capacity}) — rejected ${JSON.stringify(item)}`,
        stateSnapshot: this.snapshot(),
      });
      return false;
    }
    if (this.isEmpty()) {
      this.frontIdx = 0;
      this.rearIdx = 0;
    } else {
      this.rearIdx = (this.rearIdx + 1) % this._capacity;
    }
    this.buffer[this.rearIdx] = item;
    this.count++;
    this._steps.push({
      operation: 'enqueue',
      detail: `Enqueued ${JSON.stringify(item)} at index ${this.rearIdx} (front=${this.frontIdx}, rear=${this.rearIdx})`,
      stateSnapshot: this.snapshot(),
    });
    return true;
  }

  enqueueWithOverwrite(item: T): { overwritten: boolean; evicted: T | null } {
    let evicted: T | null = null;
    let overwritten = false;
    if (this.isFull()) {
      evicted = this.dequeue();
      overwritten = true;
    }
    this.enqueue(item);
    return { overwritten, evicted };
  }

  dequeue(): T | null {
    if (this.isEmpty()) {
      this._steps.push({
        operation: 'dequeue',
        detail: 'Circular queue is empty — cannot dequeue',
        stateSnapshot: this.snapshot(),
      });
      return null;
    }
    const item = this.buffer[this.frontIdx];
    this.buffer[this.frontIdx] = null;
    this.count--;
    if (this.count === 0) {
      this.frontIdx = -1;
      this.rearIdx = -1;
    } else {
      this.frontIdx = (this.frontIdx + 1) % this._capacity;
    }
    this._steps.push({
      operation: 'dequeue',
      detail: `Dequeued ${JSON.stringify(item)} (front=${this.frontIdx}, rear=${this.rearIdx})`,
      stateSnapshot: this.snapshot(),
    });
    return item;
  }

  peek(): T | null {
    return this.isEmpty() ? null : this.buffer[this.frontIdx];
  }

  isFull(): boolean { return this.count === this._capacity; }
  isEmpty(): boolean { return this.count === 0; }
  size(): number { return this.count; }

  toArray(): (T | null)[] { return [...this.buffer]; }

  private snapshot(): string {
    return JSON.stringify({ buffer: this.buffer, front: this.frontIdx, rear: this.rearIdx, count: this.count });
  }

  clear(): void {
    this.buffer = new Array(this._capacity).fill(null);
    this.frontIdx = -1;
    this.rearIdx = -1;
    this.count = 0;
    this._steps = [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. LINKED LIST — Node-based dynamic list
// Insertion at head: O(1), at position: O(n)
// Search: O(n), Deletion by value: O(n)
// ═══════════════════════════════════════════════════════════════════════════════

export class LLNode<T> {
  data: T;
  next: LLNode<T> | null = null;
  constructor(data: T) { this.data = data; }
}

export class LinkedList<T> {
  head: LLNode<T> | null = null;
  private _size: number = 0;
  private _steps: DSAStep[] = [];

  get steps() { return [...this._steps]; }
  clearSteps() { this._steps = []; }

  insertAtHead(data: T): void {
    const node = new LLNode(data);
    node.next = this.head;
    this.head = node;
    this._size++;
    this._steps.push({
      operation: 'insertAtHead',
      detail: `Inserted ${JSON.stringify(data)} at head`,
      stateSnapshot: this.snapshot(),
    });
  }

  insertAtTail(data: T): void {
    const node = new LLNode(data);
    if (!this.head) {
      this.head = node;
    } else {
      let curr = this.head;
      while (curr.next) curr = curr.next;
      curr.next = node;
    }
    this._size++;
    this._steps.push({
      operation: 'insertAtTail',
      detail: `Inserted ${JSON.stringify(data)} at tail`,
      stateSnapshot: this.snapshot(),
    });
  }

  insertAt(data: T, position: number): boolean {
    if (position < 0 || position > this._size) return false;
    if (position === 0) { this.insertAtHead(data); return true; }
    const node = new LLNode(data);
    let curr = this.head;
    for (let i = 0; i < position - 1; i++) curr = curr!.next;
    node.next = curr!.next;
    curr!.next = node;
    this._size++;
    this._steps.push({
      operation: 'insertAt',
      detail: `Inserted ${JSON.stringify(data)} at position ${position}`,
      stateSnapshot: this.snapshot(),
    });
    return true;
  }

  deleteByValue(data: T): boolean {
    if (!this.head) return false;
    if (JSON.stringify(this.head.data) === JSON.stringify(data)) {
      this.head = this.head.next;
      this._size--;
      this._steps.push({
        operation: 'delete',
        detail: `Deleted ${JSON.stringify(data)} from head`,
        stateSnapshot: this.snapshot(),
      });
      return true;
    }
    let curr = this.head;
    while (curr.next) {
      if (JSON.stringify(curr.next.data) === JSON.stringify(data)) {
        curr.next = curr.next.next;
        this._size--;
        this._steps.push({
          operation: 'delete',
          detail: `Deleted ${JSON.stringify(data)}`,
          stateSnapshot: this.snapshot(),
        });
        return true;
      }
      curr = curr.next;
    }
    return false;
  }

  search(data: T): { found: boolean; position: number; comparisons: number } {
    let curr = this.head;
    let pos = 0;
    let comparisons = 0;
    while (curr) {
      comparisons++;
      if (JSON.stringify(curr.data) === JSON.stringify(data)) {
        this._steps.push({
          operation: 'search',
          detail: `Found ${JSON.stringify(data)} at position ${pos} after ${comparisons} comparisons`,
          stateSnapshot: this.snapshot(),
        });
        return { found: true, position: pos, comparisons };
      }
      curr = curr.next;
      pos++;
    }
    this._steps.push({
      operation: 'search',
      detail: `${JSON.stringify(data)} not found after ${comparisons} comparisons`,
      stateSnapshot: this.snapshot(),
    });
    return { found: false, position: -1, comparisons };
  }

  traverse(): T[] {
    const result: T[] = [];
    let curr = this.head;
    while (curr) {
      result.push(curr.data);
      curr = curr.next;
    }
    return result;
  }

  size(): number { return this._size; }
  isEmpty(): boolean { return this._size === 0; }

  private snapshot(): string {
    return JSON.stringify(this.traverse());
  }

  clear(): void { this.head = null; this._size = 0; this._steps = []; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. CIRCULAR LINKED LIST — Cyclic traversal of blood banks
// Last node points back to head. Traversal terminates after one complete cycle.
// ═══════════════════════════════════════════════════════════════════════════════

export class CLLNode<T> {
  data: T;
  next: CLLNode<T> | null = null;
  constructor(data: T) { this.data = data; }
}

export class CircularLinkedList<T> {
  head: CLLNode<T> | null = null;
  private _size: number = 0;
  private _steps: DSAStep[] = [];

  get steps() { return [...this._steps]; }
  clearSteps() { this._steps = []; }

  insert(data: T): void {
    const node = new CLLNode(data);
    if (!this.head) {
      this.head = node;
      node.next = node; // points to itself
    } else {
      let tail = this.head;
      while (tail.next !== this.head) tail = tail.next!;
      tail.next = node;
      node.next = this.head;
    }
    this._size++;
    this._steps.push({
      operation: 'insert',
      detail: `Inserted ${JSON.stringify(data)} into circular list`,
      stateSnapshot: this.snapshot(),
    });
  }

  delete(data: T): boolean {
    if (!this.head) return false;
    // Single node
    if (this._size === 1 && JSON.stringify(this.head.data) === JSON.stringify(data)) {
      this.head = null;
      this._size = 0;
      this._steps.push({ operation: 'delete', detail: `Deleted last node ${JSON.stringify(data)}`, stateSnapshot: '[]' });
      return true;
    }
    // Head deletion
    if (JSON.stringify(this.head.data) === JSON.stringify(data)) {
      let tail = this.head;
      while (tail.next !== this.head) tail = tail.next!;
      this.head = this.head.next;
      tail.next = this.head;
      this._size--;
      this._steps.push({ operation: 'delete', detail: `Deleted head ${JSON.stringify(data)}`, stateSnapshot: this.snapshot() });
      return true;
    }
    let curr = this.head;
    do {
      if (curr.next && JSON.stringify(curr.next.data) === JSON.stringify(data)) {
        curr.next = curr.next.next;
        this._size--;
        this._steps.push({ operation: 'delete', detail: `Deleted ${JSON.stringify(data)}`, stateSnapshot: this.snapshot() });
        return true;
      }
      curr = curr.next!;
    } while (curr !== this.head);
    return false;
  }

  // Traverse exactly one full cycle, returning visited nodes
  traverseOneCycle(): T[] {
    if (!this.head) return [];
    const result: T[] = [];
    let curr: CLLNode<T> | null = this.head;
    do {
      result.push(curr!.data);
      curr = curr!.next;
    } while (curr !== this.head);
    this._steps.push({
      operation: 'traverse',
      detail: `Traversed one cycle: ${result.length} nodes visited`,
      stateSnapshot: JSON.stringify(result),
    });
    return result;
  }

  size(): number { return this._size; }
  isEmpty(): boolean { return this._size === 0; }

  private snapshot(): string {
    return JSON.stringify(this.traverseOneCycle());
  }

  clear(): void { this.head = null; this._size = 0; this._steps = []; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. DEQUE — Double-ended queue for review task worklist
// Insert/Delete at both ends: O(1) using array with shift/unshift (O(n) for
// shift/unshift in practice; a production version would use a doubly-linked list)
// ═══════════════════════════════════════════════════════════════════════════════

export class Deque<T> {
  private items: T[] = [];
  private _steps: DSAStep[] = [];

  get steps() { return [...this._steps]; }
  clearSteps() { this._steps = []; }

  insertFront(item: T): void {
    this.items.unshift(item);
    this._steps.push({
      operation: 'insertFront',
      detail: `Inserted ${JSON.stringify(item)} at front`,
      stateSnapshot: JSON.stringify(this.items),
    });
  }

  insertRear(item: T): void {
    this.items.push(item);
    this._steps.push({
      operation: 'insertRear',
      detail: `Inserted ${JSON.stringify(item)} at rear`,
      stateSnapshot: JSON.stringify(this.items),
    });
  }

  deleteFront(): T | undefined {
    if (this.isEmpty()) {
      this._steps.push({ operation: 'deleteFront', detail: 'Deque is empty', stateSnapshot: '[]' });
      return undefined;
    }
    const item = this.items.shift();
    this._steps.push({
      operation: 'deleteFront',
      detail: `Removed ${JSON.stringify(item)} from front`,
      stateSnapshot: JSON.stringify(this.items),
    });
    return item;
  }

  deleteRear(): T | undefined {
    if (this.isEmpty()) {
      this._steps.push({ operation: 'deleteRear', detail: 'Deque is empty', stateSnapshot: '[]' });
      return undefined;
    }
    const item = this.items.pop();
    this._steps.push({
      operation: 'deleteRear',
      detail: `Removed ${JSON.stringify(item)} from rear`,
      stateSnapshot: JSON.stringify(this.items),
    });
    return item;
  }

  peekFront(): T | undefined { return this.items[0]; }
  peekRear(): T | undefined { return this.items[this.items.length - 1]; }
  size(): number { return this.items.length; }
  isEmpty(): boolean { return this.items.length === 0; }
  toArray(): T[] { return [...this.items]; }
  clear(): void { this.items = []; this._steps = []; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. HASH TABLE — Custom implementation with separate chaining
// NOT a wrapper around Map/Object. Uses a custom hash function.
// ═══════════════════════════════════════════════════════════════════════════════

interface HashEntry<K, V> {
  key: K;
  value: V;
}

export class HashTable<K extends string | number, V> {
  private buckets: HashEntry<K, V>[][];
  private _size: number = 0;
  private _capacity: number;
  private _steps: DSAStep[] = [];

  get steps() { return [...this._steps]; }
  clearSteps() { this._steps = []; }
  get capacity() { return this._capacity; }
  get tableSize() { return this._size; }

  constructor(capacity: number = 16) {
    this._capacity = capacity;
    this.buckets = new Array(capacity).fill(null).map(() => []);
  }

  // Custom hash function: polynomial rolling hash modulo capacity
  private hash(key: K): number {
    const str = String(key);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % this._capacity;
    }
    return hash;
  }

  computeHash(key: K): number {
    return this.hash(key);
  }

  insert(key: K, value: V): void {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    const existing = bucket.findIndex(e => e.key === key);
    const collision = bucket.length > 0 && existing === -1;

    if (existing >= 0) {
      bucket[existing].value = value;
      this._steps.push({
        operation: 'insert (update)',
        detail: `Updated key "${key}" at bucket ${index}`,
        stateSnapshot: this.snapshot(),
      });
    } else {
      bucket.push({ key, value });
      this._size++;
      this._steps.push({
        operation: collision ? 'insert (collision)' : 'insert',
        detail: collision
          ? `Inserted key "${key}" at bucket ${index} — COLLISION with ${bucket.length - 1} existing entries (separate chaining)`
          : `Inserted key "${key}" at bucket ${index}`,
        stateSnapshot: this.snapshot(),
      });
    }
  }

  lookup(key: K): { found: boolean; value: V | undefined; bucketIndex: number; comparisons: number } {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    let comparisons = 0;
    for (const entry of bucket) {
      comparisons++;
      if (entry.key === key) {
        this._steps.push({
          operation: 'lookup',
          detail: `Found key "${key}" at bucket ${index} after ${comparisons} comparison(s)`,
          stateSnapshot: this.snapshot(),
        });
        return { found: true, value: entry.value, bucketIndex: index, comparisons };
      }
    }
    this._steps.push({
      operation: 'lookup',
      detail: `Key "${key}" not found at bucket ${index} after ${comparisons} comparison(s)`,
      stateSnapshot: this.snapshot(),
    });
    return { found: false, value: undefined, bucketIndex: index, comparisons };
  }

  get(key: K): V | undefined {
    return this.lookup(key).value;
  }

  delete(key: K): boolean {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    const idx = bucket.findIndex(e => e.key === key);
    if (idx >= 0) {
      bucket.splice(idx, 1);
      this._size--;
      this._steps.push({
        operation: 'delete',
        detail: `Deleted key "${key}" from bucket ${index}`,
        stateSnapshot: this.snapshot(),
      });
      return true;
    }
    return false;
  }

  getBuckets(): { index: number; entries: { key: K; value: V }[] }[] {
    return this.buckets.map((bucket, index) => ({
      index,
      entries: bucket.map(e => ({ key: e.key, value: e.value })),
    }));
  }

  private snapshot(): string {
    const vis = this.buckets.map((b, i) => b.length > 0 ? `[${i}]: ${b.map(e => `${e.key}`).join(' → ')}` : null).filter(Boolean);
    return vis.join(' | ');
  }

  clear(): void {
    this.buckets = new Array(this._capacity).fill(null).map(() => []);
    this._size = 0;
    this._steps = [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. LINEAR SEARCH — O(n) sequential search
// ═══════════════════════════════════════════════════════════════════════════════

export interface SearchResult {
  found: boolean;
  index: number;
  comparisons: number;
  steps: { index: number; value: number; compared: boolean; match: boolean }[];
}

export function linearSearch(arr: number[], target: number): SearchResult {
  const steps: SearchResult['steps'] = [];
  let comparisons = 0;
  for (let i = 0; i < arr.length; i++) {
    comparisons++;
    const match = arr[i] === target;
    steps.push({ index: i, value: arr[i], compared: true, match });
    if (match) return { found: true, index: i, comparisons, steps };
  }
  return { found: false, index: -1, comparisons, steps };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. BINARY SEARCH — O(log n) on sorted data
// Requires pre-sorted input. Returns first occurrence for duplicates.
// ═══════════════════════════════════════════════════════════════════════════════

export interface BinarySearchResult {
  found: boolean;
  index: number;
  comparisons: number;
  steps: { low: number; high: number; mid: number; midValue: number; comparison: string }[];
}

export function binarySearch(arr: number[], target: number): BinarySearchResult {
  const steps: BinarySearchResult['steps'] = [];
  let low = 0, high = arr.length - 1;
  let comparisons = 0;

  if (arr.length === 0) return { found: false, index: -1, comparisons: 0, steps: [] };

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    comparisons++;
    if (arr[mid] === target) {
      steps.push({ low, high, mid, midValue: arr[mid], comparison: `arr[${mid}]=${arr[mid]} == ${target} ✓` });
      // Find first occurrence
      let firstIdx = mid;
      while (firstIdx > 0 && arr[firstIdx - 1] === target) firstIdx--;
      return { found: true, index: firstIdx, comparisons, steps };
    } else if (arr[mid] < target) {
      steps.push({ low, high, mid, midValue: arr[mid], comparison: `arr[${mid}]=${arr[mid]} < ${target}, search right` });
      low = mid + 1;
    } else {
      steps.push({ low, high, mid, midValue: arr[mid], comparison: `arr[${mid}]=${arr[mid]} > ${target}, search left` });
      high = mid - 1;
    }
  }
  return { found: false, index: -1, comparisons, steps };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. INTERPOLATION SEARCH — Average O(log log n) for uniform distributions
// O(n) worst case. Requires sorted numeric keys.
// NOT always faster than binary search — depends on data distribution.
// ═══════════════════════════════════════════════════════════════════════════════

export interface InterpolationSearchResult {
  found: boolean;
  index: number;
  comparisons: number;
  steps: { low: number; high: number; probe: number; probeValue: number; comparison: string }[];
}

export function interpolationSearch(arr: number[], target: number): InterpolationSearchResult {
  const steps: InterpolationSearchResult['steps'] = [];
  let low = 0, high = arr.length - 1;
  let comparisons = 0;

  if (arr.length === 0) return { found: false, index: -1, comparisons: 0, steps: [] };

  while (low <= high && target >= arr[low] && target <= arr[high]) {
    comparisons++;

    // Guard against division by zero when all remaining values are equal
    if (arr[low] === arr[high]) {
      if (arr[low] === target) {
        steps.push({ low, high, probe: low, probeValue: arr[low], comparison: `All equal, found at ${low}` });
        return { found: true, index: low, comparisons, steps };
      }
      break;
    }

    const probe = low + Math.floor(((target - arr[low]) * (high - low)) / (arr[high] - arr[low]));

    if (probe < low || probe > high) break;

    if (arr[probe] === target) {
      steps.push({ low, high, probe, probeValue: arr[probe], comparison: `arr[${probe}]=${arr[probe]} == ${target} ✓` });
      return { found: true, index: probe, comparisons, steps };
    } else if (arr[probe] < target) {
      steps.push({ low, high, probe, probeValue: arr[probe], comparison: `arr[${probe}]=${arr[probe]} < ${target}, narrow right` });
      low = probe + 1;
    } else {
      steps.push({ low, high, probe, probeValue: arr[probe], comparison: `arr[${probe}]=${arr[probe]} > ${target}, narrow left` });
      high = probe - 1;
    }
  }
  return { found: false, index: -1, comparisons, steps };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 11. SORTING ALGORITHMS
// ═══════════════════════════════════════════════════════════════════════════════

export interface SortResult {
  sorted: number[];
  comparisons: number;
  swaps: number;
  steps: { array: number[]; action: string; indices?: number[] }[];
  timeMs: number;
}

export function bubbleSort(arr: number[]): SortResult {
  const a = [...arr];
  const steps: SortResult['steps'] = [{ array: [...a], action: 'Initial array' }];
  let comparisons = 0, swaps = 0;
  const start = performance.now();
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - 1 - i; j++) {
      comparisons++;
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps++;
        steps.push({ array: [...a], action: `Swap [${j}]=${a[j+1]} ↔ [${j+1}]=${a[j]}`, indices: [j, j + 1] });
      }
    }
  }
  return { sorted: a, comparisons, swaps, steps, timeMs: performance.now() - start };
}

export function selectionSort(arr: number[]): SortResult {
  const a = [...arr];
  const steps: SortResult['steps'] = [{ array: [...a], action: 'Initial array' }];
  let comparisons = 0, swaps = 0;
  const start = performance.now();
  for (let i = 0; i < a.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < a.length; j++) {
      comparisons++;
      if (a[j] < a[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      swaps++;
      steps.push({ array: [...a], action: `Swap [${i}] ↔ [${minIdx}]`, indices: [i, minIdx] });
    }
  }
  return { sorted: a, comparisons, swaps, steps, timeMs: performance.now() - start };
}

export function insertionSort(arr: number[]): SortResult {
  const a = [...arr];
  const steps: SortResult['steps'] = [{ array: [...a], action: 'Initial array' }];
  let comparisons = 0, swaps = 0;
  const start = performance.now();
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      comparisons++;
      a[j + 1] = a[j];
      swaps++;
      j--;
    }
    if (j >= 0) comparisons++;
    a[j + 1] = key;
    steps.push({ array: [...a], action: `Insert ${key} at position ${j + 1}`, indices: [j + 1] });
  }
  return { sorted: a, comparisons, swaps, steps, timeMs: performance.now() - start };
}

export function mergeSort(arr: number[]): SortResult {
  let comparisons = 0, swaps = 0;
  const steps: SortResult['steps'] = [{ array: [...arr], action: 'Initial array' }];
  const start = performance.now();

  function merge(left: number[], right: number[]): number[] {
    const result: number[] = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
      comparisons++;
      if (left[i] <= right[j]) {
        result.push(left[i++]);
      } else {
        result.push(right[j++]);
        swaps++;
      }
    }
    return result.concat(left.slice(i)).concat(right.slice(j));
  }

  function sort(a: number[]): number[] {
    if (a.length <= 1) return a;
    const mid = Math.floor(a.length / 2);
    const left = sort(a.slice(0, mid));
    const right = sort(a.slice(mid));
    const merged = merge(left, right);
    steps.push({ array: [...merged], action: `Merge [${left.join(',')}] + [${right.join(',')}]` });
    return merged;
  }

  const sorted = sort([...arr]);
  return { sorted, comparisons, swaps, steps, timeMs: performance.now() - start };
}

// ─── Generic Record Sorters with deterministic tie-breaking ─────────────────

export interface GenericSortResult<T> {
  sorted: T[];
  comparisons: number;
  swaps: number;
  timeMs: number;
  algorithmName: string;
}

export function bubbleSortBy<T>(
  arr: T[],
  keyFn: (item: T) => number,
  tieBreaker?: (a: T, b: T) => number,
  descending: boolean = false
): GenericSortResult<T> {
  const a = [...arr];
  let comparisons = 0, swaps = 0;
  const start = performance.now();
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - 1 - i; j++) {
      comparisons++;
      const keyA = keyFn(a[j]);
      const keyB = keyFn(a[j + 1]);
      let shouldSwap = descending ? keyA < keyB : keyA > keyB;
      if (keyA === keyB && tieBreaker) {
        shouldSwap = tieBreaker(a[j], a[j + 1]) > 0;
      }
      if (shouldSwap) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps++;
      }
    }
  }
  return { sorted: a, comparisons, swaps, timeMs: performance.now() - start, algorithmName: 'Bubble Sort' };
}

export function selectionSortBy<T>(
  arr: T[],
  keyFn: (item: T) => number,
  tieBreaker?: (a: T, b: T) => number,
  descending: boolean = false
): GenericSortResult<T> {
  const a = [...arr];
  let comparisons = 0, swaps = 0;
  const start = performance.now();
  for (let i = 0; i < a.length - 1; i++) {
    let targetIdx = i;
    for (let j = i + 1; j < a.length; j++) {
      comparisons++;
      const keyJ = keyFn(a[j]);
      const keyTarget = keyFn(a[targetIdx]);
      let isBetter = descending ? keyJ > keyTarget : keyJ < keyTarget;
      if (keyJ === keyTarget && tieBreaker) {
        isBetter = tieBreaker(a[j], a[targetIdx]) < 0;
      }
      if (isBetter) targetIdx = j;
    }
    if (targetIdx !== i) {
      [a[i], a[targetIdx]] = [a[targetIdx], a[i]];
      swaps++;
    }
  }
  return { sorted: a, comparisons, swaps, timeMs: performance.now() - start, algorithmName: 'Selection Sort' };
}

export function insertionSortBy<T>(
  arr: T[],
  keyFn: (item: T) => number,
  tieBreaker?: (a: T, b: T) => number,
  descending: boolean = false
): GenericSortResult<T> {
  const a = [...arr];
  let comparisons = 0, swaps = 0;
  const start = performance.now();
  for (let i = 1; i < a.length; i++) {
    const current = a[i];
    const currentKey = keyFn(current);
    let j = i - 1;
    while (j >= 0) {
      comparisons++;
      const jKey = keyFn(a[j]);
      let shouldShift = descending ? jKey < currentKey : jKey > currentKey;
      if (jKey === currentKey && tieBreaker) {
        shouldShift = tieBreaker(a[j], current) > 0;
      }
      if (!shouldShift) break;
      a[j + 1] = a[j];
      swaps++;
      j--;
    }
    a[j + 1] = current;
  }
  return { sorted: a, comparisons, swaps, timeMs: performance.now() - start, algorithmName: 'Insertion Sort' };
}

export function mergeSortBy<T>(
  arr: T[],
  keyFn: (item: T) => number,
  tieBreaker?: (a: T, b: T) => number,
  descending: boolean = false
): GenericSortResult<T> {
  let comparisons = 0, swaps = 0;
  const start = performance.now();

  function merge(left: T[], right: T[]): T[] {
    const result: T[] = [];
    let i = 0, j = 0;
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

  function sort(items: T[]): T[] {
    if (items.length <= 1) return items;
    const mid = Math.floor(items.length / 2);
    const left = sort(items.slice(0, mid));
    const right = sort(items.slice(mid));
    return merge(left, right);
  }

  const sorted = sort([...arr]);
  return { sorted, comparisons, swaps, timeMs: performance.now() - start, algorithmName: 'Merge Sort' };
}


// ═══════════════════════════════════════════════════════════════════════════════
// 12. GRAPH ALGORITHMS — BFS, DFS, Dijkstra
// ═══════════════════════════════════════════════════════════════════════════════

import { GraphNode, GraphEdge, AlgorithmStep } from './types';

export interface GraphAlgorithmResult {
  path: string[];
  distance: number;
  steps: AlgorithmStep[];
  visitedNodes: string[];
  exploredEdges: { from: string; to: string }[];
}

function getAdjacencyList(nodes: GraphNode[], edges: GraphEdge[]): Map<string, { to: string; weight: number }[]> {
  const adj = new Map<string, { to: string; weight: number }[]>();
  for (const node of nodes) {
    if (node.type !== 'obstacle') adj.set(node.id, []);
  }
  for (const edge of edges) {
    if (!edge.blocked) {
      adj.get(edge.from)?.push({ to: edge.to, weight: edge.weight });
      adj.get(edge.to)?.push({ to: edge.from, weight: edge.weight });
    }
  }
  return adj;
}

export function bfs(nodes: GraphNode[], edges: GraphEdge[], startId: string, endId: string): GraphAlgorithmResult {
  const adj = getAdjacencyList(nodes, edges);
  const visited = new Set<string>();
  const queue: string[] = [startId];
  const parent = new Map<string, string | null>();
  parent.set(startId, null);
  visited.add(startId);
  const steps: AlgorithmStep[] = [];
  const exploredEdges: { from: string; to: string }[] = [];
  let stepCount = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    stepCount++;
    steps.push({
      step: stepCount, action: `Visit node ${current}`, currentNode: current,
      visitedNodes: [...visited], exploredEdges: [...exploredEdges],
      queue: [...queue], description: `Dequeue ${current}, explore neighbors`,
    });

    if (current === endId) break;

    for (const { to } of adj.get(current) || []) {
      if (!visited.has(to)) {
        visited.add(to);
        parent.set(to, current);
        queue.push(to);
        exploredEdges.push({ from: current, to });
      }
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let curr: string | null | undefined = endId;
  while (curr) {
    path.unshift(curr);
    curr = parent.get(curr) ?? null;
  }

  // Calculate distance
  let distance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = edges.find(e =>
      (e.from === path[i] && e.to === path[i + 1]) ||
      (e.from === path[i + 1] && e.to === path[i])
    );
    if (edge) distance += edge.weight;
  }

  return { path: visited.has(endId) ? path : [], distance, steps, visitedNodes: [...visited], exploredEdges };
}

export function dfs(nodes: GraphNode[], edges: GraphEdge[], startId: string, endId: string): GraphAlgorithmResult {
  const adj = getAdjacencyList(nodes, edges);
  const visited = new Set<string>();
  const stack: string[] = [startId];
  const parent = new Map<string, string | null>();
  parent.set(startId, null);
  const steps: AlgorithmStep[] = [];
  const exploredEdges: { from: string; to: string }[] = [];
  let stepCount = 0;

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    stepCount++;
    steps.push({
      step: stepCount, action: `Visit node ${current}`, currentNode: current,
      visitedNodes: [...visited], exploredEdges: [...exploredEdges],
      stack: [...stack], description: `Pop ${current} from stack, explore neighbors`,
    });

    if (current === endId) break;

    for (const { to } of adj.get(current) || []) {
      if (!visited.has(to)) {
        stack.push(to);
        if (!parent.has(to)) parent.set(to, current);
        exploredEdges.push({ from: current, to });
      }
    }
  }

  const path: string[] = [];
  let curr: string | null | undefined = endId;
  while (curr) {
    path.unshift(curr);
    curr = parent.get(curr) ?? null;
  }

  let distance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = edges.find(e =>
      (e.from === path[i] && e.to === path[i + 1]) ||
      (e.from === path[i + 1] && e.to === path[i])
    );
    if (edge) distance += edge.weight;
  }

  return { path: visited.has(endId) ? path : [], distance, steps, visitedNodes: [...visited], exploredEdges };
}

export function dijkstra(nodes: GraphNode[], edges: GraphEdge[], startId: string, endId: string): GraphAlgorithmResult {
  const adj = getAdjacencyList(nodes, edges);
  const distances = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const visited = new Set<string>();
  const steps: AlgorithmStep[] = [];
  const exploredEdges: { from: string; to: string }[] = [];
  let stepCount = 0;

  for (const node of nodes) {
    if (node.type !== 'obstacle') {
      distances.set(node.id, Infinity);
    }
  }
  distances.set(startId, 0);
  parent.set(startId, null);

  // Simple priority queue using linear scan (educational implementation)
  const unvisited = new Set(nodes.filter(n => n.type !== 'obstacle').map(n => n.id));

  while (unvisited.size > 0) {
    // Find minimum distance node
    let minNode: string | null = null;
    let minDist = Infinity;
    for (const id of unvisited) {
      const d = distances.get(id) ?? Infinity;
      if (d < minDist) { minDist = d; minNode = id; }
    }

    if (minNode === null || minDist === Infinity) break;

    unvisited.delete(minNode);
    visited.add(minNode);
    stepCount++;

    const distObj: Record<string, number> = {};
    distances.forEach((v, k) => { distObj[k] = v; });

    steps.push({
      step: stepCount, action: `Select node ${minNode} (dist=${minDist})`,
      currentNode: minNode, visitedNodes: [...visited],
      exploredEdges: [...exploredEdges], distances: distObj,
      description: `Visit ${minNode} with shortest known distance ${minDist}`,
    });

    if (minNode === endId) break;

    for (const { to, weight } of adj.get(minNode) || []) {
      if (!visited.has(to)) {
        const newDist = minDist + weight;
        if (newDist < (distances.get(to) ?? Infinity)) {
          distances.set(to, newDist);
          parent.set(to, minNode);
          exploredEdges.push({ from: minNode, to });
        }
      }
    }
  }

  const path: string[] = [];
  let curr: string | null | undefined = endId;
  while (curr) {
    path.unshift(curr);
    curr = parent.get(curr) ?? null;
  }

  return {
    path: visited.has(endId) ? path : [],
    distance: distances.get(endId) ?? Infinity,
    steps, visitedNodes: [...visited], exploredEdges,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 13. BINARY SEARCH TREE (BST) — Hierarchical Expiry Indexing & Range Retrieval
// Course Outcome CO4: Tree structure for an engineering problem.
// Keys = Expiry timestamps (epoch ms); Values = Array of Inventory units with that expiry.
// Enables:
// - O(log n) average insertion and search
// - O(log n) retrieval of earliest-expiring unit (findMin)
// - O(log n + k) range query for critical expiry windows [now, now + 48h] by pruning subtrees
// - O(n) in-order traversal yielding chronologically ordered inventory
// ═══════════════════════════════════════════════════════════════════════════════

export class BSTNode<T> {
  key: number;
  data: T[];
  left: BSTNode<T> | null = null;
  right: BSTNode<T> | null = null;
  height: number = 1;

  constructor(key: number, item: T) {
    this.key = key;
    this.data = [item];
  }
}

export interface BSTRangeResult<T> {
  items: T[];
  nodesVisited: number;
  keysExamined: number[];
  steps: string[];
}

export interface BSTSearchResult<T> {
  found: boolean;
  key: number;
  items: T[];
  comparisons: number;
  steps: string[];
}

export class BinarySearchTree<T> {
  root: BSTNode<T> | null = null;
  private _size: number = 0;
  private _steps: DSAStep[] = [];

  get steps() { return [...this._steps]; }
  clearSteps() { this._steps = []; }
  get size() { return this._size; }
  isEmpty() { return this.root === null; }

  insert(key: number, item: T): void {
    const newNode = new BSTNode<T>(key, item);
    if (!this.root) {
      this.root = newNode;
      this._size++;
      this._steps.push({
        operation: 'insert',
        detail: `Inserted key ${key} at root`,
        stateSnapshot: `Root: ${key}`,
      });
      return;
    }

    let curr: BSTNode<T> | null = this.root;
    while (curr) {
      if (key === curr.key) {
        curr.data.push(item);
        this._size++;
        this._steps.push({
          operation: 'insert (duplicate key)',
          detail: `Appended item to existing key ${key} (bucket size: ${curr.data.length})`,
          stateSnapshot: `Key: ${key}, Count: ${curr.data.length}`,
        });
        return;
      } else if (key < curr.key) {
        if (!curr.left) {
          curr.left = newNode;
          this._size++;
          this._steps.push({
            operation: 'insert',
            detail: `Inserted key ${key} to the LEFT of ${curr.key}`,
            stateSnapshot: `Left child of ${curr.key}`,
          });
          return;
        }
        curr = curr.left;
      } else {
        if (!curr.right) {
          curr.right = newNode;
          this._size++;
          this._steps.push({
            operation: 'insert',
            detail: `Inserted key ${key} to the RIGHT of ${curr.key}`,
            stateSnapshot: `Right child of ${curr.key}`,
          });
          return;
        }
        curr = curr.right;
      }
    }
  }

  search(key: number): BSTSearchResult<T> {
    let curr = this.root;
    let comparisons = 0;
    const steps: string[] = [];

    while (curr) {
      comparisons++;
      steps.push(`Compare key ${key} with node ${curr.key}`);
      if (key === curr.key) {
        steps.push(`Match found at key ${curr.key} (${curr.data.length} item(s))`);
        return { found: true, key, items: [...curr.data], comparisons, steps };
      } else if (key < curr.key) {
        steps.push(`${key} < ${curr.key} → Traverse LEFT subtree`);
        curr = curr.left;
      } else {
        steps.push(`${key} > ${curr.key} → Traverse RIGHT subtree`);
        curr = curr.right;
      }
    }
    steps.push(`Key ${key} not found after ${comparisons} comparison(s)`);
    return { found: false, key, items: [], comparisons, steps };
  }

  findMin(): { key: number; items: T[] } | null {
    if (!this.root) return null;
    let curr = this.root;
    while (curr.left) curr = curr.left;
    return { key: curr.key, items: [...curr.data] };
  }

  findMax(): { key: number; items: T[] } | null {
    if (!this.root) return null;
    let curr = this.root;
    while (curr.right) curr = curr.right;
    return { key: curr.key, items: [...curr.data] };
  }

  // Range query: retrieves all items with key in [minKey, maxKey]
  // Prunes left subtree if curr.key <= minKey, prunes right subtree if curr.key >= maxKey
  rangeSearch(minKey: number, maxKey: number): BSTRangeResult<T> {
    const items: T[] = [];
    const keysExamined: number[] = [];
    const steps: string[] = [];
    let nodesVisited = 0;

    function traverse(node: BSTNode<T> | null) {
      if (!node) return;
      nodesVisited++;
      keysExamined.push(node.key);

      // If minKey < node.key, left subtree might have matching keys
      if (minKey < node.key) {
        steps.push(`Node ${node.key}: minKey ${minKey} < ${node.key} → explore LEFT`);
        traverse(node.left);
      }

      // If node.key is within [minKey, maxKey], include its items
      if (node.key >= minKey && node.key <= maxKey) {
        steps.push(`Node ${node.key} is within range [${minKey}, ${maxKey}] → COLLECT ${node.data.length} item(s)`);
        items.push(...node.data);
      }

      // If maxKey > node.key, right subtree might have matching keys
      if (maxKey > node.key) {
        steps.push(`Node ${node.key}: maxKey ${maxKey} > ${node.key} → explore RIGHT`);
        traverse(node.right);
      }
    }

    traverse(this.root);
    return { items, nodesVisited, keysExamined, steps };
  }

  inOrderTraversal(): { key: number; items: T[] }[] {
    const result: { key: number; items: T[] }[] = [];
    function traverse(node: BSTNode<T> | null) {
      if (!node) return;
      traverse(node.left);
      result.push({ key: node.key, items: [...node.data] });
      traverse(node.right);
    }
    traverse(this.root);
    return result;
  }

  clear(): void {
    this.root = null;
    this._size = 0;
    this._steps = [];
  }
}


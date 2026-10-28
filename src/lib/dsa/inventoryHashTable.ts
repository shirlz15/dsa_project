// ═══════════════════════════════════════════════════════════════════════════════
// Member 1 — Shirley Y. S. (URK25CS1081)
// Module: inventoryHashTable.ts
// Responsibility: Hash-table storage and inventory lookup by unit ID
//
// Wraps the custom HashTable DSA class from dsa-engine.ts to provide a
// domain-specific API for the Blood Navigator inventory system.
// The underlying hash table uses polynomial rolling hash with separate chaining.
//
// Complexity:
//   Insert:  O(1) average, O(n) worst-case when all keys collide
//   Lookup:  O(1) average, O(n) worst-case
//   Delete:  O(1) average, O(n) worst-case
// ═══════════════════════════════════════════════════════════════════════════════

import { HashTable, DSAStep } from '../dsa-engine';
import { InventoryUnit } from '../types';

/**
 * Result object returned by inventory hash-table lookup operations.
 */
export interface InventoryHashLookupResult {
  /** Whether the unit was found */
  found: boolean;
  /** The inventory unit data, if found */
  unit: InventoryUnit | undefined;
  /** The bucket index computed by the hash function */
  bucketIndex: number;
  /** The raw hash value computed for the key */
  computedHash: number;
  /** Number of comparisons made within the bucket (separate-chaining probe count) */
  comparisons: number;
  /** Hash table capacity (number of buckets) */
  capacity: number;
}

// DSA: HASH TABLE — INVENTORY STORAGE AND RETRIEVAL
/**
 * InventoryHashTableManager
 *
 * Purpose in Blood Navigator:
 *   Indexes blood inventory units by their unique Unit ID (e.g., 'INV-bb1-01').
 *   Enables instantaneous O(1) average-case record retrieval during emergency transfusions
 *   and provides full inspection of hash buckets, collision chains, and polynomial rolling hash.
 *
 * Viva Explanation:
 *   1. Hash Function: Computes bucketIndex = polynomialHash(unitId) % capacity (prime size 31).
 *   2. Separate Chaining: Each bucket holds an array of entries; collisions are appended to the bucket.
 *   3. Lookup: Hashes the target ID, jumps directly to that bucket, and scans only entries in that chain.
 *
 * Complexity:
 *   - Lookup/Insert/Delete: Average O(1), Worst O(n) if all keys hash to the same bucket
 *   - Space: O(n + capacity) where capacity is the number of allocated buckets
 */
export class InventoryHashTableManager {
  private table: HashTable<string, InventoryUnit>;

  /**
   * @param capacity Number of buckets — a prime number is recommended to
   *   distribute keys more uniformly and reduce collision clustering.
   */
  constructor(capacity: number = 31) {
    this.table = new HashTable<string, InventoryUnit>(capacity);
  }

  /**
   * Build / rebuild the hash table from an array of inventory units.
   * Each unit is keyed by its unique `id`.
   *
   * Time: O(n) where n = units.length (amortized O(1) per insert).
   */
  buildFromInventory(units: InventoryUnit[]): void {
    this.table.clear();
    for (const unit of units) {
      this.table.insert(unit.id, unit);
    }
  }

  /**
   * Insert or update a single inventory unit in the hash table.
   * If the key already exists the value is overwritten (update semantics).
   */
  insert(unit: InventoryUnit): void {
    this.table.insert(unit.id, unit);
  }

  /**
   * Look up an inventory unit by its ID.
   *
   * Returns a structured result containing the unit (if found), the hash
   * bucket index, number of in-bucket comparisons, and table capacity —
   * suitable for rendering the "Hash Table Inspector" UI panel.
   */
  lookup(unitId: string): InventoryHashLookupResult {
    const lookupRes = this.table.lookup(unitId);
    const computedHash = this.table.computeHash(unitId);

    return {
      found: lookupRes.found,
      unit: lookupRes.value,
      bucketIndex: lookupRes.bucketIndex,
      computedHash,
      comparisons: lookupRes.comparisons,
      capacity: this.table.capacity,
    };
  }

  /**
   * Remove an inventory unit from the hash table by ID.
   * Returns true if the unit was found and removed, false otherwise.
   */
  delete(unitId: string): boolean {
    return this.table.delete(unitId);
  }

  /**
   * Get bucket distribution for visualization.
   * Returns an array of { index, entries } where entries are the (key, value)
   * pairs chained in each bucket — useful for rendering the hash-table layout.
   */
  getBuckets(): { index: number; entries: { key: string; value: InventoryUnit }[] }[] {
    return this.table.getBuckets();
  }

  /** Retrieve DSA trace steps recorded during insert/lookup/delete operations. */
  get steps(): DSAStep[] {
    return this.table.steps;
  }

  /** Clear the accumulated DSA trace steps. */
  clearSteps(): void {
    this.table.clearSteps();
  }

  /** Current number of entries in the hash table. */
  get size(): number {
    return this.table.tableSize;
  }

  /** Number of buckets (capacity). */
  get capacity(): number {
    return this.table.capacity;
  }

  /** Compute the hash value for a given key without inserting. */
  computeHash(key: string): number {
    return this.table.computeHash(key);
  }

  /** Access the underlying generic HashTable (for backward-compatibility). */
  get raw(): HashTable<string, InventoryUnit> {
    return this.table;
  }
}

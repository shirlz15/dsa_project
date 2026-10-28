// ═══════════════════════════════════════════════════════════════════════════════
// Member 1 — Shirley Y. S. (URK25CS1081)
// Module: binarySearchTree.ts
// Responsibility: Expiry-based hierarchical indexing and range queries
// ═══════════════════════════════════════════════════════════════════════════════

import { DSAStep } from '../dsa-engine';

/**
 * Node in the Binary Search Tree.
 *
 * Each node stores:
 *  - `key`: The numeric sorting key (e.g., remaining shelf-life hours)
 *  - `data`: An array of items that share this exact key (handles duplicate expiry hours)
 *  - `left`: Pointer to the left child node (smaller keys / earlier expiry)
 *  - `right`: Pointer to the right child node (larger keys / later expiry)
 */
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

/** Result returned by a BST range query. */
export interface BSTRangeResult<T> {
  items: T[];
  nodesVisited: number;
  keysExamined: number[];
  steps: string[];
}

/** Result returned by an exact BST key search. */
export interface BSTSearchResult<T> {
  found: boolean;
  key: number;
  items: T[];
  comparisons: number;
  steps: string[];
}

// DSA: BINARY SEARCH TREE — EXPIRY RANGE QUERY
/**
 * Binary Search Tree for Expiry Hierarchical Indexing and Range Queries.
 *
 * Purpose in Blood Navigator:
 *   Indexes blood inventory units by remaining shelf life in hours.
 *   Enables clinical operators to query all units expiring within a specific
 *   window (e.g., 0 to 48 hours for urgent transfusion) without scanning
 *   the entire unsorted inventory list.
 *
 * Complexity:
 *   - Insertion: Average O(log n), Worst O(n) for a skewed tree
 *   - Exact Search: Average O(log n), Worst O(n)
 *   - Range Search: O(log n + k) where k is the number of units collected
 *   - Auxiliary Space: O(h) where h is the tree height (recursion stack)
 */
export class BinarySearchTree<T> {
  root: BSTNode<T> | null = null;
  private _size: number = 0;
  private _steps: DSAStep[] = [];

  get steps() { return [...this._steps]; }
  clearSteps() { this._steps = []; }
  get size() { return this._size; }
  isEmpty() { return this.root === null; }

  /**
   * Step 1: Insert an item with its numeric key (remaining shelf-life hours).
   *
   * Viva explanation:
   *   - If root is null, this item becomes the root.
   *   - Otherwise, compare `key` with `curr.key`:
   *       * If key == curr.key: append item to curr.data (handles duplicate expiry).
   *       * If key < curr.key: traverse left.
   *       * If key > curr.key: traverse right.
   */
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
        // Same shelf life hours: add to bucket
        curr.data.push(item);
        this._size++;
        this._steps.push({
          operation: 'insert (duplicate key)',
          detail: `Appended item to existing key ${key} (bucket size: ${curr.data.length})`,
          stateSnapshot: `Key: ${key}, Count: ${curr.data.length}`,
        });
        return;
      } else if (key < curr.key) {
        // Smaller key goes to the left subtree
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
        // Larger key goes to the right subtree
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

  /**
   * Step 2: Search for an exact shelf-life key.
   *
   * Viva explanation:
   *   Traverses down the tree by comparing target key with each node:
   *   O(log n) comparisons on average.
   */
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

  /**
   * Step 3: Find the earliest expiring unit (minimum key in BST).
   * Follows left pointers to the leftmost leaf: O(h) time.
   */
  findMin(): { key: number; items: T[] } | null {
    if (!this.root) return null;
    let curr = this.root;
    while (curr.left) curr = curr.left;
    return { key: curr.key, items: [...curr.data] };
  }

  /**
   * Step 4: Find the furthest expiring unit (maximum key in BST).
   * Follows right pointers to the rightmost leaf: O(h) time.
   */
  findMax(): { key: number; items: T[] } | null {
    if (!this.root) return null;
    let curr = this.root;
    while (curr.right) curr = curr.right;
    return { key: curr.key, items: [...curr.data] };
  }

  /**
   * Step 5: Range search for units expiring between `minKey` and `maxKey`.
   *
   * Viva explanation:
   *   Prunes branches that cannot possibly contain answers:
   *   - If minKey < node.key, the left subtree could have matches -> explore left.
   *   - If node.key is in [minKey, maxKey], collect its items.
   *   - If maxKey > node.key, the right subtree could have matches -> explore right.
   */
  rangeSearch(minKey: number, maxKey: number): BSTRangeResult<T> {
    const items: T[] = [];
    const keysExamined: number[] = [];
    const steps: string[] = [];
    let nodesVisited = 0;

    function traverse(node: BSTNode<T> | null) {
      if (!node) return;
      nodesVisited++;
      keysExamined.push(node.key);

      // Prune: only go left if minKey is less than current node's key
      if (minKey < node.key) {
        steps.push(`Node ${node.key}: minKey ${minKey} < ${node.key} → explore LEFT`);
        traverse(node.left);
      }

      // Collect if in range
      if (node.key >= minKey && node.key <= maxKey) {
        steps.push(`Node ${node.key} is within range [${minKey}, ${maxKey}] → COLLECT ${node.data.length} item(s)`);
        items.push(...node.data);
      }

      // Prune: only go right if maxKey is greater than current node's key
      if (maxKey > node.key) {
        steps.push(`Node ${node.key}: maxKey ${maxKey} > ${node.key} → explore RIGHT`);
        traverse(node.right);
      }
    }

    traverse(this.root);
    return { items, nodesVisited, keysExamined, steps };
  }

  /**
   * In-order traversal (Left, Root, Right) yielding sorted keys.
   */
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
}

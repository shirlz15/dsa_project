// ═══════════════════════════════════════════════════════════════════════════════
// Member 4 — Angeline Maria S (URK25CS1224)
// Module: graphTraversal.ts
// Responsibility: BFS and DFS for network traversal
//
// Breadth-First Search (BFS) and Depth-First Search (DFS) graph traversals
// for the Blood Navigator drone network.
//
// Graph representation:
//   - Nodes (V): Blood banks, hospital delivery waypoints, and airspace obstacles.
//   - Edges (E): Flight corridors with physical distances (weights in km).
//
// 1. BFS (Breadth-First Search):
//    - Explores all immediate neighbors at the current level before going deeper.
//    - Uses a FIFO queue.
//    - In an unweighted graph, guarantees the minimum number of hops/stops.
//    - Time Complexity: O(V + E) — visits every reachable vertex and edge once.
//    - Space Complexity: O(V) — queue and visited set.
//
// 2. DFS (Depth-First Search):
//    - Explores as deep as possible along each branch before backtracking.
//    - Uses a LIFO stack (or recursion).
//    - Useful for cycle detection, connectivity, and topological exploration.
//    - Time Complexity: O(V + E).
//    - Space Complexity: O(V) — recursion stack and visited set.
// ═══════════════════════════════════════════════════════════════════════════════

import { bfs, dfs, GraphAlgorithmResult } from '../dsa-engine';
import { GraphNode, GraphEdge } from '../types';

// Re-export the result type for consumers
export type { GraphAlgorithmResult };

/**
 * Breadth-First Search (BFS) for drone delivery pathfinding.
 *
 * Viva Explanation:
 * 1. Initialize FIFO queue with startId; mark startId as visited in a Set.
 * 2. Dequeue front node, inspect all unvisited adjacent flight corridor edges.
 * 3. Mark unvisited neighbors as visited, record predecessor (parent) pointer,
 *    and enqueue them.
 * 4. Stop when the target destination node is dequeued or queue becomes empty.
 * 5. Backtrack from destination to start using parent pointers to reconstruct
 *    the fewest-hops flight path.
 *
 * Time Complexity:  O(V + E) where V = nodes, E = corridor edges.
 * Space Complexity: O(V) for visited set, queue, and parent map.
 */
// DSA: BFS — BREADTH-FIRST GRAPH TRAVERSAL
export function runBFS(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string
): GraphAlgorithmResult {
  return bfs(nodes, edges, startId, endId);
}

/**
 * Depth-First Search (DFS) for drone delivery pathfinding.
 *
 * Viva Explanation:
 * 1. Initialize LIFO stack with startId.
 * 2. Pop the top node from stack. If already visited, continue.
 * 3. Mark popped node as visited; check if it matches the destination node.
 * 4. Push all unvisited adjacent neighbor nodes onto the stack and set parent.
 * 5. Backtrack when dead ends are reached until the goal is found or stack empty.
 * 6. Reconstruct path using parent pointers.
 *
 * Time Complexity:  O(V + E) where V = nodes, E = corridor edges.
 * Space Complexity: O(V) for stack and visited set.
 */
// DSA: DFS — DEPTH-FIRST GRAPH TRAVERSAL
export function runDFS(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string
): GraphAlgorithmResult {
  return dfs(nodes, edges, startId, endId);
}

/**
 * Check whether a destination node is reachable from a source node
 * using BFS traversal.  Returns true if a path exists.
 *
 * Time: O(V + E).
 */
export function isReachable(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string
): boolean {
  const result = bfs(nodes, edges, startId, endId);
  return result.path.length > 0;
}

/**
 * Get all nodes reachable from a given start node using BFS.
 * Useful for identifying connected components in the drone network.
 *
 * Time: O(V + E).
 */
export function getReachableNodes(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string
): string[] {
  // Run BFS to an impossible target to explore the entire connected component
  const result = bfs(nodes, edges, startId, '__unreachable__');
  return result.visitedNodes;
}

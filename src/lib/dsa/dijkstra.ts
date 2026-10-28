// ═══════════════════════════════════════════════════════════════════════════════
// Member 4 — Angeline Maria S (URK25CS1224)
// Module: dijkstra.ts
// Responsibility: Shortest weighted path calculation for drone routing
//
// Dijkstra's Shortest Path Algorithm for the Blood Navigator drone delivery network.
//
// Finds the path with minimum total flight distance (in kilometers) between two
// blood banks or hospitals across flight corridor edges.
//
// Key Invariant:
//   Edge weights must be non-negative (distances cannot be negative).
//   Once a node is marked visited, its minimum distance from source is finalized.
//
// Complexity:
//   Time:  O(V²) with linear scan; O((V + E) log V) with a binary min-heap
//   Space: O(V) for distances map, visited set, and parent reconstruction map
// ═══════════════════════════════════════════════════════════════════════════════

import { dijkstra as dijkstraCore, GraphAlgorithmResult } from '../dsa-engine';
import { GraphNode, GraphEdge } from '../types';

// Re-export the result type
export type { GraphAlgorithmResult };

/**
 * Validate that all edge weights are non-negative.
 * Dijkstra's algorithm produces incorrect results with negative weights.
 *
 * @param edges  Graph edges to validate
 * @throws Error if any edge has a negative weight
 */
function validateNonNegativeWeights(edges: GraphEdge[]): void {
  for (const edge of edges) {
    if (edge.weight < 0) {
      throw new Error(
        `Dijkstra requires non-negative edge weights. ` +
        `Edge ${edge.from} → ${edge.to} has weight ${edge.weight}.`
      );
    }
  }
}

/**
 * Dijkstra's Algorithm for minimum-distance drone routing.
 *
 * Viva Explanation:
 * 1. Initialize distance[startId] = 0, distance[otherNodes] = Infinity.
 * 2. Maintain a set of visited nodes and a parent map for path reconstruction.
 * 3. While unvisited nodes remain:
 *    a. Select unvisited node `current` with the smallest tentative distance.
 *    b. If current === endId or smallest distance is Infinity, terminate.
 *    c. For each unvisited neighbor `to` connected by an active corridor edge:
 *       - Calculate alt = distance[current] + edge.weight (Relaxation step).
 *       - If alt < distance[to], update distance[to] = alt and parent[to] = current.
 *    d. Mark `current` as visited.
 * 4. Backtrack from endId to startId using parent map to reconstruct the route.
 *
 * Time Complexity:  O(V²) with linear scan; O((V + E) log V) with priority queue.
 * Space Complexity: O(V) for distances, visited set, and parent pointers.
 */
// DSA: DIJKSTRA — SHORTEST WEIGHTED ROUTE
export function runDijkstra(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string
): GraphAlgorithmResult {
  // Validate non-negative edge weights before running
  validateNonNegativeWeights(edges);
  return dijkstraCore(nodes, edges, startId, endId);
}

/**
 * Calculate the shortest route distance between two nodes without
 * returning the full step trace.  Useful for quick distance lookups.
 *
 * @returns Distance in graph weight units (km), or Infinity if unreachable
 */
export function getShortestDistance(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string
): number {
  validateNonNegativeWeights(edges);
  const result = dijkstraCore(nodes, edges, startId, endId);
  return result.distance;
}

/**
 * Calculate the estimated flight time for a drone traversing the
 * shortest route at a given speed.
 *
 * @param nodes    Graph nodes
 * @param edges    Graph edges
 * @param startId  Source node ID
 * @param endId    Destination node ID
 * @param speedKmh Drone speed in km/h
 * @param delayMin Additional delay in minutes (weather, airspace, etc.)
 * @returns Estimated flight time in minutes, or Infinity if unreachable
 */
export function estimateFlightTime(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string,
  speedKmh: number,
  delayMin: number = 0
): number {
  const distance = getShortestDistance(nodes, edges, startId, endId);
  if (distance === Infinity || distance === 0) return distance;
  // distance is in km, speed is km/h → time = (distance / speed) * 60 minutes
  return Math.round((distance / speedKmh) * 60) + delayMin;
}

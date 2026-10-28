// Member 3 — Aneesha M (URK25CS1219)
// Module: transferFeasibility.ts
// Responsibility: Check remaining shelf life against transport constraints

import { InventoryUnit } from '../types';

/** Parameters for the feasibility check. */
export interface TransferFeasibilityInput {
  /** The blood inventory unit being considered for transfer */
  unit: InventoryUnit;
  /** Transport time from source to destination, in minutes */
  transportDurationMin: number;
  /** Time needed at the receiving facility to accept and process the unit, in minutes */
  processingDurationMin: number;
  /** Additional safety buffer to account for unforeseen delays, in minutes */
  safetyMarginMin: number;
  /** Current timestamp in milliseconds (from store.getNow()) */
  nowMs: number;
}

/** Result of the feasibility check. */
export interface TransferFeasibilityResult {
  /** Whether the transfer is feasible */
  feasible: boolean;
  /** Remaining shelf life of the unit in minutes */
  remainingShelfLifeMin: number;
  /** Total time required: transport + processing + safety margin */
  totalRequiredMin: number;
  /** Usable shelf life remaining after the transfer completes (can be negative if infeasible) */
  usableTimeAfterTransferMin: number;
  /** Human-readable explanation of why the transfer was accepted or rejected */
  reason: string;
  /** Estimated arrival timestamp (ISO string) */
  estimatedArrival: string;
  /** Estimated readiness timestamp (ISO string) — when the unit is available for use */
  estimatedReadiness: string;
}

// DSA: TRANSFER FEASIBILITY — TIME AND EXPIRY VALIDATION
/**
 * Transfer Feasibility Check — Validates Remaining Shelf Life Against Logistics Constraints.
 *
 * Purpose in Blood Navigator:
 *   Guarantees patient safety by preventing the dispatch of blood units that would
 *   expire mid-flight or during post-transit hospital lab processing.
 *
 * Viva Explanation:
 *   1. Remaining Shelf-Life: T_rem = (expiryTimestamp - now) / 60000 minutes.
 *   2. Required Total Time: T_req = transportDuration + receivingProcessing + safetyMargin.
 *   3. Usable Shelf-Life After Transfer: T_usable = T_rem - T_req.
 *   4. Decision Rules:
 *      - If T_rem <= 0: REJECT (already expired).
 *      - If unit.status != 'available': REJECT (reserved or quarantined).
 *      - If !unit.transportEligible: REJECT (failed packaging/temp check).
 *      - If T_usable <= 0: REJECT (unit would expire before or during clinical readiness).
 *      - Otherwise: ACCEPT (feasible transfer).
 *
 * Complexity:
 *   - Time: O(1) arithmetic comparisons
 *   - Auxiliary Space: O(1)
 */
export function checkTransferFeasibility(input: TransferFeasibilityInput): TransferFeasibilityResult {
  const { unit, transportDurationMin, processingDurationMin, safetyMarginMin, nowMs } = input;

  // Calculate remaining shelf life
  const expiryMs = new Date(unit.expiryTimestamp).getTime();
  const remainingShelfLifeMin = Math.floor((expiryMs - nowMs) / 60000);

  // Total time required before the unit is ready at the destination
  const totalRequiredMin = transportDurationMin + processingDurationMin + safetyMarginMin;

  // Usable time remaining after the transfer completes
  const usableTimeAfterTransferMin = remainingShelfLifeMin - totalRequiredMin;

  // Estimated timestamps
  const estimatedArrivalMs = nowMs + transportDurationMin * 60000;
  const estimatedReadinessMs = estimatedArrivalMs + processingDurationMin * 60000;
  const estimatedArrival = new Date(estimatedArrivalMs).toISOString();
  const estimatedReadiness = new Date(estimatedReadinessMs).toISOString();

  // Decision: reject if expired
  if (remainingShelfLifeMin <= 0) {
    return {
      feasible: false,
      remainingShelfLifeMin,
      totalRequiredMin,
      usableTimeAfterTransferMin,
      reason: `Unit ${unit.id} has already expired (${Math.abs(remainingShelfLifeMin)} minutes past expiry).`,
      estimatedArrival,
      estimatedReadiness,
    };
  }

  // Decision: reject if not available
  if (unit.status !== 'available') {
    return {
      feasible: false,
      remainingShelfLifeMin,
      totalRequiredMin,
      usableTimeAfterTransferMin,
      reason: `Unit ${unit.id} status is "${unit.status}" — only "available" units are eligible for transfer.`,
      estimatedArrival,
      estimatedReadiness,
    };
  }

  // Decision: reject if not transport-eligible
  if (!unit.transportEligible) {
    return {
      feasible: false,
      remainingShelfLifeMin,
      totalRequiredMin,
      usableTimeAfterTransferMin,
      reason: `Unit ${unit.id} is not transport-eligible (may require special handling or storage conditions).`,
      estimatedArrival,
      estimatedReadiness,
    };
  }

  // Decision: reject if insufficient shelf life
  if (usableTimeAfterTransferMin <= 0) {
    return {
      feasible: false,
      remainingShelfLifeMin,
      totalRequiredMin,
      usableTimeAfterTransferMin,
      reason: `Insufficient shelf life: ${remainingShelfLifeMin}m remaining, but ${totalRequiredMin}m required ` +
        `(transport: ${transportDurationMin}m + processing: ${processingDurationMin}m + safety: ${safetyMarginMin}m). ` +
        `Unit would expire before being ready for clinical use.`,
      estimatedArrival,
      estimatedReadiness,
    };
  }

  // Decision: accept
  return {
    feasible: true,
    remainingShelfLifeMin,
    totalRequiredMin,
    usableTimeAfterTransferMin,
    reason: `Transfer feasible. ${usableTimeAfterTransferMin}m of usable shelf life remains after ` +
      `transport (${transportDurationMin}m), processing (${processingDurationMin}m), and safety margin (${safetyMarginMin}m).`,
    estimatedArrival,
    estimatedReadiness,
  };
}

/**
 * Batch-check feasibility for multiple inventory units.
 * Returns results partitioned into feasible and infeasible groups.
 */
export function checkBatchFeasibility(
  units: InventoryUnit[],
  transportDurationMin: number,
  processingDurationMin: number,
  safetyMarginMin: number,
  nowMs: number
): { feasible: TransferFeasibilityResult[]; infeasible: TransferFeasibilityResult[] } {
  const feasible: TransferFeasibilityResult[] = [];
  const infeasible: TransferFeasibilityResult[] = [];

  for (const unit of units) {
    const result = checkTransferFeasibility({
      unit,
      transportDurationMin,
      processingDurationMin,
      safetyMarginMin,
      nowMs,
    });
    if (result.feasible) {
      feasible.push(result);
    } else {
      infeasible.push(result);
    }
  }

  return { feasible, infeasible };
}

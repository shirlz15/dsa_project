// ─── Time-Aware Redistribution Feasibility Engine ─────────────────────────────
// Core proposed contribution: calculates whether blood units can be transported
// to a destination in time, considering expiry, transport duration, receiving
// processing, safety margins, quantity, and eligibility.

import { InventoryUnit, BloodRequest, BloodBank, FeasibilityResult, BloodType } from './types';
import { isCompatible } from './blood-compat';

interface FeasibilityInput {
  sourceUnits: InventoryUnit[];
  destinationBank: BloodBank;
  request: BloodRequest | null;
  transportDuration: number; // minutes
  receivingProcessingDuration: number; // minutes
  safetyMargin: number; // minutes
  now: number; // current timestamp ms
  allInventory: InventoryUnit[]; // to check existing reservations
}

export function calculateFeasibility(input: FeasibilityInput): FeasibilityResult[] {
  const {
    sourceUnits, destinationBank, request, transportDuration,
    receivingProcessingDuration, safetyMargin, now, allInventory,
  } = input;

  return sourceUnits.map((unit): FeasibilityResult => {
    const reasons: string[] = [];
    const eligibilityReasons: string[] = [];
    const scoreFactors: { factor: string; value: number; weight: number }[] = [];

    // 1. Calculate remaining time
    const expiryMs = new Date(unit.expiryTimestamp).getTime();
    const remainingTime = Math.floor((expiryMs - now) / 60000); // minutes

    // 2. Calculate required time
    const requiredTime = transportDuration + receivingProcessingDuration + safetyMargin;

    // 3. Calculate usable time after transfer
    const usableTimeAfterTransfer = remainingTime - requiredTime;

    // 4. Estimated arrival and readiness
    const estimatedArrivalMs = now + transportDuration * 60000;
    const estimatedReadinessMs = estimatedArrivalMs + receivingProcessingDuration * 60000;
    const estimatedArrival = new Date(estimatedArrivalMs).toISOString();
    const estimatedReadiness = new Date(estimatedReadinessMs).toISOString();

    // 5. Time feasibility check
    let feasible = true;

    if (remainingTime <= 0) {
      reasons.push('Unit has already expired');
      feasible = false;
    }

    if (usableTimeAfterTransfer <= 0 && remainingTime > 0) {
      reasons.push(`Insufficient time: ${remainingTime} min remaining, ${requiredTime} min required (transport: ${transportDuration} + processing: ${receivingProcessingDuration} + safety: ${safetyMargin})`);
      feasible = false;
    }

    // 6. Status check
    if (unit.status !== 'available') {
      reasons.push(`Unit status is "${unit.status}" — only "available" units are eligible`);
      feasible = false;
    }

    // 7. Transport eligibility
    if (!unit.transportEligible) {
      eligibilityReasons.push('Unit is not transport-eligible');
      feasible = false;
    }

    // 8. Quantity check
    const quantityRequested = request?.quantity ?? unit.quantity;
    const quantitySufficient = unit.quantity >= quantityRequested;
    if (!quantitySufficient) {
      reasons.push(`Insufficient quantity: ${unit.quantity} available, ${quantityRequested} requested`);
    }

    // 9. Blood type compatibility (simulated eligibility — not medical advice)
    let eligibilityPassed = true;
    if (request) {
      if (!isCompatible(unit.bloodType, request.bloodType)) {
        eligibilityReasons.push(`Blood type ${unit.bloodType} is not compatible with requested ${request.bloodType} (simulated check)`);
        eligibilityPassed = false;
        feasible = false;
      }
      if (unit.componentType !== request.componentType) {
        eligibilityReasons.push(`Component ${unit.componentType} does not match requested ${request.componentType}`);
        eligibilityPassed = false;
        feasible = false;
      }
    }

    // 10. Deadline check
    let deadlineMet = true;
    let deadlineReason = 'No deadline specified';
    if (request?.neededBy) {
      const deadlineMs = new Date(request.neededBy).getTime();
      if (estimatedReadinessMs > deadlineMs) {
        deadlineMet = false;
        deadlineReason = `Estimated readiness ${new Date(estimatedReadinessMs).toLocaleTimeString()} exceeds deadline ${new Date(deadlineMs).toLocaleTimeString()}`;
        reasons.push(deadlineReason);
        feasible = false;
      } else {
        deadlineReason = `Within deadline (${Math.floor((deadlineMs - estimatedReadinessMs) / 60000)} min to spare)`;
      }
    }

    // 11. Check for existing reservations/double allocation
    const reservedForOthers = allInventory.filter(
      (u) => u.id === unit.id && u.status === 'reserved'
    ).length;
    if (reservedForOthers > 0 && unit.status === 'reserved') {
      reasons.push('Unit is already reserved for another transfer');
      feasible = false;
    }

    // 12. Score calculation (transparent factors)
    if (feasible) {
      scoreFactors.push({ factor: 'Usable time remaining', value: Math.min(usableTimeAfterTransfer / 60, 10), weight: 30 });
      scoreFactors.push({ factor: 'Transport efficiency', value: Math.max(10 - transportDuration / 30, 0), weight: 25 });
      scoreFactors.push({ factor: 'Quantity match', value: quantitySufficient ? 10 : (unit.quantity / quantityRequested) * 10, weight: 20 });
      scoreFactors.push({ factor: 'Blood type exactness', value: request && unit.bloodType === request.bloodType ? 10 : 7, weight: 15 });
      scoreFactors.push({ factor: 'Deadline margin', value: deadlineMet && request?.neededBy ? Math.min((new Date(request.neededBy).getTime() - estimatedReadinessMs) / 3600000, 10) : 5, weight: 10 });
    }

    const score = feasible
      ? scoreFactors.reduce((sum, f) => sum + f.value * (f.weight / 100), 0)
      : 0;

    return {
      unitId: unit.id,
      destinationBankId: destinationBank.id,
      remainingTime,
      transportDuration,
      receivingProcessingDuration,
      safetyMargin,
      requiredTime,
      usableTimeAfterTransfer,
      estimatedArrival,
      estimatedReadiness,
      feasible,
      reasons: reasons.length > 0 ? reasons : ['All checks passed'],
      quantityAvailable: unit.quantity,
      quantityRequested,
      quantitySufficient,
      eligibilityPassed,
      eligibilityReasons: eligibilityReasons.length > 0 ? eligibilityReasons : ['All eligibility checks passed'],
      deadlineMet,
      deadlineReason,
      score: Math.round(score * 100) / 100,
      scoreFactors,
    };
  });
}

export function rankResults(results: FeasibilityResult[]): FeasibilityResult[] {
  return [...results].sort((a, b) => {
    // Feasible first
    if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
    // Then by score descending
    return b.score - a.score;
  });
}

// ─── Proactive Expiry Monitoring & Redistribution Recommendation Engine ────────
// Autonomous decision support for evaluating near-expiry blood inventory,
// determining time-feasibility across regional corridors, and ranking optimal
// redistribution candidates without automatic dispatch.

import {
  InventoryUnit,
  BloodBank,
  BloodRequest,
  Alert,
  ExpiryThresholds,
  GraphState,
  RedistributionCandidate,
  ExpiryAlertMetadata,
} from './types';
import { isCompatible } from './blood-compat';
import { dijkstra } from './dsa-engine';

/** Format minutes into human-readable duration */
export function formatMinutes(mins: number): string {
  if (mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Calculate distance and flight duration between two blood banks */
export function calculateCorridorDistance(
  sourceBankId: string,
  destBankId: string,
  graphState: GraphState,
  bloodBanks: BloodBank[]
): { distanceKm: number; durationMin: number } {
  if (sourceBankId === destBankId) {
    return { distanceKm: 0, durationMin: 0 };
  }

  const srcBank = bloodBanks.find((b) => b.id === sourceBankId);
  const dstBank = bloodBanks.find((b) => b.id === destBankId);

  // Try finding via graph nodes
  const sId =
    graphState.nodes.find((n) => n.id.includes(sourceBankId) || (srcBank && n.label.includes(srcBank.name)))?.id ||
    (sourceBankId === 'bb-1' ? 'n-bb1' : sourceBankId === 'bb-2' ? 'n-bb2' : sourceBankId === 'bb-3' ? 'n-bb3' : sourceBankId === 'bb-4' ? 'n-bb4' : 'n-bb5');

  const dId =
    graphState.nodes.find((n) => n.id.includes(destBankId) || (dstBank && n.label.includes(dstBank.name)))?.id ||
    (destBankId === 'bb-1' ? 'n-bb1' : destBankId === 'bb-2' ? 'n-bb2' : destBankId === 'bb-3' ? 'n-bb3' : destBankId === 'bb-4' ? 'n-bb4' : 'n-bb5');

  try {
    const route = dijkstra(graphState.nodes, graphState.edges, sId, dId);
    if (route && route.path.length > 0 && route.distance > 0) {
      // 60 km/h cruising speed -> 1 km = 1 minute flight
      const distanceKm = Math.round(route.distance * 10) / 10;
      const durationMin = Math.max(Math.round(distanceKm), 15);
      return { distanceKm, durationMin };
    }
  } catch (err) {
    // Fallback to geometric distance if graph search throws
  }

  // Fallback: Haversine distance between coordinates
  if (srcBank && dstBank) {
    const dLat = (dstBank.lat - srcBank.lat) * 111;
    const dLng = (dstBank.lng - srcBank.lng) * 111 * Math.cos((srcBank.lat * Math.PI) / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    const distanceKm = Math.max(Math.round(dist * 10) / 10, 10);
    return { distanceKm, durationMin: Math.max(Math.round(distanceKm), 15) };
  }

  return { distanceKm: 45, durationMin: 45 };
}

/**
 * Evaluate candidate destinations for a unit approaching expiry.
 * Strictly adheres to formula: (Remaining Shelf Life - Transit - Receiving - Buffer) > 0
 */
export function evaluateRedistributionForUnit(
  unit: InventoryUnit,
  sourceBank: BloodBank,
  allBanks: BloodBank[],
  requests: BloodRequest[],
  graphState: GraphState,
  nowMs: number
): {
  bestCandidate: RedistributionCandidate | null;
  candidates: RedistributionCandidate[];
  summaryReason: string;
} {
  const expiryMs = new Date(unit.expiryTimestamp).getTime();
  const remainingMinutes = Math.floor((expiryMs - nowMs) / 60000);

  if (remainingMinutes <= 0 || unit.status !== 'available' || !unit.transportEligible) {
    return {
      bestCandidate: null,
      candidates: [],
      summaryReason: remainingMinutes <= 0
        ? 'Unit has already passed expiry. Spoilage quarantine required.'
        : `Unit status is "${unit.status}" (transport eligible: ${unit.transportEligible ? 'yes' : 'no'}). Not available for redistribution.`,
    };
  }

  const otherBanks = allBanks.filter((b) => b.id !== sourceBank.id);
  const candidates: RedistributionCandidate[] = [];

  for (const destBank of otherBanks) {
    // Check facility active status
    const isDeactivated = destBank.status === 'deactivated';

    const { distanceKm, durationMin } = calculateCorridorDistance(
      sourceBank.id,
      destBank.id,
      graphState,
      allBanks
    );

    const receivingDurationMin = 30; // 30 min arrival handling & inspection
    const safetyMarginMin = 30;    // 30 min minimum clinical buffer
    const totalRequiredTimeMin = durationMin + receivingDurationMin + safetyMarginMin;
    const usableTimeAfterTransferMin = remainingMinutes - totalRequiredTimeMin;
    const timeFeasible = usableTimeAfterTransferMin > 0;

    // Check outstanding requests for this destination bank
    const matchingRequests = requests.filter(
      (r) =>
        r.destinationBankId === destBank.id &&
        (r.status === 'pending' || r.status === 'processing')
    );

    if (matchingRequests.length > 0) {
      for (const req of matchingRequests) {
        const componentMatch = unit.componentType === req.componentType;
        const bloodCompat = isCompatible(unit.bloodType, req.bloodType);
        const quantitySufficient = unit.quantity >= req.quantity;

        const isFeasible =
          !isDeactivated &&
          timeFeasible &&
          componentMatch &&
          bloodCompat;

        let reason = '';
        if (isFeasible) {
          reason = `Feasible match: ${destBank.name} requires ${req.quantity} units (${req.priority.toUpperCase()}). Transfer takes ${durationMin}m flight + ${receivingDurationMin}m receipt + ${safetyMarginMin}m buffer (${totalRequiredTimeMin}m required). Leaves ${formatMinutes(usableTimeAfterTransferMin)} usable shelf life.`;
        } else if (isDeactivated) {
          reason = `Rejected: Destination bank ${destBank.name} is deactivated from active network operations.`;
        } else if (!timeFeasible) {
          reason = `Infeasible: Required transfer time (${totalRequiredTimeMin}m) exceeds remaining shelf life (${formatMinutes(remainingMinutes)}). Usable time after transfer: ${usableTimeAfterTransferMin}m.`;
        } else if (!componentMatch) {
          reason = `Rejected: Component mismatch (Unit is ${unit.componentType}, requested ${req.componentType}).`;
        } else if (!bloodCompat) {
          reason = `Rejected: Blood type ${unit.bloodType} is not compatible with requested ${req.bloodType}.`;
        }

        // Scoring policy: Urgency + usable margin + transport proximity + quantity match
        let score = 0;
        if (isFeasible) {
          const priorityScore = req.priority === 'emergency' ? 40 : req.priority === 'urgent' ? 28 : 16;
          const usableScore = Math.min((usableTimeAfterTransferMin / 60) * 4, 30);
          const distanceEfficiency = Math.max(20 - distanceKm * 0.15, 0);
          const quantityScore = quantitySufficient ? 10 : Math.max((unit.quantity / req.quantity) * 10, 2);
          score = Math.round((priorityScore + usableScore + distanceEfficiency + quantityScore) * 10) / 10;
        }

        candidates.push({
          destinationBankId: destBank.id,
          destinationBankName: destBank.name,
          requestId: req.id,
          hospitalName: destBank.city,
          distanceKm,
          transportDurationMin: durationMin,
          receivingDurationMin,
          safetyMarginMin,
          totalRequiredTimeMin,
          usableTimeAfterTransferMin,
          feasible: isFeasible,
          score,
          reason,
          quantityRequested: req.quantity,
          bloodCompatibilityPassed: bloodCompat,
        });
      }
    } else {
      // General facility candidate without an existing request
      const isFeasible = !isDeactivated && timeFeasible;
      const reason = isFeasible
        ? `Feasible preventive transfer: ${destBank.name} (${destBank.city}) within safe corridor range (${distanceKm} km, ${durationMin}m flight). Leaves ${formatMinutes(usableTimeAfterTransferMin)} usable time. No pending hospital order registered.`
        : isDeactivated
        ? `Rejected: Destination bank ${destBank.name} is deactivated.`
        : `Infeasible: Required transfer time (${totalRequiredTimeMin}m) exceeds remaining shelf life (${formatMinutes(remainingMinutes)}).`;

      const score = isFeasible
        ? Math.round((Math.min((usableTimeAfterTransferMin / 60) * 3, 25) + Math.max(20 - distanceKm * 0.2, 0)) * 10) / 10
        : 0;

      candidates.push({
        destinationBankId: destBank.id,
        destinationBankName: destBank.name,
        requestId: null,
        hospitalName: destBank.city,
        distanceKm,
        transportDurationMin: durationMin,
        receivingDurationMin,
        safetyMarginMin,
        totalRequiredTimeMin,
        usableTimeAfterTransferMin,
        feasible: isFeasible,
        score,
        reason,
        quantityRequested: 0,
        bloodCompatibilityPassed: true,
      });
    }
  }

  // Sort candidates: Feasible first, then highest score
  candidates.sort((a, b) => {
    if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
    return b.score - a.score;
  });

  const bestCandidate = candidates.find((c) => c.feasible) || null;

  let summaryReason = '';
  if (bestCandidate) {
    summaryReason = `Recommended Action: Transfer ${unit.quantity} units to ${bestCandidate.destinationBankName} (${bestCandidate.reason})`;
  } else {
    summaryReason = `No feasible destination found: Out of ${otherBanks.length} participating regional facilities, none satisfy the time-feasibility threshold (${formatMinutes(remainingMinutes)} remaining vs corridor transit & processing), or active hospital requisitions do not match. Suggest localized administrative prioritization.`;
  }

  return {
    bestCandidate,
    candidates,
    summaryReason,
  };
}

/**
 * Scan canonical inventory and synchronize proactive expiry notifications & recommendations.
 * Prevents duplicates, preserves read/resolved states, and re-alerts when severity escalates.
 */
export function syncExpiryAlertsAndRecommendations(state: {
  inventory: InventoryUnit[];
  bloodBanks: BloodBank[];
  requests: BloodRequest[];
  alerts: Alert[];
  expiryThresholds: ExpiryThresholds;
  graphState: GraphState;
  getNow: () => number;
}): Alert[] {
  const { inventory, bloodBanks, requests, alerts, expiryThresholds, graphState, getNow } = state;
  const nowMs = getNow();

  // Create a map of existing alerts by linkedRecordId for inventory
  const existingExpiryAlerts = new Map<string, Alert>();
  const otherAlerts: Alert[] = [];

  for (const alert of alerts) {
    if (
      alert.linkedRecordType === 'inventory' &&
      alert.linkedRecordId &&
      (alert.type === 'expiring_soon' || alert.type === 'expired')
    ) {
      existingExpiryAlerts.set(alert.linkedRecordId, alert);
    } else {
      otherAlerts.push(alert);
    }
  }

  const updatedExpiryAlerts: Alert[] = [];

  for (const unit of inventory) {
    const bank = bloodBanks.find((b) => b.id === unit.bloodBankId);
    const bankName = bank?.name || unit.bloodBankId;
    const expiryMs = new Date(unit.expiryTimestamp).getTime();
    const remainingMinutes = Math.floor((expiryMs - nowMs) / 60000);
    const remainingHours = remainingMinutes / 60;

    // Check if unit is in an active transfer
    const isTransferredOrUsed = unit.status === 'in_transit' || unit.status === 'used';

    const existingAlert = existingExpiryAlerts.get(unit.id);

    if (isTransferredOrUsed) {
      // If it was already resolved or exists, mark resolved
      if (existingAlert) {
        updatedExpiryAlerts.push({
          ...existingAlert,
          resolved: true,
          resolvedAt: existingAlert.resolvedAt || new Date().toISOString(),
          message: `${unit.id} (${unit.bloodType} ${unit.componentType}) is ${unit.status} — expiry alert resolved.`,
        });
      }
      continue;
    }

    // Determine current alert level
    let targetSeverity: 'critical' | 'warning' | null = null;
    let targetType: 'expiring_soon' | 'expired' | null = null;

    if (remainingMinutes <= 0 || unit.status === 'expired') {
      targetSeverity = 'critical';
      targetType = 'expired';
    } else if (remainingHours <= expiryThresholds.criticalHours) {
      targetSeverity = 'critical';
      targetType = 'expiring_soon';
    } else if (remainingHours <= expiryThresholds.warningHours) {
      targetSeverity = 'warning';
      targetType = 'expiring_soon';
    }

    if (!targetSeverity || !targetType) {
      // Normal shelf life (> warningHours)
      if (existingAlert) {
        // Shelf life is restored or threshold relaxed
        updatedExpiryAlerts.push({
          ...existingAlert,
          resolved: true,
          resolvedAt: existingAlert.resolvedAt || new Date().toISOString(),
          message: `${unit.id} shelf life is above warning threshold (${Math.round(remainingHours)}h remaining).`,
        });
      }
      continue;
    }

    // Run redistribution recommendation
    const evaluation = bank
      ? evaluateRedistributionForUnit(unit, bank, bloodBanks, requests, graphState, nowMs)
      : { bestCandidate: null, candidates: [], summaryReason: 'Facility not found' };

    const remainingStr = remainingMinutes <= 0 ? 'EXPIRED' : `${formatMinutes(remainingMinutes)} remaining`;

    const recommendedAction = evaluation.bestCandidate
      ? `Review redistribution to ${evaluation.bestCandidate.destinationBankName} (Usable margin: ${formatMinutes(evaluation.bestCandidate.usableTimeAfterTransferMin)})`
      : evaluation.summaryReason;

    const message = targetType === 'expired'
      ? `${unit.quantity} units of ${unit.bloodType} ${unit.componentType} (Batch ${unit.id}) at ${bankName} have expired.`
      : `${unit.bloodType} ${unit.componentType} (Batch ${unit.id}, ${unit.quantity} units) at ${bankName} expires in ${remainingStr}. Priority: ${targetSeverity.toUpperCase()}.`;

    const metadata: ExpiryAlertMetadata = {
      bloodBankId: unit.bloodBankId,
      bloodBankName: bankName,
      unitId: unit.id,
      bloodType: unit.bloodType,
      componentType: unit.componentType,
      quantity: unit.quantity,
      expiryTimestamp: unit.expiryTimestamp,
      remainingMinutes,
      recommendedAction,
      bestCandidate: evaluation.bestCandidate,
      candidatesEvaluated: evaluation.candidates,
      rejectionReasonSummary: evaluation.bestCandidate ? undefined : evaluation.summaryReason,
    };

    if (existingAlert) {
      // Check if severity escalated (e.g. from warning to critical)
      const severityEscalated =
        (existingAlert.severity === 'warning' && targetSeverity === 'critical') ||
        (existingAlert.type === 'expiring_soon' && targetType === 'expired');

      updatedExpiryAlerts.push({
        ...existingAlert,
        type: targetType,
        severity: targetSeverity,
        message,
        metadata,
        // Re-alert if severity escalated meaningfully; otherwise maintain existing read/resolved state
        read: severityEscalated ? false : existingAlert.read,
        resolved: targetType === 'expired' ? false : existingAlert.resolved,
      });
    } else {
      // Create new proactive notification
      updatedExpiryAlerts.push({
        id: `alert-exp-${unit.id}`,
        type: targetType,
        severity: targetSeverity,
        message,
        linkedRecordId: unit.id,
        linkedRecordType: 'inventory',
        read: false,
        resolved: false,
        createdAt: new Date().toISOString(),
        metadata,
      });
    }
  }

  // Combine other alerts (system, delayed, low stock) with synchronized expiry alerts
  return [...otherAlerts, ...updatedExpiryAlerts];
}

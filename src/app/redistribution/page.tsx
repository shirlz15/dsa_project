'use client';

import { useStore } from '@/lib/store';
import {
  Route, Play, Check, X, RefreshCw, ArrowRight, Clock, AlertTriangle,
  RotateCw, Layers, Sparkles, Plane, ShieldAlert, CheckCircle, Info, ChevronRight,
  ChevronDown, ExternalLink, Calendar, MapPin, ArrowRightLeft, Send
} from 'lucide-react';
import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { calculateFeasibility, rankResults } from '@/lib/feasibility-engine';
import { CircularLinkedList, Deque, dijkstra, bubbleSortBy, selectionSortBy, insertionSortBy, mergeSortBy, GenericSortResult } from '@/lib/dsa-engine';
import { BloodBank, ReviewTask, FeasibilityResult } from '@/lib/types';
import DsaUsedSection from '@/components/DsaUsedSection';

function formatMin(m: number): string {
  if (m <= 0) return '0m';
  const h = Math.floor(m / 60);
  const mins = Math.round(m % 60);
  return h > 0 ? `${h}h ${mins}m` : `${mins}m`;
}

type SortAlgo = 'merge' | 'insertion' | 'selection' | 'bubble';

interface PlannerReviewTask extends ReviewTask {
  sourceBankName?: string;
  destBankName?: string;
  targetDestBankId?: string;
  associatedRequestId?: string;
  actionLabel?: string;
  expiryHoursRemaining?: number;
}

function RedistributionContent() {
  const router = useRouter();
  const bloodBanks = useStore((s) => s.bloodBanks);
  const inventory = useStore((s) => s.inventory);
  const requests = useStore((s) => s.requests);
  const getNow = useStore((s) => s.getNow);
  const createTransfer = useStore((s) => s.createTransfer);
  const approveTransfer = useStore((s) => s.approveTransfer);
  const transfers = useStore((s) => s.transfers);
  const graphState = useStore((s) => s.graphState);
  const setFeasibilityResults = useStore((s) => s.setFeasibilityResults);
  const lastFeasibilityResults = useStore((s) => s.lastFeasibilityResults);

  const searchParams = useSearchParams();
  const paramUnitId = searchParams.get('unitId');
  const paramSourceBankId = searchParams.get('sourceBankId');
  const paramDestBankId = searchParams.get('destBankId');
  const paramRequestId = searchParams.get('requestId');

  const now = getNow();

  // Core configuration
  const [sourceBankId, setSourceBankId] = useState('');
  const [destBankId, setDestBankId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [transportMode, setTransportMode] = useState<'ground' | 'drone'>('drone');
  const [transportDuration, setTransportDuration] = useState(120);
  const [processingDuration, setProcessingDuration] = useState(60);
  const [safetyMargin, setSafetyMargin] = useState(60);
  const [simulatedDelay, setSimulatedDelay] = useState(0); // minutes
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [workflowNotice, setWorkflowNotice] = useState<string | null>(null);

  // Selected candidate and submission state for transfer authorization
  const [selectedCandidateUnitId, setSelectedCandidateUnitId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Prefill parameters from advisory recommendations or query params
  useEffect(() => {
    if (paramSourceBankId) setSourceBankId(paramSourceBankId);
    if (paramDestBankId) setDestBankId(paramDestBankId);
    if (paramRequestId) setRequestId(paramRequestId);
    if (paramUnitId) {
      setSelectedUnits([paramUnitId]);
    }
  }, [paramSourceBankId, paramDestBankId, paramRequestId, paramUnitId]);

  // When requestId is selected by admin, auto-link destination and suggest component match
  const handleSelectRequest = (rId: string) => {
    setRequestId(rId);
    setValidationError(null);
    if (!rId) return;

    const req = requests.find((r) => r.id === rId);
    if (req) {
      setDestBankId(req.destinationBankId);
      // If no source bank is chosen, check if an available unit of the matching component exists
      if (!sourceBankId) {
        const matchingUnit = inventory.find(
          (u) =>
            u.status === 'available' &&
            u.transportEligible &&
            u.bloodBankId !== req.destinationBankId &&
            u.componentType === req.componentType
        );
        if (matchingUnit) {
          setSourceBankId(matchingUnit.bloodBankId);
          setSelectedUnits([matchingUnit.id]);
        }
      }
      setWorkflowNotice(
        `Linked request ${req.id} (${req.bloodType} ${req.componentType} ×${req.quantity}). Destination set to ${
          bloodBanks.find((b) => b.id === req.destinationBankId)?.name || req.destinationBankId
        }.`
      );
    }
  };

  // Sorting
  const [resultSortAlgo, setResultSortAlgo] = useState<SortAlgo>('merge');
  const [sortField, setSortField] = useState<'usableTime' | 'score' | 'remaining'>('usableTime');

  // ─── DSA 1: Circular Linked List for Periodic Blood Bank Review Cycle ──────
  const bankCircularList = useMemo(() => {
    const cll = new CircularLinkedList<BloodBank>();
    bloodBanks.forEach((b) => cll.insert(b));
    return cll;
  }, [bloodBanks]);

  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [reviewVisitedCount, setReviewVisitedCount] = useState(0);
  const [reviewCycleActive, setReviewCycleActive] = useState(false);
  const [cycleCompleted, setCycleCompleted] = useState(false);

  const cycleBankList = useMemo(() => {
    return bankCircularList.traverseOneCycle();
  }, [bankCircularList]);

  const currentReviewedBank = cycleBankList[currentReviewIndex % (cycleBankList.length || 1)] || bloodBanks[0] || null;
  const nextBankInCycle = cycleBankList[(currentReviewIndex + 1) % (cycleBankList.length || 1)] || null;

  const handleStartReviewCycle = () => {
    setCurrentReviewIndex(0);
    setReviewVisitedCount(1);
    setReviewCycleActive(true);
    setCycleCompleted(false);
    if (cycleBankList[0]) {
      setSourceBankId(cycleBankList[0].id);
      setSelectedUnits([]);
      setWorkflowNotice(`Inspecting Bank 1 of ${cycleBankList.length}: ${cycleBankList[0].name}`);
    }
  };

  const handleNextInCycle = () => {
    if (reviewVisitedCount >= cycleBankList.length) {
      // Completed exactly one full round - terminate
      setReviewCycleActive(false);
      setCycleCompleted(true);
      setWorkflowNotice(`Completed 1 full rotation across all ${cycleBankList.length} blood banks.`);
      return;
    }
    const nextIdx = (currentReviewIndex + 1) % cycleBankList.length;
    setCurrentReviewIndex(nextIdx);
    setReviewVisitedCount((prev) => prev + 1);
    if (cycleBankList[nextIdx]) {
      setSourceBankId(cycleBankList[nextIdx].id);
      setSelectedUnits([]);
      setWorkflowNotice(`Inspecting Bank ${reviewVisitedCount + 1} of ${cycleBankList.length}: ${cycleBankList[nextIdx].name}`);
    }
  };

  // ─── DSA 2: Deque Worklist for Redistribution Review Tasks ──────────────────
  const [dequeTasks, setDequeTasks] = useState<PlannerReviewTask[]>(() => [
    {
      id: 'task-1',
      title: 'Emergency Expiry Risk (<24h)',
      description: 'Unit INV-bb1-01 approaching expiry within 18h at Ramanathapuram GH',
      priority: 'emergency',
      queueEnd: 'front',
      reason: 'Urgent expiry threat: Policy mandates review at FRONT of worklist to prevent waste',
      timestamp: '2025-01-15T08:00:00.000Z',
      associatedBankId: 'bb-1',
      associatedUnitId: 'INV-bb1-01',
      targetDestBankId: 'bb-5',
      sourceBankName: 'Ramanathapuram GH',
      destBankName: 'GRH Madurai',
      expiryHoursRemaining: 18,
      actionLabel: 'Review Stock',
    },
    {
      id: 'task-2',
      title: 'Trauma O- Deficit Request',
      description: 'GRH Madurai emergency request for 2 units O- Packed RBC',
      priority: 'emergency',
      queueEnd: 'front',
      reason: 'Trauma priority request: Prioritized at FRONT for immediate redistribution match',
      timestamp: '2025-01-15T08:05:00.000Z',
      associatedBankId: 'bb-2',
      targetDestBankId: 'bb-5',
      associatedRequestId: 'req-1',
      sourceBankName: 'Paramakudi GH',
      destBankName: 'GRH Madurai',
      actionLabel: 'View Request',
    },
    {
      id: 'task-3',
      title: 'Surplus Platelet Rebalance',
      description: 'Paramakudi GH has surplus Platelets; check Rameswaram GH need',
      priority: 'routine',
      queueEnd: 'rear',
      reason: 'Routine rebalancing: Policy routes non-critical inventory checks to REAR',
      timestamp: '2025-01-15T07:30:00.000Z',
      associatedBankId: 'bb-2',
      associatedUnitId: 'INV-bb2-03',
      targetDestBankId: 'bb-3',
      sourceBankName: 'Paramakudi GH',
      destBankName: 'Rameswaram GH',
      expiryHoursRemaining: 72,
      actionLabel: 'Review Stock',
    },
    {
      id: 'task-4',
      title: 'Scheduled Weekly Audit',
      description: 'Kamuthi Hospital scheduled component inventory alignment',
      priority: 'routine',
      queueEnd: 'rear',
      reason: 'Scheduled weekly check: Placed at REAR according to standard FIFO queueing',
      timestamp: '2025-01-15T07:00:00.000Z',
      associatedBankId: 'bb-4',
      targetDestBankId: 'bb-1',
      sourceBankName: 'Kamuthi Hospital',
      destBankName: 'Ramanathapuram GH',
      actionLabel: 'Plan Transfer',
    },
  ]);

  const handlePopFrontTask = () => {
    if (dequeTasks.length === 0) return;
    const task = dequeTasks[0];
    setDequeTasks((prev) => prev.slice(1));
    if (task.associatedBankId) {
      setSourceBankId(task.associatedBankId);
    }
  };

  const handlePopRearTask = () => {
    if (dequeTasks.length === 0) return;
    setDequeTasks((prev) => prev.slice(0, -1));
  };

  const handleInsertTask = (priority: 'emergency' | 'routine') => {
    const isFront = priority === 'emergency';
    const newTask: PlannerReviewTask = {
      id: `task-${Date.now()}`,
      title: isFront ? 'Emergency Expiry Risk' : 'Routine Surplus Review',
      description: isFront ? 'Critical inventory unit approaching expiry threshold' : 'Standard rebalancing review task',
      priority,
      queueEnd: isFront ? 'front' : 'rear',
      reason: isFront
        ? 'High urgency: Application policy requires insertion at FRONT of review worklist'
        : 'Routine task: Application policy appends to REAR of review worklist',
      timestamp: new Date().toISOString(),
      associatedBankId: isFront ? 'bb-1' : 'bb-4',
      targetDestBankId: isFront ? 'bb-5' : 'bb-2',
      sourceBankName: isFront ? 'Ramanathapuram GH' : 'Kamuthi Hospital',
      destBankName: isFront ? 'GRH Madurai' : 'Paramakudi GH',
      actionLabel: 'Review Stock',
    };

    setDequeTasks((prev) => (isFront ? [newTask, ...prev] : [...prev, newTask]));
  };

  // ─── Click Review Action from Task Row ──────────────────────────────────────
  const handleSelectTaskForReview = (task: PlannerReviewTask) => {
    if (task.associatedBankId) setSourceBankId(task.associatedBankId);
    if (task.targetDestBankId) setDestBankId(task.targetDestBankId);
    if (task.associatedRequestId) setRequestId(task.associatedRequestId);
    if (task.associatedUnitId) {
      setSelectedUnits([task.associatedUnitId]);
    } else {
      setSelectedUnits([]);
    }
    setWorkflowNotice(`Loaded review context for: "${task.title}". Configure parameters and run analysis below.`);
    
    // Smooth scroll down to workspace
    const el = document.getElementById('planning-workspace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ─── DSA 3: Graph / Dijkstra Route Connection for Drone Transport ───────────
  useEffect(() => {
    if (transportMode === 'drone' && sourceBankId && destBankId) {
      const srcNode = graphState.nodes.find((n) => n.id.includes(sourceBankId) || n.label.includes(sourceBank?.name || ''));
      const dstNode = graphState.nodes.find((n) => n.id.includes(destBankId) || n.label.includes(destBank?.name || ''));

      const sId = srcNode?.id || (sourceBankId === 'bb-1' ? 'n-bb1' : sourceBankId === 'bb-2' ? 'n-bb2' : sourceBankId === 'bb-3' ? 'n-bb3' : sourceBankId === 'bb-4' ? 'n-bb4' : 'n-bb5');
      const dId = dstNode?.id || (destBankId === 'bb-1' ? 'n-bb1' : destBankId === 'bb-2' ? 'n-bb2' : destBankId === 'bb-3' ? 'n-bb3' : destBankId === 'bb-4' ? 'n-bb4' : 'n-bb5');

      const route = dijkstra(graphState.nodes, graphState.edges, sId, dId);
      if (route && route.path.length > 0 && route.distance > 0) {
        // Drone speed 60 km/h -> duration = (distance / 60) * 60 min = distance in minutes
        const flightMin = Math.round(route.distance) + simulatedDelay;
        setTransportDuration(flightMin);
      }
    } else if (transportMode === 'ground') {
      setTransportDuration(120 + simulatedDelay);
    }
  }, [transportMode, sourceBankId, destBankId, simulatedDelay, graphState]);

  const sourceBank = bloodBanks.find((b) => b.id === sourceBankId);
  const destBank = bloodBanks.find((b) => b.id === destBankId);
  const selectedRequest = requests.find((r) => r.id === requestId);
  const pendingRequests = requests.filter((r) => r.status === 'pending' || r.status === 'processing');

  const sourceUnits = useMemo(() => {
    return inventory.filter((u) => u.bloodBankId === sourceBankId && u.status === 'available' && u.transportEligible);
  }, [inventory, sourceBankId]);

  // ─── Feasibility Calculation & Sorting ──────────────────────────────────────
  const handleRunAnalysis = () => {
    if (!destBankId || selectedUnits.length === 0) return;
    const units = inventory.filter((u) => selectedUnits.includes(u.id));
    const destination = bloodBanks.find((b) => b.id === destBankId);
    if (!destination) return;

    const results = calculateFeasibility({
      sourceUnits: units,
      destinationBank: destination,
      request: selectedRequest || null,
      transportDuration,
      receivingProcessingDuration: processingDuration,
      safetyMargin,
      now,
      allInventory: inventory,
    });

    setFeasibilityResults(results);
    setCompareMode(false);
    setValidationError(null);

    // Auto-select first feasible candidate
    const firstFeasible = results.find((r) => r.feasible);
    if (firstFeasible) {
      setSelectedCandidateUnitId(firstFeasible.unitId);
    } else if (results[0]) {
      setSelectedCandidateUnitId(results[0].unitId);
    }
  };

  const handleCompareDestinations = () => {
    if (selectedUnits.length === 0) return;
    const units = inventory.filter((u) => selectedUnits.includes(u.id));
    const allResults = bloodBanks
      .filter((b) => b.id !== sourceBankId)
      .flatMap((dest) =>
        calculateFeasibility({
          sourceUnits: units,
          destinationBank: dest,
          request: selectedRequest || null,
          transportDuration,
          receivingProcessingDuration: processingDuration,
          safetyMargin,
          now,
          allInventory: inventory,
        })
      );

    setFeasibilityResults(allResults);
    setCompareMode(true);
    setValidationError(null);

    const firstFeasible = allResults.find((r) => r.feasible);
    if (firstFeasible) {
      setSelectedCandidateUnitId(firstFeasible.unitId);
    } else if (allResults[0]) {
      setSelectedCandidateUnitId(allResults[0].unitId);
    }
  };

  // Sort candidate feasibility results using custom sorting algorithm
  const { sortedFeasibilityResults, sortMetrics } = useMemo(() => {
    if (lastFeasibilityResults.length === 0) return { sortedFeasibilityResults: [], sortMetrics: null };

    const keyFn = (r: FeasibilityResult): number => {
      if (sortField === 'usableTime') return r.usableTimeAfterTransfer;
      if (sortField === 'score') return r.score * 100;
      return r.remainingTime;
    };

    // Tie-breaker: unit ID comparison
    const tieBreaker = (a: FeasibilityResult, b: FeasibilityResult) => a.unitId.localeCompare(b.unitId);

    let result: GenericSortResult<FeasibilityResult>;
    const descending = true;

    switch (resultSortAlgo) {
      case 'bubble':
        result = bubbleSortBy(lastFeasibilityResults, keyFn, tieBreaker, descending);
        break;
      case 'selection':
        result = selectionSortBy(lastFeasibilityResults, keyFn, tieBreaker, descending);
        break;
      case 'insertion':
        result = insertionSortBy(lastFeasibilityResults, keyFn, tieBreaker, descending);
        break;
      case 'merge':
      default:
        result = mergeSortBy(lastFeasibilityResults, keyFn, tieBreaker, descending);
        break;
    }

    return {
      sortedFeasibilityResults: result.sorted,
      sortMetrics: {
        comparisons: result.comparisons,
        timeMs: Number(result.timeMs.toFixed(2)),
        algoName: result.algorithmName,
      },
    };
  }, [lastFeasibilityResults, sortField, resultSortAlgo]);

  // Active candidate selected for transfer confirmation
  const activeCandidate = useMemo(() => {
    if (sortedFeasibilityResults.length === 0) return null;
    return (
      sortedFeasibilityResults.find((r) => r.unitId === selectedCandidateUnitId) ||
      sortedFeasibilityResults.find((r) => r.feasible) ||
      sortedFeasibilityResults[0] ||
      null
    );
  }, [sortedFeasibilityResults, selectedCandidateUnitId]);

  const activeCandidateUnit = useMemo(() => {
    if (!activeCandidate) return null;
    return inventory.find((u) => u.id === activeCandidate.unitId) || null;
  }, [inventory, activeCandidate]);

  // Comprehensive candidate validation logic
  const candidateValidation = useMemo(() => {
    if (!activeCandidate) {
      return {
        isValid: false,
        reason: 'No transfer candidate selected. Please run feasibility analysis and select an eligible stock candidate.',
      };
    }

    if (!activeCandidate.feasible) {
      return {
        isValid: false,
        reason: activeCandidate.reasons[0] || 'Selected candidate does not satisfy feasibility constraints.',
      };
    }

    if (activeCandidate.usableTimeAfterTransfer <= 0) {
      return {
        isValid: false,
        reason: `Remaining shelf life after transit & processing is ${activeCandidate.usableTimeAfterTransfer}m. Unit would expire in flight or buffer.`,
      };
    }

    const unit = inventory.find((u) => u.id === activeCandidate.unitId);
    if (!unit || unit.status !== 'available') {
      return {
        isValid: false,
        reason: `Inventory unit ${activeCandidate.unitId} is not available (current status: ${unit?.status || 'missing'}).`,
      };
    }

    const sBankId = unit.bloodBankId || sourceBankId;
    const dBankId = activeCandidate.destinationBankId || destBankId;
    if (!sBankId || !dBankId || sBankId === dBankId) {
      return {
        isValid: false,
        reason: 'Source and destination blood banks must be distinct valid participating facilities.',
      };
    }

    if (activeCandidate.transportDuration <= 0) {
      return {
        isValid: false,
        reason: 'Calculated transport duration must be greater than zero.',
      };
    }

    if (requestId) {
      const req = requests.find((r) => r.id === requestId);
      if (!req) {
        return { isValid: false, reason: `Linked request ${requestId} was not found.` };
      }
      if (req.status === 'fulfilled' || req.status === 'cancelled') {
        return { isValid: false, reason: `Linked request ${requestId} is already ${req.status}.` };
      }
    }

    return { isValid: true, reason: null };
  }, [activeCandidate, inventory, sourceBankId, destBankId, requestId, requests]);

  // ─── Requirement 1 & 2: Real Operation for "Confirm & Create Transfer" ──────
  const handleConfirmAndCreateTransfer = (candidateToConfirm?: FeasibilityResult) => {
    const candidate = candidateToConfirm || activeCandidate;
    if (!candidate) {
      setValidationError('No candidate selected for transfer.');
      return;
    }

    if (isSubmitting) return;

    // Strict validation check
    if (!candidate.feasible || candidate.usableTimeAfterTransfer <= 0) {
      setValidationError(
        candidate.reasons[0] ||
          `Transfer infeasible: Usable time after transfer is ${candidate.usableTimeAfterTransfer}m (must be > 0).`
      );
      return;
    }

    const unit = inventory.find((u) => u.id === candidate.unitId);
    if (!unit || unit.status !== 'available') {
      setValidationError(`Unit ${candidate.unitId} is no longer available in inventory.`);
      return;
    }

    const sBankId = unit.bloodBankId || sourceBankId;
    const dBankId = candidate.destinationBankId || destBankId;
    if (!sBankId || !dBankId || sBankId === dBankId) {
      setValidationError('Source and destination blood banks must be distinct valid facilities.');
      return;
    }

    // Prevent duplicate transfers
    const existingActive = transfers.find(
      (t) =>
        t.sourceUnitIds.includes(candidate.unitId) &&
        ['proposed', 'approved', 'in_transit'].includes(t.status)
    );
    if (existingActive) {
      setValidationError(
        `An active transfer (${existingActive.id}) already exists for unit ${candidate.unitId}. Duplicate submissions are prevented.`
      );
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      // 1. Create transfer record with exact unique ID
      const transferId = createTransfer({
        sourceUnitIds: [candidate.unitId],
        sourceBankId: sBankId,
        destinationBankId: dBankId,
        requestId: requestId || null,
        status: 'proposed',
        transportDuration: candidate.transportDuration,
        receivingProcessingDuration: candidate.receivingProcessingDuration,
        safetyMargin: candidate.safetyMargin,
        estimatedArrival: candidate.estimatedArrival,
        estimatedReadiness: candidate.estimatedReadiness,
        usableTimeAfterTransfer: candidate.usableTimeAfterTransfer,
        quantity: unit.quantity,
        approvedAt: null,
        dispatchedAt: null,
        arrivedAt: null,
        receivedAt: null,
        rejectionReason: null,
        transportMode: transportMode,
      });

      // 2. Authorize transfer (reserves inventory and marks status approved)
      approveTransfer(transferId);

      // 3. Verify persistence in canonical store
      const persisted = useStore.getState().transfers.find((t) => t.id === transferId);
      if (!persisted) {
        throw new Error('Persistence verification failed: transfer record was not found in store.');
      }

      // 4. Concise message & navigate immediately to Transfer Tracking
      setWorkflowNotice(`Transfer ${transferId} created & authorized! Redirecting to Transfer Tracking...`);
      router.push(`/transfers?transferId=${transferId}&created=true`);
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to create and authorize transfer.');
      setIsSubmitting(false);
    }
  };

  const toggleUnit = (id: string) => {
    setSelectedUnits((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
  };

  const requiredTime = transportDuration + processingDuration + safetyMargin;

  // ─── Requirement 2: Exactly 3 Summary Metrics from Real Application Data ───
  const tasksNeedingReviewCount = dequeTasks.length;
  const urgentExpiryRisksCount = useMemo(() => {
    return inventory.filter(
      (u) => u.status === 'available' && new Date(u.expiryTimestamp).getTime() - now < 24 * 3600000
    ).length;
  }, [inventory, now]);
  
  const feasibleTransferCandidatesCount = useMemo(() => {
    if (lastFeasibilityResults.length > 0) {
      return lastFeasibilityResults.filter((r) => r.feasible).length;
    }
    // Prior to running ad-hoc analysis, count transfer-eligible units with positive remaining margin
    return inventory.filter(
      (u) => u.status === 'available' && u.transportEligible && new Date(u.expiryTimestamp).getTime() - now > 4 * 3600000
    ).length;
  }, [lastFeasibilityResults, inventory, now]);

  return (
    <>
      {/* ─── 1. Simplified Page Header ───────────────────────────────────────── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Redistribution Planner</h1>
          <p>Review expiring stock and plan feasible transfers.</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (dequeTasks.length > 0) {
                handleSelectTaskForReview(dequeTasks[0]);
              }
            }}
            disabled={dequeTasks.length === 0}
          >
            <Clock size={14} /> Review Top Urgent Task
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* ─── 2. Compact Summary (At most 3 small metrics) ──────────────────── */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-label">Tasks Needing Review</div>
            <div className="stat-value" style={{ color: tasksNeedingReviewCount > 0 ? 'var(--color-primary)' : 'var(--text-muted)' }}>
              {tasksNeedingReviewCount}
            </div>
            <div className="stat-desc">
              {dequeTasks.filter((t) => t.priority === 'emergency').length} emergency,{' '}
              {dequeTasks.filter((t) => t.priority === 'routine').length} routine in worklist
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Feasible Transfer Candidates</div>
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>
              {feasibleTransferCandidatesCount}
            </div>
            <div className="stat-desc">
              {lastFeasibilityResults.length > 0 ? 'Evaluated options with positive shelf life' : 'Transfer-eligible network units'}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Urgent Expiry Risks</div>
            <div className="stat-value" style={{ color: urgentExpiryRisksCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
              {urgentExpiryRisksCount}
            </div>
            <div className="stat-desc">Available units expiring within 24 hours</div>
          </div>
        </div>

        {/* Workflow Confirmation or Guidance Notice */}
        {workflowNotice && (
          <div
            className="card"
            style={{
              marginBottom: 16,
              padding: '10px 16px',
              borderLeft: '4px solid var(--color-primary)',
              background: 'rgba(56, 189, 248, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info size={16} color="var(--color-primary)" />
              <span>{workflowNotice}</span>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setWorkflowNotice(null)}
              style={{ padding: '2px 8px', fontSize: 11 }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ─── 3. Main Focus: Priority Review Queue ─────────────────────────── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={18} color="var(--color-primary)" />
              <div>
                <h2 style={{ fontSize: 15, margin: 0 }}>Priority Review Queue</h2>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Worklist ordered by urgency using double-ended queue policy
                </span>
              </div>
            </div>
            <span className="badge badge-normal" style={{ fontSize: 11 }}>
              {dequeTasks.length} {dequeTasks.length === 1 ? 'task' : 'tasks'} pending
            </span>
          </div>

          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dequeTasks.map((t, index) => {
                const isFront = index === 0;
                const isEmergency = t.priority === 'emergency';

                return (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 8,
                      background: isEmergency ? 'rgba(220, 38, 38, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      border: isEmergency ? '1px solid rgba(220, 38, 38, 0.25)' : '1px solid var(--border-color)',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    {/* Left: Indicator, Title & Routing info */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 280 }}>
                      <span
                        className={`badge ${isEmergency ? 'badge-critical' : 'badge-info'}`}
                        style={{ marginTop: 2, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.04em' }}
                      >
                        {isEmergency ? 'Emergency' : 'Routine'}
                      </span>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                            {t.title}
                          </span>
                          {t.expiryHoursRemaining !== undefined && (
                            <span
                              className={`badge ${t.expiryHoursRemaining <= 24 ? 'badge-critical' : 'badge-warning'}`}
                              style={{ fontSize: 10 }}
                            >
                              <Clock size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                              {t.expiryHoursRemaining}h remaining
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            [{isFront ? 'Front: Immediate' : index === dequeTasks.length - 1 ? 'Rear: Scheduled' : `#${index + 1}`}]
                          </span>
                        </div>

                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span>{t.description}</span>
                          {(t.sourceBankName || t.destBankName) && (
                            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                              • {t.sourceBankName || 'Network'} {t.destBankName ? `→ ${t.destBankName}` : ''}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                          <strong>Reason:</strong> {t.reason}
                        </div>
                      </div>
                    </div>

                    {/* Right: Contextual Action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSelectTaskForReview(t)}
                        title="Load task parameters into planner workspace"
                      >
                        {t.actionLabel || 'Review Stock'} <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {dequeTasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
                  All review tasks resolved. Worklist is empty.
                </div>
              )}
            </div>

            {/* ─── 5. Expandable Queue Controls / DSA Details ────────────────── */}
            <details style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
              <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', userSelect: 'none' }}>
                Queue Controls &amp; DSA Details (Double-Ended Queue)
              </summary>
              <div style={{ marginTop: 12, padding: '12px', background: 'rgba(255, 255, 255, 0.01)', borderRadius: 6, fontSize: 12 }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: 10 }}>
                  <strong>Deque Invariant:</strong> High-urgency shelf-life crises and trauma requests are inserted at the <strong>FRONT</strong> for O(1) precedence. Routine rebalances and scheduled inspections are appended to the <strong>REAR</strong>.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleInsertTask('emergency')}>
                    + Insert Emergency at Front
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleInsertTask('routine')}>
                    + Insert Routine at Rear
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handlePopFrontTask} disabled={dequeTasks.length === 0}>
                    Pop Front (High Priority)
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handlePopRearTask} disabled={dequeTasks.length === 0}>
                    Pop Rear (Routine)
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* ─── 4. Simplified Circular Linked List Panel ─────────────────────── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RotateCw size={17} color="var(--color-primary)" />
              <h2 style={{ fontSize: 14, margin: 0 }}>Bank Rotation (Circular Linked List)</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!reviewCycleActive ? (
                <button className="btn btn-primary btn-sm" onClick={handleStartReviewCycle}>
                  <Play size={12} /> Start Cyclic Review
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={handleNextInCycle}>
                  <ChevronRight size={12} /> Next Bank in Cycle ({reviewVisitedCount}/{cycleBankList.length})
                </button>
              )}
            </div>
          </div>
          <div className="card-body" style={{ padding: '12px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT REVIEW BANK</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
                    {currentReviewedBank ? currentReviewedBank.name : '—'}
                  </div>
                </div>

                <div style={{ fontSize: 16, color: 'var(--text-muted)' }}>→</div>

                <div>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>NEXT IN ROTATION</span>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {nextBankInCycle ? nextBankInCycle.name : '—'}
                  </div>
                </div>
              </div>

              <div>
                {reviewCycleActive ? (
                  <span className="badge badge-warning" style={{ fontSize: 11 }}>
                    Reviewing {reviewVisitedCount} of {cycleBankList.length} banks
                  </span>
                ) : cycleCompleted ? (
                  <span className="badge badge-normal" style={{ fontSize: 11 }}>
                    ✓ 1 Complete Cycle Traversed
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Closed-loop rotation (A → B → C → A)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── 6. Planning Workspace & Feasibility Engine ────────────────────── */}
        <div id="planning-workspace" className="card" style={{ marginBottom: 20 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 15, margin: 0 }}>Transfer Feasibility Workspace</h2>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Calculate exact transit, processing and safety margins for expiring inventory
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className={`btn btn-sm ${transportMode === 'drone' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTransportMode('drone')}
              >
                <Plane size={13} /> Drone Graph (Dijkstra)
              </button>
              <button
                className={`btn btn-sm ${transportMode === 'ground' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTransportMode('ground')}
              >
                Ground Transport
              </button>
            </div>
          </div>

          <div className="card-body">
            <div className="grid-3" style={{ marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">Linked Hospital Request</label>
                <select
                  className="form-select"
                  value={requestId}
                  onChange={(e) => handleSelectRequest(e.target.value)}
                >
                  <option value="">No linked request (Direct stock rebalance)</option>
                  {pendingRequests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id} — {r.bloodType} {r.componentType} ×{r.quantity} ({r.priority.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Source Blood Bank (Stock Origin)</label>
                <select
                  className="form-select"
                  value={sourceBankId}
                  onChange={(e) => {
                    setSourceBankId(e.target.value);
                    setSelectedUnits([]);
                    setValidationError(null);
                  }}
                >
                  <option value="">Select source...</option>
                  {bloodBanks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Destination Blood Bank / Hospital</label>
                <select
                  className="form-select"
                  value={destBankId}
                  onChange={(e) => {
                    setDestBankId(e.target.value);
                    setValidationError(null);
                  }}
                >
                  <option value="">Select destination...</option>
                  {bloodBanks
                    .filter((b) => b.id !== sourceBankId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Transport Duration {transportMode === 'drone' ? '(Dijkstra Optimal Flight)' : '(min)'}
                </label>
                <input
                  className="form-input"
                  type="number"
                  value={transportDuration}
                  onChange={(e) => setTransportDuration(parseInt(e.target.value) || 0)}
                  disabled={transportMode === 'drone'}
                />
                {transportMode === 'drone' && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Shortest weighted path on operating graph
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Receiving / Processing (min)</label>
                <input
                  className="form-input"
                  type="number"
                  value={processingDuration}
                  onChange={(e) => setProcessingDuration(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Safety Margin Buffer (min)</label>
                <input
                  className="form-input"
                  type="number"
                  value={safetyMargin}
                  onChange={(e) => setSafetyMargin(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Delay Simulation Control */}
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <ShieldAlert size={16} color="var(--color-warning)" />
                <span>
                  Simulated Route Delay: <strong>+{simulatedDelay} min</strong>
                  {simulatedDelay > 0 && (
                    <span style={{ color: 'var(--color-warning)', marginLeft: 6 }}>
                      (Recalculating corridor feasibility...)
                    </span>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setSimulatedDelay((d) => d + 15)}>
                  +15m Weather Delay
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setSimulatedDelay((d) => d + 30)}>
                  +30m Air Corridor Delay
                </button>
                {simulatedDelay > 0 && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setSimulatedDelay(0)}>
                    Reset Delay
                  </button>
                )}
              </div>
            </div>

            {/* Formula Banner */}
            <div
              style={{
                fontSize: 12,
                padding: '10px 14px',
                background: 'var(--bg-tertiary)',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                lineHeight: 1.5,
              }}
            >
              <strong>Feasibility Formula:</strong> requiredTime = transit ({transportDuration}m) + processing ({processingDuration}m) + safety margin ({safetyMargin}m) = <strong>{requiredTime}m</strong>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                <code>usableTimeAfterTransfer = remainingTime − requiredTime</code> (Feasible only if usable time &gt; 0)
              </div>
            </div>
          </div>
        </div>

        {/* ─── Source Inventory Selection ───────────────────────────────────── */}
        {sourceBankId && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 14, margin: 0 }}>
                  Select Source Inventory Units ({selectedUnits.length} selected of {sourceUnits.length})
                </h2>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Units available at {sourceBank?.name} with transport eligibility
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUnits(sourceUnits.map((u) => u.id))}>
                  Select All
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUnits([])}>
                  Clear
                </button>
              </div>
            </div>

            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th>Unit ID</th>
                    <th>Blood Group</th>
                    <th>Component</th>
                    <th>Quantity</th>
                    <th>Remaining Shelf Life</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceUnits.map((u) => {
                    const remaining = new Date(u.expiryTimestamp).getTime() - now;
                    const isSelected = selectedUnits.includes(u.id);

                    return (
                      <tr
                        key={u.id}
                        onClick={() => toggleUnit(u.id)}
                        style={{ cursor: 'pointer', background: isSelected ? 'rgba(56, 189, 248, 0.05)' : undefined }}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleUnit(u.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>{u.id}</td>
                        <td>
                          <span className="badge badge-info">{u.bloodType}</span>
                        </td>
                        <td style={{ fontSize: 12 }}>{u.componentType}</td>
                        <td style={{ fontWeight: 600 }}>{u.quantity}</td>
                        <td>
                          <span className={`badge ${remaining < 24 * 3600000 ? 'badge-critical' : 'badge-normal'}`}>
                            {formatMin(remaining / 60000)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${u.status}`}>{u.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {sourceUnits.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state" style={{ padding: '24px 16px', textAlign: 'center' }}>
                          <p>No eligible available units at this source bank.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Execution Buttons ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleRunAnalysis}
            disabled={!destBankId || selectedUnits.length === 0}
          >
            <Play size={15} /> Run Feasibility Analysis
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleCompareDestinations}
            disabled={selectedUnits.length === 0}
          >
            <ArrowRight size={15} /> Compare All Destinations
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setFeasibilityResults([]);
              setCompareMode(false);
              setSelectedCandidateUnitId(null);
            }}
          >
            <RefreshCw size={15} /> Reset Results
          </button>
        </div>

        {/* ─── Requirement 1: Prominent "Confirm & Create Transfer" Action Panel ─── */}
        {sortedFeasibilityResults.length > 0 && (
          <div
            className="card"
            style={{
              marginBottom: 20,
              border: candidateValidation.isValid ? '2px solid rgba(16, 185, 129, 0.5)' : '2px solid rgba(239, 68, 68, 0.4)',
              background: candidateValidation.isValid
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0.95))'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(15, 23, 42, 0.95))',
              padding: '18px 22px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={20} color={candidateValidation.isValid ? 'var(--color-success)' : 'var(--color-danger)'} />
                  <h2 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>
                    Transfer Authorization
                  </h2>
                  {candidateValidation.isValid ? (
                    <span className="badge badge-normal" style={{ fontSize: 11 }}>Ready to Authorize</span>
                  ) : (
                    <span className="badge badge-critical" style={{ fontSize: 11 }}>Validation Incomplete</span>
                  )}
                </div>

                {activeCandidate ? (
                  <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    Candidate Unit: <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{activeCandidate.unitId}</strong>
                    {activeCandidateUnit && (
                      <span> ({activeCandidateUnit.bloodType} {activeCandidateUnit.componentType})</span>
                    )} | Origin:{' '}
                    <strong>{bloodBanks.find((b) => b.id === (activeCandidateUnit?.bloodBankId || sourceBankId))?.name || sourceBankId}</strong>
                    {' → '}Destination:{' '}
                    <strong>{bloodBanks.find((b) => b.id === (activeCandidate.destinationBankId || destBankId))?.name || destBankId}</strong>
                    {requestId && (
                      <span style={{ color: '#60a5fa', marginLeft: 8 }}>
                        (Linked Request: {requestId})
                      </span>
                    )}
                    <div style={{ fontSize: 12, marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>Required Transit &amp; Buffer: <strong>{formatMin(activeCandidate.requiredTime)}</strong></span>
                      <span>
                        Usable Shelf Life After Transfer:{' '}
                        <strong style={{ color: activeCandidate.usableTimeAfterTransfer > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {activeCandidate.usableTimeAfterTransfer > 0 ? `+${formatMin(activeCandidate.usableTimeAfterTransfer)}` : `-${formatMin(Math.abs(activeCandidate.usableTimeAfterTransfer))}`}
                        </strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                    No candidate selected from feasibility results.
                  </div>
                )}

                {!candidateValidation.isValid && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} />
                    <span>Cannot confirm transfer: {candidateValidation.reason}</span>
                  </div>
                )}

                {validationError && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-danger)' }}>
                    {validationError}
                  </div>
                )}
              </div>

              <div>
                <button
                  className="btn btn-primary"
                  style={{
                    padding: '12px 24px',
                    fontSize: 14,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: candidateValidation.isValid ? '0 4px 14px rgba(220, 38, 38, 0.4)' : undefined,
                    cursor: candidateValidation.isValid && !isSubmitting ? 'pointer' : 'not-allowed',
                    opacity: candidateValidation.isValid && !isSubmitting ? 1 : 0.6,
                  }}
                  onClick={() => handleConfirmAndCreateTransfer()}
                  disabled={!candidateValidation.isValid || isSubmitting}
                  title={candidateValidation.isValid ? 'Authorize transfer and create custody record in Transfer Tracking' : (candidateValidation.reason || undefined)}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Authorizing Transfer...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Confirm &amp; Create Transfer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Feasibility Results Table with Integrated Sorting ────────────── */}
        {sortedFeasibilityResults.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div
              className="card-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 15, margin: 0 }}>
                  Feasibility Results ({sortedFeasibilityResults.length})
                </h2>
                <span
                  className={`badge ${
                    sortedFeasibilityResults.some((r) => r.feasible) ? 'badge-normal' : 'badge-critical'
                  }`}
                >
                  {sortedFeasibilityResults.filter((r) => r.feasible).length} feasible
                </span>
              </div>

              {/* Sorting Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <select
                  className="form-select"
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  style={{ width: 180, fontSize: 12 }}
                >
                  <option value="usableTime">Sort: Usable Time Remaining</option>
                  <option value="score">Sort: Feasibility Score</option>
                  <option value="remaining">Sort: Expiry Time</option>
                </select>

                <select
                  className="form-select"
                  value={resultSortAlgo}
                  onChange={(e) => setResultSortAlgo(e.target.value as SortAlgo)}
                  style={{ width: 170, fontSize: 12 }}
                >
                  <option value="merge">Merge Sort (O(n log n))</option>
                  <option value="insertion">Insertion Sort (O(n²))</option>
                  <option value="selection">Selection Sort (O(n²))</option>
                  <option value="bubble">Bubble Sort (O(n²))</option>
                </select>
              </div>
            </div>

            {sortMetrics && (
              <div
                style={{
                  padding: '6px 16px',
                  background: 'rgba(255, 255, 255, 0.01)',
                  borderBottom: '1px solid var(--border-color)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                }}
              >
                Ranked with <strong>{sortMetrics.algoName}</strong>: {sortMetrics.comparisons} comparisons in {sortMetrics.timeMs}ms (Deterministic tie-breaking). Click any candidate row to select for authorization.
              </div>
            )}

            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>Select</th>
                    {compareMode && <th>Destination</th>}
                    <th>Unit ID</th>
                    <th>Remaining Shelf Life</th>
                    <th>Required Transit &amp; Buffer</th>
                    <th>Usable Time After Transfer</th>
                    <th>Readiness Est.</th>
                    <th>Feasibility Status</th>
                    <th>Rejection / Approval Reason</th>
                    <th style={{ textAlign: 'right' }}>Authorization Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFeasibilityResults.map((r, i) => {
                    const destName = bloodBanks.find((b) => b.id === r.destinationBankId)?.name || r.destinationBankId;
                    const isSelected = activeCandidate?.unitId === r.unitId;

                    return (
                      <tr
                        key={i}
                        onClick={() => setSelectedCandidateUnitId(r.unitId)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected
                            ? 'rgba(56, 189, 248, 0.08)'
                            : r.feasible
                            ? 'rgba(16, 185, 129, 0.03)'
                            : undefined,
                          borderLeft: isSelected ? '3px solid var(--color-primary)' : undefined,
                        }}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="radio"
                            name="candidate-select"
                            checked={isSelected}
                            onChange={() => setSelectedCandidateUnitId(r.unitId)}
                          />
                        </td>
                        {compareMode && (
                          <td style={{ fontSize: 12, fontWeight: 500 }}>{destName}</td>
                        )}
                        <td style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>{r.unitId}</td>
                        <td style={{ fontWeight: 600 }}>{formatMin(r.remainingTime)}</td>
                        <td>
                          {formatMin(r.requiredTime)}{' '}
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            ({r.transportDuration}m + {r.receivingProcessingDuration}m + {r.safetyMargin}m)
                          </span>
                        </td>
                        <td
                          style={{
                            fontWeight: 700,
                            color: r.usableTimeAfterTransfer > 0 ? 'var(--color-success)' : 'var(--color-danger)',
                          }}
                        >
                          {r.usableTimeAfterTransfer > 0 ? `+${formatMin(r.usableTimeAfterTransfer)}` : `-${formatMin(Math.abs(r.usableTimeAfterTransfer))}`}
                        </td>
                        <td style={{ fontSize: 11 }}>
                          {new Date(r.estimatedReadiness).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <span className={`badge ${r.feasible ? 'badge-normal' : 'badge-critical'}`}>
                            {r.feasible ? '✓ Feasible' : '✗ Not Feasible'}
                          </span>
                        </td>
                        <td style={{ fontSize: 11, maxWidth: 260 }}>
                          {r.reasons.map((reason, j) => (
                            <div key={j} style={{ color: !r.feasible ? 'var(--color-danger)' : undefined }}>
                              {reason}
                            </div>
                          ))}
                        </td>
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          {r.feasible ? (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleConfirmAndCreateTransfer(r)}
                              disabled={isSubmitting}
                              title="Confirm this transfer candidate and navigate to Transfer Tracking"
                            >
                              <Check size={13} /> Confirm &amp; Create Transfer
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--color-danger)' }}>Infeasible</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DsaUsedSection
          pageContext="Double-ended task review, circular bank rotation, Dijkstra air-corridor routing, and candidate sorting"
          items={[
            {
              name: 'Deque',
              purpose: 'Bi-directional review task scheduling based on clinical urgency.',
              application: 'Supports inserting/popping tasks at either end. Critical shelf-life emergencies (<24h) and trauma deficits are pushed to the FRONT for immediate evaluation; routine stock rebalancing tasks are appended to the REAR.',
              timeComplexity: 'O(1) insertFront, insertRear, deleteFront, and deleteRear; Space: O(k) for k active review tasks.',
            },
            {
              name: 'Circular Linked List',
              purpose: 'Fair, round-robin cyclic review across regional blood bank facilities.',
              application: 'Links participating blood bank records in a closed cycle where the last node points back to the head. Advances from one bank to the next (A → B → C → A) to ensure systematic facility audits without starving remote taluk centers.',
              timeComplexity: 'O(1) step to next node; O(n) to traverse one complete cycle of n blood banks.',
            },
            {
              name: 'Dijkstra\'s Algorithm',
              purpose: 'Calculates the lowest-cost drone transit route between facilities.',
              application: 'Traverses the weighted waypoint graph between source and destination blood banks, computing optimal flight duration (at 60 km/h) avoiding designated no-fly obstacles.',
              timeComplexity: 'O(V²) with priority array, or O((V + E) log V) with min-heap; non-negative edge weights.',
            },
            {
              name: 'Bubble Sort',
              purpose: 'Comparison-based ordering of candidate redistribution units by clinical viability.',
              application: 'Sorts candidate units by usable remaining shelf-life via adjacent pairwise comparisons and swaps with deterministic tie-breaking.',
              timeComplexity: 'O(n²) worst/average; O(n) best case on nearly sorted candidates.',
            },
            {
              name: 'Insertion Sort',
              purpose: 'Incremental ordering of redistribution candidates by feasibility score.',
              application: 'Builds a sorted sequence by shifting larger elements to insert each candidate unit into its exact ranked position for transfer prioritization.',
              timeComplexity: 'O(n²) worst/average; O(n) best case on partially sorted records.',
            },
          ]}
        />
      </div>
    </>
  );
}

export default function RedistributionPage() {
  return (
    <Suspense fallback={<div className="page-content" style={{ color: '#94a3b8' }}>Loading Redistribution Planner...</div>}>
      <RedistributionContent />
    </Suspense>
  );
}

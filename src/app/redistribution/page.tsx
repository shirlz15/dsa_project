'use client';

import { useStore } from '@/lib/store';
import {
  Route, Play, Check, X, RefreshCw, ArrowRight, Clock, AlertTriangle,
  RotateCw, Layers, Sparkles, Plane, ShieldAlert, CheckCircle, Info, ChevronRight
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { calculateFeasibility, rankResults } from '@/lib/feasibility-engine';
import { CircularLinkedList, Deque, dijkstra, bubbleSortBy, selectionSortBy, insertionSortBy, mergeSortBy, GenericSortResult } from '@/lib/dsa-engine';
import { BloodBank, ReviewTask, FeasibilityResult } from '@/lib/types';

function formatMin(m: number): string {
  if (m <= 0) return '0m';
  const h = Math.floor(m / 60);
  const mins = Math.round(m % 60);
  return h > 0 ? `${h}h ${mins}m` : `${mins}m`;
}

type SortAlgo = 'merge' | 'insertion' | 'selection' | 'bubble';

export default function RedistributionPage() {
  const bloodBanks = useStore((s) => s.bloodBanks);
  const inventory = useStore((s) => s.inventory);
  const requests = useStore((s) => s.requests);
  const getNow = useStore((s) => s.getNow);
  const createTransfer = useStore((s) => s.createTransfer);
  const approveTransfer = useStore((s) => s.approveTransfer);
  const rejectTransfer = useStore((s) => s.rejectTransfer);
  const transfers = useStore((s) => s.transfers);
  const graphState = useStore((s) => s.graphState);
  const setFeasibilityResults = useStore((s) => s.setFeasibilityResults);
  const lastFeasibilityResults = useStore((s) => s.lastFeasibilityResults);

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

  const cycleBankList = useMemo(() => {
    return bankCircularList.traverseOneCycle();
  }, [bankCircularList]);

  const currentReviewedBank = cycleBankList[currentReviewIndex % (cycleBankList.length || 1)] || bloodBanks[0] || null;
  const nextBankInCycle = cycleBankList[(currentReviewIndex + 1) % (cycleBankList.length || 1)] || null;

  const handleStartReviewCycle = () => {
    setCurrentReviewIndex(0);
    setReviewVisitedCount(1);
    setReviewCycleActive(true);
    if (cycleBankList[0]) {
      setSourceBankId(cycleBankList[0].id);
    }
  };

  const handleNextInCycle = () => {
    if (reviewVisitedCount >= cycleBankList.length) {
      // Completed one full round
      setReviewCycleActive(false);
      return;
    }
    const nextIdx = (currentReviewIndex + 1) % cycleBankList.length;
    setCurrentReviewIndex(nextIdx);
    setReviewVisitedCount((prev) => prev + 1);
    if (cycleBankList[nextIdx]) {
      setSourceBankId(cycleBankList[nextIdx].id);
      setSelectedUnits([]);
    }
  };

  // ─── DSA 2: Deque for Redistribution Review Tasks ──────────────────────────
  const [dequeTasks, setDequeTasks] = useState<ReviewTask[]>(() => [
    {
      id: 'task-1',
      title: 'Emergency Expiry Risk (<24h)',
      description: 'Check Ramanathapuram GH unit INV-bb1-01 approaching expiry within 18h',
      priority: 'emergency',
      queueEnd: 'front',
      reason: 'Urgent expiry threat: Application policy mandates review at FRONT of worklist',
      timestamp: '2025-01-15T08:00:00.000Z',
      associatedBankId: 'bb-1',
    },
    {
      id: 'task-2',
      title: 'Emergency O- Request Pending',
      description: 'GRH Madurai requested 2 units O- Packed RBC for trauma patient',
      priority: 'emergency',
      queueEnd: 'front',
      reason: 'Trauma priority request: Positioned at FRONT for immediate redistribution match',
      timestamp: '2025-01-15T08:05:00.000Z',
      associatedBankId: 'bb-5',
    },
    {
      id: 'task-3',
      title: 'Routine Platelet Redistribution',
      description: 'Paramakudi has surplus platelets; check Rameswaram Centre capacity',
      priority: 'routine',
      queueEnd: 'rear',
      reason: 'Routine rebalancing: Policy routes non-critical inventory checks to REAR',
      timestamp: '2025-01-15T07:30:00.000Z',
      associatedBankId: 'bb-2',
    },
    {
      id: 'task-4',
      title: 'Routine Stock Rebalance',
      description: 'Kamuthi Hospital weekly inventory review',
      priority: 'routine',
      queueEnd: 'rear',
      reason: 'Scheduled weekly check: Placed at REAR of deque',
      timestamp: '2025-01-15T07:00:00.000Z',
      associatedBankId: 'bb-4',
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
    const newTask: ReviewTask = {
      id: `task-${Date.now()}`,
      title: isFront ? 'Emergency Redistribution Alert' : 'Routine Surplus Review',
      description: isFront ? 'Critical inventory approaching expiry threshold' : 'Standard rebalancing review task',
      priority,
      queueEnd: isFront ? 'front' : 'rear',
      reason: isFront
        ? 'High urgency: Application policy requires insertion at FRONT of review worklist'
        : 'Routine task: Application policy appends to REAR of review worklist',
      timestamp: new Date().toISOString(),
    };

    setDequeTasks((prev) => isFront ? [newTask, ...prev] : [...prev, newTask]);
  };

  // ─── DSA 3: Graph / Dijkstra Route Connection for Drone Transport ───────────
  useEffect(() => {
    if (transportMode === 'drone' && sourceBankId && destBankId) {
      // Map bank IDs to graph node IDs (e.g. bb-1 -> n-bb1, etc.)
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
    // Descending for usableTime and score (highest first)
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

  const handleApprove = (result: FeasibilityResult) => {
    const unit = inventory.find((u) => u.id === result.unitId);
    if (!unit) return;
    const dest = bloodBanks.find((b) => b.id === result.destinationBankId);
    if (!dest) return;

    const transferId = createTransfer({
      sourceUnitIds: [result.unitId],
      sourceBankId: unit.bloodBankId,
      destinationBankId: result.destinationBankId,
      requestId: requestId || null,
      status: 'proposed',
      transportDuration: result.transportDuration,
      receivingProcessingDuration: result.receivingProcessingDuration,
      safetyMargin: result.safetyMargin,
      estimatedArrival: result.estimatedArrival,
      estimatedReadiness: result.estimatedReadiness,
      usableTimeAfterTransfer: result.usableTimeAfterTransfer,
      quantity: unit.quantity,
      approvedAt: null,
      dispatchedAt: null,
      arrivedAt: null,
      receivedAt: null,
      rejectionReason: null,
    });
    approveTransfer(transferId);
  };

  const toggleUnit = (id: string) => {
    setSelectedUnits((prev) => prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]);
  };

  const requiredTime = transportDuration + processingDuration + safetyMargin;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Time-Aware Redistribution Planner</h1>
          <p>Evaluate feasibility of blood redistribution using actual Graph/Dijkstra route duration, Circular Bank Rotation, and Deque worklist</p>
        </div>
      </div>

      <div className="page-content">
        {/* ─── DSA Panel 1: Circular Linked List Blood Bank Review Cycle ─────── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RotateCw size={18} color="var(--color-primary)" />
              <h2 style={{ fontSize: 15 }}>Periodic Bank Review Cycle (Circular Linked List)</h2>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!reviewCycleActive ? (
                <button className="btn btn-primary btn-sm" onClick={handleStartReviewCycle}>
                  <Play size={13} /> Start Cyclic Review (A → B → C → A)
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={handleNextInCycle}>
                  <ChevronRight size={13} /> Next Bank in Cycle ({reviewVisitedCount}/{cycleBankList.length})
                </button>
              )}
            </div>
          </div>
          <div className="card-body">
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              <strong>Circular Linked List Architecture:</strong> Participating blood banks form a closed cyclic structure where the last bank’s node pointer references the head. Each cycle inspects stock, approaching-expiry inventory, and outstanding demands, terminating automatically after exactly 1 complete round.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>CURRENT REVIEW NODE:</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
                  {currentReviewedBank ? currentReviewedBank.name : '—'} ({currentReviewedBank?.city})
                </div>
              </div>
              <div style={{ fontSize: 18, color: 'var(--text-muted)', margin: '0 8px' }}>→</div>
              <div>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>NEXT POINTER (curr.next):</span>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {nextBankInCycle ? nextBankInCycle.name : '—'}
                </div>
              </div>
              {reviewCycleActive && (
                <div style={{ marginLeft: 'auto' }}>
                  <span className="badge badge-warning">
                    Cycle in progress: {reviewVisitedCount} of {cycleBankList.length} banks inspected
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── DSA Panel 2: Deque Worklist for Redistribution Tasks ─────────── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={18} color="var(--color-primary)" />
              <h2 style={{ fontSize: 15 }}>Planner Review Worklist (Double-Ended Queue — Deque)</h2>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleInsertTask('emergency')}>
                + Insert Emergency at Front
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleInsertTask('routine')}>
                + Insert Routine at Rear
              </button>
              <button className="btn btn-primary btn-sm" onClick={handlePopFrontTask} disabled={dequeTasks.length === 0}>
                Pop Front (High Priority)
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handlePopRearTask} disabled={dequeTasks.length === 0}>
                Pop Rear (Routine)
              </button>
            </div>
          </div>
          <div className="card-body">
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              <strong>Deque Policy:</strong> Emergency review tasks (critical expiry & trauma requests) are pushed to the <strong>FRONT</strong> for immediate evaluation. Routine rebalancing tasks are pushed to the <strong>REAR</strong>. Supports O(1) insertion/removal at both ends.
              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                * Note: Ordering represents simulated administrative policy, not clinical triage.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dequeTasks.map((t, i) => (
                <div
                  key={t.id}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: i === 0 ? 'rgba(220, 38, 38, 0.08)' : 'rgba(255,255,255,0.02)',
                    borderLeft: t.priority === 'emergency' ? '3px solid var(--color-danger)' : '3px solid var(--color-info)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, marginRight: 8 }}>
                      {i === 0 ? 'FRONT [FIRST REVIEW]' : i === dequeTasks.length - 1 ? 'REAR' : `POSITION #${i + 1}`}:
                    </span>
                    <span style={{ fontWeight: 500 }}>{t.title}</span> — <span>{t.description}</span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.reason}</div>
                  </div>
                  <span className={`badge ${t.priority === 'emergency' ? 'badge-critical' : 'badge-info'}`}>
                    {t.priority}
                  </span>
                </div>
              ))}
              {dequeTasks.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>
                  Deque worklist is empty.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Core Feasibility Configuration ───────────────────────────────── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Redistribution Feasibility Engine Configuration</h2>
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
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Source Blood Bank</label>
                <select className="form-select" value={sourceBankId} onChange={(e) => { setSourceBankId(e.target.value); setSelectedUnits([]); }}>
                  <option value="">Select source...</option>
                  {bloodBanks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Destination Blood Bank</label>
                <select className="form-select" value={destBankId} onChange={(e) => setDestBankId(e.target.value)}>
                  <option value="">Select destination...</option>
                  {bloodBanks.filter((b) => b.id !== sourceBankId).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Link to Request (optional)</label>
                <select className="form-select" value={requestId} onChange={(e) => setRequestId(e.target.value)}>
                  <option value="">No linked request</option>
                  {pendingRequests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id} — {r.bloodType} {r.componentType} ×{r.quantity} ({r.priority})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Transport Duration {transportMode === 'drone' ? '(Graph Dijkstra Computed)' : '(min)'}
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
                    Calculated from shortest weighted path on operating graph
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Receiving/Processing (min)</label>
                <input
                  className="form-input"
                  type="number"
                  value={processingDuration}
                  onChange={(e) => setProcessingDuration(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Safety Margin (min)</label>
                <input
                  className="form-input"
                  type="number"
                  value={safetyMargin}
                  onChange={(e) => setSafetyMargin(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Delay Simulation Control */}
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <ShieldAlert size={16} color="var(--color-warning)" />
                <span>
                  Simulated Route Delay: <strong>+{simulatedDelay} min</strong>
                  {simulatedDelay > 0 && <span style={{ color: 'var(--color-warning)', marginLeft: 6 }}>(Recalculating feasibility...)</span>}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSimulatedDelay((d) => d + 15)}
                >
                  +15m Weather/Air Delay
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSimulatedDelay((d) => d + 30)}
                >
                  +30m Extended Delay
                </button>
                {simulatedDelay > 0 && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setSimulatedDelay(0)}>
                    Reset Delay
                  </button>
                )}
              </div>
            </div>

            <div style={{ fontSize: 12, padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 6, marginTop: 12 }}>
              <strong>Feasibility Formula:</strong> requiredTime = transport ({transportDuration}m) + processing ({processingDuration}m) + safety ({safetyMargin}m) = <strong>{requiredTime}m</strong> | usableTimeAfterTransfer = remainingTime − requiredTime (Feasible iff &gt; 0)
            </div>
          </div>
        </div>

        {/* ─── Source Inventory Selection ───────────────────────────────────── */}
        {sourceBankId && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2>Select Source Inventory Units ({selectedUnits.length} selected of {sourceUnits.length})</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUnits(sourceUnits.map((u) => u.id))}>Select All</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUnits([])}>Clear</button>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Component</th>
                    <th>Qty</th>
                    <th>Remaining Shelf Life</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceUnits.map((u) => {
                    const remaining = new Date(u.expiryTimestamp).getTime() - now;
                    return (
                      <tr key={u.id} onClick={() => toggleUnit(u.id)} style={{ cursor: 'pointer' }}>
                        <td><input type="checkbox" checked={selectedUnits.includes(u.id)} onChange={() => toggleUnit(u.id)} /></td>
                        <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{u.id}</td>
                        <td><span className="badge badge-info">{u.bloodType}</span></td>
                        <td style={{ fontSize: 12 }}>{u.componentType}</td>
                        <td style={{ fontWeight: 600 }}>{u.quantity}</td>
                        <td>
                          <span className={`badge ${remaining < 12 * 3600000 ? 'badge-critical' : 'badge-normal'}`}>
                            {formatMin(remaining / 60000)}
                          </span>
                        </td>
                        <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                      </tr>
                    );
                  })}
                  {sourceUnits.length === 0 && <tr><td colSpan={7}><div className="empty-state"><p>No eligible available units at this source</p></div></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Execution Buttons ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={handleRunAnalysis} disabled={!destBankId || selectedUnits.length === 0}>
            <Play size={16} /> Run Feasibility Analysis
          </button>
          <button className="btn btn-secondary" onClick={handleCompareDestinations} disabled={selectedUnits.length === 0}>
            <ArrowRight size={16} /> Compare All Destinations
          </button>
          <button className="btn btn-secondary" onClick={() => { setFeasibilityResults([]); setCompareMode(false); }}>
            <RefreshCw size={16} /> Reset Results
          </button>
        </div>

        {/* ─── Results Table with Integrated Sorting ────────────────────────── */}
        {sortedFeasibilityResults.length > 0 && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2>Feasibility Recommendations ({sortedFeasibilityResults.length})</h2>
                <span className={`badge ${sortedFeasibilityResults.some((r) => r.feasible) ? 'badge-normal' : 'badge-critical'}`}>
                  {sortedFeasibilityResults.filter((r) => r.feasible).length} feasible
                </span>
              </div>

              {/* Sorting Algorithm for Results */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  className="form-select"
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  style={{ width: 180 }}
                >
                  <option value="usableTime">Sort: Usable Time Remaining</option>
                  <option value="score">Sort: Feasibility Score</option>
                  <option value="remaining">Sort: Expiry Time</option>
                </select>
                <select
                  className="form-select"
                  value={resultSortAlgo}
                  onChange={(e) => setResultSortAlgo(e.target.value as SortAlgo)}
                  style={{ width: 170 }}
                >
                  <option value="merge">Merge Sort (O(n log n))</option>
                  <option value="insertion">Insertion Sort (O(n²))</option>
                  <option value="selection">Selection Sort (O(n²))</option>
                  <option value="bubble">Bubble Sort (O(n²))</option>
                </select>
              </div>
            </div>

            {sortMetrics && (
              <div style={{ padding: '6px 16px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-color)', fontSize: 11, color: 'var(--text-muted)' }}>
                Sorted via <strong>{sortMetrics.algoName}</strong>: {sortMetrics.comparisons} comparisons executed in {sortMetrics.timeMs}ms (Deterministic tie-breaking by Unit ID).
              </div>
            )}

            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {compareMode && <th>Destination</th>}
                    <th>Unit</th>
                    <th>Remaining</th>
                    <th>Transport</th>
                    <th>Processing</th>
                    <th>Safety</th>
                    <th>Required</th>
                    <th>Usable After</th>
                    <th>Readiness Est.</th>
                    <th>Qty</th>
                    <th>Eligibility</th>
                    <th>Deadline</th>
                    <th>Feasible</th>
                    <th>Score</th>
                    <th>Reasons</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFeasibilityResults.map((r, i) => {
                    const destName = bloodBanks.find((b) => b.id === r.destinationBankId)?.name || r.destinationBankId;
                    return (
                      <tr key={i} style={{ background: r.feasible ? 'var(--status-normal-bg)' : undefined }}>
                        {compareMode && <td style={{ fontSize: 12, fontWeight: 500 }}>{destName}</td>}
                        <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.unitId}</td>
                        <td style={{ fontWeight: 600 }}>{formatMin(r.remainingTime)}</td>
                        <td>{formatMin(r.transportDuration)}</td>
                        <td>{formatMin(r.receivingProcessingDuration)}</td>
                        <td>{formatMin(r.safetyMargin)}</td>
                        <td style={{ fontWeight: 600 }}>{formatMin(r.requiredTime)}</td>
                        <td style={{ fontWeight: 700, color: r.usableTimeAfterTransfer > 0 ? 'var(--status-normal)' : 'var(--status-critical)' }}>
                          {formatMin(r.usableTimeAfterTransfer)}
                        </td>
                        <td style={{ fontSize: 11 }}>{new Date(r.estimatedReadiness).toLocaleTimeString()}</td>
                        <td>{r.quantityAvailable}/{r.quantityRequested}</td>
                        <td><span className={`badge ${r.eligibilityPassed ? 'badge-normal' : 'badge-critical'}`}>{r.eligibilityPassed ? 'Pass' : 'Fail'}</span></td>
                        <td><span className={`badge ${r.deadlineMet ? 'badge-normal' : 'badge-critical'}`}>{r.deadlineMet ? 'Met' : 'Missed'}</span></td>
                        <td><span className={`badge ${r.feasible ? 'badge-normal' : 'badge-critical'}`}>{r.feasible ? '✓ Feasible' : '✗ Not Feasible'}</span></td>
                        <td style={{ fontWeight: 600 }}>{r.score.toFixed(2)}</td>
                        <td style={{ fontSize: 11, maxWidth: 220 }}>
                          {r.reasons.map((reason, j) => <div key={j} style={{ color: !r.feasible ? 'var(--color-danger)' : undefined }}>{reason}</div>)}
                          {r.scoreFactors.length > 0 && (
                            <details style={{ marginTop: 4 }}>
                              <summary style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>Score factors</summary>
                              {r.scoreFactors.map((f, k) => (
                                <div key={k} style={{ fontSize: 10 }}>{f.factor}: {f.value.toFixed(1)} × {f.weight}%</div>
                              ))}
                            </details>
                          )}
                        </td>
                        <td>
                          {r.feasible && (
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(r)}>
                              <Check size={12} /> Approve
                            </button>
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
      </div>
    </>
  );
}

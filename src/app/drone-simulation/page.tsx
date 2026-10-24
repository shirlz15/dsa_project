'use client';

import { useStore } from '@/lib/store';
import {
  Plane, Play, Pause, Square, RotateCcw, Zap, AlertTriangle,
  RotateCw, Layers, ShieldAlert, CheckCircle, Info, Sparkles, ArrowRight
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { bfs, dfs, dijkstra, GraphAlgorithmResult, CircularQueue } from '@/lib/dsa-engine';
import { GraphNode, GraphEdge, AlgorithmStep, DroneTelemetryEvent } from '@/lib/types';

type AlgoType = 'bfs' | 'dfs' | 'dijkstra';

const RING_CAPACITY = 8;

function DroneSimulationContent() {
  const graphState = useStore((s) => s.graphState);
  const bloodBanks = useStore((s) => s.bloodBanks);
  const addMission = useStore((s) => s.addMission);
  const getNow = useStore((s) => s.getNow);
  const transfers = useStore((s) => s.transfers);
  const dispatchTransfer = useStore((s) => s.dispatchTransfer);
  const delayTransfer = useStore((s) => s.delayTransfer);
  const updateTransfer = useStore((s) => s.updateTransfer);

  const searchParams = useSearchParams();
  const paramTransferId = searchParams.get('transferId');

  // Connected transfer state
  const [activeTransferId, setActiveTransferId] = useState<string>(paramTransferId || '');

  useEffect(() => {
    if (paramTransferId) {
      setActiveTransferId(paramTransferId);
    }
  }, [paramTransferId]);

  const activeTransfer = useMemo(() => {
    return transfers.find((t) => t.id === activeTransferId) || null;
  }, [transfers, activeTransferId]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [sourceNode, setSourceNode] = useState('n-bb1');
  const [destNode, setDestNode] = useState('n-bb2');
  const [algorithm, setAlgorithm] = useState<AlgoType>('dijkstra');
  const [speed, setSpeed] = useState(60); // km/h
  const [battery, setBattery] = useState(100);
  const [batteryReserve, setBatteryReserve] = useState(20);
  const [simulatedDelay, setSimulatedDelay] = useState(0); // minutes
  const [routeResult, setRouteResult] = useState<GraphAlgorithmResult | null>(null);
  const [algoSteps, setAlgoSteps] = useState<AlgorithmStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  // Simulation state
  const [simState, setSimState] = useState<'idle' | 'running' | 'paused' | 'completed' | 'aborted'>('idle');
  const [dronePos, setDronePos] = useState({ x: 150, y: 300 });
  const [progress, setProgress] = useState(0);
  const [missionStatus, setMissionStatus] = useState('Idle — Ready for simulated flight');
  const simStateRef = useRef(simState);
  useEffect(() => {
    simStateRef.current = simState;
  }, [simState]);

  const batteryRef = useRef(battery);
  useEffect(() => {
    batteryRef.current = battery;
  }, [battery]);

  const dronePosRef = useRef(dronePos);
  useEffect(() => {
    dronePosRef.current = dronePos;
  }, [dronePos]);

  // Sync endpoints from active transfer
  useEffect(() => {
    if (activeTransfer) {
      const srcNode = graphState.nodes.find(
        (n) => n.id.includes(activeTransfer.sourceBankId) || n.label.toLowerCase().includes(activeTransfer.sourceBankId.toLowerCase())
      );
      const dstNode = graphState.nodes.find(
        (n) => n.id.includes(activeTransfer.destinationBankId) || n.label.toLowerCase().includes(activeTransfer.destinationBankId.toLowerCase())
      );

      const sId =
        srcNode?.id ||
        (activeTransfer.sourceBankId === 'bb-1'
          ? 'n-bb1'
          : activeTransfer.sourceBankId === 'bb-2'
          ? 'n-bb2'
          : activeTransfer.sourceBankId === 'bb-3'
          ? 'n-bb3'
          : activeTransfer.sourceBankId === 'bb-4'
          ? 'n-bb4'
          : 'n-bb5');

      const dId =
        dstNode?.id ||
        (activeTransfer.destinationBankId === 'bb-1'
          ? 'n-bb1'
          : activeTransfer.destinationBankId === 'bb-2'
          ? 'n-bb2'
          : activeTransfer.destinationBankId === 'bb-3'
          ? 'n-bb3'
          : activeTransfer.destinationBankId === 'bb-4'
          ? 'n-bb4'
          : 'n-bb5');

      setSourceNode(sId);
      setDestNode(dId);
    }
  }, [activeTransfer, graphState.nodes]);

  // ─── DSA: Fixed-Capacity Circular Queue for Simulation Telemetry ───────────
  const telemetryQueueRef = useRef(new CircularQueue<DroneTelemetryEvent>(RING_CAPACITY));
  const [telemetrySnapshot, setTelemetrySnapshot] = useState<{
    buffer: (DroneTelemetryEvent | null)[];
    front: number;
    rear: number;
    size: number;
    capacity: number;
  }>({
    buffer: new Array(RING_CAPACITY).fill(null),
    front: -1,
    rear: -1,
    size: 0,
    capacity: RING_CAPACITY,
  });

  const pushTelemetry = useCallback((eventType: DroneTelemetryEvent['eventType'], message: string, details?: string) => {
    const q = telemetryQueueRef.current;
    const event: DroneTelemetryEvent = {
      id: `tel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      eventType,
      message,
      droneId: 'drone-alpha-1',
      batteryPercent: batteryRef.current,
      currentCoord: dronePosRef.current,
      details,
    };

    q.enqueueWithOverwrite(event);

    setTelemetrySnapshot({
      buffer: q.toArray(),
      front: q.frontIndex,
      rear: q.rearIndex,
      size: q.size(),
      capacity: q.capacity,
    });
  }, []);

  const nonObstacleNodes = graphState.nodes.filter((n) => n.type !== 'obstacle');

  // Calculate route
  const handleCalculateRoute = useCallback(() => {
    if (!sourceNode || !destNode) return;
    let result: GraphAlgorithmResult;
    switch (algorithm) {
      case 'bfs':
        result = bfs(graphState.nodes, graphState.edges, sourceNode, destNode);
        break;
      case 'dfs':
        result = dfs(graphState.nodes, graphState.edges, sourceNode, destNode);
        break;
      case 'dijkstra':
        result = dijkstra(graphState.nodes, graphState.edges, sourceNode, destNode);
        break;
    }
    setRouteResult(result);
    setAlgoSteps(result.steps);
    setCurrentStep(0);
    setSimState('idle');
    setProgress(0);

    const srcNode = graphState.nodes.find((n) => n.id === sourceNode);
    if (srcNode) {
      setDronePos((prev) => (prev.x === srcNode.x && prev.y === srcNode.y ? prev : { x: srcNode.x, y: srcNode.y }));
    }

    pushTelemetry(
      'feasibility_recalculated',
      `Calculated path via ${algorithm.toUpperCase()}: ${result.path.length > 0 ? `${result.distance}km (${result.path.length} hops)` : 'Destination unreachable'}`,
      `Nodes visited: [${result.visitedNodes.join(', ')}]`
    );
  }, [sourceNode, destNode, algorithm, graphState, pushTelemetry]);

  // Recalculate route when endpoints, algorithm, or graph genuinely change
  useEffect(() => {
    handleCalculateRoute();
  }, [handleCalculateRoute]);

  // Battery check
  const baseFlightTime = routeResult ? (routeResult.distance / speed) * 60 : 0; // minutes
  const estimatedFlightTime = baseFlightTime + simulatedDelay;
  const batteryRequired = routeResult ? Math.min(100, (routeResult.distance / (speed * 2)) * 100) : 0;
  const batteryFeasible = battery - batteryRequired >= batteryReserve;

  // Add Weather / Airspace Delay
  const handleAddDelay = (min: number) => {
    setSimulatedDelay((d) => d + min);
    if (activeTransfer) {
      delayTransfer(activeTransfer.id, min);
    }
    pushTelemetry(
      'transport_delay',
      `Introduced simulated airspace delay: +${min}m (Total delay: ${simulatedDelay + min}m)`,
      activeTransfer
        ? `Recalculated transfer ${activeTransfer.id} feasibility in store`
        : 'Simulated adverse weather / corridor congestion requiring speed adjustment'
    );
  };

  // Animation
  const startSimulation = useCallback(() => {
    if (!routeResult || routeResult.path.length < 2) return;
    if (!batteryFeasible) {
      setMissionStatus('Battery insufficient — mission rejected');
      pushTelemetry('battery_changed', 'Mission start rejected due to insufficient battery reserve');
      return;
    }

    // Connect transfer state transition: dispatched / in_transit
    if (activeTransfer) {
      if (activeTransfer.status === 'approved' || activeTransfer.status === 'proposed') {
        dispatchTransfer(activeTransfer.id);
      }
    }

    setSimState('running');
    setMissionStatus('SIMULATED — Drone airborne on flight corridor');
    pushTelemetry(
      'mission_started',
      `Mission started from ${sourceNode} to ${destNode}${activeTransfer ? ` (Transfer ${activeTransfer.id})` : ''}`,
      `Route: ${routeResult.path.join(' → ')}`
    );

    const path = routeResult.path;
    const pathNodes = path.map((id) => graphState.nodes.find((n) => n.id === id)!).filter(Boolean);
    let segmentIdx = 0;
    let segProgress = 0;
    const segCount = pathNodes.length - 1;

    const animate = () => {
      if (simStateRef.current === 'paused') {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      if (simStateRef.current === 'aborted' || simStateRef.current === 'idle') return;

      segProgress += 0.008 * (speed / 60);
      if (segProgress >= 1) {
        segProgress = 0;
        segmentIdx++;
        if (segmentIdx < pathNodes.length) {
          pushTelemetry(
            'waypoint_reached',
            `Reached waypoint node: ${pathNodes[segmentIdx].label} (${pathNodes[segmentIdx].id})`,
            `Progress: ${Math.round((segmentIdx / segCount) * 100)}%`
          );
        }

        if (segmentIdx >= segCount) {
          setDronePos({ x: pathNodes[pathNodes.length - 1].x, y: pathNodes[pathNodes.length - 1].y });
          setProgress(100);
          setSimState('completed');
          setMissionStatus('SIMULATED — Drone arrived at destination (awaiting receipt confirmation)');

          // Update canonical transfer status to arrived
          if (activeTransfer) {
            updateTransfer(activeTransfer.id, {
              status: 'arrived',
              arrivedAt: new Date().toISOString(),
            });
          }

          pushTelemetry(
            'eta_updated',
            `Drone reached destination ${destNode} safely`,
            activeTransfer ? `Transfer ${activeTransfer.id} marked arrived. Ready for handover verification.` : 'Completed flight leg'
          );
          return;
        }
      }

      const from = pathNodes[segmentIdx];
      const to = pathNodes[segmentIdx + 1];
      const x = from.x + (to.x - from.x) * segProgress;
      const y = from.y + (to.y - from.y) * segProgress;
      setDronePos({ x, y });
      setProgress(Math.round(((segmentIdx + segProgress) / segCount) * 100));
      setBattery((prev) => Math.max(0, prev - 0.01));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // Create mission record linked to exact transfer
    addMission({
      droneId: 'drone-alpha-1',
      transferId: activeTransfer?.id || null,
      sourceBankId: sourceNode,
      destinationBankId: destNode,
      status: 'flying',
      routeNodes: path,
      routeDistance: routeResult.distance,
      routeCost: routeResult.distance,
      speed,
      batteryPercent: battery,
      batteryReserve,
      estimatedFlightTime,
      estimatedArrival: new Date(getNow() + estimatedFlightTime * 60000).toISOString(),
      progress: 0,
      currentPosition: dronePos,
      startedAt: new Date().toISOString(),
      completedAt: null,
    });
  }, [
    routeResult,
    battery,
    batteryReserve,
    batteryFeasible,
    speed,
    graphState.nodes,
    sourceNode,
    destNode,
    estimatedFlightTime,
    getNow,
    addMission,
    dronePos,
    pushTelemetry,
    activeTransfer,
    dispatchTransfer,
    updateTransfer,
  ]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Draw edges
    graphState.edges.forEach((edge) => {
      const from = graphState.nodes.find((n) => n.id === edge.from);
      const to = graphState.nodes.find((n) => n.id === edge.to);
      if (!from || !to) return;
      const isOnRoute = routeResult?.path.some((id, i) => {
        if (i >= routeResult.path.length - 1) return false;
        return (
          (routeResult.path[i] === edge.from && routeResult.path[i + 1] === edge.to) ||
          (routeResult.path[i] === edge.to && routeResult.path[i + 1] === edge.from)
        );
      });

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      if (isOnRoute) {
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 3.5;
      } else {
        ctx.strokeStyle = '#D1D5DB';
        ctx.lineWidth = 1.5;
      }
      ctx.stroke();

      // Weight label
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px monospace';
      ctx.fillText(`${edge.weight}km`, mx - 12, my - 4);
    });

    // Draw nodes
    graphState.nodes.forEach((node) => {
      const isStart = node.id === sourceNode;
      const isEnd = node.id === destNode;
      const isOnRoute = routeResult?.path.includes(node.id);
      const isObstacle = node.type === 'obstacle';

      ctx.beginPath();
      ctx.arc(node.x, node.y, isObstacle ? 14 : 10, 0, Math.PI * 2);
      if (isObstacle) {
        ctx.fillStyle = '#FEE2E2';
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 2;
      } else if (isStart) {
        ctx.fillStyle = '#2563EB';
        ctx.strokeStyle = '#1D4ED8';
        ctx.lineWidth = 2.5;
      } else if (isEnd) {
        ctx.fillStyle = '#059669';
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 2.5;
      } else if (isOnRoute) {
        ctx.fillStyle = '#F59E0B';
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#9CA3AF';
        ctx.lineWidth = 1.5;
      }
      ctx.fill();
      ctx.stroke();

      // Node label
      ctx.fillStyle = isObstacle ? '#DC2626' : '#111827';
      ctx.font = isStart || isEnd ? 'bold 11px sans-serif' : '10px sans-serif';
      ctx.fillText(node.label, node.x - 24, node.y + (isObstacle ? 26 : 22));
    });

    // Draw drone position
    if (simState === 'running' || simState === 'paused' || simState === 'completed') {
      ctx.beginPath();
      ctx.arc(dronePos.x, dronePos.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#DC2626';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#DC2626';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('DRONE-1', dronePos.x + 10, dronePos.y - 4);
    }
  }, [graphState, routeResult, sourceNode, destNode, dronePos, simState]);

  const getBankName = (id: string) => bloodBanks.find((b) => b.id === id)?.name || id;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Drone Operations</h1>
          <p>Autonomous UAV Air Corridor Simulator &amp; Graph Routing</p>
        </div>

        {activeTransfer && (
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href={`/transfers?transferId=${activeTransfer.id}`} className="btn btn-secondary">
              Track Custody Record →
            </Link>
          </div>
        )}
      </div>

      <div className="page-content">
        {/* Connected Transfer Banner */}
        {activeTransfer && (
          <div
            className="card"
            style={{
              marginBottom: 18,
              padding: '14px 20px',
              borderLeft: '4px solid var(--color-primary)',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(15, 23, 42, 0.95))',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plane size={18} color="var(--color-primary)" />
                <span style={{ fontWeight: 700, fontSize: 14 }}>
                  Simulating Authorized Transfer: {activeTransfer.id}
                </span>
                <span className={`badge badge-${activeTransfer.status === 'in_transit' ? 'info' : activeTransfer.status === 'approved' ? 'info' : 'normal'}`}>
                  {activeTransfer.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                Origin: <strong>{getBankName(activeTransfer.sourceBankId)}</strong> → Destination: <strong>{getBankName(activeTransfer.destinationBankId)}</strong> | Usable Shelf Life: <strong style={{ color: activeTransfer.usableTimeAfterTransfer > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>+{activeTransfer.usableTimeAfterTransfer}m</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {activeTransfer.status === 'arrived' ? (
                <Link href={`/transfers?transferId=${activeTransfer.id}`} className="btn btn-success btn-sm">
                  <CheckCircle size={13} /> Complete Handover in Transfers
                </Link>
              ) : (
                <Link href={`/transfers?transferId=${activeTransfer.id}`} className="btn btn-secondary btn-sm">
                  View in Transfer Tracking
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Operational Flight Metrics */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-label">Flight Route Distance</div>
            <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
              {routeResult ? `${routeResult.distance} km` : '—'}
            </div>
            <div className="stat-desc">{routeResult ? `${routeResult.path.length} hops via ${algorithm.toUpperCase()}` : 'Select valid corridor'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Battery Level</div>
            <div className="stat-value" style={{ color: batteryFeasible ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {battery.toFixed(0)}%
            </div>
            <div className="stat-desc">Reserve required: {batteryReserve}% ({batteryFeasible ? 'Safe reserve' : 'Breaches safety reserve'})</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Estimated Flight Time</div>
            <div className="stat-value" style={{ color: simulatedDelay > 0 ? 'var(--color-warning)' : 'var(--text-primary)' }}>
              {routeResult ? `${(estimatedFlightTime).toFixed(0)} min` : '—'}
            </div>
            <div className="stat-desc">{simulatedDelay > 0 ? `Includes +${simulatedDelay}m corridor delay` : 'Cruising at nominal airspeed'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Telemetry Ring Buffer</div>
            <div className="stat-value" style={{ color: 'var(--color-info)' }}>
              {telemetrySnapshot.size} / {telemetrySnapshot.capacity}
            </div>
            <div className="stat-desc">Circular queue bounded events</div>
          </div>
        </div>

        <div className="grid-2">
          {/* Canvas & Controls */}
          <div>
            <div className="sim-canvas-container">
              <canvas ref={canvasRef} width={780} height={520} style={{ display: 'block', width: '100%', height: 'auto' }} />
              <div className="sim-controls">
                <button className="btn btn-primary btn-sm" onClick={startSimulation} disabled={!routeResult || simState === 'running'}>
                  <Play size={14} /> Start Mission Flight
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSimState(simState === 'paused' ? 'running' : 'paused')}
                  disabled={simState !== 'running' && simState !== 'paused'}
                >
                  <Pause size={14} /> {simState === 'paused' ? 'Resume' : 'Pause'}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    setSimState('aborted');
                    setMissionStatus('Mission aborted');
                    cancelAnimationFrame(animationRef.current);
                    pushTelemetry('mission_started', 'Mission aborted by operator');
                  }}
                >
                  <Square size={14} /> Abort
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSimState('idle');
                    setProgress(0);
                    setBattery(100);
                    setSimulatedDelay(0);
                    setMissionStatus('Mission reset');
                    cancelAnimationFrame(animationRef.current);
                    handleCalculateRoute();
                  }}
                >
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
            </div>

            {/* Mission Telemetry Summary */}
            <div className="card" style={{ marginTop: 12 }}>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 13 }}>
                  <div>
                    <strong>Status:</strong>{' '}
                    <span className={`badge badge-${simState === 'running' ? 'flying' : simState === 'completed' ? 'normal' : 'warning'}`}>
                      {missionStatus}
                    </span>
                  </div>
                  <div><strong>Flight Progress:</strong> {progress}%</div>
                  <div><strong>Battery:</strong> <span style={{ color: battery < 30 ? '#DC2626' : '#059669', fontWeight: 600 }}>{battery.toFixed(1)}%</span></div>
                  <div><strong>Route Distance:</strong> {routeResult ? `${routeResult.distance} km` : '—'}</div>
                  <div><strong>Est. Flight Time:</strong> {routeResult ? `${estimatedFlightTime.toFixed(0)} min` : '—'}</div>
                  <div><strong>Corridor Delay:</strong> +{simulatedDelay} min</div>
                </div>
                {/* Progress bar */}
                <div style={{ marginTop: 12, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progress}%`,
                      background: 'var(--color-primary)',
                      borderRadius: 3,
                      transition: 'width 0.2s',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Delay simulation controls */}
            <div className="card" style={{ marginTop: 12 }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <ShieldAlert size={16} color="var(--color-warning)" />
                  <span>Simulate Real-Time Airspace / Weather Transport Delay:</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleAddDelay(15)}>+15 min Delay</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleAddDelay(30)}>+30 min Delay</button>
                  {simulatedDelay > 0 && <button className="btn btn-secondary btn-sm" onClick={() => setSimulatedDelay(0)}>Clear Delay</button>}
                </div>
              </div>
            </div>
          </div>

          {/* Graph Pathfinding Configuration & Telemetry Ring Buffer */}
          <div>
            <div className="card">
              <div className="card-header">
                <h2>Graph Pathfinding Configuration</h2>
              </div>
              <div className="card-body">
                {/* Link to Active Transfer Selector */}
                {transfers.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Link to Active Transfer Record</label>
                    <select
                      className="form-select"
                      value={activeTransferId}
                      onChange={(e) => setActiveTransferId(e.target.value)}
                    >
                      <option value="">No linked transfer (Manual graph corridor test)</option>
                      {transfers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.id} — {getBankName(t.sourceBankId)} → {getBankName(t.destinationBankId)} ({t.status.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Source Node (Start Vertex)</label>
                  <select className="form-select" value={sourceNode} onChange={(e) => setSourceNode(e.target.value)}>
                    <option value="">Select source...</option>
                    {nonObstacleNodes.map((n) => <option key={n.id} value={n.id}>{n.label} ({n.id})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Destination Node (Target Vertex)</label>
                  <select className="form-select" value={destNode} onChange={(e) => setDestNode(e.target.value)}>
                    <option value="">Select destination...</option>
                    {nonObstacleNodes.filter((n) => n.id !== sourceNode).map((n) => <option key={n.id} value={n.id}>{n.label} ({n.id})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Graph Traversal / Routing Algorithm</label>
                  <select className="form-select" value={algorithm} onChange={(e) => setAlgorithm(e.target.value as AlgoType)}>
                    <option value="dijkstra">Dijkstra&apos;s Shortest Path Algorithm (Weighted O(V²))</option>
                    <option value="bfs">Breadth-First Search (BFS Unweighted Level Order O(V+E))</option>
                    <option value="dfs">Depth-First Search (DFS Exhaustive Branch Exploration O(V+E))</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Drone Cruising Speed (km/h)</label>
                  <input className="form-input" type="number" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value) || 60)} />
                </div>
                <button className="btn btn-primary" onClick={handleCalculateRoute} disabled={!sourceNode || !destNode} style={{ width: '100%' }}>
                  <Zap size={16} /> Compute Route via {algorithm.toUpperCase()}
                </button>
              </div>
            </div>

            {/* Route Summary */}
            {routeResult && (
              <div className="card" style={{ marginTop: 12 }}>
                <div className="card-header"><h2>Route Path Summary</h2></div>
                <div className="card-body" style={{ fontSize: 12 }}>
                  <div style={{ marginBottom: 6 }}>
                    <strong>Calculated Path:</strong>{' '}
                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                      {routeResult.path.map((id) => graphState.nodes.find((n) => n.id === id)?.label || id).join(' → ')}
                    </span>
                  </div>
                  <div><strong>Total Distance:</strong> {routeResult.distance} km</div>
                  <div><strong>Nodes Visited during search:</strong> [{routeResult.visitedNodes.join(', ')}] ({routeResult.visitedNodes.length} nodes)</div>
                  <div><strong>Edges Explored:</strong> {routeResult.exploredEdges.length} corridor segments</div>
                  <div><strong>Destination Reachability:</strong> {routeResult.path.length > 0 ? <span style={{ color: 'var(--color-success)' }}>Reachable ✓</span> : <span style={{ color: 'var(--color-danger)' }}>Unreachable ✗</span>}</div>
                </div>
              </div>
            )}

            {/* ─── DSA: Circular Queue Ring Buffer Telemetry ───────────────── */}
            <div className="card" style={{ marginTop: 12 }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RotateCw size={16} color="var(--color-primary)" />
                  <h2 style={{ fontSize: 14 }}>Recent Telemetry Events (Circular Queue)</h2>
                </div>
                <span className="badge badge-info" style={{ fontSize: 10 }}>
                  Ring Buffer: {telemetrySnapshot.size}/{telemetrySnapshot.capacity}
                </span>
              </div>
              <div className="card-body">
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  <strong>Circular Queue (Capacity {RING_CAPACITY}):</strong> Fixed-size FIFO ring buffer with wraparound. Pointers: <code>front = {telemetrySnapshot.front}</code>, <code>rear = {telemetrySnapshot.rear}</code>. When full, oldest telemetry is overwritten in O(1) to bound memory. Critical audit logs are never overwritten.
                </div>

                {/* Ring Buffer Visual Slots */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, marginBottom: 12 }}>
                  {telemetrySnapshot.buffer.map((slot, idx) => {
                    const isFront = idx === telemetrySnapshot.front;
                    const isRear = idx === telemetrySnapshot.rear;
                    const hasData = slot !== null;
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '6px 2px',
                          textAlign: 'center',
                          borderRadius: 4,
                          fontSize: 10,
                          background: hasData ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          border: isFront
                            ? '2px solid var(--color-primary)'
                            : isRear
                            ? '2px solid var(--color-warning)'
                            : '1px solid var(--border-color)',
                          position: 'relative',
                        }}
                      >
                        <div style={{ fontWeight: 600, color: hasData ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          [{idx}]
                        </div>
                        <div style={{ fontSize: 8, color: isFront ? 'var(--color-primary)' : isRear ? 'var(--color-warning)' : 'var(--text-muted)' }}>
                          {isFront && isRear ? 'F/R' : isFront ? 'FRONT' : isRear ? 'REAR' : hasData ? 'DATA' : 'EMPTY'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Event log */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                  {telemetrySnapshot.buffer.filter((e): e is DroneTelemetryEvent => e !== null).map((event) => (
                    <div
                      key={event.id}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderLeft: `3px solid ${
                          event.eventType === 'transport_delay'
                            ? 'var(--color-warning)'
                            : event.eventType === 'battery_changed'
                            ? 'var(--color-danger)'
                            : 'var(--color-info)'
                        }`,
                        fontSize: 11,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 10 }}>
                        <span>{event.eventType.toUpperCase()}</span>
                        <span>{event.timestamp}</span>
                      </div>
                      <div style={{ color: 'var(--text-primary)', marginTop: 2 }}>{event.message}</div>
                      {event.details && <div style={{ color: 'var(--text-secondary)', fontSize: 10, marginTop: 1 }}>{event.details}</div>}
                    </div>
                  ))}
                  {telemetrySnapshot.size === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, padding: 8 }}>
                      No telemetry events enqueued yet. Start mission to stream.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Collapsible: How the algorithm works ────────────────────────── */}
        <details className="card" style={{ marginTop: 24, border: '1px solid var(--border-color)' }}>
          <summary style={{ padding: '14px 18px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
            <Sparkles size={16} color="var(--color-primary)" />
            <span>How the algorithm works: Graph Routing (BFS, DFS, Dijkstra) &amp; Circular Queue</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 400 }}>Click to expand operational proof</span>
          </summary>
          <div className="card-body" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-primary)', marginBottom: 6 }}>
                  Graph Traversal &amp; Pathfinding
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>Dijkstra (O(V²)):</strong> Computes the exact minimum Euclidean corridor flight distance avoiding designated no-fly obstacles.
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4 }}>
                  <strong>BFS (O(V+E)):</strong> Finds path with minimal intermediate waypoints (unweighted hop count).
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4 }}>
                  <strong>DFS (O(V+E)):</strong> Recursive branch exploration exploring deep corridors before backtracking.
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-info)', marginBottom: 6 }}>
                  Bounded Telemetry Ring Buffer
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>Circular Queue (Capacity {RING_CAPACITY}):</strong> Operates with index wraparound: <code>rear = (rear + 1) % capacity</code>.
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4 }}>
                  Fixed capacity bounds memory footprint during high-frequency telemetry updates while preserving the newest events in O(1) time.
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </>
  );
}

export default function DroneSimulationPage() {
  return (
    <Suspense fallback={<div className="page-content" style={{ color: '#94a3b8' }}>Loading Drone Operations...</div>}>
      <DroneSimulationContent />
    </Suspense>
  );
}

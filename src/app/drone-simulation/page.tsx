'use client';

import { useStore } from '@/lib/store';
import {
  Plane, Play, Pause, Square, RotateCcw, Zap, AlertTriangle,
  RotateCw, Layers, ShieldAlert, CheckCircle, Info, Sparkles
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { bfs, dfs, dijkstra, GraphAlgorithmResult, CircularQueue } from '@/lib/dsa-engine';
import { GraphNode, GraphEdge, AlgorithmStep, DroneTelemetryEvent } from '@/lib/types';

type AlgoType = 'bfs' | 'dfs' | 'dijkstra';

const RING_CAPACITY = 8;

export default function DroneSimulationPage() {
  const graphState = useStore((s) => s.graphState);
  const bloodBanks = useStore((s) => s.bloodBanks);
  const addMission = useStore((s) => s.addMission);
  const getNow = useStore((s) => s.getNow);

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
      case 'bfs': result = bfs(graphState.nodes, graphState.edges, sourceNode, destNode); break;
      case 'dfs': result = dfs(graphState.nodes, graphState.edges, sourceNode, destNode); break;
      case 'dijkstra': result = dijkstra(graphState.nodes, graphState.edges, sourceNode, destNode); break;
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
    pushTelemetry(
      'transport_delay',
      `Introduced simulated airspace delay: +${min}m (Total delay: ${simulatedDelay + min}m)`,
      'Simulated adverse weather / corridor congestion requiring speed adjustment'
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

    setSimState('running');
    setMissionStatus('SIMULATED — Drone airborne on flight corridor');
    pushTelemetry('mission_started', `Mission started from ${sourceNode} to ${destNode}`, `Route: ${routeResult.path.join(' → ')}`);

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
          pushTelemetry('eta_updated', `Drone reached destination ${destNode} safely`, 'Completed flight leg');
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

    // Create mission record
    addMission({
      droneId: 'drone-alpha-1', transferId: null, sourceBankId: sourceNode, destinationBankId: destNode,
      status: 'flying', routeNodes: path, routeDistance: routeResult.distance,
      routeCost: routeResult.distance, speed, batteryPercent: battery,
      batteryReserve, estimatedFlightTime,
      estimatedArrival: new Date(getNow() + estimatedFlightTime * 60000).toISOString(),
      progress: 0, currentPosition: dronePos, startedAt: new Date().toISOString(), completedAt: null,
    });
  }, [routeResult, battery, batteryReserve, batteryFeasible, speed, graphState.nodes, sourceNode, destNode, estimatedFlightTime, getNow, addMission, dronePos, pushTelemetry]);

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
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Draw edges
    graphState.edges.forEach((edge) => {
      const from = graphState.nodes.find((n) => n.id === edge.from);
      const to = graphState.nodes.find((n) => n.id === edge.to);
      if (!from || !to) return;
      const isOnRoute = routeResult?.path.some((id, i) => {
        if (i >= routeResult.path.length - 1) return false;
        return (routeResult.path[i] === edge.from && routeResult.path[i + 1] === edge.to) ||
               (routeResult.path[i] === edge.to && routeResult.path[i + 1] === edge.from);
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
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`${edge.weight}km`, mx, my - 5);
    });

    // Draw nodes
    graphState.nodes.forEach((node) => {
      const isVisited = routeResult?.visitedNodes.includes(node.id);
      const isOnPath = routeResult?.path.includes(node.id);
      const isSource = node.id === sourceNode;
      const isDest = node.id === destNode;

      ctx.beginPath();
      if (node.type === 'obstacle') {
        ctx.rect(node.x - 16, node.y - 16, 32, 32);
        ctx.fillStyle = '#FEE2E2';
        ctx.strokeStyle = '#F87171';
      } else if (node.type === 'blood_bank') {
        ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = isSource ? '#059669' : isDest ? '#2563EB' : isOnPath ? '#DC2626' : isVisited ? '#DBEAFE' : '#F3F4F6';
        ctx.strokeStyle = isSource || isDest ? '#1A2744' : isOnPath ? '#DC2626' : '#9CA3AF';
      } else {
        ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = isOnPath ? '#FEF3C7' : isVisited ? '#E0E7FF' : '#F9FAFB';
        ctx.strokeStyle = isOnPath ? '#D97706' : '#D1D5DB';
      }
      ctx.lineWidth = (isSource || isDest) ? 3 : 1.5;
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.fillStyle = '#1A2744';
      ctx.font = node.type === 'blood_bank' ? 'bold 10px Inter' : '9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + (node.type === 'blood_bank' ? 32 : 22));
    });

    // Draw drone
    if (simState !== 'idle' || routeResult) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(dronePos.x, dronePos.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = simState === 'running' ? '#DC2626' : simState === 'completed' ? '#059669' : '#D97706';
      ctx.fill();
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Icon
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 10px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✈', dronePos.x, dronePos.y);
      ctx.restore();
    }
  }, [graphState, routeResult, sourceNode, destNode, dronePos, simState]);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Drone Route Simulation & Telemetry</h1>
          <p>Graph routing (BFS, DFS, Dijkstra) and fixed-capacity Circular Queue telemetry buffer for blood transport</p>
        </div>
      </div>

      <div className="page-content">
        <div className="grid-2">
          {/* Canvas & Controls */}
          <div>
            <div className="sim-canvas-container">
              <canvas ref={canvasRef} width={780} height={520} style={{ display: 'block', width: '100%', height: 'auto' }} />
              <div className="sim-controls">
                <button className="btn btn-primary btn-sm" onClick={startSimulation} disabled={!routeResult || simState === 'running'}>
                  <Play size={14} /> Start Mission
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
                  <div><strong>Status:</strong> <span className={`badge badge-${simState === 'running' ? 'flying' : simState === 'completed' ? 'normal' : 'warning'}`}>{missionStatus}</span></div>
                  <div><strong>Flight Progress:</strong> {progress}%</div>
                  <div><strong>Battery:</strong> <span style={{ color: battery < 30 ? '#DC2626' : '#059669', fontWeight: 600 }}>{battery.toFixed(1)}%</span></div>
                  <div><strong>Route Distance:</strong> {routeResult ? `${routeResult.distance} km` : '—'}</div>
                  <div><strong>Est. Flight Time:</strong> {routeResult ? `${estimatedFlightTime.toFixed(0)} min` : '—'}</div>
                  <div><strong>Corridor Delay:</strong> +{simulatedDelay} min</div>
                </div>
                {/* Progress bar */}
                <div style={{ marginTop: 12, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3 }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>

            {/* Delay simulation controls */}
            <div className="card" style={{ marginTop: 12, padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
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
              <div className="card-header"><h2>Graph Pathfinding Configuration</h2></div>
              <div className="card-body">
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
                          background: hasData ? (isRear ? 'rgba(220, 38, 38, 0.2)' : 'rgba(255, 255, 255, 0.05)') : 'rgba(0,0,0,0.2)',
                          border: isFront ? '2px solid var(--color-success)' : isRear ? '2px solid var(--color-danger)' : '1px solid var(--border-color)',
                          fontSize: 10,
                        }}
                        title={slot ? `${slot.eventType}: ${slot.message}` : `Empty slot #${idx}`}
                      >
                        <div style={{ fontWeight: 600 }}>#{idx}</div>
                        <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>
                          {isFront && isRear ? 'F/R' : isFront ? 'FRONT' : isRear ? 'REAR' : hasData ? 'OCC' : 'EMPTY'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Event stream */}
                <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {telemetrySnapshot.buffer
                    .filter((e): e is DroneTelemetryEvent => e !== null)
                    .slice()
                    .reverse()
                    .map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          padding: '6px 10px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: 4,
                          borderLeft: ev.eventType === 'transport_delay' ? '3px solid var(--color-warning)' : '3px solid var(--color-primary)',
                          fontSize: 11,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600 }}>{ev.message}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{ev.timestamp}</span>
                        </div>
                        {ev.details && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{ev.details}</div>}
                      </div>
                    ))}
                  {telemetrySnapshot.size === 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>
                      No telemetry recorded. Calculate route or start mission.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { useStore } from '@/lib/store';
import { Plane, Play, Pause, Square, RotateCcw, Zap } from 'lucide-react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { bfs, dfs, dijkstra, GraphAlgorithmResult } from '@/lib/dsa-engine';
import { GraphNode, GraphEdge, AlgorithmStep } from '@/lib/types';

type AlgoType = 'bfs' | 'dfs' | 'dijkstra';

export default function DroneSimulationPage() {
  const graphState = useStore((s) => s.graphState);
  const bloodBanks = useStore((s) => s.bloodBanks);
  const addMission = useStore((s) => s.addMission);
  const getNow = useStore((s) => s.getNow);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [sourceNode, setSourceNode] = useState('');
  const [destNode, setDestNode] = useState('');
  const [algorithm, setAlgorithm] = useState<AlgoType>('dijkstra');
  const [speed, setSpeed] = useState(60); // km/h
  const [battery, setBattery] = useState(100);
  const [batteryReserve, setBatteryReserve] = useState(20);
  const [routeResult, setRouteResult] = useState<GraphAlgorithmResult | null>(null);
  const [algoSteps, setAlgoSteps] = useState<AlgorithmStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  // Simulation state
  const [simState, setSimState] = useState<'idle' | 'running' | 'paused' | 'completed' | 'aborted'>('idle');
  const [dronePos, setDronePos] = useState({ x: 0, y: 0 });
  const [progress, setProgress] = useState(0);
  const [missionStatus, setMissionStatus] = useState('No active mission');
  const simStateRef = useRef(simState);
  simStateRef.current = simState;

  const nonObstacleNodes = graphState.nodes.filter((n) => n.type !== 'obstacle');

  // Calculate route
  const handleCalculateRoute = () => {
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

    if (result.path.length > 0) {
      const srcNode = graphState.nodes.find((n) => n.id === sourceNode);
      if (srcNode) setDronePos({ x: srcNode.x, y: srcNode.y });
    }
  };

  // Battery check
  const estimatedFlightTime = routeResult ? (routeResult.distance / speed) * 60 : 0; // minutes
  const batteryRequired = routeResult ? Math.min(100, (routeResult.distance / (speed * 2)) * 100) : 0;
  const batteryFeasible = battery - batteryRequired >= batteryReserve;

  // Animation
  const startSimulation = useCallback(() => {
    if (!routeResult || routeResult.path.length < 2) return;
    if (!batteryFeasible) { setMissionStatus('Battery insufficient — mission rejected'); return; }

    setSimState('running');
    setMissionStatus('SIMULATED — Drone in flight');
    const path = routeResult.path;
    const pathNodes = path.map((id) => graphState.nodes.find((n) => n.id === id)!).filter(Boolean);
    let segmentIdx = 0;
    let segProgress = 0;
    const segCount = pathNodes.length - 1;

    const animate = () => {
      if (simStateRef.current === 'paused') { animationRef.current = requestAnimationFrame(animate); return; }
      if (simStateRef.current === 'aborted' || simStateRef.current === 'idle') return;

      segProgress += 0.008 * (speed / 60);
      if (segProgress >= 1) {
        segProgress = 0;
        segmentIdx++;
        if (segmentIdx >= segCount) {
          setDronePos({ x: pathNodes[pathNodes.length - 1].x, y: pathNodes[pathNodes.length - 1].y });
          setProgress(100);
          setSimState('completed');
          setMissionStatus('SIMULATED — Drone arrived at destination (awaiting receipt confirmation)');
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
      droneId: 'drone-1', transferId: null, sourceBankId: sourceNode, destinationBankId: destNode,
      status: 'flying', routeNodes: path, routeDistance: routeResult.distance,
      routeCost: routeResult.distance, speed, batteryPercent: battery,
      batteryReserve, estimatedFlightTime: estimatedFlightTime,
      estimatedArrival: new Date(getNow() + estimatedFlightTime * 60000).toISOString(),
      progress: 0, currentPosition: dronePos, startedAt: new Date().toISOString(), completedAt: null,
    });
  }, [routeResult, battery, batteryReserve, batteryFeasible, speed, graphState.nodes, sourceNode, destNode, estimatedFlightTime, getNow, addMission, dronePos]);

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
      ctx.strokeStyle = edge.blocked ? '#FCA5A5' : isOnRoute ? '#059669' : '#CBD5E1';
      ctx.lineWidth = isOnRoute ? 3 : 1.5;
      if (edge.blocked) ctx.setLineDash([4, 4]); else ctx.setLineDash([]);
      ctx.stroke();
      ctx.setLineDash([]);

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
        ctx.fillStyle = isSource ? '#059669' : isDest ? '#2563EB' : isOnPath ? '#8B1A2B' : isVisited ? '#DBEAFE' : '#F3F4F6';
        ctx.strokeStyle = isSource || isDest ? '#1A2744' : isOnPath ? '#8B1A2B' : '#9CA3AF';
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
      ctx.arc(dronePos.x, dronePos.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = simState === 'running' ? '#DC2626' : simState === 'completed' ? '#059669' : '#D97706';
      ctx.fill();
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Propeller
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
      <div className="page-header">
        <h1>Drone Simulation</h1>
        <p>Interactive 2D drone route simulation using graph algorithms — all missions are SIMULATED</p>
      </div>
      <div className="page-content">
        <div className="grid-2">
          {/* Canvas */}
          <div>
            <div className="sim-canvas-container">
              <canvas ref={canvasRef} width={780} height={560} style={{ display: 'block', width: '100%', height: 'auto' }} />
              <div className="sim-controls">
                <button className="btn btn-primary btn-sm" onClick={startSimulation} disabled={!routeResult || simState === 'running'}>
                  <Play size={14} /> Start
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setSimState(simState === 'paused' ? 'running' : 'paused')} disabled={simState !== 'running' && simState !== 'paused'}>
                  <Pause size={14} /> {simState === 'paused' ? 'Resume' : 'Pause'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => { setSimState('aborted'); setMissionStatus('Mission aborted'); cancelAnimationFrame(animationRef.current); }}>
                  <Square size={14} /> Abort
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setSimState('idle'); setProgress(0); setRouteResult(null); setBattery(100); setMissionStatus('No active mission'); cancelAnimationFrame(animationRef.current); }}>
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
            </div>

            {/* Mission Info */}
            <div className="card" style={{ marginTop: 12 }}>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 13 }}>
                  <div><strong>Status:</strong> <span className={`badge badge-${simState === 'running' ? 'flying' : simState === 'completed' ? 'normal' : 'warning'}`}>{missionStatus}</span></div>
                  <div><strong>Progress:</strong> {progress}%</div>
                  <div><strong>Battery:</strong> <span style={{ color: battery < 30 ? '#DC2626' : '#059669' }}>{battery.toFixed(1)}%</span></div>
                  <div><strong>Route Distance:</strong> {routeResult ? `${routeResult.distance}km` : '—'}</div>
                  <div><strong>Est. Flight Time:</strong> {routeResult ? `${estimatedFlightTime.toFixed(0)}min` : '—'}</div>
                  <div><strong>Speed:</strong> {speed} km/h</div>
                </div>
                {/* Progress bar */}
                <div style={{ marginTop: 12, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3 }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div>
            <div className="card">
              <div className="card-header"><h2>Route Configuration</h2></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Source Node</label>
                  <select className="form-select" value={sourceNode} onChange={(e) => setSourceNode(e.target.value)}>
                    <option value="">Select source...</option>
                    {nonObstacleNodes.map((n) => <option key={n.id} value={n.id}>{n.label} ({n.type})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Destination Node</label>
                  <select className="form-select" value={destNode} onChange={(e) => setDestNode(e.target.value)}>
                    <option value="">Select destination...</option>
                    {nonObstacleNodes.filter((n) => n.id !== sourceNode).map((n) => <option key={n.id} value={n.id}>{n.label} ({n.type})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pathfinding Algorithm</label>
                  <select className="form-select" value={algorithm} onChange={(e) => setAlgorithm(e.target.value as AlgoType)}>
                    <option value="dijkstra">Dijkstra&apos;s Shortest Path</option>
                    <option value="bfs">BFS (Breadth-First Search)</option>
                    <option value="dfs">DFS (Depth-First Search)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Drone Speed (km/h)</label>
                  <input className="form-input" type="number" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value) || 60)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Battery (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={battery} onChange={(e) => setBattery(parseFloat(e.target.value) || 100)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Battery Reserve (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={batteryReserve} onChange={(e) => setBatteryReserve(parseInt(e.target.value) || 20)} />
                </div>
                <button className="btn btn-primary" onClick={handleCalculateRoute} disabled={!sourceNode || !destNode} style={{ width: '100%' }}>
                  <Zap size={16} /> Calculate Route
                </button>
                {routeResult && !batteryFeasible && (
                  <div style={{ marginTop: 8, padding: 8, background: '#FEF2F2', borderRadius: 6, fontSize: 12, color: '#DC2626' }}>
                    ⚠ Battery insufficient for this route. Required: {batteryRequired.toFixed(1)}%, Reserve: {batteryReserve}%
                  </div>
                )}
              </div>
            </div>

            {/* Algorithm Steps */}
            {algoSteps.length > 0 && (
              <div className="card" style={{ marginTop: 12 }}>
                <div className="card-header">
                  <h2>Algorithm Steps ({algorithm.toUpperCase()})</h2>
                  <span className="badge badge-info">{algoSteps.length} steps</span>
                </div>
                <div className="card-body" style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {algoSteps.map((step, i) => (
                    <div key={i} className="dsa-step" style={{ borderLeftColor: i === currentStep ? 'var(--status-info)' : 'var(--border-light)' }}>
                      <div style={{ fontSize: 11, fontWeight: 600 }}>Step {step.step}: {step.action}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{step.description}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        Visited: [{step.visitedNodes.join(', ')}]
                        {step.distances && <span> | Distances: {JSON.stringify(step.distances)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Route Summary */}
            {routeResult && (
              <div className="card" style={{ marginTop: 12 }}>
                <div className="card-header"><h2>Route Summary</h2></div>
                <div className="card-body">
                  <div style={{ fontSize: 13 }}>
                    <div><strong>Path:</strong> {routeResult.path.map((id) => graphState.nodes.find((n) => n.id === id)?.label || id).join(' → ')}</div>
                    <div><strong>Distance:</strong> {routeResult.distance} km</div>
                    <div><strong>Nodes visited:</strong> {routeResult.visitedNodes.length}</div>
                    <div><strong>Edges explored:</strong> {routeResult.exploredEdges.length}</div>
                    {routeResult.path.length === 0 && <div style={{ color: '#DC2626', fontWeight: 600 }}>No path found — destination unreachable</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

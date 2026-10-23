'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import {
  Droplets, Play, Pause, RotateCcw, SkipForward, ArrowRight,
  Activity, Truck, Heart, FlaskConical, TestTube, ClipboardList,
  Network, Timer, Plane, ChevronDown, Layers, Search, BarChart3,
  GitBranch, Hash, Database, ArrowLeftRight, Cpu, Shield, Clock
} from 'lucide-react';

// ─── Scene Data ───────────────────────────────────────────────────────────────

const SCENES = [
  { id: 1, title: 'Emergency Response', duration: 6000 },
  { id: 2, title: 'Blood Collection', duration: 5000 },
  { id: 3, title: 'Blood Group Identification', duration: 5000 },
  { id: 4, title: 'Blood Requirement', duration: 5000 },
  { id: 5, title: 'Inventory Network', duration: 6000 },
  { id: 6, title: 'Time-Aware Redistribution', duration: 7000 },
  { id: 7, title: 'Drone Route Simulation', duration: 7000 },
];

const BLOOD_GROUPS = ['A+', 'B+', 'O+', 'AB+'] as const;

const DSA_FEATURES = [
  { icon: Layers, name: 'Stack (LIFO)', usage: 'Reversible action history for inventory edits — push on change, pop to undo.', color: '#dc2626' },
  { icon: ArrowRight, name: 'Queue (FIFO)', usage: 'Request processing in strict arrival order — first request in, first fulfilled.', color: '#3b82f6' },
  { icon: RotateCcw, name: 'Circular Queue', usage: 'Fixed-capacity ring buffer for recent drone telemetry events.', color: '#06b6d4' },
  { icon: GitBranch, name: 'Linked List', usage: 'Node-chain structure for inventory record management and traversal.', color: '#10b981' },
  { icon: RotateCcw, name: 'Circular Linked List', usage: 'Blood bank review rotation — closed cycle ensures every bank is visited.', color: '#f59e0b' },
  { icon: ArrowLeftRight, name: 'Deque', usage: 'Double-ended redistribution worklist — emergency tasks at front, routine at rear.', color: '#8b5cf6' },
  { icon: Hash, name: 'Hash Table', usage: 'O(1) lookup by unit ID and bank ID using separate chaining.', color: '#ec4899' },
  { icon: Search, name: 'Linear / Binary / Interpolation Search', usage: 'Locate matching inventory units by blood type, expiry, or quantity.', color: '#14b8a6' },
  { icon: BarChart3, name: 'Sorting (Bubble, Selection, Insertion, Merge)', usage: 'Rank candidates by expiry urgency and feasibility score.', color: '#f97316' },
  { icon: Network, name: 'Graph + BFS / DFS / Dijkstra', usage: 'Represent the blood bank corridor and compute shortest delivery routes.', color: '#dc2626' },
];

// ─── SVG Scene Components ────────────────────────────────────────────────────

function Scene1Emergency({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="scene-container">
      <svg viewBox="0 0 800 400" className="scene-svg">
        {/* Night sky gradient */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#050810" />
            <stop offset="60%" stopColor="#0d111d" />
            <stop offset="100%" stopColor="#131825" />
          </linearGradient>
          <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glowStrong">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Sky */}
        <rect width="800" height="400" fill="url(#skyGrad)" />

        {/* Stars */}
        {[...Array(20)].map((_, i) => (
          <circle key={i} cx={40 + i * 38} cy={20 + (i % 5) * 25 + (i % 3) * 15} r={i % 3 === 0 ? 1.5 : 1} fill="rgba(255,255,255,0.4)">
            {!reducedMotion && <animate attributeName="opacity" values="0.2;0.8;0.2" dur={`${2 + i % 3}s`} repeatCount="indefinite" />}
          </circle>
        ))}

        {/* City silhouette */}
        <rect x="50" y="180" width="40" height="120" rx="2" fill="#0f172a" />
        <rect x="55" y="190" width="8" height="8" rx="1" fill="rgba(245,158,11,0.3)" />
        <rect x="70" y="200" width="8" height="8" rx="1" fill="rgba(59,130,246,0.2)" />
        <rect x="100" y="160" width="55" height="140" rx="2" fill="#0f172a" />
        <rect x="110" y="170" width="8" height="8" rx="1" fill="rgba(245,158,11,0.4)" />
        <rect x="130" y="185" width="8" height="8" rx="1" fill="rgba(245,158,11,0.2)" />
        <rect x="110" y="200" width="8" height="8" rx="1" fill="rgba(59,130,246,0.3)" />
        <rect x="165" y="200" width="35" height="100" rx="2" fill="#0f172a" />
        <rect x="210" y="170" width="45" height="130" rx="2" fill="#131825" />
        <rect x="265" y="190" width="35" height="110" rx="2" fill="#0f172a" />

        {/* Hospital building on right */}
        <rect x="580" y="150" width="120" height="150" rx="4" fill="#0f172a" stroke="rgba(220,38,38,0.3)" strokeWidth="1" />
        <rect x="600" y="160" width="10" height="10" rx="1" fill="rgba(59,130,246,0.3)" />
        <rect x="620" y="160" width="10" height="10" rx="1" fill="rgba(245,158,11,0.3)" />
        <rect x="640" y="160" width="10" height="10" rx="1" fill="rgba(59,130,246,0.2)" />
        <rect x="660" y="160" width="10" height="10" rx="1" fill="rgba(245,158,11,0.4)" />
        <rect x="600" y="180" width="10" height="10" rx="1" fill="rgba(245,158,11,0.2)" />
        <rect x="620" y="180" width="10" height="10" rx="1" fill="rgba(59,130,246,0.4)" />
        <rect x="640" y="180" width="10" height="10" rx="1" fill="rgba(245,158,11,0.3)" />
        <rect x="660" y="180" width="10" height="10" rx="1" fill="rgba(59,130,246,0.2)" />
        {/* Hospital cross */}
        <rect x="630" y="130" width="20" height="30" rx="2" fill="#0d111d" stroke="rgba(220,38,38,0.6)" strokeWidth="1.5" />
        <rect x="634" y="138" width="12" height="3" rx="1" fill="#dc2626" filter="url(#glow)" />
        <rect x="637.5" y="134" width="5" height="12" rx="1" fill="#dc2626" filter="url(#glow)" />

        {/* Road */}
        <rect x="0" y="300" width="800" height="100" fill="url(#roadGrad)" />
        {/* Road lane markings */}
        {[...Array(12)].map((_, i) => (
          <rect key={i} x={20 + i * 66} y="345" width="40" height="3" rx="1.5" fill="rgba(255,255,255,0.15)">
            {!reducedMotion && (
              <animate attributeName="x" from={20 + i * 66} to={-46 + i * 66} dur="2s" repeatCount="indefinite" />
            )}
          </rect>
        ))}

        {/* Ambulance body */}
        <g filter="url(#glow)">
          <animateTransform
            attributeName="transform"
            type="translate"
            from="-200 0" to="350 0"
            dur={reducedMotion ? "0.01s" : "5s"}
            fill="freeze"
          />
          {/* Main body */}
          <rect x="100" y="270" width="120" height="45" rx="6" fill="#f1f5f9" />
          <rect x="100" y="270" width="120" height="12" rx="3" fill="#dc2626" />
          {/* Cross on side */}
          <rect x="148" y="288" width="24" height="5" rx="2" fill="#dc2626" />
          <rect x="156" y="280" width="8" height="20" rx="2" fill="#dc2626" />
          {/* Cab */}
          <rect x="220" y="278" width="40" height="37" rx="4" fill="#e2e8f0" />
          <rect x="228" y="284" width="24" height="16" rx="3" fill="rgba(59,130,246,0.3)" />
          {/* Wheels */}
          <circle cx="130" cy="318" r="10" fill="#1e293b" />
          <circle cx="130" cy="318" r="5" fill="#475569" />
          <circle cx="235" cy="318" r="10" fill="#1e293b" />
          <circle cx="235" cy="318" r="5" fill="#475569" />
          {/* Emergency light (steady glow, no flashing) */}
          <rect x="150" y="262" width="20" height="10" rx="5" fill="#dc2626" opacity="0.8" filter="url(#glow)" />
        </g>

        {/* Hospital entrance light */}
        <rect x="620" y="290" width="40" height="10" rx="2" fill="rgba(220,38,38,0.2)" filter="url(#glowStrong)" />
      </svg>
      <div className="scene-caption">
        <h3>Emergency Response Activated</h3>
        <p>A patient requires a blood transfusion. The ambulance transports them to the nearest hospital.</p>
      </div>
    </div>
  );
}

function Scene2Collection({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="scene-container">
      <svg viewBox="0 0 800 400" className="scene-svg">
        <defs>
          <linearGradient id="labBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d111d" />
            <stop offset="100%" stopColor="#050810" />
          </linearGradient>
        </defs>

        <rect width="800" height="400" fill="url(#labBg)" />

        {/* Lab environment */}
        <rect x="100" y="60" width="600" height="280" rx="12" fill="rgba(13,17,29,0.8)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* Counter / workbench */}
        <rect x="120" y="250" width="560" height="8" rx="2" fill="#1e293b" />

        {/* Healthcare professional silhouette */}
        <g transform="translate(200, 100)">
          <circle cx="40" cy="20" r="18" fill="#1e293b" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
          <rect x="20" y="40" width="40" height="60" rx="8" fill="#1e293b" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
          {/* Lab coat detail */}
          <rect x="22" y="45" width="36" height="4" rx="2" fill="rgba(59,130,246,0.15)" />
          {/* Stethoscope hint */}
          <circle cx="40" cy="55" r="4" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
        </g>

        {/* Specimen tube */}
        <g transform="translate(380, 120)">
          {!reducedMotion && (
            <animateTransform attributeName="transform" type="translate" values="380,160;380,120;440,120" dur="3s" fill="freeze" />
          )}
          <rect x="0" y="0" width="24" height="70" rx="8" fill="rgba(220,38,38,0.15)" stroke="rgba(220,38,38,0.5)" strokeWidth="1.5" />
          {/* Blood level */}
          <rect x="3" y="20" width="18" height="44" rx="6" fill="rgba(220,38,38,0.3)">
            {!reducedMotion && (
              <animate attributeName="height" values="0;44" dur="2s" fill="freeze" />
            )}
          </rect>
          {/* Label */}
          <rect x="2" y="5" width="20" height="10" rx="2" fill="rgba(255,255,255,0.1)" />
          <text x="12" y="13" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.5)" fontFamily="Inter">SAMPLE</text>
          {/* Cap */}
          <rect x="4" y="-6" width="16" height="8" rx="3" fill="#dc2626" />
        </g>

        {/* Testing station */}
        <g transform="translate(500, 100)">
          <rect x="0" y="0" width="140" height="140" rx="10" fill="rgba(13,17,29,0.9)" stroke="rgba(220,38,38,0.2)" strokeWidth="1" />
          <text x="70" y="20" textAnchor="middle" fontSize="9" fill="rgba(148,163,184,0.6)" fontFamily="Inter" fontWeight="600">TESTING STATION</text>

          {/* Screen */}
          <rect x="15" y="30" width="110" height="70" rx="6" fill="#050810" stroke="rgba(59,130,246,0.2)" strokeWidth="0.5" />
          {/* Screen content - waveform */}
          <polyline points="25,60 40,50 55,70 70,55 85,65 100,45 115,60" fill="none" stroke="rgba(16,185,129,0.5)" strokeWidth="1.5">
            {!reducedMotion && (
              <animate attributeName="stroke-dashoffset" from="200" to="0" dur="2s" fill="freeze" />
            )}
          </polyline>

          {/* Status indicators */}
          <circle cx="35" cy="118" r="4" fill="rgba(16,185,129,0.6)">
            {!reducedMotion && <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />}
          </circle>
          <text x="45" y="121" fontSize="7" fill="rgba(148,163,184,0.5)" fontFamily="Inter">Processing</text>
        </g>

        {/* Arrow showing sample flow */}
        <line x1="420" y1="170" x2="495" y2="170" stroke="rgba(220,38,38,0.3)" strokeWidth="1.5" strokeDasharray="5 3">
          {!reducedMotion && (
            <animate attributeName="stroke-dashoffset" from="16" to="0" dur="1s" repeatCount="indefinite" />
          )}
        </line>
        <polygon points="495,165 505,170 495,175" fill="rgba(220,38,38,0.4)" />
      </svg>
      <div className="scene-caption">
        <h3>Blood Sample Collection</h3>
        <p>A healthcare professional collects a labelled blood sample, which moves to the testing station for analysis.</p>
        <p className="scene-disclaimer">Visual simulation — not a depiction of an actual laboratory process.</p>
      </div>
    </div>
  );
}

function Scene3BloodGroup({ reducedMotion, selectedGroup }: { reducedMotion: boolean; selectedGroup: string }) {
  return (
    <div className="scene-container">
      <svg viewBox="0 0 800 400" className="scene-svg">
        <rect width="800" height="400" fill="#050810" />

        {/* Lab result card */}
        <g transform="translate(200, 40)">
          <rect x="0" y="0" width="400" height="300" rx="16" fill="rgba(13,17,29,0.95)" stroke="rgba(220,38,38,0.3)" strokeWidth="1.5" />

          {/* Header */}
          <rect x="0" y="0" width="400" height="50" rx="16" fill="rgba(220,38,38,0.08)" />
          <rect x="0" y="35" width="400" height="15" fill="rgba(220,38,38,0.08)" />
          <text x="200" y="32" textAnchor="middle" fontSize="14" fill="#f87171" fontFamily="Inter" fontWeight="700" letterSpacing="0.1em">BLOOD GROUP IDENTIFICATION</text>

          {/* Result display */}
          <g>
            {!reducedMotion && (
              <animate attributeName="opacity" from="0" to="1" dur="1.5s" fill="freeze" />
            )}
            <text x="200" y="130" textAnchor="middle" fontSize="72" fill="#dc2626" fontFamily="Syne" fontWeight="800" filter="url(#glow)">{selectedGroup}</text>
            <text x="200" y="160" textAnchor="middle" fontSize="12" fill="rgba(148,163,184,0.7)" fontFamily="Inter">ABO/Rh Classification Result</text>
          </g>

          {/* Test result details */}
          <g transform="translate(40, 180)">
            <rect x="0" y="0" width="140" height="40" rx="8" fill="rgba(220,38,38,0.08)" stroke="rgba(220,38,38,0.2)" strokeWidth="0.5" />
            <text x="70" y="16" textAnchor="middle" fontSize="9" fill="rgba(148,163,184,0.6)" fontFamily="Inter">Anti-A</text>
            <text x="70" y="32" textAnchor="middle" fontSize="14" fill={selectedGroup.startsWith('A') || selectedGroup.startsWith('AB') ? '#10b981' : '#64748b'} fontFamily="Inter" fontWeight="700">
              {selectedGroup.startsWith('A') || selectedGroup.startsWith('AB') ? '+ Positive' : '— Negative'}
            </text>
          </g>
          <g transform="translate(220, 180)">
            <rect x="0" y="0" width="140" height="40" rx="8" fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.2)" strokeWidth="0.5" />
            <text x="70" y="16" textAnchor="middle" fontSize="9" fill="rgba(148,163,184,0.6)" fontFamily="Inter">Anti-B</text>
            <text x="70" y="32" textAnchor="middle" fontSize="14" fill={selectedGroup.startsWith('B') || selectedGroup.startsWith('AB') ? '#10b981' : '#64748b'} fontFamily="Inter" fontWeight="700">
              {selectedGroup.startsWith('B') || selectedGroup.startsWith('AB') ? '+ Positive' : '— Negative'}
            </text>
          </g>
          <g transform="translate(130, 235)">
            <rect x="0" y="0" width="140" height="40" rx="8" fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.2)" strokeWidth="0.5" />
            <text x="70" y="16" textAnchor="middle" fontSize="9" fill="rgba(148,163,184,0.6)" fontFamily="Inter">Rh Factor</text>
            <text x="70" y="32" textAnchor="middle" fontSize="14" fill={selectedGroup.includes('+') ? '#10b981' : '#f59e0b'} fontFamily="Inter" fontWeight="700">
              {selectedGroup.includes('+') ? '+ Positive' : '— Negative'}
            </text>
          </g>
        </g>
      </svg>
      <div className="scene-caption">
        <h3>Blood Group: <span style={{ color: '#dc2626' }}>{selectedGroup}</span></h3>
        <p>The ABO and Rh classification identifies the blood group characteristics of the sample.</p>
        <p className="scene-disclaimer">Blood grouping alone does not establish full transfusion compatibility. Actual clinical decisions require appropriate crossmatch testing by authorized staff.</p>
      </div>
    </div>
  );
}

function Scene4Requirement({ reducedMotion }: { reducedMotion: boolean }) {
  const requestData = {
    component: 'Packed RBC',
    bloodType: 'O+',
    quantity: 2,
    neededBy: '3 hours',
    status: 'Pending',
    priority: 'Urgent',
    hospital: 'GRH Madurai',
  };

  return (
    <div className="scene-container">
      <svg viewBox="0 0 800 400" className="scene-svg">
        <rect width="800" height="400" fill="#050810" />

        {/* Request form */}
        <g transform="translate(150, 30)">
          {!reducedMotion && (
            <animate attributeName="opacity" from="0" to="1" dur="0.8s" fill="freeze" />
          )}
          <rect x="0" y="0" width="500" height="340" rx="16" fill="rgba(13,17,29,0.95)" stroke="rgba(245,158,11,0.3)" strokeWidth="1.5" />

          {/* Header */}
          <rect x="0" y="0" width="500" height="50" rx="16" fill="rgba(245,158,11,0.06)" />
          <rect x="0" y="35" width="500" height="15" fill="rgba(245,158,11,0.06)" />
          <circle cx="30" cy="25" r="10" fill="rgba(245,158,11,0.15)" />
          <text x="30" y="29" textAnchor="middle" fontSize="12" fill="#f59e0b">📋</text>
          <text x="55" y="30" fontSize="13" fill="#f59e0b" fontFamily="Inter" fontWeight="700" letterSpacing="0.05em">BLOOD COMPONENT REQUEST</text>

          {/* Priority badge */}
          <rect x="380" y="12" width="90" height="26" rx="13" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.4)" strokeWidth="0.5" />
          <text x="425" y="29" textAnchor="middle" fontSize="10" fill="#f59e0b" fontFamily="Inter" fontWeight="700">{requestData.priority}</text>

          {/* Fields */}
          {[
            { label: 'Requesting Hospital', value: requestData.hospital, y: 70 },
            { label: 'Component Required', value: requestData.component, y: 110 },
            { label: 'Blood Group', value: requestData.bloodType, y: 150 },
            { label: 'Quantity Required', value: `${requestData.quantity} units`, y: 190 },
            { label: 'Needed Within', value: requestData.neededBy, y: 230 },
            { label: 'Request Status', value: requestData.status, y: 270 },
          ].map((field, i) => (
            <g key={i}>
              {!reducedMotion && (
                <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin={`${0.3 + i * 0.15}s`} fill="freeze" />
              )}
              <text x="30" y={field.y} fontSize="10" fill="rgba(148,163,184,0.6)" fontFamily="Inter" fontWeight="600">{field.label}</text>
              <text x="30" y={field.y + 18} fontSize="15" fill="#f1f5f9" fontFamily="Inter" fontWeight="600">{field.value}</text>
              <line x1="30" y1={field.y + 28} x2="470" y2={field.y + 28} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            </g>
          ))}
        </g>
      </svg>
      <div className="scene-caption">
        <h3>Blood Requirement Generated</h3>
        <p>The hospital generates a simulated blood component request specifying type, quantity, and urgency.</p>
        <p className="scene-disclaimer">All displayed data is entirely fictional and for demonstration only.</p>
      </div>
    </div>
  );
}

function Scene5Network({ reducedMotion }: { reducedMotion: boolean }) {
  const banks = [
    { id: 'BB1', name: 'Ramanathapuram GH', x: 400, y: 80, units: 12, expiring: 3 },
    { id: 'BB2', name: 'IRT-PM Paramakudi', x: 200, y: 180, units: 8, expiring: 1 },
    { id: 'BB3', name: 'Rameswaram Centre', x: 600, y: 180, units: 5, expiring: 2 },
    { id: 'BB4', name: 'Kamuthi Hospital', x: 150, y: 320, units: 15, expiring: 0 },
    { id: 'BB5', name: 'GRH Madurai', x: 650, y: 320, units: 22, expiring: 4 },
  ];

  const edges = [
    { from: 0, to: 1 }, { from: 0, to: 2 }, { from: 1, to: 3 },
    { from: 2, to: 4 }, { from: 1, to: 2 }, { from: 3, to: 4 },
  ];

  return (
    <div className="scene-container">
      <svg viewBox="0 0 800 400" className="scene-svg">
        <rect width="800" height="400" fill="#050810" />

        {/* Connection edges */}
        {edges.map((e, i) => (
          <line key={i} x1={banks[e.from].x} y1={banks[e.from].y} x2={banks[e.to].x} y2={banks[e.to].y}
            stroke="rgba(220,38,38,0.15)" strokeWidth="1.5" strokeDasharray="6 4">
            {!reducedMotion && (
              <animate attributeName="stroke-dashoffset" from="20" to="0" dur="2s" repeatCount="indefinite" />
            )}
          </line>
        ))}

        {/* Request pulse traveling */}
        {!reducedMotion && edges.slice(0, 3).map((e, i) => (
          <circle key={`pulse-${i}`} r="3" fill="#dc2626" filter="url(#glow)">
            <animateMotion dur={`${2 + i * 0.5}s`} repeatCount="indefinite"
              path={`M${banks[e.from].x},${banks[e.from].y} L${banks[e.to].x},${banks[e.to].y}`} />
          </circle>
        ))}

        {/* Bank nodes */}
        {banks.map((bank, i) => (
          <g key={bank.id}>
            {!reducedMotion && (
              <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin={`${i * 0.2}s`} fill="freeze" />
            )}
            <circle cx={bank.x} cy={bank.y} r="32" fill="rgba(13,17,29,0.95)" stroke="rgba(220,38,38,0.4)" strokeWidth="1.5" />
            <text x={bank.x} y={bank.y - 5} textAnchor="middle" fontSize="10" fill="#f87171" fontFamily="Inter" fontWeight="700">{bank.id}</text>
            <text x={bank.x} y={bank.y + 8} textAnchor="middle" fontSize="8" fill="rgba(148,163,184,0.7)" fontFamily="Inter">{bank.units} units</text>
            <text x={bank.x} y={bank.y + 18} textAnchor="middle" fontSize="7" fill={bank.expiring > 0 ? '#f59e0b' : '#10b981'} fontFamily="Inter">
              {bank.expiring > 0 ? `${bank.expiring} expiring` : 'stable'}
            </text>

            {/* Bank label below */}
            <text x={bank.x} y={bank.y + 48} textAnchor="middle" fontSize="8" fill="rgba(148,163,184,0.5)" fontFamily="Inter">{bank.name}</text>
          </g>
        ))}
      </svg>
      <div className="scene-caption">
        <h3>Blood Bank Inventory Network</h3>
        <p>The system evaluates candidate blood banks, checking inventory availability, expiry status, and estimated transport time.</p>
      </div>
    </div>
  );
}

function Scene6Redistribution({ reducedMotion }: { reducedMotion: boolean }) {
  const candidateA = {
    name: 'Ramanathapuram GH → GRH Madurai',
    remaining: 420,
    transport: 180,
    processing: 45,
    safety: 30,
    required: 255,
    usable: 165,
    feasible: true,
  };
  const candidateB = {
    name: 'Kamuthi Hospital → GRH Madurai',
    remaining: 180,
    transport: 210,
    processing: 45,
    safety: 30,
    required: 285,
    usable: -105,
    feasible: false,
  };

  return (
    <div className="scene-container">
      <svg viewBox="0 0 800 400" className="scene-svg">
        <rect width="800" height="400" fill="#050810" />

        {/* Candidate A - Feasible */}
        <g>
          {!reducedMotion && <animate attributeName="opacity" from="0" to="1" dur="0.6s" fill="freeze" />}
          <rect x="30" y="20" width="360" height="340" rx="14" fill="rgba(13,17,29,0.95)" stroke="rgba(16,185,129,0.4)" strokeWidth="1.5" />
          <rect x="30" y="20" width="360" height="40" rx="14" fill="rgba(16,185,129,0.06)" />
          <rect x="30" y="46" width="360" height="14" fill="rgba(16,185,129,0.06)" />

          <text x="50" y="46" fontSize="11" fill="#10b981" fontFamily="Inter" fontWeight="700">✓ CANDIDATE A — FEASIBLE</text>
          <text x="50" y="78" fontSize="9" fill="rgba(148,163,184,0.7)" fontFamily="Inter">{candidateA.name}</text>

          {/* Timeline bars */}
          {[
            { label: 'Remaining Time', val: candidateA.remaining, max: 420, color: '#10b981', y: 100 },
            { label: 'Transport Duration', val: candidateA.transport, max: 420, color: '#3b82f6', y: 140 },
            { label: 'Receiving & Processing', val: candidateA.processing, max: 420, color: '#f59e0b', y: 180 },
            { label: 'Safety Margin', val: candidateA.safety, max: 420, color: '#8b5cf6', y: 220 },
          ].map((bar, i) => (
            <g key={i}>
              <text x="50" y={bar.y} fontSize="9" fill="rgba(148,163,184,0.6)" fontFamily="Inter">{bar.label}</text>
              <rect x="50" y={bar.y + 6} width="300" height="14" rx="4" fill="rgba(255,255,255,0.04)" />
              <rect x="50" y={bar.y + 6} width={300 * (bar.val / bar.max)} height="14" rx="4" fill={bar.color} opacity="0.6">
                {!reducedMotion && <animate attributeName="width" from="0" to={300 * (bar.val / bar.max)} dur="1s" begin={`${i * 0.2}s`} fill="freeze" />}
              </rect>
              <text x="355" y={bar.y + 16} textAnchor="end" fontSize="9" fill="rgba(241,245,249,0.8)" fontFamily="JetBrains Mono">{bar.val} min</text>
            </g>
          ))}

          {/* Formula */}
          <text x="50" y="270" fontSize="8" fill="rgba(148,163,184,0.5)" fontFamily="JetBrains Mono">usableTime = remaining - (transport + processing + safety)</text>
          <text x="50" y="290" fontSize="14" fill="#10b981" fontFamily="Syne" fontWeight="800">= {candidateA.usable} min</text>
          <rect x="50" y="310" width="300" height="30" rx="8" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.3)" strokeWidth="0.5" />
          <text x="200" y="330" textAnchor="middle" fontSize="11" fill="#10b981" fontFamily="Inter" fontWeight="600">✓ Time-feasible for redistribution</text>
        </g>

        {/* Candidate B - Infeasible */}
        <g>
          {!reducedMotion && <animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="0.4s" fill="freeze" />}
          <rect x="410" y="20" width="360" height="340" rx="14" fill="rgba(13,17,29,0.95)" stroke="rgba(220,38,38,0.4)" strokeWidth="1.5" />
          <rect x="410" y="20" width="360" height="40" rx="14" fill="rgba(220,38,38,0.06)" />
          <rect x="410" y="46" width="360" height="14" fill="rgba(220,38,38,0.06)" />

          <text x="430" y="46" fontSize="11" fill="#dc2626" fontFamily="Inter" fontWeight="700">✗ CANDIDATE B — INFEASIBLE</text>
          <text x="430" y="78" fontSize="9" fill="rgba(148,163,184,0.7)" fontFamily="Inter">{candidateB.name}</text>

          {[
            { label: 'Remaining Time', val: candidateB.remaining, max: 420, color: '#dc2626', y: 100 },
            { label: 'Transport Duration', val: candidateB.transport, max: 420, color: '#3b82f6', y: 140 },
            { label: 'Receiving & Processing', val: candidateB.processing, max: 420, color: '#f59e0b', y: 180 },
            { label: 'Safety Margin', val: candidateB.safety, max: 420, color: '#8b5cf6', y: 220 },
          ].map((bar, i) => (
            <g key={i}>
              <text x="430" y={bar.y} fontSize="9" fill="rgba(148,163,184,0.6)" fontFamily="Inter">{bar.label}</text>
              <rect x="430" y={bar.y + 6} width="300" height="14" rx="4" fill="rgba(255,255,255,0.04)" />
              <rect x="430" y={bar.y + 6} width={300 * (bar.val / 420)} height="14" rx="4" fill={bar.color} opacity="0.6">
                {!reducedMotion && <animate attributeName="width" from="0" to={300 * (bar.val / 420)} dur="1s" begin={`${0.4 + i * 0.2}s`} fill="freeze" />}
              </rect>
              <text x="735" y={bar.y + 16} textAnchor="end" fontSize="9" fill="rgba(241,245,249,0.8)" fontFamily="JetBrains Mono">{bar.val} min</text>
            </g>
          ))}

          <text x="430" y="270" fontSize="8" fill="rgba(148,163,184,0.5)" fontFamily="JetBrains Mono">usableTime = remaining - (transport + processing + safety)</text>
          <text x="430" y="290" fontSize="14" fill="#dc2626" fontFamily="Syne" fontWeight="800">= {candidateB.usable} min</text>
          <rect x="430" y="310" width="300" height="30" rx="8" fill="rgba(220,38,38,0.1)" stroke="rgba(220,38,38,0.3)" strokeWidth="0.5" />
          <text x="580" y="330" textAnchor="middle" fontSize="11" fill="#dc2626" fontFamily="Inter" fontWeight="600">✗ Would expire before arrival</text>
        </g>
      </svg>
      <div className="scene-caption">
        <h3>Time-Aware Feasibility Evaluation</h3>
        <p>The planner calculates <code>usableTimeAfterTransfer = remainingTime − requiredTime</code>. A candidate is feasible only when usable time &gt; 0 and operational checks pass.</p>
      </div>
    </div>
  );
}

function Scene7Drone({ reducedMotion }: { reducedMotion: boolean }) {
  const waypoints = [
    { x: 120, y: 300, label: 'Ramanathapuram GH' },
    { x: 250, y: 220, label: 'Waypoint A' },
    { x: 400, y: 180, label: 'Waypoint B' },
    { x: 550, y: 240, label: 'Waypoint C' },
    { x: 680, y: 300, label: 'GRH Madurai' },
  ];

  const pathD = waypoints.map((wp, i) => `${i === 0 ? 'M' : 'L'}${wp.x},${wp.y}`).join(' ');

  return (
    <div className="scene-container">
      <svg viewBox="0 0 800 400" className="scene-svg">
        <defs>
          <linearGradient id="droneSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#050810" />
            <stop offset="100%" stopColor="#0d111d" />
          </linearGradient>
        </defs>

        <rect width="800" height="400" fill="url(#droneSky)" />

        {/* Grid background */}
        {[...Array(20)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 20} x2="800" y2={i * 20} stroke="rgba(255,255,255,0.02)" />
        ))}
        {[...Array(40)].map((_, i) => (
          <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="400" stroke="rgba(255,255,255,0.02)" />
        ))}

        {/* Route path */}
        <path d={pathD} fill="none" stroke="rgba(220,38,38,0.3)" strokeWidth="2" strokeDasharray="8 4">
          {!reducedMotion && (
            <animate attributeName="stroke-dashoffset" from="200" to="0" dur="3s" repeatCount="indefinite" />
          )}
        </path>

        {/* Waypoint nodes */}
        {waypoints.map((wp, i) => (
          <g key={i}>
            <circle cx={wp.x} cy={wp.y} r={i === 0 || i === waypoints.length - 1 ? 16 : 10}
              fill={i === 0 ? 'rgba(16,185,129,0.15)' : i === waypoints.length - 1 ? 'rgba(220,38,38,0.15)' : 'rgba(59,130,246,0.1)'}
              stroke={i === 0 ? 'rgba(16,185,129,0.5)' : i === waypoints.length - 1 ? 'rgba(220,38,38,0.5)' : 'rgba(59,130,246,0.3)'}
              strokeWidth="1.5" />
            <text x={wp.x} y={wp.y + 4} textAnchor="middle" fontSize={i === 0 || i === waypoints.length - 1 ? '8' : '7'} fill="rgba(241,245,249,0.8)" fontFamily="Inter" fontWeight="600">
              {i === 0 ? 'SRC' : i === waypoints.length - 1 ? 'DST' : `W${i}`}
            </text>
            <text x={wp.x} y={wp.y + (i === 0 || i === waypoints.length - 1 ? 32 : 26)} textAnchor="middle" fontSize="7" fill="rgba(148,163,184,0.5)" fontFamily="Inter">{wp.label}</text>
          </g>
        ))}

        {/* Drone */}
        {!reducedMotion ? (
          <g>
            <animateMotion dur="5s" repeatCount="indefinite" path={pathD} rotate="auto" />
            <polygon points="-8,0 0,-6 8,0 0,6" fill="#dc2626" filter="url(#glow)" />
            <circle r="2" fill="white" />
          </g>
        ) : (
          <g transform={`translate(${waypoints[2].x}, ${waypoints[2].y - 15})`}>
            <polygon points="-8,0 0,-6 8,0 0,6" fill="#dc2626" filter="url(#glow)" />
            <circle r="2" fill="white" />
          </g>
        )}

        {/* Flight info panel */}
        <g transform="translate(30, 20)">
          <rect x="0" y="0" width="200" height="130" rx="10" fill="rgba(13,17,29,0.9)" stroke="rgba(220,38,38,0.2)" strokeWidth="1" />
          <text x="15" y="22" fontSize="9" fill="#f87171" fontFamily="Inter" fontWeight="700" letterSpacing="0.05em">DRONE FLIGHT TELEMETRY</text>
          <line x1="15" y1="30" x2="185" y2="30" stroke="rgba(255,255,255,0.06)" />
          {[
            { label: 'Route', value: 'Dijkstra — Shortest Path' },
            { label: 'Distance', value: '35 km (4 waypoints)' },
            { label: 'Est. Flight Time', value: '35 min @ 60 km/h' },
            { label: 'Battery', value: '100% (reserve: 20%)' },
            { label: 'Arrival ETA', value: '09:35 IST' },
          ].map((item, i) => (
            <g key={i}>
              <text x="15" y={46 + i * 18} fontSize="8" fill="rgba(148,163,184,0.5)" fontFamily="Inter">{item.label}</text>
              <text x="185" y={46 + i * 18} textAnchor="end" fontSize="8" fill="rgba(241,245,249,0.8)" fontFamily="JetBrains Mono">{item.value}</text>
            </g>
          ))}
        </g>
      </svg>
      <div className="scene-caption">
        <h3>Drone Route Simulation</h3>
        <p>The system uses Dijkstra's algorithm to compute the shortest weighted route across the blood bank corridor graph.</p>
        <p className="scene-disclaimer">This is a software simulation, not an actual medical delivery system.</p>
      </div>
    </div>
  );
}

// ─── Main Homepage Component ─────────────────────────────────────────────────

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion ?? false;

  const [animState, setAnimState] = useState<'idle' | 'playing' | 'paused' | 'completed'>('idle');
  const [currentScene, setCurrentScene] = useState(0);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('O+');
  const [showStory, setShowStory] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const advanceScene = useCallback(() => {
    setCurrentScene((prev) => {
      if (prev >= SCENES.length - 1) {
        setAnimState('completed');
        setHasPlayed(true);
        return prev;
      }
      return prev + 1;
    });
  }, []);

  // Auto-advance scenes
  useEffect(() => {
    if (animState !== 'playing') return;
    clearTimer();
    const duration = SCENES[currentScene]?.duration || 5000;
    timerRef.current = setTimeout(advanceScene, reducedMotion ? 1500 : duration);
    return clearTimer;
  }, [animState, currentScene, advanceScene, clearTimer, reducedMotion]);

  const handlePlay = () => {
    if (animState === 'completed') {
      setCurrentScene(0);
    }
    setShowStory(true);
    setAnimState('playing');
  };

  const handlePause = () => {
    clearTimer();
    setAnimState('paused');
  };

  const handleReplay = () => {
    clearTimer();
    setCurrentScene(0);
    setAnimState('playing');
  };

  const handleSkip = () => {
    clearTimer();
    setAnimState('completed');
    setHasPlayed(true);
    setShowStory(false);
  };

  const renderScene = () => {
    switch (currentScene) {
      case 0: return <Scene1Emergency reducedMotion={reducedMotion} />;
      case 1: return <Scene2Collection reducedMotion={reducedMotion} />;
      case 2: return <Scene3BloodGroup reducedMotion={reducedMotion} selectedGroup={selectedBloodGroup} />;
      case 3: return <Scene4Requirement reducedMotion={reducedMotion} />;
      case 4: return <Scene5Network reducedMotion={reducedMotion} />;
      case 5: return <Scene6Redistribution reducedMotion={reducedMotion} />;
      case 6: return <Scene7Drone reducedMotion={reducedMotion} />;
      default: return null;
    }
  };

  return (
    <div className="homepage">
      {/* ─── Hero Section ──────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-bg-effects">
          <div className="hero-grid" />
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
        </div>

        <motion.div className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.8 }}
        >
          {/* Brand */}
          <div className="hero-brand">
            <div className="hero-brand-icon">
              <Droplets size={24} />
            </div>
            <div className="hero-brand-text">
              <span className="hero-brand-name">Blood-Line Navigator</span>
              <span className="hero-brand-sub">Emergency Hematology Logistics</span>
            </div>
          </div>

          <h1 className="hero-headline">
            Every Minute Matters.<br />
            <span className="hero-headline-accent">Every Unit Counts.</span>
          </h1>

          <p className="hero-description">
            Blood Navigator helps participating blood banks monitor expiry risk, evaluate
            time-feasible redistribution opportunities, and simulate delivery routes to
            support better inventory coordination.
          </p>

          <div className="hero-actions">
            <button className="hero-btn hero-btn-primary" onClick={handlePlay}>
              <Play size={18} />
              {hasPlayed ? 'Replay Story' : 'Watch the Story'}
            </button>
            <Link href="/dashboard" className="hero-btn hero-btn-secondary">
              <Activity size={18} />
              View Live Dashboard
            </Link>
          </div>

          <div className="hero-scroll-hint">
            <span>Scroll to explore</span>
            <ChevronDown size={16} />
          </div>
        </motion.div>
      </section>

      {/* ─── Animated Story Overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {showStory && animState !== 'completed' && (
          <motion.div className="story-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Scene progress */}
            <div className="story-progress">
              {SCENES.map((scene, i) => (
                <div key={scene.id} className={`story-progress-dot ${i === currentScene ? 'active' : ''} ${i < currentScene ? 'done' : ''}`}>
                  <span className="story-progress-label">{scene.title}</span>
                </div>
              ))}
            </div>

            {/* Scene content */}
            <div className="story-scene-wrapper">
              <AnimatePresence mode="wait">
                <motion.div key={currentScene}
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: reducedMotion ? 0.05 : 0.5 }}
                  className="story-scene"
                >
                  {/* Scene number */}
                  <div className="story-scene-number">
                    Scene {currentScene + 1} <span>of {SCENES.length}</span>
                  </div>

                  {/* Blood group selector for scene 3 */}
                  {currentScene === 2 && (
                    <div className="blood-group-selector">
                      {BLOOD_GROUPS.map((bg) => (
                        <button key={bg}
                          className={`bg-select-btn ${selectedBloodGroup === bg ? 'active' : ''}`}
                          onClick={() => setSelectedBloodGroup(bg)}
                        >{bg}</button>
                      ))}
                    </div>
                  )}

                  {renderScene()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="story-controls">
              {animState === 'playing' ? (
                <button className="story-ctrl-btn" onClick={handlePause} title="Pause"><Pause size={18} /></button>
              ) : (
                <button className="story-ctrl-btn" onClick={handlePlay} title="Play"><Play size={18} /></button>
              )}
              <button className="story-ctrl-btn" onClick={handleReplay} title="Replay"><RotateCcw size={18} /></button>
              <button className="story-ctrl-btn" onClick={handleSkip} title="Skip to application">
                <SkipForward size={18} />
                <span>Skip</span>
              </button>
              <Link href="/dashboard" className="story-ctrl-btn story-ctrl-continue">
                <ArrowRight size={18} />
                <span>Continue to Dashboard</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Problem & Solution Section ────────────────────────────────────── */}
      <section className="home-section">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.6 }}
        >
          <div className="section-tag-home"><Activity size={14} /> The Problem</div>
          <h2 className="section-title">Blood Has a Shelf Life</h2>
          <p className="section-text">
            Blood components have strict expiry windows — platelets last 5 days, packed red blood cells last 35–42 days.
            When inventory sits unused at one location while another location has unmet demand, units may expire and go to waste.
            Manual coordination between blood banks is slow and error-prone, especially under time pressure.
          </p>

          <div className="problem-solution-grid">
            <div className="ps-card">
              <div className="ps-icon" style={{ background: 'rgba(220,38,38,0.1)', color: '#f87171' }}><Timer size={24} /></div>
              <h3>Expiry Risk</h3>
              <p>Units approaching expiry need timely redistribution before they become unusable.</p>
            </div>
            <div className="ps-card">
              <div className="ps-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}><Network size={24} /></div>
              <h3>Distributed Inventory</h3>
              <p>Multiple blood banks hold different stock levels with no automatic visibility across the network.</p>
            </div>
            <div className="ps-card">
              <div className="ps-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}><Plane size={24} /></div>
              <h3>Transport Constraints</h3>
              <p>Every transfer consumes time — transport, receiving, processing, and safety margins must all fit within the remaining shelf life.</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── How Blood Navigator Works ─────────────────────────────────────── */}
      <section className="home-section">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.6 }}
        >
          <div className="section-tag-home"><Shield size={14} /> Solution</div>
          <h2 className="section-title">How Blood Navigator Works</h2>
          <p className="section-text">
            Blood Navigator is a time-aware inventory management and redistribution simulation system
            that coordinates participating blood banks through a unified workflow.
          </p>

          <div className="workflow-steps">
            {[
              { step: 1, title: 'Monitor Expiry', desc: 'Continuously track blood component shelf life across all participating banks.', icon: Clock },
              { step: 2, title: 'Identify Requirements', desc: 'Match incoming blood requests against available inventory and expiry status.', icon: ClipboardList },
              { step: 3, title: 'Evaluate Feasibility', desc: 'Calculate whether redistribution is time-feasible: remainingTime − requiredTime > 0.', icon: Timer },
              { step: 4, title: 'Calculate Route', desc: 'Use graph algorithms (BFS, DFS, Dijkstra) to find the shortest delivery route.', icon: Network },
              { step: 5, title: 'Recalculate on Delay', desc: 'If transport conditions change, re-evaluate feasibility and update arrival estimates.', icon: RotateCcw },
              { step: 6, title: 'Track Transfer', desc: 'Monitor the proposed transfer through dispatch, transit, arrival, and receipt stages.', icon: ArrowLeftRight },
            ].map((item, i) => (
              <motion.div key={item.step} className="workflow-step"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: reducedMotion ? 0 : i * 0.1, duration: reducedMotion ? 0.01 : 0.4 }}
              >
                <div className="workflow-step-num">{item.step}</div>
                <div className="workflow-step-content">
                  <div className="workflow-step-icon"><item.icon size={18} /></div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── Features Section ──────────────────────────────────────────────── */}
      <section className="home-section">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.6 }}
        >
          <div className="section-tag-home"><Layers size={14} /> Features</div>
          <h2 className="section-title">System Capabilities</h2>

          <div className="features-grid">
            {[
              { icon: Database, title: 'Multi-Bank Inventory', desc: 'Manage blood component stock across participating blood banks with real-time expiry tracking.' },
              { icon: Timer, title: 'Expiry Monitoring', desc: 'Track remaining shelf life with warning and critical thresholds for each unit.' },
              { icon: FlaskConical, title: 'Feasibility Engine', desc: 'Compute time-feasible redistribution with transport, processing, and safety margins.' },
              { icon: Plane, title: 'Drone Route Simulation', desc: 'Simulate delivery routes using BFS, DFS, and Dijkstra across a corridor graph.' },
              { icon: ArrowLeftRight, title: 'Transfer Tracking', desc: 'End-to-end transfer pipeline from proposal to receipt with status monitoring.' },
              { icon: Cpu, title: 'DSA-Powered Engine', desc: '11 data structures and algorithms from custom implementations integrated into real workflows.' },
            ].map((feat, i) => (
              <motion.div key={i} className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: reducedMotion ? 0 : i * 0.08, duration: reducedMotion ? 0.01 : 0.4 }}
              >
                <div className="feature-icon"><feat.icon size={22} /></div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── DSA Behind the System ─────────────────────────────────────────── */}
      <section className="home-section">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.6 }}
        >
          <div className="section-tag-home"><Cpu size={14} /> DSA Integration</div>
          <h2 className="section-title">DSA Behind the System</h2>
          <p className="section-text">
            Each data structure and algorithm below is implemented from scratch and integrated into the
            actual Blood Navigator workflows — not as standalone demonstrations, but as the functional
            engine powering the application.
          </p>

          <div className="dsa-grid">
            {DSA_FEATURES.map((dsa, i) => (
              <motion.div key={i} className="dsa-card"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: reducedMotion ? 0 : i * 0.05, duration: reducedMotion ? 0.01 : 0.3 }}
              >
                <div className="dsa-card-icon" style={{ background: `${dsa.color}15`, color: dsa.color }}>
                  <dsa.icon size={18} />
                </div>
                <div className="dsa-card-content">
                  <h4>{dsa.name}</h4>
                  <p>{dsa.usage}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── CTA Section ───────────────────────────────────────────────────── */}
      <section className="home-section cta-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reducedMotion ? 0.01 : 0.6 }}
          className="cta-content"
        >
          <div className="cta-brand-icon"><Droplets size={32} /></div>
          <h2>Explore Blood Navigator</h2>
          <p>Enter the live dashboard to interact with the full inventory management, redistribution planning, and drone simulation system.</p>
          <div className="cta-actions">
            <Link href="/dashboard" className="hero-btn hero-btn-primary">
              <Activity size={18} />
              Explore the System
            </Link>
            <button className="hero-btn hero-btn-secondary" onClick={handlePlay}>
              <Play size={18} />
              {hasPlayed ? 'Replay Story' : 'Watch the Story'}
            </button>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Droplets size={16} />
            <span>Blood-Line Navigator</span>
          </div>
          <div className="footer-info">
            <p>Data Structures &amp; Algorithms — Internal Assessment Project</p>
            <p>SET-2 · Autonomous Hematology Logistics Engine</p>
          </div>
          <div className="footer-disclaimer">
            <p><strong>Simulation Disclaimer:</strong> Blood Navigator is an educational software simulation.
            It does not connect to real blood banks, make clinical decisions, or operate actual delivery systems.
            All data shown is fictional and for demonstration purposes only. Actual transfusion decisions
            require appropriate clinical testing and authorized medical staff.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

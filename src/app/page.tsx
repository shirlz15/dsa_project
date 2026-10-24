'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import {
  Droplets, Play, Pause, RotateCcw, SkipForward, ArrowRight,
  Activity, Truck, Heart, FlaskConical, TestTube, ClipboardList,
  Network, Timer, Plane, ChevronDown, Layers, Search, BarChart3,
  GitBranch, Hash, Database, ArrowLeftRight, Cpu, Shield, Clock,
  AlertTriangle, CheckCircle, Navigation, Wind, CheckCircle2, ChevronRight,
  ExternalLink, Info, MapPin, Sparkles, RefreshCw
} from 'lucide-react';

// ─── Scene Metadata ──────────────────────────────────────────────────────────

const SCENES = [
  { id: 1, title: 'Emergency Response', duration: 7000, desc: 'Ambulance dispatched, patient attended respectfully on roadside, transitioned to Madurai GRH trauma bay.' },
  { id: 2, title: 'Blood Collection', duration: 6000, desc: 'Clinical specialist collects blood specimen; labelled vacutainer tube glides along automated track to centrifuge analyzer.' },
  { id: 3, title: 'Blood Group ID', duration: 6000, desc: 'Simulated agglutination test reveals ABO/Rh typing with clinical cross-match distinction notice.' },
  { id: 4, title: 'Blood Request', duration: 6000, desc: 'Hospital requisition ticket generated: component, quantity, and 90-minute critical transfusion window.' },
  { id: 5, title: 'Inventory Network', duration: 6500, desc: 'Multi-node regional blood bank corridor evaluated with stock counts and near-expiry timestamps.' },
  { id: 6, title: 'Time-Aware Feasibility', duration: 7000, desc: 'Time-budget comparison matrix: remaining shelf life evaluated against transit, processing, and safety margins.' },
  { id: 7, title: 'Drone Simulation & Delay', duration: 8000, desc: 'Autonomous drone flight along Dijkstra shortest path with en-route weather delay recalculation.' },
];

const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+'] as const;

const DSA_ITEMS = [
  {
    icon: Layers,
    name: 'Stack (LIFO)',
    tag: 'Reversible Mutations',
    usage: 'Embedded into inventory edit history — every stock change is pushed onto an undo stack and popped to roll back mutations.',
    color: '#ef4444'
  },
  {
    icon: ArrowRight,
    name: 'Queue (FIFO)',
    tag: 'Request Backlog',
    usage: 'Incoming hospital requisitions are enqueued and dispatched in strict chronological order to eliminate triage ambiguity.',
    color: '#3b82f6'
  },
  {
    icon: RotateCcw,
    name: 'Circular Queue',
    tag: 'Telemetry Ring Buffer',
    usage: 'A fixed-capacity circular buffer continuously logs drone GPS coordinates, airspeed, and payload temperatures without memory overflow.',
    color: '#06b6d4'
  },
  {
    icon: GitBranch,
    name: 'Singly Linked List',
    tag: 'Dynamic Inventory',
    usage: 'Maintains live chains of blood unit batches per facility, supporting dynamic insertions and removals during redistribution.',
    color: '#10b981'
  },
  {
    icon: Hash,
    name: 'Hash Table',
    tag: 'O(1) Unit Lookup',
    usage: 'Chained hash buckets map unique donor barcodes and facility identifiers for constant-time status and stock verification.',
    color: '#ec4899'
  },
  {
    icon: RefreshCw,
    name: 'Circular Linked List',
    tag: 'Audit Review Cycle',
    usage: 'A continuous closed-loop scheduler cycles through participating blood banks to guarantee every facility is audited periodically.',
    color: '#f59e0b'
  },
  {
    icon: ArrowLeftRight,
    name: 'Deque (Double-Ended)',
    tag: 'Priority Worklist',
    usage: 'Critical emergency transfusions are pushed directly to the front (head) while routine inventory rebalancing queues at the rear.',
    color: '#8b5cf6'
  },
  {
    icon: Search,
    name: 'Searching & Sorting',
    tag: 'Binary Search & Merge Sort',
    usage: 'Binary and interpolation search locate near-expiry units; Merge and Insertion sort rank candidate donor banks by net urgency score.',
    color: '#14b8a6'
  },
  {
    icon: Network,
    name: 'Graph BFS / DFS & Dijkstra',
    tag: 'Shortest Path Corridor',
    usage: 'Corridor waypoints are modeled as a weighted graph; Dijkstra computes the minimum-time drone delivery trajectory.',
    color: '#dc2626'
  },
];

// ─── Scene 1: Emergency Response ─────────────────────────────────────────────

function Scene1Emergency({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="scene-viewport">
      <svg viewBox="0 0 880 440" className="scene-svg">
        <defs>
          <linearGradient id="s1Sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#04060d" />
            <stop offset="60%" stopColor="#0b101d" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <linearGradient id="s1Road" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0a0f1d" />
          </linearGradient>
          <filter id="s1Glow">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width="880" height="440" fill="url(#s1Sky)" />

        {/* Stars */}
        {[...Array(24)].map((_, i) => (
          <circle key={i} cx={25 + i * 36} cy={15 + (i % 6) * 22} r={i % 4 === 0 ? 1.5 : 0.8} fill="#94a3b8" opacity="0.4">
            {!reducedMotion && <animate attributeName="opacity" values="0.2;0.8;0.2" dur={`${2 + (i % 3)}s`} repeatCount="indefinite" />}
          </circle>
        ))}

        {/* City skyline silhouettes */}
        <rect x="30" y="190" width="45" height="130" rx="3" fill="#0c1322" />
        <rect x="90" y="160" width="60" height="160" rx="3" fill="#0f172a" />
        <rect x="165" y="210" width="40" height="110" rx="3" fill="#0c1322" />
        <rect x="220" y="180" width="50" height="140" rx="3" fill="#131d31" />

        {/* Roadway */}
        <rect x="0" y="310" width="880" height="130" fill="url(#s1Road)" />
        <line x1="0" y1="310" x2="880" y2="310" stroke="#334155" strokeWidth="2" />
        {[...Array(14)].map((_, i) => (
          <rect key={i} x={15 + i * 65} y="365" width="35" height="3" rx="1.5" fill="rgba(255,255,255,0.2)">
            {!reducedMotion && (
              <animate attributeName="x" from={15 + i * 65} to={-50 + i * 65} dur="2s" repeatCount="indefinite" />
            )}
          </rect>
        ))}

        {/* Emergency First Aid roadside scene */}
        <g transform="translate(180, 240)">
          <rect x="-10" y="20" width="160" height="60" rx="8" fill="rgba(15,23,42,0.85)" stroke="rgba(220,38,38,0.4)" strokeWidth="1" />
          <text x="70" y="35" textAnchor="middle" fontSize="9" fill="#f87171" fontFamily="Inter" fontWeight="700">EMERGENCY FIRST AID SCENE</text>

          {/* Stretcher bed with patient */}
          <rect x="15" y="55" width="60" height="10" rx="3" fill="#334155" />
          <rect x="18" y="50" width="54" height="6" rx="2" fill="#e2e8f0" />
          <circle cx="24" cy="48" r="4" fill="#cbd5e1" />

          {/* Paramedics attending */}
          <circle cx="48" cy="38" r="6" fill="#f87171" />
          <rect x="42" y="45" width="12" height="18" rx="3" fill="#dc2626" />
          <rect x="44" y="50" width="8" height="4" fill="#ffffff" opacity="0.8" />

          <circle cx="85" cy="40" r="6" fill="#60a5fa" />
          <rect x="79" y="47" width="12" height="18" rx="3" fill="#2563eb" />
          <rect x="94" y="54" width="8" height="8" rx="2" fill="#ef4444" />
          <text x="98" y="60" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold">+</text>

          <line x1="12" y1="30" x2="12" y2="65" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx="12" cy="28" r="3" fill="#38bdf8" />
        </g>

        {/* Moving Ambulance */}
        <g>
          {!reducedMotion ? (
            <animateTransform
              attributeName="transform"
              type="translate"
              from="-180, 0"
              to="360, 0"
              dur="6.5s"
              fill="freeze"
            />
          ) : (
            <animateTransform attributeName="transform" type="translate" to="260, 0" dur="0.01s" fill="freeze" />
          )}

          {/* Headlights */}
          <polygon points="265,335 370,300 370,370" fill="rgba(254,240,138,0.12)" />

          {/* Ambulance Body */}
          <rect x="120" y="295" width="115" height="44" rx="6" fill="#f8fafc" />
          <rect x="120" y="315" width="115" height="10" fill="#dc2626" />
          <rect x="162" y="303" width="20" height="5" rx="1.5" fill="#dc2626" />
          <rect x="169.5" y="295.5" width="5" height="20" rx="1.5" fill="#dc2626" />

          <path d="M 235 305 L 255 315 L 255 339 L 235 339 Z" fill="#e2e8f0" />
          <polygon points="236,308 250,317 236,317" fill="rgba(59,130,246,0.5)" />

          {/* Beacons */}
          <circle cx="155" cy="290" r="5" fill="#ef4444" filter="url(#s1Glow)">
            {!reducedMotion && <animate attributeName="opacity" values="0.4;1;0.4" dur="0.5s" repeatCount="indefinite" />}
          </circle>
          <circle cx="215" cy="290" r="5" fill="#3b82f6" filter="url(#s1Glow)">
            {!reducedMotion && <animate attributeName="opacity" values="1;0.4;1" dur="0.5s" repeatCount="indefinite" />}
          </circle>

          {/* Wheels */}
          <circle cx="150" cy="339" r="10" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <circle cx="150" cy="339" r="4" fill="#94a3b8" />
          <circle cx="225" cy="339" r="10" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <circle cx="225" cy="339" r="4" fill="#94a3b8" />
        </g>

        {/* Destination Hospital */}
        <g transform="translate(620, 140)">
          <rect x="0" y="20" width="220" height="160" rx="6" fill="#0d1424" stroke="rgba(220,38,38,0.4)" strokeWidth="1.5" />
          <rect x="15" y="35" width="190" height="22" rx="4" fill="rgba(220,38,38,0.15)" />
          <text x="110" y="50" textAnchor="middle" fontSize="11" fill="#fca5a5" fontFamily="Inter" fontWeight="800" letterSpacing="0.05em">
            MADURAI GRH · TRAUMA CARE
          </text>

          <circle cx="110" cy="8" r="14" fill="#0d1424" stroke="#dc2626" strokeWidth="1.5" />
          <rect x="104" y="2" width="12" height="12" rx="1" fill="#ef4444" filter="url(#s1Glow)" />
          <rect x="101" y="6" width="18" height="4" rx="1" fill="#ffffff" />
          <rect x="108" y="-1" width="4" height="18" rx="1" fill="#ffffff" />

          {[...Array(12)].map((_, i) => (
            <rect key={i} x={25 + (i % 4) * 45} y={75 + Math.floor(i / 4) * 25} width="24" height="14" rx="2" fill={i % 3 === 0 ? "rgba(254,240,138,0.4)" : "rgba(59,130,246,0.3)"} />
          ))}

          <rect x="65" y="145" width="90" height="35" rx="4" fill="#1e293b" stroke="#dc2626" strokeWidth="1.5" />
          <text x="110" y="162" textAnchor="middle" fontSize="9" fill="#ef4444" fontWeight="bold">EMERGENCY BAY</text>
        </g>
      </svg>

      <div className="scene-status-badge">
        <Activity size={14} className="text-red-500 animate-pulse" />
        <span>Stage 1: Roadside Dispatch to Emergency Trauma Center</span>
      </div>
    </div>
  );
}

// ─── Scene 2: Blood Collection ───────────────────────────────────────────────

function Scene2Collection({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="scene-viewport">
      <svg viewBox="0 0 880 440" className="scene-svg">
        <defs>
          <linearGradient id="s2Bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#060913" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="tubeBlood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
        </defs>

        <rect width="880" height="440" fill="url(#s2Bg)" />
        <rect x="50" y="40" width="780" height="360" rx="16" fill="rgba(15,23,42,0.6)" stroke="rgba(148,163,184,0.15)" strokeWidth="1.5" />
        <rect x="70" y="270" width="740" height="12" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />

        {/* Clinical Specialist */}
        <g transform="translate(140, 110)">
          <circle cx="50" cy="35" r="22" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
          <path d="M 28 30 Q 50 12 72 30 Z" fill="#0284c7" />
          <path d="M 25 65 L 75 65 L 85 160 L 15 160 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
          <path d="M 40 65 L 50 110 L 60 65 Z" fill="#0284c7" />
          <rect x="30" y="80" width="14" height="18" rx="2" fill="#38bdf8" />
          <path d="M 38 65 Q 50 100 62 65" fill="none" stroke="#dc2626" strokeWidth="2.5" />
          <text x="50" y="180" textAnchor="middle" fontSize="11" fill="#94a3b8" fontFamily="Inter" fontWeight="600">
            Clinical Phlebotomist
          </text>
        </g>

        {/* Specimen Tube moving along track */}
        <g>
          {!reducedMotion ? (
            <animateTransform
              attributeName="transform"
              type="translate"
              from="280, 150"
              to="530, 150"
              dur="4.5s"
              repeatCount="indefinite"
            />
          ) : (
            <animateTransform attributeName="transform" type="translate" to="400, 150" dur="0.01s" fill="freeze" />
          )}

          <ellipse cx="20" cy="115" rx="25" ry="6" fill="rgba(220,38,38,0.2)" />
          <rect x="8" y="10" width="24" height="85" rx="10" fill="rgba(255,255,255,0.12)" stroke="#e2e8f0" strokeWidth="1.5" />
          <rect x="10" y="32" width="20" height="60" rx="8" fill="url(#tubeBlood)" />
          <ellipse cx="20" cy="33" rx="10" ry="2" fill="#f87171" />
          <rect x="7" y="0" width="26" height="12" rx="3" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
          <rect x="9" y="42" width="22" height="28" rx="2" fill="#ffffff" />
          <line x1="12" y1="48" x2="28" y2="48" stroke="#000" strokeWidth="1.5" />
          <line x1="12" y1="53" x2="24" y2="53" stroke="#000" strokeWidth="1" />
          <line x1="12" y1="58" x2="27" y2="58" stroke="#000" strokeWidth="1" />
          <text x="20" y="67" textAnchor="middle" fontSize="5" fill="#dc2626" fontWeight="bold">#BLD-8821</text>
        </g>

        {/* Track */}
        <line x1="260" y1="265" x2="570" y2="265" stroke="#475569" strokeWidth="6" strokeDasharray="12 6">
          {!reducedMotion && <animate attributeName="stroke-dashoffset" from="36" to="0" dur="1s" repeatCount="indefinite" />}
        </line>
        <line x1="260" y1="272" x2="570" y2="272" stroke="#1e293b" strokeWidth="3" />

        {/* Laboratory Station */}
        <g transform="translate(560, 90)">
          <rect x="0" y="0" width="220" height="180" rx="12" fill="#090d16" stroke="rgba(56,189,248,0.3)" strokeWidth="1.5" />
          <rect x="15" y="15" width="190" height="30" rx="6" fill="rgba(56,189,248,0.1)" />
          <text x="110" y="34" textAnchor="middle" fontSize="10" fill="#38bdf8" fontFamily="Inter" fontWeight="700">
            AUTO-CENTRIFUGE &amp; ANALYZER #4
          </text>

          <rect x="20" y="55" width="180" height="60" rx="6" fill="#020617" stroke="rgba(34,197,94,0.3)" strokeWidth="1" />
          <polyline
            points="30,85 50,85 60,65 70,105 80,85 105,85 115,70 125,95 135,85 170,85"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
          >
            {!reducedMotion && <animate attributeName="stroke-dashoffset" from="200" to="0" dur="2s" repeatCount="indefinite" />}
          </polyline>

          <circle cx="40" cy="140" r="5" fill="#22c55e" />
          <text x="52" y="144" fontSize="9" fill="#94a3b8">Sample Intake Ready</text>
          <circle cx="150" cy="140" r="5" fill="#eab308">
            {!reducedMotion && <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" />}
          </circle>
          <text x="162" y="144" fontSize="9" fill="#94a3b8">Speed: 4,000 RPM</text>
        </g>
      </svg>

      <div className="scene-status-badge">
        <FlaskConical size={14} className="text-sky-400" />
        <span>Stage 2: Sample Aspiration &amp; Automated Transport Conveyor</span>
      </div>
    </div>
  );
}

// ─── Scene 3: Blood Group Identification ─────────────────────────────────────

function Scene3BloodGroup({ reducedMotion, selectedGroup }: { reducedMotion: boolean; selectedGroup: string }) {
  return (
    <div className="scene-viewport">
      <svg viewBox="0 0 880 440" className="scene-svg">
        <rect width="880" height="440" fill="#060913" />

        <g transform="translate(70, 35)">
          <rect x="0" y="0" width="740" height="370" rx="16" fill="rgba(15,23,42,0.9)" stroke="rgba(220,38,38,0.3)" strokeWidth="1.5" />
          <rect x="0" y="0" width="740" height="50" rx="16" fill="rgba(220,38,38,0.12)" />
          <text x="30" y="32" fontSize="13" fill="#f87171" fontFamily="Inter" fontWeight="800" letterSpacing="0.05em">
            SIMULATED HEMATOLOGY TEST RESULT · ABO &amp; Rh(D) TYPING
          </text>
          <rect x="580" y="12" width="130" height="26" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <text x="645" y="29" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="600">SAMPLE: #BLD-8821</text>

          {/* Test Wells */}
          <g transform="translate(40, 75)">
            <rect x="0" y="0" width="180" height="150" rx="12" fill="#0b1120" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
            <circle cx="90" cy="65" r="40" fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth="1.5" />
            <circle cx="90" cy="65" r="32" fill={selectedGroup.includes('A') ? '#991b1b' : 'rgba(239,68,68,0.2)'} />
            <text x="90" y="125" textAnchor="middle" fontSize="11" fill="#94a3b8" fontWeight="600">Well A (Anti-A)</text>
            <text x="90" y="142" textAnchor="middle" fontSize="10" fill={selectedGroup.includes('A') ? '#ef4444' : '#22c55e'} fontWeight="bold">
              {selectedGroup.includes('A') ? 'Agglutination (+)' : 'No Agglutination (-)'}
            </text>

            <rect x="220" y="0" width="180" height="150" rx="12" fill="#0b1120" stroke="rgba(234,179,8,0.3)" strokeWidth="1" />
            <circle cx="310" cy="65" r="40" fill="rgba(234,179,8,0.1)" stroke="#eab308" strokeWidth="1.5" />
            <circle cx="310" cy="65" r="32" fill={selectedGroup.includes('B') ? '#991b1b' : 'rgba(239,68,68,0.2)'} />
            <text x="310" y="125" textAnchor="middle" fontSize="11" fill="#94a3b8" fontWeight="600">Well B (Anti-B)</text>
            <text x="310" y="142" textAnchor="middle" fontSize="10" fill={selectedGroup.includes('B') ? '#ef4444' : '#22c55e'} fontWeight="bold">
              {selectedGroup.includes('B') ? 'Agglutination (+)' : 'No Agglutination (-)'}
            </text>

            <rect x="440" y="0" width="180" height="150" rx="12" fill="#0b1120" stroke="rgba(34,197,94,0.3)" strokeWidth="1" />
            <circle cx="530" cy="65" r="40" fill="rgba(34,197,94,0.1)" stroke="#22c55e" strokeWidth="1.5" />
            <circle cx="530" cy="65" r="32" fill={selectedGroup.includes('+') ? '#991b1b' : 'rgba(239,68,68,0.2)'} />
            <text x="530" y="125" textAnchor="middle" fontSize="11" fill="#94a3b8" fontWeight="600">Well D (Anti-Rh)</text>
            <text x="530" y="142" textAnchor="middle" fontSize="10" fill={selectedGroup.includes('+') ? '#ef4444' : '#22c55e'} fontWeight="bold">
              {selectedGroup.includes('+') ? 'Agglutination (+)' : 'No Agglutination (-)'}
            </text>
          </g>

          <g transform="translate(40, 245)">
            <rect x="0" y="0" width="660" height="60" rx="10" fill="rgba(220,38,38,0.15)" stroke="#dc2626" strokeWidth="1.5" />
            <text x="30" y="38" fontSize="13" fill="#cbd5e1" fontWeight="600">Identified Blood Phenotype:</text>
            <text x="235" y="42" fontSize="26" fill="#f87171" fontFamily="Syne, Inter" fontWeight="800">{selectedGroup}</text>
            <text x="310" y="38" fontSize="12" fill="#94a3b8">
              ({selectedGroup === 'O+' ? 'Universal Red Cell Donor for Rh+' : selectedGroup === 'AB+' ? 'Universal Plasma Recipient' : 'Specific ABO/Rh Profile'})
            </text>
          </g>

          <g transform="translate(40, 315)">
            <rect x="0" y="0" width="660" height="40" rx="6" fill="#090d16" stroke="rgba(234,179,8,0.4)" strokeWidth="1" />
            <text x="15" y="24" fontSize="10" fill="#fde047" fontWeight="bold">CRITICAL CLINICAL NOTICE:</text>
            <text x="175" y="24" fontSize="10" fill="#e2e8f0">
              Blood group identification is an initial screening step. Full cross-match (IAT/Coombs) is mandatory prior to actual transfusion.
            </text>
          </g>
        </g>
      </svg>

      <div className="scene-status-badge">
        <TestTube size={14} className="text-amber-400" />
        <span>Stage 3: Blood Group Identification (ABO/Rh Confirmed)</span>
      </div>
    </div>
  );
}

// ─── Scene 4: Blood Request ──────────────────────────────────────────────────

function Scene4Requirement({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="scene-viewport">
      <svg viewBox="0 0 880 440" className="scene-svg">
        <rect width="880" height="440" fill="#060913" />

        <g transform="translate(100, 30)">
          <rect x="0" y="0" width="680" height="380" rx="16" fill="rgba(15,23,42,0.95)" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5" />
          <rect x="0" y="0" width="680" height="54" rx="16" fill="rgba(245,158,11,0.1)" />
          <circle cx="35" cy="27" r="14" fill="rgba(245,158,11,0.2)" />
          <text x="35" y="32" textAnchor="middle" fontSize="14" fill="#f59e0b">🚨</text>
          <text x="65" y="33" fontSize="14" fill="#fbbf24" fontFamily="Inter" fontWeight="800" letterSpacing="0.05em">
            CRITICAL BLOOD COMPONENT REQUISITION · ORDER #REQ-2026-904
          </text>
          <rect x="560" y="14" width="100" height="26" rx="13" fill="#dc2626" />
          <text x="610" y="31" textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="bold">EMERGENCY</text>

          <g transform="translate(35, 75)">
            {[
              { label: 'REQUESTING HOSPITAL', value: 'Madurai GRH (Trauma ICU)', icon: '🏥' },
              { label: 'BLOOD COMPONENT', value: 'Packed Red Blood Cells (PRBC)', icon: '🩸' },
              { label: 'REQUIRED BLOOD GROUP', value: 'O Positive (O+)', icon: '🧪' },
              { label: 'UNITS REQUESTED', value: '4 Units (450 mL each)', icon: '📦' },
              { label: 'MAX NEEDED-BY WINDOW', value: '90 Minutes (Urgent Transfusion)', icon: '⏱️' },
              { label: 'LOCAL INVENTORY STATUS', value: '0 Units Available (DEFICIT ALERT)', icon: '⚠️' },
            ].map((item, i) => {
              const x = (i % 2) * 310;
              const y = Math.floor(i / 2) * 75;
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <rect x="0" y="0" width="290" height="60" rx="8" fill="#0b1120" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
                  <text x="15" y="22" fontSize="9" fill="#94a3b8" fontWeight="600" letterSpacing="0.05em">{item.label}</text>
                  <text x="15" y="44" fontSize="13" fill={i === 5 ? '#ef4444' : '#f1f5f9'} fontWeight="700">
                    {item.icon} {item.value}
                  </text>
                </g>
              );
            })}
          </g>

          <g transform="translate(35, 310)">
            <rect x="0" y="0" width="610" height="50" rx="10" fill="rgba(220,38,38,0.15)" stroke="rgba(220,38,38,0.4)" strokeWidth="1" />
            <text x="25" y="30" fontSize="12" fill="#fca5a5" fontWeight="600">
              ⚡ Local inventory exhausted. Triggering regional peer-to-peer redistribution search...
            </text>
          </g>
        </g>
      </svg>

      <div className="scene-status-badge">
        <ClipboardList size={14} className="text-amber-400" />
        <span>Stage 4: Hospital Blood Request Generated &amp; Backlogged into FIFO Queue</span>
      </div>
    </div>
  );
}

// ─── Scene 5: Inventory Network ──────────────────────────────────────────────

function Scene5Network({ reducedMotion }: { reducedMotion: boolean }) {
  const nodes = [
    { id: 'GRH', name: 'Madurai GRH (Destination)', x: 440, y: 220, units: 0, expiring: 0, type: 'target' },
    { id: 'RMD', name: 'Ramanathapuram GH', x: 200, y: 110, units: 14, expiring: 3, type: 'source' },
    { id: 'SVG', name: 'Sivaganga MC', x: 680, y: 110, units: 9, expiring: 1, type: 'source' },
    { id: 'KMT', name: 'Kamuthi Hospital', x: 200, y: 330, units: 6, expiring: 4, type: 'source' },
    { id: 'PMK', name: 'Paramakudi Hospital', x: 680, y: 330, units: 11, expiring: 0, type: 'source' },
  ];

  const connections = [
    { from: 1, to: 0 },
    { from: 2, to: 0 },
    { from: 3, to: 0 },
    { from: 4, to: 0 },
    { from: 1, to: 3 },
    { from: 2, to: 4 },
  ];

  return (
    <div className="scene-viewport">
      <svg viewBox="0 0 880 440" className="scene-svg">
        <rect width="880" height="440" fill="#060913" />

        {[...Array(15)].map((_, i) => (
          <line key={`x${i}`} x1={i * 60} y1="0" x2={i * 60} y2="440" stroke="rgba(255,255,255,0.03)" />
        ))}
        {[...Array(8)].map((_, i) => (
          <line key={`y${i}`} x1="0" y1={i * 60} x2="880" y2={i * 60} stroke="rgba(255,255,255,0.03)" />
        ))}

        {connections.map((c, i) => (
          <line
            key={i}
            x1={nodes[c.from].x}
            y1={nodes[c.from].y}
            x2={nodes[c.to].x}
            y2={nodes[c.to].y}
            stroke={c.to === 0 ? "rgba(239,68,68,0.4)" : "rgba(148,163,184,0.15)"}
            strokeWidth={c.to === 0 ? 2 : 1}
            strokeDasharray={c.to === 0 ? "8 4" : "4 4"}
          >
            {!reducedMotion && c.to === 0 && (
              <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.5s" repeatCount="indefinite" />
            )}
          </line>
        ))}

        {!reducedMotion && [1, 2, 3].map((srcIdx, i) => (
          <circle key={`p-${i}`} r="4" fill="#ef4444">
            <animateMotion
              dur={`${2 + i * 0.5}s`}
              repeatCount="indefinite"
              path={`M${nodes[srcIdx].x},${nodes[srcIdx].y} L${nodes[0].x},${nodes[0].y}`}
            />
          </circle>
        ))}

        {nodes.map((node) => {
          const isTarget = node.type === 'target';
          return (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <circle
                r={isTarget ? 38 : 30}
                fill={isTarget ? "rgba(220,38,38,0.2)" : "rgba(15,23,42,0.9)"}
                stroke={isTarget ? "#ef4444" : "#3b82f6"}
                strokeWidth={isTarget ? 2.5 : 1.5}
              />
              <text y="-5" textAnchor="middle" fontSize={isTarget ? 13 : 11} fill={isTarget ? "#fca5a5" : "#93c5fd"} fontWeight="800">
                {node.id}
              </text>
              <text y="10" textAnchor="middle" fontSize="8" fill="#e2e8f0" fontWeight="600">
                {isTarget ? "URGENT DEMAND" : `${node.units} Units O+`}
              </text>
              <text y="20" textAnchor="middle" fontSize="7" fill={node.expiring > 0 ? "#f59e0b" : "#22c55e"}>
                {node.expiring > 0 ? `${node.expiring} Near Expiry` : "Stable"}
              </text>
              <text y={isTarget ? 54 : 44} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="scene-status-badge">
        <Network size={14} className="text-red-400" />
        <span>Stage 5: Regional Graph Topology &amp; Stock Expiry Survey</span>
      </div>
    </div>
  );
}

// ─── Scene 6: Time-Aware Feasibility ─────────────────────────────────────────

function Scene6Redistribution({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="scene-viewport">
      <svg viewBox="0 0 880 440" className="scene-svg">
        <rect width="880" height="440" fill="#060913" />

        <g transform="translate(60, 30)">
          <rect x="0" y="0" width="760" height="380" rx="16" fill="rgba(15,23,42,0.95)" stroke="rgba(56,189,248,0.3)" strokeWidth="1.5" />
          <rect x="0" y="0" width="760" height="50" rx="16" fill="rgba(56,189,248,0.1)" />
          <text x="30" y="32" fontSize="13" fill="#38bdf8" fontFamily="Inter" fontWeight="800" letterSpacing="0.05em">
            TIME-AWARE REDISTRIBUTION FEASIBILITY ENGINE
          </text>
          <text x="730" y="32" textAnchor="end" fontSize="10" fill="#94a3b8">
            Formula: Remaining Shelf Life − (Transport + Processing + Safety) = Usable Margin
          </text>

          {/* Candidate A (FEASIBLE) */}
          <g transform="translate(30, 70)">
            <rect x="0" y="0" width="700" height="135" rx="12" fill="#091424" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5" />
            <rect x="15" y="15" width="220" height="26" rx="6" fill="rgba(34,197,94,0.15)" />
            <text x="25" y="32" fontSize="11" fill="#4ade80" fontWeight="bold">Candidate A: Ramanathapuram GH</text>

            <g transform="translate(20, 55)">
              {[
                { label: 'Remaining Shelf Life', value: '420 min (7.0 hrs)' },
                { label: 'Drone Flight Time', value: '45 min (Dijkstra route)' },
                { label: 'Inspection / Receiving', value: '30 min' },
                { label: 'Safety Margin Buffer', value: '30 min' },
                { label: 'Net Usable Shelf Life', value: '+315 min MARGIN' },
              ].map((m, i) => (
                <g key={i} transform={`translate(${i * 135}, 0)`}>
                  <text y="14" fontSize="8" fill="#94a3b8">{m.label}</text>
                  <text y="36" fontSize="11" fill={i === 4 ? "#4ade80" : "#f1f5f9"} fontWeight={i === 4 ? "800" : "600"}>{m.value}</text>
                </g>
              ))}
            </g>

            <rect x="560" y="90" width="125" height="30" rx="6" fill="#15803d" />
            <text x="622" y="110" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="bold">✓ 100% FEASIBLE</text>
          </g>

          {/* Candidate B (INFEASIBLE) */}
          <g transform="translate(30, 220)">
            <rect x="0" y="0" width="700" height="135" rx="12" fill="#1a0f18" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" />
            <rect x="15" y="15" width="220" height="26" rx="6" fill="rgba(239,68,68,0.15)" />
            <text x="25" y="32" fontSize="11" fill="#f87171" fontWeight="bold">Candidate B: Kamuthi Hospital</text>

            <g transform="translate(20, 55)">
              {[
                { label: 'Remaining Shelf Life', value: '95 min (1.5 hrs)' },
                { label: 'Ground Ambulance Time', value: '110 min (Heavy traffic)' },
                { label: 'Inspection / Receiving', value: '30 min' },
                { label: 'Safety Margin Buffer', value: '30 min' },
                { label: 'Net Usable Shelf Life', value: '-75 min DEFICIT' },
              ].map((m, i) => (
                <g key={i} transform={`translate(${i * 135}, 0)`}>
                  <text y="14" fontSize="8" fill="#94a3b8">{m.label}</text>
                  <text y="36" fontSize="11" fill={i === 4 ? "#ef4444" : "#f1f5f9"} fontWeight={i === 4 ? "800" : "600"}>{m.value}</text>
                </g>
              ))}
            </g>

            <rect x="560" y="90" width="125" height="30" rx="6" fill="#991b1b" />
            <text x="622" y="110" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="bold">✕ INFEASIBLE</text>
          </g>
        </g>
      </svg>

      <div className="scene-status-badge">
        <Timer size={14} className="text-emerald-400" />
        <span>Stage 6: Time-Aware Verification Complete (Candidate A Dispatched)</span>
      </div>
    </div>
  );
}

// ─── Scene 7: Drone Simulation & Delay Recalculation ──────────────────────────

function Scene7Drone({ reducedMotion }: { reducedMotion: boolean }) {
  const [hasDelay, setHasDelay] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHasDelay(true), 3200);
    return () => clearTimeout(t);
  }, []);

  const pathD = "M 120,280 L 260,180 L 480,240 L 720,160";

  return (
    <div className="scene-viewport">
      <svg viewBox="0 0 880 440" className="scene-svg">
        <rect width="880" height="440" fill="#060913" />

        {[...Array(20)].map((_, i) => (
          <line key={`x${i}`} x1={i * 44} y1="0" x2={i * 44} y2="440" stroke="rgba(255,255,255,0.02)" />
        ))}
        {[...Array(10)].map((_, i) => (
          <line key={`y${i}`} x1="0" y1={i * 44} x2="880" y2={i * 44} stroke="rgba(255,255,255,0.02)" />
        ))}

        <path d={pathD} fill="none" stroke="rgba(239,68,68,0.4)" strokeWidth="3" strokeDasharray="10 5">
          {!reducedMotion && (
            <animate attributeName="stroke-dashoffset" from="30" to="0" dur="1.2s" repeatCount="indefinite" />
          )}
        </path>

        {[
          { x: 120, y: 280, label: 'ORIGIN: Ramanathapuram GH' },
          { x: 260, y: 180, label: 'WAYPOINT 1 (Corridor)' },
          { x: 480, y: 240, label: 'WAYPOINT 2 (NH-49 Crossing)' },
          { x: 720, y: 160, label: 'DESTINATION: Madurai GRH' },
        ].map((wp, i) => (
          <g key={i}>
            <circle cx={wp.x} cy={wp.y} r={i === 0 || i === 3 ? 16 : 9} fill={i === 3 ? "rgba(220,38,38,0.3)" : "rgba(34,197,94,0.3)"} stroke={i === 3 ? "#ef4444" : "#22c55e"} strokeWidth="2" />
            <circle cx={wp.x} cy={wp.y} r="3" fill="#ffffff" />
            <text x={wp.x} y={wp.y + 30} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">{wp.label}</text>
          </g>
        ))}

        {/* Drone Icon */}
        <g>
          {!reducedMotion ? (
            <animateMotion dur="6s" repeatCount="indefinite" path={pathD} rotate="auto" />
          ) : (
            <animateTransform attributeName="transform" type="translate" to="400, 220" dur="0.01s" fill="freeze" />
          )}

          <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
          <line x1="-18" y1="-18" x2="18" y2="18" stroke="#94a3b8" strokeWidth="3" />
          <line x1="-18" y1="18" x2="18" y2="-18" stroke="#94a3b8" strokeWidth="3" />
          <circle cx="-18" cy="-18" r="8" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="18" cy="-18" r="8" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="-18" cy="18" r="8" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="18" cy="18" r="8" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
          <rect x="-7" y="-7" width="14" height="14" rx="3" fill="#dc2626" />
          <text x="0" y="3" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">+</text>
        </g>

        {/* Telemetry Display */}
        <g transform="translate(40, 30)">
          <rect x="0" y="0" width="270" height="160" rx="12" fill="rgba(15,23,42,0.95)" stroke="rgba(239,68,68,0.3)" strokeWidth="1.5" />
          <text x="20" y="26" fontSize="11" fill="#f87171" fontWeight="bold">AUTONOMOUS FLIGHT TELEMETRY</text>

          <g transform="translate(20, 48)">
            {[
              { label: 'Airspeed', val: '72 km/h' },
              { label: 'Altitude', val: '120 m AGL' },
              { label: 'Payload Temp', val: '3.8°C (Compliant)' },
              { label: 'Battery Reserve', val: '82%' },
              { label: 'Current ETA', val: hasDelay ? '38 min (Recalculated)' : '25 min' },
            ].map((t, i) => (
              <g key={i} transform={`translate(0, ${i * 20})`}>
                <text fontSize="9" fill="#94a3b8">{t.label}:</text>
                <text x="230" textAnchor="end" fontSize="10" fill={i === 4 && hasDelay ? '#f59e0b' : '#f1f5f9'} fontWeight="bold">{t.val}</text>
              </g>
            ))}
          </g>
        </g>

        {/* Dynamic Recalculation Alert */}
        {hasDelay && (
          <g transform="translate(480, 30)">
            <rect x="0" y="0" width="360" height="120" rx="12" fill="rgba(30,17,10,0.95)" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx="30" cy="30" r="12" fill="rgba(245,158,11,0.2)" />
            <text x="30" y="35" textAnchor="middle" fontSize="12" fill="#f59e0b">⚠️</text>
            <text x="55" y="34" fontSize="12" fill="#fbbf24" fontWeight="bold">EN-ROUTE DELAY RECALCULATION</text>
            <text x="25" y="65" fontSize="9" fill="#e2e8f0">
              Weather sensor triggered: 28 km/h headwind (+13 min).
            </text>
            <text x="25" y="82" fontSize="9" fill="#94a3b8">
              Adjusted Usable Margin: 420m − (58m + 30m + 30m) = +302 min.
            </text>
            <text x="25" y="102" fontSize="10" fill="#22c55e" fontWeight="bold">
              ✓ TRANSFER REMAINS TIME-FEASIBLE. CONTINUING MISSION.
            </text>
          </g>
        )}
      </svg>

      <div className="scene-status-badge">
        <Plane size={14} className="text-sky-400" />
        <span>Stage 7: Autonomous Delivery &amp; Live Telemetry Feasibility Recalculation</span>
      </div>
    </div>
  );
}

// ─── Main Interactive Homepage ───────────────────────────────────────────────

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion ?? false;

  const [currentScene, setCurrentScene] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('O+');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Advance scene automatically
  useEffect(() => {
    if (!isPlaying) {
      clearTimer();
      return;
    }

    clearTimer();
    const duration = SCENES[currentScene]?.duration || 6500;
    timerRef.current = setTimeout(() => {
      setCurrentScene((prev) => {
        if (prev >= SCENES.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, reducedMotion ? 2000 : duration);

    return clearTimer;
  }, [isPlaying, currentScene, clearTimer, reducedMotion]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => {
    clearTimer();
    setIsPlaying(false);
  };
  const handleReplay = () => {
    clearTimer();
    setCurrentScene(0);
    setIsPlaying(true);
  };
  const handleSkip = () => {
    clearTimer();
    setCurrentScene((prev) => (prev < SCENES.length - 1 ? prev + 1 : prev));
  };

  const scrollToStory = () => {
    const el = document.getElementById('story-stage');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setIsPlaying(true);
    }
  };

  const renderActiveScene = () => {
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

  // ── Inline style constants (Tailwind v4 Preflight strips all native styles;
  //    inline styles guarantee correct layout regardless of CSS load order) ──

  const S = {
    // Navigation
    topbar: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      height: 68,
      background: 'rgba(5, 8, 16, 0.94)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    },
    topbarInner: {
      maxWidth: 1240,
      margin: '0 auto',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      gap: 24,
    } as React.CSSProperties,
    topbarLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexShrink: 0,
    } as React.CSSProperties,
    logoBadge: {
      width: 38,
      height: 38,
      borderRadius: 10,
      background: 'rgba(220, 38, 38, 0.15)',
      border: '1px solid rgba(220, 38, 38, 0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ef4444',
      flexShrink: 0,
      boxShadow: '0 0 16px rgba(220, 38, 38, 0.25)',
    } as React.CSSProperties,
    brandCol: {
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      gap: 2,
    },
    brandName: {
      fontSize: 16,
      fontWeight: 800,
      color: '#f8fafc',
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    brandSub: {
      fontSize: 10,
      color: '#94a3b8',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    navCenter: {
      display: 'flex',
      alignItems: 'center',
      gap: 28,
    } as React.CSSProperties,
    navLink: {
      fontSize: 13.5,
      fontWeight: 500,
      color: '#94a3b8',
      textDecoration: 'none',
      padding: '6px 14px',
      borderRadius: 6,
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap' as const,
    },
    ctaBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      height: 38,
      padding: '0 18px',
      borderRadius: 8,
      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      color: '#ffffff',
      fontSize: 13,
      fontWeight: 600,
      fontFamily: 'inherit',
      textDecoration: 'none',
      border: '1px solid rgba(239, 68, 68, 0.35)',
      boxShadow: '0 2px 14px rgba(220, 38, 38, 0.35)',
      whiteSpace: 'nowrap' as const,
      flexShrink: 0,
      boxSizing: 'border-box' as const,
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    } as React.CSSProperties,

    // Hero
    heroSection: {
      minHeight: 'auto',
      paddingTop: 124,
      paddingBottom: 60,
      paddingLeft: 24,
      paddingRight: 24,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    heroContent: {
      maxWidth: 780,
      width: '100%',
      textAlign: 'center' as const,
      margin: '0 auto 44px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      position: 'relative' as const,
      zIndex: 2,
    },
    eyebrow: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 16px',
      borderRadius: 9999,
      background: 'rgba(220, 38, 38, 0.1)',
      border: '1px solid rgba(220, 38, 38, 0.3)',
      marginBottom: 20,
    } as React.CSSProperties,
    eyebrowDot: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: '#ef4444',
      boxShadow: '0 0 8px #ef4444',
      flexShrink: 0,
    } as React.CSSProperties,
    eyebrowText: {
      fontSize: 11,
      fontWeight: 700,
      color: '#f87171',
      letterSpacing: '1.2px',
      textTransform: 'uppercase' as const,
    },
    headline: {
      fontFamily: "'Syne', sans-serif",
      fontSize: 'clamp(2.1rem, 3.8vw, 3rem)',
      fontWeight: 800,
      lineHeight: 1.18,
      letterSpacing: '-0.025em',
      maxWidth: 680,
      margin: '0 auto 18px',
      color: '#f1f5f9',
    },
    headlineAccent: {
      background: 'linear-gradient(135deg, #ef4444 0%, #f97316 60%, #f59e0b 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    } as React.CSSProperties,
    heroDesc: {
      fontSize: 'clamp(0.95rem, 1.2vw, 1.05rem)',
      lineHeight: 1.65,
      color: '#94a3b8',
      maxWidth: 620,
      margin: '0 auto 28px',
    } as React.CSSProperties,
    ctaGroup: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      flexWrap: 'wrap' as const,
    },
    btnPrimary: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      height: 46,
      padding: '0 24px',
      borderRadius: 10,
      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      color: '#ffffff',
      fontSize: 14,
      fontWeight: 600,
      fontFamily: 'inherit',
      border: '1px solid rgba(239, 68, 68, 0.4)',
      cursor: 'pointer',
      boxShadow: '0 4px 18px rgba(220, 38, 38, 0.35)',
      textDecoration: 'none',
      boxSizing: 'border-box' as const,
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    } as React.CSSProperties,
    btnSecondary: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      height: 46,
      padding: '0 24px',
      borderRadius: 10,
      background: 'rgba(15, 23, 42, 0.85)',
      color: '#f1f5f9',
      fontSize: 14,
      fontWeight: 600,
      fontFamily: 'inherit',
      border: '1px solid rgba(148, 163, 184, 0.25)',
      cursor: 'pointer',
      textDecoration: 'none',
      boxSizing: 'border-box' as const,
      backdropFilter: 'blur(8px)',
      transition: 'all 0.2s ease',
    } as React.CSSProperties,

    // Animation stage
    stageContainer: {
      width: '100%',
      maxWidth: 1080,
      background: '#080c16',
      border: '1px solid rgba(148, 163, 184, 0.18)',
      borderRadius: 22,
      overflow: 'hidden',
      boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.85), 0 0 35px rgba(220, 38, 38, 0.08)',
      position: 'relative' as const,
      zIndex: 10,
      marginTop: 14,
      textAlign: 'left' as const,
    },
    stageHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 22px',
      background: '#060913',
      borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    } as React.CSSProperties,
    stageInfoLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    } as React.CSSProperties,
    stagePill: {
      padding: '3px 10px',
      borderRadius: 6,
      background: 'rgba(220, 38, 38, 0.15)',
      border: '1px solid rgba(220, 38, 38, 0.3)',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      fontWeight: 700,
      color: '#f87171',
    },
    stageTitle: {
      fontSize: 14,
      fontWeight: 700,
      color: '#f1f5f9',
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 9999,
      background: 'rgba(16, 185, 129, 0.1)',
      border: '1px solid rgba(16, 185, 129, 0.25)',
      fontSize: 10,
      fontWeight: 700,
      color: '#34d399',
      letterSpacing: '0.5px',
    } as React.CSSProperties,
    pulseDot: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: '#10b981',
      boxShadow: '0 0 6px #10b981',
      flexShrink: 0,
    } as React.CSSProperties,
    progressTrack: {
      width: '100%',
      height: 3,
      background: 'rgba(148, 163, 184, 0.1)',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #dc2626, #f97316)',
    },

    // Stepper
    stepperRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))',
      gap: 8,
      padding: '10px 14px',
      background: '#050810',
      borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
      overflowX: 'auto' as const,
      WebkitOverflowScrolling: 'touch' as const,
    },
    stepperNode: (isActive: boolean, isPast: boolean) => ({
      padding: '8px 6px',
      borderRadius: 8,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 5,
      border: isActive ? '1px solid rgba(220, 38, 38, 0.45)' : isPast ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255, 255, 255, 0.06)',
      background: isActive ? 'rgba(220, 38, 38, 0.12)' : isPast ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 255, 255, 0.02)',
      cursor: 'pointer',
      minWidth: 124,
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
    }),
    nodeMarker: (isActive: boolean, isPast: boolean) => ({
      width: 22,
      height: 22,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10.5,
      fontWeight: 700,
      background: isActive ? '#dc2626' : isPast ? 'rgba(16, 185, 129, 0.18)' : '#1e293b',
      color: isActive ? '#ffffff' : isPast ? '#34d399' : '#94a3b8',
      border: isActive ? '1px solid #ef4444' : isPast ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(148, 163, 184, 0.25)',
      boxShadow: isActive ? '0 0 10px rgba(220, 38, 38, 0.5)' : 'none',
      flexShrink: 0,
    }) as React.CSSProperties,
    nodeLabel: (isActive: boolean, isPast?: boolean) => ({
      fontSize: 10.5,
      fontWeight: isActive ? 700 : 500,
      color: isActive ? '#f87171' : isPast ? '#94a3b8' : '#64748b',
      textAlign: 'center' as const,
      lineHeight: 1.2,
      whiteSpace: 'normal' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 26,
      maxWidth: '100%',
    }),

    // Toolbar footer
    toolbarFooter: {
      padding: '18px 24px',
      background: '#0a0f1d',
      borderTop: '1px solid rgba(148, 163, 184, 0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
      flexWrap: 'wrap' as const,
    } as React.CSSProperties,
    captionBlock: {
      flex: 1,
      minWidth: 260,
      textAlign: 'left' as const,
    } as React.CSSProperties,
    captionBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 10.5,
      fontWeight: 700,
      color: '#f87171',
      letterSpacing: '0.8px',
      marginBottom: 4,
    } as React.CSSProperties,
    captionTitle: {
      fontSize: 15,
      fontWeight: 800,
      color: '#f1f5f9',
      display: 'block',
      marginBottom: 4,
    },
    captionDesc: {
      fontSize: 12.5,
      color: '#94a3b8',
      lineHeight: 1.55,
      margin: 0,
    },
    controlsRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap' as const,
    } as React.CSSProperties,
    dividerVertical: {
      width: 1,
      height: 24,
      background: 'rgba(148, 163, 184, 0.2)',
      margin: '0 2px',
    } as React.CSSProperties,
    tbBtn: (variant: 'primary' | 'secondary' | 'enter') => ({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      height: 38,
      padding: variant === 'enter' ? '0 18px' : '0 15px',
      borderRadius: 8,
      fontSize: 12.5,
      fontWeight: 600,
      fontFamily: 'inherit',
      cursor: 'pointer',
      textDecoration: 'none',
      whiteSpace: 'nowrap' as const,
      boxSizing: 'border-box' as const,
      border: variant === 'enter' ? 'none' : '1px solid',
      borderColor: variant === 'primary' ? 'rgba(220, 38, 38, 0.45)' : variant === 'secondary' ? 'rgba(148, 163, 184, 0.22)' : 'transparent',
      background: variant === 'primary' ? 'rgba(220, 38, 38, 0.16)' : variant === 'secondary' ? '#1e293b' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      color: variant === 'primary' ? '#f87171' : variant === 'secondary' ? '#cbd5e1' : '#ffffff',
      boxShadow: variant === 'enter' ? '0 2px 12px rgba(220, 38, 38, 0.35)' : 'none',
      transition: 'all 0.2s ease',
    }) as React.CSSProperties,

    // Phenotype bar
    phenoBar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: '10px 16px',
      background: 'rgba(15, 23, 42, 0.95)',
      borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
      fontSize: 12,
      color: '#cbd5e1',
    } as React.CSSProperties,
    bgChip: (active: boolean) => ({
      padding: '4px 12px',
      borderRadius: 6,
      background: active ? '#dc2626' : '#1e293b',
      border: active ? '1px solid #ef4444' : '1px solid rgba(148, 163, 184, 0.2)',
      color: active ? '#fff' : '#f1f5f9',
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer',
      fontFamily: 'inherit',
    }),

    // Sections
    section: { padding: '80px 24px', maxWidth: 1100, margin: '0 auto' },
    sectionHeader: { textAlign: 'center' as const, maxWidth: 740, margin: '0 auto 44px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center' },
    sectionBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 9999, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', color: '#f87171', fontSize: 11, fontWeight: 700, letterSpacing: '1px', marginBottom: 14 } as React.CSSProperties,
    sectionTitle: { fontFamily: "'Syne',sans-serif", fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 12, lineHeight: 1.2 },
    sectionSub: { fontSize: 15, color: '#94a3b8', lineHeight: 1.6, margin: 0 },

    // Two-column cards
    twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24 } as React.CSSProperties,
    featureCard: { padding: '28px 24px', background: 'rgba(13,17,29,0.7)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 16, textAlign: 'left' as const } as React.CSSProperties,
    cardIcon: (color: string) => ({
      width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 18, background: color === 'red' ? 'rgba(220,38,38,0.12)' : 'rgba(6,182,212,0.12)',
      color: color === 'red' ? '#f87171' : '#22d3ee', border: `1px solid ${color === 'red' ? 'rgba(220,38,38,0.25)' : 'rgba(6,182,212,0.25)'}`
    }) as React.CSSProperties,
    cardH3: { fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginBottom: 10 },
    cardP: { fontSize: 14, color: '#94a3b8', lineHeight: 1.6, margin: 0 },
    statPill: (color: string) => ({
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8,
      fontSize: 11, fontWeight: 600, marginTop: 18,
      background: color === 'red' ? 'rgba(220,38,38,0.08)' : 'rgba(6,182,212,0.08)',
      color: color === 'red' ? '#fca5a5' : '#67e8f9',
      border: `1px solid ${color === 'red' ? 'rgba(220,38,38,0.2)' : 'rgba(6,182,212,0.2)'}`
    }) as React.CSSProperties,

    // Workflow grid
    workflowGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 } as React.CSSProperties,
    workflowCard: { padding: '22px 18px', background: 'rgba(13,17,29,0.65)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 14, textAlign: 'left' as const } as React.CSSProperties,
    workflowNum: { fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 800, color: 'rgba(220,38,38,0.6)', marginBottom: 12 },
    workflowIcon: { width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', marginBottom: 12, border: '1px solid rgba(255,255,255,0.08)' } as React.CSSProperties,
    wfH4: { fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 },
    wfP: { fontSize: 12, color: '#94a3b8', lineHeight: 1.5, margin: 0 },

    // DSA grid
    dsaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 } as React.CSSProperties,
    dsaCard: { padding: '22px 20px', background: 'rgba(13,17,29,0.6)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 14, textAlign: 'left' as const } as React.CSSProperties,
    dsaHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as React.CSSProperties,
    dsaIconBadge: (bg: string, col: string) => ({ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color: col }) as React.CSSProperties,
    dsaTag: { fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' },
    dsaCardTitle: { fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 },
    dsaCardText: { fontSize: 13, color: '#94a3b8', lineHeight: 1.55, margin: 0 },

    // CTA banner
    ctaBanner: { padding: '44px 32px', borderRadius: 18, background: 'linear-gradient(135deg,rgba(13,17,29,0.95),rgba(20,10,15,0.95))', border: '1px solid rgba(220,38,38,0.3)', textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' },
    ctaIconGlow: { width: 60, height: 60, borderRadius: 14, background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.35)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 0 25px rgba(220,38,38,0.25)' } as React.CSSProperties,
    ctaTitle: { fontFamily: "'Syne',sans-serif", fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, color: '#f1f5f9', marginBottom: 12 },
    ctaText: { fontSize: 15, color: '#94a3b8', maxWidth: 620, lineHeight: 1.6, marginBottom: 24 },

    // Footer
    footer: { background: '#03050a', borderTop: '1px solid rgba(148,163,184,0.1)', padding: '50px 24px 24px' },
    footerInner: { maxWidth: 1100, margin: '0 auto' },
    footerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 36, marginBottom: 36, flexWrap: 'wrap' as const } as React.CSSProperties,
    footerBrandTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: '#f1f5f9', marginBottom: 10 } as React.CSSProperties,
    footerBrandDesc: { fontSize: 13, color: '#94a3b8', maxWidth: 360, lineHeight: 1.6, margin: 0 },
    footerLinksGroup: { display: 'flex', flexDirection: 'column' as const, gap: 10 },
    footerGroupTitle: { fontSize: 12, fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase' as const, letterSpacing: '1px' },
    footerLinksList: { display: 'flex', gap: 18, flexWrap: 'wrap' as const } as React.CSSProperties,
    footerLink: { fontSize: 13, color: '#94a3b8', textDecoration: 'none' },
    disclosure: { padding: '18px 22px', borderRadius: 12, background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(234,179,8,0.25)', marginBottom: 28 },
    discBadge: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#fbbf24', letterSpacing: '0.8px', marginBottom: 8 } as React.CSSProperties,
    discText: { fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0 },
    footerBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid rgba(148,163,184,0.08)', fontSize: 12, color: '#64748b', flexWrap: 'wrap' as const, gap: 10 } as React.CSSProperties,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050810', color: '#f1f5f9', overflowX: 'hidden', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>
      {/* ─── 1. Navigation Bar ─────────────────────────────────────────────── */}
      <header style={S.topbar}>
        <div style={S.topbarInner}>
          <div style={S.topbarLeft}>
            <div style={S.logoBadge}><Droplets size={20} /></div>
            <div style={S.brandCol}>
              <span style={S.brandName}>Blood Navigator</span>
              <span style={S.brandSub}>Time-Aware Blood Logistics</span>
            </div>
          </div>

          <nav className="topbar-center" style={S.navCenter}>
            <a href="#story-stage" style={S.navLink}>Emergency Story</a>
            <a href="#how-it-works" style={S.navLink}>Workflow</a>
            <a href="#dsa-section" style={S.navLink}>DSA in Action</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link href="/dashboard" style={S.ctaBtn}>
              <span>Enter Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── 2. Hero Section ───────────────────────────────────────────────── */}
      <section style={S.heroSection}>
        <div className="hero-bg-effects">
          <div className="hero-grid" />
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
        </div>

        <div style={S.heroContent}>
          <div style={S.eyebrow}>
            <span style={S.eyebrowDot} />
            <span style={S.eyebrowText}>TIME-AWARE BLOOD LOGISTICS</span>
          </div>

          <h1 style={S.headline}>
            Every Minute Matters.<br />
            <span style={S.headlineAccent}>Every Unit Counts.</span>
          </h1>

          <p style={S.heroDesc}>
            An intelligent emergency redistribution system evaluating biological shelf life,
            flight travel times, and processing buffers across regional blood banks to prevent
            transfusion wastage and deliver critical units when seconds matter.
          </p>

          <div style={S.ctaGroup}>
            <button onClick={scrollToStory} style={S.btnPrimary}>
              <Play size={16} />
              <span>Watch the Emergency Story</span>
            </button>
            <Link href="/dashboard" style={S.btnSecondary}>
              <Activity size={16} />
              <span>Explore Blood Navigator</span>
            </Link>
          </div>
        </div>

        {/* ─── 3. Centerpiece Animation Stage ──────────────────────────────── */}
        <div id="story-stage" style={S.stageContainer}>
          {/* Stage Header */}
          <div style={S.stageHeader}>
            <div style={S.stageInfoLeft}>
              <span style={S.stagePill}>STAGE 0{currentScene + 1} / 07</span>
              <span style={S.stageTitle}>{SCENES[currentScene].title}</span>
            </div>
            <div style={S.statusBadge}>
              <span style={S.pulseDot} />
              <span>SIMULATION · ACTIVE</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={S.progressTrack}>
            <motion.div
              key={currentScene + (isPlaying ? '-play' : '-pause')}
              style={S.progressFill}
              initial={{ width: '0%' }}
              animate={{ width: isPlaying ? '100%' : '50%' }}
              transition={{
                duration: isPlaying ? (SCENES[currentScene]?.duration || 6500) / 1000 : 0,
                ease: 'linear'
              }}
            />
          </div>

          {/* Seven-Stage Timeline */}
          <div style={S.stepperRow} className="stage-stepper-row">
            {SCENES.map((scene, idx) => {
              const isActive = currentScene === idx;
              const isPast = currentScene > idx;
              return (
                <button
                  key={scene.id}
                  style={S.stepperNode(isActive, isPast)}
                  onClick={() => { setCurrentScene(idx); setIsPlaying(false); }}
                  title={`Stage 0${idx + 1}: ${scene.title}`}
                >
                  <div style={S.nodeMarker(isActive, isPast)}>
                    {isPast ? <CheckCircle2 size={12} /> : <span>0{idx + 1}</span>}
                  </div>
                  <span style={S.nodeLabel(isActive, isPast)}>{scene.title}</span>
                </button>
              );
            })}
          </div>

          {/* Blood Group Picker (Scene 3 only) */}
          {currentScene === 2 && (
            <div style={S.phenoBar}>
              <span style={{ fontWeight: 600, color: '#94a3b8' }}>Select Blood Type:</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {BLOOD_GROUPS.map((bg) => (
                  <button key={bg} style={S.bgChip(selectedBloodGroup === bg)} onClick={() => setSelectedBloodGroup(bg)}>{bg}</button>
                ))}
              </div>
            </div>
          )}

          {/* SVG Animation Canvas */}
          <div style={{ width: '100%', background: '#060913' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScene}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                transition={{ duration: reducedMotion ? 0.01 : 0.3 }}
                style={{ width: '100%' }}
              >
                {renderActiveScene()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dedicated Playback Controller & Narration Bar */}
          <div style={S.toolbarFooter}>
            <div style={S.captionBlock}>
              <div style={S.captionBadge}>
                <Sparkles size={12} />
                <span>STAGE NARRATION · 0{currentScene + 1} OF 07</span>
              </div>
              <span style={S.captionTitle}>{SCENES[currentScene].title}</span>
              <p style={S.captionDesc}>{SCENES[currentScene].desc}</p>
            </div>
            <div style={S.controlsRow}>
              {isPlaying ? (
                <button style={S.tbBtn('primary')} onClick={handlePause} title="Pause story playback">
                  <Pause size={14} />
                  <span>Pause</span>
                </button>
              ) : (
                <button style={S.tbBtn('primary')} onClick={handlePlay} title="Play story sequence">
                  <Play size={14} />
                  <span>Play Story</span>
                </button>
              )}
              <button style={S.tbBtn('secondary')} onClick={handleReplay} title="Replay from Scene 1">
                <RotateCcw size={14} />
                <span>Replay</span>
              </button>
              <button style={S.tbBtn('secondary')} onClick={handleSkip} title="Skip to next scene">
                <SkipForward size={14} />
                <span>Skip Scene</span>
              </button>

              <div style={S.dividerVertical} />

              <Link href="/dashboard" style={S.tbBtn('enter')}>
                <span>Enter Blood Navigator</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. Problem & Solution ─────────────────────────────────────────── */}
      <section id="how-it-works" style={S.section}>
        <div style={S.sectionHeader}>
          <div style={S.sectionBadge}><Shield size={13} /><span>THE CHALLENGE &amp; THE SOLUTION</span></div>
          <h2 style={S.sectionTitle}>Perishable Inventory vs. Emergency Shortages</h2>
          <p style={S.sectionSub}>
            Blood components have non-negotiable shelf lives. When facilities operate as isolated islands,
            life-saving blood expires on one shelf while nearby trauma victims face catastrophic deficits.
          </p>
        </div>

        <div style={S.twoCol}>
          <div style={S.featureCard}>
            <div style={S.cardIcon('red')}><AlertTriangle size={22} /></div>
            <h3 style={S.cardH3}>The Perishability Dilemma</h3>
            <p style={S.cardP}>
              Platelet components degrade within 5 days; packed red blood cells expire in 35–42 days.
              Manual phone-based redistribution is too slow, uncoordinated, and frequently results in
              expired stock being condemned to biohazard incinerators.
            </p>
            <div style={S.statPill('red')}><Timer size={14} /><span>Strict biological expiry limits eliminate room for transport delay</span></div>
          </div>
          <div style={S.featureCard}>
            <div style={S.cardIcon('cyan')}><CheckCircle size={22} /></div>
            <h3 style={S.cardH3}>Autonomous Time-Aware Redistribution</h3>
            <p style={S.cardP}>
              Blood Navigator evaluates multi-facility inventory states in real time. It calculates net usable shelf life:
              subtracting estimated flight transit, clinical cross-matching, and buffer margins to guarantee only time-viable
              units are dispatched via rapid corridors.
            </p>
            <div style={S.statPill('cyan')}><Cpu size={14} /><span>Guaranteed mathematical feasibility prior to physical dispatch</span></div>
          </div>
        </div>
      </section>

      {/* ─── 5. Connected Workflow Pipeline ─────────────────────────────────── */}
      <section style={S.section}>
        <div style={S.sectionHeader}>
          <div style={S.sectionBadge}><ClipboardList size={13} /><span>CONNECTED PIPELINE</span></div>
          <h2 style={S.sectionTitle}>How Blood Navigator Operates</h2>
          <p style={S.sectionSub}>
            A cohesive five-stage automated pipeline transforming emergency demand into verified, dispatched transfusions.
          </p>
        </div>

        <div style={S.workflowGrid}>
          {[
            { step: '01', title: 'Inventory Monitoring', desc: 'Continuous tracking of regional blood units, indexed by remaining viability minutes and donor groups.', icon: Clock },
            { step: '02', title: 'Request Evaluation', desc: 'Hospital trauma centers log urgent requisitions processed in strict chronological FIFO arrival order.', icon: ClipboardList },
            { step: '03', title: 'Feasibility Calculation', desc: 'Dynamic formula verification: Remaining Shelf Life − (Transit + Processing + Safety Buffer) > 0.', icon: Timer },
            { step: '04', title: 'Route Planning', desc: 'Dijkstra shortest-path algorithm computes minimum-time waypoint trajectories across the blood corridor.', icon: Network },
            { step: '05', title: 'Simulated Delivery Tracking', desc: 'Real-time telemetry streams monitor drone progress with automatic recalculation upon en-route weather delays.', icon: Plane },
          ].map((item, idx) => (
            <div key={idx} style={S.workflowCard}>
              <div style={S.workflowNum}>{item.step}</div>
              <div>
                <div style={S.workflowIcon}><item.icon size={18} /></div>
                <h4 style={S.wfH4}>{item.title}</h4>
                <p style={S.wfP}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 6. DSA in Action ──────────────────────────────────────────────── */}
      <section id="dsa-section" style={S.section}>
        <div style={S.sectionHeader}>
          <div style={S.sectionBadge}><Cpu size={13} /><span>ACADEMIC FOUNDATION</span></div>
          <h2 style={S.sectionTitle}>Data Structures &amp; Algorithms in Action</h2>
          <p style={S.sectionSub}>
            Every operational feature in Blood Navigator directly maps to foundational data structures
            and algorithms implemented in the core codebase.
          </p>
        </div>

        <div style={S.dsaGrid}>
          {DSA_ITEMS.map((dsa, i) => (
            <div key={i} style={S.dsaCard}>
              <div style={S.dsaHeader}>
                <div style={S.dsaIconBadge(`${dsa.color}15`, dsa.color)}><dsa.icon size={18} /></div>
                <span style={S.dsaTag}>{dsa.tag}</span>
              </div>
              <h4 style={S.dsaCardTitle}>{dsa.name}</h4>
              <p style={S.dsaCardText}>{dsa.usage}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 7. Call to Action Banner ──────────────────────────────────────── */}
      <section style={{ ...S.section, paddingBottom: 60 }}>
        <div style={S.ctaBanner}>
          <div style={S.ctaIconGlow}><Droplets size={32} /></div>
          <h2 style={S.ctaTitle}>Explore the Blood Navigator Platform</h2>
          <p style={S.ctaText}>
            Access the full operational interface: inspect multi-bank inventory balances,
            run live Dijkstra flight path simulations, test the feasibility matrix, and audit reversible transactions.
          </p>
          <div style={S.ctaGroup}>
            <Link href="/dashboard" style={S.btnPrimary}><Activity size={16} /><span>Enter Blood Navigator Dashboard</span></Link>
            <button onClick={scrollToStory} style={S.btnSecondary}><Play size={16} /><span>Watch Emergency Story</span></button>
          </div>
        </div>
      </section>

      {/* ─── 8. Footer ─────────────────────────────────────────────────────── */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={S.footerTop}>
            <div>
              <div style={S.footerBrandTitle}>
                <Droplets size={18} style={{ color: '#ef4444' }} />
                <span>Blood Navigator</span>
              </div>
              <p style={S.footerBrandDesc}>
                A Time-Aware Blood Expiry Monitoring and Inventory Redistribution System with Drone Route Simulation.
              </p>
            </div>
            <div style={S.footerLinksGroup}>
              <span style={S.footerGroupTitle}>Application Modules</span>
              <div style={S.footerLinksList}>
                <Link href="/dashboard" style={S.footerLink}>Dashboard</Link>
                <Link href="/inventory" style={S.footerLink}>Inventory Matrix</Link>
                <Link href="/requests" style={S.footerLink}>Requisitions</Link>
                <Link href="/drone-simulation" style={S.footerLink}>Drone Simulation</Link>
                <Link href="/reports" style={S.footerLink}>Analytics &amp; Audit</Link>
              </div>
            </div>
          </div>

          <div style={S.disclosure}>
            <div style={S.discBadge}><Info size={14} /><span>ACADEMIC SIMULATION DISCLOSURE</span></div>
            <p style={S.discText}>
              Blood Navigator is an academic software demonstration engineered for the Data Structures and Algorithms internal assessment (SET-2).
              All blood bank registries, specimen numbers, hospital requirements, and drone trajectories are simulated models designed
              to benchmark computational efficiency. This system is not connected to active clinical delivery hardware or live blood supply lines.
            </p>
          </div>

          <div style={S.footerBottom}>
            <span>© 2026 Blood Navigator · Data Structures and Algorithms Internal Assessment Project</span>
            <span>Next.js 16 (Turbopack) · High-Performance Hematology Logistics Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

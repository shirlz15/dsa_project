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

  return (
    <div className="homepage">
      {/* ─── 1. Professional Navigation Bar ───────────────────────────────── */}
      <header className="home-topbar">
        <div className="topbar-container">
          {/* Left Area: Logo, Name, Subtitle */}
          <div className="topbar-left">
            <div className="topbar-logo-badge">
              <Droplets size={22} className="brand-drop-icon" />
            </div>
            <div className="topbar-brand-copy">
              <span className="brand-name">Blood Navigator</span>
              <span className="brand-sub">Time-Aware Blood Logistics</span>
            </div>
          </div>

          {/* Center Area: Spaced Navigation Links */}
          <nav className="topbar-center">
            <a href="#story-stage" className="nav-item">Emergency Story</a>
            <a href="#how-it-works" className="nav-item">Workflow</a>
            <a href="#dsa-section" className="nav-item">DSA in Action</a>
          </nav>

          {/* Right Area: Prominent Enter Dashboard CTA */}
          <div className="topbar-right">
            <Link href="/dashboard" className="topbar-cta-btn">
              <span>Enter Dashboard</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── 2. Redesigned Hero Section ───────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-bg-effects">
          <div className="hero-grid" />
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
        </div>

        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            <span className="eyebrow-text">TIME-AWARE BLOOD LOGISTICS</span>
          </div>

          <h1 className="hero-headline">
            Every Minute Matters.<br />
            <span className="hero-headline-accent">Every Unit Counts.</span>
          </h1>

          <p className="hero-description">
            An intelligent emergency redistribution system evaluating biological shelf life,
            flight travel times, and processing buffers across regional blood banks to prevent
            transfusion wastage and deliver critical units when seconds matter.
          </p>

          <div className="hero-cta-group">
            <button onClick={scrollToStory} className="hero-btn-primary">
              <Play size={16} />
              <span>Watch the Emergency Story</span>
            </button>
            <Link href="/dashboard" className="hero-btn-secondary">
              <Activity size={16} />
              <span>Explore Blood Navigator</span>
            </Link>
          </div>
        </div>

        {/* ─── 3. Centerpiece Animation Stage ─────────────────────────────── */}
        <div className="story-player-stage" id="story-stage">
          {/* Stage Header Info Bar */}
          <div className="stage-header-bar">
            <div className="stage-info-left">
              <span className="stage-num-pill">STAGE 0{currentScene + 1} / 07</span>
              <span className="stage-title-text">{SCENES[currentScene].title}</span>
            </div>

            <div className="stage-info-right">
              <span className="stage-status-indicator">
                <span className="pulse-ping" />
                <span className="status-label">SIMULATION · ACTIVE</span>
              </span>
            </div>
          </div>

          {/* Continuous Progress Bar */}
          <div className="stage-progress-track">
            <motion.div
              key={currentScene + (isPlaying ? '-play' : '-pause')}
              className="stage-progress-fill"
              initial={{ width: '0%' }}
              animate={{ width: isPlaying ? '100%' : '50%' }}
              transition={{
                duration: isPlaying ? (SCENES[currentScene]?.duration || 6500) / 1000 : 0,
                ease: 'linear'
              }}
            />
          </div>

          {/* Seven-Stage Separated Stepper */}
          <div className="stage-stepper-row">
            {SCENES.map((scene, idx) => {
              const isActive = currentScene === idx;
              const isPast = currentScene > idx;
              return (
                <button
                  key={scene.id}
                  className={`stepper-node ${isActive ? 'active' : ''} ${isPast ? 'completed' : ''}`}
                  onClick={() => {
                    setCurrentScene(idx);
                    setIsPlaying(false);
                  }}
                  title={`View Stage 0${idx + 1}: ${scene.title}`}
                >
                  <div className="node-marker">
                    {isPast ? <CheckCircle2 size={12} /> : <span>0{idx + 1}</span>}
                  </div>
                  <span className="node-label">{scene.title}</span>
                </button>
              );
            })}
          </div>

          {/* Phenotype Picker (Interactive on Scene 3) */}
          {currentScene === 2 && (
            <div className="stage-phenotype-bar">
              <span className="picker-hint">Select Patient Blood Type:</span>
              <div className="picker-chips">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    className={`bg-chip ${selectedBloodGroup === bg ? 'active' : ''}`}
                    onClick={() => setSelectedBloodGroup(bg)}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active SVG Animation Canvas */}
          <div className="stage-viewport-box">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScene}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                transition={{ duration: reducedMotion ? 0.01 : 0.3 }}
                className="w-full"
              >
                {renderActiveScene()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dedicated Toolbar & Controls */}
          <div className="stage-toolbar-footer">
            <div className="stage-caption-block">
              <span className="caption-heading">{SCENES[currentScene].title}</span>
              <p className="caption-description">{SCENES[currentScene].desc}</p>
            </div>

            <div className="stage-controls-toolbar">
              {isPlaying ? (
                <button className="toolbar-btn btn-primary-action" onClick={handlePause} title="Pause story playback">
                  <Pause size={15} />
                  <span>Pause</span>
                </button>
              ) : (
                <button className="toolbar-btn btn-primary-action" onClick={handlePlay} title="Resume story playback">
                  <Play size={15} />
                  <span>Play Story</span>
                </button>
              )}

              <button className="toolbar-btn btn-secondary-action" onClick={handleReplay} title="Replay from beginning">
                <RotateCcw size={15} />
                <span>Replay</span>
              </button>

              <button className="toolbar-btn btn-secondary-action" onClick={handleSkip} title="Advance to next scene">
                <SkipForward size={15} />
                <span>Skip Scene</span>
              </button>

              <Link href="/dashboard" className="toolbar-btn btn-enter-action" title="Open the full Blood Navigator application">
                <span>Enter Blood Navigator</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. Project Explanation Sections ──────────────────────────────── */}
      
      {/* Problem & Solution */}
      <section className="home-section" id="how-it-works">
        <div className="section-header-block">
          <div className="section-badge">
            <Shield size={13} />
            <span>THE CHALLENGE &amp; THE SOLUTION</span>
          </div>
          <h2 className="section-headline">Perishable Inventory vs. Emergency Shortages</h2>
          <p className="section-subtext">
            Blood components have non-negotiable shelf lives. When facilities operate as isolated islands,
            life-saving blood expires on one shelf while nearby trauma victims face catastrophic deficits.
          </p>
        </div>

        <div className="cards-two-column">
          {/* The Problem Card */}
          <div className="info-feature-card problem-card">
            <div className="card-top-icon red-icon">
              <AlertTriangle size={24} />
            </div>
            <h3>The Perishability Dilemma</h3>
            <p>
              Platelet components degrade within 5 days; packed red blood cells expire in 35–42 days.
              Manual phone-based redistribution between regional hospitals is too slow, uncoordinated, and
              frequently results in expired stock being condemned to biohazard incinerators.
            </p>
            <div className="card-stat-pill red-stat">
              <Timer size={14} />
              <span>Strict biological expiry limits eliminate room for transport delay</span>
            </div>
          </div>

          {/* The Solution Card */}
          <div className="info-feature-card solution-card">
            <div className="card-top-icon cyan-icon">
              <CheckCircle size={24} />
            </div>
            <h3>Autonomous Time-Aware Redistribution</h3>
            <p>
              Blood Navigator evaluates multi-facility inventory states in real time. It calculates net usable shelf life:
              subtracting estimated flight transit, clinical cross-matching, and buffer margins to guarantee only time-viable
              units are dispatched via rapid corridors.
            </p>
            <div className="card-stat-pill cyan-stat">
              <Cpu size={14} />
              <span>Guaranteed mathematical feasibility prior to physical dispatch</span>
            </div>
          </div>
        </div>
      </section>

      {/* Connected Workflow */}
      <section className="home-section">
        <div className="section-header-block">
          <div className="section-badge">
            <ClipboardList size={13} />
            <span>CONNECTED PIPELINE</span>
          </div>
          <h2 className="section-headline">How Blood Navigator Operates</h2>
          <p className="section-subtext">
            A cohesive five-stage automated pipeline transforming emergency demand into verified, dispatched transfusions.
          </p>
        </div>

        <div className="workflow-stepper-grid">
          {[
            {
              step: '01',
              title: 'Inventory Monitoring',
              desc: 'Continuous tracking of regional blood units, indexed by remaining viability minutes and donor groups.',
              icon: Clock
            },
            {
              step: '02',
              title: 'Request Evaluation',
              desc: 'Hospital trauma centers log urgent requisitions processed in strict chronological FIFO arrival order.',
              icon: ClipboardList
            },
            {
              step: '03',
              title: 'Feasibility Calculation',
              desc: 'Dynamic formula verification: Remaining Shelf Life − (Transit + Processing + Safety Buffer) > 0.',
              icon: Timer
            },
            {
              step: '04',
              title: 'Route Planning',
              desc: 'Dijkstra shortest-path algorithm computes minimum-time waypoint trajectories across the blood corridor.',
              icon: Network
            },
            {
              step: '05',
              title: 'Simulated Delivery Tracking',
              desc: 'Real-time telemetry streams monitor drone progress with automatic recalculation upon en-route weather delays.',
              icon: Plane
            },
          ].map((item, idx) => (
            <div key={idx} className="workflow-card">
              <div className="workflow-step-num">{item.step}</div>
              <div className="workflow-card-body">
                <div className="workflow-icon-wrap">
                  <item.icon size={18} />
                </div>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DSA in Action Section */}
      <section className="home-section" id="dsa-section">
        <div className="section-header-block">
          <div className="section-badge">
            <Cpu size={13} />
            <span>ACADEMIC FOUNDATION</span>
          </div>
          <h2 className="section-headline">Data Structures &amp; Algorithms in Action</h2>
          <p className="section-subtext">
            Every operational feature in Blood Navigator directly maps to foundational data structures
            and algorithms implemented in the core codebase.
          </p>
        </div>

        <div className="dsa-showcase-grid">
          {DSA_ITEMS.map((dsa, i) => (
            <div key={i} className="dsa-showcase-card">
              <div className="dsa-card-header">
                <div className="dsa-icon-badge" style={{ background: `${dsa.color}15`, color: dsa.color }}>
                  <dsa.icon size={20} />
                </div>
                <span className="dsa-tag-badge">{dsa.tag}</span>
              </div>
              <h4 className="dsa-card-title">{dsa.name}</h4>
              <p className="dsa-card-text">{dsa.usage}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5. Call to Action Banner ─────────────────────────────────────── */}
      <section className="home-section cta-banner-section">
        <div className="cta-banner-box">
          <div className="cta-icon-glow">
            <Droplets size={36} />
          </div>
          <h2 className="cta-title">Explore the Blood Navigator Platform</h2>
          <p className="cta-text">
            Access the full operational interface: inspect multi-bank inventory balances,
            run live Dijkstra flight path simulations, test the feasibility matrix, and audit reversible transactions.
          </p>
          <div className="cta-button-row">
            <Link href="/dashboard" className="hero-btn-primary">
              <Activity size={16} />
              <span>Enter Blood Navigator Dashboard</span>
            </Link>
            <button onClick={scrollToStory} className="hero-btn-secondary">
              <Play size={16} />
              <span>Watch Emergency Story</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 6. Footer and Educational Disclosure ─────────────────────────── */}
      <footer className="home-footer">
        <div className="footer-inner">
          <div className="footer-top-row">
            <div className="footer-brand-meta">
              <div className="footer-brand-title">
                <Droplets size={20} className="text-red-500" />
                <span>Blood Navigator</span>
              </div>
              <p className="footer-brand-desc">
                A Time-Aware Blood Expiry Monitoring and Inventory Redistribution System with Drone Route Simulation.
              </p>
            </div>

            <div className="footer-links-group">
              <span className="footer-group-title">Application Modules</span>
              <div className="footer-links-list">
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/inventory">Inventory Matrix</Link>
                <Link href="/requests">Requisitions</Link>
                <Link href="/drone-simulation">Drone Simulation</Link>
                <Link href="/reports">Analytics &amp; Audit</Link>
              </div>
            </div>
          </div>

          <div className="footer-disclosure-card">
            <div className="disclosure-badge">
              <Info size={14} />
              <span>ACADEMIC SIMULATION DISCLOSURE</span>
            </div>
            <p className="disclosure-text">
              Blood Navigator is an academic software demonstration engineered for the Data Structures and Algorithms internal assessment (SET-2).
              All blood bank registries, specimen numbers, hospital requirements, and drone trajectories are simulated models designed
              to benchmark computational efficiency. This system is not connected to active clinical delivery hardware or live blood supply lines.
            </p>
          </div>

          <div className="footer-bottom-copy">
            <span>© 2026 Blood Navigator · Data Structures and Algorithms Internal Assessment Project</span>
            <span>Next.js 16 (Turbopack) · High-Performance Hematology Logistics Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Blood Navigator Core Types ──────────────────────────────────────────────

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export const COMPONENT_TYPES = ['Whole Blood', 'Packed RBC', 'Platelets', 'Fresh Frozen Plasma', 'Cryoprecipitate'] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];

export type InventoryStatus = 'available' | 'reserved' | 'quarantined' | 'expired' | 'in_transit' | 'used';
export type RequestStatus = 'pending' | 'processing' | 'matched' | 'fulfilled' | 'cancelled' | 'expired';
export type TransferStatus = 'proposed' | 'approved' | 'rejected' | 'dispatched' | 'in_transit' | 'delayed' | 'arrived' | 'received' | 'cancelled' | 'failed';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertType = 'expiring_soon' | 'expired' | 'low_stock' | 'pending_request' | 'redistribution_opportunity' | 'feasibility_failed' | 'transport_delay' | 'invalid_record' | 'drone_fault' | 'mission_complete';
export type MissionStatus = 'planned' | 'awaiting_approval' | 'approved' | 'flying' | 'delayed' | 'arrived' | 'received' | 'aborted' | 'cancelled';
export type ExpiryRisk = 'normal' | 'warning' | 'critical' | 'expired';

// ─── Entities ────────────────────────────────────────────────────────────────

export interface BloodBank {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  capacity: number;
  contact: string;
  emergencyActive: boolean;
  createdAt: string;
}

export interface InventoryUnit {
  id: string;
  bloodBankId: string;
  componentType: ComponentType;
  bloodType: BloodType;
  collectionTimestamp: string;
  expiryTimestamp: string;
  quantity: number;
  status: InventoryStatus;
  storageTemp: string;
  transportEligible: boolean;
  lastUpdated: string;
}

export interface BloodRequest {
  id: string;
  destinationBankId: string;
  bloodType: BloodType;
  componentType: ComponentType;
  quantity: number;
  priority: 'routine' | 'urgent' | 'emergency';
  status: RequestStatus;
  createdAt: string;
  neededBy: string;
  notes: string;
}

export interface Transfer {
  id: string;
  sourceUnitIds: string[];
  sourceBankId: string;
  destinationBankId: string;
  requestId: string | null;
  status: TransferStatus;
  transportDuration: number; // minutes
  receivingProcessingDuration: number; // minutes
  safetyMargin: number; // minutes
  estimatedArrival: string;
  estimatedReadiness: string;
  usableTimeAfterTransfer: number; // minutes
  quantity: number;
  approvedAt: string | null;
  dispatchedAt: string | null;
  arrivedAt: string | null;
  receivedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  lastUpdated: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  linkedRecordId: string | null;
  linkedRecordType: string | null;
  read: boolean;
  resolved: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AuditEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeValue: string | null;
  afterValue: string | null;
  timestamp: string;
  description: string;
}

export interface DroneMission {
  id: string;
  droneId: string;
  transferId: string | null;
  sourceBankId: string;
  destinationBankId: string;
  status: MissionStatus;
  routeNodes: string[];
  routeDistance: number; // km
  routeCost: number;
  speed: number; // km/h
  batteryPercent: number;
  batteryReserve: number; // percent
  estimatedFlightTime: number; // minutes
  estimatedArrival: string;
  progress: number; // 0-100
  currentPosition: { x: number; y: number };
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  lastUpdated: string;
}

// ─── Expiry Thresholds ──────────────────────────────────────────────────────

export interface ExpiryThresholds {
  warningHours: number;
  criticalHours: number;
}

export const DEFAULT_EXPIRY_THRESHOLDS: ExpiryThresholds = {
  warningHours: 48,
  criticalHours: 12,
};

// ─── Feasibility Result ─────────────────────────────────────────────────────

export interface FeasibilityResult {
  unitId: string;
  destinationBankId: string;
  remainingTime: number; // minutes
  transportDuration: number;
  receivingProcessingDuration: number;
  safetyMargin: number;
  requiredTime: number;
  usableTimeAfterTransfer: number;
  estimatedArrival: string;
  estimatedReadiness: string;
  feasible: boolean;
  reasons: string[];
  quantityAvailable: number;
  quantityRequested: number;
  quantitySufficient: boolean;
  eligibilityPassed: boolean;
  eligibilityReasons: string[];
  deadlineMet: boolean;
  deadlineReason: string;
  score: number;
  scoreFactors: { factor: string; value: number; weight: number }[];
}

// ─── Graph Types ────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'blood_bank' | 'waypoint' | 'obstacle';
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
  blocked: boolean;
}

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AlgorithmStep {
  step: number;
  action: string;
  currentNode: string | null;
  visitedNodes: string[];
  exploredEdges: { from: string; to: string }[];
  queue?: string[];
  stack?: string[];
  distances?: Record<string, number>;
  path?: string[];
  description: string;
}

// ─── Real Workflow DSA Integrated Types ─────────────────────────────────────

export interface ReversibleAction {
  id: string;
  type: 'update_unit' | 'create_unit' | 'delete_unit';
  description: string;
  timestamp: string;
  unitId: string;
  previousUnit: InventoryUnit | null;
  currentUnit: InventoryUnit | null;
}

export interface ReviewTask {
  id: string;
  title: string;
  description: string;
  priority: 'emergency' | 'critical' | 'routine';
  queueEnd: 'front' | 'rear';
  reason: string;
  timestamp: string;
  associatedBankId?: string;
  associatedUnitId?: string;
}

export interface DroneTelemetryEvent {
  id: string;
  timestamp: string;
  eventType: 'mission_started' | 'waypoint_reached' | 'eta_updated' | 'battery_changed' | 'transport_delay' | 'feasibility_recalculated';
  message: string;
  droneId: string;
  batteryPercent: number;
  currentCoord: { x: number; y: number };
  details?: string;
}


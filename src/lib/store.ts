// ─── Blood Navigator — Zustand Store with localStorage Persistence ────────────
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  BloodBank, InventoryUnit, BloodRequest, Transfer, Alert, AuditEvent,
  DroneMission, ExpiryThresholds, DEFAULT_EXPIRY_THRESHOLDS,
  InventoryStatus, RequestStatus, TransferStatus, MissionStatus,
  FeasibilityResult, GraphNode, GraphEdge, GraphState, ReversibleAction,
} from './types';
import {
  DEMO_BLOOD_BANKS, generateDemoInventory, generateDemoRequests, generateDemoAlerts,
} from './demo-data';

// ─── Helper ──────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Store Interface ─────────────────────────────────────────────────────────

interface BloodNavigatorStore {
  // Demo clock offset (milliseconds added to Date.now() for demo speedup)
  demoClockOffset: number;
  setDemoClockOffset: (offset: number) => void;
  getNow: () => number;

  // Blood Banks
  bloodBanks: BloodBank[];
  addBloodBank: (bank: Omit<BloodBank, 'id' | 'createdAt'>) => void;
  updateBloodBank: (id: string, updates: Partial<BloodBank>) => void;

  // Inventory
  inventory: InventoryUnit[];
  inventoryActionStack: ReversibleAction[];
  addInventoryUnit: (unit: Omit<InventoryUnit, 'id' | 'lastUpdated'>) => string | null;
  updateInventoryUnit: (id: string, updates: Partial<InventoryUnit>) => void;
  deleteInventoryUnit: (id: string) => void;
  undoLastInventoryAction: () => { success: boolean; message: string };
  clearInventoryActionStack: () => void;

  // Requests
  requests: BloodRequest[];
  addRequest: (req: Omit<BloodRequest, 'id' | 'createdAt' | 'status'>) => string;
  updateRequest: (id: string, updates: Partial<BloodRequest>) => void;
  cancelRequest: (id: string) => void;

  // Transfers
  transfers: Transfer[];
  createTransfer: (transfer: Omit<Transfer, 'id' | 'createdAt' | 'lastUpdated'>) => string;
  updateTransfer: (id: string, updates: Partial<Transfer>) => void;
  approveTransfer: (id: string) => void;
  rejectTransfer: (id: string, reason: string) => void;

  // Alerts
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => void;
  markAlertRead: (id: string) => void;
  resolveAlert: (id: string) => void;

  // Audit Trail
  auditTrail: AuditEvent[];
  addAuditEvent: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void;

  // Drone Missions
  missions: DroneMission[];
  addMission: (mission: Omit<DroneMission, 'id' | 'createdAt' | 'lastUpdated'>) => string;
  updateMission: (id: string, updates: Partial<DroneMission>) => void;

  // Expiry Thresholds
  expiryThresholds: ExpiryThresholds;
  setExpiryThresholds: (thresholds: ExpiryThresholds) => void;

  // Graph State
  graphState: GraphState;
  setGraphState: (state: GraphState) => void;

  // Demo
  demoLoaded: boolean;
  loadDemoScenario: () => void;
  resetDemo: () => void;

  // Feasibility
  lastFeasibilityResults: FeasibilityResult[];
  setFeasibilityResults: (results: FeasibilityResult[]) => void;
}

// ─── Default Graph for Drone Simulation ──────────────────────────────────────

const DEFAULT_GRAPH: GraphState = {
  nodes: [
    { id: 'n-bb1', label: 'Ramanathapuram GH', x: 150, y: 300, type: 'blood_bank' },
    { id: 'n-bb2', label: 'IRT-PM Paramakudi', x: 400, y: 100, type: 'blood_bank' },
    { id: 'n-bb3', label: 'Rameswaram Centre', x: 650, y: 350, type: 'blood_bank' },
    { id: 'n-bb4', label: 'Kamuthi Hospital', x: 250, y: 500, type: 'blood_bank' },
    { id: 'n-bb5', label: 'GRH Madurai', x: 100, y: 100, type: 'blood_bank' },
    { id: 'n-w1', label: 'Waypoint Alpha', x: 300, y: 250, type: 'waypoint' },
    { id: 'n-w2', label: 'Waypoint Beta', x: 500, y: 200, type: 'waypoint' },
    { id: 'n-w3', label: 'Waypoint Gamma', x: 450, y: 400, type: 'waypoint' },
    { id: 'n-w4', label: 'Waypoint Delta', x: 200, y: 400, type: 'waypoint' },
    { id: 'n-obs1', label: 'No-Fly Zone', x: 350, y: 350, type: 'obstacle' },
  ],
  edges: [
    { from: 'n-bb5', to: 'n-bb2', weight: 45, blocked: false },
    { from: 'n-bb5', to: 'n-bb1', weight: 30, blocked: false },
    { from: 'n-bb1', to: 'n-w1', weight: 15, blocked: false },
    { from: 'n-w1', to: 'n-bb2', weight: 20, blocked: false },
    { from: 'n-w1', to: 'n-w2', weight: 22, blocked: false },
    { from: 'n-bb2', to: 'n-w2', weight: 18, blocked: false },
    { from: 'n-w2', to: 'n-bb3', weight: 25, blocked: false },
    { from: 'n-bb1', to: 'n-w4', weight: 12, blocked: false },
    { from: 'n-w4', to: 'n-bb4', weight: 14, blocked: false },
    { from: 'n-w4', to: 'n-w3', weight: 28, blocked: false },
    { from: 'n-w3', to: 'n-bb3', weight: 22, blocked: false },
    { from: 'n-w3', to: 'n-bb4', weight: 24, blocked: false },
    { from: 'n-bb4', to: 'n-bb1', weight: 18, blocked: false },
    { from: 'n-w1', to: 'n-w4', weight: 16, blocked: false },
  ],
};

// ─── Store Creation ──────────────────────────────────────────────────────────

export const useStore = create<BloodNavigatorStore>()(
  persist(
    (set, get) => ({
      // Demo Clock
      demoClockOffset: 0,
      setDemoClockOffset: (offset) => set({ demoClockOffset: offset }),
      // In SSR / static prerender, use a fixed timestamp to avoid Next.js unstable value prerender errors
      getNow: () => (typeof window === 'undefined' ? 1774350000000 : Date.now()) + get().demoClockOffset,

      // Blood Banks
      bloodBanks: [],
      addBloodBank: (bank) => set((s) => ({
        bloodBanks: [...s.bloodBanks, { ...bank, id: generateId('bb'), createdAt: new Date().toISOString() }],
      })),
      updateBloodBank: (id, updates) => set((s) => ({
        bloodBanks: s.bloodBanks.map((b) => b.id === id ? { ...b, ...updates } : b),
      })),

      // Inventory & Action History (LIFO Stack)
      inventory: [],
      inventoryActionStack: [],
      addInventoryUnit: (unit) => {
        // Validate timestamps
        if (new Date(unit.expiryTimestamp) <= new Date(unit.collectionTimestamp)) return null;
        if (unit.quantity < 0) return null;

        const id = generateId('inv');
        const createdUnit: InventoryUnit = { ...unit, id, lastUpdated: new Date().toISOString() };
        const action: ReversibleAction = {
          id: generateId('act'),
          type: 'create_unit',
          description: `Added unit ${id} (${unit.bloodType} ${unit.componentType}, qty: ${unit.quantity})`,
          timestamp: new Date().toISOString(),
          unitId: id,
          previousUnit: null,
          currentUnit: createdUnit,
        };

        set((s) => ({
          inventory: [...s.inventory, createdUnit],
          inventoryActionStack: [...s.inventoryActionStack, action],
          auditTrail: [...s.auditTrail, {
            id: generateId('audit'), entityType: 'inventory', entityId: id,
            action: 'created', beforeValue: null, afterValue: JSON.stringify(createdUnit),
            timestamp: new Date().toISOString(), description: `Inventory unit ${id} created [Stack PUSH]`,
          }],
        }));
        return id;
      },
      updateInventoryUnit: (id, updates) => set((s) => {
        const existing = s.inventory.find((u) => u.id === id);
        if (!existing) return s;
        // Prevent invalid status transitions
        if (updates.status === 'available' && existing.status === 'expired') return s;
        if (updates.quantity !== undefined && updates.quantity < 0) return s;

        const updatedUnit: InventoryUnit = { ...existing, ...updates, lastUpdated: new Date().toISOString() };
        const action: ReversibleAction = {
          id: generateId('act'),
          type: 'update_unit',
          description: `Updated unit ${id} [${Object.keys(updates).join(', ')}]`,
          timestamp: new Date().toISOString(),
          unitId: id,
          previousUnit: existing,
          currentUnit: updatedUnit,
        };

        return {
          inventory: s.inventory.map((u) => u.id === id ? updatedUnit : u),
          inventoryActionStack: [...s.inventoryActionStack, action],
          auditTrail: [...s.auditTrail, {
            id: generateId('audit'), entityType: 'inventory', entityId: id,
            action: 'updated', beforeValue: JSON.stringify(existing),
            afterValue: JSON.stringify(updatedUnit),
            timestamp: new Date().toISOString(),
            description: `Inventory unit ${id} updated: ${Object.keys(updates).join(', ')} [Stack PUSH]`,
          }],
        };
      }),
      deleteInventoryUnit: (id) => set((s) => {
        const existing = s.inventory.find((u) => u.id === id);
        if (!existing) return s;

        // Check if committed to active transfer
        const relatedActive = s.transfers.some(
          (t) => t.sourceUnitIds.includes(id) && ['approved', 'dispatched', 'in_transit'].includes(t.status)
        );
        if (relatedActive) {
          return s; // Protected: cannot delete a unit engaged in active transfer
        }

        const action: ReversibleAction = {
          id: generateId('act'),
          type: 'delete_unit',
          description: `Deleted unit ${id} (${existing.bloodType} ${existing.componentType})`,
          timestamp: new Date().toISOString(),
          unitId: id,
          previousUnit: existing,
          currentUnit: null,
        };

        return {
          inventory: s.inventory.filter((u) => u.id !== id),
          inventoryActionStack: [...s.inventoryActionStack, action],
          auditTrail: [...s.auditTrail, {
            id: generateId('audit'), entityType: 'inventory', entityId: id,
            action: 'deleted', beforeValue: JSON.stringify(existing), afterValue: null,
            timestamp: new Date().toISOString(), description: `Inventory unit ${id} deleted [Stack PUSH]`,
          }],
        };
      }),
      undoLastInventoryAction: () => {
        const state = get();
        if (state.inventoryActionStack.length === 0) {
          return { success: false, message: 'Undo stack is empty (underflow). No reversible actions to pop.' };
        }
        const lastAction = state.inventoryActionStack[state.inventoryActionStack.length - 1];
        const newStack = state.inventoryActionStack.slice(0, -1);

        // Safety enforcement: Do NOT silently reverse approved transfers or units committed to transfer
        const relatedTransfers = state.transfers.filter(
          (t) => t.sourceUnitIds.includes(lastAction.unitId) &&
            ['approved', 'dispatched', 'in_transit', 'arrived', 'received'].includes(t.status)
        );
        if (relatedTransfers.length > 0) {
          return {
            success: false,
            message: `Cannot undo edit on unit ${lastAction.unitId}: It is committed to approved transfer ${relatedTransfers[0].id}. Administrative stack cannot silently reverse transfer commitments.`,
          };
        }

        if (lastAction.type === 'update_unit' && lastAction.previousUnit) {
          set((s) => ({
            inventory: s.inventory.map((u) => u.id === lastAction.unitId ? lastAction.previousUnit! : u),
            inventoryActionStack: newStack,
            auditTrail: [...s.auditTrail, {
              id: generateId('audit'), entityType: 'inventory', entityId: lastAction.unitId,
              action: 'undo_stack_pop', beforeValue: JSON.stringify(lastAction.currentUnit),
              afterValue: JSON.stringify(lastAction.previousUnit),
              timestamp: new Date().toISOString(),
              description: `STACK POP (LIFO): Undid update on unit ${lastAction.unitId} — restored previous state`,
            }],
          }));
          return { success: true, message: `Reverted update on unit ${lastAction.unitId}` };
        } else if (lastAction.type === 'create_unit') {
          set((s) => ({
            inventory: s.inventory.filter((u) => u.id !== lastAction.unitId),
            inventoryActionStack: newStack,
            auditTrail: [...s.auditTrail, {
              id: generateId('audit'), entityType: 'inventory', entityId: lastAction.unitId,
              action: 'undo_stack_pop', beforeValue: JSON.stringify(lastAction.currentUnit),
              afterValue: null,
              timestamp: new Date().toISOString(),
              description: `STACK POP (LIFO): Undid creation of unit ${lastAction.unitId} — unit removed`,
            }],
          }));
          return { success: true, message: `Reverted creation of unit ${lastAction.unitId}` };
        } else if (lastAction.type === 'delete_unit' && lastAction.previousUnit) {
          set((s) => ({
            inventory: [...s.inventory, lastAction.previousUnit!],
            inventoryActionStack: newStack,
            auditTrail: [...s.auditTrail, {
              id: generateId('audit'), entityType: 'inventory', entityId: lastAction.unitId,
              action: 'undo_stack_pop', beforeValue: null,
              afterValue: JSON.stringify(lastAction.previousUnit),
              timestamp: new Date().toISOString(),
              description: `STACK POP (LIFO): Undid deletion of unit ${lastAction.unitId} — unit restored`,
            }],
          }));
          return { success: true, message: `Restored deleted unit ${lastAction.unitId}` };
        }

        return { success: false, message: 'Unrecognized action type in stack' };
      },
      clearInventoryActionStack: () => set({ inventoryActionStack: [] }),

      // Requests
      requests: [],
      addRequest: (req) => {
        const id = generateId('req');
        set((s) => ({
          requests: [...s.requests, { ...req, id, createdAt: new Date().toISOString(), status: 'pending' as const }],
          auditTrail: [...s.auditTrail, {
            id: generateId('audit'), entityType: 'request', entityId: id,
            action: 'created', beforeValue: null, afterValue: JSON.stringify({ ...req, id }),
            timestamp: new Date().toISOString(), description: `Request ${id} created`,
          }],
        }));
        return id;
      },
      updateRequest: (id, updates) => set((s) => ({
        requests: s.requests.map((r) => r.id === id ? { ...r, ...updates } : r),
      })),
      cancelRequest: (id) => set((s) => ({
        requests: s.requests.map((r) =>
          r.id === id && (r.status === 'pending' || r.status === 'processing')
            ? { ...r, status: 'cancelled' as RequestStatus }
            : r
        ),
        auditTrail: [...s.auditTrail, {
          id: generateId('audit'), entityType: 'request', entityId: id,
          action: 'cancelled', beforeValue: null, afterValue: null,
          timestamp: new Date().toISOString(), description: `Request ${id} cancelled`,
        }],
      })),

      // Transfers
      transfers: [],
      createTransfer: (transfer) => {
        const id = generateId('xfer');
        set((s) => ({
          transfers: [...s.transfers, { ...transfer, id, createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString() }],
          auditTrail: [...s.auditTrail, {
            id: generateId('audit'), entityType: 'transfer', entityId: id,
            action: 'created', beforeValue: null, afterValue: JSON.stringify(transfer),
            timestamp: new Date().toISOString(), description: `Transfer ${id} proposed`,
          }],
        }));
        return id;
      },
      updateTransfer: (id, updates) => set((s) => ({
        transfers: s.transfers.map((t) =>
          t.id === id ? { ...t, ...updates, lastUpdated: new Date().toISOString() } : t
        ),
      })),
      approveTransfer: (id) => {
        const state = get();
        const transfer = state.transfers.find((t) => t.id === id);
        if (!transfer || transfer.status !== 'proposed') return;

        // Reserve inventory — prevent double allocation
        const unitUpdates: InventoryUnit[] = state.inventory.map((u) => {
          if (transfer.sourceUnitIds.includes(u.id) && u.status === 'available') {
            return { ...u, status: 'reserved' as InventoryStatus, lastUpdated: new Date().toISOString() };
          }
          return u;
        });

        set({
          transfers: state.transfers.map((t) =>
            t.id === id ? { ...t, status: 'approved' as TransferStatus, approvedAt: new Date().toISOString(), lastUpdated: new Date().toISOString() } : t
          ),
          inventory: unitUpdates,
          auditTrail: [...state.auditTrail, {
            id: generateId('audit'), entityType: 'transfer', entityId: id,
            action: 'approved', beforeValue: 'proposed', afterValue: 'approved',
            timestamp: new Date().toISOString(), description: `Transfer ${id} approved — inventory reserved`,
          }],
        });
      },
      rejectTransfer: (id, reason) => set((s) => ({
        transfers: s.transfers.map((t) =>
          t.id === id ? { ...t, status: 'rejected' as TransferStatus, rejectionReason: reason, lastUpdated: new Date().toISOString() } : t
        ),
        auditTrail: [...s.auditTrail, {
          id: generateId('audit'), entityType: 'transfer', entityId: id,
          action: 'rejected', beforeValue: null, afterValue: reason,
          timestamp: new Date().toISOString(), description: `Transfer ${id} rejected: ${reason}`,
        }],
      })),

      // Alerts
      alerts: [],
      addAlert: (alert) => set((s) => ({
        alerts: [...s.alerts, { ...alert, id: generateId('alert'), createdAt: new Date().toISOString() }],
      })),
      markAlertRead: (id) => set((s) => ({
        alerts: s.alerts.map((a) => a.id === id ? { ...a, read: true } : a),
      })),
      resolveAlert: (id) => set((s) => ({
        alerts: s.alerts.map((a) => a.id === id ? { ...a, resolved: true, resolvedAt: new Date().toISOString() } : a),
      })),

      // Audit Trail
      auditTrail: [],
      addAuditEvent: (event) => set((s) => ({
        auditTrail: [...s.auditTrail, { ...event, id: generateId('audit'), timestamp: new Date().toISOString() }],
      })),

      // Drone Missions
      missions: [],
      addMission: (mission) => {
        const id = generateId('mission');
        set((s) => ({
          missions: [...s.missions, { ...mission, id, createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString() }],
        }));
        return id;
      },
      updateMission: (id, updates) => set((s) => ({
        missions: s.missions.map((m) =>
          m.id === id ? { ...m, ...updates, lastUpdated: new Date().toISOString() } : m
        ),
      })),

      // Expiry Thresholds
      expiryThresholds: DEFAULT_EXPIRY_THRESHOLDS,
      setExpiryThresholds: (thresholds) => set({ expiryThresholds: thresholds }),

      // Graph State
      graphState: DEFAULT_GRAPH,
      setGraphState: (state) => set({ graphState: state }),

      // Demo
      demoLoaded: false,
      loadDemoScenario: () => {
        set({
          bloodBanks: DEMO_BLOOD_BANKS,
          inventory: generateDemoInventory(),
          requests: generateDemoRequests(),
          alerts: generateDemoAlerts(),
          transfers: [],
          missions: [],
          auditTrail: [{
            id: generateId('audit'), entityType: 'system', entityId: 'demo',
            action: 'demo_loaded', beforeValue: null, afterValue: 'Demo scenario loaded',
            timestamp: new Date().toISOString(), description: 'Demo scenario loaded with sample data',
          }],
          graphState: DEFAULT_GRAPH,
          inventoryActionStack: [],
          demoLoaded: true,
          demoClockOffset: 0,
          expiryThresholds: DEFAULT_EXPIRY_THRESHOLDS,
          lastFeasibilityResults: [],
        });
      },
      resetDemo: () => {
        set({
          bloodBanks: DEMO_BLOOD_BANKS,
          inventory: generateDemoInventory(),
          requests: generateDemoRequests(),
          alerts: generateDemoAlerts(),
          transfers: [],
          missions: [],
          auditTrail: [{
            id: generateId('audit'), entityType: 'system', entityId: 'demo',
            action: 'demo_reset', beforeValue: null, afterValue: 'Demo data reset',
            timestamp: new Date().toISOString(), description: 'Demo scenario reset to initial state',
          }],
          graphState: DEFAULT_GRAPH,
          inventoryActionStack: [],
          demoLoaded: true,
          demoClockOffset: 0,
          lastFeasibilityResults: [],
        });
      },

      // Feasibility
      lastFeasibilityResults: [],
      setFeasibilityResults: (results) => set({ lastFeasibilityResults: results }),
    }),
    {
      name: 'blood-navigator-store',
      partialize: (state) => ({
        bloodBanks: state.bloodBanks,
        inventory: state.inventory,
        inventoryActionStack: state.inventoryActionStack,
        requests: state.requests,
        transfers: state.transfers,
        alerts: state.alerts,
        auditTrail: state.auditTrail,
        missions: state.missions,
        expiryThresholds: state.expiryThresholds,
        graphState: state.graphState,
        demoLoaded: state.demoLoaded,
        demoClockOffset: state.demoClockOffset,
      }),
    }
  )
);

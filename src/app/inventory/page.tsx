'use client';

import { useStore } from '@/lib/store';
import {
  Package, Plus, Search, Filter, Trash2, Undo2, Layers, Link as LinkIcon,
  Hash, ArrowUpDown, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Info, Sparkles,
  Droplets, Truck, ClockAlert, Binary, GitFork, ArrowRight, CornerDownRight
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { BLOOD_TYPES, COMPONENT_TYPES, InventoryUnit, BloodType, ComponentType } from '@/lib/types';
import {
  LinkedList, HashTable, linearSearch, binarySearch, interpolationSearch,
  bubbleSortBy, selectionSortBy, insertionSortBy, mergeSortBy, GenericSortResult,
  BinarySearchTree
} from '@/lib/dsa-engine';
import DsaUsedSection from '@/components/DsaUsedSection';

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours > 48) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${mins}m`;
}

type SortAlgo = 'merge' | 'insertion' | 'selection' | 'bubble';
type SortField = 'expiry' | 'remaining' | 'quantity' | 'id';

export default function InventoryPage() {
  const inventory = useStore((s) => s.inventory);
  const bloodBanks = useStore((s) => s.bloodBanks);
  const addInventoryUnit = useStore((s) => s.addInventoryUnit);
  const updateInventoryUnit = useStore((s) => s.updateInventoryUnit);
  const deleteInventoryUnit = useStore((s) => s.deleteInventoryUnit);
  const undoLastInventoryAction = useStore((s) => s.undoLastInventoryAction);
  const inventoryActionStack = useStore((s) => s.inventoryActionStack);
  const getNow = useStore((s) => s.getNow);
  const now = getNow();

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBank, setFilterBank] = useState('');

  // Sorting with DSA selection
  const [sortField, setSortField] = useState<SortField>('expiry');
  const [sortAlgo, setSortAlgo] = useState<SortAlgo>('insertion');

  // Forms & UI state
  const [showForm, setShowForm] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<'hashtable' | 'binary' | 'bst' | 'stack' | 'linkedlist'>('hashtable');
  const [undoNotice, setUndoNotice] = useState<{ message: string; success: boolean } | null>(null);

  // Hash Table state
  const [hashLookupKey, setHashLookupKey] = useState('');
  const [hashResultTrace, setHashResultTrace] = useState<any>(null);

  // Binary Search state
  const [binarySearchHours, setBinarySearchHours] = useState<string>('48');
  const [binarySearchResult, setBinarySearchResult] = useState<any>(null);

  // BST state (CO4)
  const [bstMinHours, setBstMinHours] = useState<string>('0');
  const [bstMaxHours, setBstMaxHours] = useState<string>('72');
  const [bstRangeResult, setBstRangeResult] = useState<any>(null);

  // Edit unit state
  const [editingUnit, setEditingUnit] = useState<InventoryUnit | null>(null);

  const [form, setForm] = useState({
    bloodBankId: '', componentType: 'Packed RBC' as ComponentType, bloodType: 'O+' as BloodType,
    collectionTimestamp: '', expiryTimestamp: '', quantity: '1', status: 'available' as const,
    storageTemp: '2-6°C', transportEligible: true,
  });

  // ─── DSA 1: Build Custom Hash Table for Fast ID Lookup ──────────────────────
  const inventoryHashTable = useMemo(() => {
    const table = new HashTable<string, InventoryUnit>(31);
    inventory.forEach((unit) => {
      table.insert(unit.id, unit);
    });
    return table;
  }, [inventory]);

  // ─── DSA 2: Build Node-based Linked List ────────────────────────────────────
  const inventoryLinkedList = useMemo(() => {
    const ll = new LinkedList<InventoryUnit>();
    inventory.slice(0, 15).forEach((unit) => {
      ll.insertAtTail(unit);
    });
    return ll;
  }, [inventory]);

  // ─── DSA 3: Binary Search Tree for Expiry Hierarchical Index (CO4) ──────────
  const inventoryBST = useMemo(() => {
    const tree = new BinarySearchTree<InventoryUnit>();
    inventory.forEach((unit) => {
      const remainingHours = Math.max(0, Math.round((new Date(unit.expiryTimestamp).getTime() - now) / 3600000));
      tree.insert(remainingHours, unit);
    });
    return tree;
  }, [inventory, now]);

  // ─── DSA 4: Sort Records with Selected Algorithm ────────────────────────────
  const { sortedItems, sortMetrics } = useMemo(() => {
    let items = [...inventory];

    // Filter stage
    if (search) {
      items = items.filter((u) => u.id.toLowerCase().includes(search.toLowerCase()) || u.bloodType.includes(search));
    }
    if (filterType) items = items.filter((u) => u.bloodType === filterType);
    if (filterStatus) items = items.filter((u) => u.status === filterStatus);
    if (filterBank) items = items.filter((u) => u.bloodBankId === filterBank);

    // Key extractor based on sortField
    const keyFn = (u: InventoryUnit): number => {
      if (sortField === 'expiry') return new Date(u.expiryTimestamp).getTime();
      if (sortField === 'remaining') return Math.max(0, new Date(u.expiryTimestamp).getTime() - now);
      if (sortField === 'quantity') return u.quantity;
      let code = 0;
      for (let i = 0; i < u.id.length; i++) code = (code * 31 + u.id.charCodeAt(i)) % 1000000;
      return code;
    };

    const tieBreaker = (a: InventoryUnit, b: InventoryUnit) => a.id.localeCompare(b.id);

    let result: GenericSortResult<InventoryUnit>;
    const descending = sortField === 'remaining' || sortField === 'quantity';

    switch (sortAlgo) {
      case 'bubble':
        result = bubbleSortBy(items, keyFn, tieBreaker, descending);
        break;
      case 'insertion':
        result = insertionSortBy(items, keyFn, tieBreaker, descending);
        break;
      case 'selection':
        result = selectionSortBy(items, keyFn, tieBreaker, descending);
        break;
      case 'merge':
      default:
        result = mergeSortBy(items, keyFn, tieBreaker, descending);
        break;
    }

    return {
      sortedItems: result.sorted,
      sortMetrics: {
        comparisons: result.comparisons,
        swaps: result.swaps,
        timeMs: Number(result.timeMs.toFixed(2)),
        algoName: result.algorithmName,
      },
    };
  }, [inventory, search, filterType, filterStatus, filterBank, sortField, sortAlgo, now]);

  // Execute Hash Table Lookup
  const handleExecuteHashLookup = (keyToSearch: string) => {
    const key = keyToSearch.trim();
    if (!key) return;

    const lookupRes = inventoryHashTable.lookup(key);
    const hashIndex = inventoryHashTable.computeHash(key);

    setHashResultTrace({
      target: key,
      found: lookupRes.found,
      unit: lookupRes.value,
      bucketIndex: lookupRes.bucketIndex,
      computedHash: hashIndex,
      comparisons: lookupRes.comparisons,
      capacity: inventoryHashTable.capacity,
    });
  };

  // Execute Binary Search over Inventory pre-sorted by Expiry Date
  const handleExecuteBinarySearch = (targetHoursStr: string) => {
    const targetHours = parseFloat(targetHoursStr);
    if (isNaN(targetHours)) return;

    // 1. Ensure records are sorted by remaining expiry hours ascending
    const sortedByExpiry = [...inventory].sort((a, b) => {
      const remA = Math.max(0, (new Date(a.expiryTimestamp).getTime() - now) / 3600000);
      const remB = Math.max(0, (new Date(b.expiryTimestamp).getTime() - now) / 3600000);
      return remA - remB;
    });

    const hoursArr = sortedByExpiry.map((u) => Math.round(Math.max(0, (new Date(u.expiryTimestamp).getTime() - now) / 3600000)));

    // 2. Perform Binary Search
    let low = 0;
    let high = hoursArr.length - 1;
    let comparisons = 0;
    let foundIndex = -1;
    const steps: { low: number; high: number; mid: number; midValue: number; comparison: string }[] = [];

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      comparisons++;
      const midVal = hoursArr[mid];

      if (midVal === targetHours) {
        steps.push({
          low, high, mid, midValue: midVal,
          comparison: `arr[${mid}] = ${midVal}h == ${targetHours}h (Match Found ✓)`
        });
        foundIndex = mid;
        break;
      } else if (midVal < targetHours) {
        steps.push({
          low, high, mid, midValue: midVal,
          comparison: `arr[${mid}] = ${midVal}h < ${targetHours}h → search RIGHT [${mid + 1}..${high}]`
        });
        low = mid + 1;
      } else {
        steps.push({
          low, high, mid, midValue: midVal,
          comparison: `arr[${mid}] = ${midVal}h > ${targetHours}h → search LEFT [${low}..${mid - 1}]`
        });
        high = mid - 1;
      }
    }

    setBinarySearchResult({
      targetHours,
      found: foundIndex !== -1,
      unit: foundIndex !== -1 ? sortedByExpiry[foundIndex] : null,
      comparisons,
      steps,
      sortedSample: sortedByExpiry.slice(0, 8).map((u) => ({
        id: u.id,
        hours: Math.round(Math.max(0, (new Date(u.expiryTimestamp).getTime() - now) / 3600000)),
      })),
    });
  };

  // Execute BST Range Query (CO4)
  const handleExecuteBSTRange = () => {
    const minH = parseFloat(bstMinHours) || 0;
    const maxH = parseFloat(bstMaxHours) || 72;
    const res = inventoryBST.rangeSearch(minH, maxH);
    const minUnit = inventoryBST.findMin();
    const maxUnit = inventoryBST.findMax();

    setBstRangeResult({
      minH,
      maxH,
      items: res.items,
      nodesVisited: res.nodesVisited,
      steps: res.steps,
      earliestExpiringHours: minUnit?.key,
      earliestExpiringUnit: minUnit?.items[0],
      furthestExpiringHours: maxUnit?.key,
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const id = addInventoryUnit({
      bloodBankId: form.bloodBankId,
      componentType: form.componentType,
      bloodType: form.bloodType,
      collectionTimestamp: form.collectionTimestamp || new Date().toISOString(),
      expiryTimestamp: form.expiryTimestamp || new Date(Date.now() + 168 * 3600000).toISOString(),
      quantity: parseInt(form.quantity) || 1,
      status: form.status,
      storageTemp: form.storageTemp,
      transportEligible: form.transportEligible,
    });
    if (id) {
      setUndoNotice({ message: `Unit ${id} created and pushed to Action Stack (LIFO)`, success: true });
    }
    setShowForm(false);
  };

  const handleUndo = () => {
    const result = undoLastInventoryAction();
    setUndoNotice(result);
  };

  const handleQuickEditSave = () => {
    if (!editingUnit) return;
    updateInventoryUnit(editingUnit.id, {
      status: editingUnit.status,
      storageTemp: editingUnit.storageTemp,
      transportEligible: editingUnit.transportEligible,
      quantity: editingUnit.quantity,
    });
    setUndoNotice({ message: `Saved edit on unit ${editingUnit.id} (Pushed to Stack)`, success: true });
    setEditingUnit(null);
  };

  const getBankName = (id: string) => bloodBanks.find((b) => b.id === id)?.name || id;

  const latestStackAction = inventoryActionStack.length > 0
    ? inventoryActionStack[inventoryActionStack.length - 1]
    : null;

  // Key metrics
  const totalUnitsCount = useMemo(() => inventory.reduce((acc, u) => acc + u.quantity, 0), [inventory]);
  const availableUnitsCount = useMemo(() => inventory.filter((u) => u.status === 'available').reduce((acc, u) => acc + u.quantity, 0), [inventory]);
  const inTransitCount = useMemo(() => inventory.filter((u) => u.status === 'in_transit' || u.status === 'reserved').reduce((acc, u) => acc + u.quantity, 0), [inventory]);
  const atRiskCount = useMemo(() => {
    return inventory.filter((u) => {
      const remaining = new Date(u.expiryTimestamp).getTime() - now;
      return remaining <= 48 * 3600000;
    }).reduce((acc, u) => acc + u.quantity, 0);
  }, [inventory, now]);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Blood Inventory</h1>
          <p>Search, inspect, and manage facility blood units with real-time viability and reversible change tracking.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={handleUndo}
            disabled={inventoryActionStack.length === 0}
            title={latestStackAction ? `Undo: ${latestStackAction.description}` : 'Stack is empty'}
          >
            <Undo2 size={16} />
            Undo Last Change {inventoryActionStack.length > 0 && `(${inventoryActionStack.length})`}
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> Add Unit
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* ─── Key Operational Metrics ─────────────────────────────────────── */}
        <div className="inventory-summary-grid">
          <div className="inventory-summary-card">
            <div className="inventory-card-icon-box" style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171' }}>
              <Droplets size={18} />
            </div>
            <div className="inventory-card-label">Total Units in Network</div>
            <div className="inventory-card-value" style={{ color: '#f1f5f9' }}>{totalUnitsCount}</div>
            <div className="inventory-card-desc">{inventory.length} distinct batch records</div>
          </div>

          <div className="inventory-summary-card">
            <div className="inventory-card-icon-box" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399' }}>
              <CheckCircle size={18} />
            </div>
            <div className="inventory-card-label">Available Stock</div>
            <div className="inventory-card-value" style={{ color: '#34d399' }}>{availableUnitsCount}</div>
            <div className="inventory-card-desc">Ready for release or transfer</div>
          </div>

          <div className="inventory-summary-card">
            <div className="inventory-card-icon-box" style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#60a5fa' }}>
              <Truck size={18} />
            </div>
            <div className="inventory-card-label">In Transit / Reserved</div>
            <div className="inventory-card-value" style={{ color: inTransitCount > 0 ? '#60a5fa' : '#cbd5e1' }}>{inTransitCount}</div>
            <div className="inventory-card-desc">En-route or locked for request</div>
          </div>

          <div className={`inventory-summary-card ${atRiskCount > 0 ? 'card-urgent' : ''}`}>
            <div className="inventory-card-icon-box" style={{ background: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220, 38, 38, 0.35)', color: '#f87171' }}>
              <ClockAlert size={18} />
            </div>
            <div className="inventory-card-label">Expiring Soon (≤48h)</div>
            <div className="inventory-card-value" style={{ color: atRiskCount > 0 ? '#f87171' : '#94a3b8' }}>{atRiskCount}</div>
            <div className="inventory-card-desc">Urgent candidate units</div>
          </div>
        </div>

        {/* Undo Notification Banner */}
        {undoNotice && (
          <div
            className="card"
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              borderLeft: `4px solid ${undoNotice.success ? 'var(--color-success)' : 'var(--color-danger)'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              {undoNotice.success ? <CheckCircle size={18} color="var(--color-success)" /> : <AlertCircle size={18} color="var(--color-danger)" />}
              <span>{undoNotice.message}</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setUndoNotice(null)}>Dismiss</button>
          </div>
        )}

        {/* ─── INTERACTIVE DSA STORAGE & RETRIEVAL WORKSPACE ─────────────────── */}
        <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(220, 38, 38, 0.3)', background: 'linear-gradient(180deg, rgba(13, 17, 29, 0.98) 0%, rgba(5, 8, 16, 0.95) 100%)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="var(--color-primary)" />
              <h2 style={{ fontSize: 14, margin: 0, fontWeight: 700, color: '#f1f5f9' }}>
                DSA Storage &amp; Retrieval Engine
              </h2>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                &mdash; Direct interactive verification of Hash Table, Binary Search, BST (CO4), and Undo Stack
              </span>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${inspectorTab === 'hashtable' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInspectorTab('hashtable')}
                style={{ fontSize: 11 }}
              >
                <Hash size={13} /> Hash Table (Key Lookup)
              </button>
              <button
                className={`btn btn-sm ${inspectorTab === 'binary' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInspectorTab('binary')}
                style={{ fontSize: 11 }}
              >
                <Binary size={13} /> Binary Search (Expiry)
              </button>
              <button
                className={`btn btn-sm ${inspectorTab === 'bst' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInspectorTab('bst')}
                style={{ fontSize: 11 }}
              >
                <GitFork size={13} /> Tree Index (CO4 Range)
              </button>
              <button
                className={`btn btn-sm ${inspectorTab === 'stack' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInspectorTab('stack')}
                style={{ fontSize: 11 }}
              >
                <Layers size={13} /> Stack (Undo Frame: {inventoryActionStack.length})
              </button>
            </div>
          </div>

          <div className="card-body" style={{ padding: '16px' }}>
            {/* 1. HASH TABLE RETRIEVAL */}
            {inspectorTab === 'hashtable' && (
              <div>
                <div style={{ fontSize: 12, marginBottom: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                  <strong style={{ color: '#f87171' }}>Hash Table &mdash; Key-Based Inventory Storage &amp; Retrieval:</strong> Units are stored and indexed by unique unit ID (e.g., <code>{inventory[0]?.id || 'inv-1'}</code>) across {inventoryHashTable.capacity} separate-chaining buckets using a polynomial rolling hash function. Demonstrates $O(1)$ key lookup, missing key rejection, and duplicate collision resolution.
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    className="form-input"
                    placeholder="Enter Unit ID (e.g. inv-bb1-01)..."
                    value={hashLookupKey}
                    onChange={(e) => setHashLookupKey(e.target.value)}
                    style={{ maxWidth: 260 }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => handleExecuteHashLookup(hashLookupKey || (inventory[0]?.id ?? ''))}>
                    <Search size={13} /> Retrieve by Key
                  </button>
                  {inventory.length > 0 && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const sampleId = inventory[0].id;
                        setHashLookupKey(sampleId);
                        handleExecuteHashLookup(sampleId);
                      }}
                    >
                      Sample Existing Key ({inventory[0].id})
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const missingId = 'inv-missing-999';
                      setHashLookupKey(missingId);
                      handleExecuteHashLookup(missingId);
                    }}
                  >
                    Test Missing Key (inv-missing-999)
                  </button>
                </div>

                {hashResultTrace && (
                  <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 10 }}>
                      <div><span style={{ color: '#94a3b8', fontSize: 11 }}>Target Key:</span> <code style={{ color: '#38bdf8' }}>{hashResultTrace.target}</code></div>
                      <div><span style={{ color: '#94a3b8', fontSize: 11 }}>Polynomial Hash:</span> <code>{hashResultTrace.computedHash}</code></div>
                      <div><span style={{ color: '#94a3b8', fontSize: 11 }}>Bucket Index:</span> <code>#{hashResultTrace.bucketIndex} / {hashResultTrace.capacity}</code></div>
                      <div><span style={{ color: '#94a3b8', fontSize: 11 }}>Comparisons:</span> <strong>{hashResultTrace.comparisons}</strong></div>
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: 11 }}>Status:</span>{' '}
                        {hashResultTrace.found ? (
                          <span className="badge badge-normal" style={{ fontSize: 11 }}>Found ✓</span>
                        ) : (
                          <span className="badge badge-critical" style={{ fontSize: 11 }}>Missing Key (Not Found ✗)</span>
                        )}
                      </div>
                    </div>

                    {hashResultTrace.found && hashResultTrace.unit ? (
                      <div style={{ marginTop: 10, padding: 12, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#34d399', marginBottom: 6 }}>
                          Retrieved Inventory Record:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: 12 }}>
                          <div><strong>Unit ID:</strong> {hashResultTrace.unit.id}</div>
                          <div><strong>Group &amp; Type:</strong> <span className="badge badge-info">{hashResultTrace.unit.bloodType}</span> {hashResultTrace.unit.componentType}</div>
                          <div><strong>Quantity:</strong> {hashResultTrace.unit.quantity} units</div>
                          <div><strong>Status:</strong> <span className={`badge badge-${hashResultTrace.unit.status}`}>{hashResultTrace.unit.status}</span></div>
                          <div><strong>Blood Bank:</strong> {getBankName(hashResultTrace.unit.bloodBankId)}</div>
                          <div><strong>Remaining Time:</strong> {formatTimeRemaining(new Date(hashResultTrace.unit.expiryTimestamp).getTime() - now)}</div>
                          <div><strong>Storage Temp:</strong> {hashResultTrace.unit.storageTemp}</div>
                          <div><strong>Transport Eligible:</strong> {hashResultTrace.unit.transportEligible ? 'Yes (Drone/Ground)' : 'No'}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 10, padding: 10, background: 'rgba(220, 38, 38, 0.06)', border: '1px solid rgba(220, 38, 38, 0.25)', borderRadius: 6, fontSize: 12, color: '#fca5a5' }}>
                        <strong>Missing Key Handling:</strong> Key <code>{hashResultTrace.target}</code> does not exist in bucket #{hashResultTrace.bucketIndex}. Hash table resolved lookup safely after {hashResultTrace.comparisons} bucket scan comparison(s) without runtime exceptions.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. BINARY SEARCH RETRIEVAL */}
            {inspectorTab === 'binary' && (
              <div>
                <div style={{ fontSize: 12, marginBottom: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                  <strong style={{ color: '#38bdf8' }}>Binary Search &mdash; Retrieval from Sorted Inventory:</strong> Inventory records are pre-sorted by remaining shelf life (hours until expiry). Binary search probes logarithmic midpoints ($O(\log n)$) to locate exact expiry matches, halving the search space at each comparison.
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Target Expiry (Hours):</span>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="e.g. 48"
                      value={binarySearchHours}
                      onChange={(e) => setBinarySearchHours(e.target.value)}
                      style={{ width: 100 }}
                    />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => handleExecuteBinarySearch(binarySearchHours)}>
                    <Binary size={13} /> Binary Search Expiry
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setBinarySearchHours('18'); handleExecuteBinarySearch('18'); }}>
                    Test 18h
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setBinarySearchHours('999'); handleExecuteBinarySearch('999'); }}>
                    Test Missing (999h)
                  </button>
                </div>

                {binarySearchResult && (
                  <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontSize: 12 }}>
                        Target: <strong>{binarySearchResult.targetHours} hours</strong> | Total Comparisons: <strong>{binarySearchResult.comparisons}</strong> (Logarithmic Bound: &le; {Math.ceil(Math.log2(inventory.length || 1)) + 1})
                      </div>
                      <div>
                        {binarySearchResult.found ? (
                          <span className="badge badge-normal">Match Found ✓</span>
                        ) : (
                          <span className="badge badge-critical">Not Found (Terminated low &gt; high)</span>
                        )}
                      </div>
                    </div>

                    {/* Step-by-step low / mid / high trace */}
                    <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Binary Search Midpoint Probes:</span>
                      {binarySearchResult.steps.map((st: any, i: number) => (
                        <div key={i} style={{ fontFamily: 'monospace', fontSize: 11, background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: 4, color: '#e2e8f0' }}>
                          Step {i + 1}: Range [{st.low}..{st.high}] &rarr; Probe mid={st.mid} ({st.midValue}h) &mdash; {st.comparison}
                        </div>
                      ))}
                    </div>

                    {binarySearchResult.found && binarySearchResult.unit ? (
                      <div style={{ padding: 10, background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 6, fontSize: 12 }}>
                        <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>Matched Inventory Unit:</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6 }}>
                          <div><strong>ID:</strong> {binarySearchResult.unit.id}</div>
                          <div><strong>Type:</strong> {binarySearchResult.unit.bloodType} {binarySearchResult.unit.componentType}</div>
                          <div><strong>Quantity:</strong> {binarySearchResult.unit.quantity}</div>
                          <div><strong>Facility:</strong> {getBankName(binarySearchResult.unit.bloodBankId)}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: 8, background: 'rgba(220, 38, 38, 0.05)', borderRadius: 4, fontSize: 11, color: '#f87171' }}>
                        No inventory batch has an exact remaining shelf-life of {binarySearchResult.targetHours} hours. Pre-sorted binary scan proved absence in {binarySearchResult.comparisons} comparisons without full $O(n)$ sequential scanning.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. BST RANGE INDEX (CO4) */}
            {inspectorTab === 'bst' && (
              <div>
                <div style={{ fontSize: 12, marginBottom: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                  <strong style={{ color: '#10b981' }}>Course Outcome CO4 &mdash; Binary Search Tree (BST) Expiry Indexing:</strong> Each blood unit is inserted into a hierarchical Binary Search Tree keyed by remaining shelf life. Unlike an unsorted list or linear scan, the BST prunes entire subtrees outside the target clinical time window $[min, max]$, allowing $O(\log n + k)$ range retrieval of near-expiry inventory.
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Min Hours:</span>
                    <input className="form-input" type="number" value={bstMinHours} onChange={(e) => setBstMinHours(e.target.value)} style={{ width: 80 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Max Hours:</span>
                    <input className="form-input" type="number" value={bstMaxHours} onChange={(e) => setBstMaxHours(e.target.value)} style={{ width: 80 }} />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleExecuteBSTRange}>
                    <GitFork size={13} /> Execute BST Range Query
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setBstMinHours('0'); setBstMaxHours('48'); handleExecuteBSTRange(); }}>
                    Critical Window [0h .. 48h]
                  </button>
                </div>

                {bstRangeResult && (
                  <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 10, fontSize: 12 }}>
                      <div>Range: <strong>[{bstRangeResult.minH}h .. {bstRangeResult.maxH}h]</strong></div>
                      <div>Nodes Evaluated: <strong>{bstRangeResult.nodesVisited}</strong></div>
                      <div>Units Matched in Range: <strong style={{ color: 'var(--color-success)' }}>{bstRangeResult.items.length}</strong></div>
                      <div>Tree Earliest Expiring: <strong style={{ color: '#f87171' }}>{bstRangeResult.earliestExpiringHours}h</strong></div>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Subtree Pruning Execution Steps:</span>
                      <div style={{ maxHeight: 120, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 4, fontFamily: 'monospace', fontSize: 10, marginTop: 4 }}>
                        {bstRangeResult.steps.slice(0, 10).map((st: string, idx: number) => (
                          <div key={idx} style={{ color: st.includes('COLLECT') ? '#34d399' : '#94a3b8' }}>{st}</div>
                        ))}
                      </div>
                    </div>

                    {bstRangeResult.items.length > 0 && (
                      <div style={{ fontSize: 11, color: '#cbd5e1' }}>
                        Matched Units in Window:{' '}
                        {bstRangeResult.items.slice(0, 5).map((u: InventoryUnit) => (
                          <span key={u.id} className="badge badge-info" style={{ marginRight: 4, fontSize: 10 }}>
                            {u.id} ({u.bloodType} {u.componentType})
                          </span>
                        ))}
                        {bstRangeResult.items.length > 5 && <span>+{bstRangeResult.items.length - 5} more</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 4. STACK ACTION HISTORY */}
            {inspectorTab === 'stack' && (
              <div>
                <div style={{ fontSize: 12, marginBottom: 10, color: '#cbd5e1', lineHeight: 1.5 }}>
                  <strong style={{ color: '#f87171' }}>Stack &mdash; Undo Inventory Changes (LIFO):</strong> Every reversible inventory action (create unit, edit unit, delete unit) pushes an operation snapshot onto the action stack. Popping from the top of the stack restores the exact previous state in the persistent application store.
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleUndo} disabled={inventoryActionStack.length === 0}>
                    <Undo2 size={13} /> Pop Stack &amp; Undo Last Action
                  </button>
                  <span style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                    Current Stack Depth: <strong>{inventoryActionStack.length}</strong>
                  </span>
                </div>

                {inventoryActionStack.length === 0 ? (
                  <div style={{ padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: 12, color: '#94a3b8' }}>
                    Action stack is currently empty. Add or edit an inventory unit to push reversible frames.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                    {inventoryActionStack.slice().reverse().map((act, index) => (
                      <div
                        key={act.id}
                        style={{
                          padding: '8px 12px',
                          background: index === 0 ? 'rgba(220, 38, 38, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          borderRadius: 6,
                          borderLeft: index === 0 ? '3px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 12,
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, marginRight: 8, color: index === 0 ? '#f87171' : '#94a3b8' }}>
                            {index === 0 ? 'TOP [NEXT TO POP]' : `FRAME [${inventoryActionStack.length - index - 1}]`}:
                          </span>
                          <span>{act.description}</span>
                          <span style={{ fontSize: 10, color: '#64748b', marginLeft: 8 }}>Unit: {act.unitId}</span>
                        </div>
                        <div style={{ color: '#64748b', fontSize: 11 }}>{new Date(act.timestamp).toLocaleTimeString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Sorting & Filter Toolbar ─────────────────────────────────────── */}
        <div className="toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <input
              className="form-input"
              placeholder="Filter by ID or blood type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 220 }}
            />
          </div>

          <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: 110 }}>
            <option value="">All Types</option>
            {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 130 }}>
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="quarantined">Quarantined</option>
            <option value="expired">Expired</option>
            <option value="in_transit">In Transit</option>
          </select>

          <select className="form-select" value={filterBank} onChange={(e) => setFilterBank(e.target.value)} style={{ width: 170 }}>
            <option value="">All Banks</option>
            {bloodBanks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          {/* Integrated Sorting Algorithm Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <select
              className="form-select"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              style={{ width: 160 }}
            >
              <option value="expiry">Sort: Expiry Date</option>
              <option value="remaining">Sort: Remaining Shelf-Life</option>
              <option value="quantity">Sort: Quantity</option>
              <option value="id">Sort: Unit ID</option>
            </select>

            <select
              className="form-select"
              value={sortAlgo}
              onChange={(e) => setSortAlgo(e.target.value as SortAlgo)}
              style={{ width: 190 }}
            >
              <option value="bubble">Algo: Bubble Sort (O(n²))</option>
              <option value="insertion">Algo: Insertion Sort (O(n²))</option>
              <option value="selection">Algo: Selection Sort (O(n²))</option>
              <option value="merge">Algo: Merge Sort (O(n log n))</option>
            </select>
          </div>
        </div>

        {/* Sorting Execution Metrics Badge */}
        {sortMetrics && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
            <span className="badge badge-info" style={{ fontSize: 10 }}>{sortMetrics.algoName}</span>
            <span>
              Criterion: <strong>{sortField}</strong> | Reordered <strong>{sortedItems.length}</strong> records in {sortMetrics.timeMs}ms ({sortMetrics.comparisons.toLocaleString()} comparisons, {sortMetrics.swaps.toLocaleString()} swaps/shifts)
            </span>
            <span>&bull; Tie-breaking rule: Deterministic unit ID</span>
          </div>
        )}

        {/* ─── Add Unit Form ────────────────────────────────────────────────── */}
        {showForm && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h2>Add Inventory Unit (Pushes to Stack)</h2></div>
            <div className="card-body">
              <form onSubmit={handleAdd}>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Blood Bank</label>
                    <select className="form-select" value={form.bloodBankId} onChange={(e) => setForm({ ...form, bloodBankId: e.target.value })} required>
                      <option value="">Select...</option>
                      {bloodBanks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood Type</label>
                    <select className="form-select" value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value as BloodType })}>
                      {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Component</label>
                    <select className="form-select" value={form.componentType} onChange={(e) => setForm({ ...form, componentType: e.target.value as ComponentType })}>
                      {COMPONENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input className="form-input" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expiry (hours from now)</label>
                    <input className="form-input" type="number" placeholder="e.g. 48" onChange={(e) => setForm({ ...form, expiryTimestamp: new Date(Date.now() + parseInt(e.target.value || '168') * 3600000).toISOString() })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Storage Temp</label>
                    <input className="form-input" value={form.storageTemp} onChange={(e) => setForm({ ...form, storageTemp: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button type="submit" className="btn btn-primary">Add Unit &amp; Push to Stack</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── Quick Edit Unit Modal ────────────────────────────────────────── */}
        {editingUnit && (
          <div className="card" style={{ marginBottom: 20, border: '1px solid var(--color-primary)' }}>
            <div className="card-header">
              <h2>Edit Unit {editingUnit.id} (Reversible Action)</h2>
            </div>
            <div className="card-body">
              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={editingUnit.status}
                    onChange={(e) => setEditingUnit({ ...editingUnit, status: e.target.value as any })}
                  >
                    <option value="available">available</option>
                    <option value="reserved">reserved</option>
                    <option value="quarantined">quarantined</option>
                    <option value="expired">expired</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={editingUnit.quantity}
                    onChange={(e) => setEditingUnit({ ...editingUnit, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Storage Temp</label>
                  <input
                    className="form-input"
                    value={editingUnit.storageTemp}
                    onChange={(e) => setEditingUnit({ ...editingUnit, storageTemp: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary btn-sm" onClick={handleQuickEditSave}>
                  Save &amp; Push to Stack
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditingUnit(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Inventory Table ──────────────────────────────────────────────── */}
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unit ID</th>
                  <th>Facility</th>
                  <th>Group</th>
                  <th>Component</th>
                  <th>Qty</th>
                  <th>Expiry Date</th>
                  <th>Time Remaining</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((u) => {
                  const remainingMs = new Date(u.expiryTimestamp).getTime() - now;
                  const isNear = remainingMs <= 48 * 3600000 && remainingMs > 0;
                  const isExp = remainingMs <= 0;
                  return (
                    <tr key={u.id} style={{ background: isExp ? 'rgba(220, 38, 38, 0.05)' : isNear ? 'rgba(245, 158, 11, 0.04)' : undefined }}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        <strong>{u.id}</strong>
                      </td>
                      <td style={{ fontSize: 12 }}>{getBankName(u.bloodBankId)}</td>
                      <td><span className="badge badge-info">{u.bloodType}</span></td>
                      <td style={{ fontSize: 12 }}>{u.componentType}</td>
                      <td style={{ fontWeight: 600 }}>{u.quantity}</td>
                      <td style={{ fontSize: 12 }}>{new Date(u.expiryTimestamp).toLocaleDateString()} {new Date(u.expiryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>
                        <span className={`badge ${isExp ? 'badge-critical' : isNear ? 'badge-warning' : 'badge-normal'}`}>
                          {formatTimeRemaining(remainingMs)}
                        </span>
                      </td>
                      <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditingUnit(u)}
                            style={{ fontSize: 11, padding: '2px 8px' }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              deleteInventoryUnit(u.id);
                              setUndoNotice({ message: `Deleted unit ${u.id} (Pushed to Stack)`, success: true });
                            }}
                            style={{ fontSize: 11, padding: '2px 8px' }}
                            title="Delete unit (Reversible via Undo)"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sortedItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty-state">
                      <p>No inventory units match filter criteria</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── DSA USED ON THIS PAGE ────────────────────────────────────────── */}
        <DsaUsedSection
          pageContext="Inventory storage, retrieval, sorting, undo mechanics, and hierarchical expiry indexing"
          items={[
            {
              name: 'Hash Table',
              purpose: 'Key-based inventory storage and constant-time record retrieval.',
              application: 'Indexes all inventory units by unique batch ID with separate chaining for collision resolution.',
              timeComplexity: 'O(1) average lookup/insert; O(n) worst case with hash collisions.',
            },
            {
              name: 'Binary Search',
              purpose: 'Logarithmic retrieval from sorted inventory records.',
              application: 'Searches pre-sorted inventory by remaining shelf life, halving candidate ranges via low/mid/high probes.',
              timeComplexity: 'O(log n); requires pre-sorted input.',
            },
            {
              name: 'Bubble Sort',
              purpose: 'Comparison-based inventory ordering.',
              application: 'Reorders blood units by expiry date or quantity via adjacent pairwise comparisons and swaps.',
              timeComplexity: 'O(n²) worst/average; O(n) best case on nearly sorted data.',
            },
            {
              name: 'Insertion Sort',
              purpose: 'Incremental inventory ordering.',
              application: 'Builds sorted sequence by shifting larger elements to insert each unit into its correct position.',
              timeComplexity: 'O(n²) worst/average; O(n) best case on partially sorted data.',
            },
            {
              name: 'Stack',
              purpose: 'Reversible inventory change history (undo mechanism).',
              application: 'LIFO frames of create/update/delete actions with pre-image snapshots; pop restores previous state.',
              timeComplexity: 'O(1) push and pop.',
            },
            {
              name: 'Binary Search Tree (BST)',
              purpose: 'Hierarchical expiry indexing and range query (CO4).',
              application: 'Indexes units by expiry timestamp; supports range queries for critical clinical windows ([0h–48h]) by pruning subtrees.',
              timeComplexity: 'O(log n) average insert/search; O(log n + k) range query for k results.',
            },
          ]}
        />
      </div>
    </>
  );
}

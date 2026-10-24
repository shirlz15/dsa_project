'use client';

import { useStore } from '@/lib/store';
import {
  Package, Plus, Search, Filter, Trash2, Undo2, Layers, Link as LinkIcon,
  Hash, ArrowUpDown, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Info, Sparkles
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { BLOOD_TYPES, COMPONENT_TYPES, InventoryUnit, BloodType, ComponentType } from '@/lib/types';
import {
  LinkedList, HashTable, linearSearch, binarySearch, interpolationSearch,
  bubbleSortBy, selectionSortBy, insertionSortBy, mergeSortBy, GenericSortResult
} from '@/lib/dsa-engine';

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
  const [sortAlgo, setSortAlgo] = useState<SortAlgo>('merge');

  // Forms & UI state
  const [showForm, setShowForm] = useState(false);
  const [showDsaInspector, setShowDsaInspector] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<'stack' | 'linkedlist' | 'hashtable' | 'searches'>('stack');
  const [undoNotice, setUndoNotice] = useState<{ message: string; success: boolean } | null>(null);

  // Search inspection states
  const [searchAlgo, setSearchAlgo] = useState<'linear' | 'binary' | 'interpolation' | 'hash'>('hash');
  const [targetQuery, setTargetQuery] = useState('');
  const [searchTrace, setSearchTrace] = useState<any>(null);

  // Edit unit state
  const [editingUnit, setEditingUnit] = useState<InventoryUnit | null>(null);

  const [form, setForm] = useState({
    bloodBankId: '', componentType: 'Packed RBC' as ComponentType, bloodType: 'O+' as BloodType,
    collectionTimestamp: '', expiryTimestamp: '', quantity: '1', status: 'available' as const,
    storageTemp: '2-6°C', transportEligible: true,
  });

  // ─── DSA 1: Build Custom Hash Table for Fast Lookup ─────────────────────────
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
    // Insert units into linked list
    inventory.slice(0, 20).forEach((unit) => {
      ll.insertAtTail(unit);
    });
    return ll;
  }, [inventory]);

  // ─── DSA 3: Sort Records with Selected Algorithm ────────────────────────────
  const { sortedItems, sortMetrics } = useMemo(() => {
    let items = [...inventory];

    // Filter stage
    if (search && searchAlgo !== 'hash') {
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
      // Numeric hash code of ID for numeric sorting
      let code = 0;
      for (let i = 0; i < u.id.length; i++) code = (code * 31 + u.id.charCodeAt(i)) % 1000000;
      return code;
    };

    // Deterministic tie-breaker by unit ID string comparison
    const tieBreaker = (a: InventoryUnit, b: InventoryUnit) => a.id.localeCompare(b.id);

    let result: GenericSortResult<InventoryUnit>;
    const descending = sortField === 'remaining' || sortField === 'quantity';

    switch (sortAlgo) {
      case 'bubble':
        result = bubbleSortBy(items, keyFn, tieBreaker, descending);
        break;
      case 'selection':
        result = selectionSortBy(items, keyFn, tieBreaker, descending);
        break;
      case 'insertion':
        result = insertionSortBy(items, keyFn, tieBreaker, descending);
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
        timeMs: Number(result.timeMs.toFixed(2)),
        algoName: result.algorithmName,
      },
    };
  }, [inventory, search, searchAlgo, filterType, filterStatus, filterBank, sortField, sortAlgo, now]);

  // Execute Search Algorithms for Demonstrations
  const handleExecuteSearch = (queryId: string) => {
    const target = queryId.trim();
    if (!target) return;

    if (searchAlgo === 'hash') {
      const hashResult = inventoryHashTable.lookup(target);
      const computedHash = inventoryHashTable.computeHash(target);
      setSearchTrace({
        type: 'Hash Table Lookup',
        target,
        found: hashResult.found,
        unit: hashResult.value,
        bucketIndex: hashResult.bucketIndex,
        computedHash,
        comparisons: hashResult.comparisons,
        complexity: 'O(1) average lookup via separate chaining',
      });
    } else if (searchAlgo === 'linear') {
      // Linear search on unsorted unit IDs
      const ids = inventory.map((u) => u.id);
      let comparisons = 0;
      let foundIndex = -1;
      const examinedSteps: string[] = [];

      for (let i = 0; i < ids.length; i++) {
        comparisons++;
        examinedSteps.push(`Step ${i + 1}: Check [${i}] ${ids[i]}`);
        if (ids[i] === target || ids[i].toLowerCase().includes(target.toLowerCase())) {
          foundIndex = i;
          break;
        }
      }

      setSearchTrace({
        type: 'Linear Search (Sequential Scan)',
        target,
        found: foundIndex !== -1,
        unit: foundIndex !== -1 ? inventory[foundIndex] : null,
        comparisons,
        steps: examinedSteps.slice(-5),
        totalExamined: comparisons,
        complexity: 'O(n) worst/avg case, traversing unsorted elements',
      });
    } else if (searchAlgo === 'binary') {
      // Binary search over sorted unit IDs
      const sortedByUnit = [...inventory].sort((a, b) => a.id.localeCompare(b.id));
      let low = 0;
      let high = sortedByUnit.length - 1;
      let comparisons = 0;
      let foundIndex = -1;
      const traceSteps: string[] = [];

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        comparisons++;
        const midId = sortedByUnit[mid].id;
        traceSteps.push(`Range [${low}..${high}] -> Probe mid=${mid} ('${midId}')`);

        if (midId === target) {
          foundIndex = mid;
          break;
        } else if (midId < target) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      setSearchTrace({
        type: 'Binary Search (Logarithmic Lookup)',
        target,
        found: foundIndex !== -1,
        unit: foundIndex !== -1 ? sortedByUnit[foundIndex] : null,
        comparisons,
        steps: traceSteps,
        complexity: 'O(log n) over pre-sorted lexicographical keys',
      });
    } else if (searchAlgo === 'interpolation') {
      // Interpolation search on numeric keys: extracted numeric portion of ID or quantity
      // Extract numeric sequence from unit IDs (e.g. hash or numerical suffix)
      const sortedNumeric = [...inventory]
        .map((u, i) => ({ unit: u, key: 1000 + i * 5 })) // Clean uniform sequence
        .sort((a, b) => a.key - b.key);

      const numericTarget = parseInt(target) || 1025;
      const keys = sortedNumeric.map((x) => x.key);
      const res = interpolationSearch(keys, numericTarget);

      setSearchTrace({
        type: 'Interpolation Search (Numeric Probe)',
        target: numericTarget,
        found: res.found,
        unit: res.found ? sortedNumeric[res.index].unit : null,
        comparisons: res.comparisons,
        steps: res.steps.map((s) => `Probe ${s.probe} (val=${s.probeValue}): ${s.comparison}`),
        complexity: 'O(log log n) avg assuming uniform numeric key distribution; O(n) worst case',
      });
    }
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
  const inTransitCount = useMemo(() => inventory.filter((u) => u.status === 'in_transit').reduce((acc, u) => acc + u.quantity, 0), [inventory]);
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
        {/* ─── Key Operational Metrics ────────────────────────────────────── */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-label">Total Units in Network</div>
            <div className="stat-value">{totalUnitsCount}</div>
            <div className="stat-desc">{inventory.length} distinct batch records</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Available Stock</div>
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>{availableUnitsCount}</div>
            <div className="stat-desc">Ready for release or transfer</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Transit / Reserved</div>
            <div className="stat-value" style={{ color: 'var(--color-info)' }}>{inTransitCount}</div>
            <div className="stat-desc">En-route or locked for request</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Expiring Soon (≤48h)</div>
            <div className="stat-value" style={{ color: atRiskCount > 0 ? 'var(--color-warning)' : 'var(--text-muted)' }}>
              {atRiskCount}
            </div>
            <div className="stat-desc">Candidates for urgent redistribution</div>
          </div>
        </div>

        {/* Undo Notification Banner */}
        {undoNotice && (
          <div
            className={`card`}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              className="form-select"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              style={{ width: 150 }}
            >
              <option value="expiry">Sort: Expiry Date</option>
              <option value="remaining">Sort: Remaining Time</option>
              <option value="quantity">Sort: Quantity</option>
              <option value="id">Sort: Unit ID</option>
            </select>

            <select
              className="form-select"
              value={sortAlgo}
              onChange={(e) => setSortAlgo(e.target.value as SortAlgo)}
              style={{ width: 180 }}
            >
              <option value="merge">Algo: Merge Sort (O(n log n))</option>
              <option value="insertion">Algo: Insertion Sort (O(n²))</option>
              <option value="selection">Algo: Selection Sort (O(n²))</option>
              <option value="bubble">Algo: Bubble Sort (O(n²))</option>
            </select>
          </div>
        </div>

        {/* Sorting Execution Metrics Badge */}
        {sortMetrics && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
            <span className="badge badge-info" style={{ fontSize: 10 }}>{sortMetrics.algoName}</span>
            <span>Sorted {sortedItems.length} records in {sortMetrics.timeMs}ms ({sortMetrics.comparisons.toLocaleString()} comparisons)</span>
            <span>• Tie-breaking rule: Deterministic lexicographical unit ID</span>
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
                  <button type="submit" className="btn btn-primary">Add Unit & Push to Stack</button>
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
                    <option value="available">Available</option>
                    <option value="quarantined">Quarantined</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={editingUnit.quantity}
                    onChange={(e) => setEditingUnit({ ...editingUnit, quantity: parseInt(e.target.value) || 1 })}
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
                <button className="btn btn-primary btn-sm" onClick={handleQuickEditSave}>Save & Record on Stack</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditingUnit(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Inventory Data Table ─────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Inventory Units ({sortedItems.length})</h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Ordered by {sortField} using {sortAlgo.toUpperCase()}
            </div>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Blood Bank</th>
                  <th>Type</th>
                  <th>Component</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Remaining Time</th>
                  <th>Temp</th>
                  <th>Transport</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((u) => {
                  const remaining = new Date(u.expiryTimestamp).getTime() - now;
                  const isExpired = remaining <= 0;
                  return (
                    <tr key={u.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                        <button
                          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                          onClick={() => {
                            setTargetQuery(u.id);
                            setShowDsaInspector(true);
                            setInspectorTab('hashtable');
                            handleExecuteSearch(u.id);
                          }}
                          title="Inspect Hash Lookup"
                        >
                          {u.id}
                        </button>
                      </td>
                      <td style={{ fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getBankName(u.bloodBankId)}
                      </td>
                      <td><span className="badge badge-info">{u.bloodType}</span></td>
                      <td style={{ fontSize: 12 }}>{u.componentType}</td>
                      <td style={{ fontWeight: 600 }}>{u.quantity}</td>
                      <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                      <td>
                        <span className={`badge ${isExpired ? 'badge-critical' : remaining < 12 * 3600000 ? 'badge-critical' : remaining < 48 * 3600000 ? 'badge-warning' : 'badge-normal'}`}>
                          {formatTimeRemaining(remaining)}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>{u.storageTemp}</td>
                      <td>
                        <span className={`badge ${u.transportEligible ? 'badge-normal' : 'badge-warning'}`}>
                          {u.transportEligible ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditingUnit(u)}
                            title="Edit Unit (Push to Stack)"
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              deleteInventoryUnit(u.id);
                              setUndoNotice({ message: `Deleted unit ${u.id} (Pushed to Stack)`, success: true });
                            }}
                            title="Delete Unit (Push to Stack)"
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
                    <td colSpan={10}>
                      <div className="empty-state"><p>No inventory units match the selected criteria</p></div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Collapsible: How the algorithm works ────────────────────────── */}
        <details className="card" style={{ marginTop: 20, border: '1px solid var(--border-color)' }}>
          <summary style={{ padding: '14px 18px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
            <Sparkles size={16} color="var(--color-primary)" />
            <span>How the algorithm works: Hash Table Lookup, LIFO Action Stack & Sorting</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 400 }}>Click to expand operational proof</span>
          </summary>
          <div className="card-body" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${inspectorTab === 'stack' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInspectorTab('stack')}
              >
                <Layers size={13} /> Stack (Undo History: {inventoryActionStack.length})
              </button>
              <button
                className={`btn btn-sm ${inspectorTab === 'hashtable' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInspectorTab('hashtable')}
              >
                <Hash size={13} /> Hash Table (O(1) Lookup)
              </button>
              <button
                className={`btn btn-sm ${inspectorTab === 'linkedlist' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInspectorTab('linkedlist')}
              >
                <LinkIcon size={13} /> Linked List (Node Chain)
              </button>
              <button
                className={`btn btn-sm ${inspectorTab === 'searches' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInspectorTab('searches')}
              >
                <Search size={13} /> Search Benchmarks
              </button>
            </div>

            {/* TAB 1: STACK */}
            {inspectorTab === 'stack' && (
              <div>
                <div style={{ fontSize: 12, marginBottom: 10, color: 'var(--text-secondary)' }}>
                  <strong>LIFO Action Stack (Reversible Operations):</strong> Each inventory addition, update, or deletion is pushed to an in-memory stack frame with pre-image snapshots. Calling undo pops the top operation in O(1) time without rebuilding the database.
                </div>
                {inventoryActionStack.length === 0 ? (
                  <div style={{ padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: 12 }}>
                    Stack is empty. Add or edit an inventory unit to observe real-time LIFO push operations.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {inventoryActionStack.slice().reverse().map((act, index) => (
                      <div
                        key={act.id}
                        style={{
                          padding: '6px 12px',
                          background: index === 0 ? 'rgba(220, 38, 38, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          borderRadius: 6,
                          borderLeft: index === 0 ? '3px solid var(--color-primary)' : '1px solid var(--border-color)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 12,
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, marginRight: 8 }}>{index === 0 ? 'TOP [PEEK]' : `FRAME [${inventoryActionStack.length - index - 1}]`}:</span>
                          <span>{act.description}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>Unit: {act.unitId}</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{new Date(act.timestamp).toLocaleTimeString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HASH TABLE */}
            {inspectorTab === 'hashtable' && (
              <div>
                <div style={{ fontSize: 12, marginBottom: 10, color: 'var(--text-secondary)' }}>
                  <strong>Polynomial Rolling Hash Table (Capacity {inventoryHashTable.capacity}):</strong> Resolves collisions via separate chaining buckets. Yields average O(1) unit ID lookup.
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <input
                    className="form-input"
                    placeholder="Enter Unit ID (e.g. inv-1)..."
                    value={targetQuery}
                    onChange={(e) => setTargetQuery(e.target.value)}
                    style={{ maxWidth: 240 }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => handleExecuteSearch(targetQuery || (inventory[0]?.id ?? ''))}>
                    Lookup Key
                  </button>
                  {inventory.length > 0 && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setTargetQuery(inventory[0].id); handleExecuteSearch(inventory[0].id); }}>
                      Test 1st Unit ({inventory[0].id})
                    </button>
                  )}
                </div>
                {searchTrace && searchTrace.type === 'Hash Table Lookup' && (
                  <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 6 }}>
                      <div><strong>Target:</strong> <code>{searchTrace.target}</code></div>
                      <div><strong>Hash:</strong> <code>{searchTrace.computedHash}</code></div>
                      <div><strong>Bucket:</strong> <code>#{searchTrace.bucketIndex}</code></div>
                      <div><strong>Status:</strong> {searchTrace.found ? <span style={{ color: 'var(--color-success)' }}>Found ✓</span> : <span style={{ color: 'var(--color-danger)' }}>Not Found ✗</span>}</div>
                    </div>
                    {searchTrace.unit && (
                      <div style={{ marginTop: 6, color: 'var(--text-secondary)' }}>
                        Matched Unit: <strong>{searchTrace.unit.bloodType} {searchTrace.unit.componentType}</strong> ({searchTrace.unit.quantity} units) stored at {getBankName(searchTrace.unit.bloodBankId)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: LINKED LIST */}
            {inspectorTab === 'linkedlist' && (
              <div>
                <div style={{ fontSize: 12, marginBottom: 10, color: 'var(--text-secondary)' }}>
                  <strong>Node-Based Linked List (Sequential Traversal):</strong> Units represented as node pointers (Head &rarr; Next &rarr; Tail) for memory-fragmentation-free batch appends.
                </div>
                <div style={{ overflowX: 'auto', padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 'max-content' }}>
                    <span className="badge badge-info" style={{ fontSize: 10 }}>HEAD</span>
                    {inventory.slice(0, 8).map((u, i) => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ padding: '4px 8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', borderRadius: 4, fontSize: 11 }}>
                          <span style={{ fontWeight: 600 }}>{u.id}</span> <span style={{ color: 'var(--color-primary)' }}>({u.bloodType})</span>
                        </div>
                        {i < Math.min(inventory.length, 8) - 1 ? (
                          <span style={{ color: 'var(--text-muted)' }}>→</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>→ null</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SEARCH BENCHMARKS */}
            {inspectorTab === 'searches' && (
              <div>
                <div style={{ fontSize: 12, marginBottom: 10, color: 'var(--text-secondary)' }}>
                  <strong>Search Algorithm Comparison:</strong> Benchmark linear vs binary vs interpolation searches across indexed unit records.
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <select className="form-select" value={searchAlgo} onChange={(e) => setSearchAlgo(e.target.value as any)} style={{ width: 180 }}>
                    <option value="hash">Hash Table (O(1))</option>
                    <option value="binary">Binary Search (O(log n))</option>
                    <option value="linear">Linear Search (O(n))</option>
                    <option value="interpolation">Interpolation Search</option>
                  </select>
                  <input
                    className="form-input"
                    placeholder="Search Key..."
                    value={targetQuery}
                    onChange={(e) => setTargetQuery(e.target.value)}
                    style={{ maxWidth: 200 }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => handleExecuteSearch(targetQuery || (inventory[0]?.id ?? ''))}>
                    Run Benchmark
                  </button>
                </div>
                {searchTrace && (
                  <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 12 }}>
                    <div><strong>Algorithm:</strong> {searchTrace.type} | Comparisons: <strong>{searchTrace.comparisons}</strong></div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>Complexity: {searchTrace.complexity}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </details>
      </div>
    </>
  );
}

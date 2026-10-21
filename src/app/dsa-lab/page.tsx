'use client';

import { useState, useMemo } from 'react';
import { FlaskConical, Play, RotateCcw, ChevronRight } from 'lucide-react';
import {
  Stack, Queue, CircularQueue, LinkedList, CircularLinkedList, Deque,
  HashTable, linearSearch, binarySearch, interpolationSearch,
  bubbleSort, selectionSort, insertionSort, mergeSort,
  bfs, dfs, dijkstra, DSAStep
} from '@/lib/dsa-engine';
import { useStore } from '@/lib/store';

const DSA_TABS = [
  'Stack', 'Queue', 'Circular Queue', 'Linked List', 'Circular Linked List', 'Deque',
  'Hash Table', 'Linear Search', 'Binary Search', 'Interpolation Search',
  'Bubble Sort', 'Selection Sort', 'Insertion Sort', 'Merge Sort',
  'BFS', 'DFS', 'Dijkstra'
];

function StepLog({ steps }: { steps: DSAStep[] }) {
  if (steps.length === 0) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Operation Log</h4>
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {steps.map((s, i) => (
          <div key={i} className="dsa-step">
            <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{s.operation}</span>: {s.detail}
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>State: {s.stateSnapshot}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisualArray({ arr, highlight }: { arr: (string | number | null)[]; highlight?: number[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '12px 0' }}>
      {arr.map((v, i) => (
        <div key={i} className={`dsa-node ${highlight?.includes(i) ? 'current' : ''}`}
          style={{ width: 40, height: 40, fontSize: 12 }}>
          {v === null ? '∅' : String(v)}
        </div>
      ))}
    </div>
  );
}

function LinkedListViz({ items }: { items: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, margin: '12px 0' }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <div className="dsa-node" style={{ width: 50, height: 36, fontSize: 11, borderRadius: 6 }}>{item}</div>
          {i < items.length - 1 && <span className="dsa-arrow">→</span>}
        </span>
      ))}
      {items.length > 0 && <span className="dsa-arrow">→ null</span>}
    </div>
  );
}

export default function DSALabPage() {
  const [activeTab, setActiveTab] = useState('Stack');
  const graphState = useStore((s) => s.graphState);
  const inventory = useStore((s) => s.inventory);

  // ─── Stack ─────────────────────────────────────────────
  const [stack] = useState(() => new Stack<string>());
  const [stackInput, setStackInput] = useState('');
  const [stackItems, setStackItems] = useState<string[]>([]);
  const [stackSteps, setStackSteps] = useState<DSAStep[]>([]);

  const stackPush = () => { if (!stackInput) return; stack.push(stackInput); setStackItems(stack.toArray()); setStackSteps(stack.steps); setStackInput(''); };
  const stackPop = () => { stack.pop(); setStackItems(stack.toArray()); setStackSteps(stack.steps); };
  const stackReset = () => { stack.clear(); setStackItems([]); setStackSteps([]); };

  // ─── Queue ─────────────────────────────────────────────
  const [queue] = useState(() => new Queue<string>());
  const [queueInput, setQueueInput] = useState('');
  const [queueItems, setQueueItems] = useState<string[]>([]);
  const [queueSteps, setQueueSteps] = useState<DSAStep[]>([]);

  const qEnqueue = () => { if (!queueInput) return; queue.enqueue(queueInput); setQueueItems(queue.toArray()); setQueueSteps(queue.steps); setQueueInput(''); };
  const qDequeue = () => { queue.dequeue(); setQueueItems(queue.toArray()); setQueueSteps(queue.steps); };

  // ─── Circular Queue ────────────────────────────────────
  const [cqCap, setCqCap] = useState(6);
  const [cq] = useState(() => new CircularQueue<string>(6));
  const [cqInput, setCqInput] = useState('');
  const [cqBuffer, setCqBuffer] = useState<(string | null)[]>(new Array(6).fill(null));
  const [cqSteps, setCqSteps] = useState<DSAStep[]>([]);
  const [cqIndices, setCqIndices] = useState({ front: -1, rear: -1 });

  const cqEnqueue = () => { if (!cqInput) return; cq.enqueue(cqInput); setCqBuffer(cq.toArray() as (string|null)[]); setCqSteps(cq.steps); setCqIndices({ front: cq.frontIndex, rear: cq.rearIndex }); setCqInput(''); };
  const cqDequeue = () => { cq.dequeue(); setCqBuffer(cq.toArray() as (string|null)[]); setCqSteps(cq.steps); setCqIndices({ front: cq.frontIndex, rear: cq.rearIndex }); };

  // ─── Linked List ───────────────────────────────────────
  const [ll] = useState(() => new LinkedList<string>());
  const [llInput, setLlInput] = useState('');
  const [llItems, setLlItems] = useState<string[]>([]);
  const [llSteps, setLlSteps] = useState<DSAStep[]>([]);
  const [llSearchResult, setLlSearchResult] = useState('');

  const llInsertHead = () => { if (!llInput) return; ll.insertAtHead(llInput); setLlItems(ll.traverse()); setLlSteps(ll.steps); setLlInput(''); };
  const llInsertTail = () => { if (!llInput) return; ll.insertAtTail(llInput); setLlItems(ll.traverse()); setLlSteps(ll.steps); setLlInput(''); };
  const llDelete = () => { if (!llInput) return; ll.deleteByValue(llInput); setLlItems(ll.traverse()); setLlSteps(ll.steps); setLlInput(''); };
  const llSearch = () => { if (!llInput) return; const r = ll.search(llInput); setLlSearchResult(r.found ? `Found at position ${r.position} (${r.comparisons} comparisons)` : `Not found (${r.comparisons} comparisons)`); setLlSteps(ll.steps); };

  // ─── Circular Linked List ──────────────────────────────
  const [cll] = useState(() => new CircularLinkedList<string>());
  const [cllInput, setCllInput] = useState('');
  const [cllItems, setCllItems] = useState<string[]>([]);
  const [cllSteps, setCllSteps] = useState<DSAStep[]>([]);

  const cllInsert = () => { if (!cllInput) return; cll.insert(cllInput); setCllItems(cll.traverseOneCycle()); setCllSteps(cll.steps); setCllInput(''); };
  const cllDelete = () => { if (!cllInput) return; cll.delete(cllInput); setCllItems(cll.traverseOneCycle()); setCllSteps(cll.steps); setCllInput(''); };
  const cllTraverse = () => { setCllItems(cll.traverseOneCycle()); setCllSteps(cll.steps); };

  // ─── Deque ─────────────────────────────────────────────
  const [deque] = useState(() => new Deque<string>());
  const [dequeInput, setDequeInput] = useState('');
  const [dequeItems, setDequeItems] = useState<string[]>([]);
  const [dequeSteps, setDequeSteps] = useState<DSAStep[]>([]);

  // ─── Hash Table ────────────────────────────────────────
  const [ht] = useState(() => new HashTable<string, string>(8));
  const [htKey, setHtKey] = useState('');
  const [htVal, setHtVal] = useState('');
  const [htBuckets, setHtBuckets] = useState(ht.getBuckets());
  const [htSteps, setHtSteps] = useState<DSAStep[]>([]);
  const [htLookupResult, setHtLookupResult] = useState('');

  // ─── Search ────────────────────────────────────────────
  const [searchArr, setSearchArr] = useState('5,12,18,24,31,42,55,67,78,89');
  const [searchTarget, setSearchTarget] = useState('42');
  const [searchResults, setSearchResults] = useState<{ type: string; result: string; steps: string }[]>([]);

  // ─── Sort ──────────────────────────────────────────────
  const [sortInput, setSortInput] = useState('38,27,43,3,9,82,10,64,15,51');
  const [sortResults, setSortResults] = useState<{ name: string; sorted: string; comparisons: number; swaps: number; timeMs: number; steps: { array: number[]; action: string }[] }[]>([]);

  // ─── Graph ─────────────────────────────────────────────
  const [gSource, setGSource] = useState('n-bb1');
  const [gDest, setGDest] = useState('n-bb3');
  const [graphResults, setGraphResults] = useState<{ name: string; path: string; distance: number; visited: number; steps: number }[]>([]);

  const renderTab = () => {
    switch (activeTab) {
      case 'Stack':
        return (
          <div>
            <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <strong>Stack (LIFO)</strong> — Last In, First Out. Used for reversible action history. Push/Pop: <strong>O(1)</strong>. Implemented with an array-backed structure.
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input className="form-input" value={stackInput} onChange={(e) => setStackInput(e.target.value)} placeholder="Enter value..." style={{ width: 200 }} />
              <button className="btn btn-primary btn-sm" onClick={stackPush}><Play size={14} /> Push</button>
              <button className="btn btn-secondary btn-sm" onClick={stackPop}>Pop</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { if (stack.peek() !== undefined) alert(`Peek: ${stack.peek()}`); }}>Peek</button>
              <button className="btn btn-secondary btn-sm" onClick={stackReset}><RotateCcw size={14} /> Reset</button>
            </div>
            <div style={{ fontSize: 13 }}>Size: {stackItems.length} | Top: {stackItems.length > 0 ? stackItems[stackItems.length - 1] : 'empty'}</div>
            <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 4, margin: '12px 0', maxWidth: 200 }}>
              {stackItems.map((item, i) => (
                <div key={i} style={{ padding: '6px 12px', background: i === stackItems.length - 1 ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: i === stackItems.length - 1 ? 'white' : 'var(--text-primary)', borderRadius: 4, fontWeight: 600, fontSize: 13, textAlign: 'center' }}>
                  {item} {i === stackItems.length - 1 && '← TOP'}
                </div>
              ))}
              {stackItems.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Empty Stack</div>}
            </div>
            <StepLog steps={stackSteps} />
          </div>
        );
      case 'Queue':
        return (
          <div>
            <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <strong>Queue (FIFO)</strong> — First In, First Out. Used for request processing in arrival order. Enqueue: <strong>O(1)</strong>, Dequeue: <strong>O(n)</strong> with array shift.
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input className="form-input" value={queueInput} onChange={(e) => setQueueInput(e.target.value)} placeholder="Enter value..." style={{ width: 200 }} />
              <button className="btn btn-primary btn-sm" onClick={qEnqueue}>Enqueue</button>
              <button className="btn btn-secondary btn-sm" onClick={qDequeue}>Dequeue</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { queue.clear(); setQueueItems([]); setQueueSteps([]); }}><RotateCcw size={14} /></button>
            </div>
            <div style={{ fontSize: 13 }}>Size: {queueItems.length} | Front: {queueItems[0] || '—'} | Rear: {queueItems[queueItems.length - 1] || '—'}</div>
            <div style={{ display: 'flex', gap: 4, margin: '12px 0', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600 }}>FRONT →</span>
              {queueItems.map((item, i) => (
                <div key={i} className="dsa-node" style={{ width: 44, height: 36, fontSize: 12, borderRadius: 6, background: i === 0 ? '#059669' : 'var(--accent-primary)' }}>{item}</div>
              ))}
              <span style={{ fontSize: 11, fontWeight: 600 }}>← REAR</span>
            </div>
            <StepLog steps={queueSteps} />
          </div>
        );
      case 'Circular Queue':
        return (
          <div>
            <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <strong>Circular Queue</strong> — Fixed-capacity bounded buffer with wraparound. O(1) enqueue/dequeue. <strong>Full-buffer policy: rejects (does NOT overwrite critical data)</strong>.
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input className="form-input" value={cqInput} onChange={(e) => setCqInput(e.target.value)} placeholder="Enter value..." style={{ width: 200 }} />
              <button className="btn btn-primary btn-sm" onClick={cqEnqueue}>Enqueue</button>
              <button className="btn btn-secondary btn-sm" onClick={cqDequeue}>Dequeue</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { cq.clear(); setCqBuffer(new Array(cqCap).fill(null)); setCqSteps([]); setCqIndices({ front: -1, rear: -1 }); }}><RotateCcw size={14} /></button>
            </div>
            <div style={{ fontSize: 13 }}>Capacity: {cqCap} | Size: {cq.size()} | Front: {cqIndices.front} | Rear: {cqIndices.rear} | Full: {cq.isFull() ? 'Yes' : 'No'}</div>
            <div style={{ display: 'flex', gap: 4, margin: '12px 0' }}>
              {cqBuffer.map((v, i) => (
                <div key={i} style={{
                  width: 48, height: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: v !== null ? (i === cqIndices.front ? '#059669' : 'var(--accent-primary)') : 'var(--bg-tertiary)',
                  color: v !== null ? 'white' : 'var(--text-muted)', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: `2px solid ${i === cqIndices.front ? '#059669' : i === cqIndices.rear ? '#2563EB' : 'var(--border-light)'}`,
                }}>
                  <span>{v ?? '∅'}</span>
                  <span style={{ fontSize: 8 }}>[{i}]{i === cqIndices.front ? 'F' : ''}{i === cqIndices.rear ? 'R' : ''}</span>
                </div>
              ))}
            </div>
            <StepLog steps={cqSteps} />
          </div>
        );
      case 'Linked List':
        return (
          <div>
            <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <strong>Linked List</strong> — Node-based dynamic structure. Insert at head: <strong>O(1)</strong>, Insert at tail/Search/Delete: <strong>O(n)</strong>. Insertion/deletion is O(1) <em>if</em> the position or node reference is already known.
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input className="form-input" value={llInput} onChange={(e) => setLlInput(e.target.value)} placeholder="Enter value..." style={{ width: 200 }} />
              <button className="btn btn-primary btn-sm" onClick={llInsertHead}>Insert Head</button>
              <button className="btn btn-primary btn-sm" onClick={llInsertTail}>Insert Tail</button>
              <button className="btn btn-secondary btn-sm" onClick={llDelete}>Delete</button>
              <button className="btn btn-secondary btn-sm" onClick={llSearch}>Search</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { ll.clear(); setLlItems([]); setLlSteps([]); setLlSearchResult(''); }}><RotateCcw size={14} /></button>
            </div>
            {llSearchResult && <div style={{ fontSize: 13, padding: 8, background: 'var(--status-info-bg)', borderRadius: 6, marginBottom: 8 }}>{llSearchResult}</div>}
            <LinkedListViz items={llItems} />
            <StepLog steps={llSteps} />
          </div>
        );
      case 'Circular Linked List':
        return (
          <div>
            <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <strong>Circular Linked List</strong> — Last node points back to head. Traversal terminates after one complete cycle. Unlike a Circular Queue, this has dynamic size. Used for cyclic review of blood banks (A→B→C→A).
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input className="form-input" value={cllInput} onChange={(e) => setCllInput(e.target.value)} placeholder="Enter value..." style={{ width: 200 }} />
              <button className="btn btn-primary btn-sm" onClick={cllInsert}>Insert</button>
              <button className="btn btn-secondary btn-sm" onClick={cllDelete}>Delete</button>
              <button className="btn btn-secondary btn-sm" onClick={cllTraverse}>Traverse Cycle</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { cll.clear(); setCllItems([]); setCllSteps([]); }}><RotateCcw size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, margin: '12px 0' }}>
              {cllItems.map((item, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="dsa-node" style={{ width: 50, height: 36, fontSize: 11, borderRadius: 6 }}>{item}</div>
                  <span className="dsa-arrow">→</span>
                </span>
              ))}
              {cllItems.length > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-primary)' }}>↩ back to {cllItems[0]}</span>}
            </div>
            <StepLog steps={cllSteps} />
          </div>
        );
      case 'Deque':
        return (
          <div>
            <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <strong>Deque (Double-Ended Queue)</strong> — Insert/delete at both ends. Used for review task worklist. Front/Rear peek available.
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input className="form-input" value={dequeInput} onChange={(e) => setDequeInput(e.target.value)} placeholder="Enter value..." style={{ width: 180 }} />
              <button className="btn btn-primary btn-sm" onClick={() => { if (!dequeInput) return; deque.insertFront(dequeInput); setDequeItems(deque.toArray()); setDequeSteps(deque.steps); setDequeInput(''); }}>Insert Front</button>
              <button className="btn btn-primary btn-sm" onClick={() => { if (!dequeInput) return; deque.insertRear(dequeInput); setDequeItems(deque.toArray()); setDequeSteps(deque.steps); setDequeInput(''); }}>Insert Rear</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { deque.deleteFront(); setDequeItems(deque.toArray()); setDequeSteps(deque.steps); }}>Del Front</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { deque.deleteRear(); setDequeItems(deque.toArray()); setDequeSteps(deque.steps); }}>Del Rear</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { deque.clear(); setDequeItems([]); setDequeSteps([]); }}><RotateCcw size={14} /></button>
            </div>
            <div style={{ fontSize: 13 }}>Size: {dequeItems.length} | Front: {deque.peekFront() || '—'} | Rear: {deque.peekRear() || '—'}</div>
            <VisualArray arr={dequeItems} highlight={dequeItems.length > 0 ? [0, dequeItems.length - 1] : []} />
            <StepLog steps={dequeSteps} />
          </div>
        );
      case 'Hash Table':
        return (
          <div>
            <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <strong>Hash Table (Separate Chaining)</strong> — Custom hash function: Σ(charCode × 31^i) mod capacity. NOT a wrapper around built-in Map. Average lookup <strong>O(1)</strong>, worst <strong>O(n)</strong>.
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input className="form-input" value={htKey} onChange={(e) => setHtKey(e.target.value)} placeholder="Key" style={{ width: 140 }} />
              <input className="form-input" value={htVal} onChange={(e) => setHtVal(e.target.value)} placeholder="Value" style={{ width: 140 }} />
              <button className="btn btn-primary btn-sm" onClick={() => { if (!htKey) return; ht.insert(htKey, htVal); setHtBuckets(ht.getBuckets()); setHtSteps(ht.steps); setHtKey(''); setHtVal(''); }}>Insert</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { if (!htKey) return; const r = ht.lookup(htKey); setHtLookupResult(r.found ? `Found "${r.value}" in bucket ${r.bucketIndex} (${r.comparisons} comparison(s))` : `Not found (${r.comparisons} comparison(s))`); setHtSteps(ht.steps); }}>Lookup</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { if (!htKey) return; ht.delete(htKey); setHtBuckets(ht.getBuckets()); setHtSteps(ht.steps); }}>Delete</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { ht.clear(); setHtBuckets(ht.getBuckets()); setHtSteps([]); setHtLookupResult(''); }}><RotateCcw size={14} /></button>
            </div>
            {htLookupResult && <div style={{ fontSize: 13, padding: 8, background: 'var(--status-info-bg)', borderRadius: 6, marginBottom: 8 }}>{htLookupResult}</div>}
            <div style={{ fontSize: 13, marginBottom: 8 }}>Capacity: {ht.capacity} | Size: {ht.tableSize}</div>
            <div style={{ display: 'grid', gap: 4 }}>
              {htBuckets.map((b) => (
                <div key={b.index} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 8px', background: b.entries.length > 0 ? 'var(--accent-light)' : 'var(--bg-tertiary)', borderRadius: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, width: 28 }}>[{b.index}]</span>
                  {b.entries.length > 0 ? b.entries.map((e, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
                      {i > 0 && <span className="dsa-arrow" style={{ margin: '0 4px' }}>→</span>}
                      <span style={{ padding: '2px 6px', background: 'var(--accent-primary)', color: 'white', borderRadius: 4, fontSize: 11 }}>{e.key}:{e.value}</span>
                    </span>
                  )) : <span style={{ color: 'var(--text-muted)' }}>empty</span>}
                  {b.entries.length > 1 && <span style={{ fontSize: 10, color: '#D97706', fontWeight: 600 }}>⚠ COLLISION</span>}
                </div>
              ))}
            </div>
            <StepLog steps={htSteps} />
          </div>
        );
      case 'Linear Search':
      case 'Binary Search':
      case 'Interpolation Search':
        return (
          <div>
            <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              {activeTab === 'Linear Search' && <><strong>Linear Search</strong> — Sequential scan. Time: <strong>O(n)</strong> worst case. Works on unsorted data.</>}
              {activeTab === 'Binary Search' && <><strong>Binary Search</strong> — Requires sorted input. Time: <strong>O(log n)</strong> worst case. Returns first occurrence for duplicates.</>}
              {activeTab === 'Interpolation Search' && <><strong>Interpolation Search</strong> — Uses value distribution for probe position. Average <strong>O(log log n)</strong> for uniform data, worst <strong>O(n)</strong>. NOT always faster than binary search.</>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <input className="form-input" value={searchArr} onChange={(e) => setSearchArr(e.target.value)} placeholder="Comma-separated numbers..." style={{ width: 320 }} />
              <input className="form-input" value={searchTarget} onChange={(e) => setSearchTarget(e.target.value)} placeholder="Target" style={{ width: 100 }} />
              <button className="btn btn-primary btn-sm" onClick={() => {
                const arr = searchArr.split(',').map(Number).filter((n) => !isNaN(n));
                const target = parseInt(searchTarget);
                let result;
                if (activeTab === 'Linear Search') {
                  const r = linearSearch(arr, target);
                  result = { type: 'Linear', result: r.found ? `Found at index ${r.index}` : 'Not found', steps: `${r.comparisons} comparisons, O(n) = O(${arr.length})` };
                } else if (activeTab === 'Binary Search') {
                  const sorted = [...arr].sort((a, b) => a - b);
                  const r = binarySearch(sorted, target);
                  result = { type: 'Binary', result: r.found ? `Found at index ${r.index}` : 'Not found', steps: r.steps.map((s) => s.comparison).join(' → ') + ` | ${r.comparisons} comparisons, O(log n) = O(${Math.ceil(Math.log2(arr.length))})` };
                } else {
                  const sorted = [...arr].sort((a, b) => a - b);
                  const r = interpolationSearch(sorted, target);
                  result = { type: 'Interpolation', result: r.found ? `Found at index ${r.index}` : 'Not found', steps: r.steps.map((s) => s.comparison).join(' → ') + ` | ${r.comparisons} comparisons` };
                }
                setSearchResults([result]);
              }}><Play size={14} /> Search</button>
            </div>
            {searchResults.map((r, i) => (
              <div key={i} style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.type}: {r.result}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.steps}</div>
              </div>
            ))}
            <VisualArray arr={searchArr.split(',').map(Number).filter((n) => !isNaN(n))} />
          </div>
        );
      case 'Bubble Sort':
      case 'Selection Sort':
      case 'Insertion Sort':
      case 'Merge Sort':
        return (
          <div>
            <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              {activeTab === 'Bubble Sort' && <><strong>Bubble Sort</strong> — Compare adjacent elements. Time: <strong>O(n²)</strong> worst/average, <strong>O(n)</strong> best (already sorted). Space: O(1).</>}
              {activeTab === 'Selection Sort' && <><strong>Selection Sort</strong> — Find minimum, place at front. Time: <strong>O(n²)</strong> all cases. Space: O(1).</>}
              {activeTab === 'Insertion Sort' && <><strong>Insertion Sort</strong> — Insert each element in sorted position. Time: <strong>O(n²)</strong> worst, <strong>O(n)</strong> best. Space: O(1). Stable sort.</>}
              {activeTab === 'Merge Sort' && <><strong>Merge Sort</strong> — Divide and conquer. Time: <strong>O(n log n)</strong> all cases. Space: O(n). Stable sort.</>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input className="form-input" value={sortInput} onChange={(e) => setSortInput(e.target.value)} placeholder="Comma-separated numbers..." style={{ width: 360 }} />
              <button className="btn btn-primary btn-sm" onClick={() => {
                const arr = sortInput.split(',').map(Number).filter((n) => !isNaN(n));
                const fn = activeTab === 'Bubble Sort' ? bubbleSort : activeTab === 'Selection Sort' ? selectionSort : activeTab === 'Insertion Sort' ? insertionSort : mergeSort;
                const r = fn(arr);
                setSortResults([{ name: activeTab, sorted: r.sorted.join(', '), comparisons: r.comparisons, swaps: r.swaps, timeMs: r.timeMs, steps: r.steps }]);
              }}><Play size={14} /> Sort</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { const arr = Array.from({ length: 15 }, () => Math.floor(Math.random() * 100)); setSortInput(arr.join(',')); }}>Random</button>
            </div>
            {sortResults.map((r, i) => (
              <div key={i}>
                <div style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>{r.name}: [{r.sorted}]</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Comparisons: {r.comparisons} | Swaps/Moves: {r.swaps} | Time: {r.timeMs.toFixed(3)}ms</div>
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {r.steps.slice(0, 20).map((s, j) => (
                    <div key={j} className="dsa-step">
                      <span style={{ fontSize: 11 }}>{s.action}</span>
                      <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                        {s.array.map((v, k) => (
                          <span key={k} style={{ width: 28, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: (s as Record<string, unknown>).indices && ((s as Record<string, unknown>).indices as number[]).includes(k) ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: (s as Record<string, unknown>).indices && ((s as Record<string, unknown>).indices as number[]).includes(k) ? 'white' : 'var(--text-primary)', borderRadius: 3, fontSize: 10, fontWeight: 600 }}>{v}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      case 'BFS':
      case 'DFS':
      case 'Dijkstra':
        return (
          <div>
            <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              {activeTab === 'BFS' && <><strong>BFS (Breadth-First Search)</strong> — Level-by-level traversal using a queue. Time: <strong>O(V + E)</strong>. Finds shortest path in unweighted graphs.</>}
              {activeTab === 'DFS' && <><strong>DFS (Depth-First Search)</strong> — Explores as deep as possible using a stack. Time: <strong>O(V + E)</strong>. Does not guarantee shortest path.</>}
              {activeTab === 'Dijkstra' && <><strong>Dijkstra&apos;s Shortest Path</strong> — Greedy algorithm for shortest paths with non-negative edge weights. Time: <strong>O(V²)</strong> with linear scan (educational), <strong>O((V+E) log V)</strong> with priority queue.</>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <select className="form-select" value={gSource} onChange={(e) => setGSource(e.target.value)} style={{ width: 200 }}>
                {graphState.nodes.filter((n) => n.type !== 'obstacle').map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
              <select className="form-select" value={gDest} onChange={(e) => setGDest(e.target.value)} style={{ width: 200 }}>
                {graphState.nodes.filter((n) => n.type !== 'obstacle' && n.id !== gSource).map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" onClick={() => {
                const fn = activeTab === 'BFS' ? bfs : activeTab === 'DFS' ? dfs : dijkstra;
                const r = fn(graphState.nodes, graphState.edges, gSource, gDest);
                setGraphResults([{
                  name: activeTab, path: r.path.map((id) => graphState.nodes.find((n) => n.id === id)?.label || id).join(' → '),
                  distance: r.distance, visited: r.visitedNodes.length, steps: r.steps.length,
                }]);
              }}><Play size={14} /> Run</button>
            </div>
            {graphResults.map((r, i) => (
              <div key={i} style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                <div style={{ fontWeight: 600 }}>{r.name}: {r.path || 'No path found'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Distance: {r.distance === Infinity ? '∞' : r.distance}km | Visited: {r.visited} nodes | Steps: {r.steps}</div>
              </div>
            ))}
          </div>
        );
      default:
        return <div>Select a topic</div>;
    }
  };

  return (
    <>
      <div className="page-header"><h1>DSA Laboratory</h1><p>Interactive demonstrations of all data structures and algorithms — each visualization reflects actual operations</p></div>
      <div className="page-content">
        <div className="tabs" style={{ flexWrap: 'wrap' }}>
          {DSA_TABS.map((tab) => (
            <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
        <div className="card">
          <div className="card-body">{renderTab()}</div>
        </div>
      </div>
    </>
  );
}

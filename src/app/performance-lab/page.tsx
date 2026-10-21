'use client';

import { useState } from 'react';
import { BarChart3, Play, RefreshCw } from 'lucide-react';
import { linearSearch, binarySearch, interpolationSearch, bubbleSort, selectionSort, insertionSort, mergeSort } from '@/lib/dsa-engine';

interface BenchmarkResult {
  algorithm: string;
  datasetSize: number;
  datasetType: string;
  comparisons: number;
  timeMs: number;
  result?: string;
}

function generateDataset(size: number, type: 'random' | 'sorted' | 'reverse'): number[] {
  const arr = Array.from({ length: size }, () => Math.floor(Math.random() * size * 10));
  if (type === 'sorted') arr.sort((a, b) => a - b);
  if (type === 'reverse') arr.sort((a, b) => b - a);
  return arr;
}

export default function PerformanceLabPage() {
  const [datasetSize, setDatasetSize] = useState(1000);
  const [datasetType, setDatasetType] = useState<'random' | 'sorted' | 'reverse'>('random');
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [running, setRunning] = useState(false);

  const runSearchBenchmarks = () => {
    setRunning(true);
    setTimeout(() => {
      const newResults: BenchmarkResult[] = [];
      const arr = generateDataset(datasetSize, 'sorted'); // searches need sorted for binary/interpolation
      const target = arr[Math.floor(arr.length * 0.73)]; // pick a value that exists

      // Linear Search
      const t1 = performance.now();
      const lr = linearSearch(arr, target);
      const t1e = performance.now();
      newResults.push({ algorithm: 'Linear Search', datasetSize, datasetType: 'sorted', comparisons: lr.comparisons, timeMs: t1e - t1, result: lr.found ? `Found at ${lr.index}` : 'Not found' });

      // Binary Search
      const t2 = performance.now();
      const br = binarySearch(arr, target);
      const t2e = performance.now();
      newResults.push({ algorithm: 'Binary Search', datasetSize, datasetType: 'sorted', comparisons: br.comparisons, timeMs: t2e - t2, result: br.found ? `Found at ${br.index}` : 'Not found' });

      // Interpolation Search
      const t3 = performance.now();
      const ir = interpolationSearch(arr, target);
      const t3e = performance.now();
      newResults.push({ algorithm: 'Interpolation Search', datasetSize, datasetType: 'sorted', comparisons: ir.comparisons, timeMs: t3e - t3, result: ir.found ? `Found at ${ir.index}` : 'Not found' });

      setResults((prev) => [...prev, ...newResults]);
      setRunning(false);
    }, 50);
  };

  const runSortBenchmarks = () => {
    setRunning(true);
    setTimeout(() => {
      const newResults: BenchmarkResult[] = [];
      const arr = generateDataset(datasetSize, datasetType);

      const sortAlgos = [
        { name: 'Bubble Sort', fn: bubbleSort },
        { name: 'Selection Sort', fn: selectionSort },
        { name: 'Insertion Sort', fn: insertionSort },
        { name: 'Merge Sort', fn: mergeSort },
      ];

      for (const algo of sortAlgos) {
        const r = algo.fn([...arr]);
        newResults.push({ algorithm: algo.name, datasetSize, datasetType, comparisons: r.comparisons, timeMs: r.timeMs });
      }

      setResults((prev) => [...prev, ...newResults]);
      setRunning(false);
    }, 50);
  };

  const maxTime = Math.max(...results.map((r) => r.timeMs), 0.001);
  const maxComparisons = Math.max(...results.map((r) => r.comparisons), 1);

  return (
    <>
      <div className="page-header"><h1>Algorithm Performance Lab</h1><p>Benchmark search and sort algorithms with actual measurements — browser timing may be noisy for small datasets</p></div>
      <div className="page-content">
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h2>Configuration</h2></div>
          <div className="card-body">
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Dataset Size</label>
                <select className="form-select" value={datasetSize} onChange={(e) => setDatasetSize(parseInt(e.target.value))}>
                  <option value="100">100</option><option value="500">500</option><option value="1000">1,000</option><option value="5000">5,000</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Dataset Type (for sorting)</label>
                <select className="form-select" value={datasetType} onChange={(e) => setDatasetType(e.target.value as 'random' | 'sorted' | 'reverse')}>
                  <option value="random">Random</option><option value="sorted">Sorted</option><option value="reverse">Reverse Sorted</option>
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', gap: 8, paddingTop: 24 }}>
                <button className="btn btn-primary" onClick={runSearchBenchmarks} disabled={running}><Play size={16} /> Run Search</button>
                <button className="btn btn-primary" onClick={runSortBenchmarks} disabled={running}><Play size={16} /> Run Sort</button>
                <button className="btn btn-secondary" onClick={() => setResults([])}><RefreshCw size={16} /> Clear</button>
              </div>
            </div>
            <div style={{ fontSize: 12, padding: 8, background: 'var(--bg-tertiary)', borderRadius: 6, marginTop: 8 }}>
              Note: All benchmarks use identical datasets for fair comparison. Binary and interpolation search always receive correctly sorted input. Browser timing (performance.now()) can exhibit noise, especially at small dataset sizes.
            </div>
          </div>
        </div>

        {results.length > 0 && (
          <>
            {/* Results Table */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><h2>Results ({results.length} runs)</h2></div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead><tr><th>Algorithm</th><th>Size</th><th>Type</th><th>Comparisons</th><th>Time (ms)</th><th>Result</th></tr></thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{r.algorithm}</td>
                        <td>{r.datasetSize.toLocaleString()}</td>
                        <td>{r.datasetType}</td>
                        <td style={{ fontWeight: 600 }}>{r.comparisons.toLocaleString()}</td>
                        <td style={{ fontWeight: 600 }}>{r.timeMs.toFixed(3)}</td>
                        <td style={{ fontSize: 12 }}>{r.result || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual Chart */}
            <div className="grid-2">
              <div className="card">
                <div className="card-header"><h2>Comparisons</h2></div>
                <div className="card-body">
                  {results.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ width: 140, fontSize: 11, fontWeight: 500 }}>{r.algorithm}</span>
                      <div style={{ flex: 1, height: 20, background: 'var(--bg-tertiary)', borderRadius: 3 }}>
                        <div style={{ width: `${(r.comparisons / maxComparisons) * 100}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: 3, minWidth: 2 }} />
                      </div>
                      <span style={{ width: 60, fontSize: 11, textAlign: 'right' }}>{r.comparisons}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-header"><h2>Time (ms)</h2></div>
                <div className="card-body">
                  {results.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ width: 140, fontSize: 11, fontWeight: 500 }}>{r.algorithm}</span>
                      <div style={{ flex: 1, height: 20, background: 'var(--bg-tertiary)', borderRadius: 3 }}>
                        <div style={{ width: `${(r.timeMs / maxTime) * 100}%`, height: '100%', background: '#2563EB', borderRadius: 3, minWidth: 2 }} />
                      </div>
                      <span style={{ width: 60, fontSize: 11, textAlign: 'right' }}>{r.timeMs.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Complexity Reference */}
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-header"><h2>Complexity Reference</h2></div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead><tr><th>Algorithm</th><th>Best</th><th>Average</th><th>Worst</th><th>Space</th></tr></thead>
                  <tbody>
                    <tr><td>Linear Search</td><td>O(1)</td><td>O(n)</td><td>O(n)</td><td>O(1)</td></tr>
                    <tr><td>Binary Search</td><td>O(1)</td><td>O(log n)</td><td>O(log n)</td><td>O(1)</td></tr>
                    <tr><td>Interpolation Search</td><td>O(1)</td><td>O(log log n)*</td><td>O(n)</td><td>O(1)</td></tr>
                    <tr><td>Bubble Sort</td><td>O(n)</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td></tr>
                    <tr><td>Selection Sort</td><td>O(n²)</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td></tr>
                    <tr><td>Insertion Sort</td><td>O(n)</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td></tr>
                    <tr><td>Merge Sort</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n)</td></tr>
                    <tr><td>BFS</td><td colSpan={3}>O(V + E)</td><td>O(V)</td></tr>
                    <tr><td>DFS</td><td colSpan={3}>O(V + E)</td><td>O(V)</td></tr>
                    <tr><td>Dijkstra</td><td colSpan={3}>O(V² or (V+E)log V)</td><td>O(V)</td></tr>
                  </tbody>
                </table>
                <div style={{ padding: '8px 16px', fontSize: 11, color: 'var(--text-muted)' }}>
                  * Interpolation search O(log log n) average assumes approximately uniform distribution. Not always faster than binary search.
                </div>
              </div>
            </div>
          </>
        )}

        {results.length === 0 && (
          <div className="empty-state"><BarChart3 size={48} /><h3>No Benchmark Results</h3><p>Configure dataset size and run search or sort benchmarks to see actual performance measurements.</p></div>
        )}
      </div>
    </>
  );
}

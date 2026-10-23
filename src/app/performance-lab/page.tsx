'use client';

import Link from 'next/link';
import { BarChart3, Package, Route, ArrowRight, Sparkles } from 'lucide-react';

export default function PerformanceLabRedirectPage() {
  return (
    <>
      <div className="page-header">
        <h1>Algorithm Performance & Benchmarking</h1>
        <p>Live execution measurements embedded into real inventory sorting and redistribution workflows</p>
      </div>

      <div className="page-content">
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Sparkles size={22} color="var(--color-primary)" />
            <h2 style={{ fontSize: 18, margin: 0 }}>Performance Lab Has Been Integrated In-Place</h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 800 }}>
            Rather than benchmarking synthetic random arrays in isolation, algorithm performance metrics (execution time in ms and exact comparison counts) are measured live on actual blood inventory records and redistribution candidate transfers.
          </p>
        </div>

        <div className="grid-2" style={{ gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Package size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: 15, margin: 0 }}>Inventory Sorting & Search Benchmarks</h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Execute live comparisons between:
              <br />• <strong>Bubble Sort vs Selection Sort vs Insertion Sort vs Merge Sort</strong> on active blood units
              <br />• <strong>Linear Search vs Binary Search vs Interpolation Search vs Hash Table Lookup</strong> with step traces and comparison counts
            </p>
            <Link href="/inventory" className="btn btn-primary btn-sm">
              View Inventory Benchmarks <ArrowRight size={13} />
            </Link>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Route size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: 15, margin: 0 }}>Redistribution Feasibility Ranking</h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Benchmark sorting algorithms on feasibility candidate recommendations ranked by usable time remaining, feasibility score, or expiry timestamp with deterministic tie-breaking.
            </p>
            <Link href="/redistribution" className="btn btn-primary btn-sm">
              View Redistribution Ranking <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

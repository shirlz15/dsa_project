'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';

export default function StoreInitializer({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const demoLoaded = useStore((s) => s.demoLoaded);
  const loadDemoScenario = useStore((s) => s.loadDemoScenario);

  useEffect(() => {
    setHydrated(true);
    // Auto-load demo on first visit
    if (!demoLoaded) {
      loadDemoScenario();
    }
  }, [demoLoaded, loadDemoScenario]);

  if (!hydrated) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-primary)',
        color: 'var(--text-secondary)', fontSize: 14,
      }}>
        Loading Blood Navigator...
      </div>
    );
  }

  return <>{children}</>;
}

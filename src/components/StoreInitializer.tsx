'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useStore } from '@/lib/store';

const emptySubscribe = () => () => {};

export default function StoreInitializer({ children }: { children: React.ReactNode }) {
  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const demoLoaded = useStore((s) => s.demoLoaded);
  const loadDemoScenario = useStore((s) => s.loadDemoScenario);

  useEffect(() => {
    // Auto-load demo on first visit
    if (!demoLoaded) {
      loadDemoScenario();
    }
  }, [demoLoaded, loadDemoScenario]);

  if (!isHydrated) {
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

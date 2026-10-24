'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useStore } from '@/lib/store';

const emptySubscribe = () => () => {};

export default function StoreInitializer({ children }: { children: React.ReactNode }) {
  const demoLoaded = useStore((s) => s.demoLoaded);
  const loadDemoScenario = useStore((s) => s.loadDemoScenario);

  useEffect(() => {
    // Auto-load demo scenario on first client mount if not already loaded
    if (!demoLoaded) {
      loadDemoScenario();
    } else {
      useStore.getState().syncExpiryAlerts();
    }
  }, [demoLoaded, loadDemoScenario]);

  return <>{children}</>;
}

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function StoreInitializer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const demoLoaded = useStore((s) => s.demoLoaded);
  const loadDemoScenario = useStore((s) => s.loadDemoScenario);
  const loginAdmin = useStore((s) => s.loginAdmin);
  const logoutAdmin = useStore((s) => s.logoutAdmin);

  // Synchronize server-verified HttpOnly session into client Zustand store on load and route changes
  useEffect(() => {
    let mounted = true;
    async function syncSession() {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) {
          if (data.authenticated && data.user) {
            loginAdmin(data.user);
          } else {
            logoutAdmin();
          }
        }
      } catch (err) {
        console.error('Session sync error:', err);
      }
    }
    syncSession();
    return () => {
      mounted = false;
    };
  }, [pathname, loginAdmin, logoutAdmin]);

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

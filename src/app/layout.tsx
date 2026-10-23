import type { Metadata } from 'next';
import './globals.css';
import LayoutShell from '@/components/LayoutShell';
import StoreInitializer from '@/components/StoreInitializer';

export const metadata: Metadata = {
  title: 'Blood Navigator | Time-Aware Blood Expiry Monitoring & Redistribution',
  description: 'A time-aware blood expiry monitoring and inventory redistribution system with drone simulation — DSA Internal Assessment Project.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <StoreInitializer>
          <LayoutShell>
            {children}
          </LayoutShell>
        </StoreInitializer>
      </body>
    </html>
  );
}

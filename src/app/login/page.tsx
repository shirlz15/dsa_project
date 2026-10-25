'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import {
  Shield, Lock, Key, Droplets, AlertTriangle,
  ArrowRight, Info, Eye, EyeOff, Play
} from 'lucide-react';
import Link from 'next/link';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnTo = searchParams.get('from');
  const returnTo = rawReturnTo && rawReturnTo !== '/login' ? rawReturnTo : '/dashboard';
  const loginAdmin = useStore((s) => s.loginAdmin);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // If user already has a valid server session, redirect to destination
  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          loginAdmin({
            id: data.user.id || data.user.userId,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            facility: data.user.facility,
            badgeNumber: data.user.badgeNumber,
            sessionToken: data.user.sessionToken,
            authenticatedAt: data.user.authenticatedAt,
          });
          router.refresh();
          router.replace(returnTo);
        }
      })
      .catch(() => {});
  }, [router, returnTo, loginAdmin]);

  // ── Credential Login ─────────────────────────────────────────────────────
  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Sync client store with server session immediately
        loginAdmin({
          id: data.user.id || data.user.userId || 'ADMIN-NA-7701',
          name: data.user.name || 'Dr. Ramesh Kumar',
          email: data.user.email || email,
          role: data.user.role || 'Network Director',
          facility: data.user.facility || 'State Emergency Hematology Logistics Command',
          badgeNumber: data.user.badgeNumber || 'BN-DIR-0881',
          sessionToken: data.user.sessionToken || `SES-DEMO-${Date.now()}`,
          authenticatedAt: new Date().toISOString(),
        });
        // Invalidate Next.js client router cache so protected route loads immediately without browser refresh
        router.refresh();
        router.replace(returnTo);
      } else {
        setError(data.error || 'Authentication failed. Please check your credentials.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Demo Admin Session ───────────────────────────────────────────────────
  const handleDemoLogin = async () => {
    setError('');
    setDemoLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        loginAdmin({
          id: data.user.id || data.user.userId || 'ADMIN-NA-7701',
          name: data.user.name || 'Dr. Ramesh Kumar',
          email: data.user.email || 'admin@bloodnavigator.org',
          role: data.user.role || 'Network Director',
          facility: data.user.facility || 'State Emergency Hematology Logistics Command',
          badgeNumber: data.user.badgeNumber || 'BN-DIR-0881',
          sessionToken: data.user.sessionToken || `SES-DEMO-SIM-${Date.now()}`,
          authenticatedAt: new Date().toISOString(),
        });
        router.refresh();
        router.replace(returnTo);
      } else {
        setError(data.error || 'Demo session creation failed.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background glow effects */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      <div style={styles.container}>
        {/* Back to presentation link */}
        <Link href="/" style={styles.backLink}>
          <Play size={14} />
          <span>Back to System Presentation</span>
        </Link>

        {/* Login card */}
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.iconBox}>
              <Shield size={28} color="#ffffff" />
            </div>
            <h1 style={styles.title}>Blood Navigator</h1>
            <p style={styles.subtitle}>Admin Console Authentication</p>
            <p style={styles.facilityLabel}>
              State Emergency Hematology Logistics Command
            </p>
          </div>

          {/* Disclosure banner */}
          <div style={styles.disclosure}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Simulated demonstration authentication for DSA academic project.
              Not production-grade security.
            </span>
          </div>

          {/* Demo Credentials Helper Box */}
          <div style={styles.credentialsBox}>
            <div style={styles.credentialsHeader}>
              <Key size={13} color="#38bdf8" />
              <span>Valid Demo Administrator Credentials</span>
            </div>
            <div style={styles.credentialsBody}>
              <div><span style={{ color: '#94a3b8' }}>Email:</span> <strong style={{ color: '#f1f5f9' }}>admin@bloodnavigator.org</strong></div>
              <div><span style={{ color: '#94a3b8' }}>Password:</span> <strong style={{ color: '#f1f5f9' }}>password</strong> <span style={{ color: '#64748b' }}>(or admin123)</span></div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@bloodnavigator.org');
                setPassword('password');
                setError('');
              }}
              style={styles.autofillBtn}
            >
              Auto-fill Demo Credentials
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div style={styles.errorBanner}>
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Credential form */}
          <form onSubmit={handleCredentialLogin} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                <Key size={13} />
                <span>Admin Email</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bloodnavigator.org"
                style={styles.input}
                autoComplete="email"
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                <Lock size={13} />
                <span>Password</span>
              </label>
              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  style={{ ...styles.input, paddingRight: '40px' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{
                ...styles.primaryBtn,
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
            >
              {loading ? 'Authenticating…' : 'Sign In to Admin Console'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Divider */}
          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>or</span>
            <span style={styles.dividerLine} />
          </div>

          {/* Demo access button */}
          <button
            onClick={handleDemoLogin}
            style={{
              ...styles.demoBtn,
              opacity: demoLoading ? 0.7 : 1,
            }}
            disabled={demoLoading}
          >
            <Droplets size={16} />
            <span>
              {demoLoading
                ? 'Starting Demo Session…'
                : 'Launch Simulated Demo Admin Session'}
            </span>
          </button>
          <p style={styles.demoCaveat}>
            Creates a pre-configured demo session with sample blood bank data.
            No real credentials required.
          </p>

          {/* Footer */}
          <div style={styles.footer}>
            <span>Blood Navigator · DSA Internal Assessment</span>
            <span>Next.js 16 · Turbopack</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={styles.page}>
          <div style={{ color: '#94a3b8', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>
            Loading authentication console…
          </div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#050810',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bgGlow1: {
    position: 'absolute',
    top: '-20%',
    left: '-10%',
    width: '50%',
    height: '50%',
    background: 'radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgGlow2: {
    position: 'absolute',
    bottom: '-20%',
    right: '-10%',
    width: '50%',
    height: '50%',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  container: {
    width: '100%',
    maxWidth: '480px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'relative',
    zIndex: 1,
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#64748b',
    fontSize: '13px',
    textDecoration: 'none',
    transition: 'color 0.2s',
    alignSelf: 'flex-start',
  },
  card: {
    background: 'rgba(13, 17, 29, 0.92)',
    border: '1px solid rgba(220, 38, 38, 0.3)',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(220, 38, 38, 0.12)',
    padding: '36px',
    color: '#f1f5f9',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  iconBox: {
    width: '56px',
    height: '56px',
    margin: '0 auto 16px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #dc2626, #7f1d1d)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 25px rgba(220, 38, 38, 0.5)',
  },
  title: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#f1f5f9',
    margin: '0 0 4px',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: '0 0 6px',
    fontWeight: 500,
  },
  facilityLabel: {
    fontSize: '11px',
    color: '#64748b',
    margin: 0,
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  disclosure: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '10px 12px',
    background: 'rgba(234, 179, 8, 0.08)',
    border: '1px solid rgba(234, 179, 8, 0.25)',
    borderRadius: '8px',
    fontSize: '11px',
    color: '#fde047',
    lineHeight: 1.5,
    marginBottom: '16px',
  },
  credentialsBox: {
    background: 'rgba(56, 189, 248, 0.05)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    borderRadius: '8px',
    padding: '12px 14px',
    marginBottom: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  credentialsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#38bdf8',
  },
  credentialsBody: {
    fontSize: '11px',
    color: '#cbd5e1',
    lineHeight: 1.6,
  },
  autofillBtn: {
    alignSelf: 'flex-start',
    background: 'rgba(56, 189, 248, 0.12)',
    color: '#7dd3fc',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.15s ease',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    background: 'rgba(220, 38, 38, 0.1)',
    border: '1px solid rgba(220, 38, 38, 0.35)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#fca5a5',
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'opacity 0.2s, transform 0.1s',
    boxShadow: '0 4px 16px rgba(220, 38, 38, 0.35)',
    marginTop: '4px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '20px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    fontSize: '12px',
    color: '#475569',
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.1em',
  },
  demoBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '13px',
    background: 'rgba(30, 41, 59, 0.8)',
    color: '#94a3b8',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s',
  },
  demoCaveat: {
    fontSize: '11px',
    color: '#475569',
    textAlign: 'center',
    marginTop: '8px',
    lineHeight: 1.4,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#334155',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
};

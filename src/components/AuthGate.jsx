import { useState } from 'react';
import { configured } from '../lib/supabaseClient.js';
import { useAuth } from '../state/useAuth.js';

function NotConfigured() {
  return (
    <div className="app-screen pad" style={{ paddingTop: 40 }}>
      <h2 className="h2" style={{ marginBottom: 12 }}>Almost there</h2>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted)' }}>
        This build isn&rsquo;t connected to a database yet — <code className="mono">VITE_SUPABASE_URL</code> and{' '}
        <code className="mono">VITE_SUPABASE_ANON_KEY</code> aren&rsquo;t set.
      </p>
    </div>
  );
}

function AuthForm({ auth }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [justSignedUp, setJustSignedUp] = useState(false);

  const submit = async () => {
    setBusy(true);
    if (mode === 'signin') {
      await auth.signIn(email, password);
    } else {
      const ok = await auth.signUp(email, password);
      if (ok) setJustSignedUp(true);
    }
    setBusy(false);
  };

  if (justSignedUp) {
    return (
      <div className="app-screen pad" style={{ paddingTop: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 34, marginBottom: 12 }}>✈️</div>
        <h2 className="h2" style={{ marginBottom: 10 }}>Check your email</h2>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted)' }}>
          We sent a confirmation link to <strong>{email}</strong>. Open it, then come back here and sign in.
        </p>
        <button type="button" className="btn-outline" style={{ marginTop: 20, padding: '12px 20px', fontSize: 11 }} onClick={() => { setJustSignedUp(false); setMode('signin'); }}>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="app-screen pad" style={{ paddingTop: 60 }}>
      <h2 className="h2" style={{ marginBottom: 6 }}>Voyager</h2>
      <p className="mono" style={{ fontSize: 11.5, color: 'var(--muted-2)', marginBottom: 28 }}>
        {mode === 'signin' ? 'Sign in to your trips' : 'Create an account'}
      </p>

      <label className="field-label" htmlFor="auth-email">Email</label>
      <input
        id="auth-email" type="text" inputMode="email" autoComplete="email"
        value={email} onChange={(e) => setEmail(e.target.value)}
        style={{ marginBottom: 14 }}
      />
      <label className="field-label" htmlFor="auth-password">Password</label>
      <input
        id="auth-password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
        value={password} onChange={(e) => setPassword(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      {auth.error && (
        <div style={{ fontSize: 12.5, color: 'var(--terra)', marginBottom: 16, lineHeight: 1.5 }}>{auth.error}</div>
      )}

      <button type="button" className="btn-dark" style={{ width: '100%', padding: 15, fontSize: 11.5, marginBottom: 16 }} onClick={submit} disabled={busy || !email || !password}>
        {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
      </button>

      <button
        type="button"
        className="mono"
        style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--muted)', width: '100%', textAlign: 'center' }}
        onClick={() => { auth.setError(''); setMode(mode === 'signin' ? 'signup' : 'signin'); }}
      >
        {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}

function HouseholdSetup({ auth }) {
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    if (tab === 'create') await auth.createHousehold(name.trim() || 'Me');
    else await auth.joinHousehold(code, name.trim() || 'Me');
    setBusy(false);
  };

  return (
    <div className="app-screen pad" style={{ paddingTop: 60 }}>
      <h2 className="h2" style={{ marginBottom: 6 }}>One more step</h2>
      <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 22 }}>
        Trips are shared within a household. Start one, or join one someone already started.
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        <button type="button" className={'pill' + (tab === 'create' ? ' on' : '')} style={{ flex: 1, textAlign: 'center' }} onClick={() => setTab('create')}>Start new</button>
        <button type="button" className={'pill' + (tab === 'join' ? ' on' : '')} style={{ flex: 1, textAlign: 'center' }} onClick={() => setTab('join')}>Join existing</button>
      </div>

      <label className="field-label" htmlFor="hh-name">Your name</label>
      <input id="hh-name" type="text" placeholder="Rodolfo" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 16 }} />

      {tab === 'join' && (
        <>
          <label className="field-label" htmlFor="hh-code">Invite code</label>
          <input id="hh-code" type="text" placeholder="from whoever started the household" value={code} onChange={(e) => setCode(e.target.value)} style={{ marginBottom: 16 }} />
        </>
      )}

      {auth.error && (
        <div style={{ fontSize: 12.5, color: 'var(--terra)', marginBottom: 16, lineHeight: 1.5 }}>{auth.error}</div>
      )}

      <button
        type="button"
        className="btn-primary"
        style={{ width: '100%', padding: 15, fontSize: 11.5, borderRadius: 14 }}
        onClick={submit}
        disabled={busy || !name.trim() || (tab === 'join' && !code.trim())}
      >
        {busy ? 'Working…' : tab === 'create' ? 'Start household' : 'Join household'}
      </button>
    </div>
  );
}

/** Gates the app behind auth + household membership; renders children once both are satisfied. */
export default function AuthGate({ children }) {
  const auth = useAuth();

  if (!configured) return <NotConfigured />;
  if (auth.loading) return <div className="app-screen" />;
  if (!auth.user) return <AuthForm auth={auth} />;
  if (!auth.household) return <HouseholdSetup auth={auth} />;
  return children(auth);
}

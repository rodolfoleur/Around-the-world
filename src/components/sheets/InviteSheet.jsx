import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';

/**
 * Per-trip sharing — this trip's own invite code, and who currently has
 * access to it (household members, plus anyone who joined via a code).
 * Deliberately trip-scoped: redeeming this code only ever grants access to
 * this one trip, never the inviter's whole household or their other trips.
 */
export default function InviteSheet({ trip }) {
  const { meta, closeSheet } = trip;
  const [code, setCode] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      const [codeRes, membersRes] = await Promise.all([
        supabase.rpc('get_trip_invite', { target_trip_id: meta.id }),
        supabase.rpc('trip_access_list', { target_trip_id: meta.id }),
      ]);
      if (cancelled) return;
      if (codeRes.error) setError(codeRes.error.message);
      else setCode(codeRes.data || '');
      if (!membersRes.error) setMembers(membersRes.data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [meta.id]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the code is still visible to copy by hand */
    }
  };

  return (
    <div style={{ padding: '8px 22px 30px' }}>
      <h3 style={{ fontWeight: 700, letterSpacing: '-.025em', fontSize: 25, margin: '0 0 8px' }}>Invite to this trip</h3>
      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 20 }}>
        Anyone with this code can see and edit &ldquo;{meta.title}&rdquo; — just this trip, not any of your others.
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Loading…</div>
      ) : error ? (
        <div style={{ fontSize: 12.5, color: 'var(--terra)' }}>{error}</div>
      ) : (
        <>
          <div className="card" style={{ padding: '13px 15px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 }}>Invite code</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{code}</div>
            </div>
            <button type="button" className="btn-outline" style={{ padding: '9px 12px', fontSize: 10, flex: 'none' }} onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 10 }}>
            Who has access
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 6 }}>
            {members.map((m) => (
              <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 26, height: 26, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10.5, fontWeight: 600, color: 'var(--bone)', background: m.color, flex: 'none',
                  }}
                >{(m.display_name?.[0] || '?').toUpperCase()}</span>
                <span style={{ flex: 1, fontSize: 13.5 }}>{m.display_name}</span>
                <span className="mono" style={{ fontSize: 9.5, color: 'var(--muted-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {m.via === 'household' ? 'Household' : 'Invited'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <button type="button" onClick={closeSheet} className="btn-outline" style={{ width: '100%', padding: 13, fontSize: 11, marginTop: 20 }}>
        Close
      </button>
    </div>
  );
}

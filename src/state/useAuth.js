import { useCallback, useEffect, useState } from 'react';
import { supabase, configured } from '../lib/supabaseClient.js';

/**
 * Auth + household membership. A household is the sharing boundary —
 * everyone in it sees and edits the same trips in real time.
 */
export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [household, setHousehold] = useState(null); // { householdId, inviteCode } | null
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');

  const loadHousehold = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('my_household');
    if (err) { setError(err.message); return; }
    const row = data?.[0];
    if (!row?.household_id) { setHousehold(null); setMembers([]); return; }
    setHousehold({ householdId: row.household_id, inviteCode: row.invite_code });
    const { data: memberRows } = await supabase
      .from('household_members')
      .select('user_id, display_name, color')
      .eq('household_id', row.household_id);
    setMembers(memberRows || []);
  }, []);

  useEffect(() => {
    if (!configured) { setLoading(false); return; }
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (session) loadHousehold();
    else { setHousehold(null); setMembers([]); }
  }, [session, loadHousehold]);

  const signUp = useCallback(async (email, password) => {
    setError('');
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) setError(err.message);
    return !err;
  }, []);

  const signIn = useCallback(async (email, password) => {
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    return !err;
  }, []);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  const createHousehold = useCallback(async (displayName) => {
    setError('');
    const { error: err } = await supabase.rpc('create_household', { display_name: displayName });
    if (err) { setError(err.message); return false; }
    await loadHousehold();
    return true;
  }, [loadHousehold]);

  const joinHousehold = useCallback(async (inviteCode, displayName) => {
    setError('');
    const { error: err } = await supabase.rpc('join_household', {
      invite_code: inviteCode.trim().toLowerCase(), display_name: displayName,
    });
    if (err) { setError(err.message); return false; }
    await loadHousehold();
    return true;
  }, [loadHousehold]);

  return {
    loading, session, user: session?.user || null, household, members, error, setError,
    signUp, signIn, signOut, createHousehold, joinHousehold,
  };
}

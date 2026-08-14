import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, configured } from '../lib/supabaseClient.js';

/**
 * Auth + household membership. A household is the sharing boundary —
 * everyone in it sees and edits the same trips (and the "Where we've
 * been" world map) in real time.
 */
export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [household, setHousehold] = useState(null); // { householdId, inviteCode } | null
  const [members, setMembers] = useState([]);
  const [visitedCountries, setVisitedCountriesState] = useState({});
  const [error, setError] = useState('');

  // Always-current mirror of visitedCountries, so setVisitedCountries below
  // merges against the freshest known value instead of a stale closure —
  // same reasoning as the trip-level metaRef pattern (two quick country
  // toggles landing close together shouldn't be able to clobber each other).
  const visitedCountriesRef = useRef(visitedCountries);
  visitedCountriesRef.current = visitedCountries;

  const loadHousehold = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('my_household');
    if (err) { setError(err.message); return; }
    const row = data?.[0];
    if (!row?.household_id) { setHousehold(null); setMembers([]); setVisitedCountriesState({}); return; }
    setHousehold({ householdId: row.household_id, inviteCode: row.invite_code });
    const [{ data: memberRows }, { data: householdRow }] = await Promise.all([
      supabase.from('household_members').select('user_id, display_name, color').eq('household_id', row.household_id),
      supabase.from('households').select('visited_countries').eq('id', row.household_id).single(),
    ]);
    setMembers(memberRows || []);
    setVisitedCountriesState(householdRow?.visited_countries || {});
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
    else { setHousehold(null); setMembers([]); setVisitedCountriesState({}); }
  }, [session, loadHousehold]);

  // Keeps visited_countries live-synced across devices — a change Rodolfo
  // makes on his phone shows up on Kirsten's laptop without a reload, the
  // same way trip edits already do.
  useEffect(() => {
    const householdId = household?.householdId;
    if (!householdId) return;
    const channel = supabase
      .channel(`household-${householdId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'households', filter: `id=eq.${householdId}` },
        (payload) => setVisitedCountriesState(payload.new.visited_countries || {}))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [household?.householdId]);

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

  /** Merges `entries` into visited_countries and persists it — optimistic
   * locally, reverted with an error message if the write fails. `entries`
   * is a partial patch (e.g. `{ Mexico: ['uid1','uid2'] }`); pass an empty
   * array as a country's value to mark it as "no longer visited" without
   * losing other countries.
   *
   * `.select('id')` (rather than just checking `error`) is what catches a
   * write RLS silently blocks — Postgres/PostgREST reports that as success
   * with zero rows affected, not an error, so a bare `.update()` would
   * report "saved" while nothing actually changed. Same shape as
   * useTripsStore's deleteTrip, for the same reason. */
  const setVisitedCountries = useCallback(async (entries) => {
    if (!household?.householdId) return { ok: false, error: 'No household yet.' };
    const previous = visitedCountriesRef.current;
    const next = { ...previous, ...entries };
    setVisitedCountriesState(next); // optimistic
    const { data, error: err } = await supabase
      .from('households')
      .update({ visited_countries: next })
      .eq('id', household.householdId)
      .select('id');
    if (err || !data || data.length === 0) {
      setVisitedCountriesState(previous); // revert — a silent-looking failure is worse than a visible one
      return { ok: false, error: err?.message || "That change couldn't be saved." };
    }
    return { ok: true };
  }, [household?.householdId]);

  return {
    loading, session, user: session?.user || null, household, members, visitedCountries, error, setError,
    signUp, signIn, signOut, createHousehold, joinHousehold, setVisitedCountries,
  };
}

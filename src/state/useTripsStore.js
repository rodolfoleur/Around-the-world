import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { rowToTrip, tripToInsertRow, patchToRow, mergeRealtimeRow } from '../lib/tripMapper.js';
import { babymoonTrip, createEmptyTrip } from '../data/tripsRegistry.js';

/**
 * The live, realtime-synced list of trips visible to this user — every
 * trip their household owns, *plus* any trip someone else shared with them
 * individually via a trip-level invite (see join_trip/trip_shares). No
 * household_id filter here on purpose: which trips come back is entirely
 * up to the `trips` table's RLS policy (has_trip_access), so this always
 * matches whatever the two access paths (household membership, trip
 * share) actually allow — the same reason the realtime subscription below
 * has no filter either, and instead relies on Realtime enforcing RLS per
 * subscriber.
 */
export function useTripsStore(householdId, userId) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(null);
  const seeded = useRef(false);
  const clearSaveError = useCallback(() => setSaveError(null), []);

  const upsertLocal = useCallback((row) => {
    setTrips((prev) => {
      const i = prev.findIndex((t) => t.id === row.id);
      if (i === -1) return [...prev, rowToTrip(row)];
      const next = prev.slice();
      next[i] = mergeRealtimeRow(prev[i], row);
      return next;
    });
  }, []);

  const removeLocal = useCallback((id) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadTrips = useCallback(async () => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('start_date', { ascending: true });
    if (error) { setLoading(false); return; }

    if ((data || []).length === 0 && !seeded.current) {
      // Brand-new household with nothing shared with them either — preload
      // the one curated trip so there's something real to look at, exactly
      // like the local-only build.
      seeded.current = true;
      const seed = tripToInsertRow(babymoonTrip(), householdId, userId);
      const { data: inserted } = await supabase.from('trips').insert(seed).select().single();
      if (inserted) setTrips([rowToTrip(inserted)]);
    } else {
      setTrips((data || []).map(rowToTrip));
    }
    setLoading(false);
  }, [householdId, userId]);

  useEffect(() => {
    if (!householdId) return;
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      await loadTrips();
    })();

    const channel = supabase
      .channel(`trips-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trips' },
        (payload) => upsertLocal(payload.new))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips' },
        (payload) => upsertLocal(payload.new))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'trips' },
        (payload) => removeLocal(payload.old.id))
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId, userId, upsertLocal, removeLocal]);

  const createTrip = useCallback(async (fields) => {
    const trip = createEmptyTrip(fields);
    const row = tripToInsertRow(trip, householdId, userId);
    const { data, error } = await supabase.from('trips').insert(row).select().single();
    if (error || !data) return null;
    upsertLocal(data); // don't wait for the realtime echo — open it immediately
    return data.id;
  }, [householdId, userId, upsertLocal]);

  /** Patches one trip and pushes it to Supabase. */
  const updateTrip = useCallback(async (tripId, patch) => {
    // optimistic local update so the UI feels instant on this device
    let previousTrips;
    setTrips((prev) => {
      previousTrips = prev;
      return prev.map((t) => (t.id === tripId ? { ...t, ...patch } : t));
    });
    const row = patchToRow(patch);
    if (Object.keys(row).length === 0) return;

    const { error } = await supabase.from('trips').update(row).eq('id', tripId);
    if (error) {
      // The optimistic update above made this look saved when it wasn't —
      // exactly the "works until you refresh, and never shows up on the
      // other device" bug. Undo it (restoring just this trip, so anything
      // else that changed in the meantime — a realtime echo, another edit
      // — is untouched) and surface the real error instead of swallowing
      // it, since a silent failure here is worse than a visible one.
      console.error('updateTrip: save failed, reverting the optimistic local update', { tripId, patch, error });
      setTrips((prev) => {
        const prevTrip = previousTrips.find((t) => t.id === tripId);
        if (!prevTrip) return prev;
        return prev.map((t) => (t.id === tripId ? prevTrip : t));
      });
      setSaveError(error.message || 'That change could not be saved.');
    }
  }, []);

  /**
   * Redeems a trip-level invite code (see join_trip in schema.sql) — grants
   * access to exactly one trip, never the inviter's household or their
   * other trips. Joining a trip doesn't touch the `trips` row itself (only
   * trip_shares), so there's no INSERT/UPDATE event for realtime to push —
   * an explicit reload is what actually makes the newly-shared trip show up.
   */
  const joinTrip = useCallback(async (inviteCode, displayName) => {
    const { error } = await supabase.rpc('join_trip', {
      invite_code: inviteCode.trim().toLowerCase(), display_name: displayName,
    });
    if (error) return { ok: false, error: error.message };
    await loadTrips();
    return { ok: true };
  }, [loadTrips]);

  return { trips, loading, createTrip, updateTrip, saveError, clearSaveError, joinTrip };
}

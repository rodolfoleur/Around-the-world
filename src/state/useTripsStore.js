import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { rowToTrip, tripToInsertRow, patchToRow } from '../lib/tripMapper.js';
import { babymoonTrip, createEmptyTrip } from '../data/tripsRegistry.js';

/**
 * The live, realtime-synced list of trips for a household. Every device
 * signed into the same household sees the same list — an insert/update
 * from any one of them arrives here as a Postgres Changes event and
 * updates local state, no polling.
 */
export function useTripsStore(householdId, userId) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const seeded = useRef(false);

  const upsertLocal = useCallback((row) => {
    const trip = rowToTrip(row);
    setTrips((prev) => {
      const i = prev.findIndex((t) => t.id === trip.id);
      if (i === -1) return [...prev, trip];
      const next = prev.slice();
      next[i] = trip;
      return next;
    });
  }, []);

  const removeLocal = useCallback((id) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!householdId) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('household_id', householdId)
        .order('start_date', { ascending: true });
      if (cancelled) return;
      if (error) { setLoading(false); return; }

      if ((data || []).length === 0 && !seeded.current) {
        // Brand-new household — preload the one curated trip so there's
        // something real to look at, exactly like the local-only build.
        seeded.current = true;
        const seed = tripToInsertRow(babymoonTrip(), householdId, userId);
        const { data: inserted } = await supabase.from('trips').insert(seed).select().single();
        if (inserted && !cancelled) setTrips([rowToTrip(inserted)]);
      } else {
        setTrips((data || []).map(rowToTrip));
      }
      setLoading(false);
    })();

    const channel = supabase
      .channel(`trips-${householdId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trips', filter: `household_id=eq.${householdId}` },
        (payload) => upsertLocal(payload.new))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips', filter: `household_id=eq.${householdId}` },
        (payload) => upsertLocal(payload.new))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'trips', filter: `household_id=eq.${householdId}` },
        (payload) => removeLocal(payload.old.id))
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [householdId, userId, upsertLocal, removeLocal]);

  const createTrip = useCallback(async (fields) => {
    const trip = createEmptyTrip(fields);
    const row = tripToInsertRow(trip, householdId, userId);
    const { data, error } = await supabase.from('trips').insert(row).select().single();
    if (error || !data) return null;
    upsertLocal(data); // don't wait for the realtime echo — open it immediately
    return data.id;
  }, [householdId, userId, upsertLocal]);

  /** Patches one trip (only extraCosts/extraActivities today) and pushes it to Supabase. */
  const updateTrip = useCallback(async (tripId, patch) => {
    // optimistic local update so the UI feels instant on this device
    setTrips((prev) => prev.map((t) => (t.id === tripId ? { ...t, ...patch } : t)));
    const row = patchToRow(patch);
    if (Object.keys(row).length === 0) return;
    await supabase.from('trips').update(row).eq('id', tripId);
  }, []);

  return { trips, loading, createTrip, updateTrip };
}

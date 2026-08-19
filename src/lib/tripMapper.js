// Maps between the Postgres `trips` row shape (snake_case) and the trip
// descriptor shape the rest of the app already uses (camelCase) — the
// same shape the local-only version of this app used, so screens didn't
// need to change when the backend did.

export function rowToTrip(row) {
  return {
    id: row.id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    route: row.route || '',
    currency: row.currency || 'GBP',
    curated: row.curated,
    travelers: row.travelers || [],
    days: row.days || [],
    bookings: row.bookings || [],
    costs: row.costs || [],
    extraCosts: row.extra_costs || [],
    extraActivities: row.extra_activities || {},
    customCards: row.custom_cards || [],
    todos: row.todos || [],
    photos: row.photos || {},
    roadTrip: row.road_trip || false,
    journeyLegs: row.journey_legs || [],
    packing: row.packing || [],
    updatedAt: row.updated_at,
  };
}

export function tripToInsertRow(trip, householdId, userId) {
  return {
    household_id: householdId,
    title: trip.title,
    start_date: trip.startDate,
    end_date: trip.endDate,
    route: trip.route || '',
    currency: trip.currency || 'GBP',
    curated: !!trip.curated,
    travelers: trip.travelers || [],
    days: trip.days || [],
    bookings: trip.bookings || [],
    costs: trip.costs || [],
    extra_costs: trip.extraCosts || [],
    extra_activities: trip.extraActivities || {},
    custom_cards: trip.customCards || [],
    todos: trip.todos || [],
    photos: trip.photos || {},
    road_trip: !!trip.roadTrip,
    journey_legs: trip.journeyLegs || [],
    packing: trip.packing || [],
    created_by: userId,
  };
}

// Postgres logical replication (what Supabase Realtime rides on) can omit
// an *unchanged* jsonb column's value entirely on an UPDATE event once that
// column is large enough to be stored TOASTed out-of-line — unless the
// table has REPLICA IDENTITY FULL. So a realtime payload for "just added an
// activity" (which only actually changes extra_activities/extra_costs) can
// legitimately arrive with `days` missing/null even though the database
// itself is fine. Trusting that at face value is exactly what made "days"
// appear to vanish after adding an activity. `ARRAY_COLS`/`OBJECT_COLS` are
// the jsonb columns this can happen to, mapped to their camelCase trip key.
const ARRAY_COLS = { days: 'days', bookings: 'bookings', costs: 'costs', extra_costs: 'extraCosts', custom_cards: 'customCards', travelers: 'travelers', todos: 'todos', journey_legs: 'journeyLegs', packing: 'packing' };
const OBJECT_COLS = { extra_activities: 'extraActivities', photos: 'photos' };

/**
 * Merges a realtime `payload.new` row on top of the trip already showing
 * locally, refusing to let a column that merely *looks* empty in this
 * payload erase real content — see the unchanged-TOAST note above. Only
 * ever falls back to the previous value; a genuine clear-out (the user
 * actually deleting all bookings, say) still goes through fine, because
 * that update also touches other fields the same payload carries correctly.
 * Exported standalone (not inlined in the hook) so this can be unit tested
 * without React.
 */
export function mergeRealtimeRow(prevTrip, row) {
  if (!prevTrip) return rowToTrip(row);
  const safeRow = { ...row };
  for (const [col, key] of Object.entries(ARRAY_COLS)) {
    const incoming = row[col];
    const prevVal = prevTrip[key];
    const incomingLooksEmpty = incoming == null || (Array.isArray(incoming) && incoming.length === 0);
    if (incomingLooksEmpty && Array.isArray(prevVal) && prevVal.length > 0) {
      console.error(`mergeRealtimeRow: realtime update for "${col}" looked empty while local copy had ${prevVal.length} — keeping local value (likely an unchanged-TOAST realtime payload, not a real change)`, { tripId: row.id });
      safeRow[col] = prevVal;
    }
  }
  for (const [col, key] of Object.entries(OBJECT_COLS)) {
    const incoming = row[col];
    const prevVal = prevTrip[key];
    const incomingLooksEmpty = incoming == null || (typeof incoming === 'object' && Object.keys(incoming).length === 0);
    const prevHasContent = prevVal && typeof prevVal === 'object' && Object.keys(prevVal).length > 0;
    if (incomingLooksEmpty && prevHasContent) {
      console.error(`mergeRealtimeRow: realtime update for "${col}" looked empty while local copy had content — keeping local value (likely an unchanged-TOAST realtime payload, not a real change)`, { tripId: row.id });
      safeRow[col] = prevVal;
    }
  }
  return rowToTrip(safeRow);
}

const PATCH_KEY_MAP = {
  extraCosts: 'extra_costs',
  extraActivities: 'extra_activities',
  title: 'title',
  route: 'route',
  currency: 'currency',
  bookings: 'bookings',
  days: 'days',
  customCards: 'custom_cards',
  startDate: 'start_date',
  endDate: 'end_date',
  travelers: 'travelers',
  todos: 'todos',
  photos: 'photos',
  roadTrip: 'road_trip',
  journeyLegs: 'journey_legs',
  packing: 'packing',
};

/** Converts a partial camelCase patch (only the fields we actually mutate) into row column names. */
export function patchToRow(patch) {
  const row = {};
  for (const [k, v] of Object.entries(patch)) {
    const col = PATCH_KEY_MAP[k];
    if (col) row[col] = v;
  }
  return row;
}

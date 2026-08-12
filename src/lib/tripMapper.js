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
    created_by: userId,
  };
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

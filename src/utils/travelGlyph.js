/**
 * Air, land, or water — whichever a day's transit represents, as one glyph.
 * Shared by Calendar and Plan so both agree on what a day looked like.
 * "Ground" is this app's booking kind for taxi/car transfers (Booking.com
 * Rides, airport pickups, etc.) — NOT trains, so it maps to the car glyph.
 * The train glyph only ever comes from the text fallback below actually
 * saying "train"/"rail", for a trip that has a real one.
 */
export function travelGlyph(day, bookings) {
  if (!day?.transit?.length) return null;
  for (const t of day.transit) {
    const kind = bookings?.[t.bk]?.kind;
    if (kind === 'Flight') return '✈️';
    if (kind === 'Car' || kind === 'Ground') return '🚗';
    if (kind === 'Water' || kind === 'Boat') return '⛴️';
  }
  const s = (day.transit[0].t || '').toLowerCase();
  if (s.includes('car') || s.includes('sixt') || s.includes('taxi')) return '🚗';
  if (s.includes('boat') || s.includes('ferry') || s.includes('cruise') || s.includes('sail')) return '⛴️';
  if (s.includes('train') || s.includes('rail')) return '🚆';
  return '✈️';
}

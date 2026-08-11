import { SLOTS } from '../data/trip.js';

/**
 * Merges a day's seed parts (one string per slot, from the itinerary file)
 * with any activities the user has added on top, into an ordered list of
 * slot entries: { key, label, short, items: [{ text, extra? }] }.
 */
export function getDayParts(day, extraForDay = {}) {
  if (!day) return [];
  const parts = day.parts || {};
  const out = [];
  SLOTS.forEach(([key, short, label]) => {
    const items = [];
    if (parts[key]) items.push({ text: parts[key] });
    (extraForDay[key] || []).forEach((e) => items.push({ text: e.text, extra: true, kind: e.kind, time: e.time, location: e.location }));
    if (items.length) out.push({ key, short, label, items });
  });
  return out;
}

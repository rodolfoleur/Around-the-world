export function dateForDay(d) {
  return new Date(d.iso + 'T00:00:00');
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Where "today" sits relative to a trip's days: which day index (if any)
 * is currently underway, and how many days remain until departure.
 * Works for any trip — just needs each day to carry an `iso` date.
 */
export function tripClock(days, now = new Date()) {
  if (!days || !days.length) return { daysUntil: 0, currentIndex: -1, status: 'upcoming' };

  const today = startOfDay(now);
  const first = startOfDay(dateForDay(days[0]));
  const last = startOfDay(dateForDay(days[days.length - 1]));

  const msPerDay = 86400000;
  const daysUntil = Math.round((first - today) / msPerDay);

  let currentIndex = -1;
  if (today >= first && today <= last) {
    currentIndex = days.findIndex((d) => startOfDay(dateForDay(d)).getTime() === today.getTime());
  }

  let status = 'upcoming';
  if (today > last) status = 'past';
  else if (currentIndex >= 0) status = 'live';

  return { daysUntil, currentIndex, status };
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Builds one empty day entry (shape matches the seed itinerary days) for a given ISO date. */
export function emptyDayForIso(iso) {
  const d = new Date(iso + 'T00:00:00');
  const dow = DOW[d.getDay()];
  const mon = MON[d.getMonth()];
  const num = String(d.getDate()).padStart(2, '0');
  const short = `${dow} ${mon} ${d.getDate()}`;
  return {
    iso, dow, num, mon,
    label: `${d.toLocaleDateString('en-GB', { weekday: 'long' })}, ${mon} ${d.getDate()}`,
    short,
    tag: 'Open',
    transit: [],
    parts: {},
    overnight: '',
    city: '',
  };
}

/** Every ISO date from start to end inclusive, as empty day entries. */
export function emptyDaysForRange(startIso, endIso) {
  const out = [];
  let cur = new Date(startIso + 'T00:00:00');
  const end = new Date(endIso + 'T00:00:00');
  while (cur <= end) {
    const iso = cur.toISOString().slice(0, 10);
    out.push(emptyDayForIso(iso));
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }
  return out;
}

/** e.g. "Aug 21 – Sep 6" from two ISO dates. */
export function formatRange(startIso, endIso) {
  const a = new Date(startIso + 'T00:00:00');
  const b = new Date(endIso + 'T00:00:00');
  const fmt = (d, withYear) => `${MON[d.getMonth()]} ${d.getDate()}${withYear ? `, ${d.getFullYear()}` : ''}`;
  const sameYear = a.getFullYear() === b.getFullYear();
  return `${fmt(a, !sameYear)} – ${fmt(b, true)}`;
}

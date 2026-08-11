import { useEffect, useState } from 'react';
import { CITY_BY_DAY, CITY_COORDS } from '../data/trip.js';
import { fetchDailyForecast, geocodeCity, clampToForecastRange } from '../lib/weather.js';

// Geocoding results are stable for the session — no reason to re-ask
// Open-Meteo for the same place name across trips/renders.
const geocodeCache = new Map();

/** Where a given day's weather should come from: an explicit override wins,
 *  then the curated trip's built-in city, then the generic-trip lodging text. */
function locationKeyFor(day, index, curated) {
  const override = (day.city || '').trim();
  if (override) return override;
  if (curated) return CITY_BY_DAY[index] || '';
  return (day.overnight || '').trim();
}

/**
 * Forecast per day, keyed by ISO date: { [iso]: { max, min, code, city } }.
 * A day's location, in priority order: an explicit `day.city` override (any
 * trip — this is how changing a day's city, e.g. an extra night in Windsor,
 * changes its weather too), else the curated trip's built-in city for that
 * day, else a generic trip's `overnight` text. Only ever asks for the part
 * of the trip Open-Meteo can actually forecast (~16 days out) — days
 * further away just don't get an entry, no error shown for that.
 */
export function useTripWeather(meta, days) {
  const [forecast, setForecast] = useState({});
  const [loading, setLoading] = useState(false);

  const startIso = days[0]?.iso;
  const endIso = days[days.length - 1]?.iso;
  // A plain-string fingerprint of "what city is each day resolved to" so
  // editing a day's city (or lodging, on a generic trip) triggers a refetch
  // without needing the whole `days` array/object identity as a dependency.
  const citySignature = days.map((d, i) => locationKeyFor(d, i, meta.curated)).join('|');

  useEffect(() => {
    if (!startIso || !endIso) { setForecast({}); return; }
    const range = clampToForecastRange(startIso, endIso);
    if (!range) { setForecast({}); return; }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const merged = {};

      // Which keys came from the curated trip's built-in CITY_BY_DAY code
      // (fast path — real coordinates, no geocoding) vs. an explicit
      // override or a generic trip's lodging text (needs geocoding).
      const keyIsBuiltIn = new Map();
      const keys = [];
      days.forEach((d, i) => {
        const override = (d.city || '').trim();
        const key = override || (meta.curated ? (CITY_BY_DAY[i] || '') : (d.overnight || '').trim());
        if (!key) return;
        keys.push(key);
        if (!keyIsBuiltIn.has(key)) keyIsBuiltIn.set(key, !override && meta.curated);
      });

      await Promise.all([...new Set(keys)].map(async (key) => {
        let coords, label;
        const builtIn = keyIsBuiltIn.get(key) ? CITY_COORDS[key] : null;
        if (builtIn) {
          coords = builtIn; label = builtIn.label;
        } else {
          let cached = geocodeCache.get(key);
          if (cached === undefined) {
            cached = await geocodeCity(key).catch(() => null);
            geocodeCache.set(key, cached);
          }
          if (!cached) return;
          coords = cached; label = key;
        }
        const data = await fetchDailyForecast(coords.lat, coords.lon, range.startIso, range.endIso).catch(() => null);
        if (!data) return;
        days.forEach((d, i) => {
          if (locationKeyFor(d, i, meta.curated) === key && data[d.iso]) merged[d.iso] = { ...data[d.iso], city: label };
        });
      }));

      if (!cancelled) { setForecast(merged); setLoading(false); }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `days` itself is intentionally excluded: citySignature (+ the date span) already captures everything that should trigger a refetch
  }, [meta.id, meta.curated, startIso, endIso, citySignature]);

  return { forecast, loading };
}

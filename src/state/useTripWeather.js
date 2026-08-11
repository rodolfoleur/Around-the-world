import { useEffect, useState } from 'react';
import { CITY_BY_DAY, CITY_COORDS } from '../data/trip.js';
import { fetchDailyForecast, fetchTypicalWeather, geocodeCity, clampToForecastRange } from '../lib/weather.js';

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

/** Resolves a location key to coordinates + a display label — the curated
 *  trip's built-in cities are free (no geocoding); anything else (an
 *  override, or a generic trip's lodging text) gets geocoded and cached. */
async function resolveCoords(key, isBuiltIn) {
  if (isBuiltIn) {
    const c = CITY_COORDS[key];
    return c ? { lat: c.lat, lon: c.lon, label: c.label } : null;
  }
  let cached = geocodeCache.get(key);
  if (cached === undefined) {
    cached = await geocodeCity(key).catch(() => null);
    geocodeCache.set(key, cached);
  }
  return cached ? { ...cached, label: key } : null;
}

/**
 * Forecast per day, keyed by ISO date: { [iso]: { max, min, code, city } }.
 * A day's location, in priority order: an explicit `day.city` override (any
 * trip — this is how changing a day's city, e.g. an extra night in Windsor,
 * changes its weather too), else the curated trip's built-in city for that
 * day, else a generic trip's `overnight` text.
 *
 * Only ever asks for a real forecast on the part of the trip Open-Meteo can
 * actually forecast (~16 days out). Days further away instead get a
 * `typical` entry — an average of actual weather on the same calendar
 * dates over the last few years, clearly a different thing from a
 * forecast, useful for packing rather than for "will it rain Tuesday".
 */
export function useTripWeather(meta, days) {
  const [forecast, setForecast] = useState({});
  const [typical, setTypical] = useState({});
  const [loading, setLoading] = useState(false);

  const startIso = days[0]?.iso;
  const endIso = days[days.length - 1]?.iso;
  // A plain-string fingerprint of "what city is each day resolved to" so
  // editing a day's city (or lodging, on a generic trip) triggers a refetch
  // without needing the whole `days` array/object identity as a dependency.
  const citySignature = days.map((d, i) => locationKeyFor(d, i, meta.curated)).join('|');

  useEffect(() => {
    if (!startIso || !endIso) { setForecast({}); setTypical({}); return; }

    let cancelled = false;
    setLoading(true);

    // Which keys came from the curated trip's built-in CITY_BY_DAY code
    // (fast path — real coordinates, no geocoding) vs. an explicit
    // override or a generic trip's lodging text (needs geocoding).
    const keyIsBuiltIn = new Map();
    days.forEach((d, i) => {
      const override = (d.city || '').trim();
      const key = override || (meta.curated ? (CITY_BY_DAY[i] || '') : (d.overnight || '').trim());
      if (key && !keyIsBuiltIn.has(key)) keyIsBuiltIn.set(key, !override && meta.curated);
    });

    const range = clampToForecastRange(startIso, endIso);

    (async () => {
      const nextForecast = {};
      const nextTypical = {};

      await Promise.all([...keyIsBuiltIn.keys()].map(async (key) => {
        const daysForKey = days.filter((d, i) => locationKeyFor(d, i, meta.curated) === key);
        const coords = await resolveCoords(key, keyIsBuiltIn.get(key));
        if (!coords) return;

        if (range) {
          const inRangeIsos = daysForKey.map((d) => d.iso).filter((iso) => iso >= range.startIso && iso <= range.endIso);
          if (inRangeIsos.length) {
            const data = await fetchDailyForecast(coords.lat, coords.lon, range.startIso, range.endIso).catch(() => null);
            if (data) daysForKey.forEach((d) => { if (data[d.iso]) nextForecast[d.iso] = { ...data[d.iso], city: coords.label }; });
          }
        }

        const outOfRangeIsos = daysForKey.map((d) => d.iso).filter((iso) => !(range && iso >= range.startIso && iso <= range.endIso));
        if (outOfRangeIsos.length) {
          const byMonthDay = await fetchTypicalWeather(coords.lat, coords.lon, outOfRangeIsos, 3).catch(() => null);
          if (byMonthDay) {
            outOfRangeIsos.forEach((iso) => {
              const t = byMonthDay[iso.slice(5)];
              if (t) nextTypical[iso] = { ...t, city: coords.label };
            });
          }
        }
      }));

      if (!cancelled) { setForecast(nextForecast); setTypical(nextTypical); setLoading(false); }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `days` itself is intentionally excluded: citySignature (+ the date span) already captures everything that should trigger a refetch
  }, [meta.id, meta.curated, startIso, endIso, citySignature]);

  return { forecast, typical, loading };
}

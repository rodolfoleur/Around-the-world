import { useEffect, useState } from 'react';
import { CITY_BY_DAY, CITY_COORDS } from '../data/trip.js';
import { fetchDailyForecast, geocodeCity, clampToForecastRange } from '../lib/weather.js';

// Geocoding results are stable for the session — no reason to re-ask
// Open-Meteo for the same place name across trips/renders.
const geocodeCache = new Map();

/**
 * Forecast per day, keyed by ISO date: { [iso]: { max, min, code, city } }.
 * Curated trips use real coordinates per city code (CITY_BY_DAY); other
 * trips geocode each day's `overnight` text. Only ever asks for the part
 * of the trip Open-Meteo can actually forecast (~16 days out) — days
 * further away just don't get an entry, no error shown for that.
 */
export function useTripWeather(meta, days) {
  const [forecast, setForecast] = useState({});
  const [loading, setLoading] = useState(false);

  const startIso = days[0]?.iso;
  const endIso = days[days.length - 1]?.iso;

  useEffect(() => {
    if (!startIso || !endIso) { setForecast({}); return; }
    const range = clampToForecastRange(startIso, endIso);
    if (!range) { setForecast({}); return; }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const merged = {};

      if (meta.curated) {
        const codes = [...new Set(days.map((_, i) => CITY_BY_DAY[i]).filter(Boolean))];
        await Promise.all(codes.map(async (code) => {
          const c = CITY_COORDS[code];
          if (!c) return;
          const data = await fetchDailyForecast(c.lat, c.lon, range.startIso, range.endIso).catch(() => null);
          if (!data) return;
          days.forEach((d, i) => {
            if (CITY_BY_DAY[i] === code && data[d.iso]) merged[d.iso] = { ...data[d.iso], city: c.label };
          });
        }));
      } else {
        const names = [...new Set(days.map((d) => (d.overnight || '').trim()).filter(Boolean))];
        await Promise.all(names.map(async (name) => {
          let coords = geocodeCache.get(name);
          if (coords === undefined) {
            coords = await geocodeCity(name).catch(() => null);
            geocodeCache.set(name, coords);
          }
          if (!coords) return;
          const data = await fetchDailyForecast(coords.lat, coords.lon, range.startIso, range.endIso).catch(() => null);
          if (!data) return;
          days.forEach((d) => {
            if ((d.overnight || '').trim() === name && data[d.iso]) merged[d.iso] = { ...data[d.iso], city: name };
          });
        }));
      }

      if (!cancelled) { setForecast(merged); setLoading(false); }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `days` itself is intentionally excluded: only its span/city composition (captured by these primitives) should trigger a refetch, not every re-render
  }, [meta.id, meta.curated, startIso, endIso]);

  return { forecast, loading };
}

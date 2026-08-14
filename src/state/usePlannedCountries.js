import { useEffect, useMemo, useRef, useState } from 'react';
import { tripClock } from '../utils/dates.js';
import { deriveStops } from '../components/dashboard/LocationStrip.jsx';
import { resolveCountry } from '../lib/geocode.js';
import { normalizeCountryName } from '../lib/worldCountries.js';

const CACHE_KEY = 'voyager-city-country-cache';
// Nominatim asks for restraint (~1 lookup/sec) — city→country resolutions
// run one at a time with this gap between them, rather than in parallel,
// since an upcoming trip can easily have several stops needing a lookup.
const LOOKUP_GAP_MS = 1100;

function loadCache() {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCache(cache) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* storage unavailable/full — the cache just doesn't persist across reloads */
  }
}

/**
 * Countries an upcoming (not-yet-past) trip touches that aren't already
 * marked visited — what the world map grays in as "new." City names come
 * from the same deriveStops the location strip already uses, so this
 * always agrees with what's shown there. Resolving a city to a country
 * happens through the same free geocoder the road-trip legs use — never
 * more than one request in flight, cached in sessionStorage so this
 * doesn't re-hit Nominatim every time the trips dashboard mounts.
 */
export function usePlannedCountries(trips, visitedCountries) {
  const cacheRef = useRef(loadCache());
  const [, forceRender] = useState(0);
  const inFlight = useRef(false);

  const upcomingCities = useMemo(() => {
    const names = new Set();
    (trips || []).forEach((trip) => {
      if (tripClock(trip.days).status === 'past') return;
      deriveStops(trip.days || [], trip).forEach((s) => names.add(s.name));
    });
    return [...names];
  }, [trips]);

  useEffect(() => {
    const pending = upcomingCities.filter((name) => !(name in cacheRef.current));
    if (pending.length === 0 || inFlight.current) return;
    inFlight.current = true;

    (async () => {
      for (const name of pending) {
        // eslint-disable-next-line no-await-in-loop
        const country = await resolveCountry(name);
        cacheRef.current = { ...cacheRef.current, [name]: country || null };
        saveCache(cacheRef.current);
        forceRender((n) => n + 1); // let the planned-countries memo below recompute
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, LOOKUP_GAP_MS));
      }
      inFlight.current = false;
    })();
  }, [upcomingCities]);

  return useMemo(() => {
    const planned = new Set();
    upcomingCities.forEach((name) => {
      const raw = cacheRef.current[name];
      if (!raw) return;
      const country = normalizeCountryName(raw);
      if (!country) return;
      const visitors = visitedCountries[country];
      if (!visitors || visitors.length === 0) planned.add(country);
    });
    return planned;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcomingCities, visitedCountries, cacheRef.current]);
}

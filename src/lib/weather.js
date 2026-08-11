// Open-Meteo — free, no API key, CORS-friendly for direct browser calls.
// https://open-meteo.com/en/docs (forecast) and /en/docs/geocoding-api

const WMO = {
  0: { icon: '☀️', label: 'Clear' },
  1: { icon: '🌤️', label: 'Mostly clear' },
  2: { icon: '⛅', label: 'Partly cloudy' },
  3: { icon: '☁️', label: 'Overcast' },
  45: { icon: '🌫️', label: 'Fog' },
  48: { icon: '🌫️', label: 'Fog' },
  51: { icon: '🌦️', label: 'Light drizzle' },
  53: { icon: '🌦️', label: 'Drizzle' },
  55: { icon: '🌧️', label: 'Heavy drizzle' },
  56: { icon: '🌧️', label: 'Freezing drizzle' },
  57: { icon: '🌧️', label: 'Freezing drizzle' },
  61: { icon: '🌦️', label: 'Light rain' },
  63: { icon: '🌧️', label: 'Rain' },
  65: { icon: '🌧️', label: 'Heavy rain' },
  66: { icon: '🌧️', label: 'Freezing rain' },
  67: { icon: '🌧️', label: 'Freezing rain' },
  71: { icon: '🌨️', label: 'Light snow' },
  73: { icon: '🌨️', label: 'Snow' },
  75: { icon: '❄️', label: 'Heavy snow' },
  77: { icon: '❄️', label: 'Snow grains' },
  80: { icon: '🌦️', label: 'Showers' },
  81: { icon: '🌧️', label: 'Showers' },
  82: { icon: '⛈️', label: 'Violent showers' },
  85: { icon: '🌨️', label: 'Snow showers' },
  86: { icon: '🌨️', label: 'Snow showers' },
  95: { icon: '⛈️', label: 'Thunderstorm' },
  96: { icon: '⛈️', label: 'Thunderstorm' },
  99: { icon: '⛈️', label: 'Thunderstorm' },
};

export function weatherIcon(code) {
  return WMO[code] || { icon: '🌡️', label: '' };
}

/**
 * Daily max/min temp (°C) + weather code for a lat/lon over an ISO date
 * range, keyed by ISO date. Open-Meteo's free forecast only covers
 * roughly the next 16 days — callers should clamp the range themselves
 * (see clampToForecastRange) so a too-far-future request doesn't fail
 * outright and blank out days that ARE in range.
 */
const DAILY_FIELDS = [
  'temperature_2m_max', 'temperature_2m_min', 'weathercode',
  'windspeed_10m_max', 'precipitation_probability_max', 'precipitation_sum',
];

export async function fetchDailyForecast(lat, lon, startIso, endIso) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=${DAILY_FIELDS.join(',')}&timezone=auto` +
    `&start_date=${startIso}&end_date=${endIso}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('weather request failed: ' + res.status);
  const data = await res.json();
  const out = {};
  const days = data.daily?.time || [];
  days.forEach((iso, i) => {
    out[iso] = {
      max: data.daily.temperature_2m_max[i],
      min: data.daily.temperature_2m_min[i],
      code: data.daily.weathercode[i],
      wind: data.daily.windspeed_10m_max?.[i],
      precipChance: data.daily.precipitation_probability_max?.[i],
      precipMm: data.daily.precipitation_sum?.[i],
    };
  });
  return out;
}

/** Best-effort lat/lon for a free-text place name (city, hotel + city, etc). */
export async function geocodeCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const r = data.results?.[0];
  return r ? { lat: r.latitude, lon: r.longitude } : null;
}

/**
 * Clamps [startIso, endIso] to the window Open-Meteo can actually forecast
 * (today .. today+15d). Returns null if the whole range falls outside it
 * (e.g. a trip months away) — nothing to fetch yet.
 */
export function clampToForecastRange(startIso, endIso) {
  const toIso = (d) => d.toISOString().slice(0, 10);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const horizon = new Date(today); horizon.setDate(horizon.getDate() + 15);
  const todayIso = toIso(today);
  const horizonIso = toIso(horizon);
  const clampedStart = startIso < todayIso ? todayIso : startIso;
  const clampedEnd = endIso > horizonIso ? horizonIso : endIso;
  if (clampedStart > clampedEnd) return null;
  return { startIso: clampedStart, endIso: clampedEnd };
}

/**
 * Actual historical daily max/min (°C) for a lat/lon over an ISO date
 * range, keyed by ISO date — real recorded weather, not a forecast.
 * Open-Meteo's archive has global coverage going back decades, free,
 * no key. Used to build a "typical for this time of year" estimate for
 * dates too far out for a real forecast.
 */
export async function fetchHistoricalDaily(lat, lon, startIso, endIso) {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min&timezone=auto` +
    `&start_date=${startIso}&end_date=${endIso}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('historical weather request failed: ' + res.status);
  const data = await res.json();
  const out = {};
  const days = data.daily?.time || [];
  days.forEach((iso, i) => {
    const max = data.daily.temperature_2m_max[i];
    const min = data.daily.temperature_2m_min[i];
    if (max == null || min == null) return;
    out[iso] = { max, min };
  });
  return out;
}

/**
 * "Typical" weather for a lat/lon on a set of future dates: pulls the same
 * calendar dates from each of the last `yearsBack` years and averages
 * max/min per month-day across them. Not a forecast — a packing-guide
 * estimate. Returns { [MM-DD]: { avgMax, avgMin, years } }; callers match
 * a future date to its MM-DD to look up the average.
 */
export async function fetchTypicalWeather(lat, lon, dates, yearsBack = 5) {
  if (!dates.length) return {};
  const years = [...new Set(dates.map((iso) => Number(iso.slice(0, 4))))];
  const sums = {}; // 'MM-DD' -> { maxSum, minSum, count }

  const perYear = await Promise.all(years.flatMap((tripYear) => {
    const yearDates = dates.filter((iso) => Number(iso.slice(0, 4)) === tripYear);
    const start = yearDates[0];
    const end = yearDates[yearDates.length - 1];
    return Array.from({ length: yearsBack }, (_, i) => i + 1).map((back) => {
      const shift = (iso) => (Number(iso.slice(0, 4)) - back) + iso.slice(4);
      return fetchHistoricalDaily(lat, lon, shift(start), shift(end)).catch(() => null);
    });
  }));

  perYear.forEach((yearData) => {
    if (!yearData) return;
    Object.entries(yearData).forEach(([iso, v]) => {
      const md = iso.slice(5); // 'MM-DD'
      if (!sums[md]) sums[md] = { maxSum: 0, minSum: 0, count: 0 };
      sums[md].maxSum += v.max;
      sums[md].minSum += v.min;
      sums[md].count += 1;
    });
  });

  const out = {};
  Object.entries(sums).forEach(([md, s]) => {
    if (s.count > 0) out[md] = { avgMax: s.maxSum / s.count, avgMin: s.minSum / s.count, years: s.count };
  });
  return out;
}

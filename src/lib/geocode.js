// Turns a place name typed into a road-trip leg ("Banff", "Jasper") into
// real coordinates, so a manually-entered leg can still be plotted on the
// real map and get a real straight-line km — same "auto, but overridable"
// spirit as the trip photo lookup. Uses OpenStreetMap's Nominatim search
// API: free, no key, and fine for this app's volume (a handful of lookups
// per trip, not bulk). Never throws; an unresolvable or ambiguous name, or
// a network hiccup, just resolves to null so the leg still saves — it just
// won't plot on the map, and its km stays whatever was typed (or blank).

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';

export async function geocodePlace(query) {
  const q = (query || '').trim();
  if (!q) return null;
  try {
    const url = `${NOMINATIM_SEARCH}?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return { lat, lon, label: data[0].display_name || q };
  } catch {
    return null;
  }
}

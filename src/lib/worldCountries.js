// Real country geometry for the "Where we've been" dashboard map — no
// hand-drawn borders. `world-atlas` ships Natural Earth data as topojson
// (the same source most world-map libraries use); `topojson-client`
// converts it to plain GeoJSON features once, at module load, so every
// consumer of this module shares the same computed list instead of
// re-parsing the (fairly large) topology on every render.
import { feature } from 'topojson-client';
import { geoEquirectangular, geoPath as d3GeoPath, geoCentroid } from 'd3-geo';
import worldTopology from 'world-atlas/countries-110m.json';

const worldGeo = feature(worldTopology, worldTopology.objects.countries);

/** One entry per country: its GeoJSON feature, display name, and
 * pre-computed [lon, lat] centroid (used to place the visitor badges —
 * cheap to compute once here rather than per-render). */
export const COUNTRIES = worldGeo.features
  .filter((f) => f.properties?.name && f.properties.name !== 'Antarctica')
  .map((f) => ({
    name: f.properties.name,
    feature: f,
    centroid: geoCentroid(f),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const COUNTRY_NAMES = new Set(COUNTRIES.map((c) => c.name));
const COUNTRY_NAMES_LOWER = new Map(COUNTRIES.map((c) => [c.name.toLowerCase(), c.name]));

// Best-effort bridge between what a geocoder calls a country and what this
// map's Natural Earth data calls it — the two don't always agree ("Czech
// Republic" vs. "Czechia", "Ivory Coast" vs. "Côte d'Ivoire"). Not
// exhaustive; an unmapped mismatch just fails to normalize (see
// normalizeCountryName) rather than mis-coloring anything.
const ALIASES = {
  'united states': 'United States of America',
  usa: 'United States of America',
  uk: 'United Kingdom',
  'great britain': 'United Kingdom',
  'czech republic': 'Czechia',
  'ivory coast': "Côte d'Ivoire",
  'democratic republic of the congo': 'Dem. Rep. Congo',
  'congo-kinshasa': 'Dem. Rep. Congo',
  'republic of the congo': 'Congo',
  'congo-brazzaville': 'Congo',
  'north macedonia': 'Macedonia',
  swaziland: 'eSwatini',
  'bosnia and herzegovina': 'Bosnia and Herz.',
  'dominican republic': 'Dominican Rep.',
  'central african republic': 'Central African Rep.',
  'equatorial guinea': 'Eq. Guinea',
  'south sudan': 'S. Sudan',
  'myanmar (burma)': 'Myanmar',
  burma: 'Myanmar',
  'solomon islands': 'Solomon Is.',
  'falkland islands': 'Falkland Is.',
  'falkland islands (malvinas)': 'Falkland Is.',
  'french southern and antarctic lands': 'Fr. S. Antarctic Lands',
  'french southern territories': 'Fr. S. Antarctic Lands',
  'western sahara': 'W. Sahara',
  'republic of korea': 'South Korea',
  "democratic people's republic of korea": 'North Korea',
  'russian federation': 'Russia',
  'syrian arab republic': 'Syria',
  'state of palestine': 'Palestine',
  'republic of ireland': 'Ireland',
  'lao pdr': 'Laos',
  "lao people's democratic republic": 'Laos',
  'brunei darussalam': 'Brunei',
};

/** Matches a geocoder-supplied country name (e.g. Nominatim's
 * `address.country`) back to this map's own country name, so a resolved
 * country can actually be colored. Returns null rather than guessing when
 * nothing lines up — a silent miss beats mis-coloring a country. */
export function normalizeCountryName(name) {
  if (!name) return null;
  if (COUNTRY_NAMES.has(name)) return name;
  const lower = name.trim().toLowerCase();
  if (COUNTRY_NAMES_LOWER.has(lower)) return COUNTRY_NAMES_LOWER.get(lower);
  if (ALIASES[lower]) return ALIASES[lower];
  return null;
}

/** Builds a projection + path generator fitted to a given pixel size —
 * called once per map render (the map's box size doesn't change often),
 * not per-country. Equirectangular rather than something fancier: simple,
 * no extra package, and perfectly legible at the small size this widget
 * actually renders at. */
export function makeProjection(width, height) {
  const projection = geoEquirectangular().fitSize([width, height], worldGeo);
  const path = d3GeoPath(projection);
  return { projection, path };
}

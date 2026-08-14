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

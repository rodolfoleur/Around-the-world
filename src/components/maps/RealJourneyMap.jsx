import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LEGS, LOCATION_COORDS, INK, GOLD, PLUM } from '../../data/trip.js';

const TYPE_COLOR = { Flight: INK, Car: PLUM, Ground: GOLD };

/**
 * A real, pannable/zoomable map (Leaflet + OpenStreetMap tiles — free, no
 * API key) plotting the trip's actual journey legs at their real
 * coordinates, replacing the old schematic placeholder SVG. Circle markers
 * instead of Leaflet's default pin icon, since the default icon's image
 * assets don't resolve correctly under Vite without extra config.
 *
 * `focusedLegN`, when set, zooms to just that one leg's two points (and
 * highlights its line) instead of fitting every visible leg — this is
 * what powers "click a journey and the map zooms in to it."
 */
export default function RealJourneyMap({ legFilter, focusedLegN, onSelectLeg }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false });
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // A fresh map inside a container that wasn't at full size yet (e.g.
    // a sheet/tab still animating in) can render blank until something
    // nudges it — invalidateSize fixes that.
    requestAnimationFrame(() => map.invalidateSize());

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (layerRef.current) { layerRef.current.remove(); }
    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;

    const legs = LEGS.filter((l) => legFilter === 'All' || l.type === legFilter);
    const bounds = [];
    const focusBounds = [];
    const plotted = new Set();

    legs.forEach((leg) => {
      const from = LOCATION_COORDS[leg.from];
      const to = LOCATION_COORDS[leg.to];
      if (!from || !to) return;
      const isFocused = focusedLegN != null && leg.n === focusedLegN;
      const dimmed = focusedLegN != null && !isFocused;
      const color = TYPE_COLOR[leg.type] || INK;

      const line = L.polyline([[from.lat, from.lon], [to.lat, to.lon]], {
        color, weight: isFocused ? 4.5 : 2.5, opacity: dimmed ? 0.25 : 0.85,
        dashArray: leg.type === 'Flight' ? '1 7' : null, lineCap: 'round',
      }).addTo(layer);
      if (onSelectLeg) line.on('click', () => onSelectLeg(leg.n));
      bounds.push([from.lat, from.lon], [to.lat, to.lon]);
      if (isFocused) focusBounds.push([from.lat, from.lon], [to.lat, to.lon]);

      [[leg.from, from], [leg.to, to]].forEach(([code, point]) => {
        if (plotted.has(code)) return;
        plotted.add(code);
        L.circleMarker([point.lat, point.lon], {
          radius: 6, color: '#faf8f4', weight: 2, fillColor: '#c96f3f', fillOpacity: dimmed ? 0.4 : 1,
        }).addTo(layer).bindTooltip(`${code} — ${point.label}`, { direction: 'top', offset: [0, -6] });
      });
    });

    if (focusBounds.length) {
      map.fitBounds(focusBounds, { padding: [48, 48], maxZoom: 12 });
    } else if (bounds.length) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 11 });
    }
  }, [legFilter, focusedLegN, onSelectLeg]);

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />;
}

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PLUM } from '../../data/trip.js';

/**
 * The Road Trip counterpart to RealJourneyMap — same Leaflet-plus-OSM-tiles
 * approach, but plotting arbitrary user-entered legs (with whatever
 * coordinates their auto-geocode lookup found) instead of the curated
 * trip's fixed LEGS/LOCATION_COORDS. Legs missing a coordinate on either
 * end are skipped here (they still show in the list, just without a line
 * on the map) rather than guessed at.
 */
export default function RoadTripMap({ legs, focusedLegId, onSelectLeg }) {
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
    requestAnimationFrame(() => map.invalidateSize());
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (layerRef.current) layerRef.current.remove();
    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;

    const plottable = legs.filter((l) => l.fromCoord && l.toCoord);
    const bounds = [];
    const focusBounds = [];
    const plotted = new Set();

    plottable.forEach((leg) => {
      const isFocused = focusedLegId != null && leg.id === focusedLegId;
      const dimmed = focusedLegId != null && !isFocused;

      const line = L.polyline(
        [[leg.fromCoord.lat, leg.fromCoord.lon], [leg.toCoord.lat, leg.toCoord.lon]],
        { color: PLUM, weight: isFocused ? 4.5 : 2.5, opacity: dimmed ? 0.25 : 0.85, lineCap: 'round' },
      ).addTo(layer);
      if (onSelectLeg) line.on('click', () => onSelectLeg(leg.id));
      bounds.push([leg.fromCoord.lat, leg.fromCoord.lon], [leg.toCoord.lat, leg.toCoord.lon]);
      if (isFocused) focusBounds.push([leg.fromCoord.lat, leg.fromCoord.lon], [leg.toCoord.lat, leg.toCoord.lon]);

      [[leg.from, leg.fromCoord], [leg.to, leg.toCoord]].forEach(([name, point]) => {
        const key = `${name}|${point.lat}|${point.lon}`;
        if (plotted.has(key)) return;
        plotted.add(key);
        L.circleMarker([point.lat, point.lon], {
          radius: 6, color: '#faf8f4', weight: 2, fillColor: PLUM, fillOpacity: dimmed ? 0.4 : 1,
        }).addTo(layer).bindTooltip(name, { direction: 'top', offset: [0, -6] });
      });
    });

    if (focusBounds.length) {
      map.fitBounds(focusBounds, { padding: [48, 48], maxZoom: 12 });
    } else if (bounds.length) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 11 });
    } else {
      map.setView([20, 0], 1.5); // nothing plottable yet — just a neutral world view
    }
  }, [legs, focusedLegId, onSelectLeg]);

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />;
}

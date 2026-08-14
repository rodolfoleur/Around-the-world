import { useEffect, useMemo, useRef, useState } from 'react';
import { COUNTRIES, makeProjection } from '../../lib/worldCountries.js';
import { usePlannedCountries } from '../../state/usePlannedCountries.js';

const MAP_W = 960;
const MAP_H = 500;
const UNVISITED_FILL = '#eae4d6';
const PLANNED_FILL = '#c9c2b4';
const MIN_SCALE = 1;
const MAX_SCALE = 8;

const clampNum = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Keeps the zoomed content covering the whole viewBox — no empty margin
 * ever pans into view, and it never zooms out past the map's own size. */
function clampTransform({ scale, tx, ty }) {
  const s = clampNum(scale, MIN_SCALE, MAX_SCALE);
  return {
    scale: s,
    tx: clampNum(tx, MAP_W * (1 - s), 0),
    ty: clampNum(ty, MAP_H * (1 - s), 0),
  };
}

const zoomBtnStyle = {
  width: 28, height: 28, borderRadius: 8, border: '1px solid var(--line-strong)', background: '#fff',
  color: 'var(--ink)', fontSize: 16, lineHeight: '26px', padding: 0, boxShadow: '0 1px 3px rgba(0,0,0,.12)',
};

/** One diagonal-stripe SVG pattern per distinct combination of visitor
 * colors actually in use — a country visited by both Rodolfo and Kirsten
 * gets both their colors striped together rather than one color winning
 * arbitrarily. Built once per render from whatever combinations exist,
 * not one-per-country, since most countries share the same combo. */
function useStripePatterns(visitedCountries, memberColor) {
  return useMemo(() => {
    const combos = new Map(); // key: sorted colors joined -> { id, colors }
    Object.values(visitedCountries).forEach((userIds) => {
      const colors = [...new Set((userIds || []).map(memberColor).filter(Boolean))].sort();
      if (colors.length < 2) return;
      const key = colors.join('|');
      if (!combos.has(key)) combos.set(key, { id: `stripe-${combos.size}`, colors });
    });
    return combos;
  }, [visitedCountries, memberColor]);
}

function CountryEditor({ country, members, visitorIds, busyId, error, onToggle, onClose }) {
  return (
    <div className="card" style={{ padding: 14, marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-.01em' }}>{country.name}</div>
        <button type="button" onClick={onClose} className="mono" style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted-3)' }}>
          Close
        </button>
      </div>
      <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 8 }}>
        Who&rsquo;s been here
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {members.map((m) => {
          const on = visitorIds.includes(m.user_id);
          return (
            <button
              key={m.user_id}
              type="button"
              onClick={() => onToggle(m.user_id)}
              disabled={busyId === m.user_id}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 99, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12.5, border: `1px solid ${on ? m.color : 'var(--line-strong)'}`,
                background: on ? m.color : '#fff', color: on ? '#fff' : 'var(--ink)',
                opacity: busyId === m.user_id ? 0.6 : 1,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 99, background: on ? '#fff' : m.color, flex: 'none' }} />
              {m.display_name}
            </button>
          );
        })}
      </div>
      {error && <div style={{ fontSize: 11.5, color: 'var(--terra)', marginTop: 10, lineHeight: 1.4 }}>Couldn&rsquo;t save that: {error}</div>}
    </div>
  );
}

/** The trips dashboard's "Where we've been" world map — real country
 * geometry (see lib/worldCountries.js), colored per visitor, with a small
 * round initial badge per person who's been there. Search finds a country
 * by name; clicking a country directly on the map works too. */
export default function WorldMap({ trips, members, visitedCountries, onSetVisitedCountries }) {
  const [query, setQuery] = useState('');
  const [selectedName, setSelectedName] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [toggleError, setToggleError] = useState('');
  const [transform, setTransform] = useState({ scale: 1, tx: 0, ty: 0 });

  const svgRef = useRef(null);
  const pointersRef = useRef(new Map()); // pointerId -> last {x,y} in client coords, for drag + pinch
  const dragStartRef = useRef(null); // { x, y, moved } for the gesture currently in progress
  const pinchDistRef = useRef(0);

  const { path, projection } = useMemo(() => makeProjection(MAP_W, MAP_H), []);
  const memberById = useMemo(() => Object.fromEntries(members.map((m) => [m.user_id, m])), [members]);
  const memberColor = (userId) => memberById[userId]?.color;
  const patterns = useStripePatterns(visitedCountries, memberColor);
  const plannedCountries = usePlannedCountries(trips, visitedCountries);

  const visitedCount = Object.values(visitedCountries).filter((v) => (v || []).length > 0).length;
  const countFor = (userId) => Object.values(visitedCountries).filter((v) => (v || []).includes(userId)).length;

  const matches = query.trim()
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  const selected = selectedName ? COUNTRIES.find((c) => c.name === selectedName) : null;
  const selectedVisitors = selected ? (visitedCountries[selected.name] || []) : [];

  const pick = (name) => {
    setSelectedName(name);
    setQuery('');
    setToggleError('');
  };

  const toggleVisitor = async (userId) => {
    if (!selected) return;
    setToggleError('');
    setBusyId(userId);
    const current = visitedCountries[selected.name] || [];
    const next = current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId];
    const res = await onSetVisitedCountries({ [selected.name]: next });
    setBusyId(null);
    // A failed save already reverted the map (see setVisitedCountries) — the
    // point of checking here is just to say *why*, instead of a change
    // that quietly appears and then quietly disappears with no explanation.
    if (!res?.ok) setToggleError(res?.error || "That change couldn't be saved.");
  };

  // Converts a client (viewport) coordinate to the map's own 960x500 space,
  // regardless of how large the SVG is actually rendered on screen.
  const toViewBox = (clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect();
    return { x: ((clientX - rect.left) / rect.width) * MAP_W, y: ((clientY - rect.top) / rect.height) * MAP_H };
  };

  // Zooms to nextScale while keeping the content under viewBox point (sx,
  // sy) visually fixed — whatever's under your cursor (wheel) or the map's
  // current center (+/- buttons) doesn't jump around as you zoom.
  const zoomAt = (nextScale, sx, sy) => {
    setTransform((t) => {
      const s = clampNum(nextScale, MIN_SCALE, MAX_SCALE);
      const ratio = s / t.scale;
      return clampTransform({ scale: s, tx: sx - ratio * (sx - t.tx), ty: sy - ratio * (sy - t.ty) });
    });
  };

  const zoomIn = () => zoomAt(transform.scale * 1.4, MAP_W / 2, MAP_H / 2);
  const zoomOut = () => zoomAt(transform.scale / 1.4, MAP_W / 2, MAP_H / 2);
  const resetZoom = () => setTransform({ scale: 1, tx: 0, ty: 0 });

  // Trackpad pinch and ctrl/cmd+scroll both arrive as wheel events with
  // ctrlKey set — that's the only wheel gesture the map hijacks, so a
  // normal scroll past the map still scrolls the dashboard, not the map.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const { x, y } = toViewBox(e.clientX, e.clientY);
      zoomAt(transform.scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2), x, y);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [transform.scale]);

  // Pointer capture is only grabbed once a gesture is confirmed to actually
  // be a drag or a pinch (below) — not here on every pointerdown. Chrome
  // retargets the click that follows a captured pointer to the capturing
  // element, which silently broke plain clicks on a country: the click
  // fired on the <svg>, not the <path>, so its onClick never ran.
  const onMapPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 1) dragStartRef.current = { x: e.clientX, y: e.clientY, moved: false };
    if (pointersRef.current.size === 2) {
      const [p1, p2] = [...pointersRef.current.values()];
      pinchDistRef.current = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      // A second finger down is unambiguously a gesture, never a tap.
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* unsupported */ }
    }
  };

  const onMapPointerMove = (e) => {
    const prev = pointersRef.current.get(e.pointerId);
    if (!prev) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Two fingers down: pinch-to-zoom, anchored on the midpoint between them.
    if (pointersRef.current.size >= 2) {
      const [p1, p2] = [...pointersRef.current.values()];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const mid = toViewBox((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
      if (pinchDistRef.current > 0) zoomAt(transform.scale * (dist / pinchDistRef.current), mid.x, mid.y);
      pinchDistRef.current = dist;
      if (dragStartRef.current) dragStartRef.current.moved = true;
      return;
    }

    // One finger/pointer down: drag to pan.
    const rect = svgRef.current.getBoundingClientRect();
    const dx = ((e.clientX - prev.x) / rect.width) * MAP_W;
    const dy = ((e.clientY - prev.y) / rect.height) * MAP_H;
    setTransform((t) => clampTransform({ ...t, tx: t.tx + dx, ty: t.ty + dy }));

    if (dragStartRef.current && !dragStartRef.current.moved) {
      const total = Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y);
      if (total > 4) {
        dragStartRef.current.moved = true;
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* unsupported */ }
      }
    }
  };

  const onMapPointerUp = (e) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* not captured, or unsupported */ }
    pointersRef.current.delete(e.pointerId);
    pinchDistRef.current = 0;
  };

  // A drag that panned the map shouldn't also select whatever country the
  // pointer happened to be over when it was released.
  const clickCountry = (name) => {
    if (dragStartRef.current?.moved) return;
    pick(name);
  };

  const fillFor = (name) => {
    const visitors = visitedCountries[name];
    if (visitors && visitors.length > 0) {
      const colors = [...new Set(visitors.map(memberColor).filter(Boolean))].sort();
      if (colors.length === 1) return colors[0];
      if (colors.length > 1) {
        const combo = [...patterns.values()].find((p) => p.colors.join('|') === colors.join('|'));
        if (combo) return `url(#${combo.id})`;
      }
    }
    // Not yet visited, but an upcoming trip already goes there — grayed in
    // as "about to be new" rather than left looking exactly like anywhere
    // you've never planned to go.
    if (plannedCountries.has(name)) return PLANNED_FILL;
    return UNVISITED_FILL;
  };

  return (
    <div className="card" style={{ padding: 16, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        <div>
          <h3 className="h3" style={{ marginBottom: 3 }}>Where we&rsquo;ve been</h3>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--muted-2)' }}>{visitedCount} countr{visitedCount === 1 ? 'y' : 'ies'} visited</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {members.map((m) => (
            <span key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: m.color }} />
              {m.display_name} <span className="mono" style={{ color: 'var(--muted-3)' }}>{countFor(m.user_id)}</span>
            </span>
          ))}
        </div>
      </div>

      {plannedCountries.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--muted-2)', marginBottom: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: PLANNED_FILL }} />
          Gray — new on an upcoming trip
        </div>
      )}

      <div style={{ position: 'relative', marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Find a country…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
        {matches.length > 0 && (
          <div className="card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, padding: 4, zIndex: 5, maxHeight: 220, overflowY: 'auto' }}>
            {matches.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => pick(c.name)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', border: 0, background: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13, padding: '8px 10px', borderRadius: 8,
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'relative', marginBottom: 10 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          onPointerDown={onMapPointerDown}
          onPointerMove={onMapPointerMove}
          onPointerUp={onMapPointerUp}
          onPointerCancel={onMapPointerUp}
          style={{
            width: '100%', height: 'auto', display: 'block', borderRadius: 12, background: '#f5f1e8',
            touchAction: 'none', cursor: transform.scale > MIN_SCALE ? 'grab' : 'default',
          }}
        >
          <defs>
            {[...patterns.values()].map(({ id, colors }) => {
              const stripe = 10;
              const size = stripe * colors.length;
              return (
                <pattern key={id} id={id} width={size} height={size} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  {colors.map((c, i) => (
                    <rect key={c} x={i * stripe} y={0} width={stripe} height={size} fill={c} />
                  ))}
                </pattern>
              );
            })}
          </defs>

          <g transform={`translate(${transform.tx} ${transform.ty}) scale(${transform.scale})`}>
            {COUNTRIES.map((c) => (
              <path
                key={c.name}
                data-country={c.name}
                d={path(c.feature)}
                fill={fillFor(c.name)}
                stroke={selectedName === c.name ? 'var(--ink)' : '#fff'}
                strokeWidth={selectedName === c.name ? 1.6 : 0.5}
                vectorEffect="non-scaling-stroke"
                onClick={() => clickCountry(c.name)}
                style={{ cursor: 'pointer' }}
              />
            ))}

            {COUNTRIES.filter((c) => (visitedCountries[c.name] || []).length > 0).map((c) => {
              const [x, y] = projection(c.centroid);
              const visitors = visitedCountries[c.name] || [];
              // Counter-scaled so badges stay a constant, readable size on
              // screen no matter how far zoomed in the map currently is.
              const r = 7 / transform.scale;
              const gap = 11 / transform.scale;
              return (
                <g key={c.name} style={{ pointerEvents: 'none' }}>
                  {visitors.map((userId, i) => {
                    const m = memberById[userId];
                    if (!m) return null;
                    const offset = (i - (visitors.length - 1) / 2) * gap;
                    return (
                      <g key={userId} transform={`translate(${x + offset}, ${y})`}>
                        <circle r={r} fill={m.color} stroke="#fff" strokeWidth={1.4 / transform.scale} />
                        <text textAnchor="middle" dominantBaseline="central" fontSize={8 / transform.scale} fontWeight={700} fill="#fff" fontFamily="ui-monospace, monospace">
                          {(m.display_name?.[0] || '?').toUpperCase()}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
        </svg>

        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            type="button"
            onClick={zoomIn}
            disabled={transform.scale >= MAX_SCALE}
            aria-label="Zoom in"
            style={{ ...zoomBtnStyle, opacity: transform.scale >= MAX_SCALE ? 0.4 : 1, cursor: transform.scale >= MAX_SCALE ? 'default' : 'pointer' }}
          >
            +
          </button>
          <button
            type="button"
            onClick={zoomOut}
            disabled={transform.scale <= MIN_SCALE}
            aria-label="Zoom out"
            style={{ ...zoomBtnStyle, opacity: transform.scale <= MIN_SCALE ? 0.4 : 1, cursor: transform.scale <= MIN_SCALE ? 'default' : 'pointer' }}
          >
            −
          </button>
          {transform.scale > MIN_SCALE && (
            <button type="button" onClick={resetZoom} aria-label="Reset zoom" style={{ ...zoomBtnStyle, fontSize: 14, cursor: 'pointer' }}>
              ↺
            </button>
          )}
        </div>
      </div>

      {selected && (
        <CountryEditor
          country={selected}
          members={members}
          visitorIds={selectedVisitors}
          busyId={busyId}
          error={toggleError}
          onToggle={toggleVisitor}
          onClose={() => { setSelectedName(null); setToggleError(''); }}
        />
      )}
    </div>
  );
}

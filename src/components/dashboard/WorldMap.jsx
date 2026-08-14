import { useMemo, useState } from 'react';
import { COUNTRIES, makeProjection } from '../../lib/worldCountries.js';

const MAP_W = 960;
const MAP_H = 500;
const UNVISITED_FILL = '#eae4d6';

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

function CountryEditor({ country, members, visitorIds, onToggle, onClose }) {
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
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 99, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12.5, border: `1px solid ${on ? m.color : 'var(--line-strong)'}`,
                background: on ? m.color : '#fff', color: on ? '#fff' : 'var(--ink)',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 99, background: on ? '#fff' : m.color, flex: 'none' }} />
              {m.display_name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** The trips dashboard's "Where we've been" world map — real country
 * geometry (see lib/worldCountries.js), colored per visitor, with a small
 * round initial badge per person who's been there. Search finds a country
 * by name; clicking a country directly on the map works too. */
export default function WorldMap({ members, visitedCountries, onSetVisitedCountries }) {
  const [query, setQuery] = useState('');
  const [selectedName, setSelectedName] = useState(null);

  const { path, projection } = useMemo(() => makeProjection(MAP_W, MAP_H), []);
  const memberById = useMemo(() => Object.fromEntries(members.map((m) => [m.user_id, m])), [members]);
  const memberColor = (userId) => memberById[userId]?.color;
  const patterns = useStripePatterns(visitedCountries, memberColor);

  const visitedCount = Object.values(visitedCountries).filter((v) => (v || []).length > 0).length;

  const matches = query.trim()
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  const selected = selectedName ? COUNTRIES.find((c) => c.name === selectedName) : null;
  const selectedVisitors = selected ? (visitedCountries[selected.name] || []) : [];

  const pick = (name) => {
    setSelectedName(name);
    setQuery('');
  };

  const toggleVisitor = (userId) => {
    if (!selected) return;
    const current = visitedCountries[selected.name] || [];
    const next = current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId];
    onSetVisitedCountries({ [selected.name]: next });
  };

  const fillFor = (name) => {
    const visitors = visitedCountries[name];
    if (!visitors || visitors.length === 0) return UNVISITED_FILL;
    const colors = [...new Set(visitors.map(memberColor).filter(Boolean))].sort();
    if (colors.length === 0) return UNVISITED_FILL;
    if (colors.length === 1) return colors[0];
    const combo = [...patterns.values()].find((p) => p.colors.join('|') === colors.join('|'));
    return combo ? `url(#${combo.id})` : colors[0];
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
              {m.display_name}
            </span>
          ))}
        </div>
      </div>

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

      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12, background: '#f5f1e8' }}>
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

        {COUNTRIES.map((c) => (
          <path
            key={c.name}
            data-country={c.name}
            d={path(c.feature)}
            fill={fillFor(c.name)}
            stroke={selectedName === c.name ? 'var(--ink)' : '#fff'}
            strokeWidth={selectedName === c.name ? 1.6 : 0.5}
            onClick={() => pick(c.name)}
            style={{ cursor: 'pointer' }}
          />
        ))}

        {COUNTRIES.filter((c) => (visitedCountries[c.name] || []).length > 0).map((c) => {
          const [x, y] = projection(c.centroid);
          const visitors = visitedCountries[c.name] || [];
          return (
            <g key={c.name} style={{ pointerEvents: 'none' }}>
              {visitors.map((userId, i) => {
                const m = memberById[userId];
                if (!m) return null;
                const offset = (i - (visitors.length - 1) / 2) * 11;
                return (
                  <g key={userId} transform={`translate(${x + offset}, ${y})`}>
                    <circle r={7} fill={m.color} stroke="#fff" strokeWidth={1.4} />
                    <text textAnchor="middle" dominantBaseline="central" fontSize={8} fontWeight={700} fill="#fff" fontFamily="ui-monospace, monospace">
                      {(m.display_name?.[0] || '?').toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {selected && (
        <CountryEditor
          country={selected}
          members={members}
          visitorIds={selectedVisitors}
          onToggle={toggleVisitor}
          onClose={() => setSelectedName(null)}
        />
      )}
    </div>
  );
}

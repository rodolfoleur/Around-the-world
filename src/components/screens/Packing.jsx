import { useMemo, useState } from 'react';
import { TERRA, BLUE, GOLD, PLUM, SAGE } from '../../data/trip.js';
import { useTripWeather } from '../../state/useTripWeather.js';

const CATEGORIES = ['Clothing', 'Toiletries', 'Documents', 'Electronics', 'Meds', 'Misc'];
const CATEGORY_COLOR = { Clothing: TERRA, Toiletries: BLUE, Documents: GOLD, Electronics: PLUM, Meds: SAGE };

// Open-Meteo WMO weather codes (see lib/weather.js's WMO table) grouped
// into "does this affect what you'd pack" buckets.
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const COLD_C = 10; // below this overnight low, "pack a jacket" is a reasonable nudge
const HOT_C = 27; // above this daytime high, "pack sunscreen" is a reasonable nudge

/** Turns a trip's forecast/typical days into a small set of packing nudges
 * — deliberately just a few broad ones (cold, hot, rain, snow), not a
 * blow-by-blow of every day, since this is meant to jog memory, not be
 * read closely. Exported so it can be sanity-checked without a real
 * network call or a mounted component. */
export function weatherSuggestions(days) {
  if (!days.length) return [];
  const mins = days.map((d) => d.min).filter((n) => typeof n === 'number');
  const maxs = days.map((d) => d.max).filter((n) => typeof n === 'number');
  const minTemp = mins.length ? Math.min(...mins) : null;
  const maxTemp = maxs.length ? Math.max(...maxs) : null;
  const hasSnow = days.some((d) => SNOW_CODES.has(d.code));
  const hasRain = days.some((d) => RAIN_CODES.has(d.code));

  const out = [];
  if (minTemp !== null && minTemp <= COLD_C) {
    out.push({ key: 'cold', text: `Cold nights ahead — down to ${Math.round(minTemp)}°C. Pack a warm jacket?`, item: 'Warm jacket', category: 'Clothing' });
  }
  if (maxTemp !== null && maxTemp >= HOT_C) {
    out.push({ key: 'hot', text: `Hot days ahead — up to ${Math.round(maxTemp)}°C. Pack sunscreen?`, item: 'Sunscreen', category: 'Toiletries' });
  }
  if (hasSnow) {
    out.push({ key: 'snow', text: 'Snow in the forecast. Pack winter boots?', item: 'Winter boots', category: 'Clothing' });
  } else if (hasRain) {
    out.push({ key: 'rain', text: 'Rain in the forecast. Pack a rain jacket or umbrella?', item: 'Rain jacket / umbrella', category: 'Clothing' });
  }
  return out;
}

function SuggestionChip({ suggestion, onAdd, onDismiss }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 8 }}>
      <span style={{ fontSize: 13, lineHeight: 1.4, flex: 1 }}>{suggestion.text}</span>
      <button type="button" className="mono" onClick={() => onAdd(suggestion)} style={{ border: '1px solid var(--line-strong)', background: '#fff', borderRadius: 99, cursor: 'pointer', padding: '5px 11px', fontSize: 10.5, letterSpacing: '.04em', flex: 'none' }}>
        + {suggestion.item}
      </button>
      <button type="button" onClick={() => onDismiss(suggestion.key)} aria-label="Dismiss suggestion" className="mono" style={{ border: 0, background: 'none', cursor: 'pointer', color: 'var(--muted-3)', fontSize: 15, padding: '0 2px', flex: 'none', lineHeight: 1 }}>×</button>
    </div>
  );
}

/** "Copy from another trip" — a collapsed toggle that opens a short list of
 * other trips with something on their packing list; picking one copies all
 * of it in (deduped against what's already here) as an unpacked starting
 * point, rather than building every trip's list from zero. */
function CopyFromTrip({ otherTrips, onCopy }) {
  const [open, setOpen] = useState(false);
  const eligible = otherTrips.filter((t) => (t.packing || []).length > 0);
  if (eligible.length === 0) return null;

  return (
    <div style={{ marginBottom: 18 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mono"
        style={{ border: '1px solid var(--line-strong)', background: '#fff', borderRadius: 99, cursor: 'pointer', padding: '7px 13px', fontSize: 10.5, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)' }}
      >
        Copy from another trip {open ? '▴' : '▾'}
      </button>
      {open && (
        <div className="card" style={{ padding: 6, marginTop: 8 }}>
          {eligible.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { onCopy(t); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%',
                textAlign: 'left', border: 0, background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13.5, padding: '9px 10px', borderRadius: 8,
              }}
            >
              <span>{t.title}</span>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted-3)', flex: 'none' }}>{t.packing.length} item{t.packing.length === 1 ? '' : 's'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Small round initial badge — same visual language as the world map's
 * per-visitor markers, so "whose job is this" reads the same way it does
 * there. No member picked (shared item, e.g. "passports") shows no badge. */
function AssigneeBadge({ member, size = 18 }) {
  if (!member) return null;
  return (
    <span
      title={member.display_name}
      style={{
        width: size, height: size, borderRadius: 999, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: member.color, color: '#fff', fontSize: size * 0.5, fontWeight: 700, fontFamily: 'ui-monospace, monospace',
      }}
    >
      {(member.display_name?.[0] || '?').toUpperCase()}
    </span>
  );
}

function AddPackingRow({ members, onAdd }) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Clothing');
  const [assignee, setAssignee] = useState(null); // null = shared/either

  const submit = () => {
    if (onAdd(text, category, assignee)) setText('');
  };

  return (
    <div className="card" style={{ padding: 14, marginBottom: 18 }}>
      <input
        type="text"
        placeholder="Add something to pack…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        style={{ marginBottom: 10 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: members.length ? 10 : 0 }}>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className={'pill' + (category === c ? ' on' : '')} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>
      {members.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-3)' }}>For</span>
          <button
            type="button"
            onClick={() => setAssignee(null)}
            style={{
              padding: '5px 11px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
              border: `1px solid ${assignee === null ? 'var(--ink)' : 'var(--line-strong)'}`,
              background: assignee === null ? 'var(--ink)' : '#fff', color: assignee === null ? 'var(--bone)' : 'var(--ink)',
            }}
          >
            Shared
          </button>
          {members.map((m) => {
            const on = assignee === m.user_id;
            return (
              <button
                key={m.user_id}
                type="button"
                onClick={() => setAssignee(m.user_id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px 5px 7px', borderRadius: 99, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 12, border: `1px solid ${on ? m.color : 'var(--line-strong)'}`,
                  background: on ? m.color : '#fff', color: on ? '#fff' : 'var(--ink)',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 99, background: on ? '#fff' : m.color, flex: 'none' }} />
                {m.display_name}
              </button>
            );
          })}
          <span style={{ flex: 1 }} />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <button type="button" className="btn-dark" style={{ padding: '10px 16px', fontSize: 10.5 }} onClick={submit}>Add</button>
      </div>
    </div>
  );
}

function PackingRow({ item, memberById, onToggle, onRemove }) {
  return (
    <div className="card-btn" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'default' }}>
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        aria-label={item.packed ? 'Mark not packed' : 'Mark packed'}
        aria-pressed={item.packed}
        style={{
          width: 22, height: 22, borderRadius: 999, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: item.packed ? 'none' : '1.6px solid var(--line-strong)', background: item.packed ? 'var(--ink)' : 'none', cursor: 'pointer', padding: 0,
        }}
      >
        {item.packed && <span style={{ color: 'var(--bone)', fontSize: 12, lineHeight: 1 }}>✓</span>}
      </button>
      <span
        className="mono"
        style={{
          fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 6, flex: 'none',
          background: 'var(--wash)', color: CATEGORY_COLOR[item.category] || 'var(--muted)',
        }}
      >{item.category}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.4, textDecoration: item.packed ? 'line-through' : 'none', color: item.packed ? 'var(--muted-3)' : 'var(--ink)' }}>
        {item.text}
      </span>
      <AssigneeBadge member={memberById[item.assignee]} />
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        aria-label="Remove"
        className="mono"
        style={{ border: 0, background: 'none', cursor: 'pointer', color: 'var(--muted-3)', fontSize: 16, padding: '0 4px', flex: 'none', lineHeight: 1 }}
      >×</button>
    </div>
  );
}

export default function Packing({ trip, members = [], otherTrips = [] }) {
  const { packing, addPackingItem, togglePackingItem, removePackingItem, addPackingItems } = trip;
  const memberById = Object.fromEntries(members.map((m) => [m.user_id, m]));
  const [filter, setFilter] = useState('All'); // 'All' | a user_id | 'shared'
  const [dismissed, setDismissed] = useState(() => new Set());

  const { forecast, typical } = useTripWeather(trip.meta, trip.days);
  const weatherDays = useMemo(() => [...Object.values(forecast), ...Object.values(typical)], [forecast, typical]);
  const rawSuggestions = useMemo(() => weatherSuggestions(weatherDays), [weatherDays]);
  // Already got one of these? Don't keep nudging for it.
  const suggestions = rawSuggestions.filter((s) => !dismissed.has(s.key) && !packing.some((p) => p.text.trim().toLowerCase() === s.item.toLowerCase()));

  const addSuggestion = (s) => {
    addPackingItem(s.item, s.category, null);
    setDismissed((d) => new Set(d).add(s.key));
  };
  const dismissSuggestion = (key) => setDismissed((d) => new Set(d).add(key));

  const copyFromTrip = (source) => {
    const existing = new Set(packing.map((p) => p.text.trim().toLowerCase()));
    const toAdd = (source.packing || []).filter((p) => !existing.has(p.text.trim().toLowerCase()));
    if (toAdd.length) addPackingItems(toAdd.map((p) => ({ text: p.text, category: p.category, assignee: p.assignee || null })));
  };

  const filtered = packing.filter((p) => {
    if (filter === 'All') return true;
    if (filter === 'shared') return !p.assignee;
    return p.assignee === filter;
  });
  const pending = filtered.filter((p) => !p.packed);
  const packed = filtered.filter((p) => p.packed);
  const packedTotal = packing.filter((p) => p.packed).length;

  return (
    <div className="pad" style={{ paddingTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
        <h2 className="h2">Packing</h2>
        {packing.length > 0 && (
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted-2)', whiteSpace: 'nowrap', paddingTop: 4 }}>
            {packedTotal}/{packing.length} packed
          </div>
        )}
      </div>
      <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted-2)', marginBottom: 16 }}>
        What's coming with you — grouped by category, tag who it's for.
      </div>

      {packing.length > 0 && (
        <div style={{ height: 4, borderRadius: 99, background: 'var(--wash)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ height: '100%', width: `${(packedTotal / packing.length) * 100}%`, background: 'var(--ink)', transition: 'width .2s' }} />
        </div>
      )}

      <CopyFromTrip otherTrips={otherTrips} onCopy={copyFromTrip} />

      {suggestions.length > 0 && (
        <div style={{ marginBottom: 4 }}>
          {suggestions.map((s) => (
            <SuggestionChip key={s.key} suggestion={s} onAdd={addSuggestion} onDismiss={dismissSuggestion} />
          ))}
        </div>
      )}

      <AddPackingRow members={members} onAdd={addPackingItem} />

      {members.length > 0 && packing.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {[['All', 'All'], ['shared', 'Shared'], ...members.map((m) => [m.user_id, m.display_name])].map(([key, label]) => (
            <button key={key} type="button" className={'pill' + (filter === key ? ' on' : '')} onClick={() => setFilter(key)}>{label}</button>
          ))}
        </div>
      )}

      {packing.length === 0 ? (
        <div className="card" style={{ padding: '22px 18px', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>Nothing on the list yet — add your first item above.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pending.map((item) => (
            <PackingRow key={item.id} item={item} memberById={memberById} onToggle={togglePackingItem} onRemove={removePackingItem} />
          ))}

          {pending.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '8px 0' }}>Everything's packed 🧳</div>
          )}

          {packed.length > 0 && (
            <>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-3)', margin: '14px 0 2px' }}>
                Packed · {packed.length}
              </div>
              {packed.map((item) => (
                <PackingRow key={item.id} item={item} memberById={memberById} onToggle={togglePackingItem} onRemove={removePackingItem} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

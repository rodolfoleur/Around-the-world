import { useEffect, useRef, useState } from 'react';
import { TERRA } from '../../data/trip.js';
import { getDayParts } from '../../utils/dayParts.js';
import { transitIcon } from '../../components/icons.jsx';
import { useTripWeather } from '../../state/useTripWeather.js';
import { weatherIcon } from '../../lib/weather.js';

function tagColor(tag) {
  return tag === 'Empty' || tag === 'Open'
    ? { bg: 'rgba(201,111,63,.14)', fg: TERRA }
    : { bg: 'var(--wash)', fg: 'var(--muted)' };
}

/** The "spending the night in…" row — click to change it when plans change. */
function OvernightRow({ overnight, dayIndex, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(overnight || '');

  useEffect(() => { setEditing(false); setDraft(overnight || ''); }, [dayIndex, overnight]);

  if (editing) {
    const commit = () => { onSave(draft.trim()); setEditing(false); };
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '6px 0 14px 52px', padding: '11px 13px', borderRadius: 12, background: 'var(--wash)' }}>
        <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', flex: 'none' }}>Overnight</span>
        <input
          autoFocus
          type="text"
          placeholder="e.g. Windsor"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setDraft(overnight || ''); setEditing(false); }
          }}
          style={{ flex: 1, fontSize: 13, fontWeight: 500, textAlign: 'right', border: 0, background: 'none', padding: 0 }}
        />
        <button
          type="button"
          onClick={commit}
          className="mono"
          style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--terra)', flex: 'none' }}
        >Save</button>
      </div>
    );
  }

  if (!overnight) {
    return (
      <button
        type="button"
        className="dash-btn"
        style={{ marginLeft: 52, width: 'calc(100% - 52px)', boxSizing: 'border-box', padding: 11, marginBottom: 9 }}
        onClick={() => setEditing(true)}
      >+ Set overnight stay</button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      style={{
        display: 'flex', alignItems: 'center', gap: 9, width: 'calc(100% - 52px)', margin: '6px 0 14px 52px',
        padding: '11px 13px', borderRadius: 12, background: 'var(--wash)', border: 0, cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box',
      }}
    >
      <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', flex: 'none' }}>Overnight</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{overnight}</span>
    </button>
  );
}

function dayHasContent(d, extra) {
  if (d.transit.length) return true;
  if (Object.keys(d.parts).length) return true;
  if (extra && Object.values(extra).some((arr) => arr && arr.length)) return true;
  return false;
}

export default function Plan({ trip }) {
  const { state, patch, meta, days, day, dayExtra, openAddStopSheet, updateOvernight } = trip;
  const railRef = useRef(null);
  const lastDay = useRef(null);

  useEffect(() => {
    if (lastDay.current === state.day || !railRef.current) return;
    const chip = 55;
    railRef.current.scrollLeft = Math.max(0, state.day * chip - railRef.current.clientWidth / 2 + chip / 2);
    lastDay.current = state.day;
  }, [state.day]);

  const tc = tagColor(day.tag);
  const parts = getDayParts(day, dayExtra);
  const { forecast } = useTripWeather(meta, days);
  const todayWx = forecast[day.iso];

  return (
    <div className="pad-top">
      <div className="pad" style={{ paddingBottom: 0 }}>
        <h2 className="h2" style={{ marginBottom: 4 }}>Itinerary</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted-2)' }}>{day.label}</span>
          <span
            className="mono"
            style={{ fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 6, background: tc.bg, color: tc.fg }}
          >{day.tag}</span>
          {todayWx && (
            <span className="weather-wide-header mono" style={{ fontSize: 11.5, color: 'var(--muted)', alignItems: 'center', gap: 5 }}>
              <span>{weatherIcon(todayWx.code).icon}</span>
              <span>{Math.round(todayWx.max)}° / {Math.round(todayWx.min)}°</span>
              <span style={{ color: 'var(--muted-3)' }}>{todayWx.city}</span>
            </span>
          )}
        </div>
      </div>

      <div ref={railRef} className="day-rail">
        {days.map((d, i) => {
          const active = state.day === i;
          const hasContent = dayHasContent(d, meta.extraActivities[i]);
          const wx = forecast[d.iso];
          return (
            <button
              key={i}
              type="button"
              className={'day-chip' + (active ? ' active' : '')}
              onClick={() => patch({ day: i })}
            >
              <span className="dow">{d.dow}</span>
              <span className="num">{d.num}</span>
              {/* dot is the always-visible (mobile) indicator; the weather
                  chip replaces it only at the wide breakpoint, via CSS —
                  both render so mobile never loses the dot on days that
                  happen to have a forecast. */}
              {wx && (
                <span className="weather-wide-chip" style={{ fontSize: 10, marginTop: 3 }}>
                  {weatherIcon(wx.code).icon} {Math.round(wx.max)}°
                </span>
              )}
              <span
                className={'dot' + (wx ? ' has-weather-wide' : '')}
                style={{ width: 5, height: 5, margin: '5px auto 0', background: active ? 'var(--bone)' : (d.transit.length ? TERRA : (hasContent ? '#ddd6c8' : 'transparent')) }}
              />
            </button>
          );
        })}
      </div>

      <div className="pad" style={{ paddingTop: 0, paddingBottom: 0 }}>
        {day.transit.map((t, i) => {
          const Icon = transitIcon(t);
          return (
            <button
              key={i}
              type="button"
              onClick={() => trip.openBooking(t.bk)}
              className="mono"
              style={{
                width: '100%', boxSizing: 'border-box', display: 'flex', gap: 12, alignItems: 'center',
                textAlign: 'left', padding: '13px 14px', borderRadius: 14, border: 0, cursor: 'pointer',
                fontFamily: 'inherit', marginBottom: 9,
                background: t.night ? 'var(--ink)' : 'var(--wash)', color: t.night ? 'var(--bone)' : 'var(--ink)',
              }}
            >
              <span style={{ width: 22, height: 22, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, fontFamily: 'var(--font-sans)' }}>{t.t}</span>
                <span className="mono" style={{ display: 'block', fontSize: 11, opacity: 0.7, marginTop: 3 }}>{t.s}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        {parts.length === 0 && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
            <div style={{ width: 40, flex: 'none', textAlign: 'right', paddingTop: 14 }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>—</div>
            </div>
            <div style={{ width: 1, background: '#e6e0d3', position: 'relative', flex: 'none' }}>
              <span style={{ position: 'absolute', top: 18, left: -3.5, width: 8, height: 8, borderRadius: 99, background: '#ddd6c8', border: '2px solid var(--bone)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, padding: '6px 0 11px' }}>
              <button
                type="button"
                className="card-btn"
                style={{ padding: '13px 14px', background: '#f6f2e9' }}
                onClick={openAddStopSheet}
              >
                <span style={{ display: 'block', fontSize: 14, fontWeight: 400, lineHeight: 1.4, color: 'var(--muted)' }}>
                  Nothing planned yet. Add an activity below.
                </span>
              </button>
            </div>
          </div>
        )}

        {parts.map((p) => (
          <div key={p.key} style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
            <div style={{ width: 40, flex: 'none', textAlign: 'right', paddingTop: 14 }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{p.short}</div>
            </div>
            <div style={{ width: 1, background: '#e6e0d3', position: 'relative', flex: 'none' }}>
              <span style={{ position: 'absolute', top: 18, left: -3.5, width: 8, height: 8, borderRadius: 99, background: 'var(--ink)', border: '2px solid var(--bone)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, padding: '6px 0 11px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {p.items.map((it, i) => (
                <div key={i} className="card-btn" style={{ padding: '13px 14px', cursor: 'default' }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 500, lineHeight: 1.4, color: 'var(--ink)' }}>{it.text}</span>
                  {it.location && (
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{it.location}</span>
                  )}
                  {it.extra && (
                    <span className="mono" style={{ display: 'block', fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--terra)', marginTop: 5 }}>
                      + Added{it.time ? ` · ${it.time}` : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <OvernightRow
          overnight={day.overnight}
          dayIndex={state.day}
          onSave={(text) => updateOvernight(state.day, text)}
        />

        <button
          type="button"
          className="dash-btn"
          style={{ marginLeft: 52, width: 'calc(100% - 52px)', boxSizing: 'border-box', padding: 13 }}
          onClick={openAddStopSheet}
        >+ Add an activity</button>
      </div>
    </div>
  );
}

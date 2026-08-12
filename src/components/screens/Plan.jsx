import { useEffect, useRef, useState } from 'react';
import { TERRA, CITY_BY_DAY, CITY_COORDS } from '../../data/trip.js';
import { getDayParts } from '../../utils/dayParts.js';
import { transitIcon, ChevronLeftIcon, CalendarIcon } from '../../components/icons.jsx';
import { useTripWeather } from '../../state/useTripWeather.js';
import { weatherIcon } from '../../lib/weather.js';
import { travelGlyph } from '../../utils/travelGlyph.js';

const KNOWN_CITIES = Object.values(CITY_COORDS).map((c) => c.label);

// How far (px) and how much more horizontal-than-vertical a touch has to
// travel before it counts as a day-swipe rather than the page just being
// scrolled — keeps an ordinary vertical scroll from ever flipping the day.
const SWIPE_MIN_DIST = 48;
const SWIPE_DIRECTIONAL_RATIO = 1.4;

/** Swipe left/right anywhere in this region to move a day at a time. */
function useDaySwipe(onSwipe) {
  const start = useRef(null);
  // A real swipe still ends in a touchend over whatever happened to be
  // under the finger — e.g. an activity card — and some browsers follow
  // that up with a synthetic click. Without this, swiping across a card
  // could both change the day *and* open it. One recognized swipe arms
  // this for the click that immediately follows, if any; the timeout
  // disarms it again on its own so an unrelated later tap is never
  // affected if no such click actually shows up.
  const suppressNextClick = useRef(false);
  const suppressTimer = useRef(null);
  return {
    onTouchStart: (e) => {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
    },
    onTouchEnd: (e) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < SWIPE_MIN_DIST || Math.abs(dx) < Math.abs(dy) * SWIPE_DIRECTIONAL_RATIO) return;
      suppressNextClick.current = true;
      clearTimeout(suppressTimer.current);
      suppressTimer.current = setTimeout(() => { suppressNextClick.current = false; }, 500);
      onSwipe(dx < 0 ? 1 : -1);
    },
    onClickCapture: (e) => {
      if (!suppressNextClick.current) return;
      suppressNextClick.current = false;
      clearTimeout(suppressTimer.current);
      e.preventDefault();
      e.stopPropagation();
    },
  };
}

function tagColor(tag) {
  return tag === 'Empty' || tag === 'Open'
    ? { bg: 'rgba(201,111,63,.14)', fg: TERRA }
    : { bg: 'var(--wash)', fg: 'var(--muted)' };
}

/** One click-to-edit row (City, Lodging) — plans change, so nothing here is fixed. */
function EditableRow({ label, value, placeholder, dayIndex, onSave, options, emptyLabel }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const listId = 'row-suggestions-' + label.toLowerCase();

  useEffect(() => { setEditing(false); setDraft(value || ''); }, [dayIndex, value]);

  if (editing) {
    const commit = () => { onSave(draft.trim()); setEditing(false); };
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '0 0 9px 52px', padding: '11px 13px', borderRadius: 12, background: 'var(--wash)' }}>
        <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', flex: 'none' }}>{label}</span>
        <input
          autoFocus
          type="text"
          list={options ? listId : undefined}
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); }
          }}
          style={{ flex: 1, fontSize: 13, fontWeight: 500, textAlign: 'right', border: 0, background: 'none', padding: 0 }}
        />
        {options && (
          <datalist id={listId}>
            {options.map((o) => <option key={o} value={o} />)}
          </datalist>
        )}
        <button
          type="button"
          onClick={commit}
          className="mono"
          style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--terra)', flex: 'none' }}
        >Save</button>
      </div>
    );
  }

  if (!value) {
    return (
      <button
        type="button"
        className="dash-btn"
        style={{ marginLeft: 52, width: 'calc(100% - 52px)', boxSizing: 'border-box', padding: 11, marginBottom: 9 }}
        onClick={() => setEditing(true)}
      >+ Set {emptyLabel || label.toLowerCase()}</button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      style={{
        display: 'flex', alignItems: 'center', gap: 9, width: 'calc(100% - 52px)', margin: '0 0 9px 52px',
        padding: '11px 13px', borderRadius: 12, background: 'var(--wash)', border: 0, cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box',
      }}
    >
      <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', flex: 'none' }}>{label}</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{value}</span>
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
  const { state, patch, meta, days, day, dayExtra, openAddStopSheet, updateOvernight, updateDayCity, goToDay, go } = trip;
  const railRef = useRef(null);
  const lastDay = useRef(null);
  const [showWxDetail, setShowWxDetail] = useState(false);
  const swipeHandlers = useDaySwipe(goToDay);

  useEffect(() => {
    if (lastDay.current === state.day || !railRef.current) return;
    const chip = 55;
    railRef.current.scrollLeft = Math.max(0, state.day * chip - railRef.current.clientWidth / 2 + chip / 2);
    lastDay.current = state.day;
  }, [state.day]);

  useEffect(() => { setShowWxDetail(false); }, [state.day]);

  const tc = tagColor(day.tag);
  const parts = getDayParts(day, dayExtra);
  const { forecast, typical } = useTripWeather(meta, days);
  const todayWx = forecast[day.iso];
  const todayTypical = !todayWx ? typical[day.iso] : null;
  const effectiveCity = day.city || (meta.curated ? (CITY_COORDS[CITY_BY_DAY[state.day]]?.label || '') : '');
  const glyph = travelGlyph(day, meta.bookings);

  return (
    <div className="pad-top">
      <div className="pad" style={{ paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
          <h2 className="h2">Itinerary</h2>
          <button
            type="button"
            onClick={() => go('calendar')}
            className="mono"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--line-strong)', background: '#fff',
              borderRadius: 10, cursor: 'pointer', padding: '7px 11px', fontSize: 10, letterSpacing: '.06em',
              textTransform: 'uppercase', color: 'var(--muted)', flex: 'none',
            }}
          >
            <span style={{ width: 14, height: 14, display: 'flex' }}><CalendarIcon width={14} height={14} /></span>
            Calendar
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => goToDay(-1)}
            disabled={state.day <= 0}
            aria-label="Previous day"
            style={{
              border: 0, background: 'none', cursor: state.day <= 0 ? 'default' : 'pointer', padding: 4, margin: '0 -2px',
              display: 'flex', color: state.day <= 0 ? 'var(--line-strong)' : 'var(--muted)',
            }}
          ><ChevronLeftIcon width={7} height={12} /></button>
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted-2)' }}>{day.label}</span>
          <button
            type="button"
            onClick={() => goToDay(1)}
            disabled={state.day >= days.length - 1}
            aria-label="Next day"
            style={{
              border: 0, background: 'none', cursor: state.day >= days.length - 1 ? 'default' : 'pointer', padding: 4, margin: '0 -2px',
              display: 'flex', color: state.day >= days.length - 1 ? 'var(--line-strong)' : 'var(--muted)',
            }}
          ><ChevronLeftIcon width={7} height={12} style={{ transform: 'scaleX(-1)' }} /></button>
          <span
            className="mono"
            style={{ fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 6, background: tc.bg, color: tc.fg }}
          >{day.tag}</span>
          {glyph && <span style={{ fontSize: 14 }} title="Travel today">{glyph}</span>}
          {todayWx && (
            <button
              type="button"
              onClick={() => setShowWxDetail((s) => !s)}
              className="weather-wide-header mono"
              style={{
                fontSize: 11.5, color: 'var(--muted)', alignItems: 'center', gap: 5, border: 0, background: 'none',
                cursor: 'pointer', padding: 0, fontFamily: 'inherit',
              }}
            >
              <span>{weatherIcon(todayWx.code).icon}</span>
              <span>{Math.round(todayWx.max)}° / {Math.round(todayWx.min)}°</span>
              <span style={{ color: 'var(--muted-3)' }}>{todayWx.city}</span>
              <span style={{ fontSize: 9, color: 'var(--muted-3)' }}>{showWxDetail ? '▲' : '▼'}</span>
            </button>
          )}
          {todayTypical && (
            <span
              className="weather-wide-header mono"
              title={`Average over the last ${todayTypical.years} year${todayTypical.years === 1 ? '' : 's'} — not a forecast`}
              style={{ fontSize: 11.5, color: 'var(--muted-3)', alignItems: 'center', gap: 5 }}
            >
              <span>🌡️</span>
              <span>~{Math.round(todayTypical.avgMax)}° / {Math.round(todayTypical.avgMin)}°</span>
              <span>typical · {todayTypical.city}</span>
            </span>
          )}
        </div>

        {showWxDetail && todayWx && (
          <div className="card" style={{ padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            <div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 }}>Conditions</div>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{weatherIcon(todayWx.code).icon} {weatherIcon(todayWx.code).label}</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 }}>Wind</div>
              <div className="mono" style={{ fontSize: 13.5, fontWeight: 500 }}>{todayWx.wind != null ? `${Math.round(todayWx.wind)} km/h` : '—'}</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 }}>Chance of rain</div>
              <div className="mono" style={{ fontSize: 13.5, fontWeight: 500 }}>{todayWx.precipChance != null ? `${Math.round(todayWx.precipChance)}%` : '—'}</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 }}>Precipitation</div>
              <div className="mono" style={{ fontSize: 13.5, fontWeight: 500 }}>{todayWx.precipMm != null ? `${todayWx.precipMm} mm` : '—'}</div>
            </div>
          </div>
        )}
      </div>

      <div ref={railRef} className="day-rail">
        {days.map((d, i) => {
          const active = state.day === i;
          const hasContent = dayHasContent(d, meta.extraActivities[i]);
          const wx = forecast[d.iso];
          const typ = !wx ? typical[d.iso] : null;
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
                  happen to have a forecast (real or typical). */}
              {wx && (
                <span className="weather-wide-chip" style={{ fontSize: 10, marginTop: 3 }}>
                  {weatherIcon(wx.code).icon} {Math.round(wx.max)}°
                </span>
              )}
              {typ && (
                <span className="weather-wide-chip" style={{ fontSize: 10, marginTop: 3, color: 'var(--muted-3)' }} title="Typical, not a forecast">
                  ~{Math.round(typ.avgMax)}°
                </span>
              )}
              <span
                className={'dot' + (wx || typ ? ' has-weather-wide' : '')}
                style={{ width: 5, height: 5, margin: '5px auto 0', background: active ? 'var(--bone)' : (d.transit.length ? TERRA : (hasContent ? '#ddd6c8' : 'transparent')) }}
              />
            </button>
          );
        })}
      </div>

      <div {...swipeHandlers} style={{ touchAction: 'pan-y' }}>
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

        <EditableRow
          label="City"
          value={effectiveCity}
          placeholder="e.g. Windsor"
          dayIndex={state.day}
          options={KNOWN_CITIES}
          emptyLabel="which city"
          onSave={(text) => updateDayCity(state.day, text)}
        />
        <EditableRow
          label="Lodging"
          value={day.overnight}
          placeholder="e.g. Windsor Castle Hotel"
          dayIndex={state.day}
          emptyLabel="overnight stay"
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
    </div>
  );
}

import { useState } from 'react';
import {
  CITY_BY_DAY, PLACES, STOP_KINDS, STOP_KIND_TO_CATEGORY, DURATIONS, CITY_CURRENCY, SYM,
} from '../../data/trip.js';
import { SearchIcon } from '../../components/icons.jsx';
import CityMap from '../maps/CityMap.jsx';

export default function AddActivitySheet({ trip }) {
  const { state, patch, meta, day, addActivity } = trip;
  const [tried, setTried] = useState(false);

  const place = meta.curated ? PLACES[CITY_BY_DAY[state.day]] : null;
  const currency = meta.curated ? (CITY_CURRENCY[CITY_BY_DAY[state.day]] || 'GBP') : (meta.currency || 'GBP');

  const invalidName = tried && !state.activityName.trim();

  const submit = () => {
    setTried(true);
    addActivity();
  };

  return (
    <div style={{ padding: '8px 0 30px' }}>
      <div style={{ padding: '0 22px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700, letterSpacing: '-.025em', fontSize: 25, margin: 0 }}>Add an activity</h3>
          <span className="mono" style={{ fontSize: 11, color: 'var(--muted-2)' }}>{day.short}</span>
        </div>

        <div className="card" style={{ padding: '15px 16px', marginBottom: 20 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 9 }}>What is it</div>
          <input
            type="text"
            placeholder="Dinner at Berggericht"
            value={state.activityName}
            onChange={(e) => patch({ activityName: e.target.value })}
            style={{
              fontSize: 18, fontWeight: 600, lineHeight: 1.3, border: 0, background: 'none', padding: 0, width: '100%',
              outline: invalidName ? '2px solid var(--terra)' : 'none',
            }}
          />
        </div>

        <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 9 }}>Kind</div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 20 }}>
          {STOP_KINDS.map((k) => (
            <button key={k} type="button" className={'pill' + (state.stopKind === k ? ' on' : '')} onClick={() => patch({ stopKind: k })}>{k}</button>
          ))}
        </div>

        <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 9 }}>Part of day</div>
        <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
          {['Morning', 'Afternoon', 'Evening'].map((s) => {
            const on = state.stopSlot === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => patch({ stopSlot: s })}
                className="mono"
                style={{
                  flex: 1, fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase', padding: '10px 0', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${on ? 'var(--ink)' : 'var(--line-strong)'}`, background: on ? 'var(--ink)' : '#fff', color: on ? 'var(--bone)' : 'var(--ink)',
                }}
              >{s}</button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div className="card" style={{ padding: '12px 14px' }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 7 }}>Starts</div>
            <input
              type="text"
              value={state.stopStart}
              onChange={(e) => patch({ stopStart: e.target.value })}
              className="mono"
              style={{ fontSize: 19, border: 0, background: 'none', padding: 0, width: '100%' }}
            />
          </div>
          <div className="card" style={{ padding: '12px 14px' }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 7 }}>Lasts</div>
            <div className="mono" style={{ fontSize: 19 }}>{DURATIONS[state.stopDurIdx]}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
          {DURATIONS.map((d, i) => {
            const on = state.stopDurIdx === i;
            return (
              <button
                key={d}
                type="button"
                onClick={() => patch({ stopDurIdx: i })}
                className="mono"
                style={{
                  flex: 1, fontSize: 11, padding: '9px 0', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${on ? 'var(--ink)' : 'var(--line-strong)'}`, background: on ? 'var(--ink)' : '#fff', color: on ? 'var(--bone)' : 'var(--ink)',
                }}
              >{d}</button>
            );
          })}
        </div>

        <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 9 }}>Location — optional</div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', marginBottom: place ? 10 : 16 }}>
          <span style={{ width: 16, height: 16, flex: 'none', color: 'var(--muted-3)' }}><SearchIcon /></span>
          <input
            type="text"
            placeholder="Add a place name or address"
            value={state.stopQueryText}
            onChange={(e) => patch({ stopQueryText: e.target.value, hasLocation: false })}
            style={{ flex: 1, fontSize: 13.5, border: 0, background: 'none', padding: 0, width: '100%' }}
          />
        </div>
        {place && !state.hasLocation && (
          <button
            type="button"
            className="dash-btn"
            style={{ width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', marginBottom: 16 }}
            onClick={() => patch({ hasLocation: true })}
          >
            <span style={{ width: 16, height: 16, flex: 'none', color: 'var(--muted-3)' }}><SearchIcon /></span>
            <span style={{ flex: 1, textAlign: 'left', fontSize: 13.5, color: 'var(--muted)' }}>Or pick a suggestion — near {place.hint.replace('near ', '')}</span>
          </button>
        )}
        {place && state.hasLocation && (
          <div style={{ marginBottom: 16, animation: 'fadeIn .22s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>Suggestions near {place.hint.replace('near ', '')}</span>
              <button
                type="button"
                onClick={() => patch({ hasLocation: false })}
                className="mono"
                style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--terra)' }}
              >Hide</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
              {place.list.map((s, i) => {
                const on = state.stopPick === i && state.stopQueryText === s.name;
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => patch({ stopPick: i, stopQueryText: s.name })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '11px 13px', borderRadius: 13,
                      cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box', textAlign: 'left',
                      border: `1px solid ${on ? 'var(--terra)' : 'var(--line)'}`, background: on ? '#fff' : 'transparent',
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, flex: 'none', background: s.tint, color: s.tintFg,
                      }}
                    >{s.glyph}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{s.name}</span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.sub}</span>
                    </span>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted-3)', flex: 'none' }}>{s.dist}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ height: 110, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--line)', position: 'relative' }}>
              <CityMap points={place.pts} />
            </div>
          </div>
        )}

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', marginBottom: 12 }}>
          <span style={{ flex: 1, fontSize: 13.5, color: '#5c564c' }}>Estimated cost</span>
          <span className="mono" style={{ fontSize: 14, color: 'var(--muted-3)' }}>{SYM[currency]}</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0"
            value={state.stopEstimate}
            onChange={(e) => patch({ stopEstimate: e.target.value })}
            className="mono"
            style={{ width: 70, fontSize: 16, border: 0, background: 'none', padding: 0, textAlign: 'right' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', borderRadius: 14, background: 'var(--wash)', marginBottom: 20 }}>
          <span style={{ flex: 1, fontSize: 13, color: '#5c564c' }}>Add to the tracker as {STOP_KIND_TO_CATEGORY[state.stopKind]}</span>
          <button
            type="button"
            onClick={() => patch((s) => ({ stopBudget: !s.stopBudget }))}
            style={{
              width: 46, height: 27, borderRadius: 99, border: 0, padding: 2, cursor: 'pointer', display: 'flex',
              justifyContent: state.stopBudget ? 'flex-end' : 'flex-start', transition: 'all .18s ease',
              background: state.stopBudget ? 'var(--terra)' : '#ddd6c8',
            }}
          >
            <span style={{ width: 23, height: 23, borderRadius: 99, background: 'var(--bone)', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 9 }}>
          <button type="button" className="btn-outline" style={{ flex: 'none', width: 96, padding: '15px 0', fontSize: 11 }} onClick={trip.closeSheet}>
            Cancel
          </button>
          <button type="button" className="btn-primary" style={{ flex: 1, padding: 15, fontSize: 11.5 }} onClick={submit}>
            Add to {day.short}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { LEGS, LOCATION_COORDS, INK, PLUM, GOLD } from '../../data/trip.js';
import { haversineKm } from '../../utils/geo.js';
import { geocodePlace } from '../../lib/geocode.js';
import RealJourneyMap from '../maps/RealJourneyMap.jsx';
import RoadTripMap from '../maps/RoadTripMap.jsx';

const FILTERS = ['All', 'Flight', 'Ground', 'Car'];

/** Straight-line km for a Car leg, e.g. "≈ 62 km" — not a driving distance
 * (no routing API wired up), so always labelled as approximate. */
function legDistanceLabel(leg) {
  if (leg.type !== 'Car') return null;
  const from = LOCATION_COORDS[leg.from];
  const to = LOCATION_COORDS[leg.to];
  if (!from || !to) return null;
  return `≈ ${Math.round(haversineKm(from, to))} km`;
}

/** The focused leg's booking, shown inline in the side column instead of
 * a modal — "the focalized map and the booking info" together. */
function FocusedLegPanel({ leg, booking, onClear, onOpenFull }) {
  const d = booking?.detail || {};
  const rows = d.rows || [];
  const hasRoute = d.leftValue || d.rightValue;
  const km = legDistanceLabel(leg);

  return (
    <div>
      <button
        type="button"
        onClick={onClear}
        className="mono"
        style={{
          border: 0, background: 'none', cursor: 'pointer', padding: '14px 0 10px', fontSize: 10.5,
          letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--terra)', display: 'flex', alignItems: 'center', gap: 5,
        }}
      >← All legs</button>

      {!booking ? (
        <div style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>No booking on file for this leg yet.</div>
      ) : (
        <div className="card" style={{ padding: 16 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 8 }}>
            {booking.kind} · {booking.status}
          </div>
          <div style={{ fontWeight: 700, letterSpacing: '-.02em', fontSize: 18, marginBottom: 4, lineHeight: 1.25 }}>{booking.title}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.45 }}>{booking.sub}</div>

          {(hasRoute || km) && (
            <div className="card-dark" style={{ padding: 14, marginBottom: 14 }}>
              {hasRoute && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 }}>{d.leftLabel}</div>
                    <div className="mono" style={{ fontSize: 18 }}>{d.leftValue}</div>
                  </div>
                  <span style={{ color: '#6b6862', fontSize: 13 }}>→</span>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 }}>{d.rightLabel}</div>
                    <div className="mono" style={{ fontSize: 18 }}>{d.rightValue}</div>
                  </div>
                </div>
              )}
              {km && (
                <div className="mono" style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: hasRoute ? 10 : 0, textAlign: 'center' }}>
                  {km} straight-line
                </div>
              )}
            </div>
          )}

          {rows.slice(0, 3).map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < Math.min(rows.length, 3) - 1 ? '1px solid var(--wash-2)' : 0 }}>
              <span style={{ flex: 'none', width: 90, fontSize: 11.5, color: 'var(--muted)' }}>{r.k}</span>
              <span className="mono" style={{ flex: 1, fontSize: 11.5, textAlign: 'right' }}>{r.v}</span>
            </div>
          ))}

          <button type="button" className="btn-dark" style={{ width: '100%', padding: 12, fontSize: 10.5, marginTop: 14 }} onClick={onOpenFull}>
            View full booking
          </button>
        </div>
      )}
    </div>
  );
}

/** Inline "+ Add a leg" form for a self-driven trip. Submitting geocodes
 * both ends (free, no key — see lib/geocode.js) so the leg can plot on the
 * map and get a real straight-line km; a lookup that misses just leaves
 * that end unplotted rather than blocking the save — the km stays
 * hand-editable from the focus panel either way. */
function AddLegForm({ onAdd, onClose }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!from.trim() || !to.trim()) { setError('Add both a start and an end.'); return; }
    setBusy(true);
    setError('');
    const [fromCoord, toCoord] = await Promise.all([geocodePlace(from), geocodePlace(to)]);
    const km = fromCoord && toCoord ? Math.round(haversineKm(fromCoord, toCoord)) : null;
    onAdd({
      from: from.trim(), to: to.trim(), date, notes: notes.trim(),
      fromCoord, toCoord, km, kmAuto: km != null,
    });
    setBusy(false);
    onClose();
  };

  return (
    <div className="card" style={{ padding: 14, marginBottom: 14 }}>
      <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 10 }}>
        Add a leg
      </div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 8 }}>
        <input type="text" placeholder="From" value={from} onChange={(e) => setFrom(e.target.value)} style={{ flex: 1 }} />
        <input type="text" placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} style={{ flex: 1 }} />
      </div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ flex: 1 }} />
        <input type="text" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ flex: 1 }} />
      </div>
      {error && <div style={{ fontSize: 11.5, color: 'var(--terra)', marginBottom: 8 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 7 }}>
        <button type="button" className="btn-dark" style={{ flex: 1, padding: 11, fontSize: 10.5 }} onClick={submit} disabled={busy}>
          {busy ? 'Locating…' : 'Add leg'}
        </button>
        <button type="button" className="btn-outline" style={{ flex: 'none', padding: '0 16px', fontSize: 10.5 }} onClick={onClose} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function RoadTripLegRow({ leg, n, onFocus }) {
  return (
    <button
      type="button"
      onClick={() => onFocus(leg.id)}
      style={{
        display: 'flex', gap: 13, alignItems: 'center', padding: '12px 0', border: 0,
        borderBottom: '1px solid var(--wash-2)', background: 'none', cursor: 'pointer',
        fontFamily: 'inherit', textAlign: 'left', width: '100%',
      }}
    >
      <span
        className="mono"
        style={{
          width: 24, height: 24, borderRadius: 99, color: 'var(--bone)', fontSize: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', background: PLUM,
        }}
      >{n}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
          <span className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{leg.from}</span>
          <span style={{ color: '#c9c2b4', fontSize: 11 }}>→</span>
          <span className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{leg.to}</span>
        </span>
        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>
          {[leg.notes, leg.km != null ? `≈ ${leg.km} km` : null].filter(Boolean).join(' · ')}
          {(!leg.fromCoord || !leg.toCoord) ? ' · not mapped' : ''}
        </span>
      </span>
      {leg.date && (
        <span className="mono" style={{ fontSize: 11, color: 'var(--muted-3)', flex: 'none', textAlign: 'right' }}>
          {new Date(leg.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      )}
    </button>
  );
}

/** The focused manual leg's detail — km is always hand-editable here (not
 * just when the geocode missed), since a straight-line estimate is never
 * the real driving distance anyway. */
function RoadTripFocusPanel({ leg, onClear, onUpdate, onDelete }) {
  const [kmDraft, setKmDraft] = useState(leg.km != null ? String(leg.km) : '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const saveKm = () => {
    const n = parseFloat(kmDraft);
    onUpdate(leg.id, { km: Number.isNaN(n) ? null : n, kmAuto: false });
  };

  return (
    <div>
      <button
        type="button"
        onClick={onClear}
        className="mono"
        style={{
          border: 0, background: 'none', cursor: 'pointer', padding: '14px 0 10px', fontSize: 10.5,
          letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--terra)', display: 'flex', alignItems: 'center', gap: 5,
        }}
      >← All legs</button>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, letterSpacing: '-.02em', fontSize: 18, marginBottom: 4, lineHeight: 1.25 }}>
          {leg.from} → {leg.to}
        </div>
        {leg.date && (
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14 }}>
            {new Date(leg.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}

        {(!leg.fromCoord || !leg.toCoord) && (
          <div style={{ fontSize: 11.5, color: 'var(--muted-2)', marginBottom: 12, lineHeight: 1.4 }}>
            Couldn't place {!leg.fromCoord ? leg.from : leg.to} on the map — the km below is whatever you enter.
          </div>
        )}

        <label className="field-label" htmlFor="leg-km">Distance (km)</label>
        <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
          <input id="leg-km" type="number" inputMode="decimal" value={kmDraft} onChange={(e) => setKmDraft(e.target.value)} style={{ flex: 1 }} />
          <button type="button" className="btn-outline" style={{ flex: 'none', padding: '0 14px', fontSize: 10.5 }} onClick={saveKm}>Save</button>
        </div>

        {leg.notes && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.45 }}>{leg.notes}</div>}

        <button
          type="button"
          className="btn-outline"
          style={{ width: '100%', padding: 12, fontSize: 10.5, color: 'var(--terra)' }}
          onClick={() => (confirmingDelete ? onDelete(leg.id) : setConfirmingDelete(true))}
        >
          {confirmingDelete ? 'Tap again to delete this leg' : 'Delete this leg'}
        </button>
      </div>
    </div>
  );
}

/** Journey for a non-curated trip — nothing self-populates here (no fixed
 * LEGS list to draw from), so this is either the "nothing filed yet"
 * placeholder or, with Road Trip switched on, a fully manual leg log:
 * add legs, see them plotted on a real map (best-effort geocoded), click
 * one to focus/edit/delete it. */
function RoadTripJourney({ trip }) {
  const { state, patch, meta, roadTrip, journeyLegs, toggleRoadTrip, addJourneyLeg, updateJourneyLeg, deleteJourneyLeg } = trip;
  const [adding, setAdding] = useState(false);
  const focusedLeg = state.journeyFocusLeg != null ? journeyLegs.find((l) => l.id === state.journeyFocusLeg) : null;
  const focusLeg = (id) => patch({ journeyFocusLeg: id });
  const clearFocus = () => patch({ journeyFocusLeg: null });

  return (
    <div className="pad-top">
      <div className="pad" style={{ paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <h2 className="h2" style={{ marginBottom: 4 }}>Journey</h2>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted-2)' }}>
              {roadTrip ? `${journeyLegs.length} leg${journeyLegs.length === 1 ? '' : 's'} logged` : 'Flights, transfers and rentals'}
            </div>
          </div>
          <button
            type="button"
            className={'pill' + (roadTrip ? ' on' : '')}
            style={{ flex: 'none', marginTop: 2 }}
            onClick={() => { toggleRoadTrip(); clearFocus(); }}
          >
            {roadTrip ? '✓ Road Trip' : 'Road Trip'}
          </button>
        </div>
      </div>

      {!roadTrip ? (
        <div className="pad">
          <div className="card" style={{ padding: '22px 18px', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              No route mapped yet. Once you've filed some bookings for {meta.title}, the flights, transfers and rentals
              will show up here as a route — or if this is a self-driven trip with nothing to book, switch on
              "Road Trip" above to log your own legs instead.
            </div>
          </div>
        </div>
      ) : (
        <div className="journey-columns" style={{ padding: '0 20px' }}>
          <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--line)', background: '#eae4d6', position: 'relative', height: 290, isolation: 'isolate' }}>
            <RoadTripMap legs={journeyLegs} focusedLegId={state.journeyFocusLeg} onSelectLeg={focusLeg} />
          </div>

          <div>
            {focusedLeg ? (
              <RoadTripFocusPanel
                leg={focusedLeg}
                onClear={clearFocus}
                onUpdate={updateJourneyLeg}
                onDelete={(id) => { deleteJourneyLeg(id); clearFocus(); }}
              />
            ) : (
              <>
                {adding ? (
                  <div style={{ marginTop: 14 }}>
                    <AddLegForm onAdd={addJourneyLeg} onClose={() => setAdding(false)} />
                  </div>
                ) : (
                  <button type="button" className="dash-btn" style={{ width: '100%', padding: 13, marginTop: 14 }} onClick={() => setAdding(true)}>
                    + Add a leg
                  </button>
                )}
                <div style={{ padding: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {journeyLegs.length === 0 && !adding && (
                    <div style={{ fontSize: 13, color: 'var(--muted)', padding: '16px 0' }}>
                      No legs yet — add your first one above.
                    </div>
                  )}
                  {journeyLegs.map((l, i) => (
                    <RoadTripLegRow key={l.id} leg={l} n={i + 1} onFocus={focusLeg} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Journey({ trip }) {
  const { state, patch, meta, openBooking } = trip;

  if (!meta.curated) {
    return <RoadTripJourney trip={trip} />;
  }

  const legs = LEGS.filter((l) => state.legFilter === 'All' || l.type === state.legFilter);
  const focusedLeg = state.journeyFocusLeg != null ? LEGS.find((l) => l.n === state.journeyFocusLeg) : null;
  const focusedBookingRaw = focusedLeg ? meta.bookings[focusedLeg.bk] : null;
  const focusedBooking = focusedBookingRaw && !focusedBookingRaw.deleted ? focusedBookingRaw : null;
  const focusLeg = (n) => patch({ journeyFocusLeg: n });
  const clearFocus = () => patch({ journeyFocusLeg: null });

  return (
    <div className="pad-top">
      <div className="pad" style={{ paddingBottom: 14 }}>
        <h2 className="h2" style={{ marginBottom: 4 }}>Journey</h2>
        <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted-2)' }}>6 flights · 5 ground transfers · 1 car rental</div>
      </div>

      <div className="journey-columns" style={{ padding: '0 20px' }}>
        <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--line)', background: '#eae4d6', position: 'relative', height: 290, isolation: 'isolate' }}>
          <RealJourneyMap legFilter={state.legFilter} focusedLegN={state.journeyFocusLeg} onSelectLeg={focusLeg} />
        </div>

        <div>
          {focusedLeg ? (
            <FocusedLegPanel leg={focusedLeg} booking={focusedBooking} onClear={clearFocus} onOpenFull={() => openBooking(focusedLeg.bk)} />
          ) : (
            <>
              <div style={{ display: 'flex', gap: 6, padding: '14px 0 4px' }}>
                {FILTERS.map((f) => (
                  <button key={f} type="button" className={'pill' + (state.legFilter === f ? ' on' : '')} onClick={() => patch({ legFilter: f, journeyFocusLeg: null })}>
                    {f}
                  </button>
                ))}
              </div>

              <div style={{ padding: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {legs.map((l) => {
                  const km = legDistanceLabel(l);
                  return (
                    <button
                      key={l.n}
                      type="button"
                      onClick={() => focusLeg(l.n)}
                      style={{
                        display: 'flex', gap: 13, alignItems: 'center', padding: '12px 0', border: 0,
                        borderBottom: '1px solid var(--wash-2)', background: 'none', cursor: 'pointer',
                        fontFamily: 'inherit', textAlign: 'left', width: '100%',
                      }}
                    >
                      <span
                        className="mono"
                        style={{
                          width: 24, height: 24, borderRadius: 99, color: 'var(--bone)', fontSize: 10,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
                          background: l.type === 'Flight' ? INK : (l.type === 'Car' ? PLUM : GOLD),
                        }}
                      >{l.n}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                          <span className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{l.from}</span>
                          <span style={{ color: '#c9c2b4', fontSize: 11 }}>→</span>
                          <span className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{l.to}</span>
                        </span>
                        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>
                          {l.sub}{km ? ` · ${km}` : ''}
                        </span>
                      </span>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--muted-3)', flex: 'none', textAlign: 'right' }}>{l.when}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

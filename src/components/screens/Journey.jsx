import { LEGS, LOCATION_COORDS, INK, PLUM, GOLD } from '../../data/trip.js';
import { haversineKm } from '../../utils/geo.js';
import RealJourneyMap from '../maps/RealJourneyMap.jsx';

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

export default function Journey({ trip }) {
  const { state, patch, meta, openBooking } = trip;

  if (!meta.curated) {
    return (
      <div className="pad-top">
        <div className="pad" style={{ paddingBottom: 14 }}>
          <h2 className="h2" style={{ marginBottom: 4 }}>Journey</h2>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted-2)' }}>Flights, transfers and rentals</div>
        </div>
        <div className="pad">
          <div className="card" style={{ padding: '22px 18px', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              No route mapped yet. Once you've filed some bookings for {meta.title}, the flights, transfers and rentals
              will show up here as a route.
            </div>
          </div>
        </div>
      </div>
    );
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

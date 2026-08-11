import { LEGS, INK, PLUM, GOLD } from '../../data/trip.js';
import JourneyMap from '../maps/JourneyMap.jsx';

const FILTERS = ['All', 'Flight', 'Ground', 'Car'];

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

  return (
    <div className="pad-top">
      <div className="pad" style={{ paddingBottom: 14 }}>
        <h2 className="h2" style={{ marginBottom: 4 }}>Journey</h2>
        <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted-2)' }}>6 flights · 5 ground transfers · 1 car rental</div>
      </div>

      <div className="journey-columns" style={{ padding: '0 20px' }}>
        <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--line)', background: '#eae4d6', position: 'relative', height: 290 }}>
          <JourneyMap />
        </div>

        <div>
          <div style={{ display: 'flex', gap: 6, padding: '14px 0 4px' }}>
            {FILTERS.map((f) => (
              <button key={f} type="button" className={'pill' + (state.legFilter === f ? ' on' : '')} onClick={() => patch({ legFilter: f })}>
                {f}
              </button>
            ))}
          </div>

          <div style={{ padding: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {legs.map((l) => (
              <button
                key={l.n}
                type="button"
                onClick={() => openBooking(l.bk)}
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
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>{l.sub}</span>
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--muted-3)', flex: 'none', textAlign: 'right' }}>{l.when}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

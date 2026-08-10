import { ChevronLeftIcon } from '../../components/icons.jsx';

const FILTERS = ['All', 'Flights', 'Stays', 'Ground', 'Car'];

export default function Bookings({ trip }) {
  const { state, patch, go, bookings, openBooking } = trip;
  const filtered = bookings.filter((b) => state.bFilter === 'All' || b.group === state.bFilter);

  return (
    <div className="pad">
      <button
        type="button"
        onClick={() => go('home')}
        className="mono"
        style={{
          display: 'flex', alignItems: 'center', gap: 6, border: 0, background: 'none', cursor: 'pointer',
          padding: 0, margin: '2px 0 14px', fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)',
        }}
      >
        <ChevronLeftIcon /> Trip
      </button>

      <h2 className="h2" style={{ marginBottom: 4 }}>Bookings</h2>
      <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted-2)', marginBottom: 16 }}>Forwarded confirmations · auto-filed</div>

      {bookings.length === 0 ? (
        <div className="card" style={{ padding: '22px 18px', textAlign: 'center', color: 'var(--muted)' }}>
          No bookings filed yet. Flight, stay and car confirmations will show up here.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {FILTERS.map((f) => (
              <button key={f} type="button" className={'pill' + (state.bFilter === f ? ' on' : '')} onClick={() => patch({ bFilter: f })}>
                {f}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((b) => {
              const idx = bookings.indexOf(b);
              const good = b.status === 'Confirmed' || b.status === 'Prepaid';
              return (
                <button key={idx} type="button" className="card-btn" style={{ padding: 15 }} onClick={() => openBooking(idx)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                    <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{b.kind}</span>
                    <span style={{ flex: 1, height: 1, background: 'var(--wash-2)' }} />
                    <span
                      className="mono"
                      style={{
                        fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', padding: '4px 7px', borderRadius: 6,
                        background: good ? 'var(--wash)' : 'rgba(201,111,63,.14)',
                        color: good ? 'var(--muted)' : 'var(--terra)',
                      }}
                    >{b.status}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.25 }}>{b.title}</span>
                    <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted)', flex: 'none' }}>{b.price}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 5, lineHeight: 1.4 }}>{b.sub}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 11 }}>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink)', background: 'var(--wash)', padding: '4px 8px', borderRadius: 6 }}>{b.ref}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>{b.who}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

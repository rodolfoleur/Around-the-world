const FILTERS = ['All', 'Flights', 'Stays', 'Ground', 'Car', 'Events'];

export default function Bookings({ trip }) {
  const { state, patch, meta, bookings, openBooking, openAddBookingSheet } = trip;
  const filtered = bookings.filter((b) => state.bFilter === 'All' || b.group === state.bFilter);

  return (
    <div className="pad" style={{ paddingTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
        <h2 className="h2">Bookings</h2>
        <button type="button" className="btn-primary" style={{ padding: '10px 14px', fontSize: 10.5, flex: 'none' }} onClick={openAddBookingSheet}>
          + Add booking
        </button>
      </div>
      <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted-2)', marginBottom: 16 }}>
        {meta.curated ? 'Forwarded confirmations · auto-filed' : 'Flight, stay, ground and car confirmations'}
      </div>

      {bookings.length === 0 ? (
        <button
          type="button"
          className="dash-btn"
          style={{ width: '100%', boxSizing: 'border-box', padding: '20px 16px', fontSize: 11.5 }}
          onClick={openAddBookingSheet}
        >
          + File your first booking
        </button>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {FILTERS.map((f) => (
              <button key={f} type="button" className={'pill' + (state.bFilter === f ? ' on' : '')} onClick={() => patch({ bFilter: f })}>
                {f}
              </button>
            ))}
          </div>

          <div className="booking-list">
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
                  {b.sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 5, lineHeight: 1.4 }}>{b.sub}</div>}
                  {(b.ref || b.who) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 11 }}>
                      {b.ref && <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink)', background: 'var(--wash)', padding: '4px 8px', borderRadius: 6 }}>{b.ref}</span>}
                      {b.who && <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>{b.who}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

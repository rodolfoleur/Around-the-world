import { useState } from 'react';

export default function BookingSheet({ trip }) {
  const { state, bookings, closeSheet, deleteBooking } = trip;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const b = bookings[state.bookingIdx];
  const d = b.detail || {};
  const rows = d.rows || [];
  const hasRoute = d.leftValue || d.rightValue;

  const remove = () => {
    if (!confirmingDelete) { setConfirmingDelete(true); return; }
    deleteBooking(state.bookingIdx);
    closeSheet();
  };

  return (
    <div style={{ padding: '8px 0 30px' }}>
      <div style={{ padding: '0 22px' }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 8 }}>
          {b.kind} · {b.status}
        </div>
        <h3 style={{ fontWeight: 700, letterSpacing: '-.025em', fontSize: 24, margin: '0 0 4px', lineHeight: 1.2 }}>{b.title}</h3>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18, lineHeight: 1.45 }}>{b.sub}</div>
      </div>

      {hasRoute && (
        <div className="card-dark" style={{ margin: '0 22px 18px', padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 6 }}>{d.leftLabel}</div>
              <div className="mono" style={{ fontSize: 23, letterSpacing: '-.02em' }}>{d.leftValue}</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--muted-2)', marginTop: 4 }}>{d.leftSub}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ flex: 1, height: 1, background: '#3a3733' }} />
              <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--terra)' }} />
              <span style={{ flex: 1, height: 1, background: '#3a3733' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 6 }}>{d.rightLabel}</div>
              <div className="mono" style={{ fontSize: 23, letterSpacing: '-.02em' }}>{d.rightValue}</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--muted-2)', marginTop: 4 }}>{d.rightSub}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '0 22px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 14 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--wash-2)' }}>
              <span style={{ flex: 'none', width: 98, fontSize: 12.5, color: 'var(--muted)' }}>{r.k}</span>
              <span className="mono" style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45, textAlign: 'right' }}>{r.v}</span>
            </div>
          ))}
        </div>

        {d.note && (
          <div style={{ display: 'flex', gap: 10, padding: '13px 14px', borderRadius: 13, background: 'rgba(201,111,63,.1)', marginBottom: 16 }}>
            <span style={{ width: 5, borderRadius: 99, background: 'var(--terra)', flex: 'none' }} />
            <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: '#5c564c' }}>{d.note}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 9, marginBottom: 9 }}>
          <button type="button" className="btn-outline" style={{ flex: 1, padding: 14, fontSize: 11 }} onClick={closeSheet}>
            Add to wallet
          </button>
          <button type="button" className="btn-primary" style={{ flex: 1, padding: 14, fontSize: 11, borderRadius: 13 }} onClick={closeSheet}>
            Open booking
          </button>
        </div>

        <button
          type="button"
          onClick={remove}
          className="mono"
          style={{
            width: '100%', padding: 13, fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase',
            border: `1px solid ${confirmingDelete ? 'var(--terra)' : 'var(--line)'}`, borderRadius: 12, cursor: 'pointer',
            background: confirmingDelete ? 'rgba(201,111,63,.1)' : 'none', color: confirmingDelete ? 'var(--terra)' : 'var(--muted-3)',
          }}
        >
          {confirmingDelete ? 'Tap again to confirm delete' : 'Delete booking'}
        </button>
      </div>
    </div>
  );
}

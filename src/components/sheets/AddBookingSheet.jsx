import { useState } from 'react';

const KINDS = ['Flight', 'Stay', 'Ground', 'Car'];
const STATUSES = ['Confirmed', 'Prepaid', 'Pending'];
const ROUTE_LABELS = {
  Flight: ['Depart', 'Arrive'],
  Stay: ['Check-in', 'Check-out'],
  Ground: ['Pickup', 'Drop'],
  Car: ['Pickup', 'Return'],
};

export default function AddBookingSheet({ trip }) {
  const { state, patch, addBooking } = trip;
  const [tried, setTried] = useState(false);

  const invalidTitle = tried && !state.bkTitle.trim();

  const pickKind = (k) => {
    const [l, r] = ROUTE_LABELS[k];
    patch({ bkKind: k, bkLeftLabel: l, bkRightLabel: r });
  };

  const submit = () => {
    setTried(true);
    addBooking();
  };

  return (
    <div style={{ padding: '8px 22px 30px' }}>
      <h3 style={{ fontWeight: 700, letterSpacing: '-.025em', fontSize: 25, margin: '0 0 16px' }}>Add a booking</h3>

      <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 9 }}>Type</div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 18, flexWrap: 'wrap' }}>
        {KINDS.map((k) => (
          <button key={k} type="button" className={'pill' + (state.bkKind === k ? ' on' : '')} onClick={() => pickKind(k)}>{k}</button>
        ))}
      </div>

      <label className="field-label" htmlFor="bk-title">Title</label>
      <input
        id="bk-title"
        type="text"
        placeholder="Delta DL123, Casa Bonita Hotel…"
        value={state.bkTitle}
        onChange={(e) => patch({ bkTitle: e.target.value })}
        style={{ marginBottom: 14, outline: invalidTitle ? '2px solid var(--terra)' : undefined }}
      />

      <label className="field-label" htmlFor="bk-sub">Details — optional</label>
      <input
        id="bk-sub"
        type="text"
        placeholder="Lisbon → Porto · Sat Sep 5 · 2 passengers"
        value={state.bkSub}
        onChange={(e) => patch({ bkSub: e.target.value })}
        style={{ marginBottom: 14 }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label className="field-label" htmlFor="bk-price">Price — optional</label>
          <input id="bk-price" type="text" placeholder="£120.00" value={state.bkPrice} onChange={(e) => patch({ bkPrice: e.target.value })} />
        </div>
        <div>
          <label className="field-label" htmlFor="bk-ref">Confirmation # — optional</label>
          <input id="bk-ref" type="text" placeholder="GXUQKV" value={state.bkRef} onChange={(e) => patch({ bkRef: e.target.value })} />
        </div>
      </div>

      <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 9 }}>Status</div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
        {STATUSES.map((s) => (
          <button key={s} type="button" className={'pill' + (state.bkStatus === s ? ' on' : '')} onClick={() => patch({ bkStatus: s })}>{s}</button>
        ))}
      </div>

      <div className="card" style={{ padding: '14px 16px', marginBottom: 18 }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 12 }}>
          Route — optional
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="field-label" htmlFor="bk-left-value">{state.bkLeftLabel || 'From'}</label>
            <input id="bk-left-value" type="text" placeholder="LHR" value={state.bkLeftValue} onChange={(e) => patch({ bkLeftValue: e.target.value })} />
          </div>
          <div>
            <label className="field-label" htmlFor="bk-right-value">{state.bkRightLabel || 'To'}</label>
            <input id="bk-right-value" type="text" placeholder="MUC" value={state.bkRightValue} onChange={(e) => patch({ bkRightValue: e.target.value })} />
          </div>
          <div>
            <input type="text" placeholder="07:10 · T5" value={state.bkLeftSub} onChange={(e) => patch({ bkLeftSub: e.target.value })} />
          </div>
          <div>
            <input type="text" placeholder="10:05 · T1" value={state.bkRightSub} onChange={(e) => patch({ bkRightSub: e.target.value })} />
          </div>
        </div>
      </div>

      <label className="field-label" htmlFor="bk-who">Notes — optional</label>
      <textarea
        id="bk-who"
        rows={2}
        placeholder="Anything worth flagging — baggage allowance, a name on the reservation…"
        value={state.bkNote}
        onChange={(e) => patch({ bkNote: e.target.value })}
        style={{ marginBottom: 22, width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: 13.5, padding: '11px 13px', borderRadius: 12, border: '1px solid var(--line-strong)', boxSizing: 'border-box' }}
      />

      <button type="button" className="btn-dark" style={{ width: '100%', padding: 15, fontSize: 11.5 }} onClick={submit}>
        Add booking
      </button>
    </div>
  );
}

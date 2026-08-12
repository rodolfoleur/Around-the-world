import { useState } from 'react';
import { SYM, FX } from '../../data/trip.js';
import { PAY_ICONS } from '../../components/icons.jsx';

const CURRENCIES = ['GBP', 'EUR', 'USD', 'MXN'];
const METHODS = ['Cash', 'Debit', 'Credit'];

export default function ExpenseSheet({ trip }) {
  const { state, patch, addExpense, categories, cards, openAddCardSheet } = trip;
  const [tried, setTried] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  const amountNum = parseFloat(state.expAmount);
  const gbpPreview = !Number.isNaN(amountNum) ? (amountNum / FX[state.expCur]) : 0;
  const invalidAmount = tried && Number.isNaN(amountNum);
  const invalidDesc = tried && !state.expDesc.trim();

  const submit = () => {
    setTried(true);
    addExpense();
  };

  return (
    <div style={{ padding: '8px 22px 30px' }}>
      <h3 style={{ fontWeight: 700, letterSpacing: '-.025em', fontSize: 25, margin: '0 0 16px' }}>Add a cost</h3>

      <div className="card" style={{ padding: '16px 18px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="mono" style={{ fontSize: 24, color: 'var(--muted-3)' }}>{SYM[state.expCur]}</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0.00"
            value={state.expAmount}
            onChange={(e) => patch({ expAmount: e.target.value })}
            className="mono"
            style={{
              flex: 1, fontSize: 34, letterSpacing: '-.03em', border: 0, background: 'none', padding: 0,
              outline: invalidAmount ? '2px solid var(--terra)' : 'none',
            }}
          />
          <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>≈ £{gbpPreview.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="hairline" style={{ margin: '12px 0 11px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="text"
            placeholder="What was it for?"
            value={state.expDesc}
            onChange={(e) => patch({ expDesc: e.target.value })}
            style={{ flex: 1, fontSize: 13.5, border: 0, background: 'none', padding: 0, outline: invalidDesc ? '2px solid var(--terra)' : 'none' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {CURRENCIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => patch({ expCur: c })}
            className="mono"
            style={{
              flex: 1, fontSize: 11, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${state.expCur === c ? 'var(--ink)' : 'var(--line-strong)'}`,
              background: state.expCur === c ? 'var(--ink)' : '#fff',
              color: state.expCur === c ? 'var(--bone)' : 'var(--ink)',
            }}
          >{c}</button>
        ))}
      </div>

      <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 9 }}>Category</div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {categories.map((c) => (
          <button key={c} type="button" className={'pill' + (state.expCat === c ? ' on' : '')} onClick={() => patch({ expCat: c })}>{c}</button>
        ))}
        {addingCategory ? (
          <input
            autoFocus
            type="text"
            placeholder="New category…"
            value={state.newCategoryDraft}
            onChange={(e) => patch({ newCategoryDraft: e.target.value, expCat: e.target.value.trim() || state.expCat })}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setAddingCategory(false); }}
            onBlur={() => setAddingCategory(false)}
            style={{ width: 130, padding: '7px 12px', fontSize: 11, borderRadius: 99 }}
          />
        ) : (
          <button type="button" className="pill" onClick={() => setAddingCategory(true)}>+ New</button>
        )}
      </div>

      <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 9 }}>Paid with</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        {METHODS.map((m) => {
          const Icon = PAY_ICONS[m];
          const on = state.payMethod === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => patch({ payMethod: m })}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 6px 12px',
                borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                border: `1px solid ${on ? 'var(--ink)' : 'var(--line-strong)'}`,
                background: on ? 'var(--ink)' : '#fff', color: on ? 'var(--bone)' : 'var(--ink)',
              }}
            >
              <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon /></span>
              <span className="mono" style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase' }}>{m}</span>
            </button>
          );
        })}
      </div>

      {state.payMethod === 'Credit' && (
        <div style={{ padding: '4px 0 0', marginBottom: 18, animation: 'fadeIn .22s ease' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cards.map((c) => {
              const on = state.card === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => patch({ card: c.id })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 13px',
                    borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box',
                    border: `1px solid ${on ? 'var(--terra)' : 'var(--line)'}`,
                    background: on ? '#fff' : 'transparent',
                  }}
                >
                  <span style={{ width: 34, height: 23, borderRadius: 5, background: c.swatch, flex: 'none', position: 'relative', overflow: 'hidden' }}>
                    <span style={{ position: 'absolute', left: 4, top: 8, width: 8, height: 6, borderRadius: 2, background: 'rgba(255,255,255,.55)' }} />
                  </span>
                  <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{c.name}</span>
                    <span className="mono" style={{ display: 'block', fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>{c.meta}</span>
                  </span>
                  <span
                    className="mono"
                    style={{
                      width: 19, height: 19, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
                      border: `1.5px solid ${on ? 'var(--terra)' : '#ddd6c8'}`, background: on ? 'var(--terra)' : 'transparent', color: 'var(--bone)', fontSize: 10,
                    }}
                  >{on ? '✓' : ''}</span>
                </button>
              );
            })}
            <button type="button" className="dash-btn" style={{ width: '100%', padding: 11 }} onClick={openAddCardSheet}>+ Add a card</button>
          </div>
        </div>
      )}

      <button type="button" className="btn-dark" style={{ width: '100%', padding: 15, fontSize: 11.5 }} onClick={submit}>
        Add to tracker
      </button>
    </div>
  );
}

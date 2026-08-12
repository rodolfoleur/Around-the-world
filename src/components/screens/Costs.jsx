import { CAT_COLOR } from '../../data/trip.js';

// Payment methods don't have hand-picked colors like categories do — rotate
// through a small palette keyed by first appearance, so it's at least
// consistent within one trip's breakdown.
const METHOD_PALETTE = ['#c96f3f', '#3f6f8f', '#6b8f5a', '#8a6a9f', '#b08d4f', '#a09889'];

export default function Costs({ trip }) {
  const { rows, total, catMap, methodMap, fmt, openExpenseSheet } = trip;

  const catList = Object.keys(catMap)
    .map((k) => ({ label: k, n: catMap[k], color: CAT_COLOR[k] || '#a09889' }))
    .sort((a, b) => b.n - a.n);
  const maxCat = catList.length ? catList[0].n : 1;
  const currencies = Array.from(new Set(rows.map((r) => r.cur))).sort().join(', ');

  const methodList = Object.keys(methodMap)
    .map((k, i) => ({ label: k, n: methodMap[k], color: METHOD_PALETTE[i % METHOD_PALETTE.length] }))
    .sort((a, b) => b.n - a.n);
  const maxMethod = methodList.length ? methodList[0].n : 1;

  return (
    <div className="pad">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
        <h2 className="h2">Costs</h2>
        <button type="button" className="btn-primary" style={{ padding: '10px 14px', fontSize: 10.5, marginTop: 4 }} onClick={openExpenseSheet}>
          + Add cost
        </button>
      </div>

      <div className="card-dark" style={{ padding: 18, marginBottom: 20 }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 8 }}>
          Grand total, paid so far
        </div>
        <div className="mono" style={{ fontSize: 34, letterSpacing: '-.03em' }}>£{fmt(total)}</div>
        <div className="bar-track" style={{ height: 7, background: '#2e2c28', marginTop: 15 }}>
          {catList.map((c) => (
            <span key={c.label} style={{ background: c.color, width: (c.n / total * 100) + '%' }} />
          ))}
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--muted-2)', marginTop: 10 }}>
          {rows.length} entries · {currencies}
        </div>
      </div>

      <div className="costs-columns">
        <div>
          <h3 className="h3" style={{ marginBottom: 14 }}>By category</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 24 }}>
            {catList.map((c) => (
              <div key={c.label}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 7 }}>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{c.label}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted-3)' }}>{Math.round(c.n / total * 100)}%</span>
                  <span className="mono" style={{ fontSize: 13.5 }}>£{fmt(c.n)}</span>
                </div>
                <div style={{ height: 9, borderRadius: 99, background: 'var(--wash-2)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: c.color, width: Math.round(c.n / maxCat * 100) + '%' }} />
                </div>
              </div>
            ))}
          </div>

          <h3 className="h3" style={{ marginBottom: 14 }}>By payment method</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 24 }}>
            {methodList.map((m) => (
              <div key={m.label}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 7 }}>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{m.label}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted-3)' }}>{Math.round(m.n / total * 100)}%</span>
                  <span className="mono" style={{ fontSize: 13.5 }}>£{fmt(m.n)}</span>
                </div>
                <div style={{ height: 9, borderRadius: 99, background: 'var(--wash-2)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: m.color, width: Math.round(m.n / maxMethod * 100) + '%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="h3" style={{ marginBottom: 12 }}>All entries</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 18 }}>
            {rows.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--wash-2)' }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: CAT_COLOR[r.cat] || '#a09889', flex: 'none' }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500, lineHeight: 1.35 }}>{r.label}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span
                      className="mono"
                      style={{ fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', background: 'var(--wash)', padding: '3px 6px', borderRadius: 5 }}
                    >{r.method}</span>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted-3)' }}>
                      {r.amount === 0 ? 'Included' : {
                        GBP: '£', MXN: 'MX$', USD: 'US$', EUR: '€',
                      }[r.cur] + r.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </span>
                </span>
                <span className="mono" style={{ fontSize: 13, flex: 'none' }}>£{fmt(r.gbpN)}</span>
              </div>
            ))}
          </div>
          <div className="mono" style={{ fontSize: 10, lineHeight: 1.7, color: 'var(--muted-2)' }}>
            FX used: 1 GBP = 23.37 MXN · 1.3465 USD · 1.17 EUR. Converted lines are estimates; card charges may differ.
          </div>
        </div>
      </div>
    </div>
  );
}

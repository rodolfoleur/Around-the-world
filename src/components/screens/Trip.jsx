import { CAT_COLOR, TERRA } from '../../data/trip.js';
import { tripClock, formatRange } from '../../utils/dates.js';
import { getDayParts } from '../../utils/dayParts.js';
import { ChevronLeftIcon } from '../../components/icons.jsx';

export default function Trip({ trip, onBack }) {
  const { meta, days, bookings, go, total, rows, catMap, fmt } = trip;

  const catList = Object.keys(catMap)
    .map((k) => ({ label: k, n: catMap[k], color: CAT_COLOR[k] || '#a09889' }))
    .sort((a, b) => b.n - a.n);

  const currencyCount = new Set(rows.map((r) => r.cur)).size;
  const flagged = bookings.filter((b) => b.detail.note).length;

  const clock = tripClock(days);
  const nextDayIdx = clock.currentIndex >= 0 ? clock.currentIndex : 0;
  const nextDay = days[nextDayIdx];
  const nextParts = getDayParts(nextDay, meta.extraActivities[nextDayIdx]).slice(0, 3);

  const countdownLabel = clock.status === 'live'
    ? 'happening now'
    : clock.status === 'past'
      ? 'wrapped up'
      : `in ${clock.daysUntil}d`;

  const openDays = days.filter((d) => d.tag === 'Empty' || d.tag === 'Open').length;
  const hasLooseEnds = flagged > 0 || openDays > 0;
  const looseEndsText = [
    flagged > 0 ? `${flagged} booking${flagged === 1 ? '' : 's'} flagged for a closer look` : null,
    openDays > 0 ? `${openDays} day${openDays === 1 ? '' : 's'} with nothing planned yet` : null,
  ].filter(Boolean).join(' and ');

  return (
    <div className="pad">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mono"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, border: 0, background: 'none', cursor: 'pointer',
            padding: 0, margin: '2px 0 14px', fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)',
          }}
        >
          <ChevronLeftIcon /> All trips
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 9 }}>
        <h2 style={{ fontWeight: 700, letterSpacing: '-.03em', fontSize: 30, lineHeight: 1.08, textWrap: 'balance' }}>
          {meta.title}
        </h2>
        <span style={{ display: 'flex', flexDirection: 'row-reverse', marginTop: 6 }}>
          {meta.travelers.map((p) => (
            <span
              key={p.name}
              title={p.name}
              style={{
                width: 31, height: 31, borderRadius: 999, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11.5, fontWeight: 600, color: 'var(--bone)',
                border: '2px solid var(--bone)', marginRight: -10, background: p.color,
              }}
            >{p.initial}</span>
          ))}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 8 }}>
        <span className="mono" style={{ fontSize: 21, letterSpacing: '-.02em' }}>{formatRange(meta.startDate, meta.endDate)}</span>
        <span style={{ width: 4, height: 4, borderRadius: 99, background: '#c9c2b4' }} />
        <span className="mono" style={{ fontSize: 16, color: 'var(--muted)' }}>{days.length} days</span>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: 13, color: 'var(--terra)' }}>{countdownLabel}</span>
      </div>
      {meta.route && (
        <div className="mono" style={{ fontSize: 11, letterSpacing: '.06em', color: 'var(--muted-2)', marginBottom: 20 }}>
          {meta.route}
        </div>
      )}
      {!meta.route && <div style={{ marginBottom: 8 }} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, marginBottom: 22 }}>
        <button type="button" className="card-btn" onClick={() => go('budget')} style={{ padding: '15px 15px 14px' }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 9 }}>Paid so far</div>
          <div className="mono" style={{ fontSize: 22, letterSpacing: '-.02em' }}>£{fmt(total)}</div>
          {total > 0 ? (
            <>
              <div className="bar-track" style={{ marginTop: 11, height: 5 }}>
                {catList.map((c) => (
                  <span key={c.label} style={{ background: c.color, width: (c.n / total * 100) + '%' }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 7 }}>across {currencyCount} currenc{currencyCount === 1 ? 'y' : 'ies'}</div>
            </>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 11 }}>Nothing logged yet</div>
          )}
        </button>

        <button type="button" className="card-btn" onClick={() => go('bookings')} style={{ padding: '15px 15px 14px' }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 9 }}>Bookings</div>
          <div className="mono" style={{ fontSize: 22, letterSpacing: '-.02em' }}>{bookings.length} <span style={{ color: '#c9c2b4' }}>filed</span></div>
          {bookings.length > 0 ? (
            <>
              <div style={{ display: 'flex', gap: 3, marginTop: 11 }}>
                {bookings.map((b, i) => (
                  <span key={i} style={{ flex: 1, height: 5, borderRadius: 99, background: b.detail.note ? '#ddd6c8' : TERRA }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 7 }}>{flagged} flagged</div>
            </>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 11 }}>None filed yet</div>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 className="h3">Next up — {nextDay.short}</h3>
        <button
          type="button"
          onClick={() => go('plan')}
          className="mono"
          style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--terra)' }}
        >Full plan →</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
        {nextParts.length === 0 && (
          <button type="button" className="card-btn" style={{ padding: '13px 14px', color: 'var(--muted)' }} onClick={() => go('plan')}>
            Nothing planned yet. Add an activity from the Plan tab.
          </button>
        )}
        {nextParts.map((p) => (
          <button
            key={p.key}
            type="button"
            className="card-btn"
            style={{ display: 'flex', gap: 13, alignItems: 'flex-start', padding: '13px 14px' }}
            onClick={() => trip.patch({ tab: 'plan', day: nextDayIdx })}
          >
            <span className="mono" style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', paddingTop: 3, width: 38, flex: 'none' }}>{p.short}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 3, lineHeight: 1.3 }}>
                {p.items.map((it) => it.text).join(' · ')}
              </span>
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)' }}>{nextDay.label.split('·').pop().trim()}</span>
            </span>
          </button>
        ))}
      </div>

      {hasLooseEnds && (
        <div className="card-dark" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--terra)' }} />
            <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>Loose ends</span>
          </div>
          <div style={{ fontWeight: 600, letterSpacing: '-.01em', fontSize: 16.5, lineHeight: 1.4, marginBottom: 13 }}>
            {meta.curated
              ? 'Aeroméxico baggage allowance is still unconfirmed, Aug 23 with David has no plan, and Aug 30 – Sep 3 in London is empty.'
              : `${looseEndsText.charAt(0).toUpperCase()}${looseEndsText.slice(1)}.`}
          </div>
          <button type="button" className="btn-primary" style={{ padding: '9px 14px', fontSize: 10.5 }} onClick={() => go('plan')}>
            Fill the gaps
          </button>
        </div>
      )}
    </div>
  );
}

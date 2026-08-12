import { CITY_BY_DAY, CITY_COORDS } from '../../data/trip.js';
import { getDayParts } from '../../utils/dayParts.js';
import { useTripWeather } from '../../state/useTripWeather.js';
import { weatherIcon } from '../../lib/weather.js';
import { travelGlyph } from '../../utils/travelGlyph.js';

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** A one-line highlight for the day — up to two of its planned items. */
function daySummary(day, extra) {
  const texts = getDayParts(day, extra).flatMap((p) => p.items.map((it) => it.text));
  if (!texts.length) return '';
  const line = texts.slice(0, 2).join(' · ');
  return line.length > 46 ? line.slice(0, 45) + '…' : line;
}

/** Groups the trip's days into real calendar months, Monday-first, with
 *  blank/muted cells for the rest of each month so the trip sits in context. */
function buildMonths(days) {
  const byYm = new Map();
  days.forEach((d, i) => {
    const ym = d.iso.slice(0, 7);
    if (!byYm.has(ym)) byYm.set(ym, new Map());
    byYm.get(ym).set(Number(d.num), { day: d, index: i });
  });
  return [...byYm.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([ym, byNum]) => {
    const [y, m] = ym.split('-').map(Number);
    const firstDow = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Sunday=0 -> Monday-first index
    const daysInMonth = new Date(y, m, 0).getDate();
    const label = new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    return { key: ym, label, firstDow, daysInMonth, byNum };
  });
}

export default function Calendar({ trip }) {
  const { meta, days, patch } = trip;
  const { forecast, typical } = useTripWeather(meta, days);
  const months = buildMonths(days);

  const openDay = (index) => patch({ tab: 'plan', day: index, sheet: null });

  return (
    <div className="pad-top">
      <div className="pad" style={{ paddingBottom: 14 }}>
        <h2 className="h2" style={{ marginBottom: 4 }}>Calendar</h2>
        <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted-2)' }}>Trip at a glance</div>
      </div>

      <div className="pad" style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {months.map((month) => (
          <div key={month.key}>
            <div style={{ fontWeight: 700, letterSpacing: '-.01em', fontSize: 15.5, marginBottom: 10 }}>{month.label}</div>
            <div className="cal-grid">
              {DOW.map((dw) => <div key={dw} className="mono cal-dow">{dw}</div>)}
              {Array.from({ length: month.firstDow }).map((_, i) => <div key={'b' + i} className="cal-cell blank" />)}
              {Array.from({ length: month.daysInMonth }).map((_, i) => {
                const num = i + 1;
                const entry = month.byNum.get(num);
                if (!entry) {
                  return (
                    <div key={num} className="cal-cell muted">
                      <div className="mono cal-daynum">{num}</div>
                    </div>
                  );
                }
                const { day, index } = entry;
                const wx = forecast[day.iso];
                const typ = !wx ? typical[day.iso] : null;
                const city = day.city || (meta.curated ? CITY_COORDS[CITY_BY_DAY[index]]?.label : '') || '';
                const glyph = travelGlyph(day, meta.bookings);
                const summary = daySummary(day, meta.extraActivities[index]);
                return (
                  <button key={num} type="button" className="cal-cell has-day" onClick={() => openDay(index)}>
                    <div className="mono cal-daynum">
                      {num}
                      {glyph && <span className="cal-glyph">{glyph}</span>}
                    </div>
                    {/* Compact temp-only readout, visible at every width — the
                        richer city/summary block below is wide-screen only,
                        content density (not weather) is what won't fit a
                        7-column grid on a phone. */}
                    {(wx || typ) ? (
                      <div className="mono cal-wx-compact">
                        {wx ? `${weatherIcon(wx.code).icon} ${Math.round(wx.max)}°` : `~${Math.round(typ.avgMax)}°`}
                      </div>
                    ) : (
                      <span className="dot cal-dot" style={{ background: day.transit.length ? 'var(--terra)' : '#ddd6c8' }} />
                    )}
                    <div className="weather-wide-cal">
                      {city && <div className="cal-city">{city}</div>}
                      {summary && <div className="cal-summary">{summary}</div>}
                      {wx && <div className="mono cal-wx">{weatherIcon(wx.code).icon} {Math.round(wx.max)}°</div>}
                      {typ && <div className="mono cal-wx" title="Typical, not a forecast">~{Math.round(typ.avgMax)}°</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

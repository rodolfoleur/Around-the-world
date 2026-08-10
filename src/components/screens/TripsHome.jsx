import { useState } from 'react';
import { tripClock, formatRange } from '../../utils/dates.js';

function TripCard({ trip, onOpen }) {
  const clock = tripClock(trip.days);
  const isPast = clock.status === 'past';
  const eyebrow = clock.status === 'live'
    ? 'Happening now'
    : clock.status === 'past'
      ? 'Completed'
      : `In ${clock.daysUntil}d`;

  return (
    <button
      type="button"
      className={'card-btn trip-card' + (isPast ? ' past' : '')}
      onClick={() => onOpen(trip.id)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <span
          className="mono"
          style={{
            fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase',
            color: clock.status === 'live' ? 'var(--terra)' : 'var(--muted-2)',
          }}
        >{eyebrow}</span>
        <span style={{ display: 'flex', flexDirection: 'row-reverse' }}>
          {trip.travelers.map((p) => (
            <span
              key={p.name}
              title={p.name}
              style={{
                width: 22, height: 22, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 600, color: 'var(--bone)', border: '1.5px solid var(--bone)', marginRight: -8, background: p.color,
              }}
            >{p.initial}</span>
          ))}
        </span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.25, marginBottom: 5, textWrap: 'balance' }}>{trip.title}</div>
      <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
        {formatRange(trip.startDate, trip.endDate)} · {trip.days.length} day{trip.days.length === 1 ? '' : 's'}
      </div>
      {(trip.bookings.length > 0 || trip.route) && (
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--muted-3)', marginTop: 6 }}>
          {trip.route || `${trip.bookings.length} booking${trip.bookings.length === 1 ? '' : 's'} filed`}
        </div>
      )}
    </button>
  );
}

function InviteRow({ household, members, onSignOut }) {
  const [copied, setCopied] = useState(false);
  const others = members.length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(household.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the code is still visible to copy by hand */
    }
  };

  return (
    <div className="card" style={{ padding: '13px 15px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
          {others > 1 ? `${others} people share this household` : 'Just you so far'}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}>
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>Invite code</span>
          <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{household.inviteCode}</span>
        </div>
      </div>
      <button type="button" className="btn-outline" style={{ padding: '9px 12px', fontSize: 10 }} onClick={copy}>
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button type="button" className="mono" style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 10, color: 'var(--muted-3)' }} onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}

export default function TripsHome({ trips, onOpen, onCreate, household, members, onSignOut }) {
  const [showCreate, setShowCreate] = useState(false);
  const [tried, setTried] = useState(false);
  const defaultWho = members.map((m) => m.display_name).join(', ');
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', travelersText: defaultWho });

  const withClock = trips.map((t) => ({ trip: t, clock: tripClock(t.days) }));
  const upcoming = withClock
    .filter((x) => x.clock.status !== 'past')
    .sort((a, b) => a.trip.startDate.localeCompare(b.trip.startDate))
    .map((x) => x.trip);
  const past = withClock
    .filter((x) => x.clock.status === 'past')
    .sort((a, b) => b.trip.startDate.localeCompare(a.trip.startDate))
    .map((x) => x.trip);

  const invalidTitle = tried && !form.title.trim();
  const invalidDates = tried && (!form.startDate || !form.endDate || form.endDate < form.startDate);

  const openCreate = () => {
    setForm({ title: '', startDate: '', endDate: '', travelersText: defaultWho });
    setTried(false);
    setShowCreate(true);
  };

  const submit = async () => {
    setTried(true);
    if (!form.title.trim() || !form.startDate || !form.endDate || form.endDate < form.startDate) return;
    const id = await onCreate(form);
    setShowCreate(false);
    if (id) onOpen(id);
  };

  return (
    <div className="pad" style={{ paddingTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
        <h2 style={{ fontWeight: 700, letterSpacing: '-.03em', fontSize: 30, lineHeight: 1.08 }}>Trips</h2>
        <button type="button" className="btn-primary" style={{ padding: '10px 14px', fontSize: 10.5, marginTop: 4, flex: 'none' }} onClick={openCreate}>
          + New trip
        </button>
      </div>
      <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted-2)', marginBottom: 20 }}>
        {trips.length} trip{trips.length === 1 ? '' : 's'} · {upcoming.length} upcoming
      </div>

      {household && <InviteRow household={household} members={members} onSignOut={onSignOut} />}

      <h3 className="h3" style={{ marginBottom: 12 }}>Upcoming</h3>
      {upcoming.length === 0 ? (
        <button
          type="button"
          className="dash-btn"
          style={{ width: '100%', boxSizing: 'border-box', padding: '20px 16px', marginBottom: 28, fontSize: 11.5 }}
          onClick={openCreate}
        >
          + Plan your next trip
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {upcoming.map((t) => <TripCard key={t.id} trip={t} onOpen={onOpen} />)}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h3 className="h3" style={{ marginBottom: 12 }}>Past</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            {past.map((t) => <TripCard key={t.id} trip={t} onOpen={onOpen} />)}
          </div>
        </>
      )}

      {showCreate && (
        <>
          <button type="button" className="sheet-scrim" onClick={() => setShowCreate(false)} aria-label="Close" />
          <div className="sheet-panel" role="dialog" aria-modal="true">
            <div className="sheet-grabber"><span /></div>
            <div style={{ padding: '8px 22px 30px' }}>
              <h3 style={{ fontWeight: 700, letterSpacing: '-.025em', fontSize: 25, margin: '0 0 16px' }}>New trip</h3>

              <label className="field-label" htmlFor="trip-title">Where to</label>
              <input
                id="trip-title"
                type="text"
                placeholder="Ski week, Lisbon in spring…"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                style={{ marginBottom: 16, outline: invalidTitle ? '2px solid var(--terra)' : undefined }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <label className="field-label" htmlFor="trip-start">Starts</label>
                  <input
                    id="trip-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    style={{ outline: invalidDates ? '2px solid var(--terra)' : undefined }}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="trip-end">Ends</label>
                  <input
                    id="trip-end"
                    type="date"
                    value={form.endDate}
                    min={form.startDate || undefined}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    style={{ outline: invalidDates ? '2px solid var(--terra)' : undefined }}
                  />
                </div>
              </div>
              {invalidDates && (
                <div style={{ fontSize: 12, color: 'var(--terra)', marginTop: -10, marginBottom: 16 }}>
                  Pick a start and end date, with the end on or after the start.
                </div>
              )}

              <label className="field-label" htmlFor="trip-who">Who&rsquo;s going — optional</label>
              <input
                id="trip-who"
                type="text"
                placeholder="You, Kirsten"
                value={form.travelersText}
                onChange={(e) => setForm((f) => ({ ...f, travelersText: e.target.value }))}
                style={{ marginBottom: 20 }}
              />

              <div style={{ display: 'flex', gap: 9 }}>
                <button type="button" className="btn-outline" style={{ flex: 'none', width: 96, padding: '15px 0', fontSize: 11 }} onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" style={{ flex: 1, padding: 15, fontSize: 11.5, borderRadius: 14 }} onClick={submit}>
                  Create trip
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

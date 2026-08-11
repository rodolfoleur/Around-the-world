import { useTripState } from '../state/useTripState.js';
import { TAB_ICONS, ChevronLeftIcon } from './icons.jsx';
import Trip from './screens/Trip.jsx';
import Plan from './screens/Plan.jsx';
import Journey from './screens/Journey.jsx';
import Costs from './screens/Costs.jsx';
import Bookings from './screens/Bookings.jsx';
import ExpenseSheet from './sheets/ExpenseSheet.jsx';
import AddActivitySheet from './sheets/AddActivitySheet.jsx';
import BookingSheet from './sheets/BookingSheet.jsx';

const TABS = [
  ['home', 'Trip'],
  ['plan', 'Plan'],
  ['map', 'Journey'],
  ['budget', 'Costs'],
  ['bookings', 'Bookings'],
];

/** The full single-trip experience — tab bar, screens and sheets — for one trip descriptor. */
export default function TripView({ meta, onBack, onUpdateTrip }) {
  const trip = useTripState(meta, onUpdateTrip);
  const { state, go, closeSheet } = trip;

  return (
    <>
      <div className="app-screen">
        {state.tab === 'home' && <Trip trip={trip} onBack={onBack} />}
        {state.tab === 'plan' && <Plan trip={trip} />}
        {state.tab === 'map' && <Journey trip={trip} />}
        {state.tab === 'budget' && <Costs trip={trip} />}
        {state.tab === 'bookings' && <Bookings trip={trip} />}
      </div>

      <nav className="tabbar" aria-label="Primary">
        {onBack && (
          <button type="button" className="sidebar-back" onClick={onBack}>
            <ChevronLeftIcon /> All trips
          </button>
        )}
        {TABS.map(([key, label]) => {
          const Icon = TAB_ICONS[key];
          const active = state.tab === key;
          return (
            <button
              key={key}
              type="button"
              className="tab-btn"
              onClick={() => go(key)}
              style={{ color: active ? 'var(--ink)' : '#b3aa9a' }}
              aria-current={active ? 'page' : undefined}
            >
              <span className="ic"><Icon /></span>
              <span className="lb">{label}</span>
            </button>
          );
        })}
      </nav>

      {state.sheet && (
        <>
          <button type="button" className="sheet-scrim" onClick={closeSheet} aria-label="Close" />
          <div className="sheet-panel" role="dialog" aria-modal="true">
            <div className="sheet-grabber"><span /></div>
            {state.sheet === 'expense' && <ExpenseSheet trip={trip} />}
            {state.sheet === 'addstop' && <AddActivitySheet trip={trip} />}
            {state.sheet === 'booking' && <BookingSheet trip={trip} />}
          </div>
        </>
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import AuthGate from './components/AuthGate.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { useTripsStore } from './state/useTripsStore.js';
import TripsHome from './components/screens/TripsHome.jsx';
import TripView from './components/TripView.jsx';

const LAST_OPEN_KEY = 'voyager-last-open-trip';

/** Mounted once auth + household are ready — owns the live trips list for that household. */
function HouseholdApp({ auth }) {
  const { trips, loading, createTrip, updateTrip, deleteTrip, saveError, clearSaveError, joinTrip } = useTripsStore(auth.household.householdId, auth.user.id);
  const [activeTripId, setActiveTripId] = useState(() => {
    try { return window.localStorage.getItem(LAST_OPEN_KEY); } catch { return null; }
  });

  useEffect(() => {
    try {
      if (activeTripId) window.localStorage.setItem(LAST_OPEN_KEY, activeTripId);
      else window.localStorage.removeItem(LAST_OPEN_KEY);
    } catch { /* storage unavailable */ }
  }, [activeTripId]);

  const errorBanner = saveError && (
    <div
      className="mono"
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 11.5,
        background: 'rgba(201,111,63,.15)', color: 'var(--terra)',
      }}
    >
      <span style={{ flex: 1 }}>Couldn’t save that change: {saveError}</span>
      <button type="button" onClick={clearSaveError} aria-label="Dismiss" style={{ border: 0, background: 'none', cursor: 'pointer', color: 'inherit', fontSize: 14, padding: 0 }}>×</button>
    </div>
  );

  if (loading) return <div className="app-screen" />;

  const meta = activeTripId ? trips.find((t) => t.id === activeTripId) : null;

  // Only navigates back to the trips list once the delete actually
  // succeeded — a permission failure (a shared collaborator trying to
  // delete a trip they don't own) leaves you right where you were, with
  // the real reason surfaced inline instead of silently bouncing you out.
  const handleDeleteTrip = async () => {
    const res = await deleteTrip(meta.id);
    if (res.ok) setActiveTripId(null);
    return res;
  };

  if (meta) {
    return (
      <>
        {errorBanner}
        <ErrorBoundary key={meta.id} onBack={() => setActiveTripId(null)} backLabel="Back to trips">
          <TripView
            key={meta.id}
            meta={meta}
            onBack={() => setActiveTripId(null)}
            onUpdateTrip={(patch) => updateTrip(meta.id, patch)}
            onDeleteTrip={handleDeleteTrip}
            members={auth.members}
            trips={trips}
          />
        </ErrorBoundary>
      </>
    );
  }

  return (
    <div className="app-screen">
      {errorBanner}
      <TripsHome
        trips={trips}
        onOpen={setActiveTripId}
        onCreate={createTrip}
        members={auth.members}
        onSignOut={auth.signOut}
        onJoinTrip={joinTrip}
        visitedCountries={auth.visitedCountries}
        onSetVisitedCountries={auth.setVisitedCountries}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <div className="app-page">
        <div className="app-frame">
          <AuthGate>{(auth) => <HouseholdApp auth={auth} />}</AuthGate>
        </div>
      </div>
    </ErrorBoundary>
  );
}

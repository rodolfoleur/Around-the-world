import { useEffect, useState } from 'react';
import AuthGate from './components/AuthGate.jsx';
import { useTripsStore } from './state/useTripsStore.js';
import TripsHome from './components/screens/TripsHome.jsx';
import TripView from './components/TripView.jsx';

const LAST_OPEN_KEY = 'voyager-last-open-trip';

/** Mounted once auth + household are ready — owns the live trips list for that household. */
function HouseholdApp({ auth }) {
  const { trips, loading, createTrip, updateTrip } = useTripsStore(auth.household.householdId, auth.user.id);
  const [activeTripId, setActiveTripId] = useState(() => {
    try { return window.localStorage.getItem(LAST_OPEN_KEY); } catch { return null; }
  });

  useEffect(() => {
    try {
      if (activeTripId) window.localStorage.setItem(LAST_OPEN_KEY, activeTripId);
      else window.localStorage.removeItem(LAST_OPEN_KEY);
    } catch { /* storage unavailable */ }
  }, [activeTripId]);

  if (loading) return <div className="app-screen" />;

  const meta = activeTripId ? trips.find((t) => t.id === activeTripId) : null;

  if (meta) {
    return (
      <TripView
        key={meta.id}
        meta={meta}
        onBack={() => setActiveTripId(null)}
        onUpdateTrip={(patch) => updateTrip(meta.id, patch)}
      />
    );
  }

  return (
    <div className="app-screen">
      <TripsHome
        trips={trips}
        onOpen={setActiveTripId}
        onCreate={createTrip}
        household={auth.household}
        members={auth.members}
        onSignOut={auth.signOut}
      />
    </div>
  );
}

export default function App() {
  return (
    <div className="app-page">
      <div className="app-frame">
        <AuthGate>{(auth) => <HouseholdApp auth={auth} />}</AuthGate>
      </div>
    </div>
  );
}

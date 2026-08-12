import { useRef, useState } from 'react';
import { CITY_BY_DAY, CITY_COORDS } from '../../data/trip.js';
import { supabase } from '../../lib/supabaseClient.js';

// Deterministic per-location gradient (same name always gets the same one)
// — the default look for any location without a real photo set. Reuses
// the app's existing accent palette so it still feels designed, not random.
const GRADIENTS = [
  'linear-gradient(135deg,#c96f3f,#8f4826)',
  'linear-gradient(135deg,#3f6f8f,#1f3a4d)',
  'linear-gradient(135deg,#6b8f5a,#3a4f2f)',
  'linear-gradient(135deg,#8a6a9f,#4a3659)',
  'linear-gradient(135deg,#b08d4f,#6b5330)',
];
function gradientFor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

/** The trip's stops in order, deduped so consecutive days in the same
 * place collapse into one card — this is "the order of the trip," not a
 * day-by-day list. Works for a curated trip (city comes from CITY_BY_DAY)
 * or any trip where days have their City field filled in. */
export function deriveStops(days, meta) {
  const stops = [];
  days.forEach((d, i) => {
    const name = d.city || (meta.curated ? CITY_COORDS[CITY_BY_DAY[i]]?.label : '') || '';
    if (!name) return;
    if (stops.length && stops[stops.length - 1].name === name) return;
    stops.push({ name, dayIndex: i });
  });
  return stops;
}

function PhotoEditor({ name, current, onSet, onClear, onClose }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const applyUrl = () => {
    if (!url.trim()) return;
    onSet(url.trim());
    onClose();
  };

  const upload = async (file) => {
    if (!file || !supabase) return;
    setBusy(true);
    setError('');
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('trip-photos').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('trip-photos').getPublicUrl(path);
      onSet(data.publicUrl);
      onClose();
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ padding: 14, marginTop: 8 }}>
      <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 10 }}>
        Photo for {name}
      </div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Paste an image URL…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') applyUrl(); }}
          style={{ flex: 1 }}
        />
        <button type="button" className="btn-dark" style={{ padding: '0 14px', fontSize: 10.5, flex: 'none' }} onClick={applyUrl}>Use</button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => upload(e.target.files?.[0])}
      />
      <div style={{ display: 'flex', gap: 7 }}>
        <button type="button" className="btn-outline" style={{ flex: 1, padding: 10, fontSize: 10.5 }} onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? 'Uploading…' : 'Upload a photo'}
        </button>
        {current && (
          <button type="button" className="btn-outline" style={{ flex: 'none', padding: '0 14px', fontSize: 10.5, color: 'var(--terra)' }} onClick={() => { onClear(); onClose(); }}>
            Remove
          </button>
        )}
      </div>
      {error && <div style={{ fontSize: 11.5, color: 'var(--terra)', marginTop: 8 }}>{error}</div>}
      <button type="button" onClick={onClose} className="mono" style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 10.5, color: 'var(--muted-3)', marginTop: 10, padding: 0 }}>
        Cancel
      </button>
    </div>
  );
}

function LocationCard({ stop, order, photoUrl, onSet, onClear, onOpenDay }) {
  const [editing, setEditing] = useState(false);
  const [broken, setBroken] = useState(false);
  const showPhoto = photoUrl && !broken;

  return (
    <div style={{ flex: '1 1 0', minWidth: 132 }}>
      <button
        type="button"
        onClick={() => onOpenDay(stop.dayIndex)}
        style={{
          width: '100%', height: 118, borderRadius: 16, border: 0, cursor: 'pointer', position: 'relative',
          overflow: 'hidden', padding: 0, background: showPhoto ? '#000' : gradientFor(stop.name),
        }}
      >
        {showPhoto && (
          <img
            src={photoUrl}
            alt={stop.name}
            onError={() => setBroken(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.72 }}
          />
        )}
        <span style={{ position: 'absolute', top: 10, left: 10, width: 22, height: 22, borderRadius: 99, background: 'rgba(0,0,0,.38)', color: '#fff', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="mono">
          {order}
        </span>
        <span style={{ position: 'absolute', bottom: 10, left: 12, right: 12, color: '#fff', fontSize: 15.5, fontWeight: 700, letterSpacing: '-.01em', textAlign: 'left', textShadow: '0 1px 6px rgba(0,0,0,.5)' }}>
          {stop.name}
        </span>
      </button>
      <button
        type="button"
        onClick={() => setEditing((v) => !v)}
        className="mono"
        style={{ border: 0, background: 'none', cursor: 'pointer', padding: '6px 0 0', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted-3)' }}
      >
        {editing ? 'Close' : 'Change photo'}
      </button>
      {editing && (
        <PhotoEditor
          name={stop.name}
          current={photoUrl}
          onSet={(url) => onSet(stop.name, url)}
          onClear={() => onClear(stop.name)}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

/** The dashboard's "where this trip goes, in order" strip — bigger and
 * clearer than a one-line route string, with an optional photo per stop
 * (a tasteful gradient by default; paste a URL or upload your own). */
export default function LocationStrip({ trip }) {
  const { meta, days, photos, setPhoto, clearPhoto, patch } = trip;
  const stops = deriveStops(days, meta);

  if (stops.length === 0) {
    return meta.route ? (
      <div className="mono" style={{ fontSize: 11, letterSpacing: '.06em', color: 'var(--muted-2)', marginBottom: 20 }}>{meta.route}</div>
    ) : null;
  }

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
      {stops.map((s, i) => (
        <LocationCard
          key={s.name + i}
          stop={s}
          order={i + 1}
          photoUrl={photos[s.name]}
          onSet={setPhoto}
          onClear={clearPhoto}
          onOpenDay={(dayIndex) => patch({ tab: 'plan', day: dayIndex })}
        />
      ))}
    </div>
  );
}

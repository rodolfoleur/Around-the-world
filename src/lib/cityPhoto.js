// Automatic "one picture of that city" lookup, so a location card never
// has to start blank/gradient-only unless nothing could be found. Uses
// Wikipedia's public REST summary API — free, no key, and CORS-enabled
// for exactly this kind of client-side use (same pattern as the app's
// direct-from-browser weather lookups). Never throws; a bad/ambiguous
// name or a network hiccup just resolves to null so the caller falls
// back to the gradient placeholder instead of breaking anything.

const REST_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary/';

/** Wikipedia's thumbnail URLs are sized like ".../320px-Name.jpg" — bump
 * that up for a card-sized image instead of a postage stamp. */
function upscale(url, width = 800) {
  return url.replace(/\/\d+px-/, `/${width}px-`);
}

export async function fetchCityPhoto(name) {
  const q = (name || '').trim();
  if (!q) return null;
  try {
    const res = await fetch(REST_SUMMARY + encodeURIComponent(q));
    if (!res.ok) return null;
    const data = await res.json();
    if (data.type === 'disambiguation') return null;
    if (data.thumbnail?.source) return upscale(data.thumbnail.source);
    return data.originalimage?.source || null;
  } catch {
    return null;
  }
}

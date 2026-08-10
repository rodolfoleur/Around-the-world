import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Missing env vars shouldn't crash the whole app at import time — the
// AuthGate checks `configured` and shows a clear setup message instead.
export const configured = Boolean(url && anonKey);

export const supabase = configured
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

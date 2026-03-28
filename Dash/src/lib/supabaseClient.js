import { createClient } from '@supabase/supabase-js';

let _defaultClient = null;

export function createSupabaseClient(url, key) {
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export function getDefaultClient() {
  if (_defaultClient) return _defaultClient;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  _defaultClient = createSupabaseClient(url, key);
  return _defaultClient;
}

export function hasDefaultCredentials() {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

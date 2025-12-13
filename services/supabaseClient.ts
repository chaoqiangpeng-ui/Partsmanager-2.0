import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_KEY;

// Check if credentials exist but don't crash if they don't.
// If missing, we create a dummy client so the app can still render (and will just fail gracefully on network requests).
const url = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co';
const key = supabaseKey || 'placeholder-key';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing or invalid. Database features will fallback to mock data or fail gracefully.');
}

export const supabase = createClient(url, key);
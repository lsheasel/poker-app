import { createClient } from '@supabase/supabase-js';

// Team project client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Players project client
const playersSupabaseUrl = import.meta.env.VITE_PLAYERS_SUPABASE_URL.replace(/\/$/, '');
const playersSupabaseAnonKey = import.meta.env.VITE_PLAYERS_SUPABASE_ANON_KEY;

// Create clients
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const playersSupabase = createClient(playersSupabaseUrl, playersSupabaseAnonKey);

// Log configuration for debugging
console.log('Players Supabase URL:', playersSupabaseUrl);

// Synchronize auth state between clients
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    playersSupabase.auth.setSession(session);
  }
});

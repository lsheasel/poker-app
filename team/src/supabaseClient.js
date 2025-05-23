import { createClient } from '@supabase/supabase-js';

// Team project client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Players project client
const playersSupabaseUrl = import.meta.env.VITE_PLAYERS_SUPABASE_URL;
const playersSupabaseAnonKey = import.meta.env.VITE_PLAYERS_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const playersSupabase = createClient(playersSupabaseUrl, playersSupabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Function to get authenticated users with metadata
export const fetchAuthUsers = async () => {
  try {
    // Get auth session from main project
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    if (!session) {
      console.log('No active session - User not logged in');
      return [];
    }

    console.log('Current user ID:', session.user.id);
    console.log('Current user email:', session.user.email);

    // Set the auth header for the players client
    playersSupabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    });

    // Fetch profiles with all metadata
    const { data, error } = await playersSupabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }

    console.log('Raw profiles data:', data);

    if (!data || data.length === 0) {
      console.log('No profiles found - Database query returned empty');
      return [];
    }

    // Return complete profile data including raw_user_meta_data
    const users = data.map(profile => ({
      id: profile.id,
      email: profile.email,
      username: profile.raw_user_meta_data?.first_name || profile.email?.split('@')[0],
      created_at: profile.created_at,
      raw_user_meta_data: profile.raw_user_meta_data || {}  // Include all metadata
    }));

    console.log('Final transformed users:', users);
    return users;

  } catch (error) {
    console.error('Detailed error in fetchAuthUsers:', error);
    throw error;
  }
};

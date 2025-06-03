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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    if (!session) {
      console.log('No active session - User not logged in');
      return [];
    }

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

    if (!data || data.length === 0) {
      console.log('No profiles found');
      return [];
    }

    // Map the data including avatar_url from metadata
    const users = data.map(profile => ({
      id: profile.id,
      email: profile.email,
      username: profile.raw_user_meta_data?.username || profile.email?.split('@')[0],
      avatar_url: profile.raw_user_meta_data?.avatar_url, // Get avatar_url from metadata
      created_at: profile.created_at,
      raw_user_meta_data: profile.raw_user_meta_data || {}
    }));

    return users;
  } catch (error) {
    console.error('Detailed error in fetchAuthUsers:', error);
    throw error;
  }
};

// Function to check if user is admin
export const checkIsAdmin = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    // Check team_members table for admin role
    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return data?.role === 'Admin';
  } catch (error) {
    console.error('Error in checkIsAdmin:', error);
    return false;
  }
};

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { playersSupabase } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';

const Players = () => {
  const { session } = UserAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session) {
      // Set auth header for players supabase
      playersSupabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
      
      fetchPlayers();
      const cleanup = setupRealtimeSubscription();
      return () => cleanup();
    }
  }, [session]);

  const setupRealtimeSubscription = () => {
    const channel = playersSupabase
      .channel('players_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'players' 
        }, 
        (payload) => {
          console.log('Realtime update received:', payload);
          if (payload.eventType === 'UPDATE') {
            setPlayers(currentPlayers => 
              currentPlayers.map(player => 
                player.id === payload.new.id ? { ...player, ...payload.new } : player
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      playersSupabase.removeChannel(channel);
    };
  };

  const fetchPlayers = async () => {
    try {
      setError(null);
      const { data, error } = await playersSupabase
        .from('players')
        .select('*');

      if (error) {
        console.error('Error details:', error);
        throw error;
      }

      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-500/20 text-red-200 p-4 rounded-lg">
          Error loading players: {error}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-6">
        Players
      </h2>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-gray-700/50 
                        shadow-lg hover:shadow-purple-500/20 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {player.nickname?.[0]?.toUpperCase() || 'P'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-200">
                    {player.nickname || 'Anonymous Player'}
                  </h3>
                  <p className="text-sm text-gray-400">Chips: {player.chips || 0}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <div className="text-sm text-gray-400">
                  <p>Games Played: {player.games_played || 0}</p>
                  <p>Win Rate: {player.win_rate || '0%'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {players.length === 0 && !loading && (
        <div className="text-center text-gray-400 py-12">
          No players found.
        </div>
      )}
    </motion.div>
  );
};

export default Players;
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playersSupabase, fetchAuthUsers } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';

const MetaDataDialog = ({ isOpen, onClose, playerData }) => {
  if (!isOpen) return null;

  const formatValue = (value) => {
    if (Array.isArray(value)) {
      return value.length ? value.join(', ') : 'None';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === null || value === undefined) {
      return 'N/A';
    }
    return value.toString();
  };

  const sections = {
    profile: ['first_name', 'email', 'avatar_url'],
    stats: ['level', 'xp', 'coins', 'winRate', 'gamesPlayed'],
    settings: ['card_skin'],
    verification: ['email_verified', 'phone_verified'],
    other: ['sub', 'badges']
  };

  const getIcon = (section) => {
    switch(section) {
      case 'profile': return '👤';
      case 'stats': return '📊';
      case 'settings': return '⚙️';
      case 'verification': return '✓';
      case 'other': return '📎';
      default: return '•';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full border border-gray-700 shadow-xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-800 pb-4 border-b border-gray-700">
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            Player Profile
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(sections).map(([section, fields]) => (
            <div key={section} className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <span>{getIcon(section)}</span>
                <span className="capitalize">{section}</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                {fields.map((key) => (
                  <div key={key} className="bg-gray-700/30 p-3 rounded-lg">
                    <span className="text-gray-400 text-sm capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <div className="text-gray-200 font-medium">
                      {formatValue(playerData.raw_user_meta_data?.[key])}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const Players = () => {
  const { session } = UserAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    if (session) {
      fetchPlayers();
    }
  }, [session]);

  const fetchPlayers = async () => {
    try {
      setError(null);
      console.log('Fetching users...'); // Debug log 1
      const users = await fetchAuthUsers();
      console.log('Received users:', users); // Debug log 2
      
      if (!users || users.length === 0) {
        console.log('No users received'); // Debug log 3
      }
      
      setPlayers(users);
    } catch (error) {
      console.error('Error fetching players:', error);
      setError(error.message || 'Failed to fetch players');
    } finally {
      setLoading(false);
    }
  };

  // Add debug log for render
  useEffect(() => {
    console.log('Current players state:', players); // Debug log 4
  }, [players]);

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
              onClick={() => setSelectedPlayer(player)}
              className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-gray-700/50 
                        shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer
                        hover:bg-gray-700/50"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {player.username?.[0]?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-200">
                    {player.username}
                  </h3>
                  <p className="text-sm text-gray-400">{player.email}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <div className="text-sm text-gray-400">
                  <p>Level: {player.raw_user_meta_data?.level || 'N/A'}</p>
                  <p>XP: {player.raw_user_meta_data?.xp || '0'}</p>
                  <p>Joined: {new Date(player.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        <MetaDataDialog
          isOpen={selectedPlayer !== null}
          onClose={() => setSelectedPlayer(null)}
          playerData={selectedPlayer || {}}
        />
      </AnimatePresence>

      {players.length === 0 && !loading && (
        <div className="text-center text-gray-400 py-12">
          No players found.
        </div>
      )}
    </motion.div>
  );
};

export default Players;
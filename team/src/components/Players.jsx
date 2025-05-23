import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playersSupabase, fetchAuthUsers } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';
import MetaDataDialog from './MetaDataDialog';
import Avatar from './Avatar'; // Importiere die Avatar-Komponente

// PlayerCard Komponente für bessere Übersichtlichkeit
const PlayerCard = ({ player, onClick }) => (
  <div
    onClick={onClick}
    className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-gray-700/50 
              shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer
              hover:bg-gray-700/50"
  >
    <div className="flex items-center gap-4">
      <Avatar 
        url={player.avatar_url}
        size={48}
        level={player.raw_user_meta_data?.level}
        source="players"
      />
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-200">
          {player.raw_user_meta_data?.first_name || player.email?.split('@')[0]}
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
);

// LoadingSpinner Komponente
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
  </div>
);

const Players = () => {
  const { session } = UserAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (session) fetchPlayers();
  }, [session]);

  const fetchPlayers = async () => {
    try {
      setError(null);
      const users = await fetchAuthUsers();
      setPlayers(users || []);
    } catch (error) {
      console.error('Error fetching players:', error);
      setError(error.message || 'Failed to fetch players');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setIsDialogOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 
                 scrollbar-track-gray-700/30 scrollbar-thumb-rounded-full"
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text 
                     bg-gradient-to-r from-blue-400 to-purple-600 mb-6">
          Players
        </h2>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onClick={() => handlePlayerClick(player)}
              />
            ))}
          </div>
        )}

        <AnimatePresence>
          {isDialogOpen && selectedPlayer && (
            <MetaDataDialog
              isOpen={isDialogOpen}
              onClose={() => {
                setIsDialogOpen(false);
                setSelectedPlayer(null);
              }}
              playerData={selectedPlayer}
            />
          )}
        </AnimatePresence>

        {players.length === 0 && !loading && (
          <div className="text-center text-gray-400 py-12">
            No players found.
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Players;
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { 
  faHome, 
  faUsers, 
  faFolderOpen, 
  faCog, 
  faGamepad, 
  faTrophy 
} from '@fortawesome/free-solid-svg-icons';
import { UserAuth } from '../context/AuthContext';
import Settings from './Settings';
import Players from './Players';
import { supabase, playersSupabase, checkIsAdmin } from '../supabaseClient';
import MetaDataDialog from './MetaDataDialog';

const Dashboard = () => {
  const [stats, setStats] = useState({
    activePlayers: 0,
    activeGames: 0,
    tournaments: 0,
    totalCoins: 0,
    averageLevel: 0,
    topPlayer: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get all profiles
        const { data: profiles } = await playersSupabase
          .from('profiles')
          .select('*');

        if (profiles) {
          // Calculate statistics
          const totalCoins = profiles.reduce((sum, player) => 
            sum + (player.raw_user_meta_data?.coins || 0), 0);
          
          const levels = profiles.map(p => p.raw_user_meta_data?.level || 0);
          const averageLevel = Math.round(
            levels.reduce((a, b) => a + b, 0) / profiles.length
          );

          // Find top player by XP
          const topPlayer = profiles.reduce((top, player) => 
            (player.raw_user_meta_data?.xp || 0) > (top?.raw_user_meta_data?.xp || 0) 
              ? player 
              : top
          );

          setStats({
            activePlayers: profiles.length,
            activeGames: Math.floor(profiles.length / 4),
            tournaments: 2,
            totalCoins,
            averageLevel,
            topPlayer
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-6">
        Welcome Back!
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-gray-700/50 shadow-lg hover:shadow-blue-500/20 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-200">Registered Players</h3>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                {stats.activePlayers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-gray-700/50 shadow-lg hover:shadow-purple-500/20 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <FontAwesomeIcon icon={faGamepad} className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-200">Average Level</h3>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                {stats.averageLevel}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-gray-700/50 shadow-lg hover:shadow-green-500/20 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <FontAwesomeIcon icon={faTrophy} className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-200">Total Coins</h3>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                {stats.totalCoins.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Player Card */}
      {stats.topPlayer && (
        <div className="mt-8 bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-gray-700/50">
          <h3 className="text-xl font-semibold text-gray-200 mb-4">Top Player</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {stats.topPlayer.raw_user_meta_data?.first_name?.[0] || stats.topPlayer.email?.[0]}
              </span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-200">
                {stats.topPlayer.raw_user_meta_data?.first_name || stats.topPlayer.email.split('@')[0]}
              </h4>
              <p className="text-sm text-gray-400">Level {stats.topPlayer.raw_user_meta_data?.level || 0}</p>
              <p className="text-sm text-gray-400">XP: {stats.topPlayer.raw_user_meta_data?.xp?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();

    // Set up real-time channel subscription
    const channel = supabase
      .channel('team_members_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'team_members' 
        }, 
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setUsers(currentUsers => 
              currentUsers.map(user => 
                user.id === payload.new.id ? { ...user, ...payload.new } : user
              )
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*');

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-6">
        Team Members
      </h2>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-gray-700/50 
                        shadow-lg hover:shadow-purple-500/20 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  {/* Avatar placeholder or user avatar if available */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-200">
                    {user.username || 'Anonymous User'}
                  </h3>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <div className="text-sm text-gray-400">
                  <p>Role: {user.role || 'Member'}</p>
                  <p>Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {users.length === 0 && !loading && (
        <div className="text-center text-gray-400 py-12">
          No team members found.
        </div>
      )}
    </motion.div>
  );
};

const TeamPanel = () => {
  const { signOut, session } = UserAuth();
  const navigate = useNavigate();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const adminStatus = await checkIsAdmin();
        setIsAdmin(adminStatus);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Set session for players client in a more direct way
        const { access_token, refresh_token } = session;
        
        await playersSupabase.auth.setSession({
          access_token,
          refresh_token,
          expires_in: session.expires_in // Make sure to include expiry
        });

      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    
    if (session) {
      checkAdmin();
    }
  }, [session]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/panel/dashboard', icon: faHome },
    { name: 'Team', path: '/panel/team', icon: faUsers },
    { name: 'Players', path: '/panel/players', icon: faGamepad },
    { name: 'Settings', path: '/panel/settings', icon: faCog },
  ];

  const suitSymbols = ["♠", "♥", "♦", "♣"];

  const FloatingSymbols = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array(20).fill().map((_, index) => {
          const randomSymbol = suitSymbols[Math.floor(Math.random() * suitSymbols.length)];
          const size = Math.random() * 40 + 20;
          const xPos = Math.random() * 100;
          const yPos = Math.random() * 100;
          const duration = Math.random() * 20 + 10;
          const delay = Math.random() * 5;
          const opacity = Math.random() * 0.15 + 0.05;
          return (
            <motion.div
              key={index}
              className="absolute text-white select-none"
              initial={{ x: `${xPos}vw`, y: `${yPos}vh`, opacity: 0, scale: 0.5 }}
              animate={{ y: [`${yPos}vh`, `${yPos - 30}vh`], rotate: [0, 360], opacity: [0, opacity, opacity, 0], scale: [0.5, 1, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: duration, delay: delay, ease: "easeInOut", times: [0, 0.2, 0.8, 1] }}
              style={{ fontSize: `${size}px` }}
            >
              {randomSymbol}
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-x-hidden">
      <FloatingSymbols />
      {/* Fixed background card table texture */}
      <div
        className="absolute inset-0 bg-green-900 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'url("/poker-felt-texture.jpg")', backgroundSize: 'cover' }}
      ></div>
      {/* Top glow */}
      <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-3/4 h-64 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>

      {/* Main Content */}
      <div className="flex w-full">
        {/* Fixed Sidebar */}
        <div className="fixed top-0 left-0 w-64 h-screen bg-gray-800 bg-opacity-80 backdrop-blur-lg text-white shadow-lg border-r border-gray-700">
          <div className="p-6 flex items-center justify-between border-b border-gray-700">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              Team Panel
            </h2>
          </div>
          <nav className="flex-1 mt-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center gap-3 py-3 px-6 hover:bg-gray-700/50 transition-all text-gray-300 hover:text-white group"
              >
                <div className="w-5">
                  <FontAwesomeIcon 
                    icon={item.icon} 
                    className="group-hover:scale-110 transition-transform" 
                  />
                </div>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="p-6 border-t border-gray-700">
            <p className="text-sm mb-2 text-gray-300">Logged in as: {session?.user?.email}</p>
            <button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white py-2 rounded-lg hover:shadow-lg transition-colors"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Main Content Area with left margin to account for fixed sidebar */}
        <div className="flex-1 ml-64">
          <div className="flex-1 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700"
            >
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/team" element={<Team />} />
                <Route 
                  path="/players" 
                  element={<Players onSelectPlayer={setSelectedPlayer} />} 
                />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Player Profile Dialog */}
      <AnimatePresence>
        <MetaDataDialog
          isOpen={selectedPlayer !== null}
          onClose={() => setSelectedPlayer(null)}
          playerData={selectedPlayer || {}}
          isAdmin={isAdmin}
          onSelectPlayer={setSelectedPlayer}
        />
      </AnimatePresence>
    </div>
  );
};

export default TeamPanel;
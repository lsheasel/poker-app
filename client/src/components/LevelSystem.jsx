import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import {
  faStar,
  faTrophy,
  faCoins,
  faShieldAlt,
  faGift,
} from '@fortawesome/free-solid-svg-icons';

const LevelSystem = () => {
  const [level, setLevel] = useState(0);
  const [xp, setXp] = useState(0);
  const [badges, setBadges] = useState([]);
  const [xpHistory, setXpHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState({ open: false, message: "", type: "info" });
  const navigate = useNavigate();
  const suitSymbols = ["♠", "♥", "♦", "♣"];
  const XP_PER_LEVEL = 100;

  useEffect(() => {
    // Check user authentication and fetch metadata
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        navigate('/');
      } else {
        const metadata = data.user.user_metadata;
        setLevel(metadata.level || 0);
        setXp(metadata.xp || 0);
        setBadges(metadata.badges || []);
        setLoading(false);
      }
    };
    checkUser();
  }, [navigate]);

  // Simulate earning XP and update metadata
  const earnXp = async (amount) => {
    setLoading(true);
    let newXp = xp + amount;
    let newLevel = level;
    let newBadges = [...badges];

    // Handle level-up and badge logic
    while (newXp >= XP_PER_LEVEL) {
      newXp -= XP_PER_LEVEL;
      newLevel += 1;

      if (newLevel >= 100) {
        newBadges.push({ id: Date.now(), name: `Legend Badge #${newBadges.length + 1}`, earned: new Date().toISOString() });
        newLevel = 0;
        newXp = 0;
        setPopup({ open: true, message: "Congratulations! You've earned a Legend Badge and reset to Level 0!", type: "success" });
      } else {
        setPopup({ open: true, message: `Level Up! You reached Level ${newLevel}!`, type: "success" });
      }
    }

    setXp(newXp);
    setLevel(newLevel);
    setBadges(newBadges);
    setXpHistory((prev) => [{ id: Date.now(), amount, date: new Date().toISOString() }, ...prev.slice(0, 4)]);

    // Update user metadata in Supabase auth
    const { error } = await supabase.auth.updateUser({
      data: {
        level: newLevel,
        xp: newXp,
        badges: newBadges,
        first_name: (await supabase.auth.getUser()).data.user.user_metadata.first_name, // Preserve existing metadata
      },
    });

    if (error) {
      setPopup({ open: true, message: `Failed to update profile: ${error.message}`, type: "error" });
    }
    setLoading(false);
  };

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
              animate={{
                y: [`${yPos}vh`, `${yPos - 30}vh`],
                rotate: [0, 360],
                opacity: [0, opacity, opacity, 0],
                scale: [0.5, 1, 1, 0.5],
              }}
              transition={{
                repeat: Infinity,
                duration,
                delay,
                ease: "easeInOut",
                times: [0, 0.2, 0.8, 1],
              }}
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
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-x-hidden">
      <FloatingSymbols />

      {/* Fixed background card table texture */}
      <div
        className="absolute inset-0 bg-green-900 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'url("/poker-felt-texture.jpg")', backgroundSize: 'cover' }}
      ></div>

      {/* Top glow */}
      <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-3/4 h-64 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>

      {/* Main Content */}
      <div className="w-full max-w-4xl mx-auto px-4 z-10 mt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700"
        >
          {/* Level System Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 drop-shadow-lg tracking-tight">
              Level System
            </h2>
            <p className="text-gray-400 mt-2">Earn XP, level up, and unlock legendary badges!</p>
          </div>

          {/* Level and XP Progress */}
          <div className="bg-gray-700 bg-opacity-60 backdrop-blur-lg rounded-xl p-6 border border-gray-600 mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faStar} className="text-yellow-400 mr-2" />
              Level {level}
            </h3>
            <div className="w-full bg-gray-600 rounded-full h-4 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: "0%" }}
                animate={{ width: `${(xp / XP_PER_LEVEL) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {xp}/{XP_PER_LEVEL} XP to Level {level + 1}
            </p>
            {/* Simulate XP gain (for demo purposes) */}
            <button
              onClick={() => earnXp(50)}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition shadow-lg"
              disabled={loading}
            >
              <FontAwesomeIcon icon={faCoins} className="mr-2" />
              Earn 50 XP
            </button>
          </div>

          {/* Badges Section */}
          <div className="bg-gray-700 bg-opacity-60 backdrop-blur-lg rounded-xl p-6 border border-gray-600 mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faTrophy} className="text-yellow-400 mr-2" />
              Your Badges
            </h3>
            {badges.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {badges.map((badge) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 rounded-lg border bg-gradient-to-r from-blue-900 to-purple-900 border-blue-700 flex flex-col items-center"
                  >
                    <FontAwesomeIcon icon={faShieldAlt} className="text-yellow-400 mb-2 text-2xl" />
                    <div className="text-white font-bold text-sm">{badge.name}</div>
                    <div className="text-gray-400 text-xs">{new Date(badge.earned).toLocaleDateString()}</div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center">Reach Level 100 to earn your first Legend Badge!</p>
            )}
          </div>

          {/* XP History */}
          <div className="bg-gray-700 bg-opacity-60 backdrop-blur-lg rounded-xl p-6 border border-gray-600 mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faGift} className="text-green-400 mr-2" />
              Recent XP Gains
            </h3>
            {xpHistory.length > 0 ? (
              <div className="space-y-2">
                {xpHistory.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-between items-center bg-gray-800 p-3 rounded-lg"
                  >
                    <span className="text-gray-300">+{entry.amount} XP</span>
                    <span className="text-gray-400 text-sm">{new Date(entry.date).toLocaleString()}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center">No recent XP gains. Play games to earn XP!</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-700 bg-opacity-60 backdrop-blur-lg rounded-xl p-6 border border-gray-600">
            <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/play"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg text-center transform hover:scale-105"
              >
                Play Games
              </Link>
              <Link
                to="/profile"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg text-center transform hover:scale-105"
              >
                Back to Profile
              </Link>
              <Link
                to="/battle-pass"
                className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg text-center transform hover:scale-105"
              >
                View Battle Pass
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Popup */}
      <AnimatePresence>
        {popup.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`bg-white rounded-xl shadow-2xl px-8 py-6 flex flex-col items-center max-w-md mx-4 border-t-4 ${
                popup.type === "error" ? "border-red-500" : "border-green-500"
              }`}
            >
              <div className="text-lg font-semibold text-gray-800 mb-4 text-center">{popup.message}</div>
              <button
                onClick={() => setPopup({ open: false, message: "", type: "info" })}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-lg transition shadow-md"
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-8 text-gray-400 text-sm opacity-80 text-center">
        © 2025 Poker4Fun – Play responsibly. No real money involved.
      </div>
    </div>
  );
};

export default LevelSystem;
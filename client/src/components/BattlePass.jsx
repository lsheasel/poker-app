import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import {
  faCrown,
  faGem,
  faCoins,
  faTrophy,
  faFire,
  faLock,
  faUnlock,
  faStar,
  faGift,
  faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';

const PokerPass = () => {
  const [battlePassTier, setBattlePassTier] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isPremium, setIsPremium] = useState(false); // Simulates premium status
  const [rewards, setRewards] = useState({ free: [], premium: [] });
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState({ open: false, message: "", type: "info" });
  const navigate = useNavigate();
  const suitSymbols = ["♠", "♥", "♦", "♣"];

  // Mock data for battle pass rewards
  const battlePassRewards = {
    free: [
      { tier: 1, reward: "50 Coins", icon: faCoins, unlocked: true },
      { tier: 2, reward: "Basic Badge", icon: faTrophy, unlocked: false },
      { tier: 3, reward: "100 Coins", icon: faCoins, unlocked: false },
      { tier: 4, reward: "Card Skin", icon: faGift, unlocked: false },
      { tier: 5, reward: "200 Coins", icon: faCoins, unlocked: false },
      { tier: 6, reward: "Silver Badge", icon: faTrophy, unlocked: false },
      { tier: 7, reward: "300 Coins", icon: faCoins, unlocked: false },
      { tier: 8, reward: "Table Skin", icon: faGift, unlocked: false },
    ],
    premium: [
      { tier: 1, reward: "200 Coins", icon: faCoins, unlocked: true },
      { tier: 2, reward: "Bronze Crown", icon: faCrown, unlocked: false },
      { tier: 3, reward: "Exclusive Avatar", icon: faStar, unlocked: false },
      { tier: 4, reward: "500 Coins", icon: faCoins, unlocked: false },
      { tier: 5, reward: "Golden Crown", icon: faCrown, unlocked: false },
      { tier: 6, reward: "Fire Effect", icon: faFire, unlocked: false },
      { tier: 7, reward: "1000 Coins", icon: faCoins, unlocked: false },
      { tier: 8, reward: "Diamond Badge", icon: faGem, unlocked: false },
    ],
  };

  useEffect(() => {
    // Check user authentication
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!data?.user) {
        navigate('/');
      }
    };
    checkUser();

    // Simulate fetching battle pass data
    setTimeout(() => {
      setRewards(battlePassRewards);
      setLoading(false);
    }, 1000);

    // Simulate checking premium status
    const checkPremium = async () => {
      const { data } = await supabase.auth.getUser();
      setIsPremium(data?.user?.user_metadata?.premium || false);
    };
    checkPremium();
  }, [navigate]);

  const handleClaimReward = (tier, track) => {
    if (battlePassTier >= tier && (track === "free" || (track === "premium" && isPremium))) {
      setPopup({ open: true, message: `Reward claimed: ${rewards[track][tier - 1].reward}!`, type: "success" });
      setRewards((prev) => ({
        ...prev,
        [track]: prev[track].map((reward, index) =>
          index === tier - 1 ? { ...reward, unlocked: true } : reward
        ),
      }));
    } else {
      setPopup({
        open: true,
        message: track === "premium" && !isPremium
          ? "Purchase Premium to claim this reward!"
          : "Reach this tier to claim the reward!",
        type: "error",
      });
    }
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
      <div className="w-full max-w-6xl mx-auto px-4 z-10 mt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700"
        >
          {/* Battle Pass Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 drop-shadow-lg tracking-tight">
              Battle Pass
            </h2>
            <p className="text-gray-400 mt-2">Progress through tiers to unlock Free and Premium rewards!</p>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-700 bg-opacity-60 backdrop-blur-lg rounded-xl p-6 border border-gray-600 mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faStar} className="text-yellow-400 mr-2" />
              Current Tier: {battlePassTier} {isPremium && <FontAwesomeIcon icon={faCrown} className="text-yellow-400 ml-2" />}
            </h3>
            <div className="w-full bg-gray-600 rounded-full h-4 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
            </div>
            <p className="text-gray-400 text-sm mt-2">{progress}% to Tier {battlePassTier + 1}</p>
          </div>

          {/* Rewards Section */}
          <div className="bg-gray-700 bg-opacity-60 backdrop-blur-lg rounded-xl p-6 border border-gray-600 overflow-x-auto">
            <div className="flex flex-col min-w-[1200px]">
              {/* Free Track */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                  <FontAwesomeIcon icon={faGift} className="text-green-400 mr-2" />
                  Free Track
                </h3>
                <div className="flex gap-4">
                  {rewards.free.map((reward, index) => (
                    <motion.div
                      key={`free-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 rounded-lg border w-40 flex flex-col items-center"
                    >
                      <FontAwesomeIcon icon={reward.icon} className="text-green-400 mb-2 text-2xl" />
                      <div className="text-white font-bold">Tier {reward.tier}</div>
                      <div className="text-gray-300 text-sm text-center">{reward.reward}</div>
                      <button
                        onClick={() => handleClaimReward(reward.tier, "free")}
                        className={`mt-2 px-3 py-1 rounded-lg text-sm font-medium ${
                          reward.unlocked
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-gray-500 text-gray-300 cursor-not-allowed"
                        }`}
                        disabled={!reward.unlocked}
                      >
                        <FontAwesomeIcon icon={reward.unlocked ? faUnlock : faLock} className="mr-1" />
                        {reward.unlocked ? "Claim" : "Locked"}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Premium Track */}
              <div>
                <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                  <FontAwesomeIcon icon={faCrown} className="text-yellow-400 mr-2" />
                  Premium Track
                </h3>
                <div className="flex gap-4">
                  {rewards.premium.map((reward, index) => (
                    <motion.div
                      key={`premium-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 8, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 rounded-lg border w-40 flex flex-col items-center"
                    >
                      <FontAwesomeIcon icon={reward.icon} className="text-yellow-400 mb-2 text-2xl" />
                      <div className="text-white font-bold">Tier {reward.tier}</div>
                      <div className="text-gray-300 text-sm text-center">{reward.reward}</div>
                      <button
                        onClick={() => handleClaimReward(reward.tier, "premium")}
                        className={`mt-2 px-3 py-1 rounded-lg text-sm font-medium ${
                          reward.unlocked && isPremium
                            ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                            : "bg-gray-500 text-gray-300 cursor-not-allowed"
                        }`}
                        disabled={!reward.unlocked || !isPremium}
                      >
                        <FontAwesomeIcon icon={reward.unlocked && isPremium ? faUnlock : faLock} className="mr-1" />
                        {reward.unlocked && isPremium ? "Claim" : "Locked"}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-700 bg-opacity-60 backdrop-blur-lg rounded-xl p-6 border border-gray-600 mt-8">
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
              {!isPremium && (
                <Link
                  to="/store"
                  className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg text-center transform hover:scale-105"
                >
                  Unlock Premium
                </Link>
              )}
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

export default PokerPass;
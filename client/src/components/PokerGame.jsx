import React, { useState, useEffect, useRef } from 'react';
import './PokerGame.css';
import socket from '../socket';
import { stopLobbyMusic } from "./Lobby";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faBars, faTimes, faQuestionCircle, faVolumeUp, faVolumeMute, faCopy, faCrown, faUser } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

// Audio management
let tableAudio = null;

function playTableMusic() {
  if (tableAudio) {
    tableAudio.pause();
    tableAudio.currentTime = 0;
  }
  tableAudio = new window.Audio("/table.mp3");
  tableAudio.volume = 0.1;
  tableAudio.loop = true;
  tableAudio.play().catch(e => console.log("Audio playback prevented:", e));
}

function stopTableMusic() {
  if (tableAudio) {
    tableAudio.pause();
    tableAudio.currentTime = 0;
    tableAudio = null;
  }
}

// Card utilities
const getSuitColor = (suit) =>
  suit === 'hearts' || suit === 'diamonds' ? 'text-red-600' : 'text-black';

const getSuitSymbol = (suit) => {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
    default: return '';
  }
};

// Enhanced Card component with Framer Motion
const Card = ({ card, index, delay = 0, type = 'community' }) => {
  const initialY = type === 'player' ? 100 : -100;
  
  return (
    <motion.div 
      initial={{ y: initialY, opacity: 0, rotateY: 180 }}
      animate={{ y: 0, opacity: 1, rotateY: 0 }}
      transition={{ 
        delay: delay * 0.15,
        duration: 0.5,
        type: "spring",
        stiffness: 120,
        damping: 15
      }}
      className="relative bg-white rounded-lg border-2 border-gray-300 shadow-lg w-14 h-20 flex items-center justify-center overflow-hidden"
    >
      <div className="card-inner">
        <div className="card-value-top">
          <span className={getSuitColor(card.suit)}>{card.value}</span>
          <span className={getSuitColor(card.suit)}>{getSuitSymbol(card.suit)}</span>
        </div>
        <div className={`card-suit ${getSuitColor(card.suit)}`}>
          {getSuitSymbol(card.suit)}
        </div>
        <div className="card-value-bottom">
          <span className={getSuitColor(card.suit)}>{card.value}</span>
          <span className={getSuitColor(card.suit)}>{getSuitSymbol(card.suit)}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Chip component
const Chip = ({ amount, delay = 0 }) => {
  return (
    <motion.div 
      initial={{ y: -20, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ 
        delay: delay * 0.1,
        duration: 0.4,
        type: "spring",
        stiffness: 200,
        damping: 15
      }}
      className="chip-stack relative"
    >
      <div className="absolute -top-1 -left-1 w-14 h-14 bg-yellow-600 rounded-full shadow-inner z-10 flex items-center justify-center">
        <div className="w-12 h-12 bg-yellow-500 rounded-full border-4 border-yellow-300 flex items-center justify-center text-xs font-bold text-white">
          ${amount}
        </div>
      </div>
    </motion.div>
  );
};

// Player Avatar component
const PlayerAvatar = ({ player, isCurrentPlayer, position, delay }) => {
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        delay: delay, 
        duration: 0.5, 
        type: "spring",
        stiffness: 120,
        damping: 10
      }}
      className="absolute flex flex-col items-center z-20"
      style={position}
    >
      <motion.div 
        animate={isCurrentPlayer ? { 
          boxShadow: ['0 0 0px rgba(255,215,0,0)', '0 0 15px rgba(255,215,0,0.7)', '0 0 0px rgba(255,215,0,0)'] 
        } : {}}
        transition={{
          duration: 1.5,
          repeat: isCurrentPlayer ? Infinity : 0,
          repeatType: "loop"
        }}
        className={`
          rounded-full bg-gray-800 border-4 
          ${isCurrentPlayer ? "border-yellow-400" : "border-gray-600"} 
          w-24 h-16 flex items-center justify-center text-white text-base font-bold 
          transition-all duration-300
        `}
      >
        {player.name || "?"}
      </motion.div>
      <div className="mt-1 text-white text-sm font-bold">${player.chips ?? 0}</div>
    </motion.div>
  );
};

// Navigation Bar Component
const Navbar = ({ lobbyName }) => {
  const [showLoginTooltip, setShowLoginTooltip] = useState(false);
  return (
    <div className="w-full bg-gray-900 bg-opacity-80 backdrop-blur-lg fixed top-0 left-0 z-50 px-6 py-4">
            <div className="flex items-center justify-between container mx-auto">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <motion.div
                            initial={{ rotate: -5 }}
                            animate={{ rotate: 5 }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity, 
                              repeatType: 'reverse' 
                            }}
                            className="text-3xl mr-2 text-white font-bold"
                          >
                            ♠
                          </motion.div>
                  <a href="https://poker4fun.xyz" className="text-white font-bold text-2xl">Poker4Fun</a>
                </div>
              </div>
              
              
              
              <div className={`absolute md:relative top-full left-0 w-full md:w-auto p-4 md:p-0 bg-gray-900 md:bg-transparent transition-all duration-300 transform`}>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex gap-3">
                    <a
                      href="https://discord.gg/tCCdfJyZEp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
                      aria-label="Discord"
                    >
                      <FontAwesomeIcon icon={faDiscord} />
                    </a>
                    
                    <div className="relative">
                      <button 
                        className="bg-gray-600 text-gray-400 p-2 rounded-full shadow-lg cursor-not-allowed opacity-60"
                        aria-label="Login (Coming Soon)"
                        onMouseEnter={() => setShowLoginTooltip(true)}
                        onMouseLeave={() => setShowLoginTooltip(false)}
                      >
                        <FontAwesomeIcon icon={faUser} />
                      </button>
                      {showLoginTooltip && (
                        <div className="absolute right-0 mt-2 w-32 bg-gray-800 rounded-md shadow-lg p-2 text-center text-sm text-gray-200 z-50">
                          Coming Soon
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
};

// Main PokerGame Component
const PokerGame = ({
  players = [],
  playerHand = [],
  communityCards = [],
  pot = 0,
  playerMoney = 1000,
  gameStarted,
  playerTurn,
  lobbyName,
  onBet,
  onCall,
  onFold,
  currentPlayerId,
  myPlayerId,
  opponentId,
  opponentName,
  opponentChips
}) => {
  const [betInput, setBetInput] = useState('');
  const [isDealing, setIsDealing] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const tableRef = useRef(null);
  
  const isMyTurn = currentPlayerId === myPlayerId;

  // Winning popup state
  const [winnerPopup, setWinnerPopup] = useState({ 
    show: false, 
    name: '', 
    amount: 0 
  });

  // Handle round end and winner animation
  useEffect(() => {
    const handleRoundEnded = ({ winnerId, pot }) => {
      const winner = players.find(p => p.id === winnerId);
      setWinnerPopup({
        show: true,
        name: winner ? winner.name : "Unknown",
        amount: pot
      });
      setConfetti(true);
      
      // Reset animations
      setTimeout(() => {
        setWinnerPopup({ show: false, name: '', amount: 0 });
        setConfetti(false);
      }, 3000);
    };
    
    socket.on("roundEnded", handleRoundEnded);
    return () => socket.off("roundEnded", handleRoundEnded);
  }, [players]);

  // Dealing animation
  useEffect(() => {
    if (playerHand.length > 0) {
      setIsDealing(true);
      setTimeout(() => {
        setIsDealing(false);
      }, 1500);
    }
  }, [playerHand]);

  // Table music
  useEffect(() => {
    stopLobbyMusic();
    playTableMusic();
    return () => stopTableMusic();
  }, []);

  // Hand evaluation
  const evaluateHand = (playerHand, communityCards) => {
    const allCards = [...playerHand, ...communityCards];
    if (allCards.length < 5) return "Waiting for cards...";
    
    const values = allCards.map((card) => card.value);
    const suits = allCards.map((card) => card.suit);

    const valueCounts = values.reduce((counts, value) => {
      counts[value] = (counts[value] || 0) + 1;
      return counts;
    }, {});
    const counts = Object.values(valueCounts);

    if (counts.includes(4)) return "Four of a Kind";
    if (counts.includes(3) && counts.includes(2)) return "Full House";
    if (counts.includes(3)) return "Three of a Kind";
    if (counts.filter((count) => count === 2).length === 2) return "Two Pair";
    if (counts.includes(2)) return "Pair";

    const suitCounts = suits.reduce((counts, suit) => {
      counts[suit] = (counts[suit] || 0) + 1;
      return counts;
    }, {});
    if (Object.values(suitCounts).some((count) => count >= 5)) return "Flush";

    // Convert card values to numbers for straight detection
    const valueMap = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, 
      '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
    };
    
    const numericValues = values.map(v => valueMap[v] || parseInt(v)).sort((a, b) => a - b);
    const uniqueValues = [...new Set(numericValues)];
    
    // Check for straight
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      if (
        uniqueValues[i + 4] - uniqueValues[i] === 4 &&
        uniqueValues[i + 4] !== uniqueValues[i] + 3 &&
        uniqueValues[i + 4] !== uniqueValues[i] + 2 &&
        uniqueValues[i + 4] !== uniqueValues[i] + 1
      ) {
        return "Straight";
      }
    }
    
    // Special case: A-5 straight
    if (
      uniqueValues.includes(14) && // Ace
      uniqueValues.includes(2) &&
      uniqueValues.includes(3) &&
      uniqueValues.includes(4) &&
      uniqueValues.includes(5)
    ) {
      return "Straight";
    }
    
    return "High Card";
  };

  // Player positions with proper distribution around the table
  const playerPositions = [
    { left: "15%", top: "20%" },
    { right: "15%", top: "20%" },
    { left: "5%", top: "50%" },
    { right: "5%", top: "50%" },
    { left: "25%", top: "5%" },
    { right: "25%", top: "5%" },
    { left: "50%", top: "0%" },
    { left: "50%", bottom: "0%" },
    { left: "10%", bottom: "10%" },
    { right: "10%", bottom: "10%" }
  ];

  // Confetti effect
  const renderConfetti = () => {
    if (!confetti) return null;
    
    return Array.from({ length: 100 }).map((_, i) => {
      const style = {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
      };
      
      return <div key={i} className="confetti" style={style}></div>;
    });
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar lobbyName={lobbyName} />
      
      {/* Game container - takes remaining height */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-[#2d112b] via-[#1a1a2e] to-[#3a1c71] flex flex-col items-center justify-center">
        {/* Confetti effect */}
        {confetti && <div className="confetti-container absolute inset-0 overflow-hidden">{renderConfetti()}</div>}

        {/* Table */}
        <motion.div
          ref={tableRef}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, type: "spring" }}
          className="relative w-[600px] h-[500px] mx-auto rounded-full border-8 border-[#8B4513] shadow-2xl flex items-center justify-center mt-16"
          style={{
            background: "linear-gradient(135deg, rgba(0,120,60,1) 0%, rgba(0,80,40,1) 50%, rgba(0,60,30,1) 100%)",
          }}
        >
          {/* Table inner shadow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-transparent to-black opacity-30"></div>
          
          {/* Table logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="text-white text-5xl font-bold">POKER</div>
          </div>

          {/* Pot with chip animation */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="absolute top-[21%] transform -translate-x-1/2 text-center z-10"
          >
            <div className="bg-green-900 text-white px-6 py-3 rounded-full shadow-lg border border-yellow-500">
              <span className="mr-2">POT:</span>
              <span className="text-yellow-300 font-bold text-xl">${pot}</span>
            </div>
            {pot > 0 && (
              <div className="chips-container flex justify-center mt-2">
                {[...Array(Math.min(5, Math.ceil(pot / 100)))].map((_, i) => (
                  <Chip key={i} amount={Math.min(100, pot / (i + 1))} delay={i} />
                ))}
              </div>
            )}
          </motion.div>

          {/* Community Cards */}
          <div className="absolute left-1/2 top-[45%] transform -translate-x-1/2 flex space-x-3 z-10">
            {communityCards.map((card, i) => (
              <Card 
                key={i} 
                card={card} 
                index={i} 
                delay={i} 
                type="community" 
              />
            ))}
          </div>

          {/* Player Hand */}
          <div className="absolute left-1/2 bottom-16 transform -translate-x-1/2 flex space-x-4 z-20">
            {playerHand.map((card, i) => (
              <Card 
                key={i} 
                card={card} 
                index={i} 
                delay={i} 
                type="player" 
              />
            ))}
          </div>

          {/* Hand evaluation display */}
          {playerHand.length === 2 && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="absolute left-1/2 bottom-4 transform -translate-x-1/2 z-30"
            >
              <div className="bg-gray-900 text-yellow-300 px-6 py-3 rounded-full shadow-lg text-lg font-bold border-2 border-yellow-400">
                {evaluateHand(playerHand, communityCards)}
              </div>
            </motion.div>
          )}

          {/* Player Avatars */}
          {players.map((player, idx) => (
            <PlayerAvatar
              key={player.id || idx}
              player={player}
              isCurrentPlayer={currentPlayerId === player.id}
              position={playerPositions[idx] || { left: "50%", top: "50%" }}
              delay={0.2 + idx * 0.1}
            />
          ))}
        </motion.div>

        {/* Winner Popup */}
        <AnimatePresence>
          {winnerPopup.show && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 60 }}
              animate={{ scale: 1.1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: 60 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
            >
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ 
                  rotate: [0, 5, -5, 3, -3, 0],
                  scale: [1, 1.05, 1, 1.05, 1]
                }}
                transition={{ 
                  duration: 1.5,
                  times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                  repeat: Infinity
                }}
                className="bg-gradient-to-br from-yellow-400 to-pink-500 rounded-2xl shadow-2xl px-12 py-8 flex flex-col items-center border-4 border-white"
              >
                <div className="text-4xl font-extrabold text-white mb-3 drop-shadow-lg">
                  🏆 Winner!
                </div>
                <div className="text-3xl font-bold text-white mb-2">{winnerPopup.name}</div>
                <div className="text-xl text-white mb-3">wins the pot of</div>
                <div className="text-4xl font-extrabold text-yellow-200 mb-3 tracking-wider">
                  ${winnerPopup.amount}
                </div>
                <div className="text-3xl">🎉</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        {gameStarted && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-[600px] mx-auto flex flex-col items-center mt-4 z-30"
          >
            <div className={`
              text-white text-xl font-bold mb-3 px-6 py-2 rounded-full
              ${isMyTurn ? 'bg-green-600' : 'bg-gray-700'}
              transition-all duration-300
            `}>
              {isMyTurn ? "Your Turn!" : "Waiting for opponent..."}
            </div>
            
            <div className="flex space-x-4 mb-2">
              <input
                type="number"
                value={betInput}
                onChange={(e) => setBetInput(e.target.value)}
                className="p-3 rounded-lg text-black w-32 border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-all"
                placeholder="Amount"
                disabled={!isMyTurn}
              />
              
              <motion.button
  whileHover={{ scale: isMyTurn ? 1.05 : 1 }}
  whileTap={{ scale: isMyTurn ? 0.95 : 1 }}
  onClick={() => {
    
    const parsed = Number(betInput);
    if (!isNaN(parsed)) {
      onBet?.(parsed);
    }
  }}
  disabled={!isMyTurn}
  className={`
    bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold 
    py-3 px-6 rounded-lg shadow-lg transition-all
    ${!isMyTurn ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-600 hover:to-blue-700'}
  `}
>
  Bet
</motion.button>

              
              <motion.button
                whileHover={{ scale: isMyTurn ? 1.05 : 1 }}
                whileTap={{ scale: isMyTurn ? 0.95 : 1 }}
                onClick={onCall}
                disabled={!isMyTurn}
                className={`
                  bg-gradient-to-r from-green-500 to-green-600 text-white font-bold 
                  py-3 px-6 rounded-lg shadow-lg transition-all
                  ${!isMyTurn ? 'opacity-50 cursor-not-allowed' : 'hover:from-green-600 hover:to-green-700'}
                `}
              >
                Call
              </motion.button>
              
              <motion.button
                whileHover={{ scale: isMyTurn ? 1.05 : 1 }}
                whileTap={{ scale: isMyTurn ? 0.95 : 1 }}
                onClick={onFold}
                disabled={!isMyTurn}
                className={`
                  bg-gradient-to-r from-red-500 to-red-600 text-white font-bold 
                  py-3 px-6 rounded-lg shadow-lg transition-all
                  ${!isMyTurn ? 'opacity-50 cursor-not-allowed' : 'hover:from-red-600 hover:to-red-700'}
                `}
              >
                Fold
              </motion.button>
            </div>
          </motion.div>
        )}
        
        {/* CSS for animations */}
        <style jsx>{`
          @keyframes fall {
            0% { transform: translateY(-100vh) rotate(0deg); }
            100% { transform: translateY(100vh) rotate(360deg); }
          }
          
          .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            animation: fall 4s ease-out forwards;
          }
          
          .card-inner {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            width: 100%;
            padding: 0.25rem;
          }
          
          .card-value-top {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            font-weight: bold;
          }
          
          .card-suit {
            font-size: 1.5rem;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-grow: 1;
          }
          
          .card-value-bottom {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            transform: rotate(180deg);
            font-weight: bold;
          }
          
          .chip-stack {
            transform: rotate(45deg);
            margin: -8px 4px;
          }
        `}</style>
      </div>
    </div>
  );
};

export default PokerGame;
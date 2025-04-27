import React, { useState, useEffect } from 'react';
import './PokerGame.css';
import socket from '../socket'; // falls noch nicht importiert
import { stopLobbyMusic } from "./Lobby"; // Importiere die Funktion
import { motion, AnimatePresence } from "framer-motion";

// ganz oben in PokerGame.jsx
let tableAudio = null;

function playTableMusic() {
  if (tableAudio) {
    tableAudio.pause();
    tableAudio.currentTime = 0;
  }
  tableAudio = new window.Audio("/table.mp3");
  tableAudio.volume = 0.1;
  tableAudio.loop = true;
  tableAudio.play();
}

function stopTableMusic() {
  if (tableAudio) {
    tableAudio.pause();
    tableAudio.currentTime = 0;
    tableAudio = null;
  }
}

// Hilfsfunktionen für Farben und Symbole
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

// Karten-Komponente mit Animation
const Card = ({ card, index, shouldAnimate, cardType }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (shouldAnimate) {
      const timer = setTimeout(() => setAnimated(true), 200);
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate]);

  // Position für Animation (optional, kann angepasst werden)
  const getPosition = () => {
    if (cardType === 'playerHand') {
      return { bottom: '10%', left: `${40 + index * 8}%` };
    } else {
      return { top: '30%', left: `${35 + index * 6}%` };
    }
  };

  const position = getPosition();

  return (
    <div
      className={`poker-card ${shouldAnimate && !animated ? 'card-dealing' : ''} ${
        animated ? 'card-in-hand' : ''
      }`}
      style={position}
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
    </div>
  );
};

// PokerGame-Komponente für Multiplayer
const PokerGame = ({
  players = [], // <-- nur dieses verwenden!
  playerHand = [],
  communityCards = [],
  pot = 0,
  playerMoney = 1000,
  gameStarted,
  playerTurn,
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
  const [newCardIndices, setNewCardIndices] = useState([]);
  const [isDealing, setIsDealing] = useState(false);
  const [disableAnimation, setDisableAnimation] = useState(false);

  const isMyTurn = currentPlayerId === myPlayerId;

  console.log("currentPlayerId:", currentPlayerId, "myPlayerId:", myPlayerId);

  // Gewinner-Popup State
  const [winnerPopup, setWinnerPopup] = useState({ show: false, name: '', amount: 0 });

  useEffect(() => {
    const handleRoundEnded = ({ winnerId, pot }) => {
      const winner = players.find(p => p.id === winnerId);
      setWinnerPopup({
        show: true,
        name: winner ? winner.name : "Unbekannt",
        amount: pot
      });
      setTimeout(() => setWinnerPopup({ show: false, name: '', amount: 0 }), 1000);
    };
    socket.on("roundEnded", handleRoundEnded);
    return () => socket.off("roundEnded", handleRoundEnded);
  }, [players]);

  // Animation für neue Karten (optional, kann angepasst werden)
  useEffect(() => {
    if (playerHand.length > 0) {
      setIsDealing(true);
      setNewCardIndices([0, 1]);
      setTimeout(() => {
        setIsDealing(false);
        setNewCardIndices([]);
      }, 1500);
    }
  }, [playerHand]);

  // Musik für den Tisch
  useEffect(() => {
    stopLobbyMusic();      // Stoppt die Lobby-Musik sofort beim Betreten des Tisches
    playTableMusic();      // Startet die Tischmusik
    return () => stopTableMusic();
  }, []);

  // Handbewertung (wie im Beispiel)
  const evaluateHand = (playerHand, communityCards) => {
    const allCards = [...playerHand, ...communityCards];
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

    const uniqueValues = [...new Set(values)]
      .map((value) => "23456789TJQKA".indexOf(value))
      .sort((a, b) => a - b);
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      if (
        uniqueValues[i + 4] - uniqueValues[i] === 4 &&
        new Set(uniqueValues.slice(i, i + 5)).size === 5
      ) {
        return "Straight";
      }
    }
    return "High Card";
  };

  // Positionen für bis zu 10 Spieler
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

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#2d112b] via-[#1a1a2e] to-[#3a1c71]">
      {/* Tisch */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, type: "spring" }}
        className="relative w-[600px] h-[600px] mx-auto my-2 bg-green-800 rounded-full border-8 border-yellow-400 shadow-lg flex items-center justify-center"
      >
        {/* Pot */}
        <div className="absolute left-1/2 top-[32%] transform -translate-x-1/2 text-center z-10">
          <div className="bg-green-900 text-white px-4 py-2 rounded-full shadow">
            POT: ${pot}
          </div>
        </div>

        {/* Community Cards */}
        <div className="absolute left-1/2 top-[45%] transform -translate-x-1/2 flex space-x-2 z-10">
          {communityCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.15, duration: 0.4, type: "spring" }}
              className="bg-white rounded-lg border w-12 h-16 flex items-center justify-center text-2xl shadow"
            >
              {card.value}
              <span className={card.suit === "hearts" || card.suit === "diamonds" ? "text-red-600" : "text-black"}>
                {getSuitSymbol(card.suit)}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Eigene Hand */}
        <div className="absolute left-1/2 bottom-20 transform -translate-x-1/2 flex space-x-4 z-20">
          {playerHand.map((card, i) => (
            <motion.div
              key={i}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.2, duration: 0.4, type: "spring" }}
              className="bg-white rounded-lg border w-14 h-20 flex items-center justify-center text-2xl shadow"
            >
              {card.value}
              <span className={card.suit === "hearts" || card.suit === "diamonds" ? "text-red-600" : "text-black"}>
                {getSuitSymbol(card.suit)}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Handbewertung anzeigen */}
        {playerHand.length === 2 && communityCards.length > 0 && (
          <div className="absolute left-1/2 bottom-8 transform -translate-x-1/2 z-30">
            <div className="bg-gray-900 text-yellow-300 px-4 py-2 rounded-full shadow text-lg font-bold border border-yellow-400">
              {evaluateHand(playerHand, communityCards)}
            </div>
          </div>
        )}

        {/* Spieler-Avatare */}
        {players.map((player, idx) => (
          <motion.div
            key={player.id || idx}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 + idx * 0.1, duration: 0.5, type: "spring" }}
            className="absolute flex flex-col items-center z-20"
            style={playerPositions[idx] || { left: "50%", top: "50%" }}
          >
            <div className={`rounded-full bg-gray-800 border-4 ${currentPlayerId === player.id ? "border-yellow-400" : "border-gray-600"} w-24 h-16 flex items-center justify-center text-white text-base font-bold transition-all duration-300`}>
              {player.name || "?"}
            </div>
            <div className="mt-1 text-white text-sm font-bold">${player.chips ?? 0}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Gewinner-Popup */}
      <AnimatePresence>
        {winnerPopup.show && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 60 }}
            animate={{ scale: 1.1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              exit={{ rotate: 10 }}
              className="bg-gradient-to-br from-yellow-400 to-pink-500 rounded-2xl shadow-2xl px-12 py-8 flex flex-col items-center border-4 border-white"
            >
              <div className="text-3xl font-extrabold text-white mb-2 drop-shadow-lg animate-bounce">
                🏆 Gewinner!
              </div>
              <div className="text-2xl font-bold text-white mb-1">{winnerPopup.name}</div>
              <div className="text-lg text-white mb-2">gewinnt den Pot von</div>
              <div className="text-3xl font-extrabold text-yellow-200 mb-2">${winnerPopup.amount}</div>
              <div className="text-2xl">🎉</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons UNTER dem Tisch */}
      {gameStarted && (
        <div className="w-[600px] mx-auto flex flex-col items-center mt-0 z-30">
          <div className="text-white text-lg font-bold mb-2">
            {isMyTurn ? "Du bist dran!" : "Warte auf den Zug des Gegners..."}
          </div>
          <div className="flex space-x-2 mb-2">
            <input
              type="number"
              value={betInput}
              onChange={(e) => setBetInput(e.target.value)}
              className="p-2 rounded-lg text-black w-24"
              placeholder="Betrag"
              disabled={!isMyTurn}
            />
            <button
              onClick={() => onBet && onBet(Number(betInput))}
              disabled={!isMyTurn}
              className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-all ${!isMyTurn ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Setzen
            </button>
            <button
              onClick={onCall}
              disabled={!isMyTurn}
              className={`bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-all ${!isMyTurn ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Call
            </button>
            <button
              onClick={onFold}
              disabled={!isMyTurn}
              className={`bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-all ${!isMyTurn ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Fold
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PokerGame;
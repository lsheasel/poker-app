import React, { useState, useEffect } from "react";
import socket from "../socket";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';

let lobbyAudio = null;

function playLobbyMusic() {
  if (lobbyAudio) {
    lobbyAudio.pause();
    lobbyAudio.currentTime = 0;
  }
  lobbyAudio = new window.Audio("/game.mp3");
  lobbyAudio.volume = 0.1;
  lobbyAudio.loop = true;
  lobbyAudio.play();
}

export function stopLobbyMusic() {
  if (lobbyAudio) {
    lobbyAudio.pause();
    lobbyAudio.currentTime = 0;
    lobbyAudio = null;
  }
}

function generateLobbyCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const Lobby = ({ onStartGame }) => {
  const [lobbyName, setLobbyName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [inLobby, setInLobby] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [popup, setPopup] = useState({ open: false, message: "" });

  useEffect(() => {
    playLobbyMusic();
    return () => stopLobbyMusic();
  }, []);

  useEffect(() => {
    const handlePlayerJoined = (players) => {
      setLobbyPlayers(players);
      setInLobby(true);
    };

    const handleGameStarted = () => {
      stopLobbyMusic();
      onStartGame({
        lobbyName,
        playerName,
        playerId: socket.id,
        isHost,
      });
    };

    const handleError = (message) => {
      setPopup({ open: true, message });
    };

    socket.on("playerJoined", handlePlayerJoined);
    socket.on("gameStarted", handleGameStarted);
    socket.on("error", handleError);

    return () => {
      socket.off("playerJoined", handlePlayerJoined);
      socket.off("gameStarted", handleGameStarted);
      socket.off("error", handleError);
    };
  }, [lobbyName, onStartGame, isHost, playerName]);

  const createLobby = () => {
    if (!playerName) {
      setPopup({ open: true, message: "Please enter your name!" });
      return;
    }
    const code = generateLobbyCode();
    setLobbyName(code);
    socket.emit("createLobby", code, playerName);

    socket.once("lobbyCreated", () => {
      setLobbyPlayers([{ id: socket.id, name: playerName }]);
      setInLobby(true);
      setIsHost(true);
    });
  };

  const joinLobby = () => {
    if (!playerName || !lobbyName) {
      setPopup({ open: true, message: "Please enter your name and lobby code!" });
      return;
    }
    socket.emit("joinLobby", lobbyName, playerName);
  };

  const startGame = () => {
    if (!isHost) {
      setPopup({ open: true, message: "Only the host can start the game!" });
      return;
    }
    if (lobbyPlayers.length < 2) {
      setPopup({ open: true, message: "At least 2 players needed to start!" });
      return;
    }
    if (lobbyPlayers.length > 10) {
      setPopup({ open: true, message: "Maximum 10 players allowed!" });
      return;
    }
    socket.emit("startGame", lobbyName);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(lobbyName);
    setPopup({ open: true, message: "Lobby code copied!" });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#2d112b] via-[#1a1a2e] to-[#3a1c71] relative">

      {/* Discord Button oben rechts */}
      <a
        href="https://discord.gg/deinserverlink" // <<< Deinen Discord Link hier einfügen!
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full shadow-lg transition"
      >
        <FontAwesomeIcon icon={faDiscord} />
      </a>

      {/* Header */}
      <div className="mb-10 flex flex-col items-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-2 tracking-wide">Poker4Fun</h1>
        <p className="text-xl text-gray-200 mb-4">Play poker with friends – free & online!</p>
      </div>

      {!inLobby ? (
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 w-full max-w-4xl">
          
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="bg-[#232946] rounded-xl shadow-2xl p-8 flex flex-col items-center w-80 mb-8 md:mb-0"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-pink-500 mb-4 border-4 border-white flex items-center justify-center text-4xl font-bold text-white shadow-lg">
              {playerName ? playerName[0].toUpperCase() : "?"}
            </div>
            <input
              type="text"
              placeholder="Your Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-3 mb-4 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center text-lg"
              maxLength={16}
            />
            <div className="text-white font-bold text-lg">{playerName || "Player Name"}</div>
          </motion.div>

          {/* Lobby Actions */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col gap-8 w-full max-w-md"
          >
            {/* Quick Game */}
            <div className="bg-orange-500 hover:bg-orange-600 transition rounded-xl shadow-lg p-8 flex flex-col items-center">
              <div className="text-3xl font-extrabold text-white mb-4">Quick Game</div>
              <button
                onClick={createLobby}
                className="bg-white text-orange-600 hover:bg-orange-100 font-bold py-2 px-6 rounded-lg text-lg shadow transition mb-2"
              >
                Create Lobby
              </button>
              <div className="text-white">Random lobby code</div>
            </div>

            {/* Private Game */}
            <div className="bg-green-500 hover:bg-green-600 transition rounded-xl shadow-lg p-8 flex flex-col items-center">
              <div className="text-3xl font-extrabold text-white mb-4">Private Game</div>
              <input
                type="text"
                placeholder="Lobby Code"
                value={lobbyName}
                onChange={(e) => setLobbyName(e.target.value.toUpperCase())}
                className="w-full p-3 mb-3 rounded bg-green-100 text-green-900 placeholder-green-400 focus:outline-none focus:ring-2 focus:ring-green-300 text-center text-lg font-mono tracking-widest"
                maxLength={8}
              />
              <button
                onClick={joinLobby}
                className="bg-white text-green-600 hover:bg-green-100 font-bold py-2 px-6 rounded-lg text-lg shadow transition"
              >
                Join Lobby
              </button>
              <div className="text-white mt-2">Join an existing lobby</div>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="bg-gray-900 p-8 rounded-lg shadow-2xl w-full max-w-md flex flex-col items-center">
          <div
            className="text-2xl font-bold mb-2 text-center text-white cursor-pointer select-all"
            title="Click to copy"
            onClick={handleCopy}
          >
            Lobby Code: <span className="font-mono text-yellow-400">{lobbyName}</span>
          </div>
          <div className="text-white text-lg mb-2">
            Players: {lobbyPlayers.length}/10
          </div>
          <h2 className="text-lg font-semibold mb-2 text-white">Players:</h2>
          <ul className="mb-4 w-full">
            {lobbyPlayers.map((player, index) => (
              <li key={`${player.id}-${index}`} className="text-gray-200 text-lg py-1 px-2 rounded bg-gray-800 mb-1">
                {player.name}
              </li>
            ))}
          </ul>
          {isHost ? (
            <button
              onClick={startGame}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded w-full transition duration-200 text-lg"
            >
              Start Game
            </button>
          ) : (
            <div className="text-gray-400 mt-2">Waiting for host...</div>
          )}
        </div>
      )}

      {/* Popup */}
      {popup.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl px-8 py-6 flex flex-col items-center"
          >
            <div className="text-lg font-semibold text-gray-800 mb-4 text-center">{popup.message}</div>
            <button
              onClick={() => setPopup({ open: false, message: "" })}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded transition"
            >
              OK
            </button>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-16 text-gray-400 text-sm opacity-80">© 2025 Poker4Fun – Made with ❤️</div>
    </div>
  );
};

export default Lobby;

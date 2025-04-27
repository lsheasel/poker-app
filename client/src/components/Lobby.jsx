import React, { useState, useEffect } from "react";
import socket from "../socket";
import { motion } from "framer-motion";

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

function playSound() {
  const audio = new window.Audio("/game.mp3");
  audio.volume = 0.1;
  audio.loop = true;
  audio.play();
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
    socket.on("playerJoined", (players) => {
      setLobbyPlayers(players);
      setInLobby(true);
    });

    socket.on("gameStarted", () => {
      stopLobbyMusic();
      onStartGame({
        lobbyName,
        playerName,
        playerId: socket.id,
        isHost
      });
    });

    socket.on("error", (message) => setPopup({ open: true, message }));

    return () => {
      socket.off("playerJoined");
      socket.off("gameStarted");
      socket.off("error");
    };
  }, [lobbyName, onStartGame]);

  const createLobby = () => {
    if (!playerName) {
      setPopup({ open: true, message: "Bitte gib deinen Namen ein!" });
      return;
    }
    playSound();
    const code = generateLobbyCode();
    setLobbyName(code);
    socket.emit("createLobby", code, playerName);
    socket.on("lobbyCreated", () => {
      setLobbyPlayers([{ id: socket.id, name: playerName }]);
      setInLobby(true);
      setIsHost(true);
    });
  };

  const joinLobby = () => {
    if (!playerName || !lobbyName) {
      setPopup({ open: true, message: "Bitte gib deinen Namen und den Lobby-Code ein!" });
      return;
    }
    if (lobbyPlayers.length >= 10) {
      setPopup({ open: true, message: "Die Lobby ist voll (maximal 10 Spieler)!" });
      return;
    }
    playSound();
    socket.emit("joinLobby", lobbyName, playerName);
    socket.on("playerJoined", (players) => {
      setLobbyPlayers(players);
      setInLobby(true);
      setIsHost(false);
    });
  };

  const startGame = () => {
    if (isHost && lobbyPlayers.length >= 2 && lobbyPlayers.length <= 10) {
      socket.emit("startGame", lobbyName);
    } else if (lobbyPlayers.length < 2) {
      setPopup({ open: true, message: "Mindestens 2 Spieler müssen in der Lobby sein!" });
    } else if (lobbyPlayers.length > 10) {
      setPopup({ open: true, message: "Maximal 10 Spieler sind erlaubt!" });
    } else {
      setPopup({ open: true, message: "Nur der Host kann das Spiel starten!" });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(lobbyName);
    setPopup({ open: true, message: "Lobby-Code kopiert!" });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#2d112b] via-[#1a1a2e] to-[#3a1c71]">
      {/* Header */}
      <div className="mb-10 flex flex-col items-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-2 tracking-wide">Poker4Fun</h1>
        <p className="text-xl text-gray-200 mb-4">Spiele Poker mit Freunden – kostenlos & online!</p>
      </div>

      {!inLobby ? (
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 w-full max-w-4xl">
          {/* Profilkarte */}
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
              placeholder="Dein Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-3 mb-4 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center text-lg"
              maxLength={16}
            />
            <div className="text-white font-bold text-lg">{playerName || "Spielername"}</div>
          </motion.div>

          {/* Lobby-Boxen */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col gap-8 w-full max-w-md"
          >
            {/* Schnelles Spiel */}
            <div className="bg-orange-500 hover:bg-orange-600 transition rounded-xl shadow-lg p-8 flex flex-col items-center">
              <div className="text-3xl font-extrabold text-white mb-4">Schnelles Spiel</div>
              <button
                onClick={createLobby}
                className="bg-white text-orange-600 hover:bg-orange-100 font-bold py-2 px-6 rounded-lg text-lg shadow transition mb-2"
              >
                Lobby mit Code erstellen
              </button>
              <div className="text-white">Erstelle eine neue Lobby mit zufälligem Code</div>
            </div>
            {/* Privates Spiel */}
            <div className="bg-green-500 hover:bg-green-600 transition rounded-xl shadow-lg p-8 flex flex-col items-center">
              <div className="text-3xl font-extrabold text-white mb-4">Privates Spiel</div>
              <input
                type="text"
                placeholder="Lobby-Code eingeben"
                value={lobbyName}
                onChange={(e) => setLobbyName(e.target.value.toUpperCase())}
                className="w-full p-3 mb-3 rounded bg-green-100 text-green-900 placeholder-green-400 focus:outline-none focus:ring-2 focus:ring-green-300 text-center text-lg font-mono tracking-widest"
                maxLength={8}
              />
              <button
                onClick={joinLobby}
                className="bg-white text-green-600 hover:bg-green-100 font-bold py-2 px-6 rounded-lg text-lg shadow transition"
              >
                Lobby beitreten
              </button>
              <div className="text-white mt-2">Tritt einer bestehenden Lobby bei</div>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="bg-gray-900 p-8 rounded-lg shadow-2xl w-full max-w-md flex flex-col items-center">
          <div
            className="text-2xl font-bold mb-2 text-center text-white cursor-pointer select-all"
            title="Klicken zum Kopieren"
            onClick={handleCopy}
          >
            Lobby-Code: <span className="font-mono text-yellow-400">{lobbyName}</span>
          </div>
          <div className="text-white text-lg mb-2">
            Spieler: {lobbyPlayers.length}/10
          </div>
          <h2 className="text-lg font-semibold mb-2 text-white">Spieler:</h2>
          <ul className="mb-4 w-full">
            {lobbyPlayers.map((player, index) => (
              <li key={`${player.id}-${index}`} className="text-gray-200 text-lg py-1 px-2 rounded bg-gray-800 mb-1">
                {player.name}
              </li>
            ))}
          </ul>
          {isHost && (
            <button
              onClick={startGame}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded w-full transition duration-200 text-lg"
            >
              Spiel starten
            </button>
          )}
          {!isHost && (
            <div className="text-gray-400 mt-2">Warte auf den Host...</div>
          )}
        </div>
      )}

      {/* MODERNES POPUP */}
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
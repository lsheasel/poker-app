import { useState, useEffect, useRef } from 'react';
import socket from "../socket";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDiscord, 
  faTwitter 
} from '@fortawesome/free-brands-svg-icons';
import { 
  faBars, 
  faTimes, 
  faQuestionCircle, 
  faVolumeUp, 
  faVolumeMute, 
  faCopy, 
  faCrown, 
  faUser,
  faGamepad,
  faUsers,
  faFire,
  faGem,
  faRandom,
  faChevronRight,
  faChevronDown,
  faChevronUp,
  faTrophy,
  faShieldAlt,
  faCoins
} from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from "react-router-dom";
import Avatar from './Avatar'
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

let lobbyAudio = null;

function playLobbyMusic() {
  if (lobbyAudio) {
    lobbyAudio.pause();
    lobbyAudio.currentTime = 0;
  }
  lobbyAudio = new window.Audio("/game.mp3");
  lobbyAudio.volume = 0.1;
  lobbyAudio.loop = true;
  lobbyAudio.play().catch(err => console.log("Audio playback prevented:", err));
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

const Multiplayer = ({ onStartGame }) => {
  const [lobbyName, setLobbyName] = useState("");
  const [playerName, setPlayerName] = useState("Player Name");
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [inLobby, setInLobby] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [popup, setPopup] = useState({ open: false, message: "", type: "info" });
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [muted, setMuted] = useState(localStorage.getItem("muted") === "true");
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [showLoginTooltip, setShowLoginTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatar_url, setAvatarUrl] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [gameMode, setGameMode] = useState("standard"); // standard, tournament, casual
  const [lobbySettings, setLobbySettings] = useState({
    startingChips: 1000,
    blindIncrease: false,
    blindTime: 5, // minutes
    turnTime: 30, // seconds
  });
  const [showSettings, setShowSettings] = useState(false);
  
  const { session, signOut } = UserAuth();
  
  // Animated card suits for background
  const suitSymbols = ["♠", "♥", "♦", "♣"];
  
  useEffect(() => {
    // If user is logged in, get avatar from session
    if (session?.user?.user_metadata?.avatar_url) {
      setAvatarUrl(session.user.user_metadata.avatar_url);
    }
  }, [session]);

  useEffect(() => {
    const checkName = async () => {
      const { data, error } = await supabase.auth.getUser();
      const user = data?.user;

      if (user) {
        // Logged in - use name from user_metadata
        const name =
          user.user_metadata?.first_name ||
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          "Player";
        setPlayerName(name);
        localStorage.setItem("playerName", name);
      } else {
        // Not logged in - use name from localStorage
        const storedName = localStorage.getItem("playerName") || "";
        setPlayerName(storedName);
      }
    };

    checkName();
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      
      if (data?.user) {
        // If the user is logged in, hide input field
        setIsVisible(false);
      } else {
        // If user is not logged in, show input field
        setIsVisible(true);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (!muted) {
      playLobbyMusic();
    }
    return () => stopLobbyMusic();
  }, [muted]);

  useEffect(() => {
    localStorage.setItem("playerName", playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem("muted", muted);
    if (muted) {
      stopLobbyMusic();
    } else {
      playLobbyMusic();
    }
  }, [muted]);

  useEffect(() => {
    const handlePlayerJoined = (players) => {
      setLobbyPlayers(players);
      setInLobby(true);
      setIsLoading(false);
    };

    const handleGameStarted = () => {
      stopLobbyMusic();
      onStartGame({
        lobbyName,
        playerName,
        avatar_url,
        playerId: socket.id,
        isHost,
        gameSettings: lobbySettings,
        gameMode
      });
    };

    const handleError = (message) => {
      setPopup({ open: true, message, type: "error" });
    };

    socket.on("playerJoined", handlePlayerJoined);
    socket.on("gameStarted", handleGameStarted);
    socket.on("error", handleError);

    return () => {
      socket.off("playerJoined", handlePlayerJoined);
      socket.off("gameStarted", handleGameStarted);
      socket.off("error", handleError);
    };
  }, [lobbyName, onStartGame, isHost, playerName, avatar_url, lobbySettings, gameMode]);

  const createLobby = () => {
    if (!playerName.trim()) {
      setPopup({ open: true, message: "Please enter your name!", type: "error" });
      return;
    }
    const code = generateLobbyCode();
    setLobbyName(code);
    socket.emit("createLobby", code, playerName, avatar_url);

    setIsLoading(true);

    socket.once("lobbyCreated", () => {
      setIsLoading(false);
      setLobbyPlayers([{ id: socket.id, name: playerName, avatar_url: avatar_url}]);
      setInLobby(true);
      setIsHost(true);
      setPopup({ open: true, message: "Lobby created successfully!", type: "success" });
    });
  };

  const joinLobby = () => {
    if (!playerName.trim()) {
      setPopup({ open: true, message: "Please enter your name!", type: "error" });
      return;
    }
    if (!lobbyName.trim()) {
      setPopup({ open: true, message: "Please enter a lobby code!", type: "error" });
      return;
    }
    setIsLoading(true);

    socket.emit("joinLobby", lobbyName, playerName, avatar_url);
  };

  const startGame = () => {
    if (!isHost) {
      setPopup({ open: true, message: "Only the host can start the game!", type: "error" });
      return;
    }
    if (lobbyPlayers.length < 2) {
      setPopup({ open: true, message: "At least 2 players needed to start!", type: "error" });
      return;
    }
    if (lobbyPlayers.length > 10) {
      setPopup({ open: true, message: "Maximum 10 players allowed!", type: "error" });
      return;
    }
    
    // In the future, you would send the game settings here as well
    socket.emit("startGame", lobbyName, lobbySettings, gameMode);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(lobbyName);
    setPopup({ open: true, message: "Lobby code copied to clipboard!", type: "success" });
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  const toggleHowToPlay = () => {
    setHowToPlayOpen(!howToPlayOpen);
  };

  const navigate = useNavigate();

  const SignIn = () => {
    navigate("/signin")
  };
  
  const Profile = () => {
    navigate("/profile")
  };
  
  const handleProfile = async () => {
    const { data, error } = await supabase.auth.getUser();

    if (data?.user) {
      navigate("/profile");
    } else {
      navigate('/login');
    }
  };
  
  const handleGameModeSelect = (mode) => {
    setGameMode(mode);
  };

  // Card suits floating animation component
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
              className={`absolute text-white select-none`}
              initial={{ 
                x: `${xPos}vw`, 
                y: `${yPos}vh`, 
                opacity: 0,
                scale: 0.5
              }}
              animate={{ 
                y: [`${yPos}vh`, `${yPos - 30}vh`],
                rotate: [0, 360],
                opacity: [0, opacity, opacity, 0],
                scale: [0.5, 1, 1, 0.5]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: duration,
                delay: delay,
                ease: "easeInOut",
                times: [0, 0.2, 0.8, 1]
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-x-hidden">
      {/* Animated Background */}
      <FloatingSymbols />
      
      {/* Fixed background card table texture */}
      <div className="absolute inset-0 bg-green-900 opacity-10 pointer-events-none" 
           style={{backgroundImage: 'url("/poker-felt-texture.jpg")', backgroundSize: 'cover'}}></div>
      
      {/* Top glow */}
      <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-3/4 h-64 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>

      {/* Navbar */}
      <nav className="w-full bg-gray-900 bg-opacity-90 backdrop-blur-lg fixed top-0 left-0 z-50 px-6 py-3 border-b border-blue-900">
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
              <a href="/" className="text-white font-bold text-2xl select-none">Poker4Fun</a>
            </div>
            <button 
              onClick={toggleMute} 
              className="ml-4 text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              <FontAwesomeIcon icon={muted ? faVolumeMute : faVolumeUp} />
            </button>
          </div>
          
          <div className="md:hidden">
            <button 
              onClick={() => setNavbarOpen(!navbarOpen)} 
              className="text-white text-xl p-2 focus:outline-none rounded-lg hover:bg-gray-800"
              aria-label="Toggle menu"
            >
              <FontAwesomeIcon icon={navbarOpen ? faTimes : faBars} />
            </button>
          </div>
          
          <div className={`absolute md:relative top-full left-0 w-full md:w-auto p-4 md:p-0 bg-gray-900 md:bg-transparent transition-all duration-300 transform ${navbarOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'} md:translate-y-0 md:opacity-100 md:pointer-events-auto z-20`}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <a href="/play" className="flex items-center gap-2 text-white hover:text-blue-300 transition">
                <FontAwesomeIcon icon={faGamepad} className="text-blue-400" />
                <span>Multiplayer</span>
              </a>
              <button onClick={toggleHowToPlay} className="flex items-center gap-2 text-white hover:text-blue-300 transition">
                <FontAwesomeIcon icon={faQuestionCircle} className="text-blue-400" />
                <span>How to Play</span>
              </button>
              <div className="flex gap-3">
                <a
                  href="https://discord.gg/tCCdfJyZEp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center"
                  aria-label="Discord"
                >
                  <FontAwesomeIcon icon={faDiscord} className="text-lg" />
                </a>
                
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <button 
                    className="bg-gray-800 rounded-full border-2 border-blue-500 shadow-md shadow-blue-500/20"
                    onClick={handleProfile}
                  >
                    <Avatar
                      url={avatar_url}
                      size={36}
                      isEditable={false}
                    />                    
                  </button>                                
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mt-24 w-full flex flex-col items-center justify-center p-4">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center mb-2"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 drop-shadow-lg tracking-tight text-center">
              Poker4Fun
            </h1>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-xl"
          >
            <p className="text-xl text-gray-200 mb-2 text-center">
              Play poker with friends – free & online!
            </p>
            <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-2 text-center">
              <p className="text-sm text-red-200">
                This is a Beta! It may contain bugs and errors.
                Please report any issues to our Discord Server.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Lobby Section */}
        {!inLobby ? (
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-4xl">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 flex flex-col items-center w-full md:w-80 mb-8 md:mb-0 border border-blue-800"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative w-24 h-24 mb-6"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-70 blur-md"></div>
                <div className="absolute inset-0 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <Avatar
                    url={avatar_url}
                    size={88}
                    isEditable={false}
                  />
                </div>
              </motion.div>
              
              {isVisible && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="w-full"
                >
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full p-3 mb-4 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-lg transition-all"
                    maxLength={16}
                  />
                </motion.div>
              )}
              
              <div className="bg-blue-900 bg-opacity-50 px-4 py-2 rounded-lg mt-2">
                <div className="text-white font-medium text-lg">
                  {playerName || "Player Name"}
                </div>
              </div>
            </motion.div>

            {/* Game Options */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col gap-4 w-full max-w-md"
            >
              {/* Game Mode Selection */}
              <div className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-xl shadow-xl p-4 border border-blue-900">
                <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                  <FontAwesomeIcon icon={faGamepad} className="mr-2 text-blue-400" />
                  Select Game Mode
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleGameModeSelect('standard')}
                    className={`p-3 rounded-lg flex flex-col items-center transition-all ${
                      gameMode === 'standard' 
                        ? 'bg-blue-700 border-2 border-blue-400 shadow-lg shadow-blue-700/50' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <FontAwesomeIcon icon={faCoins} className="text-xl mb-1 text-yellow-400" />
                    <span className="text-white font-medium">Standard</span>
                  </button>
                  
                  <button
                    onClick={() => handleGameModeSelect('tournament')}
                    className={`p-3 rounded-lg flex flex-col items-center transition-all ${
                      gameMode === 'tournament' 
                        ? 'bg-blue-700 border-2 border-blue-400 shadow-lg shadow-blue-700/50' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <FontAwesomeIcon icon={faTrophy} className="text-xl mb-1 text-yellow-400" />
                    <span className="text-white font-medium">Tournament</span>
                  </button>
                  
                  <button
                    onClick={() => handleGameModeSelect('casual')}
                    className={`p-3 rounded-lg flex flex-col items-center transition-all ${
                      gameMode === 'casual' 
                        ? 'bg-blue-700 border-2 border-blue-400 shadow-lg shadow-blue-700/50' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <FontAwesomeIcon icon={faUsers} className="text-xl mb-1 text-blue-400" />
                    <span className="text-white font-medium">Casual</span>
                  </button>
                </div>
              </div>

              {/* Quick Game */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl shadow-2xl p-6 flex flex-col items-center border border-blue-600"
              >
                <div className="flex justify-between items-center w-full mb-4">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faRandom} className="text-blue-300 text-xl mr-3" />
                    <h3 className="text-2xl font-bold text-white">Quick Game</h3>
                  </div>
                  <div className="bg-blue-800 rounded-full px-3 py-1 text-xs text-blue-200">
                    {gameMode.toUpperCase()}
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={createLobby}
                  className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-3 px-8 rounded-xl text-lg shadow-lg transition-all w-full flex justify-center items-center"
                >
                  <span>Create Lobby</span>
                  <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                </motion.button>
                <div className="text-blue-200 mt-2 text-sm">Random lobby code will be generated</div>
              </motion.div>

              {/* Private Game */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-xl shadow-2xl p-6 flex flex-col items-center border border-purple-600"
              >
                <div className="flex justify-between items-center w-full mb-4">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faUsers} className="text-purple-300 text-xl mr-3" />
                    <h3 className="text-2xl font-bold text-white">Private Game</h3>
                  </div>
                  <div className="bg-purple-800 rounded-full px-3 py-1 text-xs text-purple-200">
                    {gameMode.toUpperCase()}
                  </div>
                </div>
                
                <input
                  type="text"
                  placeholder="Enter Lobby Code"
                  value={lobbyName}
                  onChange={(e) => setLobbyName(e.target.value.toUpperCase())}
                  className="w-full p-3 mb-3 rounded-xl bg-purple-800 bg-opacity-50 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-center text-lg font-mono tracking-widest shadow-inner border border-purple-700"
                  maxLength={8}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={joinLobby}
                  className="bg-white text-purple-700 hover:bg-purple-50 font-bold py-3 px-8 rounded-xl text-lg shadow-lg transition-all w-full flex justify-center items-center"
                >
                  <span>Join Lobby</span>
                  <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                </motion.button>
                <div className="text-purple-200 mt-2 text-sm">Join an existing game lobby</div>
              </motion.div>
            </motion.div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 bg-opacity-90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-blue-800"
          >
            {/* Lobby Header */}
            <div className="flex flex-col items-center mb-6">
              <div className="bg-blue-900 bg-opacity-50 rounded-lg px-4 py-2 mb-3 flex items-center justify-center">
                <span className="text-sm text-blue-200 uppercase tracking-wider mr-2">Mode:</span>
                <span className="text-lg font-semibold text-white">{gameMode}</span>
              </div>
              
              <div
                className="flex items-center gap-2 bg-gray-700 px-4 py-3 rounded-lg mb-2 cursor-pointer hover:bg-gray-600 transition-all w-full justify-center"
                title="Click to copy"
                onClick={handleCopy}
              >
                <span className="text-lg font-bold text-white">Lobby Code:</span>
                <span className="font-mono text-yellow-300 text-xl select-all">{lobbyName}</span>
                <FontAwesomeIcon icon={faCopy} className="text-gray-400 ml-2" />
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-white text-lg">
                  Players: <span className="text-blue-300 font-bold">{lobbyPlayers.length}/10</span>
                </div>
              </div>
            </div>
            
            {/* Lobby Settings (only visible to host) */}
            {isHost && (
              <div className="mb-6">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center justify-between w-full bg-blue-800 bg-opacity-50 hover:bg-blue-700 rounded-lg px-4 py-3 text-white font-semibold transition-all"
                >
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faGem} className="mr-2 text-blue-300" />
                    <span>Game Settings</span>
                  </div>
                  <FontAwesomeIcon icon={showSettings ? faChevronUp : faChevronDown} />
                </button>
                
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-700 bg-opacity-50 rounded-lg mt-2 p-4 border border-gray-600"
                  >
                    <div className="grid gap-4">
                      <div>
                        <label className="text-gray-300 text-sm mb-1 block">Starting Chips</label>
                        <select 
                          value={lobbySettings.startingChips}
                          onChange={(e) => setLobbySettings({...lobbySettings, startingChips: parseInt(e.target.value)})}
                          className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                        >
                          <option value="500">500 Chips</option>
                          <option value="1000">1000 Chips</option>
                          <option value="2000">2000 Chips</option>
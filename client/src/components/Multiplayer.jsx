import { useState, useEffect, useRef } from 'react';
import socket from "../socket";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord, faTwitter } from '@fortawesome/free-brands-svg-icons';
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
import Signin from './Signin';
import { Link, useNavigate } from "react-router-dom";
import Avatar from './Avatar'
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import CardSuitsBackground from './CardSuitsBackground';
// Pfad ggf. anpassen
import blockedData from '../assets/blocked_names.json';


let lobbyAudio = null;

function playLobbyMusic() {
  if (lobbyAudio) {
    lobbyAudio.pause();
    lobbyAudio.currentTime = 0;
  }
  lobbyAudio = new window.Audio("/game.mp3");
  lobbyAudio.volume = 0.1;
  lobbyAudio.loop = true;
}



const leetMap = {
  a: "[a4@]",
  b: "[b8]",
  c: "[c(\\[\\{<]",
  e: "[e3€]",
  f: "[fph]",
  g: "[g69]",
  i: "[i1!|]",
  l: "[l1|!]",
  o: "[o0]",
  s: "[s5$]",
  t: "[t7+]",
  z: "[z2]",
  n: "[n]",
  r: "[r]",
  u: "[u]",
  d: "[d]",
  h: "[h]",
  k: "[k]",
  m: "[m]",
  p: "[p]",
  q: "[q]",
  v: "[v]",
  w: "[w]",
  x: "[x]",
  y: "[y]",
  j: "[j]",
};

const wordToRegex = (word) => {
  return word
    .toLowerCase()
    .split("")
    .map((c) => leetMap[c] || c)
    .join("");
};

const badWordRegexes = blockedData.blocked_usernames.map(
  (w) => new RegExp(wordToRegex(w), "i")
);

const normalize = (str) => {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

const isBlockedUsername = (name) => {
  const normalized = normalize(name);
  return badWordRegexes.some((regex) => regex.test(normalized));
};



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
  const [avatar_urls, setAvatarUrls] = useState(null);
  
  const { session, signOut } = UserAuth();
  useEffect(() => {
  // Wenn der Benutzer eingeloggt ist, holen wir das Avatar-Bild aus der session
  if (session?.user?.user_metadata?.avatar_url) {
    setAvatarUrl(session.user.user_metadata.avatar_url);
  }
}, [session]);



  
useEffect(() => {
  const checkName = async () => {
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;

    if (user) {
      // Eingeloggt – Namen aus user_metadata übernehmen
      const name =
        user.user_metadata?.first_name ||
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        "Player";
      setPlayerName(name);
      localStorage.setItem("playerName", name); // 🔒 Speichern für spätere Reloads
    } else {
      // Nicht eingeloggt – Name aus localStorage oder leer
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
        // Wenn der Benutzer eingeloggt ist, setze isVisible auf false
        setIsVisible(false);  // Versteckt das Input-Feld
      } else {
        // Wenn der Benutzer nicht eingeloggt ist, setze isVisible auf true
        setIsVisible(true);   // Zeigt das Input-Feld
      }
    };
    checkUser(); // Überprüft den Benutzerstatus bei jedem Laden der Seite
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
  }, [lobbyName, onStartGame, isHost, playerName, avatar_url]);

  const createLobby = () => {
  if (!playerName.trim()) {
    setPopup({ open: true, message: "Please enter your name!", type: "error" });
    return;
  }

  if (isBlockedUsername(playerName)) {
    setPopup({ open: true, message: "This username is not allowed!", type: "error" });
    return;
  }

  const code = generateLobbyCode();
  setLobbyName(code);
  socket.emit("createLobby", code, playerName, avatar_url);

  setIsLoading(true);

  socket.once("lobbyCreated", () => {
    setIsLoading(false);
    setLobbyPlayers([{ id: socket.id, name: playerName, avatar_url: avatar_url }]);
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

  if (isBlockedUsername(playerName)) {
    setPopup({ open: true, message: "This username is not allowed!", type: "error" });
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
    socket.emit("startGame", lobbyName);
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
    // Überprüfen, ob der Benutzer authentifiziert ist
    const { data, error } = await supabase.auth.getUser();

    if (data?.user) {
      // Wenn der Benutzer eingeloggt ist, leite ihn zu Discord weiter
      navigate("/profile"); // Ersetze '/profile' mit deiner gewünschten Route
    } else {
      // Wenn der Benutzer nicht eingeloggt ist, leite ihn zur Login-Seite weiter
      navigate('/login'); // Ersetze '/login' mit deiner Login-Route
    }
  };
  const handleMultiplayer = async () => {
    // Überprüfen, ob der Benutzer authentifiziert ist
    const { data, error } = await supabase.auth.getUser();

    if (data?.user) {
      // Wenn der Benutzer eingeloggt ist, leite ihn zu Discord weiter
      navigate("/play"); // Ersetze '/profile' mit deiner gewünschten Route
    } else {
      // Wenn der Benutzer nicht eingeloggt ist, leite ihn zur Login-Seite weiter
      navigate('/'); // Ersetze '/login' mit deiner Login-Route
    }
  };
  const handleName = async () => {
    // Überprüfen, ob der Benutzer authentifiziert ist
    const { data, error } = await supabase.auth.getUser();

    if (data?.user) {
      // Wenn der Benutzer eingeloggt ist, leite ihn zu Discord weiter
      setIsVisible(false); // Ersetze '/profile' mit deiner gewünschten Route
    } else {
      // Wenn der Benutzer nicht eingeloggt ist, leite ihn zur Login-Seite weiter
      setIsVisible(true); // Ersetze '/login' mit deiner Login-Route
    }
  };
  useEffect(() => {
  const checkUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (!data?.user) {
      navigate('/');
    }
  };
  checkUser();
}, [navigate]);

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
  

  // Logo component inline
  const PokerLogo = () => (
    <svg width="32" height="32" viewBox="0 0 64 64" className="mr-2">
      <g>
        <rect x="10" y="12" width="44" height="40" rx="4" fill="#2d3748" />
        <rect x="14" y="8" width="36" height="40" rx="4" fill="#4a5568" />
        <rect x="18" y="4" width="28" height="40" rx="4" fill="#667eea" />
        <text x="32" y="30" textAnchor="middle" fontSize="22" fontWeight="bold" fill="white">P4F</text>
      </g>
    </svg>
  );
  return (
    

    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-x-hidden">
      <FloatingSymbols />
      
      {/* Fixed background card table texture */}
      <div className="absolute inset-0 bg-green-900 opacity-10 pointer-events-none" 
           style={{backgroundImage: 'url("/poker-felt-texture.jpg")', backgroundSize: 'cover'}}></div>
      
      {/* Top glow */}
      <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-3/4 h-64 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>

      {/* Navbar */}
      <nav className="w-full bg-gray-900 bg-opacity-80 backdrop-blur-lg fixed top-0 left-0 z-50 px-6 py-4">
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
              <a href="/" className="text-white font-bold text-2xl">Poker4Fun</a>
            </div>
          </div>
          
          <div className="md:hidden">
            <button 
              onClick={() => setNavbarOpen(!navbarOpen)} 
              className="text-white text-2xl focus:outline-none"
              aria-label="Toggle menu"
            >
              <FontAwesomeIcon icon={navbarOpen ? faTimes : faBars} />
            </button>
          </div>
          
          <div className={`absolute md:relative top-full left-0 w-full md:w-auto p-4 md:p-0 bg-gray-900 md:bg-transparent transition-all duration-300 transform ${navbarOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'} md:translate-y-0 md:opacity-100 md:pointer-events-auto z-20`}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <button
                  onClick={handleMultiplayer}
                  className='flex items-center gap-2 text-white hover:text-blue-300 transition'
                  >
                <FontAwesomeIcon icon={faGamepad} className="text-blue-400" />
                Multiplayer
              </button>
              <div className="flex gap-3">
                <a
  href="https://discord.gg/tCCdfJyZEp"
  target="_blank"
  rel="noopener noreferrer"
  className="w-[38px] h-[38px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center"
  aria-label="Discord"
>
  <FontAwesomeIcon icon={faDiscord} className="w-[26px] h-[26px]" />
</a>

                
                <div className="relative">
                  <button 
                    className="bg-gray-700 rounded-full border border-gray-500 p-0.5 shadow-sm"
                    onClick={handleProfile}
                  >
                    <Avatar
                      url={avatar_url} // Sollte hier die URL vom User-Avatar übergeben werden
                      size={32}
                      isEditable={false}
                    />                    
                  </button>                                
                </div>
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
                Please report any issues to our Discord Server or to this Email: info@poker4fun.xyz
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

            {/* Lobby Actions */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col gap-6 w-full max-w-md"
            >
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
            className="bg-gray-800 bg-opacity-80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col items-center border border-gray-700"
          >
            <div
              className="flex items-center gap-2 bg-gray-700 px-4 py-2 rounded-lg mb-4 cursor-pointer hover:bg-gray-600 transition-all"
              title="Click to copy"
              onClick={handleCopy}
            >
              <span className="text-2xl font-bold text-white">Lobby Code:</span>
              <span className="font-mono text-yellow-300 text-2xl select-all">{lobbyName}</span>
              <FontAwesomeIcon icon={faCopy} className="text-gray-400 ml-2" />
            </div>
            
            <div className="text-white text-lg mb-4">
              Players: <span className="text-blue-300 font-bold">{lobbyPlayers.length}/10</span>
            </div>
            
            <h2 className="text-xl font-semibold mb-3 text-white">Players:</h2>
            <ul className="mb-6 w-full space-y-2">
              {lobbyPlayers.map((player, index) => (
                <li 
                  key={`${player.id}-${index}`} 
                  className={`text-gray-200 text-lg py-2 px-4 rounded-lg flex justify-between items-center ${
                    player.id === socket.id 
                      ? "bg-gradient-to-r from-blue-800 to-blue-900 border border-blue-600" 
                      : "bg-gray-700"
                  }`}
                >
                  <span>{player.name}</span>
                  {player.id === socket.id && 
                    <span className="text-yellow-300 text-sm font-bold">(You)</span>
                  }
                  {isHost && player.id === socket.id && 
                    <FontAwesomeIcon icon={faCrown} className="text-yellow-400 ml-2" title="Host" />
                  }
                </li>
              ))}
            </ul>
            
            {isHost ? (
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 px-6 rounded-xl w-full transition duration-300 text-lg shadow-lg transform hover:scale-105"
              >
                Start Game
              </button>
            ) : (
              <div className="text-gray-300 mt-2 bg-gray-700 px-4 py-3 rounded-lg w-full text-center">
                Waiting for host to start the game...
              </div>
            )}
          </motion.div>
        )}


<AnimatePresence>
  {isLoading && (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-gray-800 rounded-xl shadow-2xl p-8 flex flex-col items-center max-w-md mx-4 border border-gray-700"
      >
        <div className="mb-4">
          <motion.div
            animate={{ 
              rotate: 360,
              transition: { 
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }
            }}
            className="text-5xl text-blue-400"
          >
            ♠
          </motion.div>
        </div>
        <div className="text-white text-lg font-medium mb-2">
          {inLobby ? "Joining Lobby..." : "Creating Lobby..."}
        </div>
        <div className="flex mt-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{
              repeat: Infinity,
              duration: 1,
              delay: 0,
              ease: "easeInOut"
            }}
            className="w-3 h-3 rounded-full bg-blue-400 mx-1"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{
              repeat: Infinity,
              duration: 1,
              delay: 0.2,
              ease: "easeInOut"
            }}
            className="w-3 h-3 rounded-full bg-blue-400 mx-1"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{
              repeat: Infinity,
              duration: 1,
              delay: 0.4,
              ease: "easeInOut"
            }}
            className="w-3 h-3 rounded-full bg-blue-400 mx-1"
          />
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

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
                  popup.type === "error" ? "border-red-500" :
                  popup.type === "success" ? "border-green-500" : "border-blue-500"
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

        {/* How to Play Modal */}
        <AnimatePresence>
          {howToPlayOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700"
              >
                <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">How to Play Poker4Fun</h2>
                  <button 
                    onClick={toggleHowToPlay}
                    className="text-gray-400 hover:text-white text-2xl"
                    aria-label="Close"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-grow text-gray-200">
                  <div className="max-w-3xl space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-blue-400 mb-2">Getting Started</h3>
                      <p>Welcome to Poker4Fun! Here's how to get started with our Texas Hold'em poker game:</p>
                      <ol className="list-decimal ml-6 mt-2 space-y-2">
                        <li>Enter your name and create a new lobby or join an existing one with a lobby code</li>
                        <li>Share the lobby code with friends who want to join your game</li>
                        <li>Once everyone has joined, the host can start the game</li>
                        <li>Each player starts with 1000 chips</li>
                      </ol>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-blue-400 mb-2">Game Rules</h3>
                      <p>Poker4Fun follows standard Texas Hold'em rules:</p>
                      <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li>The game is played with a standard 52-card deck</li>
                        <li>Each player is dealt two private cards (known as 'hole cards')</li>
                        <li>Five community cards are dealt face-up on the "board"</li>
                        <li>Players use their hole cards and the community cards to make the best possible five-card poker hand</li>
                        <li>The player with the best hand at showdown wins the pot</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-blue-400 mb-2">Betting Rounds</h3>
                      <p>There are four betting rounds:</p>
                      <ol className="list-decimal ml-6 mt-2 space-y-2">
                        <li><strong>Pre-flop:</strong> After receiving hole cards, players can call, raise, or fold</li>
                        <li><strong>Flop:</strong> Three community cards are dealt face-up</li>
                        <li><strong>Turn:</strong> A fourth community card is dealt face-up</li>
                        <li><strong>River:</strong> A fifth and final community card is dealt face-up</li>
                      </ol>
                      <p className="mt-2">After the final betting round, all remaining players show their cards and the best hand wins.</p>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-blue-400 mb-2">Hand Rankings</h3>
                      <p>From highest to lowest:</p>
                      <ol className="list-decimal ml-6 mt-2 space-y-1">
                        <li><strong>Royal Flush:</strong> A, K, Q, J, 10 of the same suit</li>
                        <li><strong>Straight Flush:</strong> Five consecutive cards of the same suit</li>
                        <li><strong>Four of a Kind:</strong> Four cards of the same rank</li>
                        <li><strong>Full House:</strong> Three cards of one rank and two of another</li>
                        <li><strong>Flush:</strong> Five cards of the same suit</li>
                        <li><strong>Straight:</strong> Five consecutive cards of any suit</li>
                        <li><strong>Three of a Kind:</strong> Three cards of the same rank</li>
                        <li><strong>Two Pair:</strong> Two cards of one rank and two of another</li>
                        <li><strong>One Pair:</strong> Two cards of the same rank</li>
                        <li><strong>High Card:</strong> Highest card in your hand</li>
                      </ol>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-blue-400 mb-2">Game Controls</h3>
                      <p>During the game, you'll have the following options:</p>
                      <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li><strong>Check:</strong> Pass the action to the next player (only available if no one has bet)</li>
                        <li><strong>Call:</strong> Match the current bet</li>
                        <li><strong>Bet/Raise:</strong> Increase the amount that others need to call</li>
                        <li><strong>Fold:</strong> Discard your hand and forfeit interest in the current pot</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-blue-400 mb-2">Tips for Beginners</h3>
                      <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li>Start conservative - don't play every hand</li>
                        <li>Pay attention to your position at the table</li>
                        <li>Watch how your opponents play</li>
                        <li>Manage your chips wisely</li>
                        <li>Have fun! Poker is a game of skill AND luck</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 px-6 py-4 flex justify-end">
                  <button 
                    onClick={toggleHowToPlay}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition shadow-lg"
                  >
                    Got it!
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-16 text-gray-400 text-sm opacity-80 text-center">
          © 2025 Poker4Fun – Play responsibly. No real money involved.
        </div>
      </div>
    </div>
  );
};

export default Lobby;

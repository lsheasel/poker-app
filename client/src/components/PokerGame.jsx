import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import socket from '../socket';
import { stopLobbyMusic } from './Lobby';
import Avatar from './Avatar';
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBars, faTimes, faQuestionCircle, faVolumeUp, faVolumeMute, faCopy, faCrown, faUser,
  faGamepad, faUsers, faFire, faGem, faRandom, faChevronRight, faChevronDown, faChevronUp,
  faTrophy, faShieldAlt, faAdjust, faCoins
} from '@fortawesome/free-solid-svg-icons';
import { faDiscord, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

// Audio management
let tableAudio = null;
let audioEnabled = true;

function playTableMusic() {
  if (!audioEnabled) return;
  if (tableAudio) {
    tableAudio.pause();
    tableAudio.currentTime = 0;
  }
  tableAudio = new window.Audio("/table.mp3");
  tableAudio.volume = 0.1;
  tableAudio.loop = true;
}

function stopTableMusic() {
  if (tableAudio) {
    tableAudio.pause();
    tableAudio.currentTime = 0;
    tableAudio = null;
  }
}

function toggleTableMusic() {
  audioEnabled = !audioEnabled;
  if (audioEnabled) playTableMusic();
  else stopTableMusic();
  return audioEnabled;
}

const playSoundEffect = (type) => {
  if (!audioEnabled) return;
  const effects = {
    bet: "/sounds/chip.mp3",
    win: "/sounds/win.mp3",
    deal: "/sounds/card_deal.mp3",
    fold: "/sounds/fold.mp3",
    error: "/sounds/error.mp3",
    buttonClick: "/sounds/click.mp3"
  };
  const sound = new window.Audio(effects[type] || effects.buttonClick);
  sound.volume = 0.2;
};

const Card = ({ card, index, delay = 0, type = 'community', faceDown = false, cardSkin = 'modern' }) => {
  const initialY = type === 'player' ? 100 : -100;

  // Wert-Umwandlung: Ass = 1, Zahlen = Zahl, Bildkarten = J/Q/K
  const valueMap = {
    'A': '1',
    'K': 'K',
    'Q': 'Q',
    'J': 'J',
    '10': '10',
    '9': '9',
    '8': '8',
    '7': '7',
    '6': '6',
    '5': '5',
    '4': '4',
    '3': '3',
    '2': '2',
    1: '1'
  };

  // Farb-Ordner und Buchstabe
  const suitMap = {
    clubs: 'c',
    spades: 's',
    hearts: 'h',
    diamonds: 'd'
  };

  const suitFolder = card.suit?.toLowerCase();
  const suitLetter = suitMap[suitFolder] || 'c';
  const value = valueMap[card.value] || card.value;

  const cardImage = faceDown
    ? `/skins/${cardSkin}/back.png`
    : `/skins/${cardSkin}/${suitFolder}/${value}${suitLetter}.png`;

  useEffect(() => {
    if (delay === 0 && !faceDown) playSoundEffect('deal');
  }, [delay, faceDown]);

  return (
    <motion.div
      initial={{ y: initialY, opacity: 0, rotateY: 180 }}
      animate={{ y: 0, opacity: 1, rotateY: faceDown ? 180 : 0 }}
      transition={{ delay: delay * 0.15, duration: 0.5, type: "spring", stiffness: 120, damping: 15 }}
      className="relative bg-white rounded-lg border-2 border-gray-300 shadow-lg md:w-14 md:h-20 w-12 h-16 flex items-center justify-center overflow-hidden"
      aria-label={faceDown ? "Card back" : `${card.value} of ${card.suit}`}
    >
      <img
        src={cardImage}
        alt={faceDown ? "Card back" : `${card.value} of ${card.suit}`}
        className="w-full h-full object-cover"
        onError={(e) => { e.target.src = `/skins/${cardSkin}/back.png`; }}
      />
    </motion.div>
  );
};

const Chip = ({ amount, delay = 0 }) => {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.1, duration: 0.4, type: "spring", stiffness: 200, damping: 15 }}
      className="chip-stack relative"
      aria-label={`Chip worth $${amount}`}
    >
      <div className="absolute -top-1 -left-1 w-14 h-14 bg-yellow-600 rounded-full shadow-inner z-10 flex items-center justify-center">
        <div className="w-12 h-12 bg-yellow-500 rounded-full border-4 border-yellow-300 flex items-center justify-center text-xs font-bold text-white">
          {amount}
        </div>
      </div>
    </motion.div>
  );
};

const PlayerAvatar = ({ player, isCurrentPlayer, position, delay, isActive, lastAction, cardSkin, myPlayerId }) => {
  const isShowdown = player.hand && player.hand.length === 2;

  // Prüfe, ob der Spieler auf der rechten Seite ist
  const isRight = !!position.right;

  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 120, damping: 10 }}
      className="absolute flex flex-col items-center z-20"
      style={position}
    >
      <div className="relative flex flex-col items-center">
        {/* Karten über dem Kopf und hinter dem Avatar */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-8 z-0 flex"
          style={{ pointerEvents: "none" }}
        >
          {player.hand && player.hand.length >= 2 && (
            <>
              <div style={{ transform: "rotate(-18deg) scale(0.7)", zIndex: 1, marginRight: -18 }}>
                <Card card={player.hand[0]} index={0} delay={0} type="player" faceDown={!isShowdown || player.id !== myPlayerId} cardSkin={cardSkin} />
              </div>
              <div style={{ transform: "rotate(18deg) scale(0.7)", zIndex: 2, marginLeft: -18 }}>
                <Card card={player.hand[1]} index={1} delay={0.1} type="player" faceDown={!isShowdown || player.id !== myPlayerId} cardSkin={cardSkin} />
              </div>
            </>
          )}
        </div>
        <motion.div 
          animate={isCurrentPlayer ? { boxShadow: ['0 0 0px rgba(255,215,0,0)', '0 0 15px rgba(255,215,0,0.7)', '0 0 0px rgba(255,215,0,0)'] } : {}}
          transition={{ duration: 1.5, repeat: isCurrentPlayer ? Infinity : 0, repeatType: "loop" }}
          className={`
            rounded-full bg-gray-700 border-4 
            ${isCurrentPlayer ? "border-yellow-400" : isActive ? "border-green-400" : "border-gray-600"} 
            w-16 h-16 flex items-center justify-center relative
            text-white font-bold transition-all duration-300 z-10
          `}
        >
          <Avatar url={player.avatar_url} size={58} />
          {lastAction && (
            <div className="absolute -bottom-4 left-0 w-16 text-center">
              <div className="mx-auto bg-gray-700 text-xs py-0.5 px-2 rounded text-white">
                {lastAction}
              </div>
            </div>
          )}
        </motion.div>
        {/* Name und Chips: nach außen zeigen */}
        {isRight ? (
          // Profil rechts: Infofeld rechts außen
          <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-2 flex flex-col bg-gray-700 rounded-r-full shadow-md pl-4 pr-4 py-1 text-white min-w-[60px] items-start">
            <span className="text-xs font-medium truncate max-w-[90px]">{player.name}</span>
            <span className="text-xs font-medium">{player.chips}</span>
          </div>
        ) : (
          // Profil links: Infofeld links außen
          <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-2 flex flex-col bg-gray-700 rounded-l-full shadow-md pl-4 pr-4 py-1 text-white min-w-[60px] items-end">
            <span className="text-xs font-medium truncate max-w-[90px]">{player.name}</span>
            <span className="text-xs font-medium">{player.chips}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const Navbar = ({ lobbyName, audioEnabled, onToggleAudio, onShowHelp }) => {
  const [showLoginTooltip, setShowLoginTooltip] = useState(false);
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [avatar_url, setAvatarUrl] = useState(null);
  const navigate = useNavigate();
  const { session, signOut } = UserAuth();

  const handleMultiplayer = async () => {
    const { data, error } = await supabase.auth.getUser();
    navigate(data?.user ? "/play" : "/login");
  };

  const handleProfile = async () => {
    const { data, error } = await supabase.auth.getUser();
    navigate(data?.user ? "/profile" : "/login");
  };

  useEffect(() => {
    if (session?.user?.user_metadata?.avatar_url) {
      setAvatarUrl(session.user.user_metadata.avatar_url);
    }
  }, [session]);

  return (
    <nav className="w-full bg-gray-900 bg-opacity-80 backdrop-blur-lg fixed top-0 left-0 z-50 px-6 py-4">
      <div className="flex items-center justify-between container mx-auto">
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ rotate: -5 }}
            animate={{ rotate: 5 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
            className="text-3xl mr-2 text-white font-bold"
          >
            ♠
          </motion.div>
          <a href="/" className="text-white font-bold text-2xl">Poker4Fun</a>
        </div>
        <div className="md:hidden">
          <button onClick={() => setNavbarOpen(!navbarOpen)} className="text-white text-2xl focus:outline-none" aria-label="Toggle menu">
            <FontAwesomeIcon icon={navbarOpen ? faTimes : faBars} />
          </button>
        </div>
        <div className={`absolute md:relative top-full left-0 w-full md:w-auto p-4 md:p-0 bg-gray-900 md:bg-transparent transition-all duration-300 transform ${navbarOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'} md:translate-y-0 md:opacity-100 md:pointer-events-auto z-20`}>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex gap-3">
              <a href="https://discord.gg/tCCdfJyZEp" target="_blank" rel="noopener noreferrer" className="w-[38px] h-[38px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center" aria-label="Discord">
                <FontAwesomeIcon icon={faDiscord} className="w-[26px] h-[26px]" />
              </a>
              <button onClick={handleProfile} className="bg-gray-700 rounded-full border border-gray-500 p-0.5 shadow-sm">
                <Avatar url={avatar_url} size={32} isEditable={false} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const SettingsModal = ({ show, onClose, audioEnabled, onToggleAudio, contrastMode, onToggleContrast }) => {
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close settings">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={audioEnabled ? faVolumeUp : faVolumeMute} className="text-white" />
              <span className="text-white">Sound</span>
            </div>
            <button onClick={onToggleAudio} className={`w-12 h-6 rounded-full relative ${audioEnabled ? 'bg-green-500' : 'bg-gray-500'}`} aria-label={audioEnabled ? "Disable sound" : "Enable sound"}>
              <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all ${audioEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faAdjust} className="text-white" />
              <span className="text-white">High Contrast</span>
            </div>
            <button onClick={onToggleContrast} className={`w-12 h-6 rounded-full relative ${contrastMode ? 'bg-green-500' : 'bg-gray-500'}`} aria-label={contrastMode ? "Disable high contrast" : "Enable high contrast"}>
              <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all ${contrastMode ? 'right-0.5' : 'left-0.5'}`}></div>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const HelpModal = ({ show, onClose }) => {
  const [activeTab, setActiveTab] = useState('rules');
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="bg-gray-800 rounded-xl p-4 md:p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto shadow-2xl border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Poker Help</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close help">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="flex space-x-2 mb-4">
          <button className={`px-4 py-2 rounded-lg ${activeTab === 'rules' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`} onClick={() => setActiveTab('rules')}>
            Rules
          </button>
          <button className={`px-4 py-2 rounded-lg ${activeTab === 'hands' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`} onClick={() => setActiveTab('hands')}>
            Hand Rankings
          </button>
          <button className={`px-4 py-2 rounded-lg ${activeTab === 'controls' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`} onClick={() => setActiveTab('controls')}>
            Controls
          </button>
        </div>
        <div className="text-gray-200 space-y-4">
          {activeTab === 'rules' && (
            <>
              <h4 className="text-lg font-bold text-yellow-300">How to Play Texas Hold'em</h4>
              <p>Texas Hold'em is played with a standard 52-card deck. Each player receives two private cards, and five community cards are dealt face up.</p>
              <h5 className="font-bold text-white mt-3">Game Flow:</h5>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Blinds:</strong> The game begins with two players posting blinds (forced bets).</li>
                <li><strong>Pre-Flop:</strong> Each player is dealt two private cards, followed by a betting round.</li>
                <li><strong>Flop:</strong> Three community cards are dealt face up, followed by a betting round.</li>
                <li><strong>Turn:</strong> A fourth community card is dealt, followed by a betting round.</li>
                <li><strong>River:</strong> A fifth and final community card is dealt, followed by a final betting round.</li>
                <li><strong>Showdown:</strong> If multiple players remain, they reveal their cards and the best hand wins.</li>
              </ol>
              <h5 className="font-bold text-white mt-3">Betting Options:</h5>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Check:</strong> Pass the action to the next player (only if no bet has been made).</li>
                <li><strong>Bet:</strong> Place a wager of your choice.</li>
                <li><strong>Call:</strong> Match the current bet amount.</li>
                <li><strong>Fold:</strong> Discard your hand and exit the round.</li>
              </ul>
            </>
          )}
          {activeTab === 'hands' && (
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-yellow-300">Poker Hand Rankings</h4>
              <p>From highest to lowest:</p>
              <div className="space-y-2">
                <div className="bg-gray-700 p-3 rounded-lg"><h5 className="font-bold text-white">Royal Flush</h5><p className="text-sm">A, K, Q, J, 10 all of the same suit</p></div>
                <div className="bg-gray-700 p-3 rounded-lg"><h5 className="font-bold text-white">Straight Flush</h5><p className="text-sm">Five cards in sequence, all of the same suit</p></div>
                <div className="bg-gray-700 p-3 rounded-lg"><h5 className="font-bold text-white">Four of a Kind</h5><p className="text-sm">Four cards of the same rank</p></div>
                <div className="bg-gray-700 p-3 rounded-lg"><h5 className="font-bold text-white">Full House</h5><p className="text-sm">Three of a kind plus a pair</p></div>
                <div className="bg-gray-700 p-3 rounded-lg"><h5 className="font-bold text-white">Flush</h5><p className="text-sm">Five cards of the same suit, not in sequence</p></div>
                <div className="bg-gray-700 p-3 rounded-lg"><h5 className="font-bold text-white">Straight</h5><p className="text-sm">Five cards in sequence, not all same suit</p></div>
                <div className="bg-gray-700 p-3 rounded-lg"><h5 className="font-bold text-white">Three of a Kind</h5><p className="text-sm">Three cards of the same rank</p></div>
                <div className="bg-gray-700 p-3 rounded-lg"><h5 className="font-bold text-white">Two Pair</h5><p className="text-sm">Two different pairs</p></div>
                <div className="bg-gray-700 p-3 rounded-lg"><h5 className="font-bold text-white">Pair</h5><p className="text-sm">Two cards of the same rank</p></div>
                <div className="bg-gray-700 p-3 rounded-lg"><h5 className="font-bold text-white">High Card</h5><p className="text-sm">When no other hand applies, highest card wins</p></div>
              </div>
            </div>
          )}
          {activeTab === 'controls' && (
            <>
              <h4 className="text-lg font-bold text-yellow-300">Game Controls</h4>
              <div className="space-y-3">
                <div className="bg-gray-700 p-3 rounded-lg"><h5 className="font-bold text-white">Betting</h5><p>Enter an amount in the input field and click "Bet" to place a bet.</p></div>
                <div className="bg-gray-700 p-3 rounded-lg"><h5 className="font-bold text-white">Call</h5><p>Match the current bet to stay in the hand.</p></div>
                <div className="bg-gray-700 p-3 rounded-lg"><h5 className="font-bold text-white">Fold</h5><p>Discard your hand and forfeit the current pot.</p></div>
                <div className="bg-gray-700 p-3 rounded-lg"><h5 className="font-bold text-white">Settings</h5><p>Access settings like sound toggles and visual preferences.</p></div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const GameStageIndicator = ({ stage }) => {
  const stages = { 'preflop': 'Pre-Flop', 'flop': 'Flop', 'turn': 'Turn', 'river': 'River', 'showdown': 'Showdown' };
  return (
    <div className="absolute left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-80 px-4 py-2 rounded-full text-white font-bold text-sm border border-yellow-500">
      {stages[stage] || 'Pre-Flop'}
    </div>
  );
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const bgColor = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500' }[type] || 'bg-blue-500';
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className={`${bgColor} text-white px-4 py-2 rounded-lg shadow-lg mb-2 flex justify-between items-center`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-2"><FontAwesomeIcon icon={faTimes} /></button>
    </motion.div>
  );
};

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
  gameStage = 'preflop'
}) => {
  // Fallback für myPlayerId, falls nicht gesetzt
  let safeMyPlayerId = myPlayerId;
  if (!safeMyPlayerId) {
    if (window?.socket?.id) {
      safeMyPlayerId = window.socket.id;
    } else {
      safeMyPlayerId = "guest-" + Math.random().toString(36).substr(2, 9);
    }
  }

  const [betInput, setBetInput] = useState('');
  const [isDealing, setIsDealing] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [contrastMode, setContrastMode] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [inputError, setInputError] = useState('');
  const [betOptions, setBetOptions] = useState([]);
  const [showBetOptions, setShowBetOptions] = useState(false);
  const [lastActions, setLastActions] = useState({});
  const tableRef = useRef(null);
  const { session } = UserAuth();
  const [cardSkin, setCardSkin] = useState('modern'); // Default skin jetzt "modern"
  const navigate = useNavigate();

  // Fetch user's card skin from user_metadata
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user) {
        const userCardSkin = session.user.user_metadata?.card_skin || "modern";
        setCardSkin(userCardSkin);
      }
    };
    fetchUserData();
  }, [session]);

  // Send cardSkin when creating or joining a lobby
  useEffect(() => {
    const handleCreateLobby = (lobbyName, playerName, avatar_url, card_skin) => {
      socket.emit("createLobby", lobbyName, playerName, avatar_url, card_skin);
    };
    const handleJoinLobby = (lobbyName, playerName, avatar_url, card_skin) => {
      socket.emit("joinLobby", lobbyName, playerName, avatar_url, card_skin);
    };

    socket.on("lobbyCreated", handleCreateLobby);
    socket.on("playerJoined", handleJoinLobby);

    return () => {
      socket.off("lobbyCreated", handleCreateLobby);
      socket.off("playerJoined", handleJoinLobby);
    };
  }, [cardSkin]);

  const isMyTurn = currentPlayerId === myPlayerId;

  useEffect(() => {
    const hasSeenHelp = localStorage.getItem('poker4fun_seen_help');
    if (!hasSeenHelp && gameStarted) {
      setTimeout(() => {
        setShowHelpModal(true);
        localStorage.setItem('poker4fun_seen_help', 'true');
      }, 1500);
    }
  }, [gameStarted]);

  useEffect(() => {
    if (playerMoney > 0) {
      const options = [];
      options.push(Math.max(10, Math.floor(playerMoney * 0.05)));
      options.push(Math.max(10, Math.floor(pot * 0.25)));
      options.push(Math.max(10, Math.floor(pot * 0.5)));
      options.push(Math.max(10, Math.floor(pot * 0.75)));
      options.push(Math.max(10, pot));
      options.push(playerMoney);
      const uniqueOptions = [...new Set(options)].sort((a, b) => a - b);
      setBetOptions(uniqueOptions.filter(opt => opt <= playerMoney));
    }
  }, [pot, playerMoney]);

  useEffect(() => {
    const handleRoundEnded = ({ winnerId, pot }) => {
      const winner = players.find(p => p.id === winnerId);
      setWinnerPopup({ show: true, name: winner ? winner.name : "Unknown", amount: pot });
      setConfetti(true);
      playSoundEffect('win');
      setTimeout(() => {
        setWinnerPopup({ show: false, name: '', amount: 0 });
        setConfetti(false);
      }, 3000);
    };
    socket.on("roundEnded", handleRoundEnded);
    return () => socket.off("roundEnded", handleRoundEnded);
  }, [players]);

  useEffect(() => {
    if (playerHand.length > 0) {
      setIsDealing(true);
      setTimeout(() => setIsDealing(false), 1500);
    }
  }, [playerHand]);

  useEffect(() => {
    stopLobbyMusic();
    playTableMusic();
    return () => stopTableMusic();
  }, []);

  const handleToggleAudio = () => {
    const newAudioState = toggleTableMusic();
    setAudioEnabled(newAudioState);
  };

  const evaluateHand = (playerHand, communityCards) => {
    const allCards = [...playerHand, ...communityCards];
    if (allCards.length < 5) return "Waiting for cards...";
    const values = allCards.map(card => card.value);
    const suits = allCards.map(card => card.suit);
    const valueCounts = values.reduce((counts, value) => (counts[value] = (counts[value] || 0) + 1, counts), {});
    const counts = Object.values(valueCounts);

    if (counts.includes(4)) return "Four of a Kind";
    if (counts.includes(3) && counts.includes(2)) return "Full House";
    if (counts.includes(3)) return "Three of a Kind";
    if (counts.filter(count => count === 2).length === 2) return "Two Pair";
    if (counts.includes(2)) return "Pair";

    const suitCounts = suits.reduce((counts, suit) => (counts[suit] = (counts[suit] || 0) + 1, counts), {});
    if (Object.values(suitCounts).some(count => count >= 5)) return "Flush";

    const valueMap = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };
    const numericValues = values.map(v => valueMap[v] || parseInt(v)).sort((a, b) => a - b);
    const uniqueValues = [...new Set(numericValues)];

    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      if (uniqueValues[i + 4] - uniqueValues[i] === 4) return "Straight";
    }
    if (uniqueValues.includes(14) && uniqueValues.includes(2) && uniqueValues.includes(3) && uniqueValues.includes(4) && uniqueValues.includes(5)) return "Straight";
    return "High Card";
  };

  const handleBetSubmit = () => {
    const betAmount = parseInt(betInput);
    if (isNaN(betAmount) || betAmount <= 0) {
      setInputError("Please enter a valid bet amount");
      playSoundEffect('error');
      return;
    }
    if (betAmount > playerMoney) {
      setInputError("You don't have enough chips");
      playSoundEffect('error');
      return;
    }
    setInputError('');
    playSoundEffect('bet');
    onBet?.(betAmount);
    setBetInput('');
  };

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

  const dismissToast = (id) => setToasts(prev => prev.filter(toast => toast.id !== id));

  const [winnerPopup, setWinnerPopup] = useState({ show: false, name: '', amount: 0 });
  const renderConfetti = () => confetti ? Array.from({ length: 100 }).map((_, i) => <div key={i} className="confetti" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)` }} />) : null;

  const suitSymbols = ["♠", "♥", "♦", "♣"];
  const FloatingSymbols = () => (
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

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isMyTurn) return;
      switch (e.key.toLowerCase()) {
        case 'c': onCall?.(); break;
        case 'f': onFold?.(); break;
        case 'b': if (betInput) handleBetSubmit(); break;
        case 'enter': if (betInput) handleBetSubmit(); break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isMyTurn, betInput, onCall, onFold]);

  return (
    <div className={`flex flex-col h-screen ${contrastMode ? 'high-contrast' : ''}`}>
      <Navbar lobbyName={lobbyName} audioEnabled={audioEnabled} onToggleAudio={handleToggleAudio} onShowHelp={() => setShowHelpModal(true)} />
      <FloatingSymbols />
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-x-hidden pt-20">
        <div className="absolute inset-0 bg-green-900 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("/poker-felt-texture.jpg")', backgroundSize: 'cover' }}></div>
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-3/4 h-64 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
        {confetti && <div className="confetti-container absolute inset-0 overflow-hidden">{renderConfetti()}</div>}
        <GameStageIndicator stage={gameStage} />
        <motion.div
          ref={tableRef}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, type: "spring" }}
          className="relative w-full max-w-[600px] h-[400px] md:h-[500px] mx-auto rounded-full border-8 border-[#8B4513] shadow-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(0,120,60,1) 0%, rgba(0,80,40,1) 50%, rgba(0,60,30,1) 100%)" }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-transparent to-black opacity-30"></div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="text-white text-5xl font-bold">POKER</div>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="absolute top-[21%]  transform -translate-x-1/2 text-center z-10"
          >
            <div className="bg-green-900 text-white px-4 py-2 md:px-6 md:py-3 rounded-full shadow-lg border border-yellow-500">
              <span className="mr-2">POT:</span>
              <span className="text-yellow-300 font-bold text-xl">${pot}</span>
            </div>
            {pot > 0 && (
              <div className="chips-container flex justify-center mt-2">
                {[...Array(Math.min(5, Math.ceil(pot / 100)))].map((_, i) => <Chip key={i} delay={i} />)}
              </div>
            )}
          </motion.div>
          <div className="absolute left-1/2 top-[45%] transform -translate-x-1/2 flex space-x-1 md:space-x-3 z-10">
            {communityCards.map((card, i) => <Card key={i} card={card} index={i} delay={i} type="community" cardSkin={cardSkin} />)}
          </div>
          <div className="absolute left-1/2 bottom-12 md:bottom-16 transform -translate-x-1/2 flex space-x-2 md:space-x-4 z-20">
            {playerHand.map((card, i) => <Card key={i} card={card} index={i} delay={i} type="player" cardSkin={cardSkin} />)}
          </div>
          {playerHand.length === 2 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="absolute left-1/2 bottom-2 md:bottom-4 transform -translate-x-1/2 z-30"
            >
              <div className="bg-gray-900 text-yellow-300 px-4 py-2 md:px-6 md:py-3 rounded-full shadow-lg text-sm md:text-lg font-bold border-2 border-yellow-400">
                {evaluateHand(playerHand, communityCards)}
              </div>
            </motion.div>
          )}
          {players.map((player, idx) => (
            <PlayerAvatar
              key={player.id || idx}
              player={player}
              isCurrentPlayer={currentPlayerId === player.id}
              isActive={playerTurn === player.id}
              position={playerPositions[idx] || { left: "50%", top: "50%" }}
              delay={0.2 + idx * 0.1}
              lastAction={lastActions[player.id]}
              cardSkin={cardSkin}
              myPlayerId={safeMyPlayerId} // <-- HIER!
            />
          ))}
        </motion.div>
        <div className="fixed top-20 right-5 z-50 w-64">
          <AnimatePresence>
            {toasts.map(toast => <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => dismissToast(toast.id)} />)}
          </AnimatePresence>
        </div>
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
                animate={{ rotate: [0, 5, -5, 3, -3, 0], scale: [1, 1.05, 1, 1.05, 1] }}
                transition={{ duration: 1.5, times: [0, 0.2, 0.4, 0.6, 0.8, 1], repeat: Infinity }}
                className="bg-gradient-to-br from-yellow-400 to-pink-500 rounded-2xl shadow-2xl px-8 py-6 md:px-12 md:py-8 flex flex-col items-center border-4 border-white"
              >
                <div className="text-3xl md:text-4xl font-extrabold text-white mb-3 drop-shadow-lg">🏆 Winner!</div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">{winnerPopup.name}</div>
                <div className="text-lg md:text-xl text-white mb-3">wins the pot of</div>
                <div className="text-3xl md:text-4xl font-extrabold text-yellow-200 mb-3 tracking-wider">${winnerPopup.amount}</div>
                <div className="text-3xl">🎉</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {gameStarted && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full max-w-[600px] mx-auto flex flex-col items-center mt-4 px-4 z-30"
          >
            <div className={`
              text-white text-lg md:text-xl font-bold mb-3 px-4 py-1 md:px-6 md:py-2 rounded-full
              ${isMyTurn ? 'bg-green-600' : 'bg-gray-700'}
              transition-all duration-300
            `}>
              {isMyTurn ? "Your Turn!" : "Waiting for opponent..."}
            </div>
            <div className="flex flex-col md:flex-row w-full space-y-2 md:space-y-0 md:space-x-4 mb-2">
              <div className="flex flex-row space-x-2 md:space-x-0 md:flex-col md:space-y-2 md:w-1/3">
                <input
                  type="number"
                  value={betInput}
                  onChange={(e) => { setBetInput(e.target.value); setInputError(''); }}
                  className={`p-2 md:p-2 rounded-lg text-black w-full border-2 ${inputError ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:outline-none transition-all`}
                  placeholder="Amount"
                  disabled={!isMyTurn}
                  aria-label="Bet amount"
                />
                <div className="relative w-full">
                  <button
                    onClick={() => setShowBetOptions(!showBetOptions)}
                    disabled={!isMyTurn}
                    className={`
                      w-full bg-gray-700 text-white p-2 md:p-2 text-base md:text-sm rounded-lg flex items-center justify-between
                      ${!isMyTurn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}
                    `}
                    aria-label="Quick bet options"
                  >
                    <span>Quick Bets</span>
                    <FontAwesomeIcon icon={showBetOptions ? faChevronUp : faChevronDown} className="text-sm" />
                  </button>
                  {showBetOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute bottom-full mb-1 left-0 right-0 bg-gray-800 rounded-lg shadow-lg z-50 overflow-hidden"
                    >
                      {betOptions.map((amount, i) => (
                        <button
                          key={i}
                          onClick={() => { setBetInput(amount.toString()); setShowBetOptions(false); playSoundEffect('buttonClick'); }}
                          className="w-full text-left px-4 py-1 md:py-1 text-base md:text-sm text-white hover:bg-gray-700 transition-colors"
                        >
                          {i === betOptions.length - 1 ? 'All-in' : `$${amount}`}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
              <div className="flex justify-between md:justify-end space-x-2 md:space-x-4 md:w-2/3">
                <motion.button
                  whileHover={{ scale: isMyTurn ? 1.05 : 1 }}
                  whileTap={{ scale: isMyTurn ? 0.95 : 1 }}
                  onClick={handleBetSubmit}
                  disabled={!isMyTurn}
                  className={`
                    flex-1 md:flex-initial bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold 
                    py-2 md:py-3 px-4 md:px-6 rounded-lg shadow-lg transition-all
                    ${!isMyTurn ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-600 hover:to-blue-700'}
                  `}
                  aria-label="Place bet"
                >
                  Bet
                </motion.button>
                <motion.button
                  whileHover={{ scale: isMyTurn ? 1.05 : 1 }}
                  whileTap={{ scale: isMyTurn ? 0.95 : 1 }}
                  onClick={() => { onCall?.(); playSoundEffect('bet'); }}
                  disabled={!isMyTurn}
                  className={`
                    flex-1 md:flex-initial bg-gradient-to-r from-green-500 to-green-600 text-white font-bold 
                    py-2 md:py-3 px-4 md:px-6 rounded-lg shadow-lg transition-all
                    ${!isMyTurn ? 'opacity-50 cursor-not-allowed' : 'hover:from-green-600 hover:to-green-700'}
                  `}
                  aria-label="Call current bet"
                >
                  Call
                </motion.button>
                <motion.button
                  whileHover={{ scale: isMyTurn ? 1.05 : 1 }}
                  whileTap={{ scale: isMyTurn ? 0.95 : 1 }}
                  onClick={() => { onFold?.(); playSoundEffect('fold'); }}
                  disabled={!isMyTurn}
                  className={`
                    flex-1 md:flex-initial bg-gradient-to-r from-red-500 to-red-600 text-white font-bold 
                    py-2 md:py-3 px-4 md:px-6 rounded-lg shadow-lg transition-all
                    ${!isMyTurn ? 'opacity-50 cursor-not-allowed' : 'hover:from-red-600 hover:to-red-700'}
                  `}
                  aria-label="Fold hand"
                >
                  Fold
                </motion.button>
              </div>
            </div>
            {inputError && <div className="text-red-500 text-sm mt-1 mb-2">{inputError}</div>}
          </motion.div>
        )}
        <AnimatePresence>
          {showSettingsModal && (
            <SettingsModal
              show={showSettingsModal}
              onClose={() => setShowSettingsModal(false)}
              audioEnabled={audioEnabled}
              onToggleAudio={handleToggleAudio}
              contrastMode={contrastMode}
              onToggleContrast={() => setContrastMode(!contrastMode)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showHelpModal && <HelpModal show={showHelpModal} onClose={() => setShowHelpModal(false)} />}
        </AnimatePresence>
        <div className="fixed bottom-4 right-4 z-40">
          <button
            className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
            onClick={() => setShowSettingsModal(true)}
            aria-label="Open settings"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fall { 0% { transform: translateY(-100vh) rotate(0deg); } 100% { transform: translateY(100vh) rotate(360deg); } }
        .confetti { position: absolute; width: 10px; height: 10px; animation: fall 4s ease-out forwards; }
        .chip-stack { transform: rotate(45deg); margin: -8px 4px; }
        button:focus, input:focus { outline: 2px solid #3b82f6; outline-offset: 2px; }
      `}</style>
    </div>
  );
};

export default PokerGame;
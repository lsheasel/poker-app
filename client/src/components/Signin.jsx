import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  faBars, 
  faTimes, 
  faQuestionCircle, 
  faVolumeUp, 
  faVolumeMute, 
  faCopy, 
  faCrown, 
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
import { faDiscord, faTwitter } from '@fortawesome/free-brands-svg-icons';
import Avatar from './Avatar'

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ open: false, message: "", type: "info" });
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [avatar_url, setAvatarUrl] = useState(null);

  const { signInUser } = UserAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!email.trim()) {
      setPopup({ open: true, message: "Please enter your email address!", type: "error" });
      return;
    }
    
    if (!password) {
      setPopup({ open: true, message: "Please enter your password!", type: "error" });
      return;
    }

    setLoading(true);

    try {
      const result = await signInUser(email, password); // Call context function

      if (result.success) {
        setPopup({ open: true, message: "Sign in successful!", type: "success" });
        // Wait a bit before redirecting to show success message
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        setError(result.error.message);
        setPopup({ open: true, message: result.error.message || "Invalid email or password", type: "error" });
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setPopup({ open: true, message: "An unexpected error occurred.", type: "error" });
    } finally {
      setLoading(false);
    }
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
      <div className="w-full max-w-md mx-auto px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 drop-shadow-lg tracking-tight text-center">
              Welcome Back
            </h2>
            <p className="text-gray-300 mt-2">
              Don't have an account yet?{" "}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 transition">
                Sign up
              </Link>
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 px-4 pl-10 bg-gray-700 text-white rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                placeholder="Email address"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FontAwesomeIcon icon={faLock} className="text-gray-400" />
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 px-4 pl-10 bg-gray-700 text-white rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                placeholder="Password"
              />
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg transform hover:scale-105 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="flex items-center justify-center mt-4">
              <Link to="/" className="text-gray-400 hover:text-white transition text-sm flex items-center">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Return to Home
              </Link>
            </div>
          </form>
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

      {/* Footer */}
      <div className="mt-8 text-gray-400 text-sm opacity-80 text-center">
        © 2025 Poker4Fun – Play responsibly. No real money involved.
      </div>
    </div>
  );
};

export default Signin;
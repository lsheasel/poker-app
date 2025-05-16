  import { useState, useEffect } from "react";
  import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
  import { Link, useNavigate } from "react-router-dom";
  import { UserAuth } from "../context/AuthContext";
  import { motion, AnimatePresence } from "framer-motion";
  import Avatar from './Avatar'
  import { supabase } from "../supabaseClient";
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
  faHistory,
  faArrowLeft,
  faSignOutAlt,
  faFire,
  faGem,
  faRandom,
  faEdit,
  faCheck,
  faTimes as faCross,
  faChevronRight,
  faChevronDown,
  faChevronUp,
  faTrophy,
  faShieldAlt,
  faCoins
} from '@fortawesome/free-solid-svg-icons';


  const Profile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [userName, setUserName] = useState("");
    const [editingName, setEditingName] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [popup, setPopup] = useState({ open: false, message: "", type: "info" });
    const [navbarOpen, setNavbarOpen] = useState(false);
    const [userStats, setUserStats] = useState({
      gamesPlayed: 0,
      winRate: 0,
      coins: 0
    });
    const [avatar_url, setAvatarUrl] = useState(null)
    const [website, setWebsite] = useState(null)



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





    async function updateProfile(event, avatarUrl) {
    event.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl }
    })

    if (error) {
      alert(error.message)
    } else {
      setAvatarUrl(avatarUrl)
    }

    setLoading(false)
  }
  async function updateUsername(event) {
  event.preventDefault()
  setLoading(true)

  const { error } = await supabase.auth.updateUser({
    data: { first_name: editingName }
  })

  if (error) {
    setPopup({ open: true, message: "Failed to update username: " + error.message, type: "error" });
  } else {
    setUserName(editingName);
    setPopup({ open: true, message: "Username updated successfully!", type: "success" });
    setIsEditing(false);
  }

  setLoading(false)
}

    

    const { session, signOut } = UserAuth();
    const navigate = useNavigate();

    useEffect(() => {
      // This would fetch user stats from your backend
      // For now using placeholder data
      setUserStats({
        gamesPlayed: 42,
        winRate: 65,
        coins: 2500
      });
    }, []);


    useEffect(() => {
  // Wenn der Benutzer eingeloggt ist, holen wir das Avatar-Bild und Namen aus der session
  if (session?.user?.user_metadata?.avatar_url) {
    setAvatarUrl(session.user.user_metadata.avatar_url);
  }
  if (session?.user?.user_metadata?.first_name) {
    setUserName(session.user.user_metadata.first_name);
    setEditingName(session.user.user_metadata.first_name);
  } else {
    setUserName("User");
    setEditingName("User");
  }
}, [session]);

    const handleSignOut = async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        await signOut();
        setPopup({ open: true, message: "Sign out successful!", type: "success" });
        
        // Wait a bit before redirecting to show success message
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } catch (err) {
        setError("An unexpected error occurred.");
        setPopup({ open: true, message: "An unexpected error occurred.", type: "error" });
      } finally {
        setLoading(false);
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
  useEffect(() => {
  const checkUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (!data?.user) {
      navigate('/');
    }
  };
  checkUser();
}, [navigate]);
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
        <div className="w-full max-w-4xl mx-auto px-4 z-10 mt-24">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700"
  >
    {/* Avatar and Name */}
    <div className="text-center mb-8">
      
      
        <div className="relative w-24 h-24 mx-auto">
  {/* Glow-Hintergrund */}
  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-70 blur-md"></div>

  {/* Vordergrund-Kreis mit Rahmen */}
  <div className="absolute inset-0 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
    {/* z. B. Icon oder Text */}
        {isEditing ? (
          <form onSubmit={updateProfile} className="form-widget">
            <Avatar
              url={avatar_url}
              size={88}
              isEditable={true}
              onUpload={(event, url) => {
                updateProfile(event, url)
              }}
            />
          </form>
        ) : (
          <>
            <Avatar
              url={avatar_url}
              size={88}
              isEditable={false}
            />
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition"
            >
              <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
      
      {isEditing ? (
        <div className="mt-4 flex items-center justify-center">
          <input
            type="text"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            className="bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={updateUsername}
            className="ml-2 bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-lg transition"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditingName(userName);
            }}
            className="ml-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition"
          >
            <FontAwesomeIcon icon={faCross} className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 drop-shadow-lg tracking-tight mt-4">
          {userName}
        </h2>
      )}
    </div>

    {/* Welcome Card */}
    <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6 border border-blue-700 mb-8 text-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-1/2 -translate-y-1/2 bg-blue-500 rounded-full opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 transform -translate-x-1/2 translate-y-1/2 bg-purple-500 rounded-full opacity-20"></div>
      
      <h3 className="text-xl font-bold text-white mb-2">Welcome back, {userName}!</h3>
      <p className="text-blue-200">Your online poker adventure awaits.</p>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-blue-800 bg-opacity-40 p-3 rounded-lg">
          <div className="text-blue-300 text-sm">Status</div>
          <div className="text-white font-bold">Online</div>
        </div>
        <div className="bg-purple-800 bg-opacity-40 p-3 rounded-lg">
          <div className="text-purple-300 text-sm">Member since</div>
          <div className="text-white font-bold">2025</div>
        </div>
      </div>
    </div>
    
    {/* Statistics Area with Loading Animation */}
    <div className="bg-gray-700 bg-opacity-60 backdrop-blur-lg rounded-xl p-6 border border-gray-600 mb-8 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          <FontAwesomeIcon icon={faHistory} className="text-blue-400 mr-2" />
          Statistics
        </h3>
        <span className="text-sm bg-blue-500 bg-opacity-20 text-blue-300 px-3 py-1 rounded-full">
          Coming Soon
        </span>
      </div>
      
      <div className="filter blur-sm pointer-events-none">
        <div className="space-y-4">
          {["Games Played", "Wins", "Highest Win", "Average Bet"].map((stat, index) => (
            <div key={index} className="flex items-center">
              <div className="w-32 text-gray-400">{stat}</div>
              <div className="flex-1">
                <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: "0%" }}
                    animate={{ width: ["30%", "70%", "45%", "60%"][index % 4] }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      repeatType: "reverse",
                      delay: index * 0.2
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-gray-800 bg-opacity-70 px-4 py-2 rounded-lg text-center">
          <p className="text-blue-300 font-medium">
            <FontAwesomeIcon icon={faRandom} className="animate-spin mr-2" />
            In Development
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Statistics will be available soon
          </p>
        </div>
      </div>
    </div>

    {/* Achievements Section */}
    <div className="bg-gray-700 bg-opacity-60 backdrop-blur-lg rounded-xl p-6 border border-gray-600 mb-8 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          <FontAwesomeIcon icon={faTrophy} className="text-yellow-400 mr-2" />
          Achievements & Badges
        </h3>
        <span className="text-sm bg-yellow-500 bg-opacity-20 text-yellow-300 px-3 py-1 rounded-full">
          Coming Soon
        </span>
      </div>

      <div className="filter blur-sm pointer-events-none">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 justify-items-center">
          {/* Placeholder for future badges */}
          {Array(5).fill().map((_, index) => (
            <div key={index} className="w-16 h-16 bg-gray-600 bg-opacity-60 rounded-full flex items-center justify-center">
              <FontAwesomeIcon 
                icon={[faCrown, faShieldAlt, faFire, faGem, faRandom][index % 5]} 
                className="text-gray-400 text-2xl"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-gray-800 bg-opacity-70 px-4 py-2 rounded-lg text-center">
          <p className="text-yellow-300 font-medium">
            <FontAwesomeIcon icon={faRandom} className="animate-spin mr-2" />
            In Development
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Play more games to unlock achievements
          </p>
        </div>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="bg-gray-700 bg-opacity-60 backdrop-blur-lg rounded-xl p-6 border border-gray-600">
      <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/play" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg text-center transform hover:scale-105">
          Start New Game
        </Link>
        <div className="relative">
          <Link to="/tournaments" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg text-center transform hover:scale-105 opacity-50 blur-sm pointer-events-none">
            Join Tournament
          </Link>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-gray-800 px-2 py-1 rounded text-sm text-blue-300">Coming Soon</span>
          </div>
        </div>
        <div className="relative">
          <Link to="/friends" className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg text-center transform hover:scale-105 opacity-50 blur-sm pointer-events-none">
            Invite Friends
          </Link>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-gray-800 px-2 py-1 rounded text-sm text-yellow-300">Coming Soon</span>
          </div>
        </div>
        <div className="relative">
          <Link to="/store" className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg text-center transform hover:scale-105 opacity-50 blur-sm pointer-events-none">
            Visit Store
          </Link>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-gray-800 px-2 py-1 rounded text-sm text-pink-300">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>

    {/* Footer with Buttons */}
    <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-gray-700">
      <Link to="/" className="text-gray-400 hover:text-white transition text-sm flex items-center mb-4 sm:mb-0">
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Return to Home
      </Link>
      
      <div className="flex items-center">
        <div className="relative mr-4">
          <button
            className="text-gray-400 hover:text-red-400 px-4 py-2 rounded-lg flex items-center transition blur-sm opacity-50 pointer-events-none"
          >
            Delete Profile
          </button>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-400">Coming Soon</span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center transition"
          disabled={loading}
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
          {loading ? "Signing Out..." : "Sign Out"}
        </button>
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

  export default Profile;
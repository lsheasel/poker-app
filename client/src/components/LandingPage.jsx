import { useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGamepad, 
  faUsers, 
  faStar, 
  faTrophy,
  faChartLine,
  faLock
} from '@fortawesome/free-solid-svg-icons';

const LandingPage = () => {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: featuresRef,
    offset: ["start end", "end start"]
  });

  const y = useSpring(useTransform(scrollYProgress, [0, 1], [100, -100]), {
    stiffness: 100,
    damping: 30
  });

  useEffect(() => {
    if (session) {
      navigate("/lobby");
    }
  }, [session, navigate]);

  // Hero Section Component
  const Hero = () => (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-900/20 to-black" />
      
      {/* Animated Cards Grid */}
      <div className="absolute inset-0">
        <div className="relative w-full h-full">
          {Array(20).fill().map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ 
                x: Math.random() * window.innerWidth, 
                y: Math.random() * window.innerHeight,
                scale: 0,
                rotate: Math.random() * 360 
              }}
              animate={{
                y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight - 100],
                rotate: [0, 360],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: Math.random() * 8 + 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2
              }}
            >
              <div className="text-white/5 text-6xl font-bold">
                {["♠", "♥", "♦", "♣"][Math.floor(Math.random() * 4)]}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <h1 className="text-7xl font-black text-white mb-6">
            <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              Poker4Fun
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Experience the thrill of poker in a whole new way. Play with friends, climb the ranks, and become a legend.
          </p>
          {!session && (
            <motion.button
              onClick={() => navigate("/lobby")}
              className="group relative mt-8 px-8 py-4 text-xl font-bold text-white rounded-full overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-white" />
              <div className="relative flex items-center gap-2">
                <span>Start Playing</span>
                <motion.span
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  ♠
                </motion.span>
              </div>
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        
        <div className="mt-2 text-2xl text-gray-400">↓</div>
      </motion.div>
    </div>
  );

  // Stats section with animated numbers
  const StatsSection = () => {
    const stats = [
      { icon: faUsers, value: "1000+", label: "Active Players" },
      { icon: faGamepad, value: "500+", label: "Daily Games" },
      { icon: faTrophy, value: "50+", label: "Tournaments" },
      { icon: faChartLine, value: "$1M+", label: "Chips in Play" }
    ];

    return (
      <section ref={statsRef} className="relative py-24 bg-gradient-to-b from-blue-900/20 to-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-lg"
              >
                <FontAwesomeIcon icon={stat.icon} className="text-4xl text-blue-400 mb-4" />
                <motion.h3 
                  className="text-3xl font-bold text-white mb-2"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", delay: index * 0.2 }}
                >
                  {stat.value}
                </motion.h3>
                <p className="text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // Enhanced Feature Card with hover effects
  const FeatureCard = ({ icon, title, description, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      whileHover={{ scale: 1.05, y: -10 }}
      className="group relative p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent 
                 border border-white/10 hover:border-blue-500/50 transition-all duration-300
                 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]"
    >
      <div className="absolute inset-0 bg-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative space-y-4">
        <motion.span 
          className="inline-block p-3 rounded-lg bg-blue-500/10 text-blue-400"
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          {icon}
        </motion.span>
        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
          {description}
        </p>
      </div>
    </motion.div>
  );

  // Security Section
  const SecuritySection = () => {
    const securityFeatures = [
      { icon: faLock, title: "Secure Platform", desc: "End-to-end encryption for all transactions" },
      { icon: faUsers, title: "Fair Play", desc: "Advanced anti-cheat systems" },
      { icon: faChartLine, title: "Transparent", desc: "Clear statistics and game history" }
    ];

    return (
      <section className="relative py-24 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.2 }}
          viewport={{ once: true }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"
        />
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Safe & Secure Gaming</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Your security is our top priority. Play with confidence knowing that your data is protected.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {securityFeatures.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center p-6"
              >
                <FontAwesomeIcon icon={item.icon} className="text-4xl text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div ref={containerRef} className="bg-black">
      {/* Modern Navbar */}
      <motion.nav
        style={{ backgroundColor: `rgba(0,0,0,${scrollYProgress})` }}
        className="fixed top-0 left-0 right-0 z-50 transition-colors duration-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-white">Poker4Fun</Link>
            <div className="flex items-center gap-8">
              {['Features', 'Rules', 'About'].map((item) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item}
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <Hero />

      {/* Features Section with Parallax */}
      <motion.section 
        ref={featuresRef}
        style={{ y }}
        className="relative py-32"
      >
        {/* Features content here */}
      </motion.section>

      <StatsSection />
      
      <SecuritySection />

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p>© 2025 Poker4Fun – Play responsibly. No real money involved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
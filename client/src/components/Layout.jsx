import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
      {/* Fixed Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-green-900 opacity-10"
          style={{
            backgroundImage: 'url("/poker-felt-texture.jpg")',
            backgroundSize: 'cover'
          }}
        />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-3/4 h-64 rounded-full bg-blue-500 opacity-20 blur-3xl" />
      </div>

      {/* Navigation */}

      {/* Main Content */}
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-grow container mx-auto px-4 py-16"
      >
        <div className="relative z-10">
          <Outlet />
        </div>
      </motion.main>

      {/* Footer */}
      <footer className="relative z-10 py-6 bg-gray-900/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-400 text-sm">
            © 2025 Poker4Fun – Play responsibly. No real money involved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
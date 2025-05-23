import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase, playersSupabase } from '../supabaseClient';

export default function Avatar({ url, size, level, source = 'team' }) {
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    if (url) {
      // If the URL is already a full URL, use it directly
      if (url.startsWith('http')) {
        setAvatarUrl(url);
      } else {
        // Otherwise, try to get it from storage
        downloadImage(url);
      }
    }
  }, [url, source]);

  async function downloadImage(path) {
    try {
      const { data, error } = await playersSupabase.storage
        .from('avatars')  // bucket name
        .download(path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error) {
      console.error('Error downloading image:', error.message);
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="rounded-full object-cover shadow-lg"
          style={{ height: size, width: size }}
        />
      ) : (
        <div 
          className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
          style={{ height: size, width: size }}
        />
      )}

      {level !== undefined && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute -bottom-2 flex items-center justify-center rounded-full 
                     bg-gray-800 bg-opacity-80 backdrop-blur-lg border-2 border-transparent 
                     shadow-lg z-10"
          style={{
            width: size * 0.4,
            height: size * 0.4,
            transform: `translateY(${size * 0.1}px)`,
            background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
            fontSize: size * 0.2,
          }}
        >
          <span className="text-white font-bold">{level}</span>
        </motion.div>
      )}
    </div>
  );
}
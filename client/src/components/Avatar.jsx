import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';

export default function Avatar({ url, size, onUpload, isEditable = false, ringSize }) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [level, setLevel] = useState(0); // State for user level
  const fileInputRef = useRef(null);

  // Calculate ring size dynamically based on avatar size, or use provided ringSize
  const effectiveRingSize = ringSize ?? Math.round(size * 0.3); // Ring is ~30% of avatar size by default

  useEffect(() => {
    if (url) downloadImage(url);

    const fetchLevel = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setLevel(data.user.user_metadata.level || 0);
      } else {
        setLevel(0); // Gast
      }
    };
    fetchLevel();
  }, [url]);

  async function downloadImage(path) {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error) {
      console.error('Error downloading image: ', error.message);
    }
  }

  async function uploadAvatar(event) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) throw uploadError;

      onUpload(event, filePath);
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="avatar image"
          style={{ height: size, width: size, cursor: isEditable ? 'pointer' : 'default', borderRadius: '50%' }}
          onClick={isEditable ? () => fileInputRef.current?.click() : undefined}
        />
      ) : (
        <img
          src="no-profile.png"
          alt="Placeholder"
          className="avatar placeholder"
          style={{ height: size, width: size, cursor: isEditable ? 'pointer' : 'default', borderRadius: '50%' }}
          onClick={isEditable ? () => fileInputRef.current?.click() : undefined}
        />
      )}

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={uploadAvatar}
        disabled={uploading}
      />

      {/* Level Display with Ring, Overlapping Avatar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute -bottom-3 flex items-center justify-center rounded-full bg-gray-800 bg-opacity-80 backdrop-blur-lg border-2 border-transparent shadow-lg z-10"
        style={{
          width: effectiveRingSize,
          height: effectiveRingSize, // Ensure circular shape
          transform: `translateY(${effectiveRingSize * 0.25}px)`, // Dynamic overlap (25% of ring size)
          background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)', // Gradient ring
          fontSize: effectiveRingSize * 0.5, // Scale font size with ring
        }}
      >
        <span className="text-white font-bold">{level}</span>
      </motion.div>
    </div>
  );
}
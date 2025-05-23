import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const Settings = () => {
  const { session } = UserAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [formData, setFormData] = useState({
    username: session?.user?.user_metadata?.username || '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const updateUsername = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // First update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { username: formData.username }
      });

      if (authError) throw authError;

      // Then update team_members table
      const { error: teamError } = await supabase
        .from('team_members')
        .upsert({ 
          id: session.user.id,
          email: session.user.email,
          username: formData.username
        }, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (teamError) throw teamError;

      setMessage({
        text: 'Username updated successfully!',
        type: 'success'
      });

      // Optional: Log success
      console.log('Username updated in both auth and team_members');

    } catch (error) {
      console.error('Update error:', error);
      setMessage({
        text: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({
        text: 'Passwords do not match!',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      setMessage({
        text: 'Password updated successfully!',
        type: 'success'
      });
      setFormData({
        ...formData,
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage({
        text: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
        Account Settings
      </h2>

      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'error' ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Username Update Form */}
      <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-gray-700">
        <h3 className="text-xl font-semibold text-gray-200 mb-4">Update Username</h3>
        <form onSubmit={updateUsername} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              New Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Username'}
          </button>
        </form>
      </div>

      {/* Password Update Form */}
      <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl border border-gray-700">
        <h3 className="text-xl font-semibold text-gray-200 mb-4">Change Password</h3>
        <form onSubmit={updatePassword} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default Settings;
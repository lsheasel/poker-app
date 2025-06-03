import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const SECTIONS = {
  profile: {
    icon: '👤',
    fields: ['first_name', 'email', 'avatar_url'],  // Changed back to first_name since that's our username
    title: 'Profile Information'
  },
  stats: {
    icon: '📊',
    fields: ['level', 'xp', 'coins', 'winRate', 'gamesPlayed'],
    title: 'Player Statistics'
  },
  settings: {
    icon: '⚙️',
    fields: ['card_skin'],
    title: 'Game Settings'
  },
  verification: {
    icon: '✓',
    fields: ['email_verified', 'phone_verified'],
    title: 'Account Verification'
  },
  other: {
    icon: '📎',
    fields: ['sub', 'badges'],
    title: 'Additional Info'
  }
};

const FIELD_LABELS = {
  first_name: 'Username',
  // Add other custom labels here if needed
};

const MetaDataDialog = ({ isOpen, onClose, playerData }) => {
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    if (playerData?.raw_user_meta_data) {
      setEditedData({ raw_user_meta_data: { ...playerData.raw_user_meta_data } });
    }
  }, [playerData]);

  const handleEscapeKey = useCallback((event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, handleEscapeKey]);

  if (!isOpen) return null;

  const formatValue = (value, key) => {
    if (key === 'first_name' && !value) {
      return playerData.email?.split('@')[0] || 'N/A';
    }
    if (Array.isArray(value)) return value.length ? value.join(', ') : 'None';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === null || value === undefined) return 'N/A';
    return value.toString();
  };

  const handleValueChange = (key, value) => {
    setEditedData(prev => ({
      raw_user_meta_data: {
        ...prev.raw_user_meta_data,
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      // TODO: Implement save logic here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated save
      setSaveStatus('success');
      setEditMode(false);
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Save error:', error);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-gray-800/95 backdrop-blur rounded-xl w-full max-w-2xl border border-gray-700 shadow-xl 
                     m-4 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Static Header */}
            <div className="border-b border-gray-700 p-6 bg-gray-800/95 backdrop-blur-md">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                  Player Profile
                </h3>
                <div className="flex gap-2">
                 
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors text-2xl ml-2"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-purple-500 
                         scrollbar-track-gray-700/30 scrollbar-thumb-rounded-full">
              <div className="p-6 space-y-6">
                {/* Status Message */}
                <AnimatePresence>
                  {saveStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 p-3 bg-green-500/20 text-green-200 rounded-lg"
                    >
                      Changes saved successfully!
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Content Sections */}
                <div className="space-y-6">
                  {Object.entries(SECTIONS).map(([sectionKey, section]) => (
                    <div key={sectionKey} className="space-y-3">
                      <h4 className="text-lg font-semibold text-gray-200 flex items-center gap-2
                                   bg-gray-700/30 p-2 rounded-lg">
                        <span>{section.icon}</span>
                        <span>{section.title}</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                        {section.fields.map((key) => (
                          <motion.div
                            key={key}
                            layout
                            className="bg-gray-700/30 p-3 rounded-lg hover:bg-gray-700/40 transition-colors"
                          >
                            <span className="text-gray-400 text-sm capitalize block mb-1">
                              {FIELD_LABELS[key] || key.replace(/_/g, ' ')}:
                            </span>
                            {editMode ? (
                              <input
                                type="text"
                                value={editedData.raw_user_meta_data?.[key] || ''}
                                onChange={(e) => handleValueChange(key, e.target.value)}
                                className="w-full bg-gray-600 text-white px-3 py-2 rounded
                                         focus:outline-none focus:ring-2 focus:ring-purple-500
                                         border border-gray-500"
                              />
                            ) : (
                              <div className="text-gray-200 font-medium px-3 py-2">
                                {key === 'first_name' ? 
                                  formatValue(playerData.raw_user_meta_data?.first_name, 'first_name') :
                                  formatValue(playerData.raw_user_meta_data?.[key])}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MetaDataDialog;
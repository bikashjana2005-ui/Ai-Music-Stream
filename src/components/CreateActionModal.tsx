import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Search, Link as LinkIcon, ListPlus, RefreshCw, Globe, Play, Sparkles } from 'lucide-react';
import { extractYouTubeId } from '../utils/youtube';

interface CreateActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayUrl: (url: string) => void;
  onOpenSearch: () => void;
  onOpenCreatePlaylist: () => void;
  onSyncYouTubeAll?: () => void;
  onOpenWebView?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CreateActionModal: React.FC<CreateActionModalProps> = ({
  isOpen,
  onClose,
  onPlayUrl,
  onOpenSearch,
  onOpenCreatePlaylist,
  onSyncYouTubeAll,
  onOpenWebView,
  onShowToast
}) => {
  const [inputUrl, setInputUrl] = useState('');

  const handlePlayFromUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    const ytid = extractYouTubeId(inputUrl.trim());
    if (ytid) {
      onPlayUrl(inputUrl.trim());
      setInputUrl('');
      onClose();
      onShowToast('Loading YouTube stream...', 'info');
    } else {
      onShowToast('Please enter a valid YouTube URL or video ID', 'error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-[#212121] text-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/10 p-5 space-y-4"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                  <Plus size={18} />
                </div>
                <h3 className="text-base font-bold text-white">Create & Stream</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick URL Input */}
            <form onSubmit={handlePlayFromUrl} className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 block">
                Stream Directly from YouTube Link
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full pl-9 pr-3 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-xs font-medium text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
                >
                  <Play size={14} className="fill-white" />
                  <span>Stream</span>
                </button>
              </div>
            </form>

            {/* Action Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                className="p-3.5 bg-[#2a2a2a] hover:bg-[#333] rounded-2xl border border-white/5 flex flex-col items-start gap-2 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Search size={17} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Search YouTube</h4>
                  <p className="text-[10px] text-gray-400">Find any song or video</p>
                </div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenCreatePlaylist();
                }}
                className="p-3.5 bg-[#2a2a2a] hover:bg-[#333] rounded-2xl border border-white/5 flex flex-col items-start gap-2 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ListPlus size={17} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">New Playlist</h4>
                  <p className="text-[10px] text-gray-400">Organize your music</p>
                </div>
              </button>

              {onSyncYouTubeAll && (
                <button
                  onClick={() => {
                    onClose();
                    onSyncYouTubeAll();
                  }}
                  className="p-3.5 bg-[#2a2a2a] hover:bg-[#333] rounded-2xl border border-white/5 flex flex-col items-start gap-2 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <RefreshCw size={17} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Sync YouTube Account</h4>
                    <p className="text-[10px] text-gray-400">Import your Google subs</p>
                  </div>
                </button>
              )}

              {onOpenWebView && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenWebView();
                  }}
                  className="p-3.5 bg-[#2a2a2a] hover:bg-[#333] rounded-2xl border border-white/5 flex flex-col items-start gap-2 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Globe size={17} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">YouTube WebView</h4>
                    <p className="text-[10px] text-gray-400">Browse official web</p>
                  </div>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

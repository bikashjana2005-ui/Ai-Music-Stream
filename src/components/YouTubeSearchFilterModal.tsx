import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, SlidersHorizontal, RotateCcw } from 'lucide-react';

export interface SearchFilterOptions {
  sortBy: 'relevance' | 'upload_date' | 'view_count' | 'rating';
  type: 'all' | 'video' | 'channel' | 'playlist';
  uploadDate: 'any' | 'hour' | 'today' | 'week' | 'month' | 'year';
  duration: 'any' | 'short' | 'medium' | 'long';
  officialOnly: boolean;
  liveOnly: boolean;
  hd4kOnly: boolean;
}

interface YouTubeSearchFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: SearchFilterOptions;
  onApplyFilters: (filters: SearchFilterOptions) => void;
  onResetFilters: () => void;
}

export const YouTubeSearchFilterModal: React.FC<YouTubeSearchFilterModalProps> = ({
  isOpen,
  onClose,
  currentFilters,
  onApplyFilters,
  onResetFilters
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFilterOptions>(currentFilters);

  // Sync with currentFilters when opened
  React.useEffect(() => {
    if (isOpen) {
      setLocalFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const handleReset = () => {
    const defaultFilters: SearchFilterOptions = {
      sortBy: 'relevance',
      type: 'all',
      uploadDate: 'any',
      duration: 'any',
      officialOnly: false,
      liveOnly: false,
      hd4kOnly: false
    };
    setLocalFilters(defaultFilters);
    onResetFilters();
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
          />

          {/* Modal / Bottom Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative w-full max-w-lg bg-[#1f1f1f] text-[#f1f1f1] rounded-t-[28px] sm:rounded-[28px] border-t sm:border border-white/10 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col z-10"
          >
            {/* Native Android Drag Handle on Mobile */}
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1.5 bg-zinc-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal size={20} className="text-white" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Search filters
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                  title="Reset filters"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              
              {/* 1. Sort By */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Sort by
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'relevance', label: 'Relevance' },
                    { id: 'upload_date', label: 'Upload date' },
                    { id: 'view_count', label: 'View count' },
                    { id: 'rating', label: 'Rating' }
                  ].map((opt) => {
                    const isSelected = localFilters.sortBy === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLocalFilters({ ...localFilters, sortBy: opt.id as any })}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-white text-black font-bold shadow-sm' 
                            : 'bg-[#2b2b2b] text-[#e1e1e1] hover:bg-[#383838]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check size={14} className="text-black stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Type */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Type
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'video', label: 'Video' },
                    { id: 'channel', label: 'Channel' },
                    { id: 'playlist', label: 'Playlist' }
                  ].map((opt) => {
                    const isSelected = localFilters.type === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLocalFilters({ ...localFilters, type: opt.id as any })}
                        className={`px-3 py-2 rounded-xl text-xs font-medium text-center transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-white text-black font-bold shadow-sm' 
                            : 'bg-[#2b2b2b] text-[#e1e1e1] hover:bg-[#383838]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Upload Date */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Upload date
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'any', label: 'Any time' },
                    { id: 'hour', label: 'Last hour' },
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'This week' },
                    { id: 'month', label: 'This month' },
                    { id: 'year', label: 'This year' }
                  ].map((opt) => {
                    const isSelected = localFilters.uploadDate === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLocalFilters({ ...localFilters, uploadDate: opt.id as any })}
                        className={`px-3 py-2 rounded-xl text-xs font-medium text-center transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-white text-black font-bold shadow-sm' 
                            : 'bg-[#2b2b2b] text-[#e1e1e1] hover:bg-[#383838]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Duration */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Duration
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'any', label: 'Any' },
                    { id: 'short', label: '< 4 min' },
                    { id: 'medium', label: '4–20 min' },
                    { id: 'long', label: '> 20 min' }
                  ].map((opt) => {
                    const isSelected = localFilters.duration === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLocalFilters({ ...localFilters, duration: opt.id as any })}
                        className={`px-3 py-2 rounded-xl text-xs font-medium text-center transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-white text-black font-bold shadow-sm' 
                            : 'bg-[#2b2b2b] text-[#e1e1e1] hover:bg-[#383838]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Features / Special toggles */}
              <div className="space-y-2 pt-1 border-t border-white/10">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Features
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#2b2b2b] hover:bg-[#333] cursor-pointer transition-colors">
                    <span className="text-xs font-medium text-white">Live streams only</span>
                    <input 
                      type="checkbox" 
                      checked={localFilters.liveOnly}
                      onChange={(e) => setLocalFilters({ ...localFilters, liveOnly: e.target.checked })}
                      className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#2b2b2b] hover:bg-[#333] cursor-pointer transition-colors">
                    <span className="text-xs font-medium text-white">Official Music & Videos</span>
                    <input 
                      type="checkbox" 
                      checked={localFilters.officialOnly}
                      onChange={(e) => setLocalFilters({ ...localFilters, officialOnly: e.target.checked })}
                      className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#2b2b2b] hover:bg-[#333] cursor-pointer transition-colors">
                    <span className="text-xs font-medium text-white">4K / High Definition</span>
                    <input 
                      type="checkbox" 
                      checked={localFilters.hd4kOnly}
                      onChange={(e) => setLocalFilters({ ...localFilters, hd4kOnly: e.target.checked })}
                      className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-white/10 bg-[#191919] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-all active:scale-95 shadow-md cursor-pointer"
              >
                Apply
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

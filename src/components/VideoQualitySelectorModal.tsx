import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, Check, Eye } from 'lucide-react';
import { Track } from '../types';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';

export type QualityOptionId = 'auto' | 'higher' | 'data_saver';

interface VideoQualitySelectorModalProps {
  isOpen: boolean;
  track: Track | null;
  onClose: () => void;
  onConfirmPlay: (track: Track, selectedQuality: QualityOptionId, dontShowAgain: boolean) => void;
  isDataSaverActive?: boolean;
}

export const VideoQualitySelectorModal: React.FC<VideoQualitySelectorModalProps> = ({
  isOpen,
  track,
  onClose,
  onConfirmPlay,
  isDataSaverActive = false
}) => {
  const [selectedQuality, setSelectedQuality] = useState<QualityOptionId>('data_saver');
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);

  // Sync initial selection based on settings
  useEffect(() => {
    if (isOpen) {
      if (isDataSaverActive) {
        setSelectedQuality('data_saver');
      } else {
        const savedPref = localStorage.getItem('aura_preferred_quality_option') as QualityOptionId;
        if (savedPref && ['auto', 'higher', 'data_saver'].includes(savedPref)) {
          setSelectedQuality(savedPref);
        } else {
          setSelectedQuality('auto');
        }
      }
      setIsPreviewPlaying(false);
      setDontShowAgain(false);
    }
  }, [isOpen, isDataSaverActive]);

  if (!isOpen || !track) return null;

  const videoId = extractYouTubeId(track.id);
  const title = decodeHtmlEntities(track.title || 'Selected Video');
  const thumbnail = track.thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop');

  const handlePlayClick = () => {
    if (dontShowAgain) {
      localStorage.setItem('aura_skip_quality_prompt', 'true');
      localStorage.setItem('aura_preferred_quality_option', selectedQuality);
    }
    onConfirmPlay(track, selectedQuality, dontShowAgain);
  };

  const options: { id: QualityOptionId; label: string; sizeEst: string; note: string }[] = [
    {
      id: 'auto',
      label: 'Auto',
      sizeEst: '~ 1.6 MB',
      note: 'Dynamically adapts resolution to connection speed'
    },
    {
      id: 'higher',
      label: 'Higher picture quality',
      sizeEst: '~ 4.2 MB',
      note: 'Full HD crystal clear video playback'
    },
    {
      id: 'data_saver',
      label: 'Data saver',
      sizeEst: '~ 0.9 MB',
      note: 'Compressed low-bandwidth stream (144p & 128kbps)'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        />

        {/* Modal Sheet Container - Exactly matching screenshot layout */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.96 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative z-10 w-full max-w-md bg-[#161616] text-white rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col p-5 sm:p-6 space-y-4"
        >
          {/* Drag Handle on Mobile */}
          <div className="w-12 h-1 bg-zinc-600/70 rounded-full mx-auto -mt-1 mb-1 sm:hidden" />

          {/* Header Title */}
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
              Select quality for this video
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Video Preview Card with Centered ▶ PREVIEW badge */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-md group">
            {isPreviewPlaying && videoId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&controls=0&modestbranding=1&playsinline=1`}
                title={title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <>
                <img
                  src={thumbnail}
                  alt={title}
                  className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
                
                {/* Centered PREVIEW Badge Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
                    className="px-4 py-2 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/80 hover:border-white text-white rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
                  >
                    <Play size={13} fill="currentColor" />
                    <span>PREVIEW</span>
                  </button>
                </div>

                {/* Track Title Floating Tag */}
                <div className="absolute bottom-2 left-3 right-3 pointer-events-none">
                  <p className="text-[11px] font-semibold text-white/90 truncate drop-shadow-md">
                    {title}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* 3 Quality Radio Selection Items */}
          <div className="space-y-1.5 pt-1">
            {options.map((opt) => {
              const isSelected = selectedQuality === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedQuality(opt.id)}
                  className={`w-full py-3 px-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    isSelected ? 'bg-white/5' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Custom Radio Button */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'border-sky-400 bg-transparent' : 'border-zinc-500'
                    }`}>
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                      )}
                    </div>

                    <span className="text-sm font-medium text-zinc-100 truncate">
                      {opt.label}
                    </span>
                  </div>

                  {/* Size Estimate Label on Right */}
                  <span className="text-xs font-mono text-zinc-400 shrink-0 pl-2">
                    {opt.sizeEst}
                  </span>
                </div>
              );
            })}
          </div>

          {/* "Don't show this again" Checkbox */}
          <div 
            onClick={() => setDontShowAgain(!dontShowAgain)}
            className="flex items-center gap-3 pt-1 px-1 cursor-pointer select-none"
          >
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              dontShowAgain 
                ? 'bg-sky-500 border-sky-500 text-black' 
                : 'border-zinc-500 bg-transparent hover:border-zinc-400'
            }`}>
              {dontShowAgain && <Check size={14} strokeWidth={3} />}
            </div>
            <span className="text-sm text-zinc-300 font-normal">
              Don't show this again
            </span>
          </div>

          {/* Bottom Actions: Cancel & Play Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer rounded-full active:scale-95"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePlayClick}
              className="px-8 py-2.5 bg-[#38bdf8] hover:bg-[#0ea5e9] text-zinc-950 text-sm font-bold rounded-full shadow-lg shadow-sky-500/20 transition-all active:scale-95 cursor-pointer"
            >
              Play
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

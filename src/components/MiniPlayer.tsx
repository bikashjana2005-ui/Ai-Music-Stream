import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, Heart, X, Music, Tv } from 'lucide-react';
import { Track } from '../types';
import { decodeHtmlEntities, extractYouTubeId } from '../utils/youtube';

export interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  onOpenOverlay?: () => void;
  onOpenVideo?: () => void;
  onClose?: () => void;
  playbackTime?: number;
  realDuration?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (track: Track) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onOpenOverlay,
  onOpenVideo,
  onClose,
  playbackTime = 0,
  realDuration = 0,
  isFavorite = false,
  onToggleFavorite
}) => {
  if (!currentTrack) return null;

  const title = decodeHtmlEntities(currentTrack.title || 'Unknown Track');
  const artist = decodeHtmlEntities(currentTrack.artist || currentTrack.channel || 'Artist');
  const videoId = extractYouTubeId(currentTrack.id || (currentTrack as any).youtubeUrl || '');
  const thumb = currentTrack.thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');

  const progressPercent = realDuration > 0 ? Math.min(100, Math.max(0, (playbackTime / realDuration) * 100)) : 0;

  return (
    <AnimatePresence>
      <motion.div
        aria-label="Music Mini Player Bar"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className="fixed z-40 bottom-[64px] sm:bottom-0 left-0 right-0 max-w-7xl mx-auto px-2 sm:px-4 pb-2 sm:pb-3 pointer-events-none select-none"
      >
        <div
          onClick={onOpenOverlay}
          className="pointer-events-auto relative flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#121320]/80 backdrop-blur-3xl border border-black/10 dark:border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.4),inset_0_1px_1.5px_rgba(255,255,255,0.4)] text-gray-900 dark:text-white cursor-pointer group hover:border-red-500/40 transition-all overflow-hidden"
        >
          {/* Top Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
              style={{ width: `${progressPercent || 0}%` }}
            />
          </div>

          {/* Left: Thumbnail & Song Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0 shadow-md">
              {thumb ? (
                <img
                  src={thumb}
                  alt={title}
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    isPlaying ? 'scale-105' : 'scale-100 opacity-90'
                  }`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-400">
                  <Music className="w-5 h-5" />
                </div>
              )}
              {isPlaying && (
                <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate leading-tight group-hover:text-red-500 transition-colors">
                {title}
              </h4>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                {artist}
              </p>
            </div>
          </div>

          {/* Right: Controls */}
          <div
            className="flex items-center gap-1 sm:gap-2 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(currentTrack)}
                className={`p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all cursor-pointer ${
                  isFavorite ? 'text-red-500' : 'text-zinc-400 hover:text-white'
                }`}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />
              </button>
            )}

            {onPrevTrack && (
              <button
                type="button"
                onClick={onPrevTrack}
                className="hidden xs:flex p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                title="Previous track"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onTogglePlay}
              className="p-2.5 rounded-full bg-red-600 hover:bg-red-500 active:scale-90 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ml-0.5" />
              )}
            </button>

            {onNextTrack && (
              <button
                type="button"
                onClick={onNextTrack}
                className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                title="Next track"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}

            {onOpenVideo && (
              <button
                type="button"
                onClick={onOpenVideo}
                className="p-2 rounded-full text-rose-400 hover:text-white hover:bg-rose-600/30 active:scale-95 transition-all cursor-pointer"
                title="Open Third-Party Full Video Player"
              >
                <Tv className="w-4 h-4" />
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                title="Close player"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

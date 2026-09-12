import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  ListPlus, 
  Heart, 
  Download, 
  Share2, 
  Info, 
  User, 
  Clock, 
  X, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { Track } from '../types';
import { decodeHtmlEntities, extractYouTubeId } from '../utils/youtube';

interface YouTubeActionBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onOpenMetadata?: (track: Track) => void;
  onOpenChannelDetails?: (channelName: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const YouTubeActionBottomSheet: React.FC<YouTubeActionBottomSheetProps> = ({
  isOpen,
  onClose,
  track,
  onPlay,
  onDownload,
  isFavorite = false,
  onToggleFavorite,
  onOpenAddToPlaylist,
  onOpenMetadata,
  onOpenChannelDetails,
  onShowToast
}) => {
  if (!track) return null;

  const title = decodeHtmlEntities(track.title);
  const channel = decodeHtmlEntities(track.channel);
  const videoId = extractYouTubeId(track.id);
  const thumbnail = track.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const handleCopyLink = () => {
    if (navigator.clipboard && videoId) {
      navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${videoId}`);
      onShowToast?.('Link copied to clipboard', 'success');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
          />

          {/* Android Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative w-full max-w-lg bg-[#1f1f1f] text-[#f1f1f1] rounded-t-[28px] border-t border-white/10 shadow-2xl overflow-hidden pb-8 z-10 select-none"
          >
            {/* Native Android Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-2">
              <div className="w-10 h-1.5 bg-zinc-600 rounded-full" />
            </div>

            {/* Video Preview Header */}
            <div className="px-5 py-3 flex items-center gap-3 border-b border-white/10 bg-white/5">
              <div className="w-16 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-white/10">
                <img 
                  src={thumbnail} 
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-medium text-white truncate">
                  {title}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate">
                  {channel}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Android Action Sheet List Items */}
            <div className="py-2 divide-y divide-white/5">
              
              {/* Play Now */}
              <button
                type="button"
                onClick={() => {
                  onPlay(track);
                  onClose();
                }}
                className="w-full px-5 py-3 flex items-center gap-4 hover:bg-white/10 active:bg-white/15 transition-colors text-left cursor-pointer"
              >
                <Play size={20} className="text-zinc-300 fill-zinc-300" />
                <span className="text-sm font-medium text-white">Play video</span>
              </button>

              {/* Add to Playlist */}
              {onOpenAddToPlaylist && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAddToPlaylist(track);
                    onClose();
                  }}
                  className="w-full px-5 py-3 flex items-center gap-4 hover:bg-white/10 active:bg-white/15 transition-colors text-left cursor-pointer"
                >
                  <ListPlus size={20} className="text-zinc-300" />
                  <span className="text-sm font-medium text-white">Save to playlist</span>
                </button>
              )}

              {/* Toggle Favorite */}
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleFavorite(track);
                    onClose();
                  }}
                  className="w-full px-5 py-3 flex items-center gap-4 hover:bg-white/10 active:bg-white/15 transition-colors text-left cursor-pointer"
                >
                  <Heart size={20} className={isFavorite ? "fill-rose-500 text-rose-500" : "text-zinc-300"} />
                  <span className="text-sm font-medium text-white">
                    {isFavorite ? 'Remove from Liked videos' : 'Save to Liked videos'}
                  </span>
                </button>
              )}

              {/* Download */}
              <button
                type="button"
                onClick={() => {
                  onDownload(track);
                  onClose();
                }}
                className="w-full px-5 py-3 flex items-center gap-4 hover:bg-white/10 active:bg-white/15 transition-colors text-left cursor-pointer"
              >
                <Download size={20} className="text-zinc-300" />
                <span className="text-sm font-medium text-white">Download video</span>
              </button>

              {/* Share */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full px-5 py-3 flex items-center gap-4 hover:bg-white/10 active:bg-white/15 transition-colors text-left cursor-pointer"
              >
                <Share2 size={20} className="text-zinc-300" />
                <span className="text-sm font-medium text-white">Share</span>
              </button>

              {/* Go to Channel */}
              {onOpenChannelDetails && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChannelDetails(channel);
                    onClose();
                  }}
                  className="w-full px-5 py-3 flex items-center gap-4 hover:bg-white/10 active:bg-white/15 transition-colors text-left cursor-pointer"
                >
                  <User size={20} className="text-zinc-300" />
                  <span className="text-sm font-medium text-white">Go to channel</span>
                </button>
              )}

              {/* Video Info / Metadata */}
              {onOpenMetadata && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenMetadata(track);
                    onClose();
                  }}
                  className="w-full px-5 py-3 flex items-center gap-4 hover:bg-white/10 active:bg-white/15 transition-colors text-left cursor-pointer"
                >
                  <Info size={20} className="text-zinc-300" />
                  <span className="text-sm font-medium text-white">Details & stats</span>
                </button>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Play, Download, Heart, ListPlus, MoreVertical, Info, Share2, Music, Zap } from 'lucide-react';
import { Track } from '../types';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';
import { getChannelAvatar, getFallbackChannelAvatar } from '../utils/channelLogos';
import { YouTubeActionBottomSheet } from './YouTubeActionBottomSheet';
import { getNetworkStatus } from '../utils/networkOptimizer';

interface YouTubeFeedCardProps {
  track: Track;
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  isPlayingCurrent?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onOpenMetadata?: (track: Track) => void;
  onOpenChannelDetails?: (channelName: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// Channel avatars resolved via getChannelAvatar from utils/channelLogos

export const YouTubeFeedCard: React.FC<YouTubeFeedCardProps> = ({
  track,
  onPlay,
  onDownload,
  isPlayingCurrent = false,
  isFavorite = false,
  onToggleFavorite,
  onOpenAddToPlaylist,
  onOpenMetadata,
  onOpenChannelDetails,
  onShowToast
}) => {
  const [imgStage, setImgStage] = useState<number>(0);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const videoId = extractYouTubeId(track.id);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThumb = () => {
    if (!videoId || videoId.length !== 11) {
      return `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop`;
    }
    const isLowNet = getNetworkStatus().isLowNetwork;
    if (isLowNet) {
      if (imgStage === 0) return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
      if (imgStage === 1) return `https://i.ytimg.com/vi/${videoId}/0.jpg`;
      return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }
    if (imgStage === 0) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    if (imgStage === 1) return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
    if (imgStage === 2) return `https://i.ytimg.com/vi/${videoId}/0.jpg`;
    return `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop`;
  };

  const title = decodeHtmlEntities(track.title);
  const rawChannel = decodeHtmlEntities(track.channel);
  
  // Format channel name cleanly (extract before dot/dash)
  const channelParts = rawChannel.split(/[•·|-]/);
  const channelName = channelParts[0]?.trim() || 'YouTube Music';
  const viewsText = track.views || '120K views';
  const timeAgo = track.publishedTime || 'Recent';

  return (
    <div className="group flex flex-col w-full text-left transition-all">
      {/* Thumbnail Container (Full Width, Aspect 16:9, Perfectly Centered with M3 Expressive Curves) */}
      <div 
        onClick={() => onPlay(track)}
        className="relative aspect-video w-full rounded-[20px] sm:rounded-[24px] overflow-hidden bg-zinc-900 shadow-md group cursor-pointer border border-black/10 dark:border-white/10 flex items-center justify-center active:scale-[0.98] transition-all"
      >
        {imgStage > 3 ? (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-white">
            <Music size={32} />
          </div>
        ) : (
          <img 
            src={getThumb()} 
            alt={title} 
            onError={() => setImgStage(prev => prev + 1)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            loading="lazy" 
          />
        )}

        {/* Hover / Playing Play Overlay */}
        <div className={`absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-300 ${isPlayingCurrent ? 'opacity-100 bg-black/50' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="p-3.5 bg-rose-600 text-white rounded-full shadow-2xl scale-95 group-hover:scale-105 transition-transform flex items-center justify-center">
            <Play size={22} className="fill-white ml-0.5" />
          </div>
        </div>

        {/* Low Network Indicator Badge Top Left */}
        {getNetworkStatus().isLowNetwork && (
          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-emerald-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-emerald-500/30 shadow-xs">
            <Zap size={10} className="fill-emerald-400" />
            <span>240p Fast</span>
          </div>
        )}

        {/* Duration Badge Bottom Right */}
        <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-md text-white text-[11px] font-mono font-medium px-1.5 py-0.5 rounded-md shadow-sm border border-white/10">
          {track.duration || '3:30'}
        </div>
      </div>

      {/* Details Row Below Thumbnail */}
      <div className="flex items-start gap-3 pt-2.5 pb-2 px-3 sm:px-1">
        {/* Channel Avatar */}
        <img 
          src={getChannelAvatar(channelName)} 
          alt={channelName}
          onError={(e) => {
            (e.target as HTMLImageElement).src = getFallbackChannelAvatar(channelName);
          }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 cursor-pointer border border-gray-200 dark:border-white/10 hover:ring-2 hover:ring-rose-500 transition-all mt-0.5 bg-white dark:bg-zinc-800 p-0.5 shadow-sm"
          onClick={(e) => {
            if (onOpenChannelDetails) {
              e.stopPropagation();
              onOpenChannelDetails(channelName);
            } else {
              onPlay(track);
            }
          }}
          title={`View ${channelName} Channel`}
        />

        {/* Title & Metadata (Middle) */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPlay(track)}>
          <h3 className={`text-sm sm:text-base font-normal leading-snug line-clamp-2 transition-colors ${isPlayingCurrent ? 'text-rose-500 dark:text-rose-400 font-bold' : 'text-gray-900 dark:text-white group-hover:text-rose-400'}`}>
            {title}
          </h3>

          <div className="text-xs text-gray-500 dark:text-[#aaa] font-normal mt-0.5 flex items-center gap-1.5 flex-wrap truncate">
            <span 
              onClick={(e) => {
                if (onOpenChannelDetails) {
                  e.stopPropagation();
                  onOpenChannelDetails(channelName);
                }
              }}
              className="truncate max-w-[150px] sm:max-w-[200px] hover:text-rose-500 hover:underline cursor-pointer transition-colors"
              title={`View ${channelName} Channel`}
            >
              {channelName}
            </span>
            <span>•</span>
            <span>{viewsText}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Three Dots Options Menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/15 rounded-full transition-colors cursor-pointer"
            title="More actions"
          >
            <MoreVertical size={18} />
          </button>

          {/* Android YouTube Bottom Sheet Modal */}
          <YouTubeActionBottomSheet
            isOpen={showMenu}
            onClose={() => setShowMenu(false)}
            track={track}
            onPlay={onPlay}
            onDownload={onDownload}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            onOpenAddToPlaylist={onOpenAddToPlaylist}
            onOpenMetadata={onOpenMetadata}
            onOpenChannelDetails={onOpenChannelDetails}
            onShowToast={onShowToast}
          />
        </div>
      </div>
    </div>
  );
};

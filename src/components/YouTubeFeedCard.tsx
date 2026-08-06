import React, { useState, useRef, useEffect } from 'react';
import { Play, Download, Heart, ListPlus, MoreVertical, Info, Share2, Music } from 'lucide-react';
import { Track } from '../types';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';
import { getChannelAvatar, getFallbackChannelAvatar } from '../utils/channelLogos';

interface YouTubeFeedCardProps {
  track: Track;
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  isPlayingCurrent?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onOpenMetadata?: (track: Track) => void;
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
      {/* Thumbnail Container (Full Width, Aspect 16:9, Perfectly Centered) */}
      <div 
        onClick={() => onPlay(track)}
        className="relative aspect-video w-full sm:rounded-2xl overflow-hidden bg-zinc-900 shadow-md group cursor-pointer border-b sm:border border-white/5 flex items-center justify-center"
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
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 cursor-pointer border border-gray-200 dark:border-white/10 hover:opacity-90 transition-opacity mt-0.5 bg-white dark:bg-zinc-800 p-0.5 shadow-sm"
          onClick={() => onPlay(track)}
        />

        {/* Title & Metadata (Middle) */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPlay(track)}>
          <h3 className={`text-sm sm:text-base font-normal leading-snug line-clamp-2 transition-colors ${isPlayingCurrent ? 'text-rose-500 dark:text-rose-400 font-bold' : 'text-gray-900 dark:text-white group-hover:text-rose-400'}`}>
            {title}
          </h3>

          <div className="text-xs text-gray-500 dark:text-[#aaa] font-normal mt-0.5 flex items-center gap-1.5 flex-wrap truncate">
            <span className="truncate max-w-[150px] sm:max-w-[200px]">
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
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Options"
          >
            <MoreVertical size={18} />
          </button>

          {/* Options Dropdown Popover */}
          {showMenu && (
            <div className="absolute right-0 top-8 bg-slate-900 dark:bg-zinc-900 border border-gray-700/80 dark:border-white/10 text-white rounded-2xl p-1.5 shadow-2xl z-40 min-w-[180px] animate-fade-in space-y-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onPlay(track);
                }}
                className="w-full px-3 py-2 text-xs font-semibold flex items-center gap-2.5 hover:bg-white/10 rounded-xl transition-colors text-left cursor-pointer"
              >
                <Play size={15} className="text-rose-500" />
                <span>Play Track</span>
              </button>

              {onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onToggleFavorite(track);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold flex items-center gap-2.5 hover:bg-white/10 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <Heart size={15} className={isFavorite ? "fill-rose-500 text-rose-500" : "text-rose-400"} />
                  <span>{isFavorite ? 'Remove Favorite' : 'Add to Favorite'}</span>
                </button>
              )}

              {onOpenAddToPlaylist && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onOpenAddToPlaylist(track);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold flex items-center gap-2.5 hover:bg-white/10 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <ListPlus size={15} className="text-indigo-400" />
                  <span>Add to Playlist</span>
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDownload(track);
                }}
                className="w-full px-3 py-2 text-xs font-semibold flex items-center gap-2.5 hover:bg-white/10 rounded-xl transition-colors text-left cursor-pointer"
              >
                <Download size={15} className="text-emerald-400" />
                <span>Download Video/Audio</span>
              </button>

              {onOpenMetadata && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onOpenMetadata(track);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold flex items-center gap-2.5 hover:bg-white/10 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <Info size={15} className="text-blue-400" />
                  <span>YouTube Details</span>
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${videoId}`);
                    if (onShowToast) onShowToast('YouTube link copied!', 'success');
                  }
                }}
                className="w-full px-3 py-2 text-xs font-semibold flex items-center gap-2.5 hover:bg-white/10 rounded-xl transition-colors text-left cursor-pointer"
              >
                <Share2 size={15} className="text-amber-400" />
                <span>Share Link</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

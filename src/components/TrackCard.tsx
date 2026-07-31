import React, { useState, useEffect } from 'react';
import { Play, Download, Heart, Music, ListPlus, Trash2 } from 'lucide-react';
import { Track } from '../types';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';

interface TrackCardProps {
  track: Track;
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onRemoveFromPlaylist?: (track: Track) => void;
  isPlayingCurrent?: boolean;
  viewMode?: 'grid' | 'list';
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  onPlay,
  onDownload,
  isFavorite = false,
  onToggleFavorite,
  onOpenAddToPlaylist,
  onRemoveFromPlaylist,
  isPlayingCurrent = false,
  viewMode = 'grid'
}) => {
  const [imgStage, setImgStage] = useState<number>(0);

  useEffect(() => {
    setImgStage(0);
  }, [track.id]);

  const videoId = extractYouTubeId(track.id);

  // Layered thumbnail fallback strategy: hqdefault -> mqdefault -> 0.jpg -> placeholder
  const getThumb = () => {
    if (!videoId || videoId.length !== 11) {
      return `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop`;
    }
    if (imgStage === 0) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    if (imgStage === 1) return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
    if (imgStage === 2) return `https://i.ytimg.com/vi/${videoId}/0.jpg`;
    return `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop`;
  };

  const title = decodeHtmlEntities(track.title);
  const channel = decodeHtmlEntities(track.channel);

  /* LIST VIEW FORMAT */
  if (viewMode === 'list') {
    return (
      <div 
        onClick={() => onPlay(track)}
        className={`group flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border transition-all duration-300 cursor-pointer active:scale-[0.99] backdrop-blur-xl ${
          isPlayingCurrent 
            ? 'bg-indigo-500/15 dark:bg-indigo-950/60 border-indigo-500/40 dark:border-indigo-500/50 shadow-md ring-2 ring-indigo-500/30' 
            : 'bg-white/70 dark:bg-slate-800/60 border-white/70 dark:border-white/10 hover:border-indigo-500/40 dark:hover:border-indigo-400/40 hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-lg'
        }`}
      >
        {/* Thumbnail */}
        <div className="relative w-20 h-14 sm:w-28 sm:h-18 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-700 shadow-xs flex items-center justify-center">
          {imgStage > 3 ? (
            <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white">
              <Music size={20} />
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
          
          <div className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-300 ${isPlayingCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/40">
              <Play size={16} className="fill-white ml-0.5" />
            </div>
          </div>

          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-md font-bold">
            {track.duration || '3:30'}
          </div>
        </div>
        
        {/* Metadata */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-xs sm:text-sm font-black truncate ${isPlayingCurrent ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
            {title}
          </h4>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5 font-semibold">{channel}</p>
          
          <div className="flex items-center gap-1.5 mt-1">
            {track.publishedTime ? (
              <span className="text-[9px] sm:text-[10px] bg-rose-500/15 dark:bg-rose-400/20 text-rose-600 dark:text-rose-300 px-2 py-0.5 rounded-full font-extrabold truncate border border-rose-500/20">
                {track.publishedTime}
              </span>
            ) : track.aiMoodTags ? (
              <span className="text-[9px] sm:text-[10px] bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold truncate max-w-[120px] border border-indigo-200/50 dark:border-indigo-800/50">
                {track.aiMoodTags}
              </span>
            ) : null}
            {track.views && (
              <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 hidden sm:inline">
                {track.views}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {onOpenAddToPlaylist && (
            <button
              onClick={() => onOpenAddToPlaylist(track)}
              className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all active:scale-90"
              title="Add to Playlist"
            >
              <ListPlus size={16} />
            </button>
          )}

          {onToggleFavorite && (
            <button 
              onClick={() => onToggleFavorite(track)}
              className="p-2 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl transition-all active:scale-90"
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart size={16} className={isFavorite ? "fill-rose-500 text-rose-500" : ""} />
            </button>
          )}

          {onRemoveFromPlaylist && (
            <button
              onClick={() => onRemoveFromPlaylist(track)}
              className="p-2 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl transition-all active:scale-90"
              title="Remove from Playlist"
            >
              <Trash2 size={16} />
            </button>
          )}

          <button 
            onClick={() => onDownload(track)}
            className="p-2 bg-gray-100 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white rounded-xl transition-all active:scale-90 shadow-2xs"
            title="Download Audio/Video"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
    );
  }

  /* GRID VIEW FORMAT (Card orientation) */
  return (
    <div 
      onClick={() => onPlay(track)}
      className={`group flex flex-col p-3 rounded-3xl border transition-all duration-300 cursor-pointer active:scale-[0.98] backdrop-blur-xl h-full justify-between ${
        isPlayingCurrent 
          ? 'bg-indigo-500/15 dark:bg-indigo-950/60 border-indigo-500/40 dark:border-indigo-500/50 shadow-lg ring-2 ring-indigo-500/30' 
          : 'bg-white/70 dark:bg-slate-800/60 border-white/70 dark:border-white/10 hover:border-indigo-500/40 dark:hover:border-indigo-400/40 hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl'
      }`}
    >
      <div>
        {/* Large Thumbnail */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-700 shadow-xs flex items-center justify-center">
          {imgStage > 3 ? (
            <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white">
              <Music size={28} />
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
          
          <div className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-300 ${isPlayingCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/40 scale-90 group-hover:scale-100 transition-transform">
              <Play size={20} className="fill-white ml-0.5" />
            </div>
          </div>

          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-2 py-0.5 rounded-lg font-bold">
            {track.duration || '3:30'}
          </div>

          {isPlayingCurrent && (
            <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> Playing
            </div>
          )}
        </div>
        
        {/* Metadata */}
        <div className="pt-3 px-1">
          <h4 className={`text-xs sm:text-sm font-black line-clamp-2 leading-snug ${isPlayingCurrent ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
            {title}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 font-semibold">{channel}</p>
        </div>
      </div>

      {/* Footer Info & Action Controls */}
      <div className="pt-3 px-1 flex items-center justify-between gap-2 border-t border-gray-100 dark:border-white/5 mt-3" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0 flex-1">
          {track.publishedTime ? (
            <span className="text-[10px] bg-rose-500/15 dark:bg-rose-400/20 text-rose-600 dark:text-rose-300 px-2.5 py-0.5 rounded-full font-extrabold truncate inline-block border border-rose-500/20">
              {track.publishedTime}
            </span>
          ) : track.aiMoodTags ? (
            <span className="text-[10px] bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-bold truncate inline-block max-w-[120px] border border-indigo-200/50 dark:border-indigo-800/50">
              {track.aiMoodTags}
            </span>
          ) : (
            <span className="text-[10px] text-gray-400 font-semibold">{track.views || 'Official Track'}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onOpenAddToPlaylist && (
            <button
              onClick={() => onOpenAddToPlaylist(track)}
              className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all active:scale-90"
              title="Add to Playlist"
            >
              <ListPlus size={17} />
            </button>
          )}

          {onToggleFavorite && (
            <button 
              onClick={() => onToggleFavorite(track)}
              className="p-2 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl transition-all active:scale-90"
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart size={17} className={isFavorite ? "fill-rose-500 text-rose-500" : ""} />
            </button>
          )}

          {onRemoveFromPlaylist && (
            <button
              onClick={() => onRemoveFromPlaylist(track)}
              className="p-2 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl transition-all active:scale-90"
              title="Remove from Playlist"
            >
              <Trash2 size={17} />
            </button>
          )}

          <button 
            onClick={() => onDownload(track)}
            className="p-2 bg-gray-100 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white rounded-xl transition-all active:scale-90 shadow-2xs"
            title="Download Audio/Video"
          >
            <Download size={17} />
          </button>
        </div>
      </div>
    </div>
  );
};

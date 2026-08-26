import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Search, MoreVertical, Play, Download, X, 
  Trash2, Music2, Check, ListPlus, Info, Share2, ThumbsUp
} from 'lucide-react';
import { Track } from '../types';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';
import { getChannelAvatar } from '../utils/channelLogos';

interface YouTubeLikedVideosProps {
  likedTracks: Track[];
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  onDownloadAll?: (tracks: Track[]) => void;
  currentTrackId?: string;
  onToggleLiked: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onOpenMetadata?: (track: Track) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userName?: string;
  onBack?: () => void;
}

export const YouTubeLikedVideos: React.FC<YouTubeLikedVideosProps> = ({
  likedTracks,
  onPlay,
  onDownload,
  onDownloadAll,
  currentTrackId,
  onToggleLiked,
  onOpenAddToPlaylist,
  onOpenMetadata,
  onShowToast,
  userName = 'Bikash Jana',
  onBack
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'videos' | 'shorts'>('all');
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

  // Helper for crisp high-resolution thumbnail
  const getTrackThumb = (track: Track) => {
    if (track.thumbnail && !track.thumbnail.includes('unsplash')) {
      return track.thumbnail;
    }
    const ytid = extractYouTubeId(track.id);
    if (ytid && ytid.length === 11) {
      return `https://i.ytimg.com/vi/${ytid}/hqdefault.jpg`;
    }
    return track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop';
  };

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    let result = [...likedTracks];

    // Filter by type
    if (filterType === 'shorts') {
      result = result.filter(t => {
        const dur = t.duration || '';
        // If duration is less than 1 min or title has #shorts
        return (t.title && t.title.toLowerCase().includes('#shorts')) || dur.startsWith('0:') || dur === '0:59';
      });
    } else if (filterType === 'videos') {
      result = result.filter(t => !t.title?.toLowerCase().includes('#shorts'));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) || 
        (t.channel && t.channel.toLowerCase().includes(q))
      );
    }

    return result;
  }, [likedTracks, filterType, searchQuery]);

  // Hero Cover Image (uses the first liked video's thumbnail)
  const heroImage = useMemo(() => {
    if (likedTracks.length > 0) {
      return getTrackThumb(likedTracks[0]);
    }
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop';
  }, [likedTracks]);

  // Share handler
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      onShowToast('Liked videos link copied!', 'success');
    } else {
      onShowToast('Sharing Liked videos', 'info');
    }
  };

  return (
    <div className="w-full bg-transparent text-slate-900 dark:text-white pb-32 animate-fade-in relative">
      
      {/* 1. TOP AMBIENT BLURRED BACKDROP */}
      <div 
        className="absolute top-0 left-0 right-0 h-80 opacity-25 dark:opacity-40 blur-3xl pointer-events-none transition-all duration-700 -z-0 scale-105"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 25%, rgba(37, 99, 235, 0.4), transparent 70%)`
        }}
      />

      {/* 2. TOP NAVIGATION BAR (Back, Search, 3-Dots Menu) */}
      <div className="relative z-20 flex items-center justify-between py-2.5 mb-2">
        {onBack ? (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full hover:bg-slate-200/80 dark:hover:bg-white/10 flex items-center justify-center text-slate-800 dark:text-white transition-all active:scale-95 cursor-pointer"
            title="Back"
          >
            <ArrowLeft size={22} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <ThumbsUp size={16} />
            </div>
            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">Liked Videos</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`w-10 h-10 rounded-full hover:bg-slate-200/80 dark:hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer ${
              showSearch ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-white'
            }`}
            title="Search liked videos"
          >
            <Search size={20} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowTopMenu(!showTopMenu)}
              className="w-10 h-10 rounded-full hover:bg-slate-200/80 dark:hover:bg-white/10 flex items-center justify-center text-slate-800 dark:text-white transition-all active:scale-95 cursor-pointer"
              title="More options"
            >
              <MoreVertical size={20} />
            </button>

            {/* Top 3-Dots Dropdown */}
            {showTopMenu && (
              <div 
                className="absolute right-0 top-12 w-52 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl"
                onClick={() => setShowTopMenu(false)}
              >
                <button
                  onClick={handleShare}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Share2 size={15} /> Share Liked videos
                </button>
                {onDownloadAll && (
                  <button
                    onClick={() => onDownloadAll(likedTracks)}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                  >
                    <Download size={15} /> Download all Liked songs
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH BAR INPUT (Slide-down if open) */}
      {showSearch && (
        <div className="relative z-20 mb-4 animate-in fade-in slide-in-from-top-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search within Liked videos..."
              autoFocus
              className="w-full bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm px-4 py-2.5 pl-10 rounded-2xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
            />
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. HERO COVER ART (Large 16:9 banner) */}
      <div className="relative z-10 max-w-sm sm:max-w-md mx-auto mb-5">
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-white/10 bg-slate-900">
          <img
            src={heroImage}
            alt="Liked videos"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
        </div>
      </div>

      {/* 4. TITLE & CREATOR METADATA (exact as YouTube Liked videos) */}
      <div className="relative z-10 space-y-1.5 mb-5">
        {/* Title: "Liked videos" */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Liked videos
        </h1>

        {/* Creator Info Row: [B] by Bikash Jana */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-600 to-rose-500 text-white font-black text-xs flex items-center justify-center ring-1 ring-white/20 shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-200">by {userName}</span>
        </div>

        {/* Metadata stats line: Playlist • Private • 308 videos • No views */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap">
          <span>Playlist</span>
          <span>•</span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">Private</span>
          <span>•</span>
          <span>{likedTracks.length} videos</span>
          <span>•</span>
          <span>No views</span>
        </div>
      </div>

      {/* 5. ACTION BUTTONS ROW (▶ Play all, ↓ Download) */}
      <div className="relative z-10 flex items-center gap-3 mb-5">
        {/* PLAY ALL PILL BUTTON */}
        <button
          onClick={() => {
            if (likedTracks.length > 0) {
              onPlay(likedTracks[0]);
              onShowToast(`Playing Liked videos`, 'success');
            } else {
              onShowToast('No liked videos to play yet!', 'info');
            }
          }}
          className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Play size={16} className="fill-current ml-0.5" />
          <span>Play all</span>
        </button>

        {/* DOWNLOAD CIRCLE BUTTON (↓) */}
        <button
          onClick={() => {
            if (onDownloadAll && likedTracks.length > 0) {
              onDownloadAll(likedTracks);
            } else if (likedTracks.length > 0) {
              onDownload(likedTracks[0]);
            } else {
              onShowToast('No liked videos to download', 'info');
            }
          }}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white border border-slate-200/80 dark:border-white/15 flex items-center justify-center active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
          title="Download Liked videos"
        >
          <Download size={18} />
        </button>
      </div>

      {/* 6. FILTER CHIPS (All, Videos, Shorts) */}
      <div className="relative z-10 flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
            filterType === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md'
              : 'bg-slate-100/90 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-200 border border-slate-200 dark:border-white/10'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('videos')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
            filterType === 'videos'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md'
              : 'bg-slate-100/90 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-200 border border-slate-200 dark:border-white/10'
          }`}
        >
          Videos
        </button>
        <button
          onClick={() => setFilterType('shorts')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
            filterType === 'shorts'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md'
              : 'bg-slate-100/90 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-200 border border-slate-200 dark:border-white/10'
          }`}
        >
          Shorts
        </button>
      </div>

      {/* 7. YOUTUBE VIDEO TRACK LIST */}
      <div className="relative z-10 space-y-2">
        {filteredTracks.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white/60 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
            <Music2 size={40} className="text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-300">No liked videos found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery 
                ? 'No tracks matched your search in Liked videos.' 
                : 'Like videos in Home or Search to find them all collected here.'}
            </p>
          </div>
        ) : (
          filteredTracks.map((track, index) => {
            const isPlaying = currentTrackId === track.id;
            const isMenuOpen = activeMenuTrackId === track.id;
            const thumbUrl = getTrackThumb(track);

            return (
              <div
                key={`yt-liked-item-${track.id}-${index}`}
                onClick={() => onPlay(track)}
                className={`group flex items-start gap-3 p-2 rounded-2xl transition-all cursor-pointer relative ${
                  isPlaying 
                    ? 'bg-blue-500/15 border border-blue-500/40 shadow-xs' 
                    : 'hover:bg-white/80 dark:hover:bg-slate-900/80 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-800'
                }`}
              >
                {/* 16:9 Video Thumbnail with Duration Badge & Red Progress Bar */}
                <div className="relative w-32 sm:w-40 aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0 shadow-md">
                  <img
                    src={thumbUrl}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop';
                    }}
                  />

                  {/* Duration Badge on bottom-right (e.g. 23:19) */}
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.2 bg-black/85 text-[10px] font-bold text-white rounded-md">
                    {track.duration || '23:19'}
                  </span>

                  {/* Red Watched Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700/80">
                    <div 
                      className="h-full bg-rose-600 rounded-r-full"
                      style={{ width: `${((index * 37) % 75) + 25}%` }}
                    />
                  </div>

                  {/* Active playing equalizer indicator */}
                  {isPlaying && (
                    <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center backdrop-blur-xs">
                      <div className="flex items-center gap-0.5">
                        <span className="w-1 h-4 bg-white rounded-full animate-bounce" />
                        <span className="w-1 h-6 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Info (Title, Channel, Views & Time) */}
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className={`text-xs sm:text-sm font-bold line-clamp-2 leading-snug ${
                    isPlaying ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-white'
                  }`}>
                    {decodeHtmlEntities(track.title)}
                  </h3>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate mt-0.5">
                    {decodeHtmlEntities(track.channel || track.artist || 'Crazy XYZ')}
                  </p>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    {track.views || '1.5M views'} • {track.publishedTime || '2 days ago'}
                  </p>
                </div>

                {/* 3-Dots Action Menu */}
                <div className="relative shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuTrackId(isMenuOpen ? null : track.id);
                    }}
                    className="w-8 h-8 rounded-full hover:bg-slate-200/80 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {/* Track 3-Dots Dropdown */}
                  {isMenuOpen && (
                    <div 
                      className="absolute right-0 top-8 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-1.5 z-30 animate-in fade-in"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuTrackId(null);
                      }}
                    >
                      <button
                        onClick={() => onPlay(track)}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <Play size={14} /> Play Now
                      </button>
                      <button
                        onClick={() => onDownload(track)}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <Download size={14} /> Download Audio/Video
                      </button>
                      {onOpenAddToPlaylist && (
                        <button
                          onClick={() => onOpenAddToPlaylist(track)}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <ListPlus size={14} /> Save to playlist
                        </button>
                      )}
                      {onOpenMetadata && (
                        <button
                          onClick={() => onOpenMetadata(track)}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <Info size={14} /> View Details & Lyrics
                        </button>
                      )}
                      <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
                      <button
                        onClick={() => {
                          onToggleLiked(track);
                          onShowToast('Removed from Liked videos', 'info');
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-rose-500/10 dark:hover:bg-rose-500/20 flex items-center gap-2 text-rose-600 dark:text-rose-400 cursor-pointer"
                      >
                        <Trash2 size={14} /> Remove from Liked videos
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

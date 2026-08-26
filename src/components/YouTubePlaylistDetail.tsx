import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Search, MoreVertical, Play, Plus, Pencil, Share2, 
  Download, ChevronDown, X, ThumbsUp, ThumbsDown, Trash2, Music2,
  Check, ListPlus, Info
} from 'lucide-react';
import { Track, Playlist } from '../types';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';
import { getChannelAvatar } from '../utils/channelLogos';

interface YouTubePlaylistDetailProps {
  playlist: Playlist;
  onBack: () => void;
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  onDownloadPlaylist?: (playlist: Playlist) => void;
  currentTrackId?: string;
  isFavorite?: (track: Track) => boolean;
  onToggleFavorite?: (track: Track) => void;
  onRemoveTrackFromPlaylist?: (playlistId: string, trackId: string) => void;
  onUpdatePlaylist?: (playlistId: string, name: string, description: string, coverUrl?: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onOpenMetadata?: (track: Track) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userName?: string;
}

export const YouTubePlaylistDetail: React.FC<YouTubePlaylistDetailProps> = ({
  playlist,
  onBack,
  onPlay,
  onDownload,
  onDownloadPlaylist,
  currentTrackId,
  isFavorite,
  onToggleFavorite,
  onRemoveTrackFromPlaylist,
  onUpdatePlaylist,
  onDeletePlaylist,
  onOpenAddToPlaylist,
  onOpenMetadata,
  onShowToast,
  userName = 'Bikash Jana'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortOption, setSortOption] = useState<'top_voted' | 'newest' | 'oldest' | 'popular'>('top_voted');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNoticeBanner, setShowNoticeBanner] = useState(true);
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());

  // Edit fields
  const [editName, setEditName] = useState(playlist.name);
  const [editDesc, setEditDesc] = useState(playlist.description || '');

  // Helper to get high-res thumbnail for a track
  const getTrackThumb = (track: Track) => {
    if (track.thumbnail && !track.thumbnail.includes('unsplash')) {
      return track.thumbnail;
    }
    const ytid = extractYouTubeId(track.id);
    if (ytid && ytid.length === 11) {
      return `https://i.ytimg.com/vi/${ytid}/hqdefault.jpg`;
    }
    return track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop';
  };

  // Like / Dislike interaction
  const toggleLikeTrack = (trackId: string) => {
    setLikedTrackIds(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
        onShowToast('Removed like', 'info');
      } else {
        next.add(trackId);
        onShowToast('Liked video', 'success');
      }
      return next;
    });
  };

  // Filter and sort tracks
  const processedTracks = useMemo(() => {
    let result = [...playlist.tracks];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) || 
        (t.channel && t.channel.toLowerCase().includes(q))
      );
    }

    // Sort order
    if (sortOption === 'newest') {
      result.reverse();
    } else if (sortOption === 'popular' || sortOption === 'top_voted') {
      result.sort((a, b) => {
        const vA = parseInt((a.views || '0').replace(/[^0-9]/g, '')) || 0;
        const vB = parseInt((b.views || '0').replace(/[^0-9]/g, '')) || 0;
        return vB - vA;
      });
    }

    return result;
  }, [playlist.tracks, searchQuery, sortOption]);

  // Total views estimation
  const totalViewsFormatted = useMemo(() => {
    const total = playlist.tracks.reduce((acc, t) => {
      const num = parseInt((t.views || '100').replace(/[^0-9]/g, '')) || 100;
      return acc + num;
    }, 239);
    if (total >= 1000000) return `${(total / 1000000).toFixed(1)}M`;
    if (total >= 1000) return `${(total / 1000).toFixed(1)}K`;
    return `${total}`;
  }, [playlist.tracks]);

  // Playlist Hero Image
  const heroImage = useMemo(() => {
    if (playlist.tracks.length > 0) {
      return getTrackThumb(playlist.tracks[0]);
    }
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop';
  }, [playlist.tracks]);

  // Handle Share
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      onShowToast('Playlist link copied to clipboard!', 'success');
    } else {
      onShowToast(`Sharing "${playlist.name}"`, 'info');
    }
  };

  // Handle Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    if (onUpdatePlaylist) {
      onUpdatePlaylist(playlist.id, editName, editDesc);
    }
    setShowEditModal(false);
    onShowToast('Playlist details updated', 'success');
  };

  return (
    <div className="w-full bg-transparent text-slate-900 dark:text-white pb-32 animate-fade-in relative">
      
      {/* 1. TOP AMBIENT BLURRED BACKDROP */}
      <div 
        className="absolute top-0 left-0 right-0 h-80 opacity-25 dark:opacity-40 blur-3xl pointer-events-none transition-all duration-700 -z-0 scale-105"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 25%, rgba(16, 185, 129, 0.4), transparent 70%)`
        }}
      />

      {/* 2. TOP NAVIGATION BAR (Back, Search, 3-Dots Menu) */}
      <div className="relative z-20 flex items-center justify-between py-2.5 mb-2">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full hover:bg-slate-200/80 dark:hover:bg-white/10 flex items-center justify-center text-slate-800 dark:text-white transition-all active:scale-95 cursor-pointer"
          title="Back to Library"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`w-10 h-10 rounded-full hover:bg-slate-200/80 dark:hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer ${
              showSearch ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'
            }`}
            title="Search songs in playlist"
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
                  onClick={() => setShowEditModal(true)}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Pencil size={15} /> Edit playlist
                </button>
                <button
                  onClick={handleShare}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Share2 size={15} /> Share playlist
                </button>
                {onDownloadPlaylist && (
                  <button
                    onClick={() => onDownloadPlaylist(playlist)}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                  >
                    <Download size={15} /> Download all songs
                  </button>
                )}
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
                <button
                  onClick={() => {
                    onDeletePlaylist(playlist.id);
                    onBack();
                    onShowToast('Playlist deleted', 'info');
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-rose-500/10 dark:hover:bg-rose-500/20 flex items-center gap-2.5 text-rose-600 dark:text-rose-400 cursor-pointer"
                >
                  <Trash2 size={15} /> Delete playlist
                </button>
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
              placeholder="Search within this playlist..."
              autoFocus
              className="w-full bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm px-4 py-2.5 pl-10 rounded-2xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-lg"
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

      {/* 3. HERO PLAYLIST COVER ART (Large rounded banner with floating edit pencil button) */}
      <div className="relative z-10 max-w-sm sm:max-w-md mx-auto mb-5">
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-white/10 bg-slate-900">
          <img
            src={heroImage}
            alt={playlist.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

          {/* EDIT PENCIL FLOATING BUTTON IN BOTTOM-RIGHT OF THUMBNAIL */}
          <button
            onClick={() => setShowEditModal(true)}
            className="absolute bottom-3.5 right-3.5 w-11 h-11 rounded-full bg-white text-slate-950 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-black/10 group cursor-pointer"
            title="Edit Playlist Details"
          >
            <Pencil size={18} className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>

      {/* 4. PLAYLIST TITLE & METADATA SECTION */}
      <div className="relative z-10 space-y-2 mb-6">
        {/* Playlist Name */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          {playlist.name}
        </h1>

        {/* Creator Info Row */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-600 to-rose-500 text-white font-black text-xs flex items-center justify-center ring-1 ring-white/20 shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-slate-400">...</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">by {userName}</span>
        </div>

        {/* Metadata stats line */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap">
          <span>Playlist</span>
          <span>•</span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">Public</span>
          <span>•</span>
          <span>{playlist.tracks.length} videos</span>
          <span>•</span>
          <span>{totalViewsFormatted} views</span>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal leading-relaxed pt-0.5">
          {playlist.description || "Number of song you can find here."}
        </p>
      </div>

      {/* 5. ACTION BUTTONS ROW (▶ Play all, +, Pencil, Share, Download) */}
      <div className="relative z-10 flex items-center gap-2.5 sm:gap-3.5 mb-6 overflow-x-auto no-scrollbar py-1">
        {/* PLAY ALL PILL BUTTON */}
        <button
          onClick={() => {
            if (playlist.tracks.length > 0) {
              onPlay(playlist.tracks[0]);
              onShowToast(`Playing all songs in ${playlist.name}`, 'success');
            } else {
              onShowToast('Playlist is empty. Add songs to play!', 'info');
            }
          }}
          className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Play size={16} className="fill-current ml-0.5" />
          <span>Play all</span>
        </button>

        {/* '+' ADD / SAVE BUTTON */}
        <button
          onClick={() => {
            onShowToast('Add songs to this playlist from Search or Home cards', 'info');
          }}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white border border-slate-200/80 dark:border-white/15 flex items-center justify-center active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
          title="Add videos to playlist"
        >
          <Plus size={20} />
        </button>

        {/* PENCIL (EDIT) BUTTON */}
        <button
          onClick={() => setShowEditModal(true)}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white border border-slate-200/80 dark:border-white/15 flex items-center justify-center active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
          title="Edit playlist metadata"
        >
          <Pencil size={17} />
        </button>

        {/* SHARE ARROW BUTTON */}
        <button
          onClick={handleShare}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white border border-slate-200/80 dark:border-white/15 flex items-center justify-center active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
          title="Share playlist"
        >
          <Share2 size={18} />
        </button>

        {/* DOWNLOAD BUTTON */}
        <button
          onClick={() => {
            if (onDownloadPlaylist && playlist.tracks.length > 0) {
              onDownloadPlaylist(playlist);
            } else {
              onShowToast('Downloading playlist tracks...', 'info');
            }
          }}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white border border-slate-200/80 dark:border-white/15 flex items-center justify-center active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
          title="Download entire playlist"
        >
          <Download size={18} />
        </button>
      </div>

      {/* 6. SORT FILTER DROPDOWN (Top voted ⌄) */}
      <div className="relative z-10 mb-4 flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-white/10 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <span>
              {sortOption === 'top_voted' && 'Top voted'}
              {sortOption === 'newest' && 'Date added (newest)'}
              {sortOption === 'oldest' && 'Date added (oldest)'}
              {sortOption === 'popular' && 'Most popular'}
            </span>
            <ChevronDown size={14} />
          </button>

          {showSortMenu && (
            <div 
              className="absolute left-0 top-10 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/90 rounded-2xl shadow-2xl py-1.5 z-40 animate-in fade-in"
              onClick={() => setShowSortMenu(false)}
            >
              <button
                onClick={() => setSortOption('top_voted')}
                className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between cursor-pointer ${
                  sortOption === 'top_voted' ? 'text-rose-600 dark:text-rose-400 bg-slate-100 dark:bg-white/5' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <span>Top voted</span>
                {sortOption === 'top_voted' && <Check size={14} />}
              </button>
              <button
                onClick={() => setSortOption('newest')}
                className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between cursor-pointer ${
                  sortOption === 'newest' ? 'text-rose-600 dark:text-rose-400 bg-slate-100 dark:bg-white/5' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <span>Date added (newest)</span>
                {sortOption === 'newest' && <Check size={14} />}
              </button>
              <button
                onClick={() => setSortOption('oldest')}
                className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between cursor-pointer ${
                  sortOption === 'oldest' ? 'text-rose-600 dark:text-rose-400 bg-slate-100 dark:bg-white/5' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <span>Date added (oldest)</span>
                {sortOption === 'oldest' && <Check size={14} />}
              </button>
              <button
                onClick={() => setSortOption('popular')}
                className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between cursor-pointer ${
                  sortOption === 'popular' ? 'text-rose-600 dark:text-rose-400 bg-slate-100 dark:bg-white/5' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <span>Most popular</span>
                {sortOption === 'popular' && <Check size={14} />}
              </button>
            </div>
          )}
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
          {processedTracks.length} of {playlist.tracks.length} tracks
        </span>
      </div>

      {/* 7. NOTICE BANNER */}
      {showNoticeBanner && (
        <div className="relative z-10 mb-4 bg-white/70 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 shadow-xs backdrop-blur-md">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {playlist.tracks.length === 0 ? 'Playlist is currently empty' : '5 unavailable videos are hidden'}
          </span>
          <button
            onClick={() => setShowNoticeBanner(false)}
            className="w-7 h-7 rounded-full hover:bg-slate-200/80 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 8. YOUTUBE MOBILE VIDEO TRACK LIST */}
      <div className="relative z-10 space-y-2">
        {processedTracks.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white/60 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
            <Music2 size={40} className="text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-300">No videos found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery ? 'No tracks matched your search in this playlist.' : 'Browse music in Search or Home and tap the "+ Playlist" button on any track to add it here.'}
            </p>
          </div>
        ) : (
          processedTracks.map((track, index) => {
            const isPlaying = currentTrackId === track.id;
            const isLiked = likedTrackIds.has(track.id);
            const isMenuOpen = activeMenuTrackId === track.id;
            const thumbUrl = getTrackThumb(track);
            const channelAvatar = getChannelAvatar(track.channel);

            return (
              <div
                key={`yt-playlist-item-${track.id}-${index}`}
                onClick={() => onPlay(track)}
                className={`group flex items-start gap-3 p-2 rounded-2xl transition-all cursor-pointer relative ${
                  isPlaying 
                    ? 'bg-rose-500/15 border border-rose-500/40 shadow-xs' 
                    : 'hover:bg-white/80 dark:hover:bg-slate-900/80 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-800'
                }`}
              >
                {/* 16:9 Video Thumbnail with Overlay Badges */}
                <div className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0 shadow-md">
                  <img
                    src={thumbUrl}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop';
                    }}
                  />

                  {/* 4K / Quality Badge on bottom-left */}
                  <span className="absolute bottom-1 left-1 px-1 py-0.2 bg-black/80 text-[9px] font-black text-white rounded-xs">
                    4K
                  </span>

                  {/* Duration Badge on bottom-right (e.g. 12:53) */}
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.2 bg-black/85 text-[10px] font-bold text-white rounded-md">
                    {track.duration || '3:45'}
                  </span>

                  {/* Creator Avatar Bubble on thumbnail corner */}
                  <div className="absolute top-1 left-1 w-5 h-5 rounded-full overflow-hidden bg-rose-600 border border-white/30 text-white font-black text-[9px] flex items-center justify-center shadow-xs">
                    {channelAvatar ? (
                      <img src={channelAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{userName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Active playing equalizer indicator */}
                  {isPlaying && (
                    <div className="absolute inset-0 bg-rose-600/30 flex items-center justify-center backdrop-blur-xs">
                      <div className="flex items-center gap-0.5">
                        <span className="w-1 h-4 bg-white rounded-full animate-bounce" />
                        <span className="w-1 h-6 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Info (Title, Channel, Like/Dislike) */}
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className={`text-xs sm:text-sm font-bold line-clamp-2 leading-snug ${
                    isPlaying ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-white'
                  }`}>
                    {decodeHtmlEntities(track.title)}
                  </h3>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate mt-0.5">
                    {decodeHtmlEntities(track.channel || track.artist || 'Sony Music India')}
                  </p>

                  {/* Interactive Vote / Like & Stats row */}
                  <div className="flex items-center gap-3 mt-1.5 text-slate-500 dark:text-slate-400 text-[10px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeTrack(track.id);
                      }}
                      className={`flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${
                        isLiked ? 'text-rose-600 dark:text-rose-400 font-bold' : ''
                      }`}
                      title="Like"
                    >
                      <ThumbsUp size={12} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
                      <span>{isLiked ? '1' : '0'}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowToast('Feedback recorded', 'info');
                      }}
                      className="flex items-center hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Dislike"
                    >
                      <ThumbsDown size={12} />
                    </button>

                    <span>•</span>
                    <span>{track.views || '120K'}</span>
                  </div>
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
                          <ListPlus size={14} /> Save to another playlist
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
                      {onRemoveTrackFromPlaylist && (
                        <>
                          <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
                          <button
                            onClick={() => {
                              onRemoveTrackFromPlaylist(playlist.id, track.id);
                              onShowToast('Removed from playlist', 'info');
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-rose-500/10 dark:hover:bg-rose-500/20 flex items-center gap-2 text-rose-600 dark:text-rose-400 cursor-pointer"
                          >
                            <Trash2 size={14} /> Remove from playlist
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 9. EDIT PLAYLIST MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil size={18} className="text-rose-500" /> Edit Playlist
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Playlist Title
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Song"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Number of song you can find here."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/30 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

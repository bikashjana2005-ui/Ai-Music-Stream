import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Share2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown, 
  Music2, 
  CheckCircle2, 
  Send, 
  X,
  Compass,
  Zap,
  Search,
  Flame,
  Radio
} from 'lucide-react';
import { Track } from '../types';
import { DEFAULT_TRACKS } from '../data/fallbackTracks';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';
import { getChannelAvatar, getFallbackChannelAvatar } from '../utils/channelLogos';

interface ShortsViewProps {
  onPlay: (track: Track) => void;
  currentTrackId?: string;
  favorites: Track[];
  onToggleFavorite: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onDownload?: (track: Track) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type ShortsTabMode = 'play' | 'discover';

interface ShortItem {
  id: string;
  title: string;
  channel: string;
  views: string;
  youtubeId: string;
  category: string;
  trackRef: Track;
}

export const ShortsView: React.FC<ShortsViewProps> = ({
  onPlay,
  favorites,
  onToggleFavorite,
  onShowToast
}) => {
  // Mode: Play Shorts vs Discover Shorts
  const [activeMode, setActiveMode] = useState<ShortsTabMode>('play');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract a curated list of vertical shorts from DEFAULT_TRACKS
  const shortsList: ShortItem[] = useMemo(() => {
    return DEFAULT_TRACKS.map((t, idx) => {
      const vid = extractYouTubeId(t.id || (t as any).youtubeUrl || '') || 'BddP6PYo2gs';
      const categories = ['Trending', 'Music', 'Bengali', 'Viral', 'Hits'];
      return {
        id: t.id,
        title: decodeHtmlEntities(t.title || 'YouTube Short Video'),
        channel: decodeHtmlEntities(t.channel || t.artist || 'Official Channel'),
        views: t.views || `${(idx * 140 + 320) % 950 + 50}K views`,
        youtubeId: vid,
        category: categories[idx % categories.length],
        trackRef: t,
      };
    });
  }, []);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [likedShorts, setLikedShorts] = useState<Set<string>>(new Set());
  const [dislikedShorts, setDislikedShorts] = useState<Set<string>>(new Set());
  const [subscribedChannels, setSubscribedChannels] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState<boolean>(false);
  const [comments, setComments] = useState<string[]>([
    'This scene was so thrilling! 🔥',
    'Best song and performance! Can’t stop listening. ❤️',
    'Amazing cinematography & rhythm! ✨',
    'Ai Music Stream HD playback is pure magic!'
  ]);
  const [commentInput, setCommentInput] = useState<string>('');

  const currentShort = shortsList[currentIndex] || shortsList[0];
  const activeVideoId = currentShort.youtubeId;
  const channel = currentShort.channel;
  const channelHandle = `@${channel.replace(/[^a-zA-Z0-9]/g, '') || 'Creator'}`;
  const isLiked = likedShorts.has(currentShort.id);
  const isDisliked = dislikedShorts.has(currentShort.id);
  const isSubscribed = subscribedChannels.has(channel);

  // Discover shorts filtering
  const filteredShorts = useMemo(() => {
    return shortsList.filter((s) => {
      const matchesCat = selectedCategory === 'All' || s.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesQuery = !searchQuery.trim() || 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.channel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [shortsList, selectedCategory, searchQuery]);

  const handleNextShort = () => {
    setCurrentIndex((prev) => (prev < shortsList.length - 1 ? prev + 1 : 0));
  };

  const handlePrevShort = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : shortsList.length - 1));
  };

  const handleSelectShortFromDiscover = (index: number) => {
    setCurrentIndex(index);
    setActiveMode('play');
    setIsPlaying(true);
  };

  const handleToggleLike = () => {
    setLikedShorts((prev) => {
      const next = new Set(prev);
      if (next.has(currentShort.id)) {
        next.delete(currentShort.id);
        onShowToast('Removed from Liked', 'info');
      } else {
        next.add(currentShort.id);
        onShowToast('Added to Liked Shorts ❤️', 'success');
        if (currentShort.trackRef) onToggleFavorite(currentShort.trackRef);
      }
      return next;
    });
    setDislikedShorts((prev) => {
      const next = new Set(prev);
      next.delete(currentShort.id);
      return next;
    });
  };

  const handleToggleDislike = () => {
    setDislikedShorts((prev) => {
      const next = new Set(prev);
      if (next.has(currentShort.id)) {
        next.delete(currentShort.id);
      } else {
        next.add(currentShort.id);
        onShowToast('Disliked Short', 'info');
      }
      return next;
    });
    setLikedShorts((prev) => {
      const next = new Set(prev);
      next.delete(currentShort.id);
      return next;
    });
  };

  const handleToggleSubscribe = () => {
    setSubscribedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(channel)) {
        next.delete(channel);
        onShowToast(`Unsubscribed from ${channel}`, 'info');
      } else {
        next.add(channel);
        onShowToast(`Subscribed to ${channel}! 🔔`, 'success');
      }
      return next;
    });
  };

  const handleShare = async () => {
    const url = `https://youtube.com/shorts/${activeVideoId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: currentShort.title, text: `Watch ${currentShort.title} on Shorts`, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      onShowToast('Shorts link copied to clipboard! 🔗', 'success');
    } catch {
      onShowToast('Could not copy link', 'error');
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setComments((prev) => [commentInput.trim(), ...prev]);
    setCommentInput('');
    onShowToast('Comment posted! ✨', 'success');
  };

  // Keyboard navigation when in player mode
  useEffect(() => {
    if (activeMode !== 'play') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') handleNextShort();
      if (e.key === 'ArrowUp') handlePrevShort();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, activeMode]);

  const iframeSrc = `https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=${isPlaying ? 1 : 0}&enablejsapi=1&rel=0&playsinline=1&modestbranding=1&controls=0&loop=1`;

  const categories = ['All', 'Trending', 'Music', 'Bengali', 'Viral', 'Hits'];

  return (
    <div className="w-full flex flex-col items-center justify-start select-none px-2 sm:px-4 py-2">
      {/* ========================================================================= */}
      {/* TOP TOGGLE: Play Shorts vs Discover Shorts                                */}
      {/* ========================================================================= */}
      <div className="w-full max-w-md flex items-center justify-between gap-2 mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-900/90 border border-white/10 shadow-md">
          <button
            type="button"
            onClick={() => setActiveMode('play')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-75 cursor-pointer active:scale-95 ${
              activeMode === 'play'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Zap size={13} className={activeMode === 'play' ? 'fill-white' : ''} />
            <span>Play Shorts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('discover')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-75 cursor-pointer active:scale-95 ${
              activeMode === 'discover'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Compass size={13} />
            <span>Discover Shorts</span>
          </button>
        </div>

        {/* Mute toggle when playing */}
        {activeMode === 'play' && (
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer active:scale-90"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: PLAY SHORTS (YouTube Official Mobile Vertical Format)             */}
      {/* ========================================================================= */}
      {activeMode === 'play' && (
        <div className="relative w-full h-[calc(100vh-140px)] sm:h-[calc(100vh-155px)] max-w-md mx-auto flex items-center justify-center overflow-hidden">
          {/* 9:16 Aspect Vertical Shorts Container */}
          <div className="relative w-full h-full max-w-[420px] aspect-[9/16] bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between">
            
            {/* Video Iframe Canvas */}
            <div 
              className="absolute inset-0 z-0 bg-black flex items-center justify-center cursor-pointer"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              <iframe
                key={`short-${activeVideoId}-${currentIndex}`}
                src={iframeSrc}
                title={currentShort.title}
                className={`w-full h-full border-0 object-cover scale-[1.04] transition-opacity duration-150 ${isPlaying ? 'opacity-100' : 'opacity-80'}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />

              {/* Pause Center Indicator */}
              {!isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                  <div className="p-4 rounded-full bg-black/75 text-white shadow-2xl backdrop-blur-md ring-1 ring-white/20">
                    <Play size={36} className="fill-white ml-1" />
                  </div>
                </div>
              )}
            </div>

            {/* Top Bar Overlay */}
            <div className="relative z-20 w-full p-3.5 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/85 via-black/30 to-transparent">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-tight text-white flex items-center gap-1.5 drop-shadow-md">
                  <span className="text-red-500">⚡</span>
                  <span>Shorts</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-md">
                  {currentIndex + 1} / {shortsList.length}
                </span>
              </div>

              {/* Quick Navigation Arrows */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevShort}
                  className="p-1.5 rounded-full bg-black/55 hover:bg-black/80 text-white backdrop-blur-md transition-colors cursor-pointer active:scale-90"
                  title="Previous Short"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNextShort}
                  className="p-1.5 rounded-full bg-black/55 hover:bg-black/80 text-white backdrop-blur-md transition-colors cursor-pointer active:scale-90"
                  title="Next Short"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Right Side Vertical Action Rail */}
            <div className="absolute right-2.5 bottom-16 z-20 flex flex-col items-center gap-3.5 pointer-events-auto">
              {/* Like */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`p-3 rounded-full backdrop-blur-md transition-all active:scale-85 duration-75 cursor-pointer shadow-lg ${
                    isLiked
                      ? 'bg-red-600 text-white shadow-red-600/50'
                      : 'bg-black/55 text-white hover:bg-black/75'
                  }`}
                  title="Like"
                >
                  <ThumbsUp size={20} className={isLiked ? 'fill-white' : ''} />
                </button>
                <span className="text-[11px] font-bold text-white drop-shadow-md">
                  {isLiked ? '14.8K' : '14.7K'}
                </span>
              </div>

              {/* Dislike */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={handleToggleDislike}
                  className={`p-3 rounded-full backdrop-blur-md transition-all active:scale-85 duration-75 cursor-pointer shadow-lg ${
                    isDisliked
                      ? 'bg-zinc-700 text-red-400'
                      : 'bg-black/55 text-white hover:bg-black/75'
                  }`}
                  title="Dislike"
                >
                  <ThumbsDown size={20} className={isDisliked ? 'fill-red-400' : ''} />
                </button>
                <span className="text-[11px] font-bold text-white drop-shadow-md">
                  Dislike
                </span>
              </div>

              {/* Comments */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowComments(true)}
                  className="p-3 rounded-full bg-black/55 hover:bg-black/75 text-white backdrop-blur-md transition-all active:scale-85 duration-75 cursor-pointer shadow-lg"
                  title="Comments"
                >
                  <MessageSquare size={20} />
                </button>
                <span className="text-[11px] font-bold text-white drop-shadow-md">
                  {comments.length}
                </span>
              </div>

              {/* Share */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={handleShare}
                  className="p-3 rounded-full bg-black/55 hover:bg-black/75 text-white backdrop-blur-md transition-all active:scale-85 duration-75 cursor-pointer shadow-lg"
                  title="Share"
                >
                  <Share2 size={20} />
                </button>
                <span className="text-[11px] font-bold text-white drop-shadow-md">
                  Share
                </span>
              </div>

              {/* Discover Shortcut */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveMode('discover')}
                  className="p-2.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white backdrop-blur-md transition-all active:scale-85 duration-75 cursor-pointer shadow-lg"
                  title="Discover More Shorts"
                >
                  <Compass size={18} />
                </button>
                <span className="text-[10px] font-bold text-white drop-shadow-md">
                  Discover
                </span>
              </div>

              {/* Spinning Disc Audio Ticker */}
              <div className="pt-0.5 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-950 border border-white/20 p-0.5 flex items-center justify-center shadow-lg ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-red-400">
                    <Music2 size={14} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Left Channel & Video Details */}
            <div className="relative z-20 p-3.5 pb-4 flex flex-col gap-1.5 pointer-events-auto bg-gradient-to-t from-black/95 via-black/65 to-transparent">
              {/* Channel Profile Row */}
              <div className="flex items-center gap-2">
                <img
                  src={getChannelAvatar(channel)}
                  alt={channel}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getFallbackChannelAvatar(channel);
                  }}
                  className="w-8 h-8 rounded-full object-cover border-2 border-white/70 shadow-md"
                />
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-white drop-shadow-md truncate">
                    {channelHandle}
                  </span>
                  <CheckCircle2 size={13} className="text-red-400 shrink-0" />
                </div>

                <button
                  type="button"
                  onClick={handleToggleSubscribe}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 duration-75 cursor-pointer ml-1 shrink-0 ${
                    isSubscribed
                      ? 'bg-zinc-800 text-zinc-300 border border-white/20'
                      : 'bg-white text-black hover:bg-zinc-200 shadow-md'
                  }`}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>

              {/* Video Title & Hashtags */}
              <div className="max-w-[80%]">
                <p className="text-xs sm:text-[13px] text-white font-medium line-clamp-2 leading-snug drop-shadow-md">
                  {currentShort.title} <span className="text-blue-400 font-bold">#shorts</span> <span className="text-red-400 font-bold">#viral</span>
                </p>
              </div>

              {/* Sound Ticker */}
              <div className="flex items-center gap-1.5 text-white/90 text-[11px] font-medium drop-shadow-md">
                <Music2 size={12} className="text-red-400 shrink-0" />
                <span className="truncate max-w-[200px]">
                  Original sound - {channel}
                </span>
              </div>
            </div>

            {/* Bottom Red Progress Scrubber Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/20 z-30">
              <div className={`h-full bg-red-600 transition-all duration-300 ${isPlaying ? 'w-3/5' : 'w-1/3'}`} />
            </div>

            {/* Comments Bottom Sheet */}
            {showComments && (
              <div 
                className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex flex-col justify-end"
                onClick={() => setShowComments(false)}
              >
                <div 
                  className="w-full h-[65%] bg-zinc-950 text-white rounded-t-3xl border-t border-white/10 flex flex-col p-4 space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Comments</span>
                      <span className="text-xs text-zinc-400 font-normal">({comments.length})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowComments(false)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Comments list */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {comments.map((comm, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs">
                        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {idx === 0 ? 'B' : `U${idx}`}
                        </div>
                        <div className="flex-1">
                          <p className="text-zinc-400 text-[10px] font-semibold">User @fan_{idx + 104}</p>
                          <p className="text-zinc-200 leading-snug mt-0.5">{comm}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <input
                      type="text"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-zinc-900 text-white text-xs px-3 py-2 rounded-xl border border-white/15 focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-xl bg-red-600 text-white font-bold cursor-pointer active:scale-90"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: DISCOVER SHORTS (YouTube Shorts Feed / Discover Grid Shelf)        */}
      {/* ========================================================================= */}
      {activeMode === 'discover' && (
        <div className="w-full max-w-4xl mx-auto flex flex-col space-y-3 pb-20">
          {/* Search Box inside Discover Shorts */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shorts, creators, or trending topics..."
              className="w-full bg-zinc-900/90 text-white text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-75 cursor-pointer active:scale-95 ${
                  selectedCategory === cat
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
                }`}
              >
                {cat === 'Trending' && <Flame size={12} className="inline mr-1 text-amber-400" />}
                {cat === 'Music' && <Music2 size={12} className="inline mr-1 text-rose-400" />}
                {cat}
              </button>
            ))}
          </div>

          {/* Shorts Grid matching YouTube Shorts mobile/desktop feed */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 pt-1">
            {filteredShorts.map((short, idx) => {
              const originalIndex = shortsList.findIndex(s => s.id === short.id);
              const thumbUrl = `https://i.ytimg.com/vi/${short.youtubeId}/hqdefault.jpg`;

              return (
                <div
                  key={`discover-short-${short.id}-${idx}`}
                  onClick={() => handleSelectShortFromDiscover(originalIndex >= 0 ? originalIndex : 0)}
                  className="group relative flex flex-col rounded-2xl overflow-hidden bg-zinc-900/80 border border-white/10 hover:border-red-500/50 cursor-pointer transition-all duration-150 hover:-translate-y-1 hover:shadow-xl shadow-md"
                >
                  {/* Vertical 9:16 Aspect Thumbnail */}
                  <div className="relative aspect-[9/16] w-full bg-black overflow-hidden">
                    <img
                      src={thumbUrl}
                      alt={short.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />

                    {/* Top Shorts Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-black text-white border border-white/10">
                      <span className="text-red-500">⚡</span>
                      <span>Shorts</span>
                    </div>

                    {/* Center Play Button on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="p-3 rounded-full bg-red-600 text-white shadow-xl scale-90 group-hover:scale-100 transition-transform">
                        <Play size={20} className="fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Bottom Metadata inside thumbnail */}
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <p className="text-xs font-bold line-clamp-2 leading-tight drop-shadow-md">
                        {short.title}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-zinc-300 mt-1">
                        <span className="truncate max-w-[65%]">{short.channel}</span>
                        <span className="font-bold text-red-400">{short.views}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

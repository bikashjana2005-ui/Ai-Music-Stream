import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Sparkles,
  Download,
  ListPlus,
  MoreHorizontal,
  CheckCircle2,
  Send,
  X,
  Play,
  Pause,
  Shuffle,
  RefreshCw,
  Film,
  Bell,
  RotateCcw,
  RotateCw,
  SkipForward,
  Settings,
  Volume2,
  VolumeX,
  Maximize2,
  Check,
  Cast,
  Square,
  Tv,
  Repeat,
  Eye,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Track, RealtimeComment } from '../types';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';
import { getChannelAvatar, getFallbackChannelAvatar } from '../utils/channelLogos';
import { subscribeToVideoComments, postRealtimeComment, toggleCommentLike } from '../utils/realtimeComments';
import { isLaxmiPujaActive } from '../utils/festivalUtils';

export interface YouTubeStandardWebPlayerProps {
  isOpen: boolean;
  track: Track | null;
  isPlaying: boolean;
  onClose: () => void;
  onMinimizeToMiniPlayer?: () => void;
  onTogglePlay?: () => void;
  onPlayTrack: (track: Track) => void;
  onNextTrack?: (trackList?: Track[]) => void;
  onPrevTrack?: () => void;
  volume?: number;
  onVolumeChange?: (vol: number) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onDownload?: (track: Track) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (track: Track) => void;
  isSubscribed?: boolean;
  onToggleSubscribe?: (channel: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  allTracks?: Track[];
  darkMode?: boolean;
  accentThemeId?: string;
  user?: any;
  userName?: string;
  isAutoplayUpNext?: boolean;
  onToggleAutoplayUpNext?: (enabled?: boolean) => void;
}

// True Fisher-Yates array shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const YouTubeStandardWebPlayer: React.FC<YouTubeStandardWebPlayerProps> = ({
  isOpen,
  track,
  isPlaying = false,
  onClose,
  onMinimizeToMiniPlayer,
  onTogglePlay,
  onPlayTrack,
  onNextTrack,
  onPrevTrack,
  volume = 85,
  onVolumeChange,
  isMuted = false,
  onToggleMute,
  onOpenAddToPlaylist,
  onDownload,
  isFavorite = false,
  onToggleFavorite,
  isSubscribed = false,
  onToggleSubscribe,
  onShowToast,
  allTracks = [],
  user,
  userName = 'Bikash Jana',
  isAutoplayUpNext = true,
  onToggleAutoplayUpNext
}) => {
  // Engagement and Player Configuration States
  const [likesCount, setLikesCount] = useState<number>(48200);
  const [hasLiked, setHasLiked] = useState<boolean>(isFavorite);
  const [hasDisliked, setHasDisliked] = useState<boolean>(false);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isAmbientGlow, setIsAmbientGlow] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const [showSettingsPopover, setShowSettingsPopover] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<string>('Normal');
  const [selectedQuality, setSelectedQuality] = useState<string>('1080p HD');
  const [isCaptionsOn, setIsCaptionsOn] = useState<boolean>(false);
  const [isCasting, setIsCasting] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(34);
  const isLaxmiPuja = isLaxmiPujaActive();

  // Recommendations and Queue State
  const [recommendationPill, setRecommendationPill] = useState<string>('All');
  const [relatedTracks, setRelatedTracks] = useState<Track[]>([]);
  const [randomQueue, setRandomQueue] = useState<Track[]>([]);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);

  // Real-time Comments State
  const [commentText, setCommentText] = useState<string>('');
  const [realtimeComments, setRealtimeComments] = useState<RealtimeComment[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [commentSort, setCommentSort] = useState<'top' | 'newest'>('top');

  const mainScrollRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setHasLiked(isFavorite);
  }, [isFavorite]);

  // Video ID and verified Metadata
  const videoId = extractYouTubeId(track?.id || (track as any)?.youtubeUrl || '');
  const activeVideoId = videoId || (track?.id && track.id.length === 11 ? track.id : 'BddP6PYo2gs');
  const title = decodeHtmlEntities(track?.title || 'YouTube Video');
  const channel = decodeHtmlEntities(track?.channel || track?.artist || 'Ai Music Stream');
  const views = track?.views || '2.4M views';
  const timeAgo = track?.publishedTime || '4 days ago';

  // Embed source with cinema parameters
  const iframeSrc = useMemo(() => {
    const autoPlayVal = isPlaying ? 1 : 0;
    const loopVal = isLooping ? `&loop=1&playlist=${activeVideoId}` : '';
    return `https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=${autoPlayVal}&enablejsapi=1&rel=0&playsinline=1&controls=1&modestbranding=1${loopVal}`;
  }, [activeVideoId, isPlaying, isLooping]);

  // Queue generator
  const generateEndlessQueue = useCallback((baseTracks: Track[], currentTrackId?: string): Track[] => {
    const filtered = baseTracks.filter(t => t.id !== currentTrackId);
    if (filtered.length === 0) return [];
    const firstBatch = shuffleArray(filtered);
    let fullQueue = [...firstBatch];
    if (fullQueue.length < 24) {
      const secondBatch = shuffleArray(filtered).map((t, idx) => ({
        ...t,
        id: `${t.id}_stream_${idx}`
      }));
      fullQueue = [...fullQueue, ...secondBatch];
    }
    return fullQueue;
  }, []);

  // Fetch recommendations
  useEffect(() => {
    if (!track || !isOpen) return;
    let isMounted = true;

    const fetchRelated = async () => {
      let fetched: Track[] = [];
      try {
        const res = await fetch('/api/music/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackTitle: track.title, channel: track.channel })
        });
        const data = await res.json();
        if (data.tracks && data.tracks.length > 0) {
          fetched = data.tracks.filter((t: Track) => t.id !== track.id);
        }
      } catch {}

      if (!isMounted) return;

      const combinedPool = [
        ...fetched,
        ...allTracks.filter(t => t.id !== track.id)
      ];

      setRelatedTracks(fetched);
      setRandomQueue(generateEndlessQueue(combinedPool, track.id));
    };

    fetchRelated();

    return () => {
      isMounted = false;
    };
  }, [track, isOpen, allTracks, generateEndlessQueue]);

  // Real-time comments listener
  useEffect(() => {
    if (!track?.id || !isOpen) return;

    const unsubscribe = subscribeToVideoComments(track.id, (comments) => {
      setRealtimeComments(comments);
    });

    return () => {
      unsubscribe();
    };
  }, [track?.id, isOpen]);

  // Keyboard controls for cinema web player
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in comment input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === ' ' || e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onTogglePlay?.();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        onToggleMute?.();
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsTheaterMode(prev => !prev);
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        if (onMinimizeToMiniPlayer) onMinimizeToMiniPlayer();
        else onClose();
      } else if (e.key.toLowerCase() === 'escape') {
        e.preventDefault();
        onClose();
      } else if (e.key.toLowerCase() === 'j') {
        handleSkipSeconds(-10);
      } else if (e.key.toLowerCase() === 'l') {
        handleSkipSeconds(10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onTogglePlay, onToggleMute, onMinimizeToMiniPlayer, onClose]);

  const handleSkipSeconds = (deltaSeconds: number) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: deltaSeconds > 0 ? 'seekTo' : 'seekTo',
            args: [deltaSeconds, true]
          }),
          '*'
        );
      } catch {}
    }
    setProgressPercent(prev => Math.max(5, Math.min(95, prev + (deltaSeconds > 0 ? 5 : -5))));
    onShowToast?.(deltaSeconds > 0 ? `+${deltaSeconds}s` : `${deltaSeconds}s`, 'info');
  };

  const handleToggleLike = () => {
    if (hasLiked) {
      setHasLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
      if (track && onToggleFavorite) onToggleFavorite(track);
      onShowToast?.('Removed from Liked videos', 'info');
    } else {
      setHasLiked(true);
      setHasDisliked(false);
      setLikesCount(prev => prev + 1);
      if (track && onToggleFavorite) onToggleFavorite(track);
      onShowToast?.('Added to Liked videos ❤️', 'success');
    }
  };

  const handleToggleDislike = () => {
    if (hasDisliked) {
      setHasDisliked(false);
    } else {
      setHasDisliked(true);
      if (hasLiked) {
        setHasLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      }
      onShowToast?.('Disliked feedback recorded', 'info');
    }
  };

  const handleShare = async () => {
    const shareUrl = `https://youtu.be/${activeVideoId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Watch "${title}" on Ai Music Stream`,
          url: shareUrl
        });
        onShowToast?.('Shared successfully!', 'success');
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      onShowToast?.('Video link copied to clipboard! 📋', 'success');
    } catch {
      onShowToast?.(shareUrl, 'info');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !track?.id || isSubmittingComment) return;

    setIsSubmittingComment(true);
    const newComment = await postRealtimeComment(
      track.id,
      commentText.trim(),
      {
        displayName: user?.displayName || userName || 'Music Enthusiast',
        photoURL: user?.photoURL
      }
    );

    if (newComment) {
      setRealtimeComments(prev => [newComment, ...prev]);
      setCommentText('');
      onShowToast?.('Comment published!', 'success');
    } else {
      onShowToast?.('Failed to submit comment. Try again.', 'error');
    }
    setIsSubmittingComment(false);
  };

  const handleToggleLikeComment = async (commentId: string) => {
    if (!track?.id) return;
    const updatedLikes = await toggleCommentLike(track.id, commentId);
    setRealtimeComments(prev =>
      prev.map(c => c.id === commentId ? { ...c, likes: updatedLikes } : c)
    );
  };

  const handleReshuffleQueue = () => {
    setIsShuffling(true);
    setTimeout(() => {
      setRandomQueue(prev => shuffleArray([...prev]));
      setIsShuffling(false);
      onShowToast?.('Up Next queue reshuffled! 🔀', 'info');
    }, 280);
  };

  // Filter recommendations based on active pill
  const filteredQueue = useMemo(() => {
    if (recommendationPill === 'Related') {
      return relatedTracks.length > 0 ? relatedTracks : randomQueue.slice(0, 10);
    }
    if (recommendationPill.startsWith('From')) {
      const match = randomQueue.filter(t => (t.channel || t.artist || '').toLowerCase() === channel.toLowerCase());
      return match.length > 0 ? match : randomQueue.slice(0, 8);
    }
    return randomQueue;
  }, [recommendationPill, randomQueue, relatedTracks, channel]);

  const sortedComments = useMemo(() => {
    return [...realtimeComments].sort((a, b) => {
      if (commentSort === 'top') return b.likes - a.likes;
      return b.timestamp - a.timestamp;
    });
  }, [realtimeComments, commentSort]);

  const formatTimeAgo = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (!isOpen || !track) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 24 }}
      transition={{ type: 'spring', damping: 28, stiffness: 360 }}
      className="fixed inset-0 z-50 overflow-hidden select-none font-sans bg-[#0c0d14] text-zinc-100 flex flex-col transform-gpu"
    >
      
      {/* ========================================================================= */}
      {/* 1. FIXED VIDEO PLAYER STAGE: Starts flush at the top with zero top header */}
      {/* ========================================================================= */}
      <div className={`w-full bg-black shrink-0 z-30 border-b border-white/10 flex flex-col items-center relative overflow-hidden ${
        isTheaterMode ? 'shadow-2xl' : ''
      }`}>
        {/* Soft Ambient Cinema Glow Backdrop */}
        {isAmbientGlow && (
          <div className="absolute inset-0 pointer-events-none opacity-40 blur-3xl -z-10 bg-gradient-to-r from-red-600/30 via-rose-500/20 to-indigo-600/30 transform scale-125" />
        )}

        <div className={`w-full ${isTheaterMode ? 'max-w-[1920px]' : 'max-w-5xl'} aspect-video max-h-[44vh] sm:max-h-[54vh] lg:max-h-[62vh] bg-black relative flex flex-col`}>
          {/* Embed Screen Container */}
          <div className="relative w-full flex-1 bg-black flex items-center justify-center overflow-hidden group/screen">
            <iframe
              ref={iframeRef}
              key={`yt-cinema-${activeVideoId}`}
              src={iframeSrc}
              title={title}
              className="w-full h-full border-0 pointer-events-auto"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
            />

            {/* Floating Top Controls Overlay (Sleek corner collapse & close actions with zero top header bar) */}
            <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
              <button
                type="button"
                onClick={() => {
                  if (onMinimizeToMiniPlayer) onMinimizeToMiniPlayer();
                  else onClose();
                }}
                className="pointer-events-auto p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white/90 hover:text-white backdrop-blur-md border border-white/15 shadow-lg transition-all active:scale-90 flex items-center gap-1.5 cursor-pointer"
                title="Minimize to Mini Player (i / Esc)"
              >
                <ChevronLeft size={18} />
                <span className="text-xs font-semibold pr-1 hidden xs:inline">Minimize</span>
              </button>

              <div className="flex items-center gap-1.5 pointer-events-auto">
                {/* TV Cast */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCasting(true);
                    onShowToast?.('Searching for Chromecast and Smart TV screens...', 'info');
                    setTimeout(() => setIsCasting(false), 2400);
                  }}
                  className={`p-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/15 shadow-lg transition-all active:scale-90 cursor-pointer ${
                    isCasting ? 'text-red-500' : 'text-white/90 hover:text-white'
                  }`}
                  title="Cast to TV"
                >
                  <Cast size={16} className={isCasting ? 'animate-pulse text-red-500' : ''} />
                </button>

                {/* Close Player */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-black/70 hover:bg-red-600/90 text-white/90 hover:text-white backdrop-blur-md border border-white/15 shadow-lg transition-all active:scale-90 cursor-pointer"
                  title="Close player (Esc)"
                >
                  <X size={17} />
                </button>
              </div>
            </div>
          </div>

          {/* Redesigned Video Bottom Control Bar */}
          <div className="w-full bg-[#10121d]/95 backdrop-blur-xl border-t border-white/10 px-3 sm:px-4 py-1.5 sm:py-2 flex flex-col gap-1.5 shrink-0">
            {/* Red Scrubber Bar (Zero circle parts: crisp rectangular seeker) */}
            <div 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));
                setProgressPercent(pct);
                handleSkipSeconds(pct > 50 ? 10 : -10);
              }}
              className="w-full h-1 hover:h-1.5 bg-white/20 relative cursor-pointer group/scrubber transition-all"
              title="Seek playback"
            >
              {/* Buffer Bar */}
              <div 
                className="h-full bg-white/25 absolute left-0 top-0 transition-all"
                style={{ width: `${Math.min(100, progressPercent + 25)}%` }}
              />
              {/* Play Progress */}
              <div 
                className="h-full bg-red-600 relative transition-all"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-red-600 rounded-xs opacity-0 group-hover/scrubber:opacity-100 transition-opacity shadow-md" />
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-zinc-300 pt-0.5">
              {/* Left Controls: Play/Pause, Rewind, Forward, Next, Volume, Time */}
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="p-1.5 hover:text-white transition-colors cursor-pointer active:scale-95"
                  title={isPlaying ? 'Pause (k)' : 'Play (k)'}
                >
                  {isPlaying ? <Pause size={19} className="fill-white" /> : <Play size={19} className="fill-white ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSkipSeconds(-10)}
                  className="p-1.5 hover:text-white transition-colors cursor-pointer active:scale-95"
                  title="Rewind 10 seconds (j)"
                >
                  <RotateCcw size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => handleSkipSeconds(10)}
                  className="p-1.5 hover:text-white transition-colors cursor-pointer active:scale-95"
                  title="Forward 10 seconds (l)"
                >
                  <RotateCw size={17} />
                </button>

                {onNextTrack && (
                  <button
                    type="button"
                    onClick={() => onNextTrack(randomQueue)}
                    className="p-1.5 hover:text-white transition-colors cursor-pointer active:scale-95"
                    title="Next video"
                  >
                    <SkipForward size={17} />
                  </button>
                )}

                {/* Volume Slider Group */}
                <div className="flex items-center gap-1 group/vol pl-1">
                  <button
                    type="button"
                    onClick={onToggleMute}
                    className="p-1.5 hover:text-white transition-colors cursor-pointer active:scale-95"
                    title={isMuted ? 'Unmute (m)' : 'Mute (m)'}
                  >
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange?.(parseInt(e.target.value, 10))}
                    className="w-14 sm:w-20 accent-red-600 cursor-pointer h-1.5 bg-white/20 rounded-md"
                    title="Volume"
                  />
                </div>

                {/* Timestamp */}
                <div className="text-xs font-mono text-zinc-400 pl-1.5 hidden xs:block">
                  <span className="text-white font-semibold">{isPlaying ? '1:24' : '0:00'}</span>
                  <span className="mx-1 text-zinc-600">/</span>
                  <span>{track.duration || '3:45'}</span>
                </div>
              </div>

              {/* Right Controls: Loop, Autoplay, CC, Settings, Theater, Fullscreen */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Loop Video Button */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !isLooping;
                    setIsLooping(next);
                    onShowToast?.(next ? 'Loop Video enabled 🔁' : 'Loop disabled', 'info');
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 ${
                    isLooping ? 'text-red-500 bg-red-500/15' : 'hover:text-white'
                  }`}
                  title={isLooping ? 'Loop Video ON' : 'Loop Video OFF'}
                >
                  <Repeat size={16} />
                </button>

                {/* Autoplay Next Toggle Pill */}
                {onToggleAutoplayUpNext && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleAutoplayUpNext();
                      onShowToast?.(isAutoplayUpNext ? 'Autoplay turned OFF' : 'Autoplay turned ON', 'info');
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                      isAutoplayUpNext
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-white/10 text-zinc-400 hover:text-white'
                    }`}
                    title="Autoplay next video"
                  >
                    <span className={`w-1.5 h-1.5 rounded-xs ${isAutoplayUpNext ? 'bg-white' : 'bg-zinc-500'}`} />
                    <span className="hidden sm:inline">Autoplay</span>
                  </button>
                )}

                {/* Subtitles CC Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCaptionsOn(!isCaptionsOn);
                    onShowToast?.(!isCaptionsOn ? 'Subtitles / CC enabled' : 'Subtitles / CC disabled', 'info');
                  }}
                  className={`px-1.5 py-0.5 text-[10px] font-black rounded-md border transition-colors cursor-pointer active:scale-90 ${
                    isCaptionsOn
                      ? 'bg-white text-black border-white'
                      : 'text-zinc-400 border-zinc-600 hover:text-white hover:border-zinc-400'
                  }`}
                  title="Subtitles/closed captions (c)"
                >
                  CC
                </button>

                {/* Settings Menu Toggle */}
                <button
                  type="button"
                  onClick={() => setShowSettingsPopover(!showSettingsPopover)}
                  className={`p-1.5 rounded-lg hover:text-white transition-colors cursor-pointer active:scale-95 ${
                    showSettingsPopover ? 'text-red-500 bg-red-500/15' : ''
                  }`}
                  title="Settings"
                >
                  <Settings size={17} />
                </button>

                {/* Theater Mode Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsTheaterMode(!isTheaterMode);
                    onShowToast?.(isTheaterMode ? 'Standard Web View' : 'Theater Mode: Edge-to-Edge ON', 'info');
                  }}
                  className={`p-1.5 rounded-lg hover:text-white transition-colors cursor-pointer active:scale-95 ${
                    isTheaterMode ? 'text-red-500 bg-red-500/15' : ''
                  }`}
                  title={isTheaterMode ? 'Exit Theater Mode (t)' : 'Theater Mode (t)'}
                >
                  <Square size={17} />
                </button>

                {/* Mini Player Picture-in-Picture Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onMinimizeToMiniPlayer) onMinimizeToMiniPlayer();
                    else onClose();
                  }}
                  className="p-1.5 rounded-lg hover:text-white transition-colors cursor-pointer active:scale-95"
                  title="Minimize to Mini Player (i)"
                >
                  <Tv size={17} />
                </button>

                {/* Fullscreen Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen?.().catch(() => {});
                      onShowToast?.('Fullscreen entered (f)', 'info');
                    } else {
                      document.exitFullscreen?.().catch(() => {});
                      onShowToast?.('Fullscreen exited', 'info');
                    }
                  }}
                  className="p-1.5 rounded-lg hover:text-white transition-colors cursor-pointer active:scale-95"
                  title="Full screen (f)"
                >
                  <Maximize2 size={17} />
                </button>

                {/* Close Player Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer active:scale-95"
                  title="Close player (Esc)"
                >
                  <X size={17} />
                </button>
              </div>
            </div>
          </div>

          {/* Settings Popover (Quality / Playback speed) */}
          <AnimatePresence>
            {showSettingsPopover && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-3 bottom-14 z-40 w-60 bg-zinc-900/98 backdrop-blur-2xl border border-white/20 rounded-xl p-3 text-xs shadow-2xl space-y-3"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">Stream Quality</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {['1080p HD', '720p', '480p', '360p'].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => {
                          setSelectedQuality(q);
                          setShowSettingsPopover(false);
                          onShowToast?.(`Video quality set to ${q}`, 'success');
                        }}
                        className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                          selectedQuality === q ? 'bg-red-600 text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">Playback Speed</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {['0.75x', 'Normal', '1.25x', '1.5x'].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => {
                          setPlaybackSpeed(spd);
                          setShowSettingsPopover(false);
                          onShowToast?.(`Speed: ${spd}`, 'info');
                        }}
                        className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                          playbackSpeed === spd ? 'bg-red-600 text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                        }`}
                      >
                        {spd}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SCROLLABLE BELOW-STAGE CONTENT: Channel, Actions, Description, Comments */}
      {/* ========================================================================= */}
      <div 
        ref={mainScrollRef}
        className="w-full flex-1 overflow-y-auto pb-24 z-10 relative custom-scrollbar"
      >
        <div className={`w-full ${isTheaterMode ? 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4' : 'max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5'}`}>
          <div className={`w-full flex flex-col ${isTheaterMode ? 'gap-6' : 'lg:flex-row gap-6'}`}>
            
            {/* PRIMARY COLUMN: Title, Channel, Actions, Description, Comments */}
            <div className={`${isTheaterMode ? 'w-full' : 'w-full lg:w-[68%] xl:w-[72%]'} flex flex-col space-y-4 min-w-0`}>
              
              {/* Video Title in authentic crisp YouTube Typography */}
              <div className="space-y-2">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-snug">
                  {title}
                </h1>

                {/* Channel Row & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b border-white/10 pb-4">
                  
                  {/* Channel Profile and Subscribe Button */}
                  <div className="flex items-center gap-3">
                    <img
                      src={getChannelAvatar(channel)}
                      alt={channel}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getFallbackChannelAvatar(channel);
                      }}
                      className="w-11 h-11 rounded-xl object-cover shrink-0 bg-zinc-800 ring-2 ring-white/10"
                    />
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1">
                        <span className="text-base font-bold text-white truncate">{channel}</span>
                        <CheckCircle2 size={14} className="text-rose-400 shrink-0" />
                      </div>
                      <span className="text-xs text-zinc-400 block">14.8M subscribers</span>
                    </div>

                    {/* Subscribe Button (Rounded-xl pill without circle part) */}
                    {onToggleSubscribe && (
                      <button
                        type="button"
                        onClick={() => onToggleSubscribe(channel)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shadow-sm ${
                          isSubscribed
                            ? 'bg-white/15 hover:bg-white/25 text-white border border-white/15'
                            : 'bg-white text-black hover:bg-zinc-200'
                        }`}
                      >
                        {isSubscribed ? (
                          <>
                            <Bell size={14} className="fill-white" />
                            <span>Subscribed</span>
                          </>
                        ) : (
                          <span>Subscribe</span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* YouTube Desktop Style Action Buttons / Action Bar */}
                  <div className={`flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 p-1 rounded-2xl transition-all ${
                    isLaxmiPuja ? 'bg-amber-950/30 border border-yellow-400/35 shadow-[0_0_15px_rgba(245,158,11,0.18)]' : ''
                  }`}>
                    {/* Segmented Like / Dislike Capsule */}
                    <div className={`flex items-center rounded-xl overflow-hidden text-xs font-semibold ${
                      isLaxmiPuja 
                        ? 'bg-amber-950/50 hover:bg-amber-900/50 border border-yellow-400/40 shadow-xs' 
                        : 'bg-white/10 hover:bg-white/15 border border-white/10'
                    }`}>
                      <button
                        type="button"
                        onClick={handleToggleLike}
                        className={`flex items-center gap-1.5 px-3.5 py-2 hover:bg-white/15 cursor-pointer active:scale-95 transition-all ${
                          hasLiked ? (isLaxmiPuja ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold') : 'text-zinc-200'
                        }`}
                      >
                        <ThumbsUp size={15} className={hasLiked ? (isLaxmiPuja ? 'fill-amber-400 text-amber-400' : 'fill-rose-500 text-rose-500') : ''} />
                        <span>{likesCount > 999 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}</span>
                      </button>
                      <div className="w-[1px] h-4 bg-white/20" />
                      <button
                        type="button"
                        onClick={handleToggleDislike}
                        className="px-3 py-2 hover:bg-white/15 cursor-pointer active:scale-95 transition-all text-zinc-200"
                        title="Dislike"
                      >
                        <ThumbsDown size={15} className={hasDisliked ? (isLaxmiPuja ? 'fill-amber-400 text-amber-400' : 'fill-rose-500 text-rose-500') : ''} />
                      </button>
                    </div>

                    {/* Laxmi Puja Special Blessing Greeting Pill */}
                    {isLaxmiPuja && (
                      <button
                        type="button"
                        onClick={() => onShowToast?.('🪷 শুভ কোজাগরী লক্ষ্মী পূজা! May Goddess Lakshmi bless you with endless prosperity & peace ✨', 'success')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-600/35 via-yellow-600/30 to-amber-600/35 hover:from-amber-600/45 hover:to-yellow-600/45 rounded-xl text-xs font-bold text-amber-200 border border-yellow-400/50 cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(250,204,21,0.25)] shrink-0"
                        title="Laxmi Puja Blessing"
                      >
                        <span>🪷</span>
                        <span>শুভ লক্ষ্মী পূজা</span>
                        <span>✨</span>
                      </button>
                    )}

                    {/* Share Pill */}
                    <button
                      type="button"
                      onClick={handleShare}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold hover:text-white cursor-pointer active:scale-95 border ${
                        isLaxmiPuja 
                          ? 'bg-amber-950/40 hover:bg-amber-900/40 border-yellow-400/30 text-amber-200' 
                          : 'bg-white/10 hover:bg-white/15 border-white/10 text-zinc-200'
                      }`}
                    >
                      <Share2 size={15} />
                      <span>Share</span>
                    </button>

                    {/* Download Pill */}
                    {onDownload && (
                      <button
                        type="button"
                        onClick={() => onDownload(track)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold hover:text-white cursor-pointer active:scale-95 border ${
                          isLaxmiPuja 
                            ? 'bg-amber-950/40 hover:bg-amber-900/40 border-yellow-400/30 text-amber-200' 
                            : 'bg-white/10 hover:bg-white/15 border-white/10 text-zinc-200'
                        }`}
                      >
                        <Download size={15} />
                        <span>Download</span>
                      </button>
                    )}

                    {/* Save to Playlist Pill */}
                    {onOpenAddToPlaylist && (
                      <button
                        type="button"
                        onClick={() => onOpenAddToPlaylist(track)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold hover:text-white cursor-pointer active:scale-95 border ${
                          isLaxmiPuja 
                            ? 'bg-amber-950/40 hover:bg-amber-900/40 border-yellow-400/30 text-amber-200' 
                            : 'bg-white/10 hover:bg-white/15 border-white/10 text-zinc-200'
                        }`}
                      >
                        <ListPlus size={15} />
                        <span>Save</span>
                      </button>
                    )}

                    {/* 3-Dots More Options */}
                    <button
                      type="button"
                      onClick={() => onShowToast?.(`Options for ${title}`, 'info')}
                      className={`p-2 rounded-xl cursor-pointer active:scale-95 border ${
                        isLaxmiPuja 
                          ? 'bg-amber-950/40 hover:bg-amber-900/40 border-yellow-400/30 text-amber-300' 
                          : 'bg-white/10 hover:bg-white/15 border-white/10 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Redesigned Description Card */}
              <div 
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="bg-zinc-900/90 hover:bg-zinc-900 rounded-2xl p-4 cursor-pointer transition-colors space-y-2 border border-white/10 shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                  <span className="flex items-center gap-1"><Eye size={12} className="text-zinc-400" /> {views}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock size={12} className="text-zinc-400" /> {timeAgo}</span>
                  <span className="text-rose-400 font-semibold">#music #aimusic #official</span>
                </div>

                <p className={`text-xs text-zinc-300 leading-relaxed ${isDescriptionExpanded ? '' : 'line-clamp-2'}`}>
                  Stream official ultra high-definition release of {title} by {channel}. Engineered with high frame-rate sub-pixel smoothness, crystal sound stage, and live synchronized community feedback on Ai Music Stream.
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-zinc-200 hover:text-white">
                    {isDescriptionExpanded ? 'Show less' : '...more'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">165Hz Optimized Stream</span>
                </div>
              </div>

              {/* Redesigned Inline Comments Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-6">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {realtimeComments.length} Comments
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCommentSort(commentSort === 'top' ? 'newest' : 'top')}
                    className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <span>Sort by</span>
                    <span className="text-zinc-200 font-bold">({commentSort === 'top' ? 'Top comments' : 'Newest first'})</span>
                  </button>
                </div>

                {/* Add a Comment Form */}
                <form onSubmit={handleAddComment} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-md">
                    {(user?.displayName?.[0] || userName?.[0] || 'B').toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full bg-transparent border-b border-white/20 focus:border-red-500 text-sm text-white pb-1 focus:outline-none placeholder:text-zinc-500"
                    />
                    {commentText.trim() && (
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setCommentText('')}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingComment}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-black hover:bg-zinc-200 cursor-pointer disabled:opacity-50"
                        >
                          Comment
                        </button>
                      </div>
                    )}
                  </div>
                </form>

                {/* Inline Comments Stream */}
                <div className="space-y-4 pt-2">
                  {sortedComments.map((comm) => (
                    <div key={comm.id} className="flex items-start gap-3 text-xs">
                      <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-white font-bold shrink-0 border border-white/10">
                        {(comm.userName?.[0] || 'U').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-[13px]">@{comm.userName}</span>
                          <span className="text-[11px] text-zinc-500">{formatTimeAgo(comm.timestamp)}</span>
                        </div>
                        <p className="text-zinc-200 text-xs leading-relaxed break-words">{comm.text}</p>
                        <div className="flex items-center gap-4 pt-1 text-zinc-400">
                          <button
                            type="button"
                            onClick={() => handleToggleLikeComment(comm.id)}
                            className="flex items-center gap-1 hover:text-white cursor-pointer"
                          >
                            <ThumbsUp size={13} className={comm.likes > 0 ? 'fill-rose-500 text-rose-500' : ''} />
                            {comm.likes > 0 && <span>{comm.likes}</span>}
                          </button>
                          <button type="button" className="hover:text-white cursor-pointer">
                            <ThumbsDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCommentText(`@${comm.userName} `)}
                            className="font-semibold text-[11px] hover:text-white cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {sortedComments.length === 0 && (
                    <div className="py-6 text-center text-xs text-zinc-400 bg-zinc-900/50 rounded-2xl p-4 border border-white/5">
                      No comments yet. Be the first to share your thoughts!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECONDARY COLUMN: Up Next / Recommended Sidebar */}
            <div className={`${isTheaterMode ? 'w-full' : 'w-full lg:w-[32%] xl:w-[28%]'} flex flex-col space-y-3 shrink-0`}>
              
              {/* Header with Quick Autoplay and Shuffle Mix */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">Up Next</span>
                  <span className="text-xs text-zinc-400">({filteredQueue.length})</span>
                </div>

                <div className="flex items-center gap-2">
                  {onToggleAutoplayUpNext && (
                    <button
                      type="button"
                      onClick={() => onToggleAutoplayUpNext()}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                        isAutoplayUpNext
                          ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                      title={isAutoplayUpNext ? 'Autoplay ON' : 'Autoplay OFF'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-xs ${isAutoplayUpNext ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'}`} />
                      <span>Autoplay {isAutoplayUpNext ? 'ON' : 'OFF'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleReshuffleQueue}
                    disabled={isShuffling}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white cursor-pointer transition-transform active:scale-90"
                    title="Reshuffle Queue"
                  >
                    <Shuffle size={14} className={isShuffling ? 'animate-spin text-red-500' : ''} />
                  </button>
                </div>
              </div>

              {/* Quick Recommendation Filter Chips (Rounded-lg, zero circle parts) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {['All', 'Related', `From ${channel.slice(0, 10)}`, 'Recently uploaded'].map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => setRecommendationPill(pill)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                      recommendationPill === pill
                        ? 'bg-white text-black font-bold'
                        : 'bg-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>

              {/* Up Next Recommendation Cards */}
              <div className="space-y-3">
                {filteredQueue.map((item, index) => {
                  const itemId = extractYouTubeId(item.id || (item as any).youtubeUrl || '');
                  const itemThumb = item.thumbnail || (itemId ? `https://i.ytimg.com/vi/${itemId}/hqdefault.jpg` : '');
                  const itemChannel = decodeHtmlEntities(item.channel || item.artist || 'Channel');
                  const itemTitle = decodeHtmlEntities(item.title);

                  return (
                    <div
                      key={`${item.id}_cinema_upnext_${index}`}
                      onClick={() => {
                        setRandomQueue(prev => prev.filter((_, i) => i !== index));
                        onPlayTrack(item);
                        onShowToast?.(`▶ Playing: ${item.title}`, 'info');
                        mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group flex gap-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors"
                    >
                      {/* Thumbnail (16:9) with rounded-xl corners (no circles) */}
                      <div className="relative aspect-video w-36 sm:w-40 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10">
                        {itemThumb ? (
                          <img
                            src={itemThumb}
                            alt={itemTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                            <Film size={20} />
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 bg-black/85 text-white text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-xs">
                          {item.duration || '3:45'}
                        </div>
                      </div>

                      {/* Metadata on Right */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <h4 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                            {itemTitle}
                          </h4>
                          <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-1">
                            <span className="truncate max-w-[120px]">{itemChannel}</span>
                            <CheckCircle2 size={11} className="text-rose-400 shrink-0" />
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            <span>{item.views || '450K views'}</span>
                            <span className="mx-1">•</span>
                            <span>{item.publishedTime || 'Recently'}</span>
                          </div>
                        </div>
                      </div>

                      {/* 3-Dots Menu Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenAddToPlaylist) onOpenAddToPlaylist(item);
                          else onShowToast?.(`Options for ${item.title}`, 'info');
                        }}
                        className="p-1 text-zinc-500 hover:text-white rounded-lg self-start transition-colors"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
};

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Download,
  ListPlus,
  MoreHorizontal,
  Send,
  X,
  Play,
  Shuffle,
  Bell,
  Repeat,
  Check,
  Calendar,
  FileText,
  Sparkles,
  ExternalLink,
  Share2,
  Languages,
  Globe
} from 'lucide-react';
import { Track, RealtimeComment } from '../types';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';
import { getChannelAvatar, getFallbackChannelAvatar } from '../utils/channelLogos';
import { subscribeToVideoComments, postRealtimeComment, toggleCommentLike } from '../utils/realtimeComments';
import { isLaxmiPujaActive } from '../utils/festivalUtils';
import { INDIAN_LANGUAGES, IndianLanguage, getIndianLanguageById } from '../data/indianLanguages';
import { VideoLanguageTranslatorModal } from './VideoLanguageTranslatorModal';
import { VideoLiveTranslationHUD } from './VideoLiveTranslationHUD';
import { stopSpeechSynthesis } from '../utils/speechTranslator';

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
  const [likesCount, setLikesCount] = useState<number>(87);
  const [hasLiked, setHasLiked] = useState<boolean>(isFavorite);
  const [hasDisliked, setHasDisliked] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [showHighlightsSheet, setShowHighlightsSheet] = useState<boolean>(false);
  const [selectedQuality, setSelectedQuality] = useState<string>('1080p HD');
  const [showDescriptionDrawer, setShowDescriptionDrawer] = useState<boolean>(false);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [videoSummary, setVideoSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const isLaxmiPuja = isLaxmiPujaActive();

  // Real-Time Speech Translator State (Indian & Regional Languages)
  const [showLanguageTranslatorModal, setShowLanguageTranslatorModal] = useState<boolean>(false);
  const [isLanguageTranslatorActive, setIsLanguageTranslatorActive] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<IndianLanguage>(() => {
    try {
      const saved = localStorage.getItem('aura_video_target_language');
      return saved ? getIndianLanguageById(saved) : getIndianLanguageById('hi');
    } catch {
      return getIndianLanguageById('hi');
    }
  });
  const [isVoiceDubbingEnabled, setIsVoiceDubbingEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('aura_video_voice_dubbing');
      return saved !== 'false';
    } catch {
      return true;
    }
  });
  const [playbackSeconds, setPlaybackSeconds] = useState<number>(0);

  // Playback timer for synchronized live speech translation pacing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlaybackSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Reset playback timer on track change
  useEffect(() => {
    setPlaybackSeconds(0);
    stopSpeechSynthesis();
  }, [track?.id]);

  const handleSelectLanguage = (lang: IndianLanguage) => {
    setSelectedLanguage(lang);
    setIsLanguageTranslatorActive(true);
    try {
      localStorage.setItem('aura_video_target_language', lang.id);
    } catch {}
    onShowToast?.(`Real-time speech translation: Speaking in ${lang.nativeName} (${lang.name}) 🗣️`, 'success');
  };

  const handleToggleVoiceDubbing = () => {
    setIsVoiceDubbingEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem('aura_video_voice_dubbing', String(next));
      } catch {}
      onShowToast?.(
        next 
          ? `🔊 Voice Dubbing ON: Translating and speaking in ${selectedLanguage.nativeName} aloud` 
          : '🔇 Voice Dubbing Muted: Showing Subtitles Only', 
        'info'
      );
      return next;
    });
  };

  // Recommendations and Queue State
  const [relatedTracks, setRelatedTracks] = useState<Track[]>([]);
  const [randomQueue, setRandomQueue] = useState<Track[]>([]);

  // Real-time Comments State
  const [commentText, setCommentText] = useState<string>('');
  const [realtimeComments, setRealtimeComments] = useState<RealtimeComment[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);

  const mainScrollRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasLiked(isFavorite);
  }, [isFavorite]);

  // Video ID and verified Metadata
  const videoId = extractYouTubeId(track?.id || (track as any)?.youtubeUrl || '');
  const activeVideoId = videoId || (track?.id && track.id.length === 11 ? track.id : '');
  const title = decodeHtmlEntities(track?.title || 'YouTube Video');
  const channel = decodeHtmlEntities(track?.channel || track?.artist || 'Channel');
  const channelHandle = `@${channel.toLowerCase().replace(/[^a-z0-9]/g, '') || 'channel'}`;
  const rawViews = track?.views || '3.1K views';
  const viewsFormatted = rawViews.toLowerCase().includes('view') ? rawViews : `${rawViews} views`;
  const timeAgo = track?.publishedTime || '2h ago';
  const userInitial = (user?.displayName?.[0] || userName?.[0] || 'B').toUpperCase();

  // Embed source
  const iframeSrc = useMemo(() => {
    if (!activeVideoId) return '';
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
    if (fullQueue.length < 20) {
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

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === ' ' || e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onTogglePlay?.();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        onToggleMute?.();
      } else if (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'escape') {
        e.preventDefault();
        if (onMinimizeToMiniPlayer) onMinimizeToMiniPlayer();
        else onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onTogglePlay, onToggleMute, onMinimizeToMiniPlayer, onClose]);

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
      onShowToast?.('Added to Liked videos 👍', 'success');
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

  const displayCommentsCount = realtimeComments.length > 0 ? realtimeComments.length : 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 overflow-hidden select-none font-sans bg-[#0f0f0f] text-white flex flex-col transform-gpu"
    >
      {/* ========================================================================= */}
      {/* 1. EDGE-TO-EDGE 16:9 VIDEO STAGE AT TOP (Matches Screenshot)              */}
      {/* ========================================================================= */}
      <div className="w-full bg-black shrink-0 z-30 flex flex-col items-center relative">
        <div className="w-full max-w-5xl aspect-video bg-black relative overflow-hidden group/player">
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

          {/* Subtle Corner Minimize & Close Overlay (Appears cleanly without blocking video) */}
          <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none opacity-85 hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => {
                if (onMinimizeToMiniPlayer) onMinimizeToMiniPlayer();
                else onClose();
              }}
              className="pointer-events-auto w-9 h-9 rounded-xl bg-black/55 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
              title="Minimize to Mini Player"
            >
              <ChevronDown size={20} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="pointer-events-auto w-9 h-9 rounded-xl bg-black/55 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
              title="Close Player"
            >
              <X size={18} />
            </button>
          </div>

          {/* Thin Bottom Edge Progress Hairline (Matches Screenshot) */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/30 pointer-events-none z-20">
            <div className="h-full w-[38%] bg-white/90" />
          </div>
        </div>

        {/* Real-Time Live Speech Translation & Voice Dubbing HUD (Mounted right beneath the video canvas) */}
        {isLanguageTranslatorActive && (
          <VideoLiveTranslationHUD
            track={track}
            isPlaying={isPlaying}
            playbackTime={playbackSeconds}
            activeLanguage={selectedLanguage}
            onOpenLanguagePicker={() => setShowLanguageTranslatorModal(true)}
            onClose={() => {
              setIsLanguageTranslatorActive(false);
              stopSpeechSynthesis();
              onShowToast?.('Speech translator turned off', 'info');
            }}
            isVoiceDubbingEnabled={isVoiceDubbingEnabled}
            onToggleVoiceDubbing={handleToggleVoiceDubbing}
            videoDescription={track?.description || track?.aiMoodTags || ''}
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. SCROLLABLE WATCH FEED (Title, Metadata, Channel+Actions, Comments, Feed)*/}
      {/* ========================================================================= */}
      <div
        ref={mainScrollRef}
        className="w-full flex-1 overflow-y-auto pb-16 z-10 relative custom-scrollbar bg-[#0f0f0f]"
      >
        <div className="w-full max-w-5xl mx-auto">
          {/* ------------------------------------------------------------------- */}
          {/* A. TITLE, @HANDLE METADATA LINE, CHANNEL & SINGLE-ROW ACTION BAR    */}
          {/* ------------------------------------------------------------------- */}
          <div className="px-3.5 pt-3 pb-2">
            {/* Title & Inline Metadata Block (Tap more or title to open video description bottom sheet) */}
            <div>
              {/* Single-Line / Compact Bold Title with subtle right fade */}
              <h1 
                onClick={() => setShowDescriptionDrawer(true)}
                className="text-[18px] sm:text-[20px] font-bold text-white leading-snug line-clamp-1 tracking-tight cursor-pointer hover:text-zinc-200 transition-colors"
                title="Tap to view video description"
              >
                {title}
              </h1>

              {/* Metadata Line: @handle  87 likes  3.1K views  2h ago  #tag ...more */}
              <div className="mt-1.5 flex items-center gap-2 text-[12px] text-[#aaaaaa] whitespace-nowrap overflow-hidden">
                <span className="text-[#aaaaaa] truncate max-w-[130px]">{channelHandle}</span>
                <span>{likesCount} likes</span>
                <span>{viewsFormatted}</span>
                <span>{timeAgo}</span>
                <span className="text-[#aaaaaa] truncate">#দুর্গাপূজা</span>
                <button
                  type="button"
                  onClick={() => setShowDescriptionDrawer(true)}
                  className="font-semibold text-white/95 hover:text-white ml-auto pl-1 shrink-0 cursor-pointer underline-offset-2 hover:underline"
                >
                  ...more
                </button>
              </div>
            </div>

            {/* Unified Single-Row Channel & Icon Action Bar (Matches Screenshot) */}
            <div className="mt-3.5 flex items-center justify-between gap-2">
              {/* Left: Channel Avatar + Subscribe / Bell Pill */}
              <div className="flex items-center gap-2.5 min-w-0 shrink-0">
                <img
                  src={getChannelAvatar(channel)}
                  alt={channel}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getFallbackChannelAvatar(channel);
                  }}
                  className="w-9 h-9 rounded-2xl object-cover shrink-0 bg-zinc-800 border border-white/10"
                />

                {onToggleSubscribe && (
                  <button
                    type="button"
                    onClick={() => onToggleSubscribe(channel)}
                    className={`h-9 px-3.5 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                      isSubscribed
                        ? 'bg-[#272727] hover:bg-[#333333] text-white'
                        : 'bg-[#272727] hover:bg-[#333333] text-white'
                    }`}
                    title={isSubscribed ? `Subscribed to ${channel}` : `Subscribe to ${channel}`}
                  >
                    <Bell size={17} className={isSubscribed ? 'text-white' : 'text-zinc-200'} />
                    <ChevronDown size={15} className="text-zinc-300" />
                  </button>
                )}
              </div>

              {/* Right: 5 Clean Outline Action Icons on the Same Row */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* 1. Like Button */}
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform active:scale-90 cursor-pointer ${
                    hasLiked ? 'text-white' : 'text-white/90 hover:text-white'
                  }`}
                  title="Like"
                >
                  <ThumbsUp
                    size={21}
                    strokeWidth={1.9}
                    className={hasLiked ? 'fill-white text-white' : ''}
                  />
                </button>

                {/* 2. Dislike Button */}
                <button
                  type="button"
                  onClick={handleToggleDislike}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform active:scale-90 cursor-pointer ${
                    hasDisliked ? 'text-white' : 'text-white/90 hover:text-white'
                  }`}
                  title="Dislike"
                >
                  <ThumbsDown
                    size={21}
                    strokeWidth={1.9}
                    className={hasDisliked ? 'fill-white text-white' : ''}
                  />
                </button>

                {/* 3. Share Button (Authentic Curved Forward Arrow matching Screenshot) */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white/90 hover:text-white transition-transform active:scale-90 cursor-pointer"
                  title="Share"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 14l5-5-5-5" />
                    <path d="M20 9H11a7 7 0 0 0-7 7v2" />
                  </svg>
                </button>

                {/* 4. Four-Point Star Icon (Smart Video Highlights & Festive Blessing Sheet) */}
                <button
                  type="button"
                  onClick={() => setShowHighlightsSheet(prev => !prev)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform active:scale-90 cursor-pointer ${
                    showHighlightsSheet
                      ? 'text-amber-400 bg-amber-500/15'
                      : isLaxmiPuja
                        ? 'text-white hover:text-amber-300'
                        : 'text-white/90 hover:text-white'
                  }`}
                  title="Video Highlights & Details"
                >
                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2L14.6 9.4L22 12L14.6 14.6L12 22L9.4 14.6L2 12L9.4 9.4L12 2Z" />
                  </svg>
                </button>

                {/* 5. Three-Dots More Menu Icon */}
                <button
                  type="button"
                  onClick={() => setShowMoreMenu(prev => !prev)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white/90 hover:text-white transition-transform active:scale-90 cursor-pointer"
                  title="More actions"
                >
                  <MoreHorizontal size={21} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* 4-Point Star Smart Highlights & Laxmi Puja Sheet */}
            <AnimatePresence>
              {showHighlightsSheet && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-3 p-3.5 rounded-2xl bg-[#1f1f1f] border border-white/10 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span>✦</span>
                      <span>Video Details & Highlights</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowHighlightsSheet(false)}
                      className="text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">
                    Playing <strong className="text-white">{title}</strong> from <strong className="text-white">{channel}</strong> ({viewsFormatted} · {timeAgo}).
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {isLaxmiPuja && (
                      <button
                        type="button"
                        onClick={() => {
                          onShowToast?.('🪷 শুভ কোজাগরী লক্ষ্মী পূজা! May Goddess Lakshmi bless you with prosperity ✨', 'success');
                          setShowHighlightsSheet(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 font-semibold cursor-pointer active:scale-95"
                      >
                        🪷 শুভ লক্ষ্মী পূজা Blessing
                      </button>
                    )}
                    {onNextTrack && (
                      <button
                        type="button"
                        onClick={() => {
                          onNextTrack(randomQueue);
                          setShowHighlightsSheet(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Shuffle size={13} />
                        <span>Play Next Recommended</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Three-Dots More Actions Drawer (Description, Download, Save to Playlist, Loop, Quality) */}
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-3 p-2.5 rounded-2xl bg-[#1f1f1f] border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs"
                >
                  {/* 1. Real-time Language Translator Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowLanguageTranslatorModal(true);
                      setShowMoreMenu(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold cursor-pointer active:scale-95 transition-all border ${
                      isLanguageTranslatorActive
                        ? 'bg-gradient-to-r from-indigo-600/50 via-purple-600/40 to-rose-600/50 border-indigo-400 text-white shadow-sm'
                        : 'bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-200 border-indigo-500/30'
                    }`}
                    title="Real-time Speech Translator: All Indian & Regional Languages"
                  >
                    <Languages size={15} className="text-indigo-400" />
                    <span className="truncate">
                      {isLanguageTranslatorActive ? `Translator (${selectedLanguage.nativeName})` : 'Language Translator'}
                    </span>
                  </button>

                  {/* 2. Video Description */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowDescriptionDrawer(true);
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-semibold cursor-pointer active:scale-95 border border-white/10"
                  >
                    <FileText size={15} />
                    <span>Description</span>
                  </button>
                  {onDownload && (
                    <button
                      type="button"
                      onClick={() => {
                        onDownload(track);
                        setShowMoreMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#2c2c2c] hover:bg-[#383838] text-white font-medium cursor-pointer active:scale-95"
                    >
                      <Download size={15} />
                      <span>Download</span>
                    </button>
                  )}

                  {onOpenAddToPlaylist && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenAddToPlaylist(track);
                        setShowMoreMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#2c2c2c] hover:bg-[#383838] text-white font-medium cursor-pointer active:scale-95"
                    >
                      <ListPlus size={15} />
                      <span>Save to Playlist</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const next = !isLooping;
                      setIsLooping(next);
                      onShowToast?.(next ? 'Loop Video ON 🔁' : 'Loop Video OFF', 'info');
                      setShowMoreMenu(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-medium cursor-pointer active:scale-95 ${
                      isLooping ? 'bg-red-600/30 text-red-300 border border-red-500/40' : 'bg-[#2c2c2c] hover:bg-[#383838] text-white'
                    }`}
                  >
                    <Repeat size={15} />
                    <span>{isLooping ? 'Loop: ON' : 'Loop Video'}</span>
                  </button>

                  {onToggleAutoplayUpNext && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleAutoplayUpNext();
                        setShowMoreMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#2c2c2c] hover:bg-[#383838] text-white font-medium cursor-pointer active:scale-95"
                    >
                      <Check size={15} className={isAutoplayUpNext ? 'text-emerald-400' : 'text-zinc-500'} />
                      <span>Autoplay: {isAutoplayUpNext ? 'ON' : 'OFF'}</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ------------------------------------------------------------------- */}
            {/* B. ROUNDED DARK COMMENTS CARD (Matches Screenshot)                  */}
            {/* ------------------------------------------------------------------- */}
            <div className="mt-4 bg-[#1f1f1f] rounded-2xl p-3.5">
              {/* Top Row: "Comments 3" on left, pill+dot indicator on right */}
              <div
                onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[14px] font-medium text-white">Comments</span>
                  <span className="text-[13px] text-[#aaaaaa]">{displayCommentsCount}</span>
                </div>

                {/* Carousel Pill + Dot Indicator (Matches Screenshot) */}
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-1.5 rounded-xs bg-white inline-block" />
                  <span className="w-1.5 h-1.5 rounded-xs bg-white/30 inline-block" />
                </div>
              </div>

              {/* Bottom Row: User Badge "B" + "Comment..." Pill Input */}
              <form onSubmit={handleAddComment} className="mt-3 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-[#c2185b] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {userInitial}
                </div>

                <div className="flex-1 relative flex items-center">
                  <input
                    ref={commentInputRef}
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onFocus={() => setIsCommentsExpanded(true)}
                    placeholder="Comment..."
                    className="w-full bg-[#2c2c2c] hover:bg-[#343434] focus:bg-[#343434] text-[13px] text-white placeholder:text-[#aaaaaa] px-3.5 py-1.5 rounded-2xl focus:outline-none transition-colors"
                  />
                  {commentText.trim() && (
                    <button
                      type="submit"
                      disabled={isSubmittingComment}
                      className="absolute right-1.5 p-1 text-white hover:text-rose-400 cursor-pointer disabled:opacity-50"
                      title="Post comment"
                    >
                      <Send size={14} />
                    </button>
                  )}
                </div>
              </form>

              {/* Expandable Comments Stream */}
              <AnimatePresence>
                {isCommentsExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3.5 mt-3 border-t border-white/10 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                      {realtimeComments.length > 0 ? (
                        realtimeComments.map((comm) => (
                          <div key={comm.id} className="flex items-start gap-2.5 text-xs">
                            <div className="w-7 h-7 rounded-xl bg-zinc-800 flex items-center justify-center text-white font-bold shrink-0 text-[11px]">
                              {(comm.userName?.[0] || 'U').toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-zinc-300 text-[11px]">@{comm.userName}</span>
                                <span className="text-[10px] text-zinc-500">{formatTimeAgo(comm.timestamp)}</span>
                              </div>
                              <p className="text-white text-xs mt-0.5 leading-relaxed break-words">{comm.text}</p>
                              <div className="flex items-center gap-3 pt-1 text-zinc-400">
                                <button
                                  type="button"
                                  onClick={() => handleToggleLikeComment(comm.id)}
                                  className="flex items-center gap-1 hover:text-white cursor-pointer"
                                >
                                  <ThumbsUp size={12} className={comm.likes > 0 ? 'fill-white text-white' : ''} />
                                  {comm.likes > 0 && <span>{comm.likes}</span>}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-400 py-2 text-center">
                          Write a comment above to start the conversation.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* C. EDGE-TO-EDGE RECOMMENDED VIDEO FEED (Matches Screenshot)         */}
          {/* ------------------------------------------------------------------- */}
          <div className="mt-2 space-y-4">
            {randomQueue.map((item, index) => {
              const itemId = extractYouTubeId(item.id || (item as any).youtubeUrl || '');
              const itemThumb = item.thumbnail || (itemId ? `https://i.ytimg.com/vi/${itemId}/hqdefault.jpg` : '');
              const itemChannel = decodeHtmlEntities(item.channel || item.artist || 'Channel');
              const itemTitle = decodeHtmlEntities(item.title);
              const itemViews = (item.views || '5.1M').replace(/\s*views/i, '');
              const itemAge = item.publishedTime || '3d ago';

              return (
                <div
                  key={`${item.id}_feed_${index}`}
                  onClick={() => {
                    setRandomQueue(prev => prev.filter((_, i) => i !== index));
                    onPlayTrack(item);
                    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full cursor-pointer group bg-[#0f0f0f]"
                >
                  {/* Full-Bleed Edge-to-Edge 16:9 Thumbnail */}
                  <div className="relative w-full aspect-video bg-zinc-900 overflow-hidden">
                    {itemThumb && (
                      <img
                        src={itemThumb}
                        alt={itemTitle}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        loading="lazy"
                      />
                    )}

                    {/* Duration Badge at Bottom-Right (e.g. 39:45) */}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[12px] font-medium px-1.5 py-0.5 rounded-md tabular-nums">
                      {item.duration || '39:45'}
                    </div>

                    {/* Thin Bottom Progress Hairline (Matches Screenshot) */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/35">
                      <div className="h-full w-full bg-white/80" />
                    </div>
                  </div>

                  {/* Below-Thumbnail Metadata Row: Avatar + 2-Line Title + Subtitle + 3-Dots */}
                  <div className="px-3.5 pt-3 pb-2 flex items-start gap-3">
                    <img
                      src={getChannelAvatar(itemChannel)}
                      alt={itemChannel}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getFallbackChannelAvatar(itemChannel);
                      }}
                      className="w-9 h-9 rounded-2xl object-cover shrink-0 bg-zinc-800 border border-white/10 mt-0.5"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-[15px] sm:text-base font-normal text-white line-clamp-2 leading-snug">
                        {itemTitle}
                      </h4>
                      <div className="mt-1 flex items-center gap-2.5 text-[12px] text-[#aaaaaa] truncate">
                        <span className="truncate">{itemChannel}</span>
                        <span className="inline-flex items-center gap-1 shrink-0">
                          <Play size={10} className="text-[#aaaaaa]" />
                          <span>{itemViews}</span>
                        </span>
                        <span className="shrink-0">{itemAge}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenAddToPlaylist) onOpenAddToPlaylist(item);
                        else onShowToast?.(`Options for ${itemTitle}`, 'info');
                      }}
                      className="p-1.5 text-white/90 hover:text-white rounded-xl shrink-0 cursor-pointer"
                      title="More options"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. YOUTUBE MOBILE AUTHENTIC VIDEO DESCRIPTION BOTTOM SHEET DRAWER         */}
      {/* Matches user's screenshot IMG-20261018-WA0003_1e87d351.jpg                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showDescriptionDrawer && (
          <>
            {/* Backdrop Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDescriptionDrawer(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 380 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[72vh] sm:max-h-[66vh] bg-[#0f0f0f] border-t border-white/10 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drag Handle Bar */}
              <div className="w-12 h-1 bg-zinc-600/90 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

              {/* Header: Full Bold Video Title + Close Button */}
              <div className="px-4 pt-2 pb-2.5 flex items-start justify-between gap-3 border-b border-white/5">
                <h2 className="text-base sm:text-[17px] font-bold text-white leading-snug line-clamp-2 pr-2">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowDescriptionDrawer(false)}
                  className="p-1 text-white hover:text-zinc-300 rounded-xl cursor-pointer transition-colors shrink-0"
                  title="Close description"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Scrollable Body Content */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 custom-scrollbar text-white">
                {/* Channel Profile Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={getChannelAvatar(channel)}
                      alt={channel}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getFallbackChannelAvatar(channel);
                      }}
                      className="w-9 h-9 rounded-xl object-cover shrink-0 bg-zinc-800 border border-white/10"
                    />
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-white block truncate">{channel}</span>
                      <span className="text-xs text-zinc-400 block">16.8M subscribers</span>
                    </div>
                  </div>

                  {onToggleSubscribe && (
                    <button
                      type="button"
                      onClick={() => onToggleSubscribe(channel)}
                      className="px-3.5 py-1.5 rounded-2xl bg-[#272727] hover:bg-[#333333] text-white flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                    >
                      <Bell size={15} />
                      <ChevronDown size={14} />
                    </button>
                  )}
                </div>

                {/* 3 Metrics / Stat Summary Row (Likes, Views, Ago - Matches Screenshot 1) */}
                <div className="grid grid-cols-3 py-2 text-center border-y border-white/10">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-white tabular-nums">{likesCount}</span>
                    <span className="text-xs text-zinc-400 mt-0.5">Likes</span>
                  </div>
                  <div className="flex flex-col items-center justify-center border-x border-white/10">
                    <span className="text-lg font-bold text-white tabular-nums">{viewsFormatted.replace(' views', '')}</span>
                    <span className="text-xs text-zinc-400 mt-0.5">Views</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-white">{timeAgo}</span>
                    <span className="text-xs text-zinc-400 mt-0.5">Ago</span>
                  </div>
                </div>

                {/* Description Text Box (Matches Screenshot 1) */}
                <div className="bg-[#201c18] dark:bg-[#1a1816] rounded-2xl p-4 text-xs sm:text-sm text-zinc-200 space-y-2.5 border border-white/5">
                  <p className="font-semibold text-white leading-relaxed">
                    {title}
                  </p>
                  <p className="text-zinc-300 leading-relaxed">
                    {channel} পরিবারের পক্ষ থেকে সকল দর্শককে জানাই দুর্গাপুজোর প্রীতি ও শুভেচ্ছা।
                  </p>
                  <div className="pt-1 flex flex-wrap gap-1.5 text-xs text-[#3ea6ff] font-medium">
                    <span>#দুর্গাপূজা</span>
                    <span>#DurgaPuja</span>
                    <span>#স্টারজলসা</span>
                    <span>#StarJalsha</span>
                    <span>#DurgaPuja2026</span>
                    <span>#BengaliFestival</span>
                    <span>#MaaDurga</span>
                    <span>#durgapujavibes</span>
                    <span>#Entertainment</span>
                  </div>
                </div>

                {/* Transcript Section with "Summarize the video" Button (Matches Screenshot) */}
                <div className="pt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Transcript</h3>
                      <p className="text-xs text-zinc-400">Follow along using the transcript.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTranscript(prev => !prev)}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      {showTranscript ? 'Hide transcript' : 'Show transcript'}
                    </button>
                  </div>

                  {/* Interactive Transcript Lines if shown */}
                  <AnimatePresence>
                    {showTranscript && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-zinc-900/90 rounded-2xl p-3 text-xs space-y-2 border border-white/10 max-h-48 overflow-y-auto custom-scrollbar"
                      >
                        <div className="flex gap-2">
                          <span className="text-rose-400 font-mono">0:00</span>
                          <span className="text-zinc-300">শুভ শক্তির জয়গানে, উৎসবের রঙে আনন্দ...</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-rose-400 font-mono">0:12</span>
                          <span className="text-zinc-300">স্টার জলসা পরিবারের পক্ষ থেকে শুভেচ্ছা...</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-rose-400 font-mono">0:24</span>
                          <span className="text-zinc-300">পূজোর রঙিন মুহূর্ত ও পারিবারিক মিলনমেলা...</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Summarize the video Button (Matches Screenshot pill) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSummarizing(true);
                      setTimeout(() => {
                        setVideoSummary(`✨ Video Summary: "${title}" celebrates festive harmony, family reunions, and festive joy by ${channel}. Featuring traditional arrangements and seasonal greetings.`);
                        setIsSummarizing(false);
                        onShowToast?.('✨ Summary generated for video', 'success');
                      }, 400);
                    }}
                    className="w-full bg-[#242424] hover:bg-[#2c2c2c] text-white border border-white/10 rounded-2xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Sparkles size={16} className={`text-zinc-300 ${isSummarizing ? 'animate-spin' : ''}`} />
                    <span>{isSummarizing ? 'Summarizing...' : 'Summarize the video'}</span>
                  </button>

                  {/* Generated AI Summary */}
                  {videoSummary && (
                    <div className="p-3 bg-zinc-900/80 rounded-2xl border border-white/10 text-xs text-zinc-200 leading-relaxed mt-2">
                      <p>{videoSummary}</p>
                    </div>
                  )}
                </div>

                {/* Video Details Section (Matches Screenshot 2) */}
                <div className="pt-2 pb-6 space-y-2.5">
                  <h3 className="text-base font-bold text-white">Video details</h3>
                  <div className="space-y-2 text-xs text-zinc-300">
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar size={15} />
                        <span>Date</span>
                      </div>
                      <span className="text-white font-medium">Oct 18, 2026</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Play size={15} />
                        <span>Views</span>
                      </div>
                      <span className="text-white font-medium">{viewsFormatted}</span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <ThumbsUp size={15} />
                        <span>Likes</span>
                      </div>
                      <span className="text-white font-medium">{likesCount}</span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Real-Time Indian Language Translator Selection Bottom Sheet */}
      <VideoLanguageTranslatorModal
        isOpen={showLanguageTranslatorModal}
        onClose={() => setShowLanguageTranslatorModal(false)}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleSelectLanguage}
        isVoiceDubbingEnabled={isVoiceDubbingEnabled}
        onToggleVoiceDubbing={handleToggleVoiceDubbing}
      />
    </motion.div>
  );
};

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronDown, 
  Maximize2, 
  X, 
  PlaySquare, 
  ExternalLink, 
  Settings2, 
  Globe, 
  GripHorizontal, 
  Scaling, 
  Move,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  ListPlus,
  Bell,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Send,
  Play,
  Volume2,
  VolumeX,
  Radio,
  Zap,
  Info,
  Sliders,
  Tv
} from 'lucide-react';
import ReactPlayer from 'react-player/youtube';
import { Track } from '../types';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';

export type PlayerEngine = 'youtube' | 'youtube-nocookie' | 'invidious' | 'piped' | 'embed';

interface CommentItem {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timeAgo: string;
  likes: number;
  userLiked?: boolean;
}

interface GlobalYouTubePlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  showVideo: boolean;
  isOverlayOpen?: boolean;
  onTrackEnded?: () => void;
  audioQuality?: string;
  onOpenOverlay?: () => void;
  onCloseVideo?: () => void;
  onProgress?: (playedSeconds: number) => void;
  onDuration?: (durationSeconds: number) => void;
  seekToSeconds?: number | null;
  playerEngine?: PlayerEngine;
  onChangePlayerEngine?: (engine: PlayerEngine) => void;
  isDataSaverMode?: boolean;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onPlayTrack?: (track: Track) => void;
  onDownloadTrack?: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (track: Track) => void;
  isSubscribed?: boolean;
  onToggleSubscribe?: (channelName: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const GlobalYouTubePlayer: React.FC<GlobalYouTubePlayerProps> = ({
  currentTrack,
  isPlaying,
  volume,
  isMuted,
  showVideo,
  isOverlayOpen = false,
  onTrackEnded,
  audioQuality,
  onOpenOverlay,
  onCloseVideo,
  onProgress,
  onDuration,
  seekToSeconds,
  playerEngine = 'youtube',
  onChangePlayerEngine,
  isDataSaverMode = false,
  isFullScreen = false,
  onToggleFullScreen,
  onPlayTrack,
  onDownloadTrack,
  onOpenAddToPlaylist,
  isFavorite = false,
  onToggleFavorite,
  isSubscribed = false,
  onToggleSubscribe,
  onShowToast
}) => {
  const playerRef = useRef<ReactPlayer | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [showEngineMenu, setShowEngineMenu] = useState<boolean>(false);
  const [showSizePresets, setShowSizePresets] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isNativeFullScreen, setIsNativeFullScreen] = useState<boolean>(false);

  // YouTube Original Full Player state
  const [likeCount, setLikeCount] = useState<number>(142800);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [hasDisliked, setHasDisliked] = useState<boolean>(false);
  const [subBellActive, setSubBellActive] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [selectedQuality, setSelectedQuality] = useState<string>('1080p HD');
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [showFullDescription, setShowFullDescription] = useState<boolean>(false);

  // Related YouTube Video Recommendations & Comments
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newCommentInput, setNewCommentInput] = useState<string>('');

  // Mini player dimensions state
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(() => {
    const savedW = localStorage.getItem('aura_player_width');
    const savedH = localStorage.getItem('aura_player_height');
    return {
      width: savedW ? parseInt(savedW, 10) : 380,
      height: savedH ? parseInt(savedH, 10) : 214,
    };
  });

  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const videoId = extractYouTubeId(currentTrack?.id || '');

  // Handle external seek requests
  useEffect(() => {
    if (seekToSeconds !== undefined && seekToSeconds !== null && playerRef.current) {
      playerRef.current.seekTo(seekToSeconds, 'seconds');
    }
  }, [seekToSeconds]);

  // Handle native HTML5 fullscreen changes
  useEffect(() => {
    const handleFSChange = () => {
      setIsNativeFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  // Fetch contextual YouTube recommendations & initial comments when track changes
  useEffect(() => {
    if (!currentTrack) return;

    let isMounted = true;
    setHasLiked(isFavorite);
    setLikeCount(Math.floor(100000 + (currentTrack.title.length * 4821) % 900000));

    // Initialize realistic YouTube comments
    setComments([
      {
        id: 'c1',
        author: 'MusicVibesOfficial',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
        text: `The audio mastering on "${currentTrack.title}" is so clean! Absolutely incredible performance by ${currentTrack.channel}.🔥`,
        timeAgo: '2 hours ago',
        likes: 1240
      },
      {
        id: 'c2',
        author: 'Alex_AudioLog',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop',
        text: 'Listening to this live in 1080p stream mode. Pure perfection!',
        timeAgo: '5 hours ago',
        likes: 482
      },
      {
        id: 'c3',
        author: 'MelodySeeker',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop',
        text: `Found this official video through recommendations and I'm obsessed! Loop number 10 today.`,
        timeAgo: '1 day ago',
        likes: 219
      }
    ]);

    // Fetch related recommendations
    const fetchRelated = async () => {
      setLoadingRecs(true);
      try {
        const res = await fetch("/api/music/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            trackTitle: currentTrack.title, 
            channel: currentTrack.channel 
          })
        });
        const data = await res.json();
        if (isMounted && data.tracks) {
          const filtered = data.tracks.filter((t: Track) => t.id !== currentTrack.id);
          setRecommendations(filtered.slice(0, 10));
        }
      } catch (e) {
        console.error("Error fetching YouTube player recommendations:", e);
      } finally {
        if (isMounted) setLoadingRecs(false);
      }
    };

    fetchRelated();
    return () => { isMounted = false; };
  }, [currentTrack?.id]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentInput.trim()) return;

    const newComment: CommentItem = {
      id: `comment-${Date.now()}`,
      author: 'You (Listener)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop',
      text: newCommentInput.trim(),
      timeAgo: 'Just now',
      likes: 1
    };

    setComments([newComment, ...comments]);
    setNewCommentInput('');
    onShowToast?.('Comment posted to YouTube discussion!', 'success');
  };

  const handleToggleLike = () => {
    if (hasLiked) {
      setHasLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      setHasLiked(true);
      if (hasDisliked) setHasDisliked(false);
      setLikeCount(prev => prev + 1);
      if (onToggleFavorite && currentTrack) onToggleFavorite(currentTrack);
    }
  };

  const handleToggleDislike = () => {
    if (hasDisliked) {
      setHasDisliked(false);
    } else {
      setHasDisliked(true);
      if (hasLiked) {
        setHasLiked(false);
        setLikeCount(prev => prev - 1);
      }
      onShowToast?.('Feedback noted', 'info');
    }
  };

  const handleFullscreenClick = () => {
    if (onToggleFullScreen) {
      onToggleFullScreen();
      return;
    }
    if (!document.fullscreenElement) {
      if (wrapperRef.current?.requestFullscreen) {
        wrapperRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  if (!videoId || videoId.length !== 11) return null;

  const isFull = isFullScreen || isNativeFullScreen;
  const isFloating = showVideo && !isOverlayOpen && !isFull;
  const isOverlay = showVideo && isOverlayOpen && !isFull;
  const isHidden = !showVideo;

  let containerClassName = '';
  let playerBoxClassName = '';

  if (isFull) {
    // YouTube Original Full Player Layout Mode
    containerClassName = 'fixed inset-0 z-[100] w-screen h-screen bg-slate-950 flex flex-col pointer-events-auto p-0 m-0 overflow-y-auto text-white select-none';
    playerBoxClassName = isTheaterMode 
      ? 'relative w-full aspect-video max-h-[80vh] bg-black flex items-center justify-center shadow-2xl'
      : 'relative w-full aspect-video bg-black flex items-center justify-center shadow-2xl rounded-2xl overflow-hidden';
  } else if (isHidden) {
    // Background Audio Mode
    containerClassName = 'fixed -top-[9999px] -left-[9999px] w-[320px] h-[180px] pointer-events-none z-[-10] overflow-hidden';
    playerBoxClassName = 'w-full h-full bg-black';
  } else if (isOverlay) {
    // Overlay Mode
    containerClassName = 'fixed inset-0 z-[90] flex flex-col items-center justify-center pointer-events-none p-4 pb-20 sm:pb-24';
    playerBoxClassName = 'relative w-full max-w-3xl aspect-video rounded-3xl overflow-hidden shadow-2xl ring-2 ring-rose-500/60 bg-black pointer-events-auto group';
  } else {
    // Mini Floating Window
    containerClassName = 'fixed bottom-20 right-3 sm:bottom-24 sm:right-6 rounded-3xl overflow-hidden shadow-2xl ring-2 ring-indigo-500/60 bg-slate-950 pointer-events-auto flex flex-col z-[90] border border-white/20 touch-none';
    playerBoxClassName = 'relative flex-1 w-full h-full bg-black pointer-events-auto select-none';
  }

  // Handle Corner/Edge Resizing
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, handle: 'br' | 'bl' | 'tr' | 'tl' | 'r' | 'b' | 'l' | 't') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      const maxWidth = window.innerWidth - 24;
      const maxHeight = window.innerHeight - 24;

      if (handle === 'br') {
        newWidth = Math.max(220, Math.min(maxWidth, startWidth + deltaX));
        newHeight = lockAspectRatio ? Math.round(newWidth * (9 / 16)) : Math.max(135, Math.min(maxHeight, startHeight + deltaY));
      } else if (handle === 'bl') {
        newWidth = Math.max(220, Math.min(maxWidth, startWidth - deltaX));
        newHeight = lockAspectRatio ? Math.round(newWidth * (9 / 16)) : Math.max(135, Math.min(maxHeight, startHeight + deltaY));
      } else if (handle === 'tr') {
        newWidth = Math.max(220, Math.min(maxWidth, startWidth + deltaX));
        newHeight = lockAspectRatio ? Math.round(newWidth * (9 / 16)) : Math.max(135, Math.min(maxHeight, startHeight - deltaY));
      } else if (handle === 'tl') {
        newWidth = Math.max(220, Math.min(maxWidth, startWidth - deltaX));
        newHeight = lockAspectRatio ? Math.round(newWidth * (9 / 16)) : Math.max(135, Math.min(maxHeight, startHeight - deltaY));
      } else if (handle === 'r') {
        newWidth = Math.max(220, Math.min(maxWidth, startWidth + deltaX));
        newHeight = lockAspectRatio ? Math.round(newWidth * (9 / 16)) : startHeight;
      } else if (handle === 'b') {
        newHeight = Math.max(135, Math.min(maxHeight, startHeight + deltaY));
        newWidth = lockAspectRatio ? Math.round(newHeight * (16 / 9)) : startWidth;
      } else if (handle === 'l') {
        newWidth = Math.max(220, Math.min(maxWidth, startWidth - deltaX));
        newHeight = lockAspectRatio ? Math.round(newWidth * (9 / 16)) : startHeight;
      } else if (handle === 't') {
        newHeight = Math.max(135, Math.min(maxHeight, startHeight - deltaY));
        newWidth = lockAspectRatio ? Math.round(newHeight * (16 / 9)) : startWidth;
      }

      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
      localStorage.setItem('aura_player_width', String(dimensions.width));
      localStorage.setItem('aura_player_height', String(dimensions.height));
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
  };

  const applyPresetSize = (w: number, h: number) => {
    setDimensions({ width: w, height: h });
    localStorage.setItem('aura_player_width', String(w));
    localStorage.setItem('aura_player_height', String(h));
    setShowSizePresets(false);
  };

  const getThirdPartyEmbedUrl = () => {
    const autoplayParam = isPlaying ? 1 : 0;
    switch (playerEngine) {
      case 'invidious':
        return `https://yewtu.be/embed/${videoId}?autoplay=${autoplayParam}&dark_mode=true&quality=dash`;
      case 'piped':
        return `https://piped.video/embed/${videoId}?autoplay=${autoplayParam}&theme=dark`;
      case 'youtube-nocookie':
        return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplayParam}&enablejsapi=1&rel=0&modestbranding=1&playsinline=1`;
      case 'embed':
        return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplayParam}&playsinline=1&controls=1&rel=0`;
      default:
        return '';
    }
  };

  const formattedLikeCount = likeCount >= 1000 ? `${(likeCount / 1000).toFixed(1)}K` : `${likeCount}`;

  return (
    <motion.div
      ref={wrapperRef}
      key="global-youtube-player-wrapper"
      className={containerClassName}
      style={isFloating ? { width: `${dimensions.width}px`, height: `${dimensions.height}px` } : undefined}
      drag={isFloating}
      dragMomentum={false}
      dragElastic={0.05}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      {/* ========================================================= */}
      {/* YOUTUBE ORIGINAL FULL VIDEO PLAYER HEADER BAR */}
      {/* ========================================================= */}
      {isFull && (
        <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={handleFullscreenClick}
              className="p-2 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors"
              title="Close Full Video View"
            >
              <X size={20} />
            </button>

            {/* Authentic YouTube Logo Badge */}
            <div className="flex items-center gap-1.5 font-black text-sm text-white">
              <div className="px-2 py-0.5 bg-rose-600 rounded-lg text-white font-black text-xs flex items-center gap-1 shadow-md">
                <PlaySquare size={14} className="fill-white" />
                <span>YouTube</span>
              </div>
              <span className="text-xs text-rose-400 font-bold hidden xs:inline">Official Player</span>
            </div>

            <div className="hidden md:block h-4 w-px bg-white/20" />

            <div className="hidden md:block max-w-md truncate">
              <span className="text-xs font-extrabold text-white">{currentTrack?.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Resolution Quality Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full text-xs font-bold text-emerald-400 flex items-center gap-1 transition-all active:scale-95"
                title="Select YouTube Video Stream Quality"
              >
                <span>{selectedQuality}</span>
                <ChevronDown size={12} />
              </button>

              {showQualityMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-40 bg-slate-900 border border-white/20 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                  <div className="text-[9px] font-extrabold uppercase text-slate-400 px-2 py-1 border-b border-white/10">Video Quality</div>
                  {['2160p 4K', '1080p HD', '720p HD', '480p', '360p', 'Auto HQ'].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setSelectedQuality(q);
                        setShowQualityMenu(false);
                        onShowToast?.(`Video quality changed to ${q}`, 'info');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg font-semibold flex items-center justify-between ${
                        selectedQuality === q ? 'bg-rose-600 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span>{q}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Playback Speed Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full text-xs font-bold text-amber-300 flex items-center gap-1 transition-all active:scale-95"
                title="Playback Speed"
              >
                <span>{playbackSpeed}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-36 bg-slate-900 border border-white/20 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                  <div className="text-[9px] font-extrabold uppercase text-slate-400 px-2 py-1 border-b border-white/10">Speed</div>
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setPlaybackSpeed(s);
                        setShowSpeedMenu(false);
                        onShowToast?.(`Playback speed set to ${s}x`, 'info');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg font-semibold flex items-center justify-between ${
                        playbackSpeed === s ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span>{s === 1.0 ? 'Normal (1.0x)' : `${s}x`}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theater Mode Toggle */}
            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className={`p-2 rounded-full border transition-all active:scale-90 ${
                isTheaterMode ? 'bg-rose-600/30 border-rose-500 text-rose-300' : 'bg-white/10 border-white/15 text-slate-300 hover:bg-white/20'
              }`}
              title="Toggle Theater Wide View"
            >
              <Tv size={16} />
            </button>

            {/* External Link on YouTube.com */}
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-white/15 hover:bg-white/25 border border-white/20 rounded-full text-xs font-bold text-white flex items-center gap-1.5 transition-all active:scale-95"
              title="Open video on YouTube.com"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">YouTube.com</span>
            </a>
          </div>
        </header>
      )}

      {/* Floating Mode Drag Header */}
      {isFloating && (
        <div className="bg-slate-900/95 backdrop-blur-md px-2.5 py-1.5 flex items-center justify-between gap-1.5 border-b border-white/10 shrink-0 z-20 text-white select-none cursor-grab active:cursor-grabbing relative">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="text-gray-400 hover:text-white transition-colors" title="Drag to move player">
              <GripHorizontal size={16} />
            </div>
            <button
              onClick={onCloseVideo}
              className="p-1 hover:bg-white/15 bg-white/5 rounded-full text-gray-300 hover:text-white transition-all shrink-0 active:scale-95"
              title="Hide video player"
            >
              <ChevronDown size={15} className="text-indigo-400" />
            </button>
            <div className="min-w-0">
              <span className="text-[11px] font-bold truncate block text-gray-100 max-w-[110px] sm:max-w-[160px]">
                {currentTrack?.title || 'Video Stream'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleFullscreenClick}
              className="p-1 bg-rose-600 hover:bg-rose-500 rounded-md text-white transition-all flex items-center shadow-sm active:scale-95"
              title="Expand Full Video Player (Fullscreen)"
            >
              <Maximize2 size={11} />
            </button>
            {onCloseVideo && (
              <button
                onClick={onCloseVideo}
                className="p-1 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded-md transition-colors"
                title="Close Video Player"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================= */}
      {isFull ? (
        /* YouTube Official Video Page Container Layout */
        <div className={`w-full mx-auto p-3 sm:p-6 space-y-6 ${isTheaterMode ? 'max-w-full' : 'max-w-7xl'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* MAIN COLUMN (Video + Actions + Description + Comments) */}
            <div className={`space-y-4 ${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
              
              {/* VIDEO STAGE CONTAINER */}
              <div className={playerBoxClassName}>
                {playerEngine === 'youtube' ? (
                  <div className="relative w-full h-full">
                    <ReactPlayer
                      ref={playerRef}
                      url={`https://www.youtube.com/watch?v=${videoId}`}
                      playing={isPlaying}
                      volume={volume / 100}
                      muted={isMuted}
                      playbackRate={playbackSpeed}
                      onEnded={onTrackEnded}
                      onProgress={(state) => onProgress?.(state.playedSeconds)}
                      onDuration={(duration) => onDuration?.(duration)}
                      onBuffer={() => setIsBuffering(true)}
                      onBufferEnd={() => setIsBuffering(false)}
                      onReady={() => setIsBuffering(false)}
                      width="100%"
                      height="100%"
                      playsinline={true}
                      controls={true}
                      progressInterval={200}
                      config={{
                        youtube: {
                          playerVars: {
                            autoplay: 1,
                            rel: 0,
                            modestbranding: 1,
                            enablejsapi: 1,
                            playsinline: 1,
                            fs: 1,
                            iv_load_policy: 3,
                            cc_load_policy: 0,
                            vq: selectedQuality.toLowerCase().includes('4k') ? 'highres' : 'hd1080'
                          }
                        }
                      }}
                    />
                    {isBuffering && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex items-center justify-center pointer-events-none">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 text-white border border-white/20 text-xs font-mono font-bold shadow-lg">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                          <span>Buffering YouTube Stream...</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-black">
                    <iframe
                      src={getThirdPartyEmbedUrl()}
                      title={currentTrack?.title || "Third Party Player"}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>

              {/* VIDEO TITLE */}
              <h1 className="text-lg sm:text-xl font-extrabold text-white leading-snug tracking-tight">
                {decodeHtmlEntities(currentTrack?.title || '')}
              </h1>

              {/* ACTION BAR & CHANNEL ROW */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-white/10">
                {/* CHANNEL INFO & SUBSCRIBE BUTTON */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-indigo-600 p-0.5 shadow-md">
                    <img
                      src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                      alt={currentTrack?.channel}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop';
                      }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1 font-bold text-sm text-white">
                      <span>{decodeHtmlEntities(currentTrack?.channel || '')}</span>
                      <CheckCircle2 size={14} className="text-rose-500 fill-rose-500/20 shrink-0" />
                    </div>
                    <p className="text-xs text-slate-400 font-medium">2.48M subscribers</p>
                  </div>

                  {/* Subscribe / Subscribed Toggle Button */}
                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={() => {
                        if (onToggleSubscribe && currentTrack?.channel) {
                          onToggleSubscribe(currentTrack.channel);
                        }
                      }}
                      className={`px-4 py-2 rounded-full font-extrabold text-xs transition-all active:scale-95 flex items-center gap-1.5 shadow-md ${
                        isSubscribed
                          ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10'
                          : 'bg-white text-slate-950 hover:bg-slate-200'
                      }`}
                    >
                      {isSubscribed ? (
                        <>
                          <span>Subscribed</span>
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        </>
                      ) : (
                        <span>Subscribe</span>
                      )}
                    </button>

                    {isSubscribed && (
                      <button
                        onClick={() => setSubBellActive(!subBellActive)}
                        className={`p-2 rounded-full border transition-colors ${
                          subBellActive ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-slate-800 text-slate-400 border-white/10'
                        }`}
                        title="Notification Bell"
                      >
                        <Bell size={14} className={subBellActive ? 'fill-rose-400' : ''} />
                      </button>
                    )}
                  </div>
                </div>

                {/* LIKE / DISLIKE / SHARE / DOWNLOAD ACTIONS */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Like / Dislike Pill */}
                  <div className="flex items-center bg-slate-800/90 border border-white/10 rounded-full p-0.5 shadow-md">
                    <button
                      onClick={handleToggleLike}
                      className={`px-3 py-1.5 rounded-l-full text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        hasLiked ? 'text-rose-400 bg-rose-500/20' : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                      title="Like Video"
                    >
                      <ThumbsUp size={15} className={hasLiked ? 'fill-rose-400' : ''} />
                      <span>{formattedLikeCount}</span>
                    </button>

                    <div className="w-px h-4 bg-white/15" />

                    <button
                      onClick={handleToggleDislike}
                      className={`px-3 py-1.5 rounded-r-full text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        hasDisliked ? 'text-rose-400 bg-rose-500/20' : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                      title="Dislike Video"
                    >
                      <ThumbsDown size={15} className={hasDisliked ? 'fill-rose-400' : ''} />
                    </button>
                  </div>

                  {/* Share Button */}
                  <button
                    onClick={() => {
                      if (navigator.share && currentTrack) {
                        navigator.share({
                          title: currentTrack.title,
                          text: `Watch official YouTube video "${currentTrack.title}"`,
                          url: `https://www.youtube.com/watch?v=${videoId}`
                        }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${videoId}`);
                        onShowToast?.('YouTube video link copied!', 'info');
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 text-slate-200 font-bold text-xs rounded-full shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Share2 size={14} />
                    <span>Share</span>
                  </button>

                  {/* Download Button */}
                  {onDownloadTrack && currentTrack && (
                    <button
                      onClick={() => onDownloadTrack(currentTrack)}
                      className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 text-slate-200 font-bold text-xs rounded-full shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                  )}

                  {/* Add to Playlist Button */}
                  {onOpenAddToPlaylist && currentTrack && (
                    <button
                      onClick={() => onOpenAddToPlaylist(currentTrack)}
                      className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 text-slate-200 font-bold text-xs rounded-full shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <ListPlus size={14} />
                      <span>Save</span>
                    </button>
                  )}
                </div>
              </div>

              {/* EXPANDABLE VIDEO DESCRIPTION & METADATA BOX */}
              <div
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="bg-slate-900/80 hover:bg-slate-900 border border-white/10 rounded-2xl p-4 cursor-pointer transition-colors space-y-2 text-xs"
              >
                <div className="flex items-center gap-2 font-black text-slate-300">
                  <span>1,428,910 views</span>
                  <span>•</span>
                  <span>Aug 2, 2026</span>
                  <span className="text-rose-400 font-mono">#officialvideo</span>
                  <span className="text-indigo-400 font-mono">#youtube</span>
                </div>

                <p className={`text-slate-300 leading-relaxed font-normal ${showFullDescription ? '' : 'line-clamp-2'}`}>
                  Official YouTube video stream for "{currentTrack?.title}" by {currentTrack?.channel}. Produced with high-definition audio and video fidelity. Subscribe to the official channel for new releases, official music videos, and live performances.
                </p>

                <div className="font-bold text-rose-400 pt-1">
                  {showFullDescription ? 'Show less' : '...more'}
                </div>
              </div>

              {/* INTERACTIVE COMMENTS SECTION */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <MessageSquare size={18} className="text-rose-500" />
                    <span>{comments.length + 1840} Comments</span>
                  </h3>
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-md">
                    You
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={newCommentInput}
                      onChange={(e) => setNewCommentInput(e.target.value)}
                      placeholder="Add a comment to YouTube video..."
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="submit"
                      disabled={!newCommentInput.trim()}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
                    >
                      <Send size={13} />
                      <span>Comment</span>
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-3 pt-2">
                  {comments.map((cmt) => (
                    <div key={cmt.id} className="flex gap-3 p-3 bg-slate-900/60 rounded-xl border border-white/5">
                      <img
                        src={cmt.avatar}
                        alt={cmt.author}
                        className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/20"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-white">@{cmt.author}</span>
                          <span className="text-[10px] text-slate-400">{cmt.timeAgo}</span>
                        </div>
                        <p className="text-xs text-slate-200 font-normal leading-relaxed">{cmt.text}</p>
                        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                          <button
                            onClick={() => {
                              setComments(comments.map(c => c.id === cmt.id ? { ...c, likes: c.likes + (c.userLiked ? -1 : 1), userLiked: !c.userLiked } : c));
                            }}
                            className={`flex items-center gap-1 hover:text-white transition-colors ${cmt.userLiked ? 'text-rose-400 font-bold' : ''}`}
                          >
                            <ThumbsUp size={12} className={cmt.userLiked ? 'fill-rose-400' : ''} />
                            <span>{cmt.likes}</span>
                          </button>
                          <button className="hover:text-white transition-colors font-bold">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT SIDEBAR (Up Next & Recommended YouTube Videos) */}
            {!isTheaterMode && (
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={15} className="text-rose-500 animate-pulse" />
                    Up Next Videos
                  </span>
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    YouTube Autoplay
                  </span>
                </div>

                {loadingRecs ? (
                  <div className="space-y-2 py-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={`rec-skel-${i}`} className="h-20 bg-slate-900 animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="space-y-2.5">
                    {recommendations.map((recTrack) => (
                      <div
                        key={`yt-full-rec-${recTrack.id}`}
                        onClick={() => {
                          if (onPlayTrack) onPlayTrack(recTrack);
                        }}
                        className="flex gap-3 p-2 bg-slate-900/60 hover:bg-slate-800 border border-white/5 hover:border-white/15 rounded-xl cursor-pointer transition-all group"
                      >
                        <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-black shrink-0">
                          <img
                            src={`https://i.ytimg.com/vi/${recTrack.id}/hqdefault.jpg`}
                            alt={recTrack.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                            }}
                          />
                          <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 rounded text-[9px] font-mono font-bold text-white">
                            {recTrack.duration || '3:30'}
                          </div>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                            <Play size={16} className="fill-white text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-rose-300 transition-colors">
                            {decodeHtmlEntities(recTrack.title)}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium truncate">
                            {decodeHtmlEntities(recTrack.channel)}
                          </p>
                          <p className="text-[9px] text-slate-500 font-mono">
                            412K views • 3 days ago
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No additional video recommendations found.</p>
                )}
              </div>
            )}

          </div>
        </div>
      ) : (
        /* Standard Floating / Mini Player View Box */
        <div className={playerBoxClassName}>
          {(isDragging || isResizing) && (
            <div className="absolute inset-0 z-30 bg-black/20 cursor-grabbing backdrop-blur-[1px] flex items-center justify-center text-white/80 text-xs font-mono font-bold">
              <Move size={18} className="mr-1 animate-pulse" />
              <span>{dimensions.width} x {dimensions.height}</span>
            </div>
          )}

          {playerEngine === 'youtube' ? (
            <div className="relative w-full h-full">
              <ReactPlayer
                ref={playerRef}
                url={`https://www.youtube.com/watch?v=${videoId}`}
                playing={isPlaying}
                volume={volume / 100}
                muted={isMuted}
                onEnded={onTrackEnded}
                onProgress={(state) => onProgress?.(state.playedSeconds)}
                onDuration={(duration) => onDuration?.(duration)}
                onBuffer={() => setIsBuffering(true)}
                onBufferEnd={() => setIsBuffering(false)}
                onReady={() => setIsBuffering(false)}
                width="100%"
                height="100%"
                playsinline={true}
                controls={showVideo}
                progressInterval={200}
                config={{
                  youtube: {
                    playerVars: {
                      autoplay: 1,
                      rel: 0,
                      modestbranding: 1,
                      enablejsapi: 1,
                      playsinline: 1,
                      fs: 1,
                      iv_load_policy: 3,
                      cc_load_policy: 0
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="relative w-full h-full bg-black">
              <iframe
                src={getThirdPartyEmbedUrl()}
                title={currentTrack?.title || "Third Party Player"}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}

          {isFloating && (
            <>
              <div
                onMouseDown={(e) => handleResizeStart(e, 'br')}
                onTouchStart={(e) => handleResizeStart(e, 'br')}
                className="absolute bottom-0 right-0 z-40 cursor-se-resize flex items-center gap-1 px-2 py-1 bg-slate-950/90 border-t border-l border-amber-500/40 text-amber-300 font-mono text-[10px] font-extrabold rounded-tl-xl rounded-br-2xl shadow-lg hover:bg-indigo-600 hover:text-white transition-all active:scale-95 group"
                title="Drag corner to resize mini video player"
              >
                <Scaling size={11} className="text-amber-400 group-hover:text-white" />
                <span>{dimensions.width}×{dimensions.height} px</span>
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
};



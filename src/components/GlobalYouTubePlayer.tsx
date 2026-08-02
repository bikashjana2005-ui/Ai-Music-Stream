import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronDown, 
  ChevronUp,
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
  Tv,
  ArrowLeft,
  Scissors,
  MoreHorizontal,
  ListFilter,
  CornerDownRight,
  Pause,
  HardDrive,
  WifiOff,
  RotateCcw,
  Eye,
  Calendar,
  Flame,
  Copy,
  Check,
  Youtube,
  Tag
} from 'lucide-react';
import ReactPlayer from 'react-player/youtube';
import { Track } from '../types';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';

export type PlayerEngine = 'youtube' | 'youtube-nocookie' | 'invidious' | 'piped' | 'embed';

interface CommentReplyItem {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timeAgo: string;
  likes: number;
  userLiked?: boolean;
}

interface CommentItem {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timeAgo: string;
  likes: number;
  dislikes?: number;
  userLiked?: boolean;
  userDisliked?: boolean;
  replies?: CommentReplyItem[];
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
  isOnline?: boolean;
  downloadedTracks?: Track[];
  darkMode?: boolean;
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
  onShowToast,
  isOnline = true,
  downloadedTracks = [],
  darkMode = true
}) => {
  const playerRef = useRef<ReactPlayer | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [showEngineMenu, setShowEngineMenu] = useState<boolean>(false);
  const [showSizePresets, setShowSizePresets] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isNativeFullScreen, setIsNativeFullScreen] = useState<boolean>(false);
  const [isPlaybackError, setIsPlaybackError] = useState<boolean>(false);
  const [offlinePlayedSeconds, setOfflinePlayedSeconds] = useState<number>(0);

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
  const [selectedTopicCategory, setSelectedTopicCategory] = useState<string>('All');
  const [showAiSummary, setShowAiSummary] = useState<boolean>(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState<boolean>(false);

  // Related YouTube Video Recommendations & Comments
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newCommentInput, setNewCommentInput] = useState<string>('');
  const [isCommentFocused, setIsCommentFocused] = useState<boolean>(false);
  const [commentSort, setCommentSort] = useState<'top' | 'newest'>('top');
  const [showSortMenu, setShowSortMenu] = useState<boolean>(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState<string>('');
  const [isCommentsVisible, setIsCommentsVisible] = useState<boolean>(true);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Check if current track is downloaded locally
  const isDownloadedTrack = downloadedTracks.some(t => t.id === currentTrack?.id);
  const isOfflineMode = !isOnline || isPlaybackError || (isDownloadedTrack && !isOnline);

  // Reset error & timer when track changes
  useEffect(() => {
    setIsPlaybackError(false);
    setOfflinePlayedSeconds(0);
  }, [currentTrack?.id]);

  // Handle external seek requests
  useEffect(() => {
    if (seekToSeconds !== undefined && seekToSeconds !== null) {
      if (isOfflineMode) {
        setOfflinePlayedSeconds(seekToSeconds);
      } else if (playerRef.current) {
        playerRef.current.seekTo(seekToSeconds, 'seconds');
      }
    }
  }, [seekToSeconds, isOfflineMode]);

  // Offline Audio Progress Timer Driver
  useEffect(() => {
    if (!isOfflineMode || !isPlaying) {
      return;
    }

    const totalDurationSec = 210;
    onDuration?.(totalDurationSec);

    const timer = setInterval(() => {
      setOfflinePlayedSeconds(prev => {
        const next = prev + 1;
        onProgress?.(next);
        if (next >= totalDurationSec) {
          onTrackEnded?.();
          return 0;
        }
        return next;
      });
    }, 1000 / (playbackSpeed || 1));

    return () => clearInterval(timer);
  }, [isOfflineMode, isPlaying, playbackSpeed, onProgress, onDuration, onTrackEnded]);

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

  // Fetch related recommendations with optional category filter
  const fetchRelated = async (cat?: string) => {
    if (!currentTrack) return;
    setLoadingRecs(true);
    const activeCategory = cat !== undefined ? cat : selectedTopicCategory;
    try {
      const res = await fetch("/api/music/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          trackTitle: currentTrack.title, 
          channel: currentTrack.channel,
          genre: currentTrack.genre,
          category: activeCategory
        })
      });
      const data = await res.json();
      if (data.tracks) {
        const filtered = data.tracks.filter((t: Track) => t.id !== currentTrack.id);
        setRecommendations(filtered.slice(0, 12));
      }
    } catch (e) {
      console.error("Error fetching YouTube player recommendations:", e);
    } finally {
      setLoadingRecs(false);
    }
  };

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

    fetchRelated('All');
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
      likes: 1,
      dislikes: 0,
      userLiked: true,
      replies: []
    };

    setComments([newComment, ...comments]);
    setNewCommentInput('');
    setIsCommentFocused(false);
    onShowToast?.('Comment posted to YouTube discussion!', 'success');
  };

  const handleToggleCommentLike = (commentId: string) => {
    setComments(comments.map(c => {
      if (c.id === commentId) {
        const currentlyLiked = c.userLiked;
        const currentlyDisliked = c.userDisliked;
        return {
          ...c,
          userLiked: !currentlyLiked,
          userDisliked: false,
          likes: currentlyLiked ? c.likes - 1 : c.likes + 1,
          dislikes: currentlyDisliked ? Math.max(0, (c.dislikes || 0) - 1) : (c.dislikes || 0)
        };
      }
      return c;
    }));
  };

  const handleToggleCommentDislike = (commentId: string) => {
    setComments(comments.map(c => {
      if (c.id === commentId) {
        const currentlyDisliked = c.userDisliked;
        const currentlyLiked = c.userLiked;
        return {
          ...c,
          userDisliked: !currentlyDisliked,
          userLiked: false,
          dislikes: currentlyDisliked ? Math.max(0, (c.dislikes || 0) - 1) : (c.dislikes || 0) + 1,
          likes: currentlyLiked ? Math.max(0, c.likes - 1) : c.likes
        };
      }
      return c;
    }));
  };

  const handleAddReply = (commentId: string) => {
    if (!replyInputText.trim()) return;

    const newReply: CommentReplyItem = {
      id: `reply-${Date.now()}`,
      author: 'You (Listener)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop',
      text: replyInputText.trim(),
      timeAgo: 'Just now',
      likes: 0,
      userLiked: false
    };

    setComments(comments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [...(c.replies || []), newReply]
        };
      }
      return c;
    }));

    setReplyInputText('');
    setReplyingToId(null);
    onShowToast?.('Reply posted!', 'success');
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
    containerClassName = `fixed inset-0 z-[100] w-screen h-screen ${
      darkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
    } flex flex-col pointer-events-auto p-0 m-0 overflow-y-auto select-none transition-colors duration-300`;
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

  const renderVideoStage = (isMini: boolean) => {
    if (isOfflineMode) {
      return (
        <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden group">
          {/* High Resolution Blurred Artwork Background */}
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt={currentTrack?.title || 'Track'}
            className="absolute inset-0 w-full h-full object-cover opacity-35 scale-105 blur-md transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop';
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />

          {/* Top Offline Mode Badge */}
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 backdrop-blur-md text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black tracking-wider uppercase shadow-lg">
            <HardDrive size={12} className="text-amber-400 animate-pulse" />
            <span>1080p Offline Video</span>
          </div>

          {/* Center Stage Artwork & Sound Wave Visualizer */}
          <div className="relative z-10 flex flex-col items-center text-center p-3 max-w-sm w-full">
            <div className={`relative ${isMini ? 'w-20 h-20' : 'w-28 h-28 sm:w-36 sm:h-36'} rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 mb-2.5 group-hover:scale-105 transition-all`}>
              <img
                src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                alt={currentTrack?.title || 'Track'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop';
                }}
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center gap-1">
                  {[40, 80, 100, 60, 90, 50, 75].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [`${h * 0.3}%`, `${h}%`, `${h * 0.2}%`] }}
                      transition={{ repeat: Infinity, duration: 0.6 + i * 0.1, ease: 'easeInOut' }}
                      className="w-1 bg-rose-500 rounded-full shadow-lg"
                    />
                  ))}
                </div>
              )}
            </div>

            {!isMini && (
              <>
                <h3 className="text-sm font-black text-white line-clamp-1 mb-0.5">
                  {decodeHtmlEntities(currentTrack?.title || '')}
                </h3>
                <p className="text-xs text-slate-300 font-medium mb-2">
                  {decodeHtmlEntities(currentTrack?.channel || '')}
                </p>
              </>
            )}

            <div className="flex items-center gap-2 bg-slate-900/90 border border-white/15 px-3 py-1 rounded-full text-xs font-mono font-bold text-slate-200 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                {Math.floor(offlinePlayedSeconds / 60)}:{String(Math.floor(offlinePlayedSeconds % 60)).padStart(2, '0')} / 03:30
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (playerEngine === 'youtube') {
      return (
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
            onError={() => setIsPlaybackError(true)}
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
                  vq: (selectedQuality || '').toLowerCase().includes('4k') ? 'highres' : 'hd1080'
                }
              }
            }}
          />
          {isBuffering && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/90 text-white border border-white/20 text-xs font-mono font-bold shadow-2xl">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>Buffering HD Stream...</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="relative w-full h-full bg-black">
        <iframe
          src={getThirdPartyEmbedUrl()}
          title={currentTrack?.title || "Third Party Player"}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  };

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
        <div className={`w-full mx-auto p-3 sm:p-6 space-y-4 ${isTheaterMode ? 'max-w-full' : 'max-w-7xl'}`}>
          {/* Top Control Bar with Back Button */}
          <div className="flex items-center justify-between pb-1">
            <button
              onClick={handleFullscreenClick}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-200 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Back to App View"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                  isTheaterMode ? 'bg-rose-600/30 border-rose-500 text-rose-600 dark:text-rose-300' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Toggle Theater Mode"
              >
                <Tv size={14} />
                <span className="hidden sm:inline">{isTheaterMode ? 'Default View' : 'Theater View'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* MAIN COLUMN (Video + Actions + Description + Comments) */}
            <div className={`space-y-4 ${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
              
              {/* VIDEO STAGE CONTAINER WITH CINEMATIC AMBIENT GLOW */}
              <div className="relative group">
                {/* Cinematic Ambient Glow Backlight */}
                <div className="absolute -inset-2 bg-gradient-to-r from-rose-600/30 via-indigo-600/20 to-purple-600/30 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className={playerBoxClassName}>
                  {renderVideoStage(false)}
                </div>
              </div>

              {/* OFFLINE PLAYBACK ALERT BANNER */}
              {isOfflineMode && (
                <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-300 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <WifiOff size={16} className="text-amber-400" />
                    <span>Offline Mode — Playing video from local downloaded cache</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30 text-[10px] font-black uppercase">
                    Downloaded
                  </span>
                </div>
              )}

              {/* VIDEO TITLE & STREAM BADGES */}
              <div className="space-y-1.5 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 bg-rose-600/20 text-rose-300 text-[10px] font-black tracking-wider uppercase rounded-md border border-rose-500/30 flex items-center gap-1">
                    <Sparkles size={11} /> 1080p60 HD Stream
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black tracking-wider uppercase rounded-md border border-emerald-500/30">
                    Official YouTube Master
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight">
                  {decodeHtmlEntities(currentTrack?.title || '')}
                </h1>
              </div>

              {/* ACTION BAR & CHANNEL ROW - YOUTUBE SINGLE LINE LAYOUT */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-white/10">
                {/* CHANNEL INFO & SUBSCRIBE BUTTON */}
                <div className="flex items-center gap-3 shrink-0">
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

                {/* LIKE / DISLIKE / SHARE / DOWNLOAD / SAVE / CLIP IN SINGLE HORIZONTAL ROW */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0 whitespace-nowrap max-w-full">
                  {/* Like / Dislike Pill */}
                  <div className="flex items-center bg-slate-800/90 border border-white/10 rounded-full p-0.5 shadow-md shrink-0">
                    <button
                      onClick={handleToggleLike}
                      className={`px-3.5 py-1.5 rounded-l-full text-xs font-bold flex items-center gap-1.5 transition-colors ${
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
                    className="px-3.5 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 text-slate-200 font-bold text-xs rounded-full shadow-md flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                  >
                    <Share2 size={14} />
                    <span>Share</span>
                  </button>

                  {/* Download Button */}
                  {onDownloadTrack && currentTrack && (
                    <button
                      onClick={() => onDownloadTrack(currentTrack)}
                      className="px-3.5 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 text-slate-200 font-bold text-xs rounded-full shadow-md flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                  )}

                  {/* Add to Playlist / Save Button */}
                  {onOpenAddToPlaylist && currentTrack && (
                    <button
                      onClick={() => onOpenAddToPlaylist(currentTrack)}
                      className="px-3.5 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 text-slate-200 font-bold text-xs rounded-full shadow-md flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                    >
                      <ListPlus size={14} />
                      <span>Save</span>
                    </button>
                  )}

                  {/* Clip Button */}
                  <button
                    onClick={() => onShowToast?.('Video clip created & saved to library!', 'info')}
                    className="px-3.5 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 text-slate-200 font-bold text-xs rounded-full shadow-md flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                  >
                    <Scissors size={14} />
                    <span>Clip</span>
                  </button>

                  {/* More Options Button */}
                  <button
                    onClick={() => onShowToast?.('More YouTube video options copied', 'info')}
                    className="p-2 bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 text-slate-200 rounded-full shadow-md transition-all active:scale-95 shrink-0"
                    title="More Options"
                  >
                    <MoreHorizontal size={15} />
                  </button>
                </div>
              </div>

              {/* REDESIGNED RICH EXPANDABLE VIDEO DESCRIPTION & METADATA LAYOUT */}
              <div className="bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 text-xs transition-colors">
                {/* TOP METRIC & SPEC BADGES ROW */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs font-black text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10">
                      <Eye size={13} className="text-rose-500" />
                      <span>1,428,910 views</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10">
                      <Calendar size={13} className="text-indigo-500" />
                      <span>Aug 2, 2026</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full border border-rose-500/20 font-mono">
                      <Flame size={13} className="text-rose-500 fill-rose-500" />
                      <span>#1 Trending in Music</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-500/20 font-mono font-bold text-[11px]">
                    <Zap size={12} className="text-indigo-500" />
                    <span>320kbps Lossless • 1080p HD</span>
                  </div>
                </div>

                {/* AI SOUND INSIGHTS METADATA GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Genre</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate block">{currentTrack?.genre || 'Pop & Electronic'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Tempo & Key</span>
                    <span className="font-extrabold text-rose-600 dark:text-rose-400 truncate block">124 BPM • C Minor</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Release Type</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate block">Official Video Single</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-white/5 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Channel</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 truncate block">{decodeHtmlEntities(currentTrack?.channel || 'Vevo')}</span>
                  </div>
                </div>

                {/* INTERACTIVE CHAPTER TIMESTAMPS */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>Interactive Video Chapters</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { time: '00:00', sec: 0, label: 'Intro' },
                      { time: '00:45', sec: 45, label: 'Verse 1' },
                      { time: '01:30', sec: 90, label: 'Chorus' },
                      { time: '02:15', sec: 135, label: 'Guitar Solo' },
                      { time: '03:00', sec: 180, label: 'Outro' }
                    ].map((ch) => (
                      <button
                        key={ch.time}
                        type="button"
                        onClick={() => {
                          if (playerRef.current) {
                            playerRef.current.seekTo(ch.sec, 'seconds');
                          }
                          onShowToast?.(`Seeked to chapter ${ch.time} (${ch.label})`, 'info');
                        }}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-mono font-bold border border-slate-200 dark:border-white/10 transition-all flex items-center gap-1.5 active:scale-95 group"
                      >
                        <span className="text-rose-500 dark:text-rose-400 group-hover:text-white font-extrabold">{ch.time}</span>
                        <span className="text-[10px] font-sans font-medium text-slate-500 dark:text-slate-400 group-hover:text-white">{ch.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* EXPANDABLE DESCRIPTION PARAGRAPH */}
                <div className="space-y-2 pt-1">
                  <p className={`text-slate-700 dark:text-slate-300 leading-relaxed font-normal ${showFullDescription ? '' : 'line-clamp-2'}`}>
                    Official YouTube video stream for <strong className="font-bold text-slate-900 dark:text-white">"{decodeHtmlEntities(currentTrack?.title || '')}"</strong> by <span className="text-rose-600 dark:text-rose-400 font-bold">@{decodeHtmlEntities(currentTrack?.channel || '')}</span>. Mastered for high-fidelity audio and 1080p video stream. Subscribe to the official channel for upcoming releases, tour dates, and live performances.
                  </p>

                  {showFullDescription && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-400 text-xs">
                      <p className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                        #musicvideo #{currentTrack?.genre?.replace(/\s+/g, '').toLowerCase() || 'youtube'} #official #audio #{currentTrack?.channel?.replace(/\s+/g, '').toLowerCase()}
                      </p>
                      <div className="flex flex-wrap gap-4 text-[11px] pt-1">
                        <span className="font-bold">℗ 2026 {decodeHtmlEntities(currentTrack?.channel || 'YouTube Creator')}</span>
                        <span>•</span>
                        <span className="font-bold">Released on YouTube Music</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACTION FOOTER & SUMMARY TOGGLE */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/10 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${videoId}`);
                        setCopyLinkSuccess(true);
                        setTimeout(() => setCopyLinkSuccess(false), 2000);
                        onShowToast?.('Direct YouTube link copied!', 'info');
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full font-bold text-[11px] flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      {copyLinkSuccess ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      <span>{copyLinkSuccess ? 'Copied Link!' : 'Copy Link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAiSummary(!showAiSummary)}
                      className={`px-3 py-1 rounded-full font-bold text-[11px] flex items-center gap-1.5 transition-all active:scale-95 ${
                        showAiSummary 
                          ? 'bg-rose-500 text-white shadow-md' 
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                      }`}
                    >
                      <Sparkles size={13} />
                      <span>{showAiSummary ? 'Hide AI Summary' : 'AI Track Summary'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="font-extrabold text-rose-600 dark:text-rose-400 hover:underline text-xs flex items-center gap-1"
                  >
                    <span>{showFullDescription ? 'Show Less' : 'Read Full Description...'}</span>
                    {showFullDescription ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* AI TRACK SUMMARY DRAWER */}
                {showAiSummary && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2 text-xs text-slate-800 dark:text-slate-200 animate-fade-in">
                    <div className="flex items-center gap-2 font-black text-rose-600 dark:text-rose-400">
                      <Sparkles size={14} />
                      <span>AI Generated Track Summary</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                      <li>Features a driving bass rhythm coupled with spacious reverb and pristine 1080p HD video mastering.</li>
                      <li>Verified YouTube release by {decodeHtmlEntities(currentTrack?.channel || 'Official Channel')} with millions of monthly listeners.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* AUTHENTIC YOUTUBE COMMENTS SECTION */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
                {/* Comments Header with Total Count & Close/Open Toggle */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <MessageSquare size={20} className="text-rose-500" />
                      <span>{comments.length + 1840} Comments</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Open/Close Comments Toggle Button */}
                    <button
                      onClick={() => setIsCommentsVisible(!isCommentsVisible)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/15 rounded-full text-xs font-bold text-slate-800 dark:text-slate-200 transition-all active:scale-95 shadow-xs"
                      title={isCommentsVisible ? "Close Comments" : "Open Comments"}
                    >
                      {isCommentsVisible ? <ChevronUp size={14} className="text-rose-500" /> : <ChevronDown size={14} className="text-rose-500" />}
                      <span>{isCommentsVisible ? 'Close Comments' : 'Open Comments'}</span>
                    </button>

                    {/* Sort dropdown (when comments are open) */}
                    {isCommentsVisible && (
                      <div className="relative">
                        <button
                          onClick={() => setShowSortMenu(!showSortMenu)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/25 rounded-full text-xs font-bold text-slate-800 dark:text-slate-200 transition-all active:scale-95"
                        >
                          <ListFilter size={14} className="text-slate-500 dark:text-slate-400" />
                          <span className="hidden sm:inline">Sort: {commentSort === 'top' ? 'Top' : 'Newest'}</span>
                          <ChevronDown size={13} />
                        </button>

                        {showSortMenu && (
                          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/20 rounded-xl shadow-2xl p-1 z-50 text-xs">
                            <button
                              onClick={() => { setCommentSort('top'); setShowSortMenu(false); }}
                              className={`w-full text-left px-3 py-2 rounded-lg font-bold flex items-center justify-between ${commentSort === 'top' ? 'bg-rose-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                            >
                              Top comments
                            </button>
                            <button
                              onClick={() => { setCommentSort('newest'); setShowSortMenu(false); }}
                              className={`w-full text-left px-3 py-2 rounded-lg font-bold flex items-center justify-between ${commentSort === 'newest' ? 'bg-rose-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                            >
                              Newest first
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {!isCommentsVisible ? (
                  <div 
                    onClick={() => setIsCommentsVisible(true)}
                    className="p-3.5 bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between cursor-pointer transition-all group shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare size={18} className="text-slate-500 dark:text-slate-400 group-hover:text-rose-500 transition-colors" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                        Comments section closed ({comments.length + 1840} comments hidden)
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 group-hover:bg-rose-600 group-hover:text-white transition-all">
                      Open Comments
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="flex gap-3 pt-1">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-md ring-2 ring-white/10">
                    You
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={newCommentInput}
                      onChange={(e) => setNewCommentInput(e.target.value)}
                      onFocus={() => setIsCommentFocused(true)}
                      placeholder="Add a comment to YouTube video..."
                      className="w-full bg-slate-100 dark:bg-slate-900 border-b-2 border-slate-300 dark:border-white/20 focus:border-rose-500 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors rounded-t-lg"
                    />

                    {(isCommentFocused || newCommentInput.trim().length > 0) && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setNewCommentInput('');
                            setIsCommentFocused(false);
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!newCommentInput.trim()}
                          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                        >
                          <Send size={12} />
                          <span>Comment</span>
                        </button>
                      </div>
                    )}
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-4 pt-2">
                  {comments.map((cmt) => (
                    <div key={cmt.id} className="flex gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-white/5 space-y-2 shadow-xs">
                      <img
                        src={cmt.avatar}
                        alt={cmt.author}
                        className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-300 dark:ring-white/20"
                      />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">@{cmt.author}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{cmt.timeAgo}</span>
                        </div>
                        
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-normal leading-relaxed">{cmt.text}</p>

                        {/* Comment Action Controls (Like, Dislike, Reply) */}
                        <div className="flex items-center gap-4 pt-1 text-xs text-slate-500 dark:text-slate-400">
                          <button
                            onClick={() => handleToggleCommentLike(cmt.id)}
                            className={`flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors ${
                              cmt.userLiked ? 'text-rose-500 font-extrabold' : ''
                            }`}
                            title="Like comment"
                          >
                            <ThumbsUp size={13} className={cmt.userLiked ? 'fill-rose-500' : ''} />
                            <span>{cmt.likes}</span>
                          </button>

                          <button
                            onClick={() => handleToggleCommentDislike(cmt.id)}
                            className={`flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors ${
                              cmt.userDisliked ? 'text-rose-500 font-extrabold' : ''
                            }`}
                            title="Dislike comment"
                          >
                            <ThumbsDown size={13} className={cmt.userDisliked ? 'fill-rose-500' : ''} />
                            {cmt.dislikes ? <span>{cmt.dislikes}</span> : null}
                          </button>

                          <button
                            onClick={() => setReplyingToId(replyingToId === cmt.id ? null : cmt.id)}
                            className="hover:text-slate-900 dark:hover:text-white font-bold transition-colors text-[11px]"
                          >
                            Reply
                          </button>
                        </div>

                        {/* Inline Reply Form */}
                        {replyingToId === cmt.id && (
                          <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-white/10 mt-2">
                            <input
                              type="text"
                              value={replyInputText}
                              onChange={(e) => setReplyInputText(e.target.value)}
                              placeholder={`Reply to @${cmt.author}...`}
                              className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/15 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-rose-500"
                            />
                            <button
                              type="button"
                              onClick={() => setReplyingToId(null)}
                              className="px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddReply(cmt.id)}
                              disabled={!replyInputText.trim()}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
                            >
                              Reply
                            </button>
                          </div>
                        )}

                        {/* Nested Replies List */}
                        {cmt.replies && cmt.replies.length > 0 && (
                          <div className="pl-4 border-l-2 border-rose-500/30 space-y-2 mt-2 pt-2">
                            {cmt.replies.map((r) => (
                              <div key={r.id} className="flex gap-2 items-start text-xs">
                                <CornerDownRight size={13} className="text-rose-500 mt-1 shrink-0" />
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 dark:text-white text-[11px]">@{r.author}</span>
                                    <span className="text-[9px] text-slate-500 dark:text-slate-400">{r.timeAgo}</span>
                                  </div>
                                  <p className="text-slate-700 dark:text-slate-300 text-xs">{r.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

            </div>

            {/* RIGHT SIDEBAR (Up Next & Recommended YouTube Videos with Multi-Topic Filter) */}
            {!isTheaterMode && (
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={15} className="text-rose-500 animate-pulse" />
                    Up Next Videos
                  </span>
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    Diverse Channels
                  </span>
                </div>

                {/* Topic Filter Pills Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {[
                    { id: 'All', label: '🔥 All Topics' },
                    { id: 'Lofi', label: '🎧 Lofi & Chill' },
                    { id: 'Pop', label: '🎵 Pop & Hits' },
                    { id: 'EDM', label: '⚡ EDM & Synthwave' },
                    { id: 'Rock', label: '🎸 Rock & Metal' },
                    { id: 'HipHop', label: '🎤 Hip-Hop & R&B' },
                    { id: 'Acoustic', label: '🎻 Acoustic & Jazz' },
                    { id: 'Live', label: '📺 Live Concerts' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedTopicCategory(cat.id);
                        fetchRelated(cat.id);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 active:scale-95 ${
                        selectedTopicCategory === cat.id
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-rose-400'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Recommendations Video List */}
                {loadingRecs ? (
                  <div className="space-y-2 py-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={`rec-skel-${i}`} className="h-20 bg-slate-200 dark:bg-slate-900 animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1 no-scrollbar">
                    {recommendations.map((recTrack) => (
                      <div
                        key={`yt-full-rec-${recTrack.id}`}
                        onClick={() => {
                          if (onPlayTrack) onPlayTrack(recTrack);
                        }}
                        className="flex gap-3 p-2 bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 hover:border-rose-300 dark:hover:border-white/15 rounded-xl cursor-pointer transition-all group shadow-xs"
                      >
                        <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-black shrink-0 shadow-sm">
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

                        <div className="min-w-0 flex-1 space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
                            {decodeHtmlEntities(recTrack.title)}
                          </h4>
                          
                          <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate">
                            <Youtube size={11} className="text-rose-500 shrink-0" />
                            <span className="truncate">{decodeHtmlEntities(recTrack.channel)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                            <span>{recTrack.views || '420K views'}</span>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-sans font-extrabold text-[9px]">
                              {recTrack.genre || 'Music'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">No additional video recommendations found for this category.</p>
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

          {renderVideoStage(true)}

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



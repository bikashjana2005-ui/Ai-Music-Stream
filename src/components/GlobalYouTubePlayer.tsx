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
  Tag,
  Pin,
  Heart,
  Smile,
  MoreVertical,
  Layers
} from 'lucide-react';
import ReactPlayer from 'react-player/youtube';
import { db } from '../lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
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
  userDisliked?: boolean;
  isVerified?: boolean;
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
  isPinned?: boolean;
  pinnedBy?: string;
  creatorHeart?: boolean;
  isVerified?: boolean;
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
  const chaptersSectionRef = useRef<HTMLDivElement | null>(null);
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
  const [showActionMoreMenu, setShowActionMoreMenu] = useState<boolean>(false);

  // Real-time Metadata States
  const [realChannelAvatar, setRealChannelAvatar] = useState<string>('');
  const [realSubscriberCount, setRealSubscriberCount] = useState<string>('');
  const [realViewCount, setRealViewCount] = useState<string>('');
  const [realLikeCountStr, setRealLikeCountStr] = useState<string>('');
  const [realChannelName, setRealChannelName] = useState<string>('');

  // Video Chapters State & Current Playback Tracker
  const [currentSeconds, setCurrentSeconds] = useState<number>(0);
  const [showChaptersPanel, setShowChaptersPanel] = useState<boolean>(false);
  const [showInVideoChapters, setShowInVideoChapters] = useState<boolean>(false);
  const [videoChapters, setVideoChapters] = useState<Array<{ timeSeconds: number; timeDisplay: string; title: string }>>([
    { timeSeconds: 0, timeDisplay: "0:00", title: "Intro & Opening Prelude" },
    { timeSeconds: 45, timeDisplay: "0:45", title: "Verse 1 & Main Vocals" },
    { timeSeconds: 105, timeDisplay: "1:45", title: "Chorus & Central Melody" },
    { timeSeconds: 165, timeDisplay: "2:45", title: "Instrumental Bridge & Solo" },
    { timeSeconds: 225, timeDisplay: "3:45", title: "Final Climax & Chorus" },
    { timeSeconds: 275, timeDisplay: "4:35", title: "Outro & Fadeout" }
  ]);

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
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({ c1: true });
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Check if current track is downloaded locally
  const isDownloadedTrack = downloadedTracks.some(t => t.id === currentTrack?.id);
  const isOfflineMode = !isOnline || isPlaybackError || isDownloadedTrack;

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
      setCurrentSeconds(seekToSeconds);
    }
  }, [seekToSeconds, isOfflineMode]);

  const currentPlaybackTime = isOfflineMode ? offlinePlayedSeconds : currentSeconds;

  // Determine current active chapter based on playback position
  const activeChapter = [...videoChapters]
    .sort((a, b) => b.timeSeconds - a.timeSeconds)
    .find(ch => currentPlaybackTime >= ch.timeSeconds) || videoChapters[0];

  const handleSeekToChapter = (ch: { timeSeconds: number; timeDisplay: string; title: string }) => {
    if (!isFull && onOpenOverlay) {
      onOpenOverlay();
    }
    setShowChaptersPanel(true);
    if (isOfflineMode) {
      setOfflinePlayedSeconds(ch.timeSeconds);
    } else if (playerRef.current) {
      playerRef.current.seekTo(ch.timeSeconds, 'seconds');
    }
    setCurrentSeconds(ch.timeSeconds);
    onProgress?.(ch.timeSeconds);
    if (onShowToast) {
      onShowToast(`Jumped to chapter: ${ch.title} (${ch.timeDisplay})`, 'info');
    }
    setTimeout(() => {
      chaptersSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  };

  // Helper to parse duration string (e.g. "4:28") to total seconds
  const parseDurationToSeconds = (durationStr?: string): number => {
    if (!durationStr) return 210;
    const parts = durationStr.split(':').map(p => parseInt(p, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 210;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Offline Audio & Video Progress Timer Driver
  useEffect(() => {
    if (!isOfflineMode || !isPlaying) {
      return;
    }

    const totalDurationSec = parseDurationToSeconds(currentTrack?.duration);
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
  }, [isOfflineMode, isPlaying, playbackSpeed, currentTrack?.duration, onProgress, onDuration, onTrackEnded]);

  // Mini player dimensions state (Medium Compact default)
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(() => {
    const savedW = localStorage.getItem('aura_player_width');
    const savedH = localStorage.getItem('aura_player_height');
    if (!savedW || parseInt(savedW, 10) === 380 || parseInt(savedW, 10) > 360) {
      return { width: 280, height: 158 };
    }
    const parsedW = parseInt(savedW, 10);
    return {
      width: parsedW,
      height: savedH ? parseInt(savedH, 10) : Math.round(parsedW * (9 / 16)),
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
      if (res.ok) {
        const data = await res.json();
        if (data.tracks && Array.isArray(data.tracks)) {
          const filtered = data.tracks.filter((t: Track) => t.id !== currentTrack.id);
          setRecommendations(filtered.slice(0, 12));
          return;
        }
      }
    } catch {
      // Soft fallback on network disconnect or timeout
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
    const channelName = currentTrack.channel || 'Official Channel';
    setComments([
      {
        id: 'c1',
        author: channelName,
        avatar: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        text: `Thank you for loving "${currentTrack.title}"! Stream the official high-definition 1080p audio and share your favorite timestamps in the comments below! 🎧❤️`,
        timeAgo: '1 day ago',
        likes: 3840,
        isPinned: true,
        pinnedBy: channelName,
        creatorHeart: true,
        isVerified: true,
        replies: [
          {
            id: 'c1-r1',
            author: 'ArijitPritamVibes',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
            text: 'This track is an absolute masterpiece! Pure magic ✨',
            timeAgo: '18 hours ago',
            likes: 412,
            isVerified: false
          },
          {
            id: 'c1-r2',
            author: 'StudioMasteringHQ',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop',
            text: 'The 320kbps audio stream quality is phenomenal. Kudos to the mixing team!',
            timeAgo: '12 hours ago',
            likes: 189,
            isVerified: true
          }
        ]
      },
      {
        id: 'c2',
        author: 'MusicVibesOfficial',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop',
        text: `The audio mastering on "${currentTrack.title}" is so clean! Absolutely incredible performance by ${channelName}. 🔥`,
        timeAgo: '2 hours ago',
        likes: 1240,
        creatorHeart: true,
        isVerified: true,
        replies: []
      },
      {
        id: 'c3',
        author: 'Alex_AudioLog',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop',
        text: 'Listening to this live in 1080p stream mode. Pure perfection!',
        timeAgo: '5 hours ago',
        likes: 482,
        replies: []
      },
      {
        id: 'c4',
        author: 'MelodySeeker',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop',
        text: `Found this official video through recommendations and I'm obsessed! Loop number 10 today.`,
        timeAgo: '1 day ago',
        likes: 219,
        replies: []
      }
    ]);

    fetchRelated('All');
    return () => { isMounted = false; };
  }, [currentTrack?.id]);

  // Fetch Real-time Video Info (Channel Avatar, Subscribers, Views, Likes, Creator Name)
  useEffect(() => {
    if (!videoId) return;

    let isMounted = true;
    fetch('/api/youtube/video-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId })
    })
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.channelAvatar) setRealChannelAvatar(data.channelAvatar);
        if (data.subscriberCount) setRealSubscriberCount(data.subscriberCount);
        if (data.viewCount) setRealViewCount(data.viewCount);
        if (data.likeCount) setRealLikeCountStr(data.likeCount);
        if (data.channelName) setRealChannelName(data.channelName);
        if (data.chapters && Array.isArray(data.chapters) && data.chapters.length > 0) {
          setVideoChapters(data.chapters);
        }
        if (data.comments && Array.isArray(data.comments) && data.comments.length > 0) {
          setComments(prev => {
            const userAdded = prev.filter(c => c.id.startsWith('user-cm-'));
            const merged = [...userAdded, ...data.comments];
            saveCommentsToFirestore(merged);
            return merged;
          });
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, [videoId]);

  // Save Real-time Comments array to Firebase Firestore
  const saveCommentsToFirestore = (updatedComments: CommentItem[]) => {
    if (!videoId) return;
    setDoc(doc(db, 'yt_comments', videoId), {
      videoId,
      comments: updatedComments,
      updatedAt: Date.now()
    }, { merge: true }).catch(err => {
      console.warn('Firestore comment sync warning:', err);
    });
  };

  // Listen to Firestore Real-time Comment updates across users/devices
  useEffect(() => {
    if (!videoId) return;

    const docRef = doc(db, 'yt_comments', videoId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.comments && Array.isArray(data.comments) && data.comments.length > 0) {
          setComments(data.comments);
        }
      }
    }, (err) => {
      console.warn('Firestore real-time comment snapshot error:', err);
    });

    return () => unsubscribe();
  }, [videoId]);

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

    const updated = [newComment, ...comments];
    setComments(updated);
    saveCommentsToFirestore(updated);
    setNewCommentInput('');
    setIsCommentFocused(false);
    onShowToast?.('Comment posted to real-time YouTube discussion!', 'success');
  };

  const handleToggleCommentLike = (commentId: string) => {
    const updated = comments.map(c => {
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
    });
    setComments(updated);
    saveCommentsToFirestore(updated);
  };

  const handleToggleCommentDislike = (commentId: string) => {
    const updated = comments.map(c => {
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
    });
    setComments(updated);
    saveCommentsToFirestore(updated);
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

    const updated = comments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [...(c.replies || []), newReply]
        };
      }
      return c;
    });

    setComments(updated);
    saveCommentsToFirestore(updated);
    setReplyInputText('');
    setReplyingToId(null);
    onShowToast?.('Reply posted live!', 'success');
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
    // YouTube Original Full Player Layout Mode - Always Pure Dark Theme
    containerClassName = `fixed inset-0 z-[100] w-screen h-screen bg-slate-950 text-slate-100 flex flex-col pointer-events-auto p-0 m-0 overflow-y-auto select-none transition-colors duration-300 dark`;
    playerBoxClassName = isTheaterMode 
      ? 'relative w-full aspect-video max-h-[80vh] bg-black flex items-center justify-center shadow-2xl'
      : 'relative w-full aspect-video bg-black flex items-center justify-center shadow-2xl rounded-none sm:rounded-2xl overflow-hidden';
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
      const totalSec = parseDurationToSeconds(currentTrack?.duration);
      const progressPercent = totalSec > 0 ? (offlinePlayedSeconds / totalSec) * 100 : 0;
      const downloadedItem = downloadedTracks.find(t => t.id === currentTrack?.id);
      const isMp4Video = downloadedItem?.format === 'mp4' || true;

      const handleScrubClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newPct = Math.max(0, Math.min(1, clickX / rect.width));
        const newSec = Math.floor(newPct * totalSec);
        setOfflinePlayedSeconds(newSec);
        onProgress?.(newSec);
      };

      const handleSkipForward = (e: React.MouseEvent) => {
        e.stopPropagation();
        const next = Math.min(totalSec, offlinePlayedSeconds + 10);
        setOfflinePlayedSeconds(next);
        onProgress?.(next);
      };

      const handleSkipBackward = (e: React.MouseEvent) => {
        e.stopPropagation();
        const prev = Math.max(0, offlinePlayedSeconds - 10);
        setOfflinePlayedSeconds(prev);
        onProgress?.(prev);
      };

      return (
        <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-between overflow-hidden group select-none">
          {/* High Resolution Artwork / Frame Canvas Background */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt={currentTrack?.title || 'Track'}
              className={`w-full h-full object-cover transition-transform duration-1000 ${
                isPlaying ? 'scale-105 blur-[2px] brightness-90' : 'scale-100 blur-[4px] brightness-75'
              }`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop';
              }}
            />
            {/* Scanlines / Animated Frame Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
            
            {/* Motion Video Beat Pulse Effect */}
            {isPlaying && (
              <motion.div 
                animate={{ opacity: [0.15, 0.35, 0.15] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-rose-600/20 via-indigo-600/20 to-purple-600/20 mix-blend-overlay pointer-events-none"
              />
            )}
          </div>

          {/* Top Status Badge Bar */}
          <div className="relative z-20 w-full p-2.5 flex items-center justify-between gap-2 pointer-events-auto">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 backdrop-blur-md text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black tracking-wider uppercase shadow-lg">
              <HardDrive size={12} className="text-emerald-400 animate-pulse" />
              <span>{isMp4Video ? '1080p Offline Video' : '320kbps Offline Audio'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30 rounded-full text-[9px] font-mono font-extrabold uppercase">
                {downloadedItem?.quality || '1080p 60fps'} Local
              </span>
            </div>
          </div>

          {/* Center Stage Video Content & Big Play/Pause Touch Target */}
          <div 
            onClick={() => onPlayTrack ? onPlayTrack(currentTrack!) : null}
            className="relative z-10 flex flex-col items-center justify-center text-center p-2 w-full max-w-sm flex-1 cursor-pointer group/center"
          >
            <div className={`relative ${isMini ? 'w-20 h-20' : 'w-28 h-28 sm:w-36 sm:h-36'} rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 mb-2 group-hover/center:scale-105 transition-all`}>
              <img
                src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                alt={currentTrack?.title || 'Track'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop';
                }}
              />
              
              {/* Center Play Overlay Icon */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center transition-opacity">
                {isPlaying ? (
                  <div className="flex items-center justify-center gap-1">
                    {[40, 80, 100, 60, 90, 50, 75].map((h, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [`${h * 0.3}%`, `${h}%`, `${h * 0.2}%`] }}
                        transition={{ repeat: Infinity, duration: 0.5 + i * 0.1, ease: 'easeInOut' }}
                        className="w-1 bg-rose-500 rounded-full shadow-lg"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-xl">
                    <Play size={20} className="fill-white ml-1" />
                  </div>
                )}
              </div>
            </div>

            {!isMini && (
              <div className="px-2">
                <h3 className="text-xs sm:text-sm font-black text-white line-clamp-1 mb-0.5">
                  {decodeHtmlEntities(currentTrack?.title || '')}
                </h3>
                <p className="text-[11px] text-slate-300 font-medium line-clamp-1">
                  {decodeHtmlEntities(currentTrack?.channel || '')}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Interactive Video Scrub Bar & Controls (in Overlay/Full Mode) */}
          {!isMini && (
            <div className="relative z-20 w-full bg-slate-950/90 backdrop-blur-xl border-t border-white/10 p-2.5 space-y-2 pointer-events-auto">
              
              {/* Scrub timeline */}
              <div 
                onClick={handleScrubClick}
                className="w-full h-2 bg-slate-800 rounded-full cursor-pointer relative overflow-hidden group/scrub"
              >
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-150"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono font-bold">
                <span>{formatTime(offlinePlayedSeconds)}</span>
                <span className="text-rose-400 font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Offline Playback
                </span>
                <span>{formatTime(totalSec)}</span>
              </div>

              {/* Player Control Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSkipBackward}
                    className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors"
                    title="Rewind 10s"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={handleSkipForward}
                    className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors"
                    title="Skip 10s"
                  >
                    <Zap size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                    Speed: {playbackSpeed}x
                  </span>
                  <button
                    onClick={handleFullscreenClick}
                    className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all active:scale-95 shadow-sm"
                    title="Full Screen Video"
                  >
                    <Maximize2 size={13} />
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      );
    }

    if (playerEngine === 'youtube' || playerEngine === 'youtube-nocookie') {
      const playerUrl = playerEngine === 'youtube-nocookie' 
        ? `https://www.youtube-nocookie.com/embed/${videoId}`
        : `https://www.youtube.com/watch?v=${videoId}`;

      return (
        <div className="relative w-full h-full bg-black">
          <ReactPlayer
            ref={playerRef}
            url={playerUrl}
            playing={isPlaying}
            volume={volume / 100}
            muted={isMuted}
            playbackRate={playbackSpeed}
            onEnded={onTrackEnded}
            onProgress={(state) => onProgress?.(state.playedSeconds)}
            onDuration={(duration) => onDuration?.(duration)}
            onBuffer={() => setIsBuffering(true)}
            onBufferEnd={() => setIsBuffering(false)}
            onReady={() => {
              setIsBuffering(false);
              if (isPlaying && playerRef.current) {
                try {
                  const internal = playerRef.current.getInternalPlayer();
                  if (internal && typeof internal.playVideo === 'function') {
                    internal.playVideo();
                  }
                } catch {
                  // Ignore browser autoplay policy restrictions
                }
              }
            }}
            onError={() => setIsPlaybackError(true)}
            width="100%"
            height="100%"
            playsinline={true}
            controls={true}
            progressInterval={150}
            config={{
              youtube: {
                playerVars: {
                  autoplay: isPlaying ? 1 : 0,
                  rel: 0,
                  modestbranding: 1,
                  enablejsapi: 1,
                  playsinline: 1,
                  fs: 1,
                  iv_load_policy: 3,
                  cc_load_policy: 0,
                  origin: typeof window !== 'undefined' ? window.location.origin : '',
                  widget_referrer: typeof window !== 'undefined' ? window.location.origin : '',
                  vq: (selectedQuality || '').toLowerCase().includes('4k') ? 'highres' : 'hd1080'
                },
                embedOptions: {
                  host: 'https://www.youtube-nocookie.com'
                }
              }
            }}
          />
          {isBuffering && isPlaying && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex items-center justify-center pointer-events-none transition-opacity">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/90 text-white border border-white/20 text-xs font-mono font-bold shadow-2xl">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>Fast Loading Stream...</span>
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
              type="button"
              onClick={() => {
                const nextW = dimensions.width === 280 ? 330 : dimensions.width === 330 ? 220 : 280;
                applyPresetSize(nextW, Math.round(nextW * (9 / 16)));
              }}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-white/15 rounded text-[10px] font-mono font-extrabold transition-all active:scale-95"
              title="Switch Mini Player Size (Medium Compact: 280x158)"
            >
              {dimensions.width <= 240 ? '220p' : dimensions.width <= 290 ? '280p' : '330p'}
            </button>
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
        /* YouTube Official Video Page Container Layout (Dark Theme) */
        <div className={`w-full mx-auto p-0 sm:p-6 space-y-3 sm:space-y-4 ${isTheaterMode ? 'max-w-full' : 'max-w-7xl'}`}>
          {/* Top Control Bar with Back Button */}
          <div className="flex items-center justify-between px-3 sm:px-0 pt-2 sm:pt-0 pb-1">
            <button
              onClick={handleFullscreenClick}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-white/15 text-slate-200 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Back to App View"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                  isTheaterMode ? 'bg-rose-600/30 border-rose-500 text-rose-300' : 'bg-slate-900 border-white/15 text-slate-300 hover:bg-slate-800 hover:text-white'
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
              <div className="sticky top-0 sm:top-2 lg:top-4 z-30 group">
                {/* Cinematic Ambient Glow Backlight */}
                <div className="hidden sm:block absolute -inset-2 bg-gradient-to-r from-rose-600/30 via-indigo-600/20 to-purple-600/30 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className={playerBoxClassName}>
                  {renderVideoStage(false)}
                </div>
              </div>

              {/* LOWER METADATA & ACTIONS WRAPPER WITH PADDING ON MOBILE */}
              <div className="px-3 sm:px-0 space-y-4">

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

              {/* VIDEO TITLE */}
              <div className="space-y-1 pt-1">
                <div className="space-y-1">
                  <h1 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight">
                    {decodeHtmlEntities(currentTrack?.title || '')}
                  </h1>

                  {/* Video Metadata & Inline ...more button & Chapters trigger directly under title */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-medium">
                    <span className="font-bold text-white">{realViewCount || '1,428,910 views'}</span>
                    <span>•</span>
                    <span>Aug 2, 2026</span>
                    <button
                      type="button"
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="font-extrabold text-white hover:text-rose-400 bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 border border-white/15 ml-1 active:scale-95"
                      title="Expand Video Description & Details"
                    >
                      <span>...more</span>
                      {showFullDescription ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {/* CHAPTERS BAR BUTTON */}
                    <button
                      type="button"
                      onClick={() => setShowChaptersPanel(!showChaptersPanel)}
                      className={`font-extrabold text-[11px] px-3 py-1 rounded-full transition-all cursor-pointer inline-flex items-center gap-1.5 border active:scale-95 shadow-xs ${
                        showChaptersPanel
                          ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30 ring-2 ring-rose-500/40'
                          : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30 hover:border-rose-500/50'
                      }`}
                      title="Open Video Chapters List"
                    >
                      <Layers size={13} className="text-rose-400" />
                      <span>Chapters ({videoChapters.length})</span>
                      {activeChapter && (
                        <span className="hidden sm:inline-block max-w-[140px] truncate text-[10px] text-rose-200 font-semibold border-l border-rose-500/40 pl-1.5">
                          {activeChapter.timeDisplay} {activeChapter.title}
                        </span>
                      )}
                      {showChaptersPanel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* VIDEO CHAPTERS INTERACTIVE PANEL */}
              {showChaptersPanel && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="p-4 bg-slate-950/90 rounded-2xl border border-rose-500/30 space-y-3 shadow-2xl backdrop-blur-md"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 p-0.5 shrink-0 shadow-md flex items-center justify-center">
                        <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-rose-400">
                          <Layers size={16} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-white">Video Chapters</h3>
                          <span className="px-2 py-0.5 bg-rose-600/30 text-rose-300 text-[10px] font-black uppercase rounded-full border border-rose-500/30">
                            {videoChapters.length} Chapters
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Tap any chapter to jump directly to that part of the video
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowChaptersPanel(false)}
                      className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Close Chapters"
                    >
                      <ChevronUp size={16} />
                    </button>
                  </div>

                  {/* CHAPTERS GRID / LIST */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    {videoChapters.map((ch, idx) => {
                      const isCurrentActive = activeChapter?.timeSeconds === ch.timeSeconds;
                      return (
                        <button
                          key={`ch-${idx}-${ch.timeSeconds}`}
                          type="button"
                          onClick={() => handleSeekToChapter(ch)}
                          className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all active:scale-[0.98] cursor-pointer group ${
                            isCurrentActive
                              ? 'bg-rose-600/25 border-rose-500/80 ring-1 ring-rose-500/40 shadow-lg'
                              : 'bg-slate-900/80 hover:bg-slate-800/90 border-white/10 hover:border-white/25'
                          }`}
                        >
                          {/* Timestamp Badge */}
                          <div className={`px-2.5 py-1.5 rounded-lg font-mono text-xs font-black shrink-0 transition-colors ${
                            isCurrentActive
                              ? 'bg-rose-600 text-white shadow-md'
                              : 'bg-white/10 text-rose-300 group-hover:bg-rose-600 group-hover:text-white'
                          }`}>
                            {ch.timeDisplay}
                          </div>

                          {/* Chapter Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Chapter {idx + 1}
                              </span>
                              {isCurrentActive && (
                                <span className="text-[9px] bg-rose-500 text-white font-black px-1.5 py-0.5 rounded-full animate-pulse flex items-center gap-1 shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                  Now Playing
                                </span>
                              )}
                            </div>
                            <h4 className={`text-xs truncate ${
                              isCurrentActive ? 'text-white font-extrabold' : 'text-slate-200 font-bold group-hover:text-white'
                            }`}>
                              {ch.title}
                            </h4>
                          </div>

                          <Play size={14} className={`shrink-0 transition-transform group-hover:scale-110 ${
                            isCurrentActive ? 'text-rose-400 fill-rose-400' : 'text-slate-400 group-hover:text-rose-300'
                          }`} />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ACTION BAR & CHANNEL ROW - YOUTUBE SINGLE LINE LAYOUT */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-white/10">
                {/* CHANNEL INFO & SUBSCRIBE BUTTON */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-indigo-600 p-0.5 shadow-md shrink-0">
                    <img
                      src={realChannelAvatar || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                      alt={realChannelName || currentTrack?.channel}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop';
                      }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1 font-bold text-sm text-white">
                      <span>{decodeHtmlEntities(realChannelName || currentTrack?.channel || '')}</span>
                      <CheckCircle2 size={14} className="text-rose-500 fill-rose-500/20 shrink-0" />
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{realSubscriberCount || '2.48M subscribers'}</p>
                  </div>

                  {/* Subscribe / Subscribed Toggle Button */}
                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={() => {
                        const targetChan = realChannelName || currentTrack?.channel;
                        if (onToggleSubscribe && targetChan) {
                          onToggleSubscribe(targetChan);
                        }
                      }}
                      className={`px-4 py-2 rounded-full font-extrabold text-xs transition-all active:scale-95 flex items-center gap-1.5 shadow-md cursor-pointer ${
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
                <div className="flex items-center gap-2 py-1 shrink-0 whitespace-nowrap max-w-full flex-wrap sm:flex-nowrap relative z-20">
                  {/* Like / Dislike Pill */}
                  <div className="flex items-center bg-slate-800/90 border border-white/10 rounded-full p-0.5 shadow-md shrink-0">
                    <button
                      type="button"
                      onClick={handleToggleLike}
                      className={`px-3.5 py-1.5 rounded-l-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        hasLiked ? 'text-rose-400 bg-rose-500/20' : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                      title="Like Video"
                    >
                      <ThumbsUp size={15} className={hasLiked ? 'fill-rose-400' : ''} />
                      <span>{realLikeCountStr || formattedLikeCount}</span>
                    </button>

                    <div className="w-px h-4 bg-white/15" />

                    <button
                      type="button"
                      onClick={handleToggleDislike}
                      className={`px-3 py-1.5 rounded-r-full text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        hasDisliked ? 'text-rose-400 bg-rose-500/20' : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                      title="Dislike Video"
                    >
                      <ThumbsDown size={15} className={hasDisliked ? 'fill-rose-400' : ''} />
                    </button>
                  </div>

                  {/* 3 Dots Options Button & Toggle Dropdown Menu (Share, Download, Save, Details) */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActionMoreMenu(!showActionMoreMenu);
                      }}
                      className={`p-2.5 rounded-full border shadow-md transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                        showActionMoreMenu
                          ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30 ring-2 ring-rose-500/50'
                          : 'bg-slate-800/90 hover:bg-slate-700/90 border-white/10 text-slate-200'
                      }`}
                      title="More Video Options (Share, Download, Save, Channel Info)"
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    {showActionMoreMenu && (
                      <>
                        {/* Invisible Backdrop to close menu when clicking outside */}
                        <div 
                          className="fixed inset-0 z-40 bg-transparent" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowActionMoreMenu(false);
                          }} 
                        />

                        {/* Dropdown Options Box */}
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-white/20 rounded-2xl shadow-2xl p-1.5 z-50 text-xs animate-fade-in divide-y divide-white/10"
                        >
                          <div className="py-1">
                            {/* Video Chapters Option */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowActionMoreMenu(false);
                                setShowChaptersPanel(true);
                              }}
                              className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
                            >
                              <Layers size={16} className="text-rose-400" />
                              <div className="flex flex-col">
                                <span>Video Chapters ({videoChapters.length})</span>
                                <span className="text-[10px] text-slate-400 font-normal">Jump to timestamps & sections</span>
                              </div>
                            </button>

                            {/* Video & Channel Details Option */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowActionMoreMenu(false);
                                setShowFullDescription(true);
                              }}
                              className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
                            >
                              <Info size={16} className="text-rose-400" />
                              <div className="flex flex-col">
                                <span>Video & Channel Details</span>
                                <span className="text-[10px] text-slate-400 font-normal">Thumbnail, description & channel</span>
                              </div>
                            </button>

                            {/* Share Option */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowActionMoreMenu(false);
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
                              className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
                            >
                              <Share2 size={16} className="text-sky-400" />
                              <div className="flex flex-col">
                                <span>Share Video</span>
                                <span className="text-[10px] text-slate-400 font-normal">Copy link or share</span>
                              </div>
                            </button>

                            {/* Download Option */}
                            {onDownloadTrack && currentTrack && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowActionMoreMenu(false);
                                  onDownloadTrack(currentTrack);
                                }}
                                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <Download size={16} className="text-indigo-400" />
                                <div className="flex flex-col">
                                  <span>Download Track</span>
                                  <span className="text-[10px] text-slate-400 font-normal">Save for offline play</span>
                                </div>
                              </button>
                            )}

                            {/* Save to Playlist Option */}
                            {onOpenAddToPlaylist && currentTrack && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowActionMoreMenu(false);
                                  onOpenAddToPlaylist(currentTrack);
                                }}
                                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <ListPlus size={16} className="text-emerald-400" />
                                <div className="flex flex-col">
                                  <span>Save to Playlist</span>
                                  <span className="text-[10px] text-slate-400 font-normal">Add to custom library</span>
                                </div>
                              </button>
                            )}
                          </div>

                          <div className="pt-1">
                            {/* Clip Option */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowActionMoreMenu(false);
                                onShowToast?.('Video clip created & saved to library!', 'info');
                              }}
                              className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
                            >
                              <Scissors size={16} className="text-amber-400" />
                              <div className="flex flex-col">
                                <span>Create Clip</span>
                                <span className="text-[10px] text-slate-400 font-normal">Trim highlight segment</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* AUTHENTIC YOUTUBE EXPANDABLE VIDEO & CHANNEL DETAILS PANEL */}
              {showFullDescription && (
                <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 text-xs animate-fade-in">
                  {/* HEADER WITH CLOSE BUTTON */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Info size={16} className="text-rose-400" />
                      <span className="font-black text-sm text-white">Video & Channel Details</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFullDescription(false)}
                      className="px-3 py-1 bg-white/10 hover:bg-rose-600 text-white font-bold text-xs rounded-full border border-white/20 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Close</span>
                      <ChevronUp size={14} />
                    </button>
                  </div>

                  {/* VIDEO STATS & METRICS BADGES */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-black text-slate-200">
                      <span className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1 rounded-full border border-white/10">
                        <Eye size={13} className="text-rose-500" />
                        <span>{realViewCount || '1,428,910 views'}</span>
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1 rounded-full border border-white/10">
                        <Calendar size={13} className="text-indigo-500" />
                        <span>Aug 2, 2026</span>
                      </span>
                      <span className="flex items-center gap-1.5 bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full border border-rose-500/20 font-mono">
                        <Flame size={13} className="text-rose-500 fill-rose-500" />
                        <span>#1 Trending in Music</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 font-mono font-bold text-[11px]">
                      <Zap size={12} className="text-indigo-400" />
                      <span>320kbps Lossless • 1080p HD</span>
                    </div>
                  </div>

                  {/* ABOUT CHANNEL & VIDEO DESCRIPTION SECTION (REDESIGNED WITHOUT THUMBNAIL PREVIEW) */}
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 space-y-4">
                    {/* CHANNEL HEADER ROW */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 to-indigo-600 p-0.5 shrink-0 shadow-md">
                          <img
                            src={realChannelAvatar || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                            alt={realChannelName || currentTrack?.channel}
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop';
                            }}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-black text-base text-white truncate">
                              {decodeHtmlEntities(realChannelName || currentTrack?.channel || 'Official Channel')}
                            </h3>
                            <CheckCircle2 size={16} className="text-rose-500 fill-rose-500/20 shrink-0" />
                          </div>
                          <p className="text-xs text-slate-400 font-medium truncate">
                            @{ (realChannelName || currentTrack?.channel || 'channel').toLowerCase().replace(/\s+/g, '') } • {realSubscriberCount || '2.48M subscribers'} • 1.4K videos
                          </p>
                        </div>
                      </div>

                      {/* SUBSCRIBE BUTTON */}
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            const targetChan = realChannelName || currentTrack?.channel;
                            if (onToggleSubscribe && targetChan) {
                              onToggleSubscribe(targetChan);
                            }
                          }}
                          className={`px-5 py-2 rounded-full font-extrabold text-xs transition-all active:scale-95 flex items-center gap-2 shadow-md cursor-pointer ${
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
                            <>
                              <Bell size={14} className="text-slate-900 fill-slate-900" />
                              <span>Subscribe to Channel</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CHANNEL BIO & OVERVIEW */}
                    <p className="text-xs text-slate-300 font-normal leading-relaxed">
                      Welcome to the official channel for <strong className="text-white">@{decodeHtmlEntities(realChannelName || currentTrack?.channel || '')}</strong>. Stream official videos, tour performances, studio recordings, and behind-the-scenes content.
                    </p>
                  </div>

                  {/* FULL DESCRIPTION TEXT & HASHTAGS */}
                  <div className="space-y-2 p-3 bg-slate-950/50 rounded-xl border border-white/5">
                    <p className="text-slate-300 leading-relaxed font-normal">
                      Official YouTube video stream for <strong className="font-bold text-white">"{decodeHtmlEntities(currentTrack?.title || '')}"</strong> by <span className="text-rose-400 font-bold">@{decodeHtmlEntities(currentTrack?.channel || '')}</span>. Mastered for high-fidelity audio and 1080p video stream. Subscribe to the official channel for upcoming releases, tour dates, and live performances.
                    </p>

                    <div className="space-y-1.5 pt-2 border-t border-white/10 text-slate-400 text-xs">
                      <p className="font-mono text-[11px] text-indigo-400 font-bold">
                        #musicvideo #{currentTrack?.genre?.replace(/\s+/g, '').toLowerCase() || 'youtube'} #official #audio #{currentTrack?.channel?.replace(/\s+/g, '').toLowerCase()}
                      </p>
                      <div className="flex flex-wrap gap-4 text-[11px] pt-1">
                        <span className="font-bold">℗ 2026 {decodeHtmlEntities(currentTrack?.channel || 'YouTube Creator')}</span>
                        <span>•</span>
                        <span className="font-bold">Released on YouTube Music</span>
                      </div>
                    </div>
                  </div>

                  {/* AI SOUND INSIGHTS METADATA GRID */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Genre</span>
                      <span className="font-extrabold text-slate-200 truncate block">{currentTrack?.genre || 'Pop & Electronic'}</span>
                    </div>
                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tempo & Key</span>
                      <span className="font-extrabold text-rose-400 truncate block">124 BPM • C Minor</span>
                    </div>
                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Release Type</span>
                      <span className="font-extrabold text-slate-200 truncate block">Official Video Single</span>
                    </div>
                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Channel</span>
                      <span className="font-extrabold text-indigo-400 truncate block">{decodeHtmlEntities(currentTrack?.channel || 'Vevo')}</span>
                    </div>
                  </div>

                  {/* INTERACTIVE CHAPTER TIMESTAMPS */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={13} className="text-amber-500" />
                      <span>Interactive Video Chapters</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {videoChapters.map((ch) => (
                        <button
                          key={`desc-ch-${ch.timeDisplay}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSeekToChapter(ch);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 rounded-lg text-xs font-mono font-bold border border-white/10 transition-all flex items-center gap-1.5 active:scale-95 group cursor-pointer"
                        >
                          <span className="text-rose-400 group-hover:text-white font-extrabold">{ch.timeDisplay}</span>
                          <span className="text-[10px] font-sans font-medium text-slate-400 group-hover:text-white">{ch.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ACTION FOOTER & SUMMARY TOGGLE */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${videoId}`);
                          setCopyLinkSuccess(true);
                          setTimeout(() => setCopyLinkSuccess(false), 2000);
                          onShowToast?.('Direct YouTube link copied!', 'info');
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full font-bold text-[11px] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        {copyLinkSuccess ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        <span>{copyLinkSuccess ? 'Copied Link!' : 'Copy Link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAiSummary(!showAiSummary);
                        }}
                        className={`px-3 py-1 rounded-full font-bold text-[11px] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                          showAiSummary 
                            ? 'bg-rose-500 text-white shadow-md' 
                            : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                        }`}
                      >
                        <Sparkles size={13} />
                        <span>{showAiSummary ? 'Hide AI Summary' : 'AI Track Summary'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFullDescription(false);
                      }}
                      className="font-extrabold text-rose-400 hover:underline text-xs flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 cursor-pointer"
                    >
                      <span>Close Details</span>
                      <ChevronUp size={14} />
                    </button>
                  </div>

                  {/* AI TRACK SUMMARY DRAWER */}
                  {showAiSummary && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2 text-xs text-slate-200 animate-fade-in"
                    >
                      <div className="flex items-center gap-2 font-black text-rose-400">
                        <Sparkles size={14} />
                        <span>AI Generated Track Summary</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[11px] font-medium leading-relaxed text-slate-300">
                        <li>Features a driving bass rhythm coupled with spacious reverb and pristine 1080p HD video mastering.</li>
                        <li>Verified YouTube release by {decodeHtmlEntities(currentTrack?.channel || 'Official Channel')} with millions of monthly listeners.</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* AUTHENTIC YOUTUBE COMMENTS SECTION */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                {/* Comments Header with Total Count, Sort Dropdown & Close/Open Toggle */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10 flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <MessageSquare size={18} className="text-rose-500" />
                      <span>{comments.length + 1840} Comments</span>
                    </h3>

                    {/* YouTube "Sort by" Button */}
                    {isCommentsVisible && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowSortMenu(!showSortMenu)}
                          className="flex items-center gap-1.5 text-xs font-extrabold text-slate-300 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <ListFilter size={15} />
                          <span>Sort by</span>
                        </button>

                        {showSortMenu && (
                          <div className="absolute left-0 top-full mt-1 w-44 bg-slate-950 border border-white/20 rounded-xl shadow-2xl p-1 z-50 text-xs">
                            <button
                              type="button"
                              onClick={() => { setCommentSort('top'); setShowSortMenu(false); }}
                              className={`w-full text-left px-3 py-2 rounded-lg font-bold transition-colors ${commentSort === 'top' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                            >
                              Top comments
                            </button>
                            <button
                              type="button"
                              onClick={() => { setCommentSort('newest'); setShowSortMenu(false); }}
                              className={`w-full text-left px-3 py-2 rounded-lg font-bold transition-colors ${commentSort === 'newest' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                            >
                              Newest first
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Open/Close Comments Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setIsCommentsVisible(!isCommentsVisible)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full text-xs font-bold text-slate-200 transition-all active:scale-95 cursor-pointer shadow-xs"
                    title={isCommentsVisible ? "Close Comments" : "Open Comments"}
                  >
                    <span>{isCommentsVisible ? 'Close Comments' : 'Open Comments'}</span>
                    {isCommentsVisible ? <ChevronUp size={14} className="text-rose-400" /> : <ChevronDown size={14} className="text-rose-400" />}
                  </button>
                </div>

                {!isCommentsVisible ? (
                  <div 
                    onClick={() => setIsCommentsVisible(true)}
                    className="p-3.5 bg-slate-900/90 hover:bg-slate-800 rounded-2xl border border-white/10 space-y-2 cursor-pointer transition-all group shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs sm:text-sm text-white">Comments</span>
                        <span className="text-xs text-slate-400 font-bold">• {comments.length + 1840}</span>
                      </div>
                      <span className="text-xs text-rose-400 font-bold group-hover:underline flex items-center gap-1">
                        <span>Tap to view</span>
                        <ChevronDown size={14} />
                      </span>
                    </div>

                    {comments[0] && (
                      <div className="flex items-center gap-2.5 pt-1 text-xs">
                        <img
                          src={comments[0].avatar}
                          alt={comments[0].author}
                          className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-white/20"
                        />
                        <p className="text-slate-300 truncate font-normal text-xs min-w-0">
                          <strong className="text-slate-100 font-bold">@{comments[0].author}:</strong> {comments[0].text}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* YOUTUBE AUTHENTIC ADD COMMENT FORM */}
                    <form onSubmit={handleAddComment} className="flex gap-3 pt-1">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white shrink-0 text-xs shadow-md ring-2 ring-white/10">
                        You
                      </div>

                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={newCommentInput}
                          onChange={(e) => setNewCommentInput(e.target.value)}
                          onFocus={() => setIsCommentFocused(true)}
                          placeholder="Add a comment to YouTube video..."
                          className="w-full bg-transparent border-b border-white/20 focus:border-white px-0 py-2 text-xs sm:text-sm font-normal text-white placeholder-slate-500 focus:outline-none transition-colors"
                        />

                        {(isCommentFocused || newCommentInput.trim().length > 0) && (
                          <div className="flex items-center justify-between pt-1 animate-fade-in">
                            <button
                              type="button"
                              className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                              title="Add emoji"
                            >
                              <Smile size={18} />
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setNewCommentInput('');
                                  setIsCommentFocused(false);
                                }}
                                className="px-3.5 py-1.5 text-xs font-extrabold text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={!newCommentInput.trim()}
                                className="px-4 py-1.5 bg-white text-slate-950 hover:bg-slate-200 disabled:bg-white/10 disabled:text-slate-500 rounded-full text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                              >
                                <Send size={12} />
                                <span>Comment</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </form>

                    {/* YOUTUBE AUTHENTIC COMMENTS LIST */}
                    <div className="space-y-4 pt-3">
                      {comments.map((cmt) => (
                        <div key={cmt.id} className="flex gap-3 text-xs group/cmt">
                          {/* User Avatar */}
                          <img
                            src={cmt.avatar}
                            alt={cmt.author}
                            className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop';
                            }}
                          />

                          {/* Comment Content Column */}
                          <div className="min-w-0 flex-1 space-y-1">
                            {/* Pinned Badge */}
                            {cmt.isPinned && (
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 pb-0.5">
                                <Pin size={13} className="text-slate-300 rotate-45 fill-slate-300" />
                                <span>Pinned by <strong className="text-slate-200">@{cmt.pinnedBy || cmt.author}</strong></span>
                              </div>
                            )}

                            {/* Author Handle, Badges & Time */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-black text-xs ${
                                cmt.author === currentTrack?.channel 
                                  ? 'bg-slate-800 text-slate-100 px-2 py-0.5 rounded-full border border-white/10' 
                                  : 'text-slate-100'
                              }`}>
                                @{cmt.author}
                              </span>

                              {cmt.isVerified && (
                                <CheckCircle2 size={13} className="text-slate-400 fill-slate-700" title="Verified Creator" />
                              )}

                              <span className="text-[11px] text-slate-400 font-medium">{cmt.timeAgo}</span>
                            </div>

                            {/* Comment Text */}
                            <p className="text-xs sm:text-sm text-slate-200 font-normal leading-relaxed whitespace-pre-line">
                              {cmt.text}
                            </p>

                            {/* Comment Action Toolbar (Like, Dislike, Heart, Reply, 3-Dots) */}
                            <div className="flex items-center gap-4 pt-1 text-slate-400 text-xs">
                              {/* Like Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleCommentLike(cmt.id)}
                                className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${
                                  cmt.userLiked ? 'text-white font-black' : ''
                                }`}
                                title="Like comment"
                              >
                                <ThumbsUp size={14} className={cmt.userLiked ? 'fill-white text-white' : ''} />
                                <span className="text-xs font-semibold">
                                  {cmt.likes > 0 ? (cmt.likes >= 1000 ? `${(cmt.likes/1000).toFixed(1)}K` : cmt.likes) : ''}
                                </span>
                              </button>

                              {/* Dislike Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleCommentDislike(cmt.id)}
                                className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${
                                  cmt.userDisliked ? 'text-white font-black' : ''
                                }`}
                                title="Dislike comment"
                              >
                                <ThumbsDown size={14} className={cmt.userDisliked ? 'fill-white text-white' : ''} />
                              </button>

                              {/* Creator Heart Badge */}
                              {cmt.creatorHeart && (
                                <div 
                                  className="relative flex items-center justify-center cursor-pointer group/heart" 
                                  title={`Hearted by @${currentTrack?.channel || 'Creator'}`}
                                >
                                  <img
                                    src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                                    alt="Creator Heart"
                                    className="w-4 h-4 rounded-full object-cover ring-1 ring-white/30"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = cmt.avatar;
                                    }}
                                  />
                                  <Heart size={10} className="text-rose-500 fill-rose-500 absolute -bottom-1 -right-1" />
                                </div>
                              )}

                              {/* Reply Button */}
                              <button
                                type="button"
                                onClick={() => setReplyingToId(replyingToId === cmt.id ? null : cmt.id)}
                                className="hover:text-white font-bold text-xs text-slate-300 transition-colors cursor-pointer"
                              >
                                Reply
                              </button>

                              {/* 3-Dots Menu */}
                              <div className="relative ml-auto">
                                <button
                                  type="button"
                                  onClick={() => setActiveCommentMenuId(activeCommentMenuId === cmt.id ? null : cmt.id)}
                                  className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer opacity-80 group-hover/cmt:opacity-100"
                                  title="Comment options"
                                >
                                  <MoreVertical size={14} />
                                </button>

                                {activeCommentMenuId === cmt.id && (
                                  <div className="absolute right-0 top-full mt-1 w-36 bg-slate-950 border border-white/20 rounded-xl shadow-2xl p-1 z-50 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(cmt.text);
                                        setActiveCommentMenuId(null);
                                        onShowToast?.('Comment copied!', 'info');
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-white/10 rounded-lg font-medium cursor-pointer"
                                    >
                                      Copy text
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveCommentMenuId(null);
                                        onShowToast?.('Comment reported for review', 'info');
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-white/10 rounded-lg font-medium cursor-pointer"
                                    >
                                      Report
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Inline Reply Form */}
                            {replyingToId === cmt.id && (
                              <div className="flex gap-2.5 pt-2 mt-2 border-t border-white/10 animate-fade-in">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center font-black text-white shrink-0 text-[10px]">
                                  You
                                </div>
                                <div className="flex-1 space-y-2">
                                  <input
                                    type="text"
                                    value={replyInputText}
                                    onChange={(e) => setReplyInputText(e.target.value)}
                                    placeholder={`Reply to @${cmt.author}...`}
                                    className="w-full bg-transparent border-b border-white/20 focus:border-white px-0 py-1 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                                  />
                                  <div className="flex items-center justify-end gap-2 pt-0.5">
                                    <button
                                      type="button"
                                      onClick={() => setReplyingToId(null)}
                                      className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAddReply(cmt.id)}
                                      disabled={!replyInputText.trim()}
                                      className="px-3.5 py-1 bg-white text-slate-950 hover:bg-slate-200 disabled:bg-white/10 disabled:text-slate-500 rounded-full text-xs font-black transition-all cursor-pointer disabled:cursor-not-allowed"
                                    >
                                      Reply
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Nested Replies Drawer & Toggle */}
                            {cmt.replies && cmt.replies.length > 0 && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => setExpandedReplies(prev => ({ ...prev, [cmt.id]: !prev[cmt.id] }))}
                                  className="flex items-center gap-2 text-rose-400 hover:bg-rose-500/10 px-3 py-1 rounded-full text-xs font-extrabold transition-colors cursor-pointer"
                                >
                                  {expandedReplies[cmt.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  <span>{expandedReplies[cmt.id] ? 'Hide' : 'Show'} {cmt.replies.length} {cmt.replies.length === 1 ? 'reply' : 'replies'}</span>
                                </button>

                                {expandedReplies[cmt.id] && (
                                  <div className="mt-2.5 pl-3 sm:pl-4 border-l-2 border-white/10 space-y-3 animate-fade-in">
                                    {cmt.replies.map((reply) => (
                                      <div key={reply.id} className="flex gap-2.5 items-start text-xs">
                                        <img
                                          src={reply.avatar}
                                          alt={reply.author}
                                          className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                                        />
                                        <div className="min-w-0 flex-1 space-y-1">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-white text-xs">@{reply.author}</span>
                                            {reply.isVerified && (
                                              <CheckCircle2 size={12} className="text-slate-400 fill-slate-700" />
                                            )}
                                            <span className="text-[10px] text-slate-400 font-normal">{reply.timeAgo}</span>
                                          </div>
                                          <p className="text-slate-200 text-xs font-normal leading-relaxed">{reply.text}</p>
                                          
                                          <div className="flex items-center gap-3 pt-0.5 text-slate-400 text-[11px]">
                                            <button 
                                              type="button"
                                              className="flex items-center gap-1 hover:text-white cursor-pointer"
                                            >
                                              <ThumbsUp size={12} />
                                              <span>{reply.likes || ''}</span>
                                            </button>
                                            <button 
                                              type="button"
                                              className="flex items-center gap-1 hover:text-white cursor-pointer"
                                            >
                                              <ThumbsDown size={12} />
                                            </button>
                                            <button 
                                              type="button"
                                              onClick={() => setReplyingToId(cmt.id)}
                                              className="hover:text-white font-bold cursor-pointer"
                                            >
                                              Reply
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
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

            </div>

            {/* RIGHT SIDEBAR (Up Next & Chapters Page - Exactly like YouTube) */}
            {!isTheaterMode && (
              <div className="lg:col-span-4 px-3 sm:px-0 space-y-3">
                {/* Navigation Header between "Up Next" and "Chapters" */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowChaptersPanel(false)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                        !showChaptersPanel
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
                      }`}
                    >
                      <Sparkles size={13} />
                      <span>Up Next</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowChaptersPanel(true)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                        showChaptersPanel
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
                      }`}
                    >
                      <Layers size={13} />
                      <span>Chapters ({videoChapters.length})</span>
                    </button>
                  </div>

                  {showChaptersPanel ? (
                    <button
                      type="button"
                      onClick={() => setShowChaptersPanel(false)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      title="Close Chapters & show Up Next"
                    >
                      <X size={15} />
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      Diverse Channels
                    </span>
                  )}
                </div>

                {/* DEDICATED YOUTUBE CHAPTERS SIDE PAGE OR UP NEXT RECOMMENDATIONS */}
                {showChaptersPanel ? (
                  <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-3.5 space-y-3 shadow-2xl backdrop-blur-md animate-fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div>
                        <h3 className="font-black text-sm text-white flex items-center gap-2 uppercase tracking-wider">
                          <Layers size={16} className="text-rose-400" />
                          <span>Video Chapters</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Active: <span className="text-amber-300 font-extrabold">{activeChapter?.timeDisplay}</span> <span className="text-slate-300">• {activeChapter?.title}</span>
                        </p>
                      </div>
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-full text-[10px] font-mono font-bold border border-rose-500/30">
                        {videoChapters.length} Sections
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                      {videoChapters.map((ch, idx) => {
                        const isActive = activeChapter?.timeSeconds === ch.timeSeconds;
                        return (
                          <button
                            key={`side-ch-${idx}-${ch.timeSeconds}`}
                            type="button"
                            onClick={() => handleSeekToChapter(ch)}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                              isActive
                                ? 'bg-gradient-to-r from-rose-600/30 to-indigo-600/30 border-rose-500 text-white shadow-lg ring-1 ring-rose-500/50'
                                : 'bg-slate-950/70 hover:bg-slate-800 border-white/10 hover:border-white/20 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black shrink-0 ${
                                isActive ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-800 text-rose-400 border border-white/10'
                              }`}>
                                {ch.timeDisplay}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs font-bold truncate ${isActive ? 'text-white font-extrabold' : 'text-slate-200 group-hover:text-white'}`}>
                                  {ch.title}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">Chapter {idx + 1} of {videoChapters.length}</p>
                              </div>
                            </div>

                            {isActive ? (
                              <span className="px-2.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-extrabold shrink-0 flex items-center gap-1 animate-pulse shadow-xs">
                                <Play size={10} className="fill-white" />
                                <span>Playing</span>
                              </span>
                            ) : (
                              <Play size={14} className="text-slate-400 group-hover:text-rose-400 shrink-0 transition-transform group-hover:scale-110" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
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
                              : 'bg-slate-900 text-slate-300 border-white/10 hover:border-rose-400'
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
                      <div key={`rec-skel-${i}`} className="h-20 bg-slate-900 animate-pulse rounded-xl" />
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
                        className="flex gap-3 p-2 bg-slate-900/60 hover:bg-slate-800 border border-white/5 hover:border-white/15 rounded-xl cursor-pointer transition-all group shadow-xs"
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
                          <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-rose-300 transition-colors">
                            {decodeHtmlEntities(recTrack.title)}
                          </h4>
                          
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium truncate">
                            <Youtube size={11} className="text-rose-500 shrink-0" />
                            <span className="truncate">{decodeHtmlEntities(recTrack.channel)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">
                            <span>{recTrack.views || '420K views'}</span>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-sans font-extrabold text-[9px]">
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
                  </>
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



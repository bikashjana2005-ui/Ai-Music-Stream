import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  X, 
  Download, 
  Sparkles, 
  Radio, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward, 
  Heart,
  Share2,
  Disc,
  Video,
  ChevronDown,
  Music,
  ListPlus,
  Settings2,
  Globe,
  ExternalLink,
  Zap,
  Info
} from 'lucide-react';
import { Track } from '../types';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';
import { PlayerEngine } from './GlobalYouTubePlayer';

interface AudioPlayerOverlayProps {
  track: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  onDownload: (track: Track) => void;
  onPlayTrack?: (track: Track) => void;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onOpenMetadata?: (track: Track) => void;
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  showVideo: boolean;
  setShowVideo: (v: boolean) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  audioQuality?: string;
  playbackTime?: number;
  realDuration?: number;
  onSeek?: (seconds: number) => void;
  playerEngine?: PlayerEngine;
  onChangePlayerEngine?: (engine: PlayerEngine) => void;
  isDataSaverMode?: boolean;
  onToggleDataSaverMode?: (enabled: boolean) => void;
  onToggleFullScreen?: () => void;
}

export const AudioPlayerOverlay: React.FC<AudioPlayerOverlayProps> = ({
  track,
  isPlaying,
  onTogglePlay,
  onClose,
  onDownload,
  onPlayTrack,
  onNextTrack,
  onPrevTrack,
  isFavorite = false,
  onToggleFavorite,
  onOpenAddToPlaylist,
  onOpenMetadata,
  volume,
  setVolume,
  isMuted,
  setIsMuted,
  showVideo,
  setShowVideo,
  onShowToast,
  audioQuality = '320',
  playbackTime = 0,
  realDuration = 0,
  onSeek,
  playerEngine = 'youtube',
  onChangePlayerEngine,
  isDataSaverMode = false,
  onToggleDataSaverMode,
  onToggleFullScreen
}) => {
  const [internalTime, setInternalTime] = useState(0);
  const currentTime = playbackTime || internalTime;
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [imgStage, setImgStage] = useState<number>(0);
  const [showEngineDropdown, setShowEngineDropdown] = useState(false);

  // YouTube Related Video Recommendations state
  const [relatedRecommendations, setRelatedRecommendations] = useState<Track[]>([]);
  const [loadingRelated, setLoadingRelated] = useState<boolean>(false);

  useEffect(() => {
    setImgStage(0);
  }, [track?.id]);

  // Drag downward gesture state to hide player
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);

  const handlePointerDown = (clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
  };

  const handlePointerMove = (clientY: number) => {
    if (!isDragging) return;
    const deltaY = clientY - startYRef.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handlePointerEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > 100) {
      onClose();
    } else {
      setDragY(0);
    }
  };

  // Parse YouTube video ID safely
  const videoId = extractYouTubeId(track?.id || "");

  const getThumb = () => {
    if (!videoId || videoId.length !== 11) {
      return `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop`;
    }
    if (imgStage === 0) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    if (imgStage === 1) return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
    if (imgStage === 2) return `https://i.ytimg.com/vi/${videoId}/0.jpg`;
    return `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop`;
  };

  const title = decodeHtmlEntities(track?.title || "");
  const channel = decodeHtmlEntities(track?.channel || "");
  const thumbnailUrl = getThumb();

  // Fetch AI Story/Insights for current audio track
  useEffect(() => {
    if (!track) return;
    
    let isSubscribed = true;
    const getTrackAnalysis = async () => {
      setLoadingAnalysis(true);
      setAiAnalysis("");
      try {
        const res = await fetch("/api/music/story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: track.title, channel: track.channel })
        });
        const data = await res.json();
        if (isSubscribed) {
          setAiAnalysis(data.story || `Playing original YouTube audio stream for "${track.title}".`);
        }
      } catch (e) {
        if (isSubscribed) {
          setAiAnalysis(`"${track.title}" by ${track.channel} is an iconic audio stream.`);
        }
      } finally {
        if (isSubscribed) setLoadingAnalysis(false);
      }
    };

    getTrackAnalysis();
    return () => { isSubscribed = false; };
  }, [track?.id, track?.title, track?.channel]);

  // Fetch YouTube Related Video Recommendations
  useEffect(() => {
    if (!track) return;
    let isMounted = true;

    const fetchRelated = async () => {
      setLoadingRelated(true);
      try {
        const res = await fetch("/api/music/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            trackTitle: track.title, 
            channel: track.channel 
          })
        });
        const data = await res.json();
        if (isMounted && data.tracks) {
          // Filter out current playing track
          const filtered = data.tracks.filter((t: Track) => t.id !== track.id);
          setRelatedRecommendations(filtered.slice(0, 8));
        }
      } catch (e) {
        console.error("Error fetching related recommendations:", e);
      } finally {
        if (isMounted) setLoadingRelated(false);
      }
    };

    fetchRelated();
    return () => { isMounted = false; };
  }, [track?.id]);

  // Reset internal time on track change
  useEffect(() => {
    setInternalTime(0);
  }, [track?.id]);

  const parseDurationSeconds = (durationStr?: string): number => {
    if (!durationStr) return 220;
    const parts = durationStr.split(':').map(p => parseInt(p, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 220;
  };

  const totalDurationSec = realDuration || parseDurationSeconds(track?.duration);
  const progressPercent = Math.min((currentTime / totalDurationSec) * 100, 100);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = Math.floor(percent * totalDurationSec);
    setInternalTime(newTime);
    if (onSeek) {
      onSeek(newTime);
    }
  };

  // Track progress counter fallback if not synced via props
  useEffect(() => {
    if (playbackTime > 0) return; // Skip interval if live playbackTime is supplied from YouTube player
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setInternalTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleShare = () => {
    if (navigator.share && track) {
      navigator.share({
        title: track.title,
        text: `Listen to "${track.title}" with original YouTube sound on Aura AI!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      onShowToast("Track link copied to clipboard!", "info");
    }
  };

  if (!track) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] flex flex-col bg-slate-950/80 backdrop-blur-3xl backdrop-saturate-200 text-white animate-fade-in overflow-y-auto select-none"
      style={{
        transform: `translateY(${dragY}px)`,
        transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onPointerMove={(e) => handlePointerMove(e.clientY)}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onTouchMove={(e) => handlePointerMove(e.touches[0].clientY)}
      onTouchEnd={handlePointerEnd}
    >
      
      {/* Background Glow Effect */}
      <div 
        className="absolute inset-0 opacity-25 bg-cover bg-center blur-3xl scale-125 pointer-events-none transition-all duration-1000"
        style={{ backgroundImage: `url(${thumbnailUrl})` }}
      />

      {/* Top Pull Handle Bar for Slide Downward gesture */}
      <div 
        onPointerDown={(e) => handlePointerDown(e.clientY)}
        onTouchStart={(e) => handlePointerDown(e.touches[0].clientY)}
        className="relative z-20 pt-3 pb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/5 transition-colors touch-none"
        title="Slide downward to hide player"
      >
        <div className="w-16 h-1.5 bg-gray-500/70 hover:bg-gray-300 rounded-full transition-colors shadow-sm" />
        <button 
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white transition-colors mt-0.5 flex items-center gap-1 text-[11px] font-bold"
        >
          <ChevronDown size={18} />
          <span>Slide down to hide</span>
        </button>
      </div>

      {/* Header Bar */}
      <div className="relative z-10 flex justify-between items-center px-5 py-2 sm:px-6">
        <button 
          onClick={onClose} 
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all active:scale-90"
          title="Minimize Player"
        >
          <ChevronDown size={20}/>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-bold text-indigo-300">
            <Radio size={14} className="animate-pulse text-indigo-400" />
            <span className="hidden xs:inline">YOUTUBE SOUND</span>
            <span className="bg-indigo-600/60 text-white px-2 py-0.5 rounded-full text-[10px] uppercase font-mono">
              {audioQuality === 'auto' ? 'Auto HQ' : `${audioQuality} kbps`}
            </span>
          </div>

          {onToggleDataSaverMode && (
            <button
              onClick={() => onToggleDataSaverMode(!isDataSaverMode)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 border shadow-xs ${
                isDataSaverMode
                  ? 'bg-amber-500/30 text-amber-200 border-amber-400/50 ring-2 ring-amber-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-gray-300 border-white/15'
              }`}
              title={isDataSaverMode ? "Data Saver Active" : "Enable Data Saver"}
            >
              <Zap size={13} className={isDataSaverMode ? 'fill-amber-400 text-amber-400 animate-pulse' : ''} />
              <span>{isDataSaverMode ? 'Saver ON' : 'Data Saver'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Player Engine Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowEngineDropdown(!showEngineDropdown)}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all active:scale-90 text-indigo-300 flex items-center justify-center"
              title="Player Engine Options"
            >
              <Settings2 size={20} />
            </button>

            {showEngineDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-white/20 rounded-2xl shadow-2xl p-2 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 border-b border-white/10 mb-1 flex items-center justify-between">
                  <span>Player Engine</span>
                  <Globe size={12} />
                </div>
                <button
                  onClick={() => { onChangePlayerEngine?.('youtube'); setShowEngineDropdown(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-medium ${playerEngine === 'youtube' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-300 hover:bg-white/10'}`}
                >
                  <span>YouTube Standard</span>
                </button>
                <button
                  onClick={() => { onChangePlayerEngine?.('youtube-nocookie'); setShowEngineDropdown(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-medium ${playerEngine === 'youtube-nocookie' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-300 hover:bg-white/10'}`}
                >
                  <span>YouTube NoCookie</span>
                </button>
                <button
                  onClick={() => { onChangePlayerEngine?.('invidious'); setShowEngineDropdown(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-medium ${playerEngine === 'invidious' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-300 hover:bg-white/10'}`}
                >
                  <span>Invidious (3rd Party)</span>
                </button>
                <button
                  onClick={() => { onChangePlayerEngine?.('piped'); setShowEngineDropdown(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-medium ${playerEngine === 'piped' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-300 hover:bg-white/10'}`}
                >
                  <span>Piped (3rd Party)</span>
                </button>
                <button
                  onClick={() => { onChangePlayerEngine?.('embed'); setShowEngineDropdown(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-medium ${playerEngine === 'embed' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-300 hover:bg-white/10'}`}
                >
                  <span>Direct IFrame</span>
                </button>

                {videoId && (
                  <div className="border-t border-white/10 mt-1 pt-1">
                    <a
                      href={`https://yewtu.be/watch?v=${videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-left px-3 py-1.5 rounded-xl text-[11px] text-gray-400 hover:text-white hover:bg-white/5 flex items-center gap-1.5 font-medium"
                    >
                      <ExternalLink size={12} /> Open in Invidious Web
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {onOpenAddToPlaylist && (
            <button
              onClick={() => onOpenAddToPlaylist(track)}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all active:scale-90 text-white"
              title="Add to Playlist"
            >
              <ListPlus size={20} />
            </button>
          )}

          <button
            onClick={() => setShowVideo(!showVideo)}
            className={`p-2.5 rounded-full backdrop-blur-md transition-all active:scale-90 ${
              showVideo ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
            title="Toggle YouTube Video Frame"
          >
            <Video size={20} />
          </button>

          {showVideo && onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="p-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 rounded-full text-white shadow-lg shadow-rose-600/30 transition-all active:scale-90 flex items-center justify-center border border-rose-400/40"
              title="Launch Full Video Player Mode"
            >
              <Zap size={20} className="fill-yellow-300 text-yellow-300 animate-pulse" />
            </button>
          )}

          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(track)}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all active:scale-90"
              title={isFavorite ? "Remove from Liked videos" : "Like video"}
            >
              <Heart size={20} className={isFavorite ? "fill-rose-500 text-rose-500" : "text-white"} />
            </button>
          )}

          <button 
            onClick={() => onDownload(track)} 
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-90"
            title="Download Track"
          >
            <Download size={20}/>
          </button>
        </div>
      </div>

      {/* Center Audio Player Card / Video View */}
      <div className={`relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 mx-auto w-full pb-8 ${showVideo ? 'max-w-2xl' : 'max-w-md'}`}>
        
        {showVideo && videoId && videoId.length === 11 ? (
          /* Slot for Global Persistent YouTube Video Player */
          <div className="relative w-full aspect-video my-3 sm:my-5 rounded-3xl overflow-hidden pointer-events-none opacity-0" />
        ) : (
          /* Album Cover Art Display */
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-4 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/15 group flex items-center justify-center bg-gray-900">
            {imgStage > 3 ? (
              <div className="w-full h-full bg-gradient-to-br from-indigo-700 to-purple-800 flex items-center justify-center text-white">
                <Music size={48} />
              </div>
            ) : (
              <img 
                src={thumbnailUrl} 
                alt={title} 
                onError={() => setImgStage(prev => prev + 1)}
                className={`w-full h-full object-cover transition-all duration-700 ${isPlaying ? 'scale-105' : 'scale-100 opacity-80'}`} 
              />
            )}
            
            {/* Animated Vinyl Disc Effect behind */}
            <div className="absolute top-2 right-2 text-white/40">
              <Disc size={28} className={`transition-transform duration-1000 ${isPlaying ? 'animate-spin-slow' : ''}`} />
            </div>

            {/* Equalizer Wave Overlay */}
            {isPlaying && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-end gap-1.5 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <div className="w-1 bg-indigo-400 h-4 animate-[bounce_0.8s_infinite]"></div>
                <div className="w-1 bg-indigo-400 h-7 animate-[bounce_1.1s_infinite]"></div>
                <div className="w-1 bg-indigo-400 h-3 animate-[bounce_0.6s_infinite]"></div>
                <div className="w-1 bg-indigo-400 h-6 animate-[bounce_0.9s_infinite]"></div>
                <div className="w-1 bg-indigo-400 h-4 animate-[bounce_0.7s_infinite]"></div>
              </div>
            )}
          </div>
        )}

        {/* Track Title & Artist */}
        <div className="text-center mt-3 w-full flex flex-col items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white truncate px-2">{title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-400 font-medium truncate">{channel}</p>
            {onOpenMetadata && track && (
              <button
                onClick={() => onOpenMetadata(track)}
                className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                title="View Real-Time YouTube Video Metadata"
              >
                <Info size={12} />
                <span>YouTube Metadata</span>
              </button>
            )}
          </div>
          {track.aiMoodTags && (
            <span className="inline-block mt-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-xs font-semibold tracking-wide">
              {track.aiMoodTags}
            </span>
          )}
        </div>

        {/* Audio Progress Bar */}
        <div className="w-full mt-6 space-y-1.5">
          <div 
            onClick={handleSeek}
            className="w-full bg-white/15 hover:bg-white/20 rounded-full h-2.5 overflow-hidden cursor-pointer transition-colors relative"
            title="Click to seek"
          >
            <div 
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{track.duration || '3:30'}</span>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-between w-full mt-6 px-2">
          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={22} className="text-rose-400" /> : <Volume2 size={22} />}
          </button>

          <div className="flex items-center gap-6">
            <button 
              onClick={onPrevTrack}
              className="text-gray-400 hover:text-white transition-colors active:scale-95"
              title="Previous Track"
            >
              <SkipBack size={26} />
            </button>

            <button 
              onClick={onTogglePlay}
              className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-600/40 transition-all active:scale-90"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
            </button>

            <button 
              onClick={onNextTrack}
              className="text-gray-400 hover:text-white transition-colors active:scale-95"
              title="Next Track"
            >
              <SkipForward size={26} />
            </button>
          </div>

          <button 
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Share Track"
          >
            <Share2 size={22} />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="w-full mt-5 flex items-center gap-3 px-2 bg-white/5 p-3 rounded-2xl border border-white/10">
          <button onClick={() => setIsMuted(!isMuted)} className="text-gray-400 hover:text-white">
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-[11px] font-mono text-gray-400 w-8 text-right">
            {isMuted ? '0%' : `${volume}%`}
          </span>
        </div>

        {/* AI Track Story / Trivia Box */}
        <div className="mt-6 p-4 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl w-full text-left">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} /> AI Song Insight
            </span>
            <span className="text-[10px] text-gray-500 font-mono">GEMINI 3.6</span>
          </div>
          {loadingAnalysis ? (
            <div className="space-y-1.5 mt-2">
              <div className="h-3.5 bg-white/10 animate-pulse rounded w-full"></div>
              <div className="h-3.5 bg-white/10 animate-pulse rounded w-4/5"></div>
            </div>
          ) : (
            <p className="text-xs text-gray-300 leading-relaxed font-normal">{aiAnalysis}</p>
          )}
        </div>

        {/* YouTube Up Next & Recommended Videos Section */}
        <div className="mt-6 p-4 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl w-full text-left space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-rose-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Recommended Videos & Up Next
              </span>
            </div>
            <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
              YouTube Recommendations
            </span>
          </div>

          {loadingRelated ? (
            <div className="space-y-2 py-2">
              {[1, 2, 3].map((i) => (
                <div key={`related-skel-${i}`} className="h-14 bg-white/10 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : relatedRecommendations.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 no-scrollbar">
              {relatedRecommendations.map((recTrack) => {
                const isCurrent = recTrack.id === track.id;
                return (
                  <div
                    key={`overlay-rec-${recTrack.id}`}
                    onClick={() => onPlayTrack ? onPlayTrack(recTrack) : null}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer group ${
                      isCurrent ? 'bg-rose-600/30 border border-rose-500/50' : 'bg-white/5 hover:bg-white/15'
                    }`}
                  >
                    <div className="relative w-16 h-10 rounded-lg overflow-hidden shrink-0 bg-black">
                      <img
                        src={`https://i.ytimg.com/vi/${recTrack.id}/hqdefault.jpg`}
                        alt={recTrack.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors flex items-center justify-center">
                        <Play size={14} className="fill-white text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate group-hover:text-rose-300 transition-colors">
                        {recTrack.title}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {recTrack.channel}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono text-gray-400 shrink-0">
                      {recTrack.duration || '3:30'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-2">No related video recommendations found.</p>
          )}
        </div>

      </div>
    </div>
  );
};

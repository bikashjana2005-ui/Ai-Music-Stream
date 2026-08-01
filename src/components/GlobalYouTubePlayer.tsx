import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Maximize2, X, PlaySquare, ExternalLink, Settings2, Globe, GripHorizontal, Scaling, Move } from 'lucide-react';
import ReactPlayer from 'react-player/youtube';
import { Track } from '../types';
import { extractYouTubeId } from '../utils/youtube';

export type PlayerEngine = 'youtube' | 'youtube-nocookie' | 'invidious' | 'piped' | 'embed';

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
}

export const GlobalYouTubePlayer: React.FC<GlobalYouTubePlayerProps> = ({
  currentTrack,
  isPlaying,
  volume,
  isMuted,
  showVideo,
  isOverlayOpen = false,
  onTrackEnded,
  onOpenOverlay,
  onCloseVideo,
  onProgress,
  onDuration,
  seekToSeconds,
  playerEngine = 'youtube',
  onChangePlayerEngine,
  isDataSaverMode = false,
  isFullScreen = false,
  onToggleFullScreen
}) => {
  const playerRef = useRef<ReactPlayer | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [showEngineMenu, setShowEngineMenu] = useState<boolean>(false);
  const [showSizePresets, setShowSizePresets] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isNativeFullScreen, setIsNativeFullScreen] = useState<boolean>(false);

  // Mini player dimensions state
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(() => {
    const savedW = localStorage.getItem('aura_player_width');
    const savedH = localStorage.getItem('aura_player_height');
    return {
      width: savedW ? parseInt(savedW, 10) : 380,
      height: savedH ? parseInt(savedH, 10) : 220,
    };
  });

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
    // Fullscreen Full Video Player Mode
    containerClassName = 'fixed inset-0 z-[100] w-screen h-screen bg-black flex flex-col pointer-events-auto p-0 m-0 overflow-hidden';
    playerBoxClassName = 'relative w-full h-full bg-black flex-1 flex items-center justify-center';
  } else if (isHidden) {
    // Audio-Only / Background Mode: Keep single ReactPlayer mounted off-screen for uninterrupted audio
    containerClassName = 'fixed -top-[9999px] -left-[9999px] w-[320px] h-[180px] pointer-events-none z-[-10] overflow-hidden';
    playerBoxClassName = 'w-full h-full bg-black';
  } else if (isOverlay) {
    // Fullscreen Overlay mode: Position centered ON TOP of AudioPlayerOverlay (z-[90] > z-[70])
    containerClassName = 'fixed inset-0 z-[90] flex flex-col items-center justify-center pointer-events-none p-4 pb-20 sm:pb-24';
    playerBoxClassName = 'relative w-full max-w-3xl aspect-video rounded-3xl overflow-hidden shadow-2xl ring-2 ring-rose-500/60 bg-black pointer-events-auto group';
  } else {
    // Floating Video Player mode: Draggable & Resizable window
    containerClassName = 'fixed bottom-20 right-3 sm:bottom-24 sm:right-6 rounded-3xl overflow-hidden shadow-2xl ring-2 ring-indigo-500/60 bg-slate-950 pointer-events-auto flex flex-col z-[90] border border-white/20 touch-none';
    playerBoxClassName = 'relative flex-1 w-full h-full bg-black pointer-events-auto select-none';
  }

  // Handle corner resizing drag events
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, corner: 'br' | 'bl' | 'tr' | 'tl') => {
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

      if (corner === 'br') {
        newWidth = Math.max(240, Math.min(maxWidth, startWidth + deltaX));
        newHeight = Math.max(140, Math.min(maxHeight, startHeight + deltaY));
      } else if (corner === 'bl') {
        newWidth = Math.max(240, Math.min(maxWidth, startWidth - deltaX));
        newHeight = Math.max(140, Math.min(maxHeight, startHeight + deltaY));
      } else if (corner === 'tr') {
        newWidth = Math.max(240, Math.min(maxWidth, startWidth + deltaX));
        newHeight = Math.max(140, Math.min(maxHeight, startHeight - deltaY));
      } else if (corner === 'tl') {
        newWidth = Math.max(240, Math.min(maxWidth, startWidth - deltaX));
        newHeight = Math.max(140, Math.min(maxHeight, startHeight - deltaY));
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

  // Determine iframe URL for third-party embeds
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

  const getEngineLabel = (eng: string) => {
    switch (eng) {
      case 'youtube': return 'YouTube Standard';
      case 'youtube-nocookie': return 'YouTube Privacy (NoCookie)';
      case 'invidious': return 'Invidious Player (3rd Party)';
      case 'piped': return 'Piped Player (3rd Party)';
      case 'embed': return 'Direct IFrame Player';
      default: return 'YouTube Standard';
    }
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
      {/* Fullscreen Video Player Header Bar */}
      {isFull && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 via-black/60 to-transparent p-4 sm:p-6 flex items-center justify-between text-white pointer-events-auto transition-opacity duration-300 hover:opacity-100 opacity-90">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-rose-600 rounded-full text-white font-black text-xs flex items-center gap-1.5 shadow-lg border border-rose-400/30">
              <PlaySquare size={15} className="fill-white" />
              <span>Full YouTube Video Player</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold truncate max-w-xs sm:max-w-xl text-white">{currentTrack?.title}</h3>
              <p className="text-xs text-rose-300 font-semibold truncate">{currentTrack?.channel}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-full text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              title="Open video on YouTube.com"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">YouTube.com</span>
            </a>

            <button
              onClick={handleFullscreenClick}
              className="p-2.5 bg-rose-600 hover:bg-rose-500 rounded-full text-white shadow-xl ring-2 ring-rose-400/50 transition-all active:scale-90"
              title="Exit Full Video Player"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Mode Header Controls (Acts as Drag Bar) */}
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
              <span className="text-[9px] text-indigo-400 font-medium block truncate">
                {dimensions.width}x{dimensions.height} • {getEngineLabel(playerEngine)} {isDataSaverMode && '• ⚡ Saver'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Quick Preset Size Menu with Figures */}
            <div className="relative">
              <button
                onClick={() => setShowSizePresets(!showSizePresets)}
                className="px-2 py-0.5 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-md text-[10px] font-mono font-black text-amber-300 transition-all flex items-center gap-1 border border-indigo-500/30 shadow-xs"
                title="Resize mini player using figures"
              >
                <Scaling size={11} className="text-amber-400" />
                <span>{dimensions.width}×{dimensions.height}</span>
              </button>

              {showSizePresets && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-900 border border-white/20 rounded-2xl shadow-2xl p-2.5 z-50 text-xs text-white backdrop-blur-2xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="font-black text-amber-400 text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <Scaling size={12} /> Video Figure Resizer
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {dimensions.width}×{dimensions.height}px
                    </span>
                  </div>

                  {/* 16:9 Figure Presets */}
                  <div className="space-y-1">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">16:9 Figure Presets</div>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { label: 'Compact', w: 280, h: 160 },
                        { label: 'Medium', w: 380, h: 220 },
                        { label: 'Large', w: 480, h: 270 },
                        { label: 'HD 16:9', w: 640, h: 360 },
                        { label: 'Theater', w: 720, h: 405 },
                        { label: 'Ultra HD', w: 854, h: 480 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => applyPresetSize(preset.w, preset.h)}
                          className={`px-2 py-1 rounded-lg text-left font-semibold text-[10px] flex justify-between items-center transition-all ${
                            dimensions.width === preset.w && dimensions.height === preset.h
                              ? 'bg-indigo-600 text-white font-bold ring-1 ring-indigo-400'
                              : 'bg-white/5 hover:bg-white/15 text-gray-300'
                          }`}
                        >
                          <span>{preset.label}</span>
                          <span className="font-mono text-[9px] opacity-75">{preset.w}×{preset.h}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Width & Height Figure Stepper */}
                  <div className="space-y-1.5 pt-1 border-t border-white/10">
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-300">
                      <span>Width Figure</span>
                      <span className="font-mono text-amber-300">{dimensions.width}px</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => applyPresetSize(Math.max(220, dimensions.width - 40), Math.round(Math.max(220, dimensions.width - 40) * (9/16)))}
                        className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-mono font-bold"
                      >
                        -40
                      </button>
                      <input 
                        type="range"
                        min="220"
                        max="960"
                        step="20"
                        value={dimensions.width}
                        onChange={(e) => {
                          const w = parseInt(e.target.value, 10);
                          applyPresetSize(w, Math.round(w * (9/16)));
                        }}
                        className="flex-1 accent-indigo-500 cursor-pointer"
                      />
                      <button
                        onClick={() => applyPresetSize(Math.min(960, dimensions.width + 40), Math.round(Math.min(960, dimensions.width + 40) * (9/16)))}
                        className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-mono font-bold"
                      >
                        +40
                      </button>
                    </div>
                  </div>

                  {/* Quick Scale Figures */}
                  <div className="space-y-1 pt-1 border-t border-white/10">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Scale Factor Figures</div>
                    <div className="flex items-center gap-1">
                      {[0.75, 1.0, 1.25, 1.5, 2.0].map((scale) => {
                        const targetW = Math.round(380 * scale);
                        const targetH = Math.round(220 * scale);
                        return (
                          <button
                            key={scale}
                            onClick={() => applyPresetSize(targetW, targetH)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                              dimensions.width === targetW
                                ? 'bg-amber-400 text-slate-950 font-black'
                                : 'bg-white/10 hover:bg-white/20 text-gray-300'
                            }`}
                          >
                            {scale}x
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Player Engine Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowEngineMenu(!showEngineMenu)}
                className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded-md text-[10px] font-semibold text-indigo-300 transition-all flex items-center gap-1 border border-white/10"
                title="Switch Player Engine"
              >
                <Settings2 size={11} />
              </button>

              {showEngineMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-slate-900 border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400 border-b border-white/10 mb-1 flex items-center justify-between">
                    <span>Select Player Engine</span>
                    <Globe size={11} />
                  </div>
                  <button
                    onClick={() => { onChangePlayerEngine?.('youtube'); setShowEngineMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-medium ${playerEngine === 'youtube' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-300 hover:bg-white/10'}`}
                  >
                    <span>YouTube (Standard)</span>
                  </button>
                  <button
                    onClick={() => { onChangePlayerEngine?.('youtube-nocookie'); setShowEngineMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-medium ${playerEngine === 'youtube-nocookie' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-300 hover:bg-white/10'}`}
                  >
                    <span>YouTube NoCookie</span>
                  </button>
                  <button
                    onClick={() => { onChangePlayerEngine?.('invidious'); setShowEngineMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-medium ${playerEngine === 'invidious' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-300 hover:bg-white/10'}`}
                  >
                    <span>Invidious (3rd Party)</span>
                  </button>
                  <button
                    onClick={() => { onChangePlayerEngine?.('piped'); setShowEngineMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-medium ${playerEngine === 'piped' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-300 hover:bg-white/10'}`}
                  >
                    <span>Piped (3rd Party)</span>
                  </button>
                  <button
                    onClick={() => { onChangePlayerEngine?.('embed'); setShowEngineMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-medium ${playerEngine === 'embed' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-300 hover:bg-white/10'}`}
                  >
                    <span>Direct IFrame</span>
                  </button>

                  <div className="border-t border-white/10 mt-1 pt-1">
                    <a
                      href={`https://yewtu.be/watch?v=${videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-left px-2.5 py-1 rounded-lg text-[10px] text-gray-400 hover:text-white hover:bg-white/5 flex items-center gap-1.5"
                    >
                      <ExternalLink size={10} /> Open in Invidious Web
                    </a>
                  </div>
                </div>
              )}
            </div>

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

      {/* Video Player Display */}
      <div className={playerBoxClassName}>
        {/* Transparent overlay during dragging or resizing to prevent iframe mouse interception */}
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
              onError={(e) => {
                console.warn('YouTube playback error:', e);
                setIsBuffering(false);
              }}
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
                    cc_load_policy: 0,
                    disablekb: 0,
                    autohide: 1,
                    origin: typeof window !== 'undefined' ? window.location.origin : '',
                    widget_referrer: typeof window !== 'undefined' ? window.location.origin : '',
                    ...(isDataSaverMode ? { vq: 'small' } : { vq: 'hd1080' })
                  }
                }
              }}
            />
            {isBuffering && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex items-center justify-center pointer-events-none transition-all">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 text-white border border-white/20 text-xs font-mono font-bold shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>Loading Stream...</span>
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

        {/* Floating Mode Corner Resize Grips */}
        {isFloating && (
          <>
            {/* Bottom Right Resize Handle */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'br')}
              onTouchStart={(e) => handleResizeStart(e, 'br')}
              className="absolute bottom-0 right-0 w-6 h-6 z-40 cursor-se-resize flex items-end justify-end p-1 text-white/50 hover:text-amber-400 transition-colors bg-gradient-to-tl from-black/80 to-transparent rounded-br-2xl"
              title="Drag corner to resize"
            >
              <Scaling size={12} />
            </div>

            {/* Bottom Left Resize Handle */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'bl')}
              onTouchStart={(e) => handleResizeStart(e, 'bl')}
              className="absolute bottom-0 left-0 w-5 h-5 z-40 cursor-sw-resize flex items-end justify-start p-1 text-white/30 hover:text-amber-400 transition-colors rounded-bl-2xl"
            />

            {/* Top Right Resize Handle */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'tr')}
              onTouchStart={(e) => handleResizeStart(e, 'tr')}
              className="absolute top-0 right-0 w-5 h-5 z-40 cursor-ne-resize flex items-start justify-end p-1 text-white/30 hover:text-amber-400 transition-colors rounded-tr-2xl"
            />

            {/* Top Left Resize Handle */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'tl')}
              onTouchStart={(e) => handleResizeStart(e, 'tl')}
              className="absolute top-0 left-0 w-5 h-5 z-40 cursor-nw-resize flex items-start justify-start p-1 text-white/30 hover:text-amber-400 transition-colors rounded-tl-2xl"
            />
          </>
        )}
      </div>
    </motion.div>
  );
};



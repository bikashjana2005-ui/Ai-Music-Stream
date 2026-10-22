import React, { useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Pause, 
  X, 
  Maximize2, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  GripHorizontal
} from 'lucide-react';
import { Track } from '../types';
import { extractYouTubeId, decodeHtmlEntities, getYouTubeThumbnail } from '../utils/youtube';
import { isLaxmiPujaActive } from '../utils/festivalUtils';

export interface VideoMiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack?: () => void;
  onExpand: () => void;
  onClose: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const VideoMiniPlayer: React.FC<VideoMiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onExpand,
  onClose,
  isMuted = false,
  onToggleMute
}) => {
  const isLaxmiPuja = isLaxmiPujaActive();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isDraggingCooldownRef = useRef<boolean>(false);

  // Extract valid 11-char YouTube Video ID (no hardcoded default fallback)
  const videoId = currentTrack ? extractYouTubeId(currentTrack.id || (currentTrack as any)?.youtubeUrl || '') : null;
  const activeVideoId = videoId || (currentTrack?.id && currentTrack.id.length === 11 ? currentTrack.id : '');

  // Bulletproof YouTube Embed URL with controls and playsinline enabled
  const iframeSrc = useMemo(() => {
    if (!activeVideoId) return '';
    const autoPlayVal = isPlaying ? 1 : 0;
    return `https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=${autoPlayVal}&enablejsapi=1&rel=0&playsinline=1&controls=1&modestbranding=1`;
  }, [activeVideoId, isPlaying]);

  if (!currentTrack || !activeVideoId) return null;

  const title = decodeHtmlEntities(currentTrack.title || 'Video');
  const channel = decodeHtmlEntities(currentTrack.channel || currentTrack.artist || 'YouTube Channel');
  const thumbnail = currentTrack.thumbnail || getYouTubeThumbnail(activeVideoId, 'hq');

  // Send postMessage commands to YouTube iframe API for instant zero-reload play/pause/mute
  const sendIframeCommand = (command: 'playVideo' | 'pauseVideo' | 'mute' | 'unMute') => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: command, args: [] }),
        '*'
      );
    } catch {}
  };

  const handleTogglePlayInternal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isPlaying) {
      sendIframeCommand('pauseVideo');
    } else {
      sendIframeCommand('playVideo');
    }
    onTogglePlay();
  };

  const handleToggleMuteInternal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isMuted) {
      sendIframeCommand('unMute');
    } else {
      sendIframeCommand('mute');
    }
    if (onToggleMute) {
      onToggleMute();
    }
  };

  const handleNextTrackInternal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onNextTrack) {
      onNextTrack();
    }
  };

  const handleExpandInternal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isDragging && !isDraggingCooldownRef.current) {
      onExpand();
    }
  };

  return (
    <>
      {/* Invisible Viewport Constraint Container for Screen Boundary Physics */}
      <div 
        ref={constraintsRef} 
        className="fixed inset-3 sm:inset-5 pointer-events-none z-50 select-none overflow-hidden" 
        aria-hidden="true"
      />

      {/* Floating Draggable Mini Video Player Card */}
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.06}
        dragMomentum={false}
        whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
        onDragStart={() => {
          setIsDragging(true);
          isDraggingCooldownRef.current = true;
        }}
        onDragEnd={() => {
          setIsDragging(false);
          setTimeout(() => {
            isDraggingCooldownRef.current = false;
          }, 150);
        }}
        initial={{ opacity: 0, y: 35, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 35, scale: 0.92 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-50 select-none w-[284px] sm:w-[320px] rounded-3xl bg-white/75 dark:bg-zinc-950/70 backdrop-blur-3xl border border-white/60 dark:border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.18),inset_0_1px_1.8px_rgba(255,255,255,0.9)] dark:shadow-[0_28px_65px_rgba(0,0,0,0.75),inset_0_1px_1.5px_rgba(255,255,255,0.25)] overflow-hidden flex flex-col pointer-events-auto transform-gpu"
      >
        {/* Top Header Bar: Grab Handle, Title, Expand & Close */}
        <div 
          onClick={handleExpandInternal}
          className="w-full px-3 py-2 bg-slate-100/60 dark:bg-white/[0.08] backdrop-blur-xl border-b border-black/5 dark:border-white/15 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing text-slate-800 dark:text-white"
        >
          {/* Grab Handle + Title */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <GripHorizontal size={14} className="text-slate-400 dark:text-zinc-400 shrink-0 opacity-80" />
            <span className="text-[11px] font-semibold text-slate-800 dark:text-white truncate drop-shadow-xs" title={title}>
              {title}
            </span>
          </div>

          {/* Quick Actions: Expand & Close */}
          <div 
            className="flex items-center gap-1 shrink-0"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleExpandInternal}
              className="p-1 rounded-lg ios-glass-button text-slate-700 dark:text-zinc-200 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer active:scale-90"
              title="Expand to Full Video"
            >
              <Maximize2 size={12} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded-lg ios-glass-button hover:bg-rose-600/80 hover:text-white text-slate-700 dark:text-zinc-200 transition-all cursor-pointer active:scale-90"
              title="Close Mini Player"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* 16:9 Video Canvas */}
        <div className="aspect-video w-full relative bg-black/80 overflow-hidden group">
          <iframe
            ref={iframeRef}
            key={`mini-yt-${activeVideoId}`}
            src={iframeSrc}
            title={title}
            className="w-full h-full border-0 pointer-events-auto"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
          />

          {/* Frosted Play Overlay when Paused */}
          {!isPlaying && (
            <div 
              onClick={handleTogglePlayInternal}
              className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition-opacity"
              title="Click to play video"
            >
              <button
                type="button"
                onClick={handleTogglePlayInternal}
                className="px-4 py-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/30 text-white flex items-center gap-2 shadow-2xl transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                title="Play Video"
              >
                <Play size={16} className="fill-white ml-0.5 text-white drop-shadow-md" />
                <span className="text-xs font-bold tracking-tight">Play</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Control Bar: Exactly the 4 essential controls */}
        <div 
          className={`px-3 py-2 bg-white/70 dark:bg-black/60 backdrop-blur-2xl flex items-center justify-between gap-2 ${
            isLaxmiPuja 
              ? 'border-t border-amber-400/40 shadow-[0_-2px_12px_rgba(245,158,11,0.25)]' 
              : 'border-t border-black/5 dark:border-white/10'
          }`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Channel Name */}
          <span className="text-[10px] text-slate-600 dark:text-zinc-300 font-medium truncate max-w-[110px]" title={channel}>
            {channel}
          </span>

          {/* Controls: Mute, Play/Pause, Next Track */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 1. Mute / Unmute */}
            <button
              type="button"
              onClick={handleToggleMuteInternal}
              className={`p-1.5 rounded-lg ios-glass-button transition-all cursor-pointer active:scale-90 ${
                isLaxmiPuja ? 'border border-amber-400/30 text-amber-500 dark:text-amber-200' : 'text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX size={13} className="text-amber-500" />
              ) : (
                <Volume2 size={13} />
              )}
            </button>

            {/* 2. Play / Pause */}
            <button
              type="button"
              onClick={handleTogglePlayInternal}
              className={`p-1.5 px-2.5 rounded-lg ${
                isLaxmiPuja
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 shadow-[0_4px_16px_rgba(245,158,11,0.6)] border-amber-300/50 text-black font-black'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 shadow-[0_4px_16px_rgba(244,63,94,0.4),inset_0_1px_1px_rgba(255,255,255,0.5)] border-rose-400/40 text-white'
              } transition-all cursor-pointer active:scale-90 flex items-center justify-center border`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={13} className={isLaxmiPuja ? 'fill-black text-black' : 'fill-white'} />
              ) : (
                <Play size={13} className={`${isLaxmiPuja ? 'fill-black text-black' : 'fill-white'} ml-0.5`} />
              )}
            </button>

            {/* 3. Next Track */}
            {onNextTrack && (
              <button
                type="button"
                onClick={handleNextTrackInternal}
                className="p-1.5 rounded-lg ios-glass-button text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer active:scale-90"
                title="Next Video"
              >
                <SkipForward size={13} />
              </button>
            )}

            {/* 4. Expand Fullscreen */}
            <button
              type="button"
              onClick={handleExpandInternal}
              className="p-1.5 rounded-lg ios-glass-button text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer active:scale-90"
              title="Expand to Full Video"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

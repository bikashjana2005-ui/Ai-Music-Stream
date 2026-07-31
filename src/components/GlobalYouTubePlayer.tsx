import React from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Maximize2, X } from 'lucide-react';
import ReactPlayer from 'react-player/youtube';
import { Track } from '../types';
import { extractYouTubeId } from '../utils/youtube';

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
  onCloseVideo
}) => {
  const videoId = extractYouTubeId(currentTrack?.id || '');

  if (!videoId || videoId.length !== 11) return null;

  const isFloating = showVideo && !isOverlayOpen;
  const isOverlay = showVideo && isOverlayOpen;
  const isHidden = !showVideo;

  let containerClassName = '';
  let playerBoxClassName = '';

  if (isHidden) {
    // Hidden mode: Keep single ReactPlayer continuously mounted & sized so YouTube IFrame API remains initialized
    containerClassName = 'fixed bottom-0 right-0 w-[320px] h-[180px] pointer-events-none opacity-[0.001] z-[-50] overflow-hidden';
    playerBoxClassName = 'w-full h-full bg-black';
  } else if (isOverlay) {
    // Fullscreen Overlay mode: Position centered in overlay dialog space
    containerClassName = 'fixed inset-0 z-[60] flex flex-col items-center justify-center pointer-events-none p-4 pb-32 sm:pb-36';
    playerBoxClassName = 'relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden shadow-2xl ring-2 ring-indigo-500/60 bg-black pointer-events-auto group';
  } else {
    // Floating Video Player mode
    containerClassName = 'fixed bottom-6 right-4 w-80 h-56 sm:w-[420px] sm:h-68 rounded-3xl overflow-hidden shadow-2xl ring-2 ring-indigo-500/60 bg-slate-950 pointer-events-auto flex flex-col z-50 border border-white/10';
    playerBoxClassName = 'relative flex-1 w-full h-full bg-black pointer-events-auto';
  }

  return (
    <motion.div
      key="global-youtube-player-wrapper"
      className={containerClassName}
      drag={isFloating ? 'y' : false}
      dragConstraints={{ top: 0, bottom: 300 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (isFloating && (info.offset.y > 60 || info.velocity.y > 200)) {
          onCloseVideo?.();
        }
      }}
    >
      {/* Floating Mode Header Controls */}
      {isFloating && (
        <div className="bg-slate-900/95 backdrop-blur-md px-3.5 py-2 flex items-center justify-between gap-2 border-b border-white/10 shrink-0 z-10 text-white select-none">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onCloseVideo}
              className="p-1 hover:bg-white/15 bg-white/5 rounded-full text-gray-300 hover:text-white transition-all shrink-0 active:scale-95"
              title="Hide video player"
            >
              <ChevronDown size={18} className="text-indigo-400" />
            </button>
            <div className="min-w-0">
              <span className="text-[11px] font-bold truncate block text-gray-100">
                {currentTrack?.title || 'Video Stream'}
              </span>
              <span className="text-[9px] text-indigo-400 font-semibold block">
                Swipe down or click arrow to hide
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenOverlay && (
              <button
                onClick={onOpenOverlay}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-bold text-white transition-all flex items-center gap-1 shadow-sm active:scale-95"
                title="Expand Full Screen Player"
              >
                <Maximize2 size={11} /> Expand
              </button>
            )}
            {onCloseVideo && (
              <button
                onClick={onCloseVideo}
                className="p-1.5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded-xl transition-colors text-xs"
                title="Close Video Player"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Persistent Single ReactPlayer Instance */}
      <div className={playerBoxClassName}>
        <ReactPlayer
          url={`https://www.youtube.com/watch?v=${videoId}`}
          playing={isPlaying}
          volume={volume / 100}
          muted={isMuted}
          onEnded={onTrackEnded}
          onError={(e) => console.warn('YouTube playback error:', e)}
          width="100%"
          height="100%"
          playsinline={true}
          controls={showVideo}
          config={{
            youtube: {
              playerVars: {
                autoplay: 1,
                rel: 0,
                disablekb: 1,
                modestbranding: 1,
                enablejsapi: 1,
                origin: typeof window !== 'undefined' ? window.location.origin : ''
              }
            }
          }}
        />
      </div>
    </motion.div>
  );
};

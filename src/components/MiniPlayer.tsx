import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Maximize2, 
  X, 
  Video, 
  VideoOff, 
  Volume2, 
  VolumeX, 
  Scaling, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  GripHorizontal,
  Minus,
  Plus
} from 'lucide-react';
import { Track } from '../types';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';

interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onOpenOverlay: () => void;
  onCloseTrack: () => void;
  playbackTime: number;
  realDuration: number;
  onSeek: (seconds: number) => void;
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  showVideo: boolean;
  onToggleShowVideo: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// Preset Figures for Mini Player dimensions (Height in px, Width in px)
const FIGURE_PRESETS = [
  { label: 'Compact', height: 52, width: 440, figureTag: '52×440' },
  { label: 'Standard', height: 68, width: 620, figureTag: '68×620' },
  { label: 'Large', height: 88, width: 780, figureTag: '88×780' },
  { label: 'Expanded', height: 110, width: 920, figureTag: '110×920' },
];

// Scale Factor Figures
const SCALE_FIGURES = [0.8, 1.0, 1.25, 1.5];

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onOpenOverlay,
  onCloseTrack,
  playbackTime,
  realDuration,
  onSeek,
  volume,
  setVolume,
  isMuted,
  setIsMuted,
  showVideo,
  onToggleShowVideo,
  onShowToast
}) => {
  const [showFigureControls, setShowFigureControls] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Height and Width figures state saved in localStorage
  const [heightFigure, setHeightFigure] = useState<number>(() => {
    const saved = localStorage.getItem('aura_mini_height');
    return saved ? parseInt(saved, 10) : 68;
  });

  const [widthFigure, setWidthFigure] = useState<number>(() => {
    const saved = localStorage.getItem('aura_mini_width');
    return saved ? parseInt(saved, 10) : 620;
  });

  const [scaleFigure, setScaleFigure] = useState<number>(() => {
    const saved = localStorage.getItem('aura_mini_scale');
    return saved ? parseFloat(saved) : 1.0;
  });

  useEffect(() => {
    localStorage.setItem('aura_mini_height', String(heightFigure));
    localStorage.setItem('aura_mini_width', String(widthFigure));
    localStorage.setItem('aura_mini_scale', String(scaleFigure));
  }, [heightFigure, widthFigure, scaleFigure]);

  // Reset dismissal when track changes
  useEffect(() => {
    if (currentTrack) {
      setIsDismissed(false);
    }
  }, [currentTrack?.id]);

  if (!currentTrack || isDismissed) return null;

  const videoId = extractYouTubeId(currentTrack.id);
  const title = decodeHtmlEntities(currentTrack.title);
  const channel = decodeHtmlEntities(currentTrack.channel);
  const thumbnail = currentTrack.thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');

  const duration = realDuration || 220;
  const progressPercent = Math.min(100, Math.max(0, (playbackTime / duration) * 100));

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleApplyPreset = (h: number, w: number, tag: string) => {
    setHeightFigure(h);
    setWidthFigure(w);
    onShowToast(`Mini Player figure set to ${tag} (${h}px height)`, 'info');
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(Math.floor(pct * duration));
  };

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="fixed bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-40 pointer-events-auto px-2 w-full flex justify-center"
      style={{ maxWidth: '100%' }}
    >
      <div 
        className="relative bg-slate-900/90 dark:bg-slate-950/90 border border-white/20 backdrop-blur-3xl backdrop-saturate-200 rounded-xl shadow-[0_16px_50px_rgba(0,0,0,0.5)] text-white flex flex-col justify-between overflow-hidden transition-all duration-300 ring-1 ring-black/20"
        style={{
          width: `${Math.min(window.innerWidth - 16, widthFigure * scaleFigure)}px`,
          height: `${heightFigure * scaleFigure}px`,
        }}
      >
        {/* Top Mini Progress Bar Slider */}
        <div 
          onClick={handleSeekClick}
          className="w-full h-1 bg-white/10 cursor-pointer relative group shrink-0"
          title="Click to seek"
        >
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-rose-400 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${progressPercent}% - 6px)` }}
          />
        </div>

        {/* Main Content Row inside Mini Player */}
        <div className="flex-1 px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2.5 min-w-0">
          
          {/* Left Track Info & Artwork */}
          <div 
            onClick={onOpenOverlay}
            className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
          >
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden bg-slate-800 border border-white/15 shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <img 
                src={thumbnail} 
                alt={title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                }}
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-xs">
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 h-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-0.5 h-full bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-0.5 h-full bg-indigo-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-indigo-300 transition-colors">
                {title}
              </h4>
              <p className="text-[10px] sm:text-xs text-gray-400 font-semibold truncate flex items-center gap-1.5">
                <span>{channel}</span>
                <span>•</span>
                <span className="font-mono text-indigo-400">{formatTime(playbackTime)} / {formatTime(duration)}</span>
              </p>
            </div>
          </div>

          {/* Center Playback Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={onPrevTrack}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-90"
              title="Previous Track"
            >
              <SkipBack size={16} />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 transition-all active:scale-95 shrink-0"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={18} className="fill-white" /> : <Play size={18} className="fill-white ml-0.5" />}
            </button>

            <button
              onClick={onNextTrack}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-90"
              title="Next Track"
            >
              <SkipForward size={16} />
            </button>
          </div>

          {/* Right Action Buttons & Figure Adjuster Trigger */}
          <div className="flex items-center gap-1 shrink-0">
            
            {/* Toggle Video Stream */}
            <button
              onClick={onToggleShowVideo}
              className={`p-1.5 rounded-xl transition-all hidden xs:flex items-center gap-1 text-xs font-bold ${
                showVideo 
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={showVideo ? "Hide Video Stream" : "Show Floating Video"}
            >
              {showVideo ? <Video size={15} /> : <VideoOff size={15} />}
            </button>

            {/* Mini Player Size Figures Dropdown Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowFigureControls(!showFigureControls)}
                className={`px-2 py-1 rounded-xl text-[11px] font-mono font-black transition-all flex items-center gap-1 border ${
                  showFigureControls 
                    ? 'bg-amber-500/30 text-amber-200 border-amber-400/50' 
                    : 'bg-white/10 hover:bg-white/20 text-gray-200 border-white/15'
                }`}
                title="Resize Mini Player using Figures"
              >
                <Scaling size={13} className="text-amber-400" />
                <span className="hidden sm:inline">{heightFigure}px</span>
                <ChevronUp size={12} className={`transition-transform ${showFigureControls ? 'rotate-180' : ''}`} />
              </button>

              {/* Figure Size Control Panel Popover */}
              {showFigureControls && (
                <div className="absolute right-0 bottom-full mb-2 w-72 bg-slate-900 border border-white/20 rounded-2xl shadow-2xl p-3 z-50 text-xs text-white backdrop-blur-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-black text-amber-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Scaling size={14} /> Mini Player Figures
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {heightFigure}px H × {widthFigure}px W
                    </span>
                  </div>

                  {/* Figure Height Presets */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Height Figure Presets</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FIGURE_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => handleApplyPreset(preset.height, preset.width, preset.figureTag)}
                          className={`px-2.5 py-1.5 rounded-xl text-left font-semibold text-[11px] flex justify-between items-center transition-all ${
                            heightFigure === preset.height 
                              ? 'bg-indigo-600 text-white font-bold ring-1 ring-indigo-400' 
                              : 'bg-white/5 hover:bg-white/15 text-gray-300'
                          }`}
                        >
                          <span>{preset.label}</span>
                          <span className="font-mono text-[10px] opacity-75">{preset.height}px</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Numerical Figure Inputs */}
                  <div className="space-y-2 pt-1 border-t border-white/10">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Exact Numeric Figures (px)</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <label className="text-[9px] text-gray-400 font-bold block">Height (px)</label>
                        <input
                          type="number"
                          min="48"
                          max="160"
                          value={heightFigure}
                          onChange={(e) => setHeightFigure(parseInt(e.target.value, 10) || 48)}
                          className="w-full bg-slate-950 border border-white/20 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] text-gray-400 font-bold block">Width (px)</label>
                        <input
                          type="number"
                          min="300"
                          max="1200"
                          value={widthFigure}
                          onChange={(e) => setWidthFigure(parseInt(e.target.value, 10) || 300)}
                          className="w-full bg-slate-950 border border-white/20 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Height Figure Stepper */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <span>Height Slider</span>
                      <span className="font-mono text-amber-300">{heightFigure} px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setHeightFigure(prev => Math.max(48, prev - 8))}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-gray-200 transition-all"
                        title="Decrease height"
                      >
                        <Minus size={14} />
                      </button>
                      <input 
                        type="range" 
                        min="48" 
                        max="140" 
                        step="4"
                        value={heightFigure}
                        onChange={(e) => setHeightFigure(parseInt(e.target.value, 10))}
                        className="flex-1 accent-indigo-500 cursor-pointer"
                      />
                      <button
                        onClick={() => setHeightFigure(prev => Math.min(140, prev + 8))}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-gray-200 transition-all"
                        title="Increase height"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Width Figure Stepper */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <span>Exact Width Figure</span>
                      <span className="font-mono text-amber-300">{widthFigure} px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setWidthFigure(prev => Math.max(340, prev - 40))}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-gray-200 transition-all"
                        title="Decrease width"
                      >
                        <Minus size={14} />
                      </button>
                      <input 
                        type="range" 
                        min="340" 
                        max="1020" 
                        step="20"
                        value={widthFigure}
                        onChange={(e) => setWidthFigure(parseInt(e.target.value, 10))}
                        className="flex-1 accent-indigo-500 cursor-pointer"
                      />
                      <button
                        onClick={() => setWidthFigure(prev => Math.min(1020, prev + 40))}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-gray-200 transition-all"
                        title="Increase width"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Scale Multiplier Figures */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Scale Factor Figures</div>
                    <div className="flex items-center gap-1.5">
                      {SCALE_FIGURES.map((factor) => (
                        <button
                          key={factor}
                          onClick={() => {
                            setScaleFigure(factor);
                            onShowToast(`Mini Player scale figure: ${factor}x`, 'info');
                          }}
                          className={`flex-1 py-1 rounded-xl text-[11px] font-mono font-bold transition-all ${
                            scaleFigure === factor
                              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                              : 'bg-white/10 hover:bg-white/20 text-gray-300'
                          }`}
                        >
                          {factor}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Expand Fullscreen Overlay */}
            <button
              onClick={onOpenOverlay}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-sm active:scale-90"
              title="Expand Full Player"
            >
              <Maximize2 size={15} />
            </button>

            {/* Dismiss Mini Player */}
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-white/10 rounded-xl transition-all"
              title="Close Mini Player"
            >
              <X size={15} />
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

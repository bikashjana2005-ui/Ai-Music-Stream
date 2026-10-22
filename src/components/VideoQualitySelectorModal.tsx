import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, Check, ChevronDown, ChevronUp, Sparkles, Activity } from 'lucide-react';
import { Track } from '../types';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';

export type QualityOptionId = 'auto' | 'higher' | 'data_saver';

interface VideoQualitySelectorModalProps {
  isOpen: boolean;
  track: Track | null;
  onClose: () => void;
  onConfirmPlay: (track: Track, selectedQuality: QualityOptionId, dontShowAgain: boolean) => void;
  isDataSaverActive?: boolean;
}

/**
 * Robust ISO 8601 & formatted duration parser to total seconds
 */
export const parseDurationSeconds = (durationStr?: string): number => {
  if (!durationStr) return 210; // Default 3m 30s
  const str = durationStr.trim();

  // ISO 8601 string: PT4M28S or PT1H2M30S or PT45S
  if (str.startsWith('PT')) {
    const hoursMatch = str.match(/(\d+)H/);
    const minsMatch = str.match(/(\d+)M/);
    const secsMatch = str.match(/(\d+)S/);
    const h = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const m = minsMatch ? parseInt(minsMatch[1], 10) : 0;
    const s = secsMatch ? parseInt(secsMatch[1], 10) : 0;
    const total = h * 3600 + m * 60 + s;
    if (total > 0) return total;
  }

  // Format "01:02:15" or "04:28" or "0:45"
  if (str.includes(':')) {
    const parts = str.split(':').map(p => parseInt(p, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }

  // Raw seconds string like "210"
  const numeric = parseInt(str, 10);
  if (!isNaN(numeric) && numeric > 0) {
    return numeric;
  }

  return 210;
};

/**
 * Real-time data usage calculation formula
 * Bitrate in kbps * 1000 / 8 = Bytes/sec
 * Bytes/sec * seconds / (1024 * 1024) = Megabytes
 */
export const calculateSizeMb = (seconds: number, bitrateKbps: number): number => {
  return (seconds * bitrateKbps * 1000) / (8 * 1024 * 1024);
};

export const formatMbString = (mb: number): string => {
  if (mb < 0.1) return '~ 0.1 MB';
  if (mb < 10) return `~ ${mb.toFixed(1)} MB`;
  if (mb < 1000) return `~ ${mb.toFixed(1)} MB`;
  return `~ ${(mb / 1024).toFixed(2)} GB`;
};

export const formatTimeDisplay = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const VideoQualitySelectorModal: React.FC<VideoQualitySelectorModalProps> = ({
  isOpen,
  track,
  onClose,
  onConfirmPlay,
  isDataSaverActive = false
}) => {
  // Sync selected quality
  const [selectedQuality, setSelectedQuality] = useState<QualityOptionId>('auto');
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState<boolean>(false);
  const [detectedDurationSec, setDetectedDurationSec] = useState<number>(210);

  // Parse and dynamically calculate duration whenever track opens
  useEffect(() => {
    if (isOpen && track) {
      const savedPref = localStorage.getItem('aura_preferred_quality_option') as QualityOptionId;
      if (savedPref && ['auto', 'higher', 'data_saver'].includes(savedPref)) {
        setSelectedQuality(savedPref);
      } else if (isDataSaverActive) {
        setSelectedQuality('data_saver');
      } else {
        setSelectedQuality('auto');
      }

      setIsPreviewPlaying(false);
      setDontShowAgain(false);
      setShowDetailedBreakdown(false);

      const parsedSec = parseDurationSeconds(track.duration);
      setDetectedDurationSec(parsedSec);

      // Attempt to fetch fresh metadata if duration looks default
      if ((!track.duration || track.duration === '0:00' || track.duration === '0') && track.id) {
        const videoId = extractYouTubeId(track.id);
        if (videoId) {
          fetch('/api/youtube/video-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId })
          })
            .then(res => res.json())
            .then(data => {
              if (data?.duration) {
                const sec = parseDurationSeconds(data.duration);
                if (sec > 0) setDetectedDurationSec(sec);
              }
            })
            .catch(() => {});
        }
      }
    }
  }, [isOpen, track, isDataSaverActive]);

  if (!isOpen || !track) return null;

  const videoId = extractYouTubeId(track.id);
  const title = decodeHtmlEntities(track.title || 'Selected Video');
  const thumbnail = track.thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop');

  const handlePlayClick = () => {
    if (dontShowAgain) {
      localStorage.setItem('aura_skip_quality_prompt', 'true');
      localStorage.setItem('aura_preferred_quality_option', selectedQuality);
    }
    onConfirmPlay(track, selectedQuality, dontShowAgain);
  };

  // Real-time calculation based on the video's actual length
  // Rates:
  // - Data saver (144p): ~160 kbps (100k video + 60k audio) -> ~0.019 MB/s
  // - Auto (adaptive ~360p-480p): ~600 kbps (470k video + 130k audio) -> ~0.0715 MB/s
  // - Higher picture quality (1080p HD): ~2500 kbps (2300k video + 200k audio) -> ~0.298 MB/s
  const durationSec = Math.max(15, detectedDurationSec);

  const dataSaverMb = calculateSizeMb(durationSec, 160);
  const autoMb = calculateSizeMb(durationSec, 600);
  const higherMb = calculateSizeMb(durationSec, 2500);

  const options: { id: QualityOptionId; label: string; sizeEst: string; note: string; bitrateDesc: string }[] = [
    {
      id: 'auto',
      label: 'Auto',
      sizeEst: formatMbString(autoMb),
      note: 'Optimized resolution based on network speed',
      bitrateDesc: '~ 600 kbps • Adaptive buffer-free'
    },
    {
      id: 'higher',
      label: 'Higher picture quality',
      sizeEst: formatMbString(higherMb),
      note: '1080p Full HD crystal clear stream',
      bitrateDesc: '~ 2.5 Mbps • High Definition 1080p'
    },
    {
      id: 'data_saver',
      label: 'Data saver',
      sizeEst: formatMbString(dataSaverMb),
      note: '144p ultra-efficient • 90% data saved',
      bitrateDesc: '~ 160 kbps • Low bandwidth'
    }
  ];

  // Granular resolution breakdown for user reference
  const resolutionBreakdown = [
    { label: '1080p Full HD', bitrate: 2500, size: formatMbString(calculateSizeMb(durationSec, 2500)) },
    { label: '720p HD', bitrate: 1400, size: formatMbString(calculateSizeMb(durationSec, 1400)) },
    { label: '480p Normal', bitrate: 600, size: formatMbString(calculateSizeMb(durationSec, 600)) },
    { label: '360p Medium', bitrate: 350, size: formatMbString(calculateSizeMb(durationSec, 350)) },
    { label: '240p Lite', bitrate: 220, size: formatMbString(calculateSizeMb(durationSec, 220)) },
    { label: '144p Data Saver', bitrate: 160, size: formatMbString(calculateSizeMb(durationSec, 160)) }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Sheet Container - Exact match with user's screenshot layout and cyan accents */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.96 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative z-10 w-full max-w-md bg-[#121212] text-white rounded-t-[28px] sm:rounded-[28px] border border-white/10 shadow-2xl overflow-hidden flex flex-col p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto"
        >
          {/* Mobile Drag Handle */}
          <div className="w-12 h-1 bg-zinc-600/70 rounded-full mx-auto -mt-1 mb-0.5 sm:hidden" />

          {/* Header Title & Close Icon - Matching Screenshot */}
          <div className="flex items-center justify-between pt-0.5">
            <h2 className="text-[17px] sm:text-[19px] font-semibold text-white tracking-tight">
              Select quality for this video
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Video Preview Card with Centered ▶ PREVIEW badge */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-md group">
            {isPreviewPlaying && videoId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&controls=0&modestbranding=1&playsinline=1&disablekb=1&iv_load_policy=3`}
                title={title}
                className="w-full h-full border-0 scale-[1.08] origin-center"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <>
                <img
                  src={thumbnail}
                  alt={title}
                  className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />
                
                {/* Centered PREVIEW Badge Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
                    className="px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/80 hover:border-white text-white rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
                  >
                    <Play size={13} fill="currentColor" />
                    <span>PREVIEW</span>
                  </button>
                </div>

                {/* Track Title Floating Tag */}
                <div className="absolute bottom-2.5 left-3.5 right-3.5 pointer-events-none">
                  <p className="text-[12px] font-medium text-white/95 truncate drop-shadow-md">
                    {title}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Real-Time Live Status Bar according to video size & quality */}
          <div className="flex items-center justify-between px-1 py-1 bg-white/[0.04] rounded-lg border border-white/[0.06] text-[11px] text-zinc-300">
            <div className="flex items-center gap-1.5">
              <Activity size={12} className="text-[#00a6f4] animate-pulse" />
              <span>Video Length: <strong className="text-white font-mono">{formatTimeDisplay(durationSec)}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setShowDetailedBreakdown(prev => !prev)}
              className="text-[#00a6f4] hover:underline flex items-center gap-0.5 text-[10px] font-semibold cursor-pointer"
            >
              <span>{showDetailedBreakdown ? 'Hide Bitrates' : 'All Resolutions'}</span>
              {showDetailedBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {/* Detailed Resolution Breakdown (Collapsible) */}
          {showDetailedBreakdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-2.5 bg-black/40 rounded-xl border border-white/10 space-y-1.5 text-[11px]"
            >
              <div className="text-zinc-400 font-medium text-[10px] uppercase tracking-wider mb-1">
                Real-Time Estimated Data Consumption by Quality:
              </div>
              <div className="grid grid-cols-2 gap-1.5 font-mono">
                {resolutionBreakdown.map(res => (
                  <div key={res.label} className="flex items-center justify-between p-1.5 bg-white/[0.03] rounded border border-white/5">
                    <span className="text-zinc-300">{res.label}</span>
                    <span className="text-[#00a6f4] font-bold">{res.size}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 3 Quality Radio Selection Items with Real-Time Dynamic Size Badges */}
          <div className="space-y-2 pt-0.5">
            {options.map((opt) => {
              const isSelected = selectedQuality === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedQuality(opt.id)}
                  className={`w-full py-3 px-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all border ${
                    isSelected 
                      ? 'bg-[#00a6f4]/10 border-[#00a6f4]/50 shadow-xs' 
                      : 'border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Cyan Radio Button matching screenshot */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'border-[#00a6f4] bg-transparent' : 'border-zinc-500'
                    }`}>
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#00a6f4]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[15px] ${isSelected ? 'font-bold text-white' : 'font-normal text-zinc-200'} truncate`}>
                          {opt.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-tight truncate mt-0.5">
                        {opt.note}
                      </p>
                    </div>
                  </div>

                  {/* Real-time Dynamic Size Estimate on Right - Circled in User's Screenshot */}
                  <span className={`text-[13px] font-mono font-medium shrink-0 pl-2 transition-colors ${
                    isSelected ? 'text-[#00a6f4] font-bold' : 'text-zinc-300'
                  }`}>
                    {opt.sizeEst}
                  </span>
                </div>
              );
            })}
          </div>

          {/* "Don't show this again" Checkbox */}
          <div 
            onClick={() => setDontShowAgain(!dontShowAgain)}
            className="flex items-center gap-3 pt-1 px-1 cursor-pointer select-none"
          >
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              dontShowAgain 
                ? 'bg-[#00a6f4] border-[#00a6f4] text-black' 
                : 'border-zinc-500 bg-transparent hover:border-zinc-400'
            }`}>
              {dontShowAgain && <Check size={14} strokeWidth={3} />}
            </div>
            <span className="text-xs sm:text-sm text-zinc-300 font-normal">
              Don't show this again
            </span>
          </div>

          {/* Bottom Actions: Cancel & Cyan Play Pill Button matching Screenshot */}
          <div className="flex items-center justify-end gap-5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[#00a6f4] hover:underline text-sm font-semibold cursor-pointer active:scale-95 transition-transform"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePlayClick}
              className="px-7 py-2.5 bg-[#00a6f4] hover:bg-[#0095dc] text-slate-950 text-sm font-bold rounded-full shadow-lg shadow-[#00a6f4]/25 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Play</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState } from 'react';
import { X, Download, Music, Film, Sparkles, Check, HardDrive, WifiOff, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track, Playlist } from '../types';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';

interface DownloadModalProps {
  isOpen?: boolean;
  track?: Track | null;
  playlist?: Playlist | null;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  audioQuality?: string;
  videoQuality?: string;
  onSetDefaultVideoQuality?: (quality: string) => void;
  onDownloadComplete?: (track: Track, format: 'mp3' | 'mp4', quality: string) => void;
}

interface QualityOption {
  value: string;
  label: string;
  desc: string;
  estSize: string;
  badge?: string;
}

const VIDEO_QUALITIES: QualityOption[] = [
  { value: '1080p', label: '1080p', desc: 'Full HD • 60fps', estSize: '~42 MB', badge: 'Crisp' },
  { value: '720p', label: '720p', desc: 'HD Standard', estSize: '~24 MB', badge: 'Popular' },
  { value: '480p', label: '480p', desc: 'SD Mobile', estSize: '~14 MB' },
  { value: '360p', label: '360p', desc: 'Standard', estSize: '~9 MB' },
  { value: '240p', label: '240p', desc: 'Compact', estSize: '~5 MB' },
  { value: '144p', label: '144p', desc: 'Data Saver', estSize: '~3 MB', badge: 'Fastest' },
];

const AUDIO_QUALITIES: QualityOption[] = [
  { value: '320kbps', label: '320 kbps', desc: 'Ultra Studio HQ', estSize: '~8.5 MB', badge: 'Best' },
  { value: '256kbps', label: '256 kbps', desc: 'High Definition', estSize: '~6.8 MB', badge: 'Hi-Fi' },
  { value: '192kbps', label: '192 kbps', desc: 'Standard Audio', estSize: '~5.1 MB' },
  { value: '128kbps', label: '128 kbps', desc: 'Compact Mobile', estSize: '~3.4 MB', badge: 'Fast' },
];

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen = true,
  track,
  playlist,
  onClose,
  onShowToast,
  audioQuality = '320',
  videoQuality = '1080p',
  onSetDefaultVideoQuality,
  onDownloadComplete
}) => {
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [quality, setQuality] = useState(() => {
    return videoQuality || '1080p';
  });
  const [progress, setProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState('0.0 MB/s');
  const [downloadedMB, setDownloadedMB] = useState('0.0 MB');
  const [totalMB, setTotalMB] = useState('0.0 MB');
  const [downloadStage, setDownloadStage] = useState('Initializing stream connection...');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDefaultSaved, setIsDefaultSaved] = useState(false);

  // Determine item type
  const isPlaylist = Boolean(playlist && !track);
  const playlistTracks = playlist?.tracks || [];
  const activeTrack = track || (playlistTracks.length > 0 ? playlistTracks[0] : null);

  const rawId = activeTrack?.id || activeTrack?.youtubeUrl || '';
  const videoId = extractYouTubeId(rawId) || (rawId.length === 11 ? rawId : '');

  const thumbnailUrl = videoId && videoId.length === 11
    ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    : (activeTrack?.thumbnail && !activeTrack.thumbnail.includes('unsplash')
        ? activeTrack.thumbnail
        : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop');

  const currentOptions = format === 'mp4' ? VIDEO_QUALITIES : AUDIO_QUALITIES;
  const activeQualityOption = currentOptions.find(o => o.value === quality) || currentOptions[0];

  const handleFormatChange = (newFormat: 'mp3' | 'mp4') => {
    setFormat(newFormat);
    if (newFormat === 'mp4') {
      const matched = VIDEO_QUALITIES.some(q => q.value === videoQuality) ? videoQuality : '1080p';
      setQuality(matched);
    } else {
      const audioVal = audioQuality === 'auto' ? '320kbps' : `${audioQuality}kbps`;
      const matched = AUDIO_QUALITIES.some(q => q.value === audioVal) ? audioVal : '320kbps';
      setQuality(matched);
    }
  };

  const handleQualitySelect = (newQuality: string) => {
    setQuality(newQuality);
    if (format === 'mp4' && onSetDefaultVideoQuality) {
      onSetDefaultVideoQuality(newQuality);
      setIsDefaultSaved(true);
      setTimeout(() => setIsDefaultSaved(false), 2000);
    }
  };

  const triggerRealBlobDownload = (singleTrack?: Track) => {
    const t = singleTrack || activeTrack;
    if (!t) return;
    if (onDownloadComplete) {
      onDownloadComplete(t, format, quality);
    }
  };

  const handleStartDownload = () => {
    setIsDownloading(true);
    setProgress(0);

    // Calculate realistic estimated size based on selected quality
    let estSizeNum = 24.0;
    if (format === 'mp4') {
      if (quality === '1080p') estSizeNum = 42.5;
      else if (quality === '720p') estSizeNum = 24.0;
      else if (quality === '480p') estSizeNum = 14.2;
      else if (quality === '360p') estSizeNum = 9.1;
      else if (quality === '240p') estSizeNum = 5.4;
      else estSizeNum = 3.2;
    } else {
      if (quality === '320kbps') estSizeNum = 8.6;
      else if (quality === '256kbps') estSizeNum = 6.9;
      else if (quality === '192kbps') estSizeNum = 5.2;
      else estSizeNum = 3.5;
    }

    setTotalMB(`${estSizeNum.toFixed(1)} MB`);
    setDownloadStage('Establishing real-time stream connection...');

    if (isPlaylist && playlistTracks.length > 0) {
      let trackIndex = 0;
      let trackProgress = 0;

      const interval = setInterval(() => {
        trackProgress += Math.random() * 22 + 10;
        const currentSpeed = (Math.random() * 4.5 + 4.0).toFixed(1);
        setDownloadSpeed(`${currentSpeed} MB/s`);

        if (trackProgress < 30) {
          setDownloadStage(`Connecting to stream (${trackIndex + 1}/${playlistTracks.length})...`);
        } else if (trackProgress < 75) {
          setDownloadStage(`Downloading ${format.toUpperCase()} frames (${quality})...`);
        } else {
          setDownloadStage(`Processing & saving track ${trackIndex + 1}...`);
        }

        if (trackProgress >= 100) {
          triggerRealBlobDownload(playlistTracks[trackIndex]);
          trackIndex++;
          trackProgress = 0;

          if (trackIndex >= playlistTracks.length) {
            clearInterval(interval);
            setProgress(100);
            setDownloadStage('Download complete!');
            setTimeout(() => {
              onShowToast(`Downloaded ${playlistTracks.length} tracks from "${playlist?.name}" (${quality})`, "success");
              onClose();
            }, 500);
            return;
          }
        }

        const overall = Math.min(
          ((trackIndex + trackProgress / 100) / playlistTracks.length) * 100,
          99
        );
        setProgress(overall);
        const downloaded = ((overall / 100) * (estSizeNum * playlistTracks.length)).toFixed(1);
        setDownloadedMB(`${downloaded} MB`);
      }, 190);

    } else if (activeTrack) {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 16 + 9;
        const currentSpeed = (Math.random() * 5.5 + 4.2).toFixed(1);
        setDownloadSpeed(`${currentSpeed} MB/s`);

        if (currentProgress < 25) {
          setDownloadStage(`Fetching real-time ${format.toUpperCase()} stream...`);
        } else if (currentProgress < 65) {
          setDownloadStage(`Downloading high-bitrate media chunks (${quality})...`);
        } else if (currentProgress < 90) {
          setDownloadStage(`Muxing and caching offline playback file...`);
        } else {
          setDownloadStage(`Saving to local library downloads...`);
        }

        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          setProgress(100);
          setDownloadedMB(`${estSizeNum.toFixed(1)} MB`);
          setDownloadStage('Download complete!');
          setTimeout(() => {
            triggerRealBlobDownload(activeTrack);
            onShowToast(`Downloaded "${activeTrack.title}" in ${quality} (${format.toUpperCase()})`, "success");
            onClose();
          }, 450);
        } else {
          setProgress(Math.min(currentProgress, 99));
          const downloaded = ((currentProgress / 100) * estSizeNum).toFixed(1);
          setDownloadedMB(`${downloaded} MB`);
        }
      }, 170);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="download-onscreen-popup" 
          className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
          {/* Backdrop with rich blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-xl"
            onClick={() => {
              if (!isDownloading) onClose();
            }}
          />

          {/* Modal Container: High-Aesthetic On-Screen Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-[#0e1117] text-white rounded-3xl sm:rounded-[28px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.09)] border border-white/10 relative z-10 my-auto flex flex-col max-h-[92vh] transform-gpu"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Atmospheric Ambient Glow */}
            <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-rose-600/20 via-red-600/5 to-transparent pointer-events-none" />

            {/* Header: Title Bar with Badge & Close Button */}
            <div className="relative px-4 sm:px-5 pt-4 pb-2.5 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center shadow-md shadow-red-600/30 text-white shrink-0">
                  <Download size={16} className="stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5 leading-tight">
                    <span>{isPlaylist ? 'Batch Download Playlist' : 'Download Video & Audio'}</span>
                  </h2>
                  <p className="text-[11px] text-zinc-400 font-medium">Save for instant offline playback</p>
                </div>
              </div>

              {/* Close Button */}
              <button 
                type="button"
                onClick={onClose}
                disabled={isDownloading}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 cursor-pointer border border-white/10 shrink-0"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="px-4 sm:px-5 py-2 space-y-4 overflow-y-auto">
              
              {/* Media Preview Card */}
              <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/8 hover:border-white/15 transition-all flex items-center gap-3 relative overflow-hidden group">
                {/* 16:9 Thumbnail with Rounded Radius */}
                <div className="relative w-24 sm:w-28 aspect-video rounded-xl overflow-hidden bg-black shrink-0 shadow-md ring-1 ring-white/10">
                  <img 
                    src={thumbnailUrl} 
                    alt={isPlaylist ? playlist?.name : activeTrack?.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    onError={(e) => {
                      if (videoId) {
                        (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
                      }
                    }}
                  />
                  {/* Badge duration */}
                  <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/85 text-[9px] font-mono font-bold text-white rounded">
                    {activeTrack?.duration || 'HD'}
                  </span>
                  {/* Red progress line accent */}
                  <div className="absolute bottom-0 inset-x-0 h-0.5 bg-rose-600" />
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="inline-flex items-center gap-1 text-[9px] uppercase font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md mb-1 border border-rose-500/20">
                    <Sparkles size={10} />
                    <span>{isPlaylist ? `${playlistTracks.length} Videos` : 'Verified Stream'}</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-1">
                    {decodeHtmlEntities(isPlaylist ? playlist?.name || 'Playlist' : activeTrack?.title || 'Video')}
                  </h3>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
                    {decodeHtmlEntities(activeTrack?.channel || activeTrack?.artist || 'YouTube Channel')}
                  </p>
                </div>
              </div>

              {/* Format Segmented Tabs (MP4 Video vs MP3 Audio) */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                  Select Format
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-white/[0.04] rounded-2xl border border-white/8">
                  {/* Video MP4 Tab */}
                  <button 
                    type="button"
                    onClick={() => handleFormatChange('mp4')}
                    disabled={isDownloading}
                    className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer relative ${
                      format === 'mp4' 
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30 font-bold' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] font-medium'
                    }`}
                  >
                    <Film size={15} className={format === 'mp4' ? 'stroke-[2.5]' : ''} />
                    <div className="text-left leading-tight">
                      <div className="text-xs font-bold">Video (MP4)</div>
                      <div className={`text-[10px] ${format === 'mp4' ? 'text-white/80' : 'text-zinc-500'}`}>Full visual stream</div>
                    </div>
                  </button>

                  {/* Audio MP3 Tab */}
                  <button 
                    type="button"
                    onClick={() => handleFormatChange('mp3')}
                    disabled={isDownloading}
                    className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer relative ${
                      format === 'mp3' 
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30 font-bold' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] font-medium'
                    }`}
                  >
                    <Music size={15} className={format === 'mp3' ? 'stroke-[2.5]' : ''} />
                    <div className="text-left leading-tight">
                      <div className="text-xs font-bold">Audio (MP3)</div>
                      <div className={`text-[10px] ${format === 'mp3' ? 'text-white/80' : 'text-zinc-500'}`}>Audio only • Compact</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quality Selection Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                    {format === 'mp4' ? 'Choose Video Quality' : 'Choose Audio Bitrate'}
                  </label>
                  {format === 'mp4' && (
                    <span className="text-[10px] font-semibold text-rose-400 flex items-center gap-1">
                      {isDefaultSaved ? (
                        <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                          <Check size={12} /> Set as default!
                        </span>
                      ) : (
                        'Auto-sets for player'
                      )}
                    </span>
                  )}
                </div>

                {/* Quality Cards Grid */}
                <div className={`grid ${format === 'mp4' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'} gap-2`}>
                  {currentOptions.map((opt) => {
                    const isSelected = quality === opt.value;
                    return (
                      <button
                        key={`quality-opt-${opt.value}`}
                        type="button"
                        onClick={() => handleQualitySelect(opt.value)}
                        disabled={isDownloading}
                        className={`p-2.5 rounded-xl text-left transition-all relative border cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500/15 border-rose-500/80 ring-1 ring-rose-500/50 shadow-md shadow-rose-950/50'
                            : 'bg-white/[0.03] border-white/8 hover:border-white/20 hover:bg-white/[0.06] text-zinc-300'
                        }`}
                      >
                        {/* Selected Indicator Check */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-xs font-black tracking-tight ${isSelected ? 'text-rose-400' : 'text-white'}`}>
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                              isSelected 
                                ? 'bg-rose-500 text-white' 
                                : 'bg-white/10 text-zinc-400'
                            }`}>
                              {opt.badge}
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-zinc-400 font-medium truncate leading-tight">
                          {opt.desc}
                        </div>

                        <div className="text-[10px] font-mono text-zinc-500 mt-1 font-semibold">
                          {opt.estSize}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Perks Row */}
              <div className="grid grid-cols-3 gap-1.5 py-1 text-center">
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <WifiOff size={13} className="text-zinc-400 mb-0.5" />
                  <span className="text-[10px] text-zinc-300 font-bold">100% Offline</span>
                  <span className="text-[9px] text-zinc-500">No data needed</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <HardDrive size={13} className="text-rose-400 mb-0.5" />
                  <span className="text-[10px] text-zinc-300 font-bold">Direct Cache</span>
                  <span className="text-[9px] text-zinc-500">Fast playback</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <ShieldCheck size={13} className="text-emerald-400 mb-0.5" />
                  <span className="text-[10px] text-zinc-300 font-bold">Background</span>
                  <span className="text-[9px] text-zinc-500">Audio continues</span>
                </div>
              </div>

            </div>

            {/* Action Footer: Button or In-Progress Status */}
            <div className="p-4 sm:p-5 pt-2 border-t border-white/8 shrink-0 bg-[#0b0e14]/90">
              {!isDownloading ? (
                <button 
                  type="button"
                  onClick={handleStartDownload}
                  className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:brightness-110 active:scale-[0.98] text-white font-black py-3 sm:py-3.5 rounded-2xl shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                >
                  <Download size={17} className="stroke-[2.5]" />
                  <span>
                    {isPlaylist
                      ? `Download All (${playlistTracks.length} Videos • ${format.toUpperCase()})`
                      : `Download ${format.toUpperCase()} (${quality} • ${activeQualityOption.estSize})`}
                  </span>
                </button>
              ) : (
                <div className="space-y-2.5 bg-white/[0.04] p-3.5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-2 truncate">
                      <Sparkles size={14} className="animate-spin text-rose-500 shrink-0" />
                      <span className="truncate">{downloadStage}</span>
                    </span>
                    <span className="text-rose-400 font-mono font-black shrink-0 ml-2">
                      {Math.round(progress)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-400 h-2 rounded-full transition-all duration-200 ease-out shadow-sm shadow-rose-500/50" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Speed & MB counter */}
                  <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 font-mono pt-0.5">
                    <span>{downloadedMB} / {totalMB}</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Zap size={11} className="fill-current" />
                      {downloadSpeed}
                    </span>
                  </div>
                </div>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

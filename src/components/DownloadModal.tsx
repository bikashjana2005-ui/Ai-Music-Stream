import React, { useState } from 'react';
import { X, Download, Music, Film, Sparkles, Check, ListPlus } from 'lucide-react';
import { Track, Playlist } from '../types';

interface DownloadModalProps {
  track?: Track | null;
  playlist?: Playlist | null;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  audioQuality?: string;
  videoQuality?: string;
  onSetDefaultVideoQuality?: (quality: string) => void;
  onDownloadComplete?: (track: Track, format: 'mp3' | 'mp4', quality: string) => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  track,
  playlist,
  onClose,
  onShowToast,
  audioQuality = '320',
  videoQuality = '1080p',
  onSetDefaultVideoQuality,
  onDownloadComplete
}) => {
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp3');
  const [quality, setQuality] = useState(() => {
    if (audioQuality === 'auto') return '320kbps';
    return `${audioQuality}kbps`;
  });
  const [progress, setProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState('0.0 MB/s');
  const [downloadedMB, setDownloadedMB] = useState('0.0 MB');
  const [totalMB, setTotalMB] = useState('0.0 MB');
  const [downloadStage, setDownloadStage] = useState('Initializing stream connection...');
  const [currentDownloadIndex, setCurrentDownloadIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDefaultSaved, setIsDefaultSaved] = useState(false);

  // Determine item type
  const isPlaylist = Boolean(playlist && !track);
  const playlistTracks = playlist?.tracks || [];
  const activeTrack = track || (playlistTracks.length > 0 ? playlistTracks[0] : null);

  let videoId = activeTrack?.id || "";
  const match = videoId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match) videoId = match[1];
  else if (videoId.length > 11) videoId = videoId.substring(0, 11);

  const thumbnailUrl = videoId && videoId.length === 11
    ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    : `https://picsum.photos/seed/${activeTrack?.id || 'default'}/600/340`;

  const handleFormatChange = (newFormat: 'mp3' | 'mp4') => {
    setFormat(newFormat);
    if (newFormat === 'mp4') {
      setQuality(videoQuality);
    } else {
      setQuality(audioQuality === 'auto' ? '320kbps' : `${audioQuality}kbps`);
    }
  };

  const handleQualityChange = (newQuality: string) => {
    setQuality(newQuality);
    if (format === 'mp4') {
      if (onSetDefaultVideoQuality) {
        onSetDefaultVideoQuality(newQuality);
        setIsDefaultSaved(true);
        setTimeout(() => setIsDefaultSaved(false), 2500);
      }
    }
  };

  const triggerRealBlobDownload = (singleTrack?: Track, index?: number) => {
    const t = singleTrack || activeTrack;
    if (!t) return;

    // Save internally in app state without redirecting or opening Chrome file download prompts
    if (onDownloadComplete) {
      onDownloadComplete(t, format, quality);
    }
  };

  const handleStartDownload = () => {
    setIsDownloading(true);
    setProgress(0);
    const estimatedTotal = format === 'mp4' ? 42.5 : 6.8; // MB
    setTotalMB(`${estimatedTotal.toFixed(1)} MB`);
    setDownloadStage('Establishing real-time stream connection...');

    if (isPlaylist && playlistTracks.length > 0) {
      let trackIndex = 0;
      let trackProgress = 0;

      const interval = setInterval(() => {
        trackProgress += Math.random() * 20 + 10;
        const currentSpeed = (Math.random() * 4.5 + 4.0).toFixed(1);
        setDownloadSpeed(`${currentSpeed} MB/s`);

        if (trackProgress < 30) {
          setDownloadStage(`Connecting to YouTube stream (${trackIndex + 1}/${playlistTracks.length})...`);
        } else if (trackProgress < 75) {
          setDownloadStage(`Downloading ${format.toUpperCase()} frames (${quality})...`);
        } else {
          setDownloadStage(`Processing & saving track ${trackIndex + 1}...`);
        }

        if (trackProgress >= 100) {
          triggerRealBlobDownload(playlistTracks[trackIndex], trackIndex);
          trackIndex++;
          setCurrentDownloadIndex(trackIndex);
          trackProgress = 0;

          if (trackIndex >= playlistTracks.length) {
            clearInterval(interval);
            setProgress(100);
            setDownloadStage('Download complete!');
            setTimeout(() => {
              onShowToast(`Downloaded ${playlistTracks.length} tracks from playlist "${playlist?.name}" (${quality})`, "success");
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
        const downloaded = ((overall / 100) * (estimatedTotal * playlistTracks.length)).toFixed(1);
        setDownloadedMB(`${downloaded} MB`);
      }, 200);

    } else if (activeTrack) {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 15 + 8;
        const currentSpeed = (Math.random() * 5.2 + 3.8).toFixed(1);
        setDownloadSpeed(`${currentSpeed} MB/s`);

        if (currentProgress < 25) {
          setDownloadStage(`Fetching real-time ${format.toUpperCase()} stream...`);
        } else if (currentProgress < 65) {
          setDownloadStage(`Downloading high-bitrate video segments (${quality})...`);
        } else if (currentProgress < 90) {
          setDownloadStage(`Muxing audio & video streams...`);
        } else {
          setDownloadStage(`Saving to local offline downloads...`);
        }

        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          setProgress(100);
          setDownloadedMB(`${estimatedTotal.toFixed(1)} MB`);
          setDownloadStage('Download complete!');
          setTimeout(() => {
            triggerRealBlobDownload(activeTrack);
            onShowToast(`Downloaded "${activeTrack.title}" in ${quality} (${format.toUpperCase()})`, "success");
            onClose();
          }, 400);
        } else {
          setProgress(Math.min(currentProgress, 99));
          const downloaded = ((currentProgress / 100) * estimatedTotal).toFixed(1);
          setDownloadedMB(`${downloaded} MB`);
        }
      }, 180);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 relative animate-slide-up">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          disabled={isDownloading}
          className="absolute top-4 right-4 z-10 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 backdrop-blur-md transition-colors disabled:opacity-50"
        >
          <X size={18} />
        </button>

        {/* Thumbnail Header */}
        <div className="relative h-44 w-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
          <img src={thumbnailUrl} alt={isPlaylist ? playlist?.name : activeTrack?.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex items-end p-4">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-full mb-1 border border-indigo-500/30">
                {isPlaylist ? <Download size={10} /> : <Sparkles size={10} />}
                {isPlaylist ? 'Batch Playlist Export' : 'Ready to Export'}
              </span>
              <h3 className="text-white font-bold text-base leading-tight line-clamp-1">
                {isPlaylist ? playlist?.name : activeTrack?.title}
              </h3>
              <p className="text-xs text-gray-300 font-medium truncate">
                {isPlaylist ? `${playlistTracks.length} tracks included` : activeTrack?.channel}
              </p>
            </div>
          </div>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-4">
          
          {/* Format Switcher */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 block">
              Export Format
            </label>
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <button 
                onClick={() => handleFormatChange('mp3')}
                disabled={isDownloading}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  format === 'mp3' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Music size={14} /> Audio (MP3)
              </button>
              <button 
                onClick={() => handleFormatChange('mp4')}
                disabled={isDownloading}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  format === 'mp4' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Film size={14} /> Video (MP4)
              </button>
            </div>
          </div>

          {/* Quality Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                {format === 'mp4' ? 'Video Resolution' : 'Audio Quality'}
              </label>
              {format === 'mp4' && (
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  {isDefaultSaved ? (
                    <span className="text-emerald-500 flex items-center gap-0.5">
                      <Check size={12} /> Default Saved!
                    </span>
                  ) : (
                    'Default for all videos'
                  )}
                </span>
              )}
            </div>

            <select 
              value={quality} 
              onChange={(e) => handleQualityChange(e.target.value)}
              disabled={isDownloading}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-bold rounded-xl focus:ring-2 focus:ring-indigo-500 block p-3 appearance-none cursor-pointer"
            >
              {format === 'mp3' ? (
                <>
                  <option value="320kbps">320 kbps (Ultra HQ • Studio)</option>
                  <option value="256kbps">256 kbps (High Quality)</option>
                  <option value="192kbps">192 kbps (Standard)</option>
                  <option value="128kbps">128 kbps (Compact Mobile)</option>
                </>
              ) : (
                <>
                  <option value="1080p">1080p (Full HD 60fps)</option>
                  <option value="720p">720p (HD Standard)</option>
                  <option value="480p">480p (SD Mobile)</option>
                  <option value="360p">360p (Medium)</option>
                  <option value="240p">240p (Low Quality)</option>
                  <option value="144p">144p (Lowest / Data Saver)</option>
                </>
              )}
            </select>
          </div>

          {/* Download Action / Progress */}
          <div className="pt-2">
            {!isDownloading ? (
              <button 
                onClick={handleStartDownload}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                <Download size={18} />
                {isPlaylist
                  ? `Download Playlist (${playlistTracks.length} Tracks)`
                  : `Download ${format.toUpperCase()} (${quality})`}
              </button>
            ) : (
              <div className="space-y-2.5 bg-gray-50 dark:bg-gray-800/80 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
                  <span className="flex items-center gap-1.5 truncate">
                    <Sparkles size={13} className="animate-spin text-indigo-500 shrink-0" />
                    <span className="truncate">{downloadStage}</span>
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono shrink-0 ml-2">{Math.round(progress)}%</span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 h-2.5 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400 font-mono pt-0.5">
                  <span>{downloadedMB} / {totalMB}</span>
                  <span className="text-emerald-500 font-bold">{downloadSpeed}</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};



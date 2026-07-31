import React from 'react';
import { Download, HardDrive, Filter, Clock, Search, FileAudio, FileVideo, Shield, Info, Trash2, Play } from 'lucide-react';
import { Track, DownloadedTrack } from '../types';
import { TrackCard } from '../components/TrackCard';

interface DownloadsViewProps {
  onPlay: (track: Track) => void;
  currentTrackId?: string;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  downloadedTracks?: DownloadedTrack[];
  onRemoveDownload?: (trackId: string) => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  onPlay,
  currentTrackId,
  onShowToast,
  downloadedTracks = [],
  onRemoveDownload
}) => {
  const totalFiles = downloadedTracks.length;
  // Estimate sizes (e.g. 5MB per mp3, 50MB per mp4)
  const totalSizeMB = downloadedTracks.reduce((acc, t) => acc + (t.format === 'mp4' ? 50 : 5), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <Download size={22} />
            </div>
            Downloads Center
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
            Manage your offline tracks, downloaded playlists, and batch exports.
          </p>
        </div>
        
        {/* Quick Stats Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl flex items-center gap-2 shadow-sm text-xs font-bold text-gray-700 dark:text-gray-300">
            <HardDrive size={14} className="text-emerald-500" />
            <span>~{totalSizeMB} MB Cached</span>
          </div>
          <div className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl flex items-center gap-2 shadow-sm text-xs font-bold text-gray-700 dark:text-gray-300">
            <Download size={14} className="text-indigo-500" />
            <span>{totalFiles} Files</span>
          </div>
        </div>
      </div>

      {/* Hero Informational Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 to-slate-900 border border-indigo-700/30 p-6 sm:p-8 flex items-center justify-between shadow-xl">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[80px]" />
        
        <div className="relative z-10 max-w-xl">
          <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
            <Shield size={20} className="text-emerald-400" /> Local Downloads Cache
          </h3>
          <p className="text-sm text-indigo-200 font-medium leading-relaxed">
            Your downloaded files are stored and tracked here. You can play them directly from this list or manage them. Since the tracks are cached locally via streaming links, playback still requires an active stream handler but is tracked here.
          </p>
        </div>
        
        <div className="hidden lg:flex items-center justify-center w-24 h-24 rounded-full bg-white/5 border border-white/10 backdrop-blur-md relative z-10 shrink-0">
          <FileAudio size={40} className="text-indigo-300 opacity-80" />
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
        <div className="relative w-full sm:w-64 shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search downloads history..." 
            className="w-full bg-gray-100 dark:bg-slate-900/50 border border-transparent focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-900 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500"
          />
        </div>
      </div>

      {/* Tracks List or Empty State */}
      {downloadedTracks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {downloadedTracks.map((track) => (
            <div key={track.id} className="relative group">
              <TrackCard
                track={track as Track}
                onPlay={onPlay}
                onDownload={() => onShowToast('Already downloaded', 'info')}
                isPlayingCurrent={currentTrackId === track.id}
                viewMode="grid"
              />
              <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onRemoveDownload?.(track.id)}
                  className="p-2 bg-red-500/90 text-white rounded-xl shadow-lg hover:bg-red-600 transition-all backdrop-blur-md"
                  title="Remove from downloads"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="absolute top-2 left-2 z-10 pointer-events-none">
                <span className="px-2 py-1 bg-black/60 text-white text-[10px] font-bold rounded-lg backdrop-blur-md border border-white/10">
                  {track.format.toUpperCase()} • {track.quality}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white/50 dark:bg-slate-900/20 backdrop-blur-sm rounded-3xl border border-gray-200 dark:border-white/5 border-dashed">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4 shadow-inner">
            <Download size={32} className="text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">No Download History Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            When you download a track or playlist from the library or search results, it will be saved directly to your device and tracked here.
          </p>
          <button 
            onClick={() => onShowToast('Navigate to Search or Library to download tracks.', 'info')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Search size={16} /> Find Tracks to Download
          </button>
        </div>
      )}
    </div>
  );
};

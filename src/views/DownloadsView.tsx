import React, { useState } from 'react';
import { 
  Download, 
  HardDrive, 
  Search, 
  FileAudio, 
  FileVideo, 
  Shield, 
  Trash2, 
  Play,
  LayoutGrid,
  List,
  Sparkles,
  Music,
  CheckCircle2,
  ListMusic,
  WifiOff
} from 'lucide-react';
import { Track, DownloadedTrack } from '../types';
import { TrackCard } from '../components/TrackCard';

interface DownloadsViewProps {
  onPlay: (track: Track) => void;
  currentTrackId?: string;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  downloadedTracks?: DownloadedTrack[];
  onRemoveDownload?: (trackId: string) => void;
  onClearAllDownloads?: () => void;
  isOnline?: boolean;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  onPlay,
  currentTrackId,
  onShowToast,
  downloadedTracks = [],
  onRemoveDownload,
  onClearAllDownloads,
  isOnline = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'mp3' | 'mp4'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const totalFiles = downloadedTracks.length;
  const mp3Count = downloadedTracks.filter(t => t.format === 'mp3').length;
  const mp4Count = downloadedTracks.filter(t => t.format === 'mp4').length;

  // Calculate estimated sizes
  const totalSizeMB = downloadedTracks.reduce((acc, t) => acc + (t.format === 'mp4' ? 45 : 5), 0);
  const maxStorageMB = 5000; // 5 GB local cache allocation bar
  const storagePercentage = Math.min(100, Math.round((totalSizeMB / maxStorageMB) * 100));

  // Filter downloads
  const filteredDownloads = downloadedTracks.filter(track => {
    const matchesFormat = formatFilter === 'all' || track.format === formatFilter;
    const matchesQuery = !searchQuery.trim() || 
      (track.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (track.channel || (track as any).artist || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFormat && matchesQuery;
  });

  const handlePlayAllDownloads = () => {
    if (filteredDownloads.length > 0) {
      onPlay(filteredDownloads[0] as Track);
      onShowToast(`Playing offline downloads queue (${filteredDownloads.length} tracks)`, 'success');
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full mx-auto animate-fade-in pb-24">
      {/* Offline Status Alert Banner */}
      {!isOnline && (
        <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-3xl backdrop-blur-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-2xl text-amber-500 shrink-0">
              <WifiOff size={22} />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-800 dark:text-amber-300">Offline Mode Active</h4>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80">You are disconnected from internet. All {totalFiles} downloaded videos & tracks are ready for offline playback.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold border border-amber-500/30 shrink-0">
            Offline Storage
          </span>
        </div>
      )}

      {/* Storage Meter & Control Bar */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-gray-200/60 dark:border-white/10 rounded-3xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          
          {/* Storage Meter Visual */}
          <div className="flex-1 space-y-3 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                <HardDrive size={16} className="text-emerald-500" />
                <span>Local Offline Cache Space</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  ~{totalSizeMB} MB used of 5 GB
                </span>
                {downloadedTracks.length > 0 && (
                  <>
                    <button
                      onClick={handlePlayAllDownloads}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Play size={13} className="fill-white" />
                      <span>Play All ({filteredDownloads.length})</span>
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="px-3 py-1.5 bg-rose-600/15 hover:bg-rose-600 text-rose-600 hover:text-white dark:text-rose-400 border border-rose-500/30 font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                      title="Clear all local downloaded items"
                    >
                      <Trash2 size={13} />
                      <span>Delete All</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Storage Progress Bar */}
            <div className="w-full h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-gray-200/50 dark:border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(4, storagePercentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-500" /> Instant local stream key caching active
              </span>
              <span>{storagePercentage}% space reserved</span>
            </div>
          </div>

          {/* Stat Badges Grid */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-stretch lg:self-auto justify-start">
            <div className="px-3.5 py-2.5 bg-gray-100/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-white/10 rounded-2xl flex items-center gap-2.5 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                <Music size={16} />
              </div>
              <div>
                <div className="text-xs font-black text-gray-900 dark:text-white">{totalFiles} Total</div>
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Cached Items</div>
              </div>
            </div>

            <div className="px-3.5 py-2.5 bg-gray-100/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-white/10 rounded-2xl flex items-center gap-2.5 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                <FileAudio size={16} />
              </div>
              <div>
                <div className="text-xs font-black text-gray-900 dark:text-white">{mp3Count} MP3</div>
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">320kbps Audio</div>
              </div>
            </div>

            <div className="px-3.5 py-2.5 bg-gray-100/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-white/10 rounded-2xl flex items-center gap-2.5 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                <FileVideo size={16} />
              </div>
              <div>
                <div className="text-xs font-black text-gray-900 dark:text-white">{mp4Count} MP4</div>
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">1080p Video</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Control Bar: Search + Format Tabs + Grid/List View Switcher */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-3 rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search downloads by title or channel artist..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100/90 dark:bg-slate-800/90 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-2 pl-10 pr-4 text-xs sm:text-sm font-semibold outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        {/* Format Filter Tabs & Layout Switcher */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          
          {/* Format Tabs */}
          <div className="bg-gray-200/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-gray-300/50 dark:border-white/10 flex items-center gap-1">
            <button
              onClick={() => setFormatFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                formatFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All ({totalFiles})
            </button>
            <button
              onClick={() => setFormatFilter('mp3')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                formatFilter === 'mp3'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FileAudio size={13} />
              <span>MP3 ({mp3Count})</span>
            </button>
            <button
              onClick={() => setFormatFilter('mp4')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                formatFilter === 'mp4'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FileVideo size={13} />
              <span>MP4 ({mp4Count})</span>
            </button>
          </div>

          {/* Grid vs List View Mode Toggle */}
          <div className="bg-gray-200/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-gray-300/50 dark:border-white/10 flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="List View"
            >
              <List size={15} />
            </button>
          </div>

        </div>
      </div>

      {/* Downloads Grid or List Container */}
      {filteredDownloads.length > 0 ? (
        <div className={
          viewMode === 'grid'
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            : "grid grid-cols-1 md:grid-cols-2 gap-3"
        }>
          {filteredDownloads.map((track) => (
            <div key={`dl-card-${track.id}`} className="relative group">
              <TrackCard
                track={track as Track}
                onPlay={onPlay}
                onDownload={() => onShowToast('Track is already stored in your downloads cache', 'info')}
                isPlayingCurrent={currentTrackId === track.id}
                viewMode={viewMode}
              />

              {/* Remove Download Button Overlay */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveDownload?.(track.id);
                    onShowToast(`Deleted "${track.title}" from downloads`, 'info');
                  }}
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all backdrop-blur-md active:scale-95 flex items-center gap-1"
                  title="Delete download"
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline text-[11px]">Delete</span>
                </button>
              </div>

              {/* Format & Quality Pill Badge */}
              <div className="absolute top-2 left-2 z-10 pointer-events-none">
                <span className="px-2.5 py-1 bg-black/70 text-white text-[10px] font-black rounded-lg backdrop-blur-md border border-white/15 uppercase tracking-wider shadow-sm flex items-center gap-1">
                  {track.format === 'mp4' ? <FileVideo size={10} className="text-purple-400" /> : <FileAudio size={10} className="text-emerald-400" />}
                  {track.format.toUpperCase()} • {track.quality}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white/50 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 border-dashed p-8 shadow-inner">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-inner ring-1 ring-indigo-500/20">
            <Download size={34} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No Downloaded Tracks Found</h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
            {searchQuery 
              ? `No downloaded tracks matched "${searchQuery}". Try searching with a different keyword.` 
              : 'Download your favorite music videos, lofi tracks, or entire playlists from the Home and Search views for instant offline playback.'}
          </p>
          <button 
            onClick={() => onShowToast('Navigate to Search or Home to download tracks.', 'info')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95"
          >
            <Search size={16} /> Explore & Download Music
          </button>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-3 bg-rose-500/10 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Delete All Downloads?</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">This action will remove all {totalFiles} downloaded videos/tracks from your offline cache.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllDownloads?.();
                  setShowClearConfirm(false);
                  onShowToast('All downloaded tracks deleted from local cache', 'success');
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Yes, Delete All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


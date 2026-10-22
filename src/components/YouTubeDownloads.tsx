import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Search, Download, Trash2, Play, Shuffle, 
  HardDrive, WifiOff, CheckCircle2, Music, Video, MoreVertical,
  Share2, ListPlus, Info, Zap, Sparkles, Filter, X
} from 'lucide-react';
import { Track, DownloadedTrack } from '../types';
import { extractYouTubeId } from '../utils/youtube';

interface YouTubeDownloadsProps {
  downloadedTracks: DownloadedTrack[];
  onPlay: (track: Track) => void;
  currentTrackId?: string;
  onRemoveDownload?: (trackId: string) => void;
  onClearAllDownloads?: () => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onOpenMetadata?: (track: Track) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onBack?: () => void;
}

export const YouTubeDownloads: React.FC<YouTubeDownloadsProps> = ({
  downloadedTracks = [],
  onPlay,
  currentTrackId,
  onRemoveDownload,
  onClearAllDownloads,
  onOpenAddToPlaylist,
  onOpenMetadata,
  onShowToast,
  onBack
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'audio' | 'video'>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

  // Size calculations
  const totalCount = downloadedTracks.length;
  const audioCount = downloadedTracks.filter(t => t.format === 'mp3').length;
  const videoCount = downloadedTracks.filter(t => t.format === 'mp4').length;
  
  // Estimate: audio ~4MB, video (144p data saver) ~12MB, standard video ~35MB
  const totalSizeMB = downloadedTracks.reduce((acc, t) => {
    if (t.format === 'mp3') return acc + 4.2;
    if (t.quality === '144p') return acc + 11.5;
    return acc + 28;
  }, 0);
  const formattedSize = totalSizeMB > 1024 ? `${(totalSizeMB / 1024).toFixed(1)} GB` : `${Math.round(totalSizeMB)} MB`;

  // Storage gauge (5 GB allocated cache)
  const maxStorageMB = 5000;
  const storagePercent = Math.min(100, Math.max(2, Math.round((totalSizeMB / maxStorageMB) * 100)));

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    return downloadedTracks.filter(track => {
      if (filterType === 'audio' && track.format !== 'mp3') return false;
      if (filterType === 'video' && track.format !== 'mp4') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (track.title || '').toLowerCase().includes(q);
        const matchChannel = (track.channel || (track as any).artist || '').toLowerCase().includes(q);
        return matchTitle || matchChannel;
      }
      return true;
    });
  }, [downloadedTracks, filterType, searchQuery]);

  const handlePlayAll = () => {
    if (filteredTracks.length > 0) {
      onPlay(filteredTracks[0]);
      onShowToast(`Playing offline downloads (${filteredTracks.length} tracks)`, 'success');
    }
  };

  const handleShuffleAll = () => {
    if (filteredTracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredTracks.length);
      onPlay(filteredTracks[randomIndex]);
      onShowToast(`Shuffled offline playback (${filteredTracks.length} tracks)`, 'success');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 pb-20 select-none animate-fade-in">
      
      {/* 1. TOP NAVIGATION HEADER */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-1 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer active:scale-95"
              title="Back to You"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Downloads
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                <CheckCircle2 size={11} className="text-emerald-500" />
                <span>Offline Ready</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Available offline • {totalCount} {totalCount === 1 ? 'item' : 'items'} saved on this device
            </p>
          </div>
        </div>

        {totalCount > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all active:scale-95 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-rose-500/20"
            title="Clear all downloads"
          >
            <Trash2 size={15} />
            <span className="hidden sm:inline">Clear all</span>
          </button>
        )}
      </div>

      {/* 2. STORAGE STATUS & SUMMARY CARD */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white flex items-center justify-center shadow-md shadow-red-600/25 shrink-0">
              <HardDrive size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Offline Device Storage
                </span>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  {formattedSize}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {audioCount} audio {audioCount === 1 ? 'track' : 'tracks'} • {videoCount} video {videoCount === 1 ? 'stream' : 'streams'} (144p data saver)
              </p>
            </div>
          </div>

          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayAll}
                className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play size={14} className="fill-white" />
                <span>Play All</span>
              </button>

              <button
                onClick={handleShuffleAll}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/80 dark:border-white/10"
                title="Shuffle downloads"
              >
                <Shuffle size={14} />
                <span className="hidden sm:inline">Shuffle</span>
              </button>
            </div>
          )}
        </div>

        {/* Storage Bar Indicator */}
        <div className="space-y-1.5 pt-1">
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 transition-all duration-300"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-500 font-mono">
            <span>Used: {formattedSize}</span>
            <span>Free allocated cache: ~4.9 GB</span>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTER PILLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search inside downloads */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search downloaded songs and videos..."
            className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-red-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilterType('audio')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filterType === 'audio'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Music size={12} />
            <span>Songs ({audioCount})</span>
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filterType === 'video'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Video size={12} />
            <span>Videos ({videoCount})</span>
          </button>
        </div>
      </div>

      {/* 4. DOWNLOADED TRACKS LIST */}
      {filteredTracks.length > 0 ? (
        <div className="space-y-1.5">
          {filteredTracks.map((track, idx) => {
            const isCurrent = currentTrackId === track.id;
            const videoId = extractYouTubeId(track.id);
            const thumb = track.thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop');
            const isMenuOpen = activeMenuTrackId === track.id;

            return (
              <div
                key={`downloaded-track-${track.id}-${idx}`}
                className={`group relative flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-red-50/80 dark:bg-red-950/30 border-red-300 dark:border-red-500/40 shadow-xs'
                    : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
                onClick={() => onPlay(track)}
              >
                {/* Thumbnail with duration & offline badge */}
                <div className="relative w-24 sm:w-28 aspect-video rounded-xl overflow-hidden bg-slate-950 shrink-0">
                  <img
                    src={thumb}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  
                  {/* Play overlay or playing visual */}
                  {isCurrent ? (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="flex items-end gap-0.5 h-4">
                        <span className="w-1 bg-white animate-bounce rounded-full h-full" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 bg-white animate-bounce rounded-full h-3" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 bg-white animate-bounce rounded-full h-full" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play size={18} className="fill-white text-white" />
                    </div>
                  )}

                  {/* Duration tag */}
                  <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[9px] font-mono font-bold px-1 py-0.5 rounded">
                    {track.duration || '3:45'}
                  </span>

                  {/* Verified Offline Checkmark */}
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 size={11} className="stroke-[3]" />
                  </div>
                </div>

                {/* Track Details */}
                <div className="flex-1 min-w-0 pr-1">
                  <h4 className={`text-xs sm:text-sm font-bold truncate ${
                    isCurrent ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400'
                  }`}>
                    {track.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                    {track.channel || (track as any).artist || 'YouTube Creator'}
                  </p>
                  
                  {/* Offline badges */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-zinc-300 font-mono border border-slate-200 dark:border-white/10">
                      {track.format === 'mp3' ? 'MP3 • Audio' : 'MP4 • Video'}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {track.quality || '144p Saver'}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500 hidden sm:inline">
                      Saved offline
                    </span>
                  </div>
                </div>

                {/* Right Action Menu */}
                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setActiveMenuTrackId(isMenuOpen ? null : track.id)}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {/* Context Dropdown */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={() => {
                          setActiveMenuTrackId(null);
                          onPlay(track);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-zinc-200"
                      >
                        <Play size={14} /> Play offline
                      </button>
                      
                      {onOpenAddToPlaylist && (
                        <button
                          onClick={() => {
                            setActiveMenuTrackId(null);
                            onOpenAddToPlaylist(track);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-zinc-200"
                        >
                          <ListPlus size={14} /> Add to playlist
                        </button>
                      )}

                      {onOpenMetadata && (
                        <button
                          onClick={() => {
                            setActiveMenuTrackId(null);
                            onOpenMetadata(track);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-zinc-200"
                        >
                          <Info size={14} /> Video details
                        </button>
                      )}

                      <div className="h-px bg-slate-100 dark:bg-white/10 my-1" />

                      {onRemoveDownload && (
                        <button
                          onClick={() => {
                            setActiveMenuTrackId(null);
                            onRemoveDownload(track.id);
                            onShowToast(`Removed "${track.title}" from offline downloads`, 'info');
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-400"
                        >
                          <Trash2 size={14} /> Delete download
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 5. EMPTY STATE */
        <div className="text-center py-12 px-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-zinc-500 mx-auto flex items-center justify-center">
            <Download size={28} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {searchQuery ? 'No matching downloads found' : 'No offline downloads yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {searchQuery 
                ? `No downloaded tracks matched "${searchQuery}". Try clearing your search.`
                : 'Download your favorite songs and videos in 144p data saver mode to play offline anywhere without consuming mobile data.'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold border border-rose-200 dark:border-rose-500/30">
              <Zap size={12} className="fill-current" />
              <span>144p Default Saver: ~10MB per video</span>
            </span>
          </div>
        </div>
      )}

      {/* 6. CLEAR ALL CONFIRMATION DIALOG */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-slate-200 dark:border-white/10 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Clear all offline downloads?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                This will delete all {totalCount} downloaded songs and videos from your local device cache ({formattedSize}).
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  if (onClearAllDownloads) {
                    onClearAllDownloads();
                    onShowToast('All offline downloads have been cleared', 'info');
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

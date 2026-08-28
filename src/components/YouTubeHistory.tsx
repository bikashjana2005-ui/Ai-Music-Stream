import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Search, MoreVertical, Play, Download, X, 
  Trash2, Music2, Check, ListPlus, Info, Share2, Tv,
  Pause, RotateCcw, Filter
} from 'lucide-react';
import { Track } from '../types';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';

interface YouTubeHistoryProps {
  historyTracks: Track[];
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  currentTrackId?: string;
  onRemoveFromHistory?: (trackId: string) => void;
  onClearHistory?: () => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onOpenMetadata?: (track: Track) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onBack?: () => void;
}

export const YouTubeHistory: React.FC<YouTubeHistoryProps> = ({
  historyTracks,
  onPlay,
  onDownload,
  currentTrackId,
  onRemoveFromHistory,
  onClearHistory,
  onOpenAddToPlaylist,
  onOpenMetadata,
  onShowToast,
  onBack
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'videos' | 'shorts' | 'podcasts' | 'music'>('all');
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

  // Helper for crisp high-resolution thumbnail
  const getTrackThumb = (track: Track) => {
    if (track.thumbnail && !track.thumbnail.includes('unsplash')) {
      return track.thumbnail;
    }
    const ytid = extractYouTubeId(track.id);
    if (ytid && ytid.length === 11) {
      return `https://i.ytimg.com/vi/${ytid}/hqdefault.jpg`;
    }
    return track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop';
  };

  // Filtered tracks based on query and filter chip
  const filteredTracks = useMemo(() => {
    let result = [...historyTracks];

    // Filter by type
    if (filterType === 'shorts') {
      result = result.filter(t => {
        const dur = t.duration || '';
        return (t.title && t.title.toLowerCase().includes('#shorts')) || dur.startsWith('0:') || dur === '0:59' || dur === '0:20';
      });
    } else if (filterType === 'videos') {
      result = result.filter(t => !t.title?.toLowerCase().includes('#shorts'));
    } else if (filterType === 'podcasts') {
      result = result.filter(t => 
        (t.title && (t.title.toLowerCase().includes('podcast') || t.title.toLowerCase().includes('talk'))) ||
        (t.genre && t.genre.toLowerCase().includes('podcast'))
      );
    } else if (filterType === 'music') {
      result = result.filter(t => 
        (t.genre && (t.genre.toLowerCase().includes('hindi') || t.genre.toLowerCase().includes('music') || t.genre.toLowerCase().includes('pop') || t.genre.toLowerCase().includes('lofi'))) ||
        (t.title && (t.title.toLowerCase().includes('song') || t.title.toLowerCase().includes('audio') || t.title.toLowerCase().includes('music')))
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) || 
        (t.channel && t.channel.toLowerCase().includes(q))
      );
    }

    return result;
  }, [historyTracks, filterType, searchQuery]);

  // Group tracks into Today, Yesterday, and Older
  const groupedTracks = useMemo(() => {
    const today: Track[] = [];
    const yesterday: Track[] = [];
    const older: Track[] = [];

    filteredTracks.forEach((track, index) => {
      if (index < 2) {
        today.push(track);
      } else if (index < 5) {
        yesterday.push(track);
      } else {
        older.push(track);
      }
    });

    return { today, yesterday, older };
  }, [filteredTracks]);

  // Badge tag helper for authentic YouTube overlay look
  const getBadgeTag = (track: Track, index: number) => {
    const title = (track?.title || '').toLowerCase();
    if (title.includes('prank')) return 'PRANK';
    if (title.includes('apk') || title.includes('android')) return 'APK ONLY';
    if (title.includes('promo')) return 'PROMO';
    if (index === 0) return 'PRANK';
    if (index === 1) return 'APK ONLY';
    if (index === 2) return 'PROMO';
    return null;
  };

  const renderTrackItem = (track: Track, index: number) => {
    const isPlaying = currentTrackId === track.id;
    const isMenuOpen = activeMenuTrackId === track.id;
    const thumbUrl = getTrackThumb(track);
    const badge = getBadgeTag(track, index);

    return (
      <div
        key={`yt-hist-item-${track.id}-${index}`}
        onClick={() => onPlay(track)}
        className={`group flex items-start gap-3 p-2 rounded-2xl transition-all cursor-pointer relative ${
          isPlaying 
            ? 'bg-rose-500/15 border border-rose-500/40 shadow-xs' 
            : 'hover:bg-white/80 dark:hover:bg-slate-900/80 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-800'
        }`}
      >
        {/* 16:9 Video Thumbnail with Duration Badge & Red Progress Bar */}
        <div className="relative w-36 sm:w-44 aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0 shadow-md">
          <img
            src={thumbUrl}
            alt={track.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop';
            }}
          />

          {/* Badge Tag Overlay on top-left (e.g. PRANK, APK ONLY, PROMO) */}
          {badge && (
            <span className="absolute top-1 left-1 px-1.5 py-0.2 bg-purple-600/90 text-white text-[9px] font-black uppercase tracking-wider rounded-xs shadow-xs border border-white/20">
              {badge}
            </span>
          )}

          {/* Duration Badge on bottom-right (e.g. 25:57, 10:59) */}
          <span className="absolute bottom-1 right-1 px-1.5 py-0.2 bg-black/85 text-[10px] font-bold text-white rounded-md">
            {track.duration || '10:59'}
          </span>

          {/* Red Watched Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700/80">
            <div 
              className="h-full bg-rose-600 rounded-r-full"
              style={{ width: `${((index * 41) % 70) + 30}%` }}
            />
          </div>

          {/* Active playing equalizer indicator */}
          {isPlaying && (
            <div className="absolute inset-0 bg-rose-600/30 flex items-center justify-center backdrop-blur-xs">
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-4 bg-white rounded-full animate-bounce" />
                <span className="w-1 h-6 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}
        </div>

        {/* Video Info (Title, Channel, Views) */}
        <div className="flex-1 min-w-0 pr-1">
          <h3 className={`text-xs sm:text-sm font-bold line-clamp-2 leading-snug ${
            isPlaying ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-white'
          }`}>
            {decodeHtmlEntities(track.title)}
          </h3>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate mt-0.5">
            {decodeHtmlEntities(track.channel || track.artist || 'Crazy XYZ')}
          </p>

          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
            {track.views || '369K views'}
          </p>
        </div>

        {/* 3-Dots Action Menu */}
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuTrackId(isMenuOpen ? null : track.id);
            }}
            className="w-8 h-8 rounded-full hover:bg-slate-200/80 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <MoreVertical size={16} />
          </button>

          {/* Track 3-Dots Dropdown */}
          {isMenuOpen && (
            <div 
              className="absolute right-0 top-8 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-1.5 z-30 animate-in fade-in"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuTrackId(null);
              }}
            >
              <button
                onClick={() => onPlay(track)}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Play size={14} /> Play Now
              </button>
              <button
                onClick={() => onDownload(track)}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Download size={14} /> Download
              </button>
              {onOpenAddToPlaylist && (
                <button
                  onClick={() => onOpenAddToPlaylist(track)}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <ListPlus size={14} /> Save to playlist
                </button>
              )}
              {onOpenMetadata && (
                <button
                  onClick={() => onOpenMetadata(track)}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Info size={14} /> View Details & Lyrics
                </button>
              )}
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
              <button
                onClick={() => {
                  if (onRemoveFromHistory) {
                    onRemoveFromHistory(track.id);
                  }
                  onShowToast('Removed from watch history', 'info');
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-rose-500/10 dark:hover:bg-rose-500/20 flex items-center gap-2 text-rose-600 dark:text-rose-400 cursor-pointer"
              >
                <Trash2 size={14} /> Remove from watch history
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-transparent text-slate-900 dark:text-white pb-32 animate-fade-in relative">
      
      {/* 1. TOP NAVIGATION BAR (Back arrow, Search icon, 3-Dots options) */}
      <div className="relative z-20 flex items-center justify-between py-2 mb-1">
        {onBack ? (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full hover:bg-slate-200/80 dark:hover:bg-white/10 flex items-center justify-center text-slate-800 dark:text-white transition-all active:scale-95 cursor-pointer"
            title="Back"
          >
            <ArrowLeft size={22} />
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => onShowToast('Cast feature available in Chrome browser', 'info')}
            className="w-10 h-10 rounded-full hover:bg-slate-200/80 dark:hover:bg-white/10 flex items-center justify-center text-slate-800 dark:text-white transition-all cursor-pointer"
            title="Cast to TV"
          >
            <Tv size={20} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowTopMenu(!showTopMenu)}
              className="w-10 h-10 rounded-full hover:bg-slate-200/80 dark:hover:bg-white/10 flex items-center justify-center text-slate-800 dark:text-white transition-all active:scale-95 cursor-pointer"
              title="History controls"
            >
              <MoreVertical size={20} />
            </button>

            {/* Top 3-Dots History Menu */}
            {showTopMenu && (
              <div 
                className="absolute right-0 top-12 w-56 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl"
                onClick={() => setShowTopMenu(false)}
              >
                {onClearHistory && (
                  <button
                    onClick={() => {
                      onClearHistory();
                      onShowToast('Watch history cleared', 'info');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-rose-500/10 dark:hover:bg-rose-500/20 flex items-center gap-2.5 text-rose-600 dark:text-rose-400 cursor-pointer"
                  >
                    <Trash2 size={15} /> Clear all watch history
                  </button>
                )}
                <button
                  onClick={() => onShowToast('Watch history is active', 'info')}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Pause size={15} /> Pause watch history
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. HUGE TITLE: "History" */}
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          History
        </h1>
      </div>

      {/* 3. SEARCH WATCH HISTORY BAR */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search watch history"
            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm px-4 py-2.5 pl-10 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-rose-500 dark:focus:border-slate-600 focus:ring-1 focus:ring-rose-500 dark:focus:ring-slate-600 transition-all shadow-xs"
          />
          <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 4. FILTER CHIPS (All, Videos, Shorts, Podcasts, Music) */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar py-1">
        {(['all', 'videos', 'shorts', 'podcasts', 'music'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all shrink-0 cursor-pointer shadow-xs ${
              filterType === type
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                : 'bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* 5. TIMELINE SECTIONS (Today, Yesterday, Older) */}
      {filteredTracks.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white/60 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
          <Music2 size={44} className="text-slate-400 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-300">No watch history found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? 'No videos match your search.' : 'Watch videos to see them appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today Section */}
          {groupedTracks.today.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Today
              </h2>
              <div className="space-y-2">
                {groupedTracks.today.map((track, idx) => renderTrackItem(track, idx))}
              </div>
            </div>
          )}

          {/* Yesterday Section */}
          {groupedTracks.yesterday.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Yesterday
              </h2>
              <div className="space-y-2">
                {groupedTracks.yesterday.map((track, idx) => renderTrackItem(track, idx + 2))}
              </div>
            </div>
          )}

          {/* Older Section */}
          {groupedTracks.older.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Older
              </h2>
              <div className="space-y-2">
                {groupedTracks.older.map((track, idx) => renderTrackItem(track, idx + 5))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

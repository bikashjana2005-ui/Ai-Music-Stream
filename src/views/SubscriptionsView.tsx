import React, { useState, useEffect } from 'react';
import { 
  UserPlus,
  LayoutGrid,
  List,
  Search,
  ChevronRight
} from 'lucide-react';
import { Track, SubscribedChannel } from '../types';
import { TrackCard } from '../components/TrackCard';
import { DEFAULT_TRACKS } from '../data/fallbackTracks';
import { getChannelAvatar, getFallbackChannelAvatar } from '../utils/channelLogos';

interface SubscriptionsViewProps {
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  currentTrackId?: string;
  favorites: Track[];
  onToggleFavorite: (track: Track) => void;
  subscriptions: SubscribedChannel[];
  onOpenSubscriptionsModal: () => void;
  onToggleSubscribe: (channel: SubscribedChannel) => void;
  selectedChannelFilter: string | null;
  setSelectedChannelFilter: (channelName: string | null) => void;
  onOpenChannelDetails?: (channelName: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type ViewLayoutMode = 'grid' | 'list';
type CategoryPillFilter = 'All' | 'Today' | 'Videos' | 'Shorts' | 'Live' | 'Unwatched' | 'Continue watching';

const CATEGORY_PILLS: CategoryPillFilter[] = [
  'All',
  'Today',
  'Videos',
  'Shorts',
  'Live',
  'Unwatched',
  'Continue watching'
];

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  onPlay,
  onDownload,
  currentTrackId,
  favorites,
  onToggleFavorite,
  subscriptions,
  onOpenSubscriptionsModal,
  selectedChannelFilter,
  setSelectedChannelFilter,
  onOpenChannelDetails,
  onShowToast
}) => {
  const [channelTracks, setChannelTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedSort, setFeedSort] = useState<'recent' | 'popular'>('recent');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePill, setActivePill] = useState<CategoryPillFilter>('All');

  // View mode state
  const [layoutMode, setLayoutMode] = useState<ViewLayoutMode>(() => {
    return (localStorage.getItem('aura_sub_layout') as ViewLayoutMode) || 'grid';
  });

  const handleSetLayoutMode = (mode: ViewLayoutMode) => {
    setLayoutMode(mode);
    localStorage.setItem('aura_sub_layout', mode);
  };

  const [isRealtimeSyncing, setIsRealtimeSyncing] = useState<boolean>(false);

  // Channels with unread blue indicators (simulated native YouTube experience)
  const [unreadChannels] = useState<Set<string>>(() => {
    return new Set(['Dangal TV', 'Star Jalsha', 'Trakin Tech', 'Crazy XYZ']);
  });

  // Fetch channel specific streams
  const fetchChannelStreams = async (channelName?: string | null, filterOverride?: 'recent' | 'popular', silent: boolean = false) => {
    if (!silent) setLoading(true);
    setIsRealtimeSyncing(true);
    const activeSort = filterOverride || feedSort;
    try {
      const payload: any = { sortBy: activeSort, forceFresh: silent };
      if (channelName) {
        payload.channelName = channelName;
      } else if (subscriptions.length > 0) {
        payload.channelNames = subscriptions.map(s => s.name);
      } else {
        payload.channelName = 'T-Series';
      }

      const res = await fetch("/api/channels/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.tracks && data.tracks.length > 0) {
        if (silent && channelTracks.length > 0) {
          const existingIds = new Set(channelTracks.map(t => t.id));
          const newCount = data.tracks.filter((t: Track) => !existingIds.has(t.id)).length;
          if (newCount > 0) {
            onShowToast(`⚡ ${newCount} new upload${newCount > 1 ? 's' : ''} in feed!`, 'success');
          }
        }
        setChannelTracks(data.tracks);
      } else {
        const targetStr = channelName || (subscriptions[0]?.name || '');
        const filtered = DEFAULT_TRACKS.filter(t => 
          (t.channel || '').toLowerCase().includes((targetStr).toLowerCase())
        );
        setChannelTracks(filtered.length ? filtered : DEFAULT_TRACKS);
      }
    } catch (e) {
      console.warn("Notice fetching channel streams:", e);
      if (channelTracks.length === 0) {
        setChannelTracks(DEFAULT_TRACKS);
      }
    } finally {
      if (!silent) setLoading(false);
      setIsRealtimeSyncing(false);
    }
  };

  useEffect(() => {
    fetchChannelStreams(selectedChannelFilter, feedSort);
    const syncInterval = setInterval(() => {
      fetchChannelStreams(selectedChannelFilter, feedSort, true);
    }, 25000);

    return () => clearInterval(syncInterval);
  }, [selectedChannelFilter, feedSort, subscriptions.length]);

  const handlePlayAllFeed = () => {
    if (channelTracks.length > 0) {
      onPlay(channelTracks[0]);
      onShowToast(`Playing ${selectedChannelFilter || 'Subscriptions'} feed`, 'success');
    }
  };

  // Filter tracks based on search, channel filter, and selected Category Pill
  const filteredTracks = channelTracks.filter(track => {
    // Search Filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = (track.title || '').toLowerCase().includes(q);
      const matchChannel = (track.channel || '').toLowerCase().includes(q);
      if (!matchTitle && !matchChannel) return false;
    }

    // Category Pill Filters
    if (activePill === 'Today') {
      const time = (track.publishedTime || '').toLowerCase();
      return time.includes('second') || time.includes('minute') || time.includes('hour') || time.includes('today') || time.includes('1 day');
    }

    if (activePill === 'Videos') {
      // Standard video format (duration >= 1:00 or standard video)
      return !track.duration || !track.duration.startsWith('0:');
    }

    if (activePill === 'Shorts') {
      // Shorts under 1 min or tagged
      const isShortDuration = track.duration && (track.duration.startsWith('0:') || parseInt(track.duration.split(':')[0]) < 1);
      const isShortTag = (track.aiMoodTags || '').toLowerCase().includes('short') || (track.title || '').toLowerCase().includes('#shorts');
      return isShortDuration || isShortTag;
    }

    if (activePill === 'Live') {
      const tags = (track.aiMoodTags || '').toLowerCase();
      const title = (track.title || '').toLowerCase();
      return tags.includes('live') || title.includes('live') || title.includes('stream');
    }

    if (activePill === 'Unwatched') {
      return track.id !== currentTrackId;
    }

    if (activePill === 'Continue watching') {
      return favorites.some(f => f.id === track.id) || track.id === currentTrackId;
    }

    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in pb-28 w-full max-w-full mx-auto">
      
      {/* 1. YOUTUBE MOBILE SUBSCRIPTION HEADER & CHANNEL CAROUSEL */}
      <div className="bg-slate-900/90 dark:bg-slate-950 p-3.5 sm:p-4 rounded-3xl border border-slate-800/80 space-y-3 shadow-xl">
        
        {/* 2. CIRCULAR SUBSCRIBED CHANNEL AVATARS ROW */}
        <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1">
          {/* Add Channel Button Avatar */}
          <button
            onClick={onOpenSubscriptionsModal}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
            title="Subscribe to YouTube Channel"
          >
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-rose-500/60 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition-all group-hover:scale-105 shadow-sm">
              <UserPlus size={20} />
            </div>
            <span className="text-[11px] font-extrabold text-slate-300 group-hover:text-rose-400 truncate max-w-[72px]">
              + Add
            </span>
          </button>

          {/* ALL Feed Filter Avatar */}
          <button
            onClick={() => {
              setSelectedChannelFilter(null);
              onShowToast('Showing feed from all subscribed channels', 'info');
            }}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all p-0.5 ${
              !selectedChannelFilter
                ? 'bg-gradient-to-tr from-rose-600 to-red-500 ring-2 ring-rose-500 shadow-lg scale-105'
                : 'bg-slate-800 hover:bg-slate-700'
            }`}>
              <div className="w-full h-full rounded-full bg-slate-950 text-white flex items-center justify-center font-black text-xs tracking-wider">
                ALL
              </div>
            </div>
            <span className={`text-[11px] font-bold truncate max-w-[72px] ${!selectedChannelFilter ? 'text-rose-400 font-extrabold' : 'text-slate-400'}`}>
              All Feeds
            </span>
          </button>

          {/* Subscribed Channel Avatars List with Blue Unread Dot */}
          {subscriptions.map((ch) => {
            const isSelected = selectedChannelFilter && (ch.name || '').toLowerCase() === selectedChannelFilter.toLowerCase();
            const hasUnread = unreadChannels.has(ch.name);

            return (
              <button
                key={`sub-creator-${ch.id}`}
                onClick={() => {
                  if (isSelected && onOpenChannelDetails) {
                    onOpenChannelDetails(ch.name);
                  } else {
                    setSelectedChannelFilter(isSelected ? null : ch.name);
                    onShowToast(isSelected ? 'Showing all feeds' : `Filtered feed to ${ch.name} (Tap again for channel page)`, 'info');
                  }
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer relative"
                title={isSelected ? `Tap again to open ${ch.name} Channel Page` : `Filter by ${ch.name}`}
              >
                <div className={`w-14 h-14 rounded-full p-0.5 transition-all relative ${
                  isSelected
                    ? 'bg-gradient-to-tr from-rose-600 to-red-500 ring-2 ring-rose-500 scale-105 shadow-lg'
                    : 'bg-slate-800 hover:bg-rose-500/80 hover:scale-105'
                }`}>
                  <img
                    src={ch.avatar && !ch.avatar.includes('unsplash') ? ch.avatar : getChannelAvatar(ch.name)}
                    alt={ch.name}
                    className="w-full h-full object-cover rounded-full bg-slate-900"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getFallbackChannelAvatar(ch.name);
                    }}
                  />
                  
                  {/* YouTube Unread Blue Notification Dot */}
                  {hasUnread && !isSelected && (
                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-sky-500 border-2 border-slate-950 rounded-full shadow-xs animate-pulse" />
                  )}
                </div>

                <span className={`text-[11px] font-semibold tracking-tight truncate max-w-[72px] ${
                  isSelected ? 'text-rose-400 font-extrabold' : 'text-slate-300 group-hover:text-white'
                }`}>
                  {ch.name}
                </span>
              </button>
            );
          })}

          {/* "All" button at the end of channel avatars row */}
          <button
            onClick={onOpenSubscriptionsModal}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer pl-1"
          >
            <div className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all group-hover:scale-105 border border-slate-700/60">
              <ChevronRight size={22} />
            </div>
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200">
              All
            </span>
          </button>
        </div>

        {/* 3. YOUTUBE PILL FILTER BAR (Highlighted in green in screenshot: [All] [Today] [Videos] [Shorts] [Live] ...) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pt-2 border-t border-slate-800/80">
          {CATEGORY_PILLS.map((pill) => {
            const isActive = activePill === pill;
            return (
              <button
                key={`sub-pill-${pill}`}
                onClick={() => {
                  setActivePill(pill);
                  onShowToast(`Filtering feed: ${pill}`, 'info');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 ${
                  isActive
                    ? 'bg-slate-100 text-slate-950 dark:bg-white dark:text-slate-950 font-black shadow-md'
                    : 'bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/50'
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>

      </div>

      {/* 4. SEARCH & VIEW MODE TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 shadow-sm">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFeedSort('recent')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              feedSort === 'recent'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Latest Uploads
          </button>
          <button
            onClick={() => setFeedSort('popular')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              feedSort === 'popular'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Most Popular
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feed..."
              className="w-full bg-slate-950 text-white text-xs pl-8 pr-3 py-1.5 rounded-full border border-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold placeholder:text-slate-500"
            />
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>

          <div className="bg-slate-950 p-0.5 rounded-xl border border-slate-800 flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => handleSetLayoutMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                layoutMode === 'grid'
                  ? 'bg-slate-800 text-rose-400 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => handleSetLayoutMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                layoutMode === 'list'
                  ? 'bg-slate-800 text-rose-400 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. YOUTUBE SUBSCRIPTION STREAM GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={`sub-skel-${i}`} className="bg-slate-900/80 animate-pulse rounded-2xl h-52 p-3 border border-slate-800" />
          ))}
        </div>
      ) : filteredTracks.length > 0 ? (
        <div className={
          layoutMode === 'grid'
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            : "grid grid-cols-1 md:grid-cols-2 gap-3"
        }>
          {filteredTracks.map((track) => (
            <TrackCard
              key={`sub-track-${track.id}`}
              track={track}
              onPlay={onPlay}
              onDownload={onDownload}
              isPlayingCurrent={currentTrackId === track.id}
              isFavorite={favorites.some((f) => f.id === track.id)}
              onToggleFavorite={onToggleFavorite}
              onOpenChannelDetails={onOpenChannelDetails}
              viewMode={layoutMode === 'list' ? 'list' : 'grid'}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-2 bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 p-8 w-full">
          <p className="text-xs font-bold text-slate-200">No uploads found for filter "{activePill}"</p>
          <p className="text-[11px] text-slate-400">
            Try selecting "All" or sync your subscription feeds.
          </p>
          <button
            onClick={() => setActivePill('All')}
            className="mt-2 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl"
          >
            Show All Feeds
          </button>
        </div>
      )}

    </div>
  );
};

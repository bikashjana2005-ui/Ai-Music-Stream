import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  RefreshCw, 
  Play, 
  UserPlus,
  LayoutGrid,
  List,
  Search,
  Bell,
  CheckCircle2
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
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type ViewLayoutMode = 'grid' | 'list';

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
  onShowToast
}) => {
  const [channelTracks, setChannelTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedFilter, setFeedFilter] = useState<'recent' | 'popular'>('recent');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // View mode state
  const [layoutMode, setLayoutMode] = useState<ViewLayoutMode>(() => {
    return (localStorage.getItem('aura_sub_layout') as ViewLayoutMode) || 'grid';
  });

  const handleSetLayoutMode = (mode: ViewLayoutMode) => {
    setLayoutMode(mode);
    localStorage.setItem('aura_sub_layout', mode);
  };

  const [isRealtimeSyncing, setIsRealtimeSyncing] = useState<boolean>(false);

  // Fetch channel specific streams
  const fetchChannelStreams = async (channelName?: string | null, filterOverride?: 'recent' | 'popular', silent: boolean = false) => {
    if (!silent) setLoading(true);
    setIsRealtimeSyncing(true);
    const activeFilter = filterOverride || feedFilter;
    try {
      const payload: any = { sortBy: activeFilter, forceFresh: silent };
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
    fetchChannelStreams(selectedChannelFilter, feedFilter);
    const syncInterval = setInterval(() => {
      fetchChannelStreams(selectedChannelFilter, feedFilter, true);
    }, 25000);

    return () => clearInterval(syncInterval);
  }, [selectedChannelFilter, feedFilter, subscriptions.length]);

  const handlePlayAllFeed = () => {
    if (channelTracks.length > 0) {
      onPlay(channelTracks[0]);
      onShowToast(`Playing ${selectedChannelFilter || 'Subscriptions'} feed`, 'success');
    }
  };

  const filteredTracks = channelTracks.filter(track => {
    return searchQuery.trim() === '' || 
      (track.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (track.channel || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-5 animate-fade-in pb-28 w-full max-w-full mx-auto">
      
      {/* 1. YOUTUBE-STYLE CREATOR CHANNELS ROW */}
      <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-gray-200/80 dark:border-white/10 space-y-3.5 shadow-lg">
        
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/80 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-500 dark:text-rose-400 flex items-center justify-center border border-rose-500/30">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                Subscribed Creators & Labels
                <span className="text-[10px] font-extrabold bg-rose-500/20 text-rose-600 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                  {subscriptions.length}
                </span>
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                {selectedChannelFilter ? `Filtering feed by ${selectedChannelFilter}` : 'Showing latest uploads from all your subscribed channels'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchChannelStreams(selectedChannelFilter, feedFilter, false);
                onShowToast("Syncing channel uploads...", "info");
              }}
              disabled={isRealtimeSyncing}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all border border-gray-200 dark:border-white/10 active:scale-95"
              title="Sync Subscriptions"
            >
              <RefreshCw size={13} className={isRealtimeSyncing ? "animate-spin text-rose-500 dark:text-rose-400" : "text-gray-500 dark:text-slate-400"} />
              <span className="hidden sm:inline">Sync Feed</span>
            </button>

            {channelTracks.length > 0 && (
              <button
                onClick={handlePlayAllFeed}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Play size={13} className="fill-white" />
                <span>Play Feed</span>
              </button>
            )}

            <button
              onClick={onOpenSubscriptionsModal}
              className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus size={15} />
              <span>Add / Manage</span>
            </button>
          </div>
        </div>

        {/* Horizontal Creator Avatar Carousel */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1">
          {/* Add Channel Button Avatar */}
          <button
            onClick={onOpenSubscriptionsModal}
            className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
            title="Subscribe to YouTube Channel"
          >
            <div className="w-13 h-13 rounded-full border-2 border-dashed border-rose-500/60 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center transition-all group-hover:scale-105 shadow-sm">
              <UserPlus size={20} />
            </div>
            <span className="text-[10px] font-extrabold text-gray-700 dark:text-slate-300 group-hover:text-rose-500 dark:group-hover:text-rose-400 truncate max-w-[68px]">
              + Add
            </span>
          </button>

          {/* ALL Feed Filter Button */}
          <button
            onClick={() => {
              setSelectedChannelFilter(null);
              onShowToast('Showing feed from all subscribed channels', 'info');
            }}
            className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
          >
            <div className={`w-13 h-13 rounded-full flex items-center justify-center transition-all p-0.5 ${
              !selectedChannelFilter
                ? 'bg-gradient-to-tr from-rose-600 to-red-500 ring-2 ring-rose-500 shadow-md scale-105'
                : 'bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700'
            }`}>
              <div className="w-full h-full rounded-full bg-gray-900 dark:bg-slate-950 text-white flex items-center justify-center font-black text-[10px] tracking-wider">
                ALL
              </div>
            </div>
            <span className={`text-[10px] font-bold truncate max-w-[68px] ${!selectedChannelFilter ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-gray-500 dark:text-slate-400'}`}>
              All Feeds
            </span>
          </button>

          {/* Subscribed Creators Avatars List */}
          {subscriptions.map((ch) => {
            const isSelected = selectedChannelFilter && (ch.name || '').toLowerCase() === selectedChannelFilter.toLowerCase();
            return (
              <button
                key={`sub-creator-${ch.id}`}
                onClick={() => {
                  setSelectedChannelFilter(isSelected ? null : ch.name);
                  onShowToast(isSelected ? 'Showing all feeds' : `Filtered feed to ${ch.name}`, 'info');
                }}
                className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer relative"
              >
                <div className={`w-13 h-13 rounded-full p-0.5 transition-all relative ${
                  isSelected
                    ? 'bg-gradient-to-tr from-rose-600 to-red-500 ring-2 ring-rose-500 scale-105 shadow-md'
                    : 'bg-rose-500/40 hover:bg-rose-500 hover:scale-105'
                }`}>
                  <img
                    src={ch.avatar && !ch.avatar.includes('unsplash') ? ch.avatar : getChannelAvatar(ch.name)}
                    alt={ch.name}
                    className="w-full h-full object-cover rounded-full bg-slate-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getFallbackChannelAvatar(ch.name);
                    }}
                  />
                  
                  {/* YouTube Unread Live Badge */}
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-rose-600 border-2 border-white dark:border-slate-900 rounded-full" />
                </div>

                <span className={`text-[10px] font-bold truncate max-w-[68px] ${
                  isSelected ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-gray-500 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-white'
                }`}>
                  {ch.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. FEED FILTER BAR & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/60 p-3 rounded-2xl border border-gray-200/60 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFeedFilter('recent')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              feedFilter === 'recent'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Latest Videos
          </button>
          <button
            onClick={() => setFeedFilter('popular')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              feedFilter === 'popular'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Most Popular
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="relative w-full sm:w-52">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feed..."
              className="w-full bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white text-xs pl-8 pr-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
            />
            <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
          </div>

          <div className="bg-gray-100 dark:bg-slate-800 p-0.5 rounded-xl border border-gray-200 dark:border-white/10 flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => handleSetLayoutMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                layoutMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => handleSetLayoutMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                layoutMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. YOUTUBE SUBSCRIPTION STREAM GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={`sub-skel-${i}`} className="bg-gray-200/60 dark:bg-slate-800/60 animate-pulse rounded-2xl h-52 p-3 border border-gray-300/30 dark:border-white/5" />
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
              viewMode={layoutMode === 'list' ? 'list' : 'grid'}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-2 bg-white/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 w-full">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No uploads in subscription feed</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Click "Sync" or add more YouTube channels to your subscription list.
          </p>
        </div>
      )}

    </div>
  );
};

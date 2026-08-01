import React, { useState, useEffect } from 'react';
import { 
  Youtube, 
  Plus, 
  RefreshCw, 
  Loader2, 
  Sparkles, 
  Radio, 
  Users, 
  Trash2, 
  Play, 
  Check, 
  LayoutGrid,
  List,
  Search,
  Flame,
  Music,
  Tv,
  Layers
} from 'lucide-react';
import { Track, SubscribedChannel } from '../types';
import { TrackCard } from '../components/TrackCard';
import { DEFAULT_TRACKS } from '../data/fallbackTracks';
import { decodeHtmlEntities } from '../utils/youtube';

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

type ViewLayoutMode = 'grid' | 'list' | 'spotlight';

const RECOMMENDED_CHANNELS: SubscribedChannel[] = [
  {
    id: 'rec-1',
    name: 'Lofi Girl',
    handle: '@LofiGirl',
    avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop',
    subscribers: '13.8M subscribers',
    isCustom: false
  },
  {
    id: 'rec-2',
    name: 'Coke Studio',
    handle: '@CokeStudio',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop',
    subscribers: '14.2M subscribers',
    isCustom: false
  },
  {
    id: 'rec-3',
    name: 'Chillhop Music',
    handle: '@ChillhopMusic',
    avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop',
    subscribers: '3.4M subscribers',
    isCustom: false
  },
  {
    id: 'rec-4',
    name: 'Anjunabeats',
    handle: '@anjunabeats',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop',
    subscribers: '1.2M subscribers',
    isCustom: false
  }
];

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  onPlay,
  onDownload,
  currentTrackId,
  favorites,
  onToggleFavorite,
  subscriptions,
  onOpenSubscriptionsModal,
  onToggleSubscribe,
  selectedChannelFilter,
  setSelectedChannelFilter,
  onShowToast
}) => {
  const [channelTracks, setChannelTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedFilter, setFeedFilter] = useState<'recent' | 'popular'>('recent');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [genreCategory, setGenreCategory] = useState<string>('all');

  // View mode state
  const [layoutMode, setLayoutMode] = useState<ViewLayoutMode>(() => {
    return (localStorage.getItem('aura_sub_layout') as ViewLayoutMode) || 'grid';
  });

  const handleSetLayoutMode = (mode: ViewLayoutMode) => {
    setLayoutMode(mode);
    localStorage.setItem('aura_sub_layout', mode);
  };

  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
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
        // Detect new tracks during background real-time sync
        if (silent && channelTracks.length > 0) {
          const existingIds = new Set(channelTracks.map(t => t.id));
          const newCount = data.tracks.filter((t: Track) => !existingIds.has(t.id)).length;
          if (newCount > 0) {
            onShowToast(`⚡ ${newCount} new YouTube video stream${newCount > 1 ? 's' : ''} live in feed!`, 'success');
          }
        }
        setChannelTracks(data.tracks);
      } else {
        const targetStr = channelName || (subscriptions[0]?.name || '');
        const filtered = DEFAULT_TRACKS.filter(t => 
          t.channel.toLowerCase().includes((targetStr).toLowerCase())
        );
        setChannelTracks(filtered.length ? filtered : DEFAULT_TRACKS);
      }
      setLastSyncTime(new Date());
    } catch (e) {
      console.error("Error fetching channel streams:", e);
      setChannelTracks(DEFAULT_TRACKS);
    } finally {
      if (!silent) setLoading(false);
      setIsRealtimeSyncing(false);
    }
  };

  useEffect(() => {
    fetchChannelStreams(selectedChannelFilter, feedFilter);
    
    // Real-time background sync interval (polls for new channel video releases every 15 seconds)
    const realtimeTimer = setInterval(() => {
      fetchChannelStreams(selectedChannelFilter, feedFilter, true);
    }, 15000);

    return () => clearInterval(realtimeTimer);
  }, [selectedChannelFilter, subscriptions, feedFilter]);

  const activeChannel = subscriptions.find(
    s => s.name.toLowerCase() === (selectedChannelFilter || '').toLowerCase()
  );

  // Filter tracks by query and category
  const filteredTracks = channelTracks.filter(t => {
    const matchesSearch = !searchQuery.trim() || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.channel.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (genreCategory === 'lofi') {
      return t.title.toLowerCase().includes('lofi') || t.title.toLowerCase().includes('chill') || t.title.toLowerCase().includes('relax');
    } else if (genreCategory === 'remix') {
      return t.title.toLowerCase().includes('remix') || t.title.toLowerCase().includes('mix') || t.title.toLowerCase().includes('edit');
    } else if (genreCategory === 'live') {
      return t.title.toLowerCase().includes('live') || t.title.toLowerCase().includes('concert') || t.title.toLowerCase().includes('studio');
    }
    return true;
  });

  const handlePlayAllFeed = () => {
    if (filteredTracks.length > 0) {
      onPlay(filteredTracks[0]);
      onShowToast(`Playing channel feed (${filteredTracks.length} tracks)`, 'success');
    }
  };

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      
      {/* SECTION 1: TOP BANNER & INSTANT CHANNEL STORY REELS */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl backdrop-saturate-200 border border-white/60 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        
        {/* Header Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-red-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 shrink-0">
              <Youtube size={26} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                Channel Feed Hub
                <span className="text-xs font-extrabold px-2.5 py-0.5 bg-rose-500/15 text-rose-600 dark:text-rose-300 rounded-full border border-rose-500/20">
                  {subscriptions.length} Subscribed
                </span>
                <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Real-Time Live Feed
                </span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                <span>Official audio streams, music video releases & creator uploads</span>
                <span className="hidden sm:inline text-gray-400 dark:text-gray-500">• Updated {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                fetchChannelStreams(selectedChannelFilter, feedFilter, false);
                onShowToast("Refreshing live YouTube subscriptions...", "info");
              }}
              disabled={isRealtimeSyncing}
              title="Sync Subscriptions in Real Time"
              className="p-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-2xl border border-gray-200 dark:border-white/10 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <RefreshCw size={15} className={isRealtimeSyncing ? "animate-spin text-rose-500" : "text-gray-500 dark:text-gray-400"} />
              <span className="hidden sm:inline">Real-time Sync</span>
            </button>

            {filteredTracks.length > 0 && (
              <button
                onClick={handlePlayAllFeed}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Play size={15} className="fill-white" />
                <span>Play Feed</span>
              </button>
            )}

            <button
              onClick={onOpenSubscriptionsModal}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold rounded-2xl shadow-md shadow-rose-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Plus size={16} />
              <span>Manage</span>
            </button>
          </div>
        </div>

        {/* Channel Avatars / Story Reel Carousel */}
        <div className="mt-5 pt-4 border-t border-gray-200/50 dark:border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Radio size={13} className="text-rose-500 animate-pulse" /> Subscribed Creators
            </span>
            <button
              onClick={() => {
                setSelectedChannelFilter(null);
                onShowToast('Showing uploads from all creators', 'info');
              }}
              className={`text-xs font-bold transition-colors ${!selectedChannelFilter ? 'text-rose-500 underline' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Show All Feeds
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-2 pt-1">
            {/* All Channels Reel Pill */}
            <button
              onClick={() => {
                setSelectedChannelFilter(null);
                onShowToast('Showing feed from all subscribed channels', 'info');
              }}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all p-0.5 ${
                !selectedChannelFilter
                  ? 'bg-gradient-to-tr from-rose-600 to-red-500 ring-2 ring-rose-500 shadow-md shadow-rose-500/30'
                  : 'bg-gray-200 dark:bg-slate-800 hover:bg-rose-500/20'
              }`}>
                <div className="w-full h-full rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                  ALL
                </div>
              </div>
              <span className={`text-[11px] font-bold truncate max-w-[70px] ${!selectedChannelFilter ? 'text-rose-600 dark:text-rose-400' : 'text-gray-600 dark:text-gray-400'}`}>
                All Feed
              </span>
            </button>

            {/* Subscribed Channels Reels */}
            {subscriptions.map((ch) => {
              const isSelected = selectedChannelFilter?.toLowerCase() === ch.name.toLowerCase();
              return (
                <button
                  key={`reel-ch-${ch.id}`}
                  onClick={() => {
                    setSelectedChannelFilter(ch.name);
                    onShowToast(`Filtered by ${ch.name}`, 'info');
                  }}
                  className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
                >
                  <div className={`w-14 h-14 rounded-full p-0.5 transition-all relative ${
                    isSelected
                      ? 'bg-gradient-to-tr from-rose-600 via-rose-500 to-red-500 ring-2 ring-rose-500 shadow-lg shadow-rose-500/40 scale-105'
                      : 'bg-gradient-to-tr from-indigo-500 to-rose-400/50 hover:scale-105'
                  }`}>
                    <img 
                      src={ch.avatar} 
                      alt={ch.name}
                      className="w-full h-full rounded-full object-cover ring-2 ring-slate-950"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                      }}
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                  </div>
                  <span className={`text-[11px] font-bold truncate max-w-[76px] ${isSelected ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                    {ch.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: ACTIVE CHANNEL SPOTLIGHT BANNER (WHEN FILTERED) */}
      {activeChannel && selectedChannelFilter && (
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-indigo-950/80 border border-rose-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden text-white animate-fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <img 
                src={activeChannel.avatar} 
                alt={activeChannel.name}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-rose-500/50 shadow-xl shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">{activeChannel.name}</h2>
                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold rounded-full uppercase">
                    Official Channel
                  </span>
                </div>
                <p className="text-xs text-rose-200/80 font-medium">
                  {activeChannel.handle} • <span className="text-rose-400 font-bold">{activeChannel.subscribers}</span>
                </p>
                <p className="text-[11px] text-gray-300 mt-1 max-w-lg">
                  Currently playing stream feed directly from {activeChannel.name}'s YouTube upload timeline.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                onClick={handlePlayAllFeed}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Play size={16} className="fill-white" /> Play Channel Stream
              </button>
              <button
                onClick={() => {
                  onToggleSubscribe(activeChannel);
                  setSelectedChannelFilter(null);
                  onShowToast(`Unsubscribed from ${activeChannel.name}`, 'info');
                }}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-rose-500/20 text-gray-200 hover:text-rose-300 border border-white/15 rounded-2xl text-xs font-bold transition-all flex items-center gap-1"
                title="Unsubscribe"
              >
                <Trash2 size={15} /> Unsubscribe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: FEED FILTER, SEARCH & LAYOUT MODE CONTROL BAR */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-3xl p-3.5 shadow-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Search Bar inside Subscription Feed */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search within subscription stream feed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100/90 dark:bg-slate-800/90 border border-gray-200/80 dark:border-white/10 rounded-2xl px-4 py-2.5 pl-10 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
          />
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
        </div>

        {/* Quick Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
          {[
            { id: 'all', label: 'All Tracks', icon: Layers },
            { id: 'lofi', label: 'Lofi & Chill', icon: Music },
            { id: 'remix', label: 'Remixes & Edits', icon: Flame },
            { id: 'live', label: 'Live Sessions', icon: Tv }
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = genreCategory === cat.id;
            return (
              <button
                key={`cat-filter-${cat.id}`}
                onClick={() => setGenreCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon size={13} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Layout Format Selector Buttons */}
        <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-200/50 dark:border-white/10">
          
          {/* Recently Uploaded vs Popular Hits Filter */}
          <div className="bg-gray-200/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-gray-300/50 dark:border-white/10 flex items-center gap-1">
            <button
              onClick={() => {
                setFeedFilter('recent');
                onShowToast('Fetching recently uploaded tracks...', 'info');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                feedFilter === 'recent'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Sparkles size={13} />
              <span className="hidden xs:inline">Recent</span>
            </button>
            <button
              onClick={() => {
                setFeedFilter('popular');
                onShowToast('Fetching popular channel hits...', 'info');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                feedFilter === 'popular'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Radio size={13} />
              <span className="hidden xs:inline">Popular</span>
            </button>
          </div>

          {/* View Modes (Grid, Compact List, Spotlight) */}
          <div className="bg-gray-200/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-gray-300/50 dark:border-white/10 flex items-center gap-1">
            <button
              onClick={() => handleSetLayoutMode('grid')}
              className={`p-2 rounded-xl text-xs font-bold transition-all ${
                layoutMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Grid Layout"
            >
              <LayoutGrid size={15} />
            </button>

            <button
              onClick={() => handleSetLayoutMode('list')}
              className={`p-2 rounded-xl text-xs font-bold transition-all ${
                layoutMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Compact List Layout"
            >
              <List size={15} />
            </button>

            <button
              onClick={() => handleSetLayoutMode('spotlight')}
              className={`p-2 rounded-xl text-xs font-bold transition-all ${
                layoutMode === 'spotlight'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Hero Spotlight Layout"
            >
              <Flame size={15} />
            </button>
          </div>

          <button
            onClick={() => fetchChannelStreams(selectedChannelFilter, feedFilter)}
            disabled={loading}
            className="p-2.5 bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-white/10 rounded-2xl text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 transition-all flex items-center justify-center shadow-xs active:scale-95 shrink-0"
            title="Refresh Feed"
          >
            {loading ? <Loader2 size={16} className="animate-spin text-rose-500" /> : <RefreshCw size={16} className="text-rose-500" />}
          </button>
        </div>
      </div>

      {/* SECTION 4: STREAM FEED RENDER */}
      {loading ? (
        <div className="py-24 text-center space-y-3 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
          <Loader2 size={38} className="animate-spin text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Streaming official upload feed from YouTube...
          </p>
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white/50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-gray-200 dark:border-white/10 p-6">
          <Youtube size={44} className="text-gray-300 dark:text-gray-600 mx-auto" />
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">No stream feeds found matching filters</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Try clearing search queries or switching channel subscriptions above.
          </p>
        </div>
      ) : (
        <>
          {/* LAYOUT 1: HERO SPOTLIGHT MODE */}
          {layoutMode === 'spotlight' && (
            <div className="space-y-6">
              {/* Featured Top Release Card */}
              {filteredTracks[0] && (
                <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 border border-white/15 shadow-2xl text-white relative overflow-hidden group">
                  <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="relative w-full md:w-64 aspect-video sm:aspect-square rounded-2xl overflow-hidden shadow-2xl ring-2 ring-rose-500/40 shrink-0">
                      <img 
                        src={filteredTracks[0].thumbnail} 
                        alt={filteredTracks[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        onClick={() => onPlay(filteredTracks[0])}
                        className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition-all"
                      >
                        <div className="w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-600/50 scale-95 group-hover:scale-110 transition-transform">
                          <Play size={26} className="fill-white ml-1" />
                        </div>
                      </button>
                    </div>

                    <div className="flex-1 space-y-3 text-center md:text-left">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                        <Flame size={13} className="text-rose-400" /> Featured Subscription Stream
                      </div>
                      <h2 className="text-lg sm:text-2xl font-black text-white line-clamp-2 leading-tight">
                        {decodeHtmlEntities(filteredTracks[0].title)}
                      </h2>
                      <p className="text-xs text-indigo-300 font-semibold">
                        {filteredTracks[0].channel} • {filteredTracks[0].views || 'Recent Release'}
                      </p>
                      
                      <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                        <button
                          onClick={() => onPlay(filteredTracks[0])}
                          className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all active:scale-95"
                        >
                          <Play size={16} className="fill-white" /> Play Now
                        </button>
                        <button
                          onClick={() => onDownload(filteredTracks[0])}
                          className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/15 transition-all"
                        >
                          Download MP3
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid for remaining tracks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTracks.slice(1).map((track) => (
                  <TrackCard
                    key={`sub-spotlight-${track.id}`}
                    track={track}
                    onPlay={onPlay}
                    onDownload={onDownload}
                    isPlayingCurrent={currentTrackId === track.id}
                    isFavorite={favorites.some((f) => f.id === track.id)}
                    onToggleFavorite={onToggleFavorite}
                    viewMode="grid"
                  />
                ))}
              </div>
            </div>
          )}

          {/* LAYOUT 2: STANDARD GRID MODE */}
          {layoutMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredTracks.map((track) => (
                <TrackCard
                  key={`sub-grid-${track.id}`}
                  track={track}
                  onPlay={onPlay}
                  onDownload={onDownload}
                  isPlayingCurrent={currentTrackId === track.id}
                  isFavorite={favorites.some((f) => f.id === track.id)}
                  onToggleFavorite={onToggleFavorite}
                  viewMode="grid"
                />
              ))}
            </div>
          )}

          {/* LAYOUT 3: COMPACT LIST MODE */}
          {layoutMode === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTracks.map((track) => (
                <TrackCard
                  key={`sub-list-${track.id}`}
                  track={track}
                  onPlay={onPlay}
                  onDownload={onDownload}
                  isPlayingCurrent={currentTrackId === track.id}
                  isFavorite={favorites.some((f) => f.id === track.id)}
                  onToggleFavorite={onToggleFavorite}
                  viewMode="list"
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* SECTION 5: RECOMMENDED CHANNELS TO DISCOVER & SUBSCRIBE */}
      <div className="mt-10 pt-8 border-t border-gray-200/60 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-rose-500" /> Recommended Music Creators
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Subscribe with one click to expand your personalized audio feed
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {RECOMMENDED_CHANNELS.map((rec) => {
            const isSubbed = subscriptions.some(s => s.name.toLowerCase() === rec.name.toLowerCase());
            return (
              <div 
                key={`rec-ch-${rec.id}`}
                className="p-3.5 bg-white/70 dark:bg-slate-800/70 border border-gray-200/60 dark:border-white/10 rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:border-rose-500/40 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img 
                    src={rec.avatar} 
                    alt={rec.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-rose-500/30"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-black truncate text-gray-900 dark:text-white">{rec.name}</h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">{rec.handle}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onToggleSubscribe(rec);
                    onShowToast(isSubbed ? `Unsubscribed from ${rec.name}` : `Subscribed to ${rec.name}!`, isSubbed ? 'info' : 'success');
                  }}
                  className={`p-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isSubbed
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                  }`}
                  title={isSubbed ? "Subscribed" : "Subscribe"}
                >
                  {isSubbed ? <Check size={16} /> : <Plus size={16} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};


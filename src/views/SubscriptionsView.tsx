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
  SlidersHorizontal,
  LayoutGrid,
  List
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

  // View format toggle state (grid vs list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('aura_view_mode') as 'grid' | 'list') || 'grid';
  });

  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('aura_view_mode', mode);
  };

  // Fetch channel specific streams when filter changes or on initial load
  const fetchChannelStreams = async (channelName?: string | null, filterOverride?: 'recent' | 'popular') => {
    setLoading(true);
    const activeFilter = filterOverride || feedFilter;
    try {
      const targetChannel = channelName || (subscriptions.length > 0 ? subscriptions[0].name : 'T-Series');
      const res = await fetch("/api/channels/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          channelName: targetChannel,
          sortBy: activeFilter
        })
      });
      const data = await res.json();
      if (data.tracks && data.tracks.length > 0) {
        setChannelTracks(data.tracks);
      } else {
        // Fallback to local tracks matching channel
        const filtered = DEFAULT_TRACKS.filter(t => 
          t.channel.toLowerCase().includes((targetChannel || '').toLowerCase())
        );
        setChannelTracks(filtered.length ? filtered : DEFAULT_TRACKS);
      }
    } catch (e) {
      console.error("Error fetching channel streams:", e);
      setChannelTracks(DEFAULT_TRACKS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelStreams(selectedChannelFilter, feedFilter);
  }, [selectedChannelFilter, subscriptions, feedFilter]);

  const activeChannel = subscriptions.find(
    s => s.name.toLowerCase() === (selectedChannelFilter || '').toLowerCase()
  ) || subscriptions[0];

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      
      {/* Page Header */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl backdrop-saturate-200 border border-white/60 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-red-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 shrink-0">
              <Youtube size={26} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                YouTube Channel Feeds
                <span className="text-xs font-extrabold px-2.5 py-0.5 bg-rose-500/15 text-rose-600 dark:text-rose-300 rounded-full border border-rose-500/20">
                  {subscriptions.length} Subscribed
                </span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Real-time official audio streams & uploads from your favorite record labels and creators
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSubscriptionsModal}
            className="px-5 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold rounded-2xl shadow-md shadow-rose-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <Plus size={16} /> Manage Subscriptions
          </button>
        </div>

        {/* Subscribed Channels Selector Pills */}
        <div className="mt-5 pt-4 border-t border-gray-200/50 dark:border-white/10 flex items-center gap-3 overflow-x-auto custom-scrollbar pb-1">
          <button
            onClick={() => {
              setSelectedChannelFilter(null);
              onShowToast('Showing feed from all subscribed channels', 'info');
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              !selectedChannelFilter
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <Radio size={14} /> All Channels
          </button>

          {subscriptions.map((ch) => {
            const isSelected = selectedChannelFilter?.toLowerCase() === ch.name.toLowerCase();
            return (
              <button
                key={`sub-page-ch-${ch.id}`}
                onClick={() => {
                  setSelectedChannelFilter(ch.name);
                  onShowToast(`Filtering feed by ${ch.name}`, 'info');
                }}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
                  isSelected
                    ? 'bg-rose-500/15 dark:bg-rose-400/20 text-rose-600 dark:text-rose-300 border-rose-500/30 shadow-xs'
                    : 'bg-white/70 dark:bg-slate-800/70 text-gray-700 dark:text-gray-300 border-gray-200/60 dark:border-white/10 hover:border-rose-400/50'
                }`}
              >
                <img 
                  src={ch.avatar} 
                  alt={ch.name}
                  className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-rose-500/30"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                  }}
                />
                <span className="truncate max-w-[120px]">{ch.name}</span>
                {isSelected && <Check size={12} className="text-rose-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stream Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Radio size={20} className="text-rose-500 animate-pulse" />
            {selectedChannelFilter ? `${selectedChannelFilter} Channel Feed` : 'Subscribed Channels Stream Feed'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
            {feedFilter === 'recent' 
              ? 'Showing the most recently uploaded videos & tracks directly from YouTube'
              : 'Showing top popular audio tracks & hits from official channels'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Recently Uploaded vs Popular Filter */}
          <div className="bg-gray-200/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-gray-300/50 dark:border-white/10 flex items-center gap-1 backdrop-blur-md">
            <button
              onClick={() => {
                setFeedFilter('recent');
                onShowToast('Fetching recently uploaded videos...', 'info');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                feedFilter === 'recent'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Sparkles size={14} />
              <span>Recently Uploaded</span>
            </button>
            <button
              onClick={() => {
                setFeedFilter('popular');
                onShowToast('Fetching popular channel hits...', 'info');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                feedFilter === 'popular'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Radio size={14} />
              <span>Popular Hits</span>
            </button>
          </div>

          {/* Format Toggle (Grid vs List) */}
          <div className="bg-gray-200/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-gray-300/50 dark:border-white/10 flex items-center gap-1 backdrop-blur-md">
            <button
              onClick={() => handleToggleViewMode('grid')}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Grid Format View"
            >
              <LayoutGrid size={15} />
              <span className="hidden md:inline">Grid</span>
            </button>
            <button
              onClick={() => handleToggleViewMode('list')}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="List Format View"
            >
              <List size={15} />
              <span className="hidden md:inline">List</span>
            </button>
          </div>

          <button
            onClick={() => fetchChannelStreams(selectedChannelFilter, feedFilter)}
            disabled={loading}
            className="px-3.5 py-2 bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-white/10 rounded-2xl text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin text-rose-500" />
            ) : (
              <RefreshCw size={14} className="text-rose-500" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Track Grid / List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 size={36} className="animate-spin text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
            Fetching official audio uploads from YouTube channels...
          </p>
        </div>
      ) : channelTracks.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white/50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-gray-200 dark:border-white/10 p-6">
          <Youtube size={44} className="text-gray-300 dark:text-gray-600 mx-auto" />
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">No stream feeds available for this channel</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Try choosing another channel from your subscriptions or add custom creators above.
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            : "grid grid-cols-1 md:grid-cols-2 gap-3"
        }>
          {channelTracks.map((track) => (
            <TrackCard
              key={`sub-track-${track.id}`}
              track={track}
              onPlay={onPlay}
              onDownload={onDownload}
              isPlayingCurrent={currentTrackId === track.id}
              isFavorite={favorites.some((f) => f.id === track.id)}
              onToggleFavorite={onToggleFavorite}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Active Subscribed Channel Details Grid */}
      <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-white/10 space-y-4">
        <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <Users size={14} className="text-rose-500" /> Managed Channels ({subscriptions.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {subscriptions.map((ch) => {
            const isSelected = selectedChannelFilter?.toLowerCase() === ch.name.toLowerCase();
            return (
              <div 
                key={`ch-manage-card-${ch.id}`}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-xs ${
                  isSelected
                    ? 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/30'
                    : 'bg-white/70 dark:bg-slate-800/70 border-gray-200/60 dark:border-white/10'
                }`}
              >
                <div 
                  onClick={() => {
                    setSelectedChannelFilter(ch.name);
                    onShowToast(`Filtering feed by ${ch.name}`, 'info');
                  }}
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                >
                  <img 
                    src={ch.avatar} 
                    alt={ch.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-rose-500/30"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                    }}
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-black truncate text-gray-900 dark:text-white">
                      {ch.name}
                    </h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">
                      {ch.handle} • <span className="text-rose-500 font-semibold">{ch.subscribers}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onToggleSubscribe(ch);
                    onShowToast(`Unsubscribed from ${ch.name}`, 'info');
                  }}
                  className="p-2 text-gray-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Unsubscribe"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

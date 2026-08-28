import React, { useState, useEffect } from 'react';
import { 
  UserPlus,
  LayoutGrid,
  List,
  Search,
  ChevronRight,
  RefreshCw,
  Youtube,
  Zap,
  Sparkles,
  MoreVertical,
  Play,
  Heart,
  Download,
  ListPlus,
  Info,
  Share2,
  Tv,
  Flame,
  Radio,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track, SubscribedChannel } from '../types';
import { TrackCard } from '../components/TrackCard';
import { DEFAULT_TRACKS } from '../data/fallbackTracks';
import { getChannelAvatar, getFallbackChannelAvatar } from '../utils/channelLogos';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';

interface SubscriptionsViewProps {
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  currentTrackId?: string;
  favorites: Track[];
  onToggleFavorite: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onOpenMetadata?: (track: Track) => void;
  subscriptions: SubscribedChannel[];
  onOpenSubscriptionsModal: () => void;
  onToggleSubscribe: (channel: SubscribedChannel) => void;
  selectedChannelFilter: string | null;
  setSelectedChannelFilter: (channelName: string | null) => void;
  onOpenChannelDetails?: (channelName: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSyncYouTubeSubscriptions?: () => Promise<void>;
  isSyncingSubscriptions?: boolean;
}

type ViewLayoutMode = 'mobile' | 'grid' | 'list';
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
  onOpenAddToPlaylist,
  onOpenMetadata,
  subscriptions,
  onOpenSubscriptionsModal,
  onToggleSubscribe,
  selectedChannelFilter,
  setSelectedChannelFilter,
  onOpenChannelDetails,
  onShowToast,
  onSyncYouTubeSubscriptions,
  isSyncingSubscriptions = false
}) => {
  const [channelTracks, setChannelTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedSort, setFeedSort] = useState<'recent' | 'popular'>('recent');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePill, setActivePill] = useState<CategoryPillFilter>('All');
  const [internalSyncing, setInternalSyncing] = useState<boolean>(false);
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

  // Toggle to show only last subscribed channel
  const [showOnlyLastSubscribed, setShowOnlyLastSubscribed] = useState<boolean>(() => {
    return localStorage.getItem('aura_show_last_sub_only') === 'true';
  });

  const lastSubscribedChannel = subscriptions.length > 0 ? subscriptions[subscriptions.length - 1] : null;

  const handleToggleLastSubscribedOnly = (enabled: boolean) => {
    setShowOnlyLastSubscribed(enabled);
    localStorage.setItem('aura_show_last_sub_only', String(enabled));
    if (enabled && lastSubscribedChannel) {
      setSelectedChannelFilter(lastSubscribedChannel.name);
      onShowToast(`Showing latest subscribed channel: ${lastSubscribedChannel.name}`, 'info');
    } else {
      setSelectedChannelFilter(null);
      onShowToast('Showing all subscribed feeds', 'info');
    }
  };

  // View mode state (defaults to 'mobile' YouTube style)
  const [layoutMode, setLayoutMode] = useState<ViewLayoutMode>(() => {
    return (localStorage.getItem('aura_sub_layout') as ViewLayoutMode) || 'mobile';
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
      if (showOnlyLastSubscribed && lastSubscribedChannel) {
        payload.channelName = lastSubscribedChannel.name;
      } else if (channelName) {
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

  // Extract Shorts for YouTube mobile Shorts Shelf
  const shortsTracks = channelTracks.filter(t => 
    (t.aiMoodTags || '').toLowerCase().includes('short') || 
    (t.title || '').toLowerCase().includes('#shorts') || 
    (t.duration && t.duration.startsWith('0:'))
  ).slice(0, 6);

  const handleShareTrack = (track: Track) => {
    const videoId = extractYouTubeId(track.id);
    const url = videoId ? `https://youtube.com/watch?v=${videoId}` : window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      onShowToast('🔗 Video link copied to clipboard!', 'success');
    } else {
      onShowToast(`Sharing: ${track.title}`, 'info');
    }
  };

  return (
    <div className="space-y-3.5 animate-fade-in pb-28 w-full max-w-4xl mx-auto">
      
      {/* ========================================================================= */}
      {/* 1. YOUTUBE MOBILE HEADER & AVATAR STORY CAROUSEL */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-3 sm:p-4 space-y-3">
        
        {/* Top Header Bar with YouTube Branding */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/30 shrink-0">
              <Youtube size={18} className="fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Subscriptions
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-[10px] font-extrabold border border-red-200 dark:border-red-800/40">
                  {showOnlyLastSubscribed && lastSubscribedChannel ? 'Last Subscribed Channel' : `${subscriptions.length} Channels`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions: Last Subscribed Toggle / Manage & Sync */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {lastSubscribedChannel && (
              <button
                onClick={() => handleToggleLastSubscribedOnly(!showOnlyLastSubscribed)}
                className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border active:scale-95 ${
                  showOnlyLastSubscribed
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title={showOnlyLastSubscribed ? 'Show all channels' : 'Show only latest subscribed channel'}
              >
                <Zap size={13} className={showOnlyLastSubscribed ? 'fill-white' : 'text-amber-500'} />
                <span>{showOnlyLastSubscribed ? 'Last Channel Only' : 'Last Subscribed'}</span>
              </button>
            )}

            <button
              onClick={async () => {
                setInternalSyncing(true);
                try {
                  if (onSyncYouTubeSubscriptions) {
                    await onSyncYouTubeSubscriptions();
                  } else {
                    onOpenSubscriptionsModal();
                  }
                } finally {
                  setTimeout(() => setInternalSyncing(false), 800);
                }
              }}
              disabled={internalSyncing || isSyncingSubscriptions}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 disabled:opacity-50"
              title="Sync Subscriptions with Google Account"
            >
              <RefreshCw size={16} className={internalSyncing || isSyncingSubscriptions ? "animate-spin text-red-500" : ""} />
            </button>

            <button
              onClick={onOpenSubscriptionsModal}
              className="px-2.5 py-1 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all flex items-center gap-1"
            >
              <span>Manage</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* 2. YOUTUBE STORY-STYLE HORIZONTAL CHANNEL AVATARS ROW */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5">
          
          {/* ALL Feeds Bubble */}
          <button
            onClick={() => {
              if (showOnlyLastSubscribed) {
                handleToggleLastSubscribedOnly(false);
              } else {
                setSelectedChannelFilter(null);
                onShowToast('Showing all subscribed feeds', 'info');
              }
            }}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
          >
            <div className={`w-13 h-13 rounded-full flex items-center justify-center transition-all p-0.5 ${
              !selectedChannelFilter && !showOnlyLastSubscribed
                ? 'bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 ring-2 ring-red-500 scale-105 shadow-md'
                : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}>
              <div className="w-full h-full rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs tracking-wider">
                ALL
              </div>
            </div>
            <span className={`text-[11px] font-bold truncate max-w-[66px] ${!selectedChannelFilter && !showOnlyLastSubscribed ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-slate-600 dark:text-slate-400'}`}>
              All
            </span>
          </button>

          {/* Subscribed Channels List - When showOnlyLastSubscribed is active, highlights or limits */}
          {(showOnlyLastSubscribed && lastSubscribedChannel ? [lastSubscribedChannel] : subscriptions).map((ch) => {
            const isSelected = (showOnlyLastSubscribed && ch.id === lastSubscribedChannel?.id) || 
              (selectedChannelFilter && (ch.name || '').toLowerCase() === selectedChannelFilter.toLowerCase());
            const hasUnread = unreadChannels.has(ch.name);

            return (
              <button
                key={`sub-channel-avatar-${ch.id}`}
                onClick={() => {
                  if (isSelected && onOpenChannelDetails) {
                    onOpenChannelDetails(ch.name);
                  } else {
                    setSelectedChannelFilter(isSelected ? null : ch.name);
                    onShowToast(isSelected ? 'Showing all feeds' : `Filtered feed to ${ch.name}`, 'info');
                  }
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer relative"
                title={isSelected ? `Tap again for ${ch.name} Channel Page` : `View ${ch.name}`}
              >
                <div className={`w-13 h-13 rounded-full p-0.5 transition-all relative ${
                  isSelected
                    ? 'bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 ring-2 ring-red-500 scale-105 shadow-md'
                    : 'bg-slate-200 dark:bg-slate-800 hover:scale-105'
                }`}>
                  <img
                    src={ch.avatar && !ch.avatar.includes('unsplash') ? ch.avatar : getChannelAvatar(ch.name)}
                    alt={ch.name}
                    className="w-full h-full object-cover rounded-full bg-slate-950"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getFallbackChannelAvatar(ch.name);
                    }}
                  />
                  
                  {/* YouTube Native Blue Unread Dot */}
                  {hasUnread && !isSelected && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white dark:border-slate-900 rounded-full shadow-xs animate-pulse" />
                  )}
                </div>

                <span className={`text-[11px] font-semibold tracking-tight truncate max-w-[66px] ${
                  isSelected ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
                }`}>
                  {ch.name}
                </span>
              </button>
            );
          })}

          {/* Add Channel Bubble */}
          <button
            onClick={onOpenSubscriptionsModal}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
            title="Subscribe to YouTube Channels"
          >
            <div className="w-13 h-13 rounded-full border border-dashed border-red-500/60 bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all group-hover:scale-105 shadow-xs">
              <UserPlus size={18} />
            </div>
            <span className="text-[11px] font-bold text-red-600 dark:text-red-400 truncate max-w-[66px]">
              + Add
            </span>
          </button>

        </div>

        {/* Optional Last Subscribed Spotlight Banner */}
        {showOnlyLastSubscribed && lastSubscribedChannel && (
          <div className="p-3 bg-gradient-to-r from-red-500/10 via-rose-500/5 to-transparent rounded-xl border border-red-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={lastSubscribedChannel.avatar || getChannelAvatar(lastSubscribedChannel.name)}
                alt={lastSubscribedChannel.name}
                className="w-9 h-9 rounded-full object-cover border border-red-500 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {lastSubscribedChannel.name}
                  </span>
                  <Check size={13} className="text-red-500 shrink-0" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                  Latest Subscribed Channel • Showing recent uploads
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenChannelDetails && (
                <button
                  onClick={() => onOpenChannelDetails(lastSubscribedChannel.name)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs"
                >
                  Visit Channel
                </button>
              )}
              <button
                onClick={() => handleToggleLastSubscribedOnly(false)}
                className="px-2.5 py-1 text-[11px] font-bold bg-red-600 text-white rounded-lg shadow-xs"
              >
                View All Feeds
              </button>
            </div>
          </div>
        )}

        {/* 3. YOUTUBE PILL FILTER CHIPS BAR */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pt-2 border-t border-slate-100 dark:border-slate-800">
          {CATEGORY_PILLS.map((pill) => {
            const isActive = activePill === pill;
            return (
              <button
                key={`sub-pill-${pill}`}
                onClick={() => {
                  setActivePill(pill);
                  onShowToast(`Feed: ${pill}`, 'info');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-black shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH & FEED CONTROLS TOOLBAR */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subscriptions feed..."
            className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold placeholder:text-slate-400"
          />
          <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
        </div>

        {/* View Mode Switches: Mobile Feed / Grid / Compact */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => handleSetLayoutMode('mobile')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              layoutMode === 'mobile'
                ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
            title="YouTube Mobile Feed (Large Video Cards)"
          >
            <Tv size={13} />
            <span className="hidden sm:inline">Feed</span>
          </button>

          <button
            onClick={() => handleSetLayoutMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
              layoutMode === 'grid'
                ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
            title="Grid View"
          >
            <LayoutGrid size={14} />
          </button>

          <button
            onClick={() => handleSetLayoutMode('list')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
              layoutMode === 'list'
                ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
            title="Compact List View"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. YOUTUBE MOBILE SHORTS SHELF (When in All or Shorts view) */}
      {/* ========================================================================= */}
      {(activePill === 'All' || activePill === 'Shorts') && shortsTracks.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center">
                <Flame size={13} className="fill-white" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Shorts
              </h3>
            </div>
            <button 
              onClick={() => setActivePill('Shorts')}
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
            >
              View all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 overflow-x-auto no-scrollbar">
            {shortsTracks.map((track) => {
              const videoId = extractYouTubeId(track.id);
              const thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop`;
              
              return (
                <div
                  key={`sub-short-${track.id}`}
                  onClick={() => {
                    onPlay(track);
                    onShowToast(`Playing Short: ${track.title}`, 'success');
                  }}
                  className="group relative rounded-xl overflow-hidden cursor-pointer aspect-[9/16] bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs hover:scale-102 transition-all"
                >
                  <img
                    src={thumb}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 text-white">
                    <span className="text-[11px] font-bold leading-tight line-clamp-2 drop-shadow-sm">
                      {track.title}
                    </span>
                    <span className="text-[9px] text-white/80 font-medium mt-0.5">
                      {track.views || '1.2M views'}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs rounded-md text-[9px] font-black text-white flex items-center gap-0.5">
                    <Flame size={10} className="text-red-500 fill-red-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. YOUTUBE MOBILE FEED STREAM */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={`sub-feed-skel-${i}`} className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 space-y-3 animate-pulse">
              <div className="w-full aspect-video bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredTracks.length > 0 ? (
        layoutMode === 'mobile' ? (
          /* AUTHENTIC YOUTUBE MOBILE FULL CARD FEED */
          <div className="space-y-4">
            {filteredTracks.map((track) => {
              const videoId = extractYouTubeId(track.id);
              const thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop`;
              const title = decodeHtmlEntities(track.title);
              const channel = decodeHtmlEntities(track.channel);
              const isPlaying = currentTrackId === track.id;
              const isFav = favorites.some((f) => f.id === track.id);
              const isMenuOpen = activeMenuTrackId === track.id;

              return (
                <div
                  key={`yt-feed-card-${track.id}`}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden shadow-xs hover:shadow-md ${
                    isPlaying
                      ? 'border-red-500 ring-2 ring-red-500/20'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* 16:9 Main Video Thumbnail */}
                  <div 
                    onClick={() => onPlay(track)}
                    className="relative w-full aspect-video bg-slate-950 cursor-pointer overflow-hidden group"
                  >
                    <img
                      src={thumb}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : '';
                      }}
                    />

                    {/* Play Overlay on Hover */}
                    <div className={`absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center transition-opacity ${
                      isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/40 transform group-hover:scale-110 transition-transform">
                        <Play size={26} className="fill-white ml-1" />
                      </div>
                    </div>

                    {/* Video Duration Badge */}
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/80 backdrop-blur-md text-white text-[11px] font-mono font-bold rounded-md shadow-md">
                      {track.duration || '3:45'}
                    </div>

                    {/* Live Stream / New Badge */}
                    {track.publishedTime?.includes('hour') || track.publishedTime?.includes('minute') ? (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-red-600 text-white text-[10px] font-extrabold rounded-md shadow-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        NEW
                      </div>
                    ) : null}
                  </div>

                  {/* YouTube Mobile Metadata Footer */}
                  <div className="p-3 sm:p-4 flex items-start justify-between gap-3">
                    
                    {/* Channel Avatar Circle */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenChannelDetails) onOpenChannelDetails(channel);
                      }}
                      className="w-10 h-10 rounded-full shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-red-500 transition-all border border-slate-200 dark:border-slate-800"
                      title={`Open ${channel} channel`}
                    >
                      <img
                        src={getChannelAvatar(channel)}
                        alt={channel}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getFallbackChannelAvatar(channel);
                        }}
                      />
                    </div>

                    {/* Video Title & Meta Details */}
                    <div 
                      onClick={() => onPlay(track)}
                      className="flex-1 min-w-0 cursor-pointer space-y-1"
                    >
                      <h3 className={`text-sm sm:text-base font-bold line-clamp-2 leading-snug ${
                        isPlaying ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        {title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap">
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenChannelDetails) onOpenChannelDetails(channel);
                          }}
                          className="hover:text-red-600 dark:hover:text-red-400 hover:underline font-semibold"
                        >
                          {channel}
                        </span>
                        <span>•</span>
                        <span>{track.views || '850K views'}</span>
                        {track.publishedTime && (
                          <>
                            <span>•</span>
                            <span>{track.publishedTime}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 3-Dots Action Menu Trigger */}
                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuTrackId(isMenuOpen ? null : track.id);
                        }}
                        className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                        title="More options"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {/* Dropdown Menu Sheet */}
                      {isMenuOpen && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 bottom-full mb-1 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-scale-up"
                        >
                          <button
                            onClick={() => {
                              onPlay(track);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2.5"
                          >
                            <Play size={15} className="text-red-600" />
                            <span>Play Video</span>
                          </button>

                          {onOpenAddToPlaylist && (
                            <button
                              onClick={() => {
                                onOpenAddToPlaylist(track);
                                setActiveMenuTrackId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2.5"
                            >
                              <ListPlus size={15} className="text-indigo-500" />
                              <span>Save to playlist</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              onToggleFavorite(track);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2.5"
                          >
                            <Heart size={15} className={isFav ? "text-rose-500 fill-rose-500" : "text-slate-400"} />
                            <span>{isFav ? 'Remove from Liked' : 'Like video'}</span>
                          </button>

                          <button
                            onClick={() => {
                              onDownload(track);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2.5"
                          >
                            <Download size={15} className="text-emerald-500" />
                            <span>Download offline</span>
                          </button>

                          {onOpenMetadata && (
                            <button
                              onClick={() => {
                                onOpenMetadata(track);
                                setActiveMenuTrackId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2.5"
                            >
                              <Info size={15} className="text-blue-500" />
                              <span>Stats & info</span>
                            </button>
                          )}

                          {onOpenChannelDetails && (
                            <button
                              onClick={() => {
                                onOpenChannelDetails(channel);
                                setActiveMenuTrackId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2.5"
                            >
                              <Tv size={15} className="text-amber-500" />
                              <span>Go to channel</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              handleShareTrack(track);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2.5"
                          >
                            <Share2 size={15} className="text-purple-500" />
                            <span>Share</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* STANDARD GRID OR COMPACT LIST VIEW */
          <div className={
            layoutMode === 'grid'
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
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
                onOpenAddToPlaylist={onOpenAddToPlaylist}
                onOpenMetadata={onOpenMetadata}
                onOpenChannelDetails={onOpenChannelDetails}
                viewMode={layoutMode === 'list' ? 'list' : 'grid'}
              />
            ))}
          </div>
        )
      ) : (
        <div className="py-16 text-center space-y-2.5 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 w-full">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <Youtube size={24} />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            No uploads found for "{activePill}"
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try switching to "All", syncing your YouTube channels, or subscribing to more creators.
          </p>
          <button
            onClick={() => setActivePill('All')}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Show All Subscriptions
          </button>
        </div>
      )}

    </div>
  );
};

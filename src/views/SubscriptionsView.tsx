import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus,
  LayoutGrid,
  List,
  Search,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Zap,
  MoreVertical,
  Play,
  Heart,
  Download,
  ListPlus,
  Info,
  Share2,
  Tv,
  Flame,
  Check,
  CheckCircle2,
  X,
  Volume2
} from 'lucide-react';
import { Track, SubscribedChannel } from '../types';
import { TrackCard } from '../components/TrackCard';
import { DEFAULT_TRACKS } from '../data/fallbackTracks';
import { getChannelAvatar, getFallbackChannelAvatar } from '../utils/channelLogos';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';
import { isLaxmiPujaActive } from '../utils/festivalUtils';

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

type ViewLayoutMode = 'grid' | 'mobile' | 'list';
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
  selectedChannelFilter,
  setSelectedChannelFilter,
  onOpenChannelDetails,
  onShowToast,
  onSyncYouTubeSubscriptions,
  isSyncingSubscriptions = false
}) => {
  const [channelTracks, setChannelTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedSort] = useState<'recent' | 'popular'>('recent');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePill, setActivePill] = useState<CategoryPillFilter>('All');
  const [internalSyncing, setInternalSyncing] = useState<boolean>(false);
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const isLaxmiPuja = isLaxmiPujaActive();

  // In-memory channel stream cache for instant 0ms switching transitions
  const channelCacheRef = useRef<Map<string, Track[]>>(new Map());
  const avatarScrollRef = useRef<HTMLDivElement>(null);

  // Toggle to collapse/hide channel circle story tray
  const [showStoryTray, setShowStoryTray] = useState<boolean>(() => {
    return localStorage.getItem('aura_show_story_tray') !== 'false';
  });

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

  // View mode state - defaults to responsive YouTube 'grid' as requested
  const [layoutMode, setLayoutMode] = useState<ViewLayoutMode>(() => {
    const saved = localStorage.getItem('aura_sub_layout');
    if (saved === 'grid' || saved === 'mobile' || saved === 'list') {
      return saved as ViewLayoutMode;
    }
    return 'grid';
  });

  const handleSetLayoutMode = (mode: ViewLayoutMode) => {
    setLayoutMode(mode);
    localStorage.setItem('aura_sub_layout', mode);
  };

  const [isRealtimeSyncing, setIsRealtimeSyncing] = useState<boolean>(false);

  // Channels with unread blue indicators (simulating native YouTube experience)
  const [unreadChannels] = useState<Set<string>>(() => {
    return new Set(['Dangal TV', 'Star Jalsha', 'Trakin Tech', 'Crazy XYZ', 'Sony SAB']);
  });

  // Fetch channel specific streams with instant cache lookup
  const fetchChannelStreams = async (channelName?: string | null, filterOverride?: 'recent' | 'popular', silent: boolean = false) => {
    const activeSort = filterOverride || feedSort;
    const cacheKey = `${channelName || (showOnlyLastSubscribed && lastSubscribedChannel ? lastSubscribedChannel.name : 'ALL_FEEDS')}_${activeSort}`;

    // 1. Instant Cache Hit: populate feed with 0ms transition delay
    const cached = channelCacheRef.current.get(cacheKey);
    if (cached && cached.length > 0) {
      setChannelTracks(cached);
      silent = true; // Still refresh in background without blanking screen
    } else {
      // 2. Optimistic local matching if no direct cache entry
      const targetStr = channelName || (subscriptions[0]?.name || '');
      if (targetStr) {
        const optimistic = DEFAULT_TRACKS.filter(t => 
          (t.channel || '').toLowerCase().includes(targetStr.toLowerCase())
        );
        if (optimistic.length > 0) {
          setChannelTracks(optimistic);
          silent = true;
        }
      }
    }

    if (!silent && channelTracks.length === 0) setLoading(true);
    setIsRealtimeSyncing(true);

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
        channelCacheRef.current.set(cacheKey, data.tracks);
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
        const fallback = filtered.length ? filtered : DEFAULT_TRACKS;
        channelCacheRef.current.set(cacheKey, fallback);
        setChannelTracks(fallback);
      }
    } catch (e) {
      console.warn("Notice fetching channel streams:", e);
      if (channelTracks.length === 0) {
        setChannelTracks(DEFAULT_TRACKS);
      }
    } finally {
      setLoading(false);
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

  // Handle Channel Avatar Click (direct single-channel filter)
  const handleSelectChannel = (channelName: string | null) => {
    if (showOnlyLastSubscribed) {
      setShowOnlyLastSubscribed(false);
      localStorage.setItem('aura_show_last_sub_only', 'false');
    }

    if (selectedChannelFilter && channelName && selectedChannelFilter.toLowerCase() === channelName.toLowerCase()) {
      // Tapping again: Clear filter to show all
      setSelectedChannelFilter(null);
      onShowToast('Showing all subscription feeds', 'info');
      const allCached = channelCacheRef.current.get(`ALL_FEEDS_${feedSort}`);
      if (allCached && allCached.length > 0) setChannelTracks(allCached);
    } else {
      setSelectedChannelFilter(channelName);
      if (channelName) {
        onShowToast(`Filtered feed: ${channelName}`, 'info');
        const cacheKey = `${channelName}_${feedSort}`;
        const cached = channelCacheRef.current.get(cacheKey);
        if (cached && cached.length > 0) {
          setChannelTracks(cached);
        } else {
          const optimistic = DEFAULT_TRACKS.filter(t => 
            (t.channel || '').toLowerCase().includes(channelName.toLowerCase())
          );
          if (optimistic.length > 0) setChannelTracks(optimistic);
        }
      } else {
        onShowToast('Showing all subscription feeds', 'info');
      }
    }
  };

  const scrollAvatarTray = (direction: 'left' | 'right') => {
    if (avatarScrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      avatarScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Filter tracks based on search, channel filter, and selected Category Pill
  const filteredTracks = channelTracks.filter(track => {
    // If a channel is selected, make sure channel matches (if not already handled by backend)
    if (selectedChannelFilter) {
      const trackChan = (track.channel || '').toLowerCase();
      const targetChan = selectedChannelFilter.toLowerCase();
      if (!trackChan.includes(targetChan) && !targetChan.includes(trackChan)) {
        return false;
      }
    }

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
      return !track.duration || !track.duration.startsWith('0:');
    }

    if (activePill === 'Shorts') {
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

  // Extract Shorts for YouTube Shorts Shelf
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

  // Currently filtered channel object if exists
  const activeSubscribedChannel = selectedChannelFilter 
    ? subscriptions.find(s => s.name.toLowerCase() === selectedChannelFilter.toLowerCase())
    : null;

  return (
    <div className="w-full max-w-7xl mx-auto px-0 sm:px-4 md:px-6 lg:px-8 space-y-3 sm:space-y-4 pb-28 pt-1">
      
      {/* ========================================================================= */}
      {/* 1. YOUTUBE HEADER & CHANNEL STORY AVATAR TRAY (iOS Liquid Glass)          */}
      {/* ========================================================================= */}
      <div className="mx-2 sm:mx-0 ios-glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-5 space-y-3.5 sm:space-y-4 shadow-sm">
        
        {/* Top Header Bar with YouTube Subscriptions Branding & Manage Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-md shadow-rose-600/30 shrink-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Subscriptions
                </h1>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  {showOnlyLastSubscribed && lastSubscribedChannel 
                    ? 'Latest Subscribed' 
                    : `${subscriptions.length} channels`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions: Story Tray Toggle / Last Subscribed Toggle / Sync / Manage */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                setShowStoryTray(prev => {
                  const next = !prev;
                  localStorage.setItem('aura_show_story_tray', String(next));
                  return next;
                });
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer ${
                showStoryTray 
                  ? 'ios-glass-pill text-slate-700 dark:text-zinc-300' 
                  : 'bg-red-600/15 text-red-500 border border-red-500/30'
              }`}
              title={showStoryTray ? 'Hide channels story carousel' : 'Show channels story carousel'}
            >
              {showStoryTray ? 'Hide Story' : 'Story Tray'}
            </button>

            {lastSubscribedChannel && (
              <button
                onClick={() => handleToggleLastSubscribedOnly(!showOnlyLastSubscribed)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 active:scale-95 ${
                  showOnlyLastSubscribed
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'ios-glass-pill text-slate-700 dark:text-zinc-300'
                }`}
                title={showOnlyLastSubscribed ? 'Show all channels' : 'Show only latest subscribed channel'}
              >
                <Zap size={13} className={showOnlyLastSubscribed ? 'fill-white' : 'text-amber-500'} />
                <span className="hidden sm:inline">{showOnlyLastSubscribed ? 'Latest Only' : 'Latest'}</span>
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
              className="w-8 h-8 rounded-xl ios-glass-button flex items-center justify-center text-slate-700 dark:text-zinc-300 hover:text-rose-500 transition-all active:scale-90 disabled:opacity-50"
              title="Sync Subscriptions"
            >
              <RefreshCw size={15} className={internalSyncing || isSyncingSubscriptions ? "animate-spin text-rose-500" : ""} />
            </button>

            <button
              onClick={onOpenSubscriptionsModal}
              className="px-3 py-1.5 text-xs font-bold rounded-xl ios-glass-pill text-rose-600 dark:text-rose-400 transition-all flex items-center gap-1 active:scale-95"
            >
              <span>Manage</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* 2. HORIZONTAL AVATAR STORY CAROUSEL WITH LEFT/RIGHT CONTROLS */}
        {showStoryTray && (
        <div className="relative group/carousel">
          {/* Scroll Left Button */}
          <button
            onClick={() => scrollAvatarTray('left')}
            className="hidden sm:flex absolute -left-2 top-6 -translate-y-1/2 z-10 w-7 h-7 rounded-lg bg-white/95 dark:bg-zinc-800/95 shadow-md border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:scale-105"
            title="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>

          <div 
            ref={avatarScrollRef}
            className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1"
          >
            {/* ALL Feeds Bubble */}
            <button
              onClick={() => handleSelectChannel(null)}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer active:scale-95 transition-transform duration-100"
              title="Show uploads from all subscribed channels"
            >
              <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-150 p-0.5 ${
                !selectedChannelFilter && !showOnlyLastSubscribed
                  ? 'bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 ring-2 ring-red-500 scale-105 shadow-md'
                  : 'bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700'
              }`}>
                <div className="w-full h-full rounded-xl bg-slate-900 dark:bg-zinc-950 text-white flex items-center justify-center font-black text-xs tracking-wider">
                  ALL
                </div>
              </div>
              <span className={`text-[11px] font-semibold truncate max-w-[68px] text-center ${
                !selectedChannelFilter && !showOnlyLastSubscribed 
                  ? 'text-red-600 dark:text-red-400 font-bold' 
                  : 'text-slate-600 dark:text-zinc-400'
              }`}>
                All
              </span>
            </button>

            {/* Subscribed Channels List */}
            {subscriptions.map((ch, idx) => {
              const channelKey = ch?.id || ch?.name || `ch-${idx}`;
              const isSelected = selectedChannelFilter && (ch?.name || '').toLowerCase() === selectedChannelFilter.toLowerCase();
              const hasUnread = ch?.name ? unreadChannels.has(ch.name) : false;

              return (
                <button
                  key={`sub-channel-avatar-${channelKey}-${idx}`}
                  onClick={() => handleSelectChannel(ch.name)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer relative active:scale-95 transition-transform duration-100"
                  title={isSelected ? `Tap to show all channels` : `Filter by ${ch.name}`}
                >
                  <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl p-0.5 transition-all duration-150 relative ${
                    isSelected
                      ? 'bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 ring-2 ring-red-500 scale-105 shadow-md'
                      : 'bg-slate-200 dark:bg-zinc-800 hover:scale-105'
                  }`}>
                    <img
                      src={ch.avatar && !ch.avatar.includes('unsplash') ? ch.avatar : getChannelAvatar(ch.name)}
                      alt={ch.name}
                      className="w-full h-full object-cover rounded-xl bg-zinc-950"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getFallbackChannelAvatar(ch.name);
                      }}
                    />
                    
                    {/* YouTube Native Blue Unread Dot */}
                    {hasUnread && !isSelected && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-500 border-2 border-white dark:border-[#0f0f0f] rounded-xs shadow-xs" />
                    )}
                  </div>

                  <span className={`text-[11px] font-medium tracking-tight truncate max-w-[68px] text-center ${
                    isSelected 
                      ? 'text-red-600 dark:text-red-400 font-bold' 
                      : 'text-slate-700 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white'
                  }`}>
                    {ch.name}
                  </span>
                </button>
              );
            })}

            {/* Add Channel Button */}
            <button
              onClick={onOpenSubscriptionsModal}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
              title="Subscribe to more channels"
            >
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border border-dashed border-red-500/60 bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all group-hover:scale-105 shadow-xs">
                <UserPlus size={18} />
              </div>
              <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 truncate max-w-[68px] text-center">
                + Add
              </span>
            </button>
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={() => scrollAvatarTray('right')}
            className="hidden sm:flex absolute -right-2 top-6 -translate-y-1/2 z-10 w-7 h-7 rounded-lg bg-white/95 dark:bg-zinc-800/95 shadow-md border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:scale-105"
            title="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        )}

        {/* 3. ACTIVE CHANNEL FILTER BANNER (When single channel is selected) */}
        {selectedChannelFilter && (
          <div className="p-3 bg-slate-50 dark:bg-zinc-900/90 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={activeSubscribedChannel?.avatar || getChannelAvatar(selectedChannelFilter)}
                alt={selectedChannelFilter}
                className="w-10 h-10 rounded-xl object-cover border-2 border-red-500 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getFallbackChannelAvatar(selectedChannelFilter);
                }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {selectedChannelFilter}
                  </span>
                  <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                  <span>Filtered channel feed</span>
                  <span>•</span>
                  <span>{filteredTracks.length} video{filteredTracks.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenChannelDetails && (
                <button
                  onClick={() => onOpenChannelDetails(selectedChannelFilter)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-lg border border-slate-200 dark:border-zinc-700 shadow-xs transition-colors"
                >
                  Channel Page
                </button>
              )}
              <button
                onClick={() => handleSelectChannel(null)}
                className="px-2.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs flex items-center gap-1 transition-colors"
                title="Clear filter and show all feeds"
              >
                <X size={13} />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. YOUTUBE QUICK FILTER CHIPS BAR (iOS Liquid Glass Pills) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pt-2 border-t border-black/5 dark:border-white/10">
          {/* Active channel indicator chip if filtered */}
          {selectedChannelFilter && (
            <button
              onClick={() => handleSelectChannel(null)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 bg-rose-600 text-white flex items-center gap-1.5 shadow-sm hover:bg-rose-700 transition-all active:scale-95"
              title="Click to remove channel filter"
            >
              <span>{selectedChannelFilter}</span>
              <X size={12} />
            </button>
          )}

          {CATEGORY_PILLS.map((pill) => {
            const isActive = activePill === pill;
            return (
              <button
                key={`sub-pill-${pill}`}
                onClick={() => {
                  setActivePill(pill);
                  onShowToast(`Feed: ${pill}`, 'info');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  isActive
                    ? isLaxmiPuja
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold shadow-[0_0_14px_rgba(245,158,11,0.45)]'
                      : 'ios-glass-pill-active font-bold'
                    : 'ios-glass-pill text-slate-700 dark:text-zinc-200'
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH & RESPONSIVE LAYOUT SWITCHER TOOLBAR                            */}
      {/* ========================================================================= */}
      <div className={`mx-2 sm:mx-0 flex items-center justify-between gap-3 ios-glass-card p-2 sm:p-2.5 rounded-2xl shadow-sm ${
        isLaxmiPuja 
          ? 'border border-amber-400/35 shadow-[0_0_15px_rgba(245,158,11,0.15)] bg-gradient-to-r from-amber-500/[0.04] via-transparent to-yellow-500/[0.04]' 
          : ''
      }`}>
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subscriptions feed..."
            className="w-full bg-white/40 dark:bg-black/30 backdrop-blur-md text-slate-900 dark:text-white text-xs pl-8 pr-3 py-1.5 rounded-xl border border-black/5 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium placeholder:text-slate-500 dark:placeholder:text-zinc-400"
          />
          <Search size={14} className="absolute left-2.5 top-2 text-slate-500 dark:text-zinc-400" />
        </div>

        {/* View Layout Mode Buttons: Responsive Grid / Feed / Compact */}
        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-xl border border-black/5 dark:border-white/10">
          <button
            onClick={() => handleSetLayoutMode('grid')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              layoutMode === 'grid'
                ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Responsive Video Grid (YouTube desktop layout)"
          >
            <LayoutGrid size={14} />
            <span className="hidden sm:inline">Grid</span>
          </button>

          <button
            onClick={() => handleSetLayoutMode('mobile')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              layoutMode === 'mobile'
                ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Single-column Full Feed"
          >
            <Tv size={14} />
            <span className="hidden sm:inline">Feed</span>
          </button>

          <button
            onClick={() => handleSetLayoutMode('list')}
            className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
              layoutMode === 'list'
                ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
            title="Compact List View"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. YOUTUBE SHORTS SHELF (When in All or Shorts view) */}
      {/* ========================================================================= */}
      {(activePill === 'All' || activePill === 'Shorts') && shortsTracks.length > 0 && (
        <div className="mx-2 sm:mx-0 ios-glass-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-xs">
                <Flame size={13} className="fill-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Shorts
              </h3>
            </div>
            <button 
              onClick={() => setActivePill('Shorts')}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {shortsTracks.map((track, sIdx) => {
              const videoId = extractYouTubeId(track.id);
              const thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop`;
              
              return (
                <div
                  key={`sub-short-${track.id || sIdx}-${sIdx}`}
                  onClick={() => {
                    onPlay(track);
                    onShowToast(`Playing Short: ${track.title}`, 'success');
                  }}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[9/16] bg-black/60 border border-white/10 shadow-sm hover:scale-102 transition-all active:scale-95"
                >
                  <img
                    src={thumb}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-2.5 text-white">
                    <span className="text-xs font-bold leading-tight line-clamp-2 drop-shadow-sm">
                      {track.title}
                    </span>
                    <span className="text-[10px] text-zinc-300 font-medium mt-1">
                      {track.views || '1.2M views'}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black text-white flex items-center gap-0.5 border border-white/10">
                    <Flame size={10} className="text-rose-500 fill-rose-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Syncing Progress Bar */}
      {isRealtimeSyncing && channelTracks.length > 0 && (
        <div className="w-full h-1 bg-slate-100 dark:bg-zinc-800 overflow-hidden rounded-full">
          <div className="w-1/3 h-full bg-red-600 animate-[pulse_0.4s_ease-in-out_infinite] rounded-full" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MAIN VIDEO FEED - RESPONSIVE GRID / FEED / LIST */}
      {/* ========================================================================= */}
      {loading && channelTracks.length === 0 ? (
        /* SKELETON LOADING GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-7">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={`sub-skel-${i}`} className="space-y-3 animate-pulse">
              <div className="w-full aspect-video bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-5/6" />
                  <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredTracks.length > 0 ? (
        layoutMode === 'grid' ? (
          /* ================================================================= */
          /* ================================================================= */
          /* YOUTUBE COMPACT HIGH-DENSITY GRID (Edge-to-Edge Mobile, Multi-col Desktop) */
          /* ================================================================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-y-4 sm:gap-y-5 gap-x-2.5 sm:gap-x-4 lg:gap-5">
            {filteredTracks.map((track, tIdx) => {
              const videoId = extractYouTubeId(track.id);
              const thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop`;
              const title = decodeHtmlEntities(track.title);
              const channel = decodeHtmlEntities(track.channel);
              const isPlaying = currentTrackId === track.id;
              const isFav = favorites.some((f) => f.id === track.id);
              const isMenuOpen = activeMenuTrackId === track.id;

              return (
                <div
                  key={`yt-grid-card-${track.id || tIdx}-${tIdx}`}
                  className={`rounded-none sm:rounded-3xl p-0 sm:p-3 border-x-0 sm:border border-b sm:border-black/5 dark:sm:border-white/10 border-black/10 dark:border-white/10 pb-4 sm:pb-3 bg-transparent sm:ios-glass-card group flex flex-col space-y-2.5 sm:space-y-3 cursor-pointer transition-all duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] hover:sm:-translate-y-1 active:scale-[0.985] will-change-transform ${
                    isPlaying ? 'ring-2 ring-rose-500/80 shadow-lg shadow-rose-500/20' : ''
                  }`}
                >
                  {/* 16:9 Video Thumbnail with Badges and Hover Overlay (Edge-to-Edge on mobile) */}
                  <div 
                    onClick={() => onPlay(track)}
                    className="relative w-full aspect-video rounded-none sm:rounded-2xl overflow-hidden bg-black/60 border-y sm:border border-black/5 dark:border-white/10 shadow-xs"
                  >
                    <img
                      src={thumb}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-220 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : '';
                      }}
                    />

                    {/* Hover Play Button */}
                    <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-160 ${
                      isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transform group-hover:scale-110 active:scale-95 transition-transform duration-160 ease-[cubic-bezier(0.16,1,0.3,1)]">
                        <Play size={20} className="fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Duration Badge with iOS Glass Pill */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-mono font-bold rounded-full border border-white/10 shadow-xs">
                      {track.duration || '3:45'}
                    </div>

                    {/* Playing Equalizer / Indicator */}
                    {isPlaying && (
                      <div className="absolute top-2 left-2 px-2.5 py-0.5 bg-gradient-to-r from-rose-600 to-red-600 text-white text-[10px] font-black rounded-full flex items-center gap-1 shadow-md border border-white/20">
                        <Volume2 size={12} className="animate-pulse" />
                        <span>PLAYING</span>
                      </div>
                    )}

                    {/* New Badge */}
                    {!isPlaying && (track.publishedTime?.includes('hour') || track.publishedTime?.includes('minute')) && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-600/90 backdrop-blur-md text-white text-[9.5px] font-black rounded-full shadow-md flex items-center gap-1 border border-white/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>NEW</span>
                      </div>
                    )}
                  </div>

                  {/* Video Info Row: Avatar + Title/Metadata + 3-Dots Menu (px-3 on mobile edge-to-edge) */}
                  <div className="px-3 sm:px-0 flex items-start gap-3">
                    {/* Channel Avatar */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectChannel(channel);
                      }}
                      className="w-9 h-9 rounded-full shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-red-500 transition-all border border-slate-200 dark:border-zinc-800"
                      title={`Filter by ${channel}`}
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

                    {/* Video Title and Metadata */}
                    <div 
                      onClick={() => onPlay(track)}
                      className="flex-1 min-w-0 space-y-1"
                    >
                      <h3 className={`text-sm font-semibold line-clamp-2 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors ${
                        isPlaying ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-900 dark:text-zinc-100'
                      }`}>
                        {title}
                      </h3>

                      <div className="space-y-0.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenChannelDetails) {
                              onOpenChannelDetails(channel);
                            } else {
                              handleSelectChannel(channel);
                            }
                          }}
                          className="hover:text-slate-900 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer truncate"
                        >
                          <span className="truncate">{channel}</span>
                          <CheckCircle2 size={12} className="text-zinc-400 shrink-0" />
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{track.views || '850K views'}</span>
                          {track.publishedTime && (
                            <>
                              <span>•</span>
                              <span>{track.publishedTime}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3-Dots Kebab Action Menu */}
                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuTrackId(isMenuOpen ? null : track.id);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-all"
                        title="More options"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {isMenuOpen && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 py-1.5 z-30 animate-scale-up"
                        >
                          <button
                            onClick={() => {
                              onPlay(track);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
                          >
                            <Play size={15} className="text-red-600" />
                            <span>Play Video</span>
                          </button>

                          <button
                            onClick={() => {
                              handleSelectChannel(channel);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
                          >
                            <Tv size={15} className="text-red-500" />
                            <span>Filter this channel only</span>
                          </button>

                          {onOpenAddToPlaylist && (
                            <button
                              onClick={() => {
                                onOpenAddToPlaylist(track);
                                setActiveMenuTrackId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
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
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
                          >
                            <Heart size={15} className={isFav ? "text-rose-500 fill-rose-500" : "text-slate-400"} />
                            <span>{isFav ? 'Remove from Liked' : 'Like video'}</span>
                          </button>

                          <button
                            onClick={() => {
                              onDownload(track);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
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
                              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
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
                              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
                            >
                              <Tv size={15} className="text-amber-500" />
                              <span>Go to channel page</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              handleShareTrack(track);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
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
        ) : layoutMode === 'mobile' ? (
          /* ================================================================= */
          /* YOUTUBE SINGLE-COLUMN FEED LAYOUT                                 */
          /* ================================================================= */
          <div className="max-w-2xl mx-auto space-y-6">
            {filteredTracks.map((track, tIdx) => {
              const videoId = extractYouTubeId(track.id);
              const thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop`;
              const title = decodeHtmlEntities(track.title);
              const channel = decodeHtmlEntities(track.channel);
              const isPlaying = currentTrackId === track.id;
              const isFav = favorites.some((f) => f.id === track.id);
              const isMenuOpen = activeMenuTrackId === track.id;

              return (
                <div
                  key={`yt-feed-card-${track.id || tIdx}-${tIdx}`}
                  className="bg-white dark:bg-[#0f0f0f] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs"
                >
                  <div 
                    onClick={() => onPlay(track)}
                    className="relative w-full aspect-video bg-zinc-950 cursor-pointer overflow-hidden group"
                  >
                    <img
                      src={thumb}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                      loading="lazy"
                    />

                    <div className={`absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center transition-opacity ${
                      isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/40">
                        <Play size={24} className="fill-white ml-1" />
                      </div>
                    </div>

                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/85 backdrop-blur-xs text-white text-[11px] font-mono font-bold rounded">
                      {track.duration || '3:45'}
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 flex items-start justify-between gap-3">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectChannel(channel);
                      }}
                      className="w-10 h-10 rounded-full shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-red-500 transition-all border border-slate-200 dark:border-zinc-800"
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

                    <div 
                      onClick={() => onPlay(track)}
                      className="flex-1 min-w-0 cursor-pointer space-y-1"
                    >
                      <h3 className={`text-sm sm:text-base font-bold line-clamp-2 leading-snug ${
                        isPlaying ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        {title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium flex-wrap">
                        <span className="font-semibold flex items-center gap-1">
                          <span>{channel}</span>
                          <CheckCircle2 size={12} className="text-zinc-400 shrink-0" />
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

                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuTrackId(isMenuOpen ? null : track.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-all"
                        title="More options"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {isMenuOpen && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 bottom-full mb-1 w-52 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 py-1.5 z-30 animate-scale-up"
                        >
                          <button
                            onClick={() => {
                              onPlay(track);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
                          >
                            <Play size={15} className="text-red-600" />
                            <span>Play Video</span>
                          </button>

                          <button
                            onClick={() => {
                              handleSelectChannel(channel);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
                          >
                            <Tv size={15} className="text-red-500" />
                            <span>Filter this channel only</span>
                          </button>

                          {onOpenAddToPlaylist && (
                            <button
                              onClick={() => {
                                onOpenAddToPlaylist(track);
                                setActiveMenuTrackId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
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
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
                          >
                            <Heart size={15} className={isFav ? "text-rose-500 fill-rose-500" : "text-slate-400"} />
                            <span>{isFav ? 'Remove from Liked' : 'Like video'}</span>
                          </button>

                          <button
                            onClick={() => {
                              onDownload(track);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
                          >
                            <Download size={15} className="text-emerald-500" />
                            <span>Download offline</span>
                          </button>

                          <button
                            onClick={() => {
                              handleShareTrack(track);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
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
          /* ================================================================= */
          /* COMPACT LIST VIEW                                                 */
          /* ================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTracks.map((track, tIdx) => (
              <TrackCard
                key={`sub-track-${track.id || tIdx}-${tIdx}`}
                track={track}
                onPlay={onPlay}
                onDownload={onDownload}
                isPlayingCurrent={currentTrackId === track.id}
                isFavorite={favorites.some((f) => f.id === track.id)}
                onToggleFavorite={onToggleFavorite}
                onOpenAddToPlaylist={onOpenAddToPlaylist}
                onOpenMetadata={onOpenMetadata}
                onOpenChannelDetails={onOpenChannelDetails}
                viewMode="list"
              />
            ))}
          </div>
        )
      ) : (
        /* ZERO STATE */
        <div className="py-16 text-center space-y-3 bg-white dark:bg-[#0f0f0f] rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 p-8 w-full max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {selectedChannelFilter 
              ? `No uploads found for "${selectedChannelFilter}"` 
              : `No uploads found for "${activePill}"`}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
            {selectedChannelFilter
              ? 'This channel may not have uploaded recently or matches your active filters.'
              : 'Try selecting "All", clearing your search query, or managing your subscriptions.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            {selectedChannelFilter && (
              <button
                onClick={() => handleSelectChannel(null)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Show All Channels
              </button>
            )}
            <button
              onClick={() => {
                setActivePill('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

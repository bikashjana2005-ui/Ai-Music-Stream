import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Check, 
  Plus, 
  Search, 
  RefreshCw, 
  Radio, 
  CheckCircle2, 
  Bell, 
  BellOff, 
  Share2, 
  Sparkles,
  Tv,
  ListMusic,
  ExternalLink,
  Film,
  Flame,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track, SubscribedChannel } from '../types';
import { TrackCard } from './TrackCard';
import { DEFAULT_TRACKS } from '../data/fallbackTracks';
import { getChannelAvatar, getFallbackChannelAvatar } from '../utils/channelLogos';

interface ChannelDetailsModalProps {
  isOpen: boolean;
  channelName: string | null;
  onClose: () => void;
  subscriptions: SubscribedChannel[];
  onToggleSubscribe: (channel: SubscribedChannel) => void;
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  currentTrackId?: string;
  favorites: Track[];
  onToggleFavorite: (track: Track) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type TabType = 'videos' | 'popular' | 'shorts' | 'about';

export const ChannelDetailsModal: React.FC<ChannelDetailsModalProps> = ({
  isOpen,
  channelName,
  onClose,
  subscriptions,
  onToggleSubscribe,
  onPlay,
  onDownload,
  currentTrackId,
  favorites,
  onToggleFavorite,
  onShowToast
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('videos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasNotificationsEnabled, setHasNotificationsEnabled] = useState<boolean>(true);

  // Determine if channel is currently subscribed
  const cleanName = (channelName || '').trim();
  const isSubscribed = subscriptions.some(
    s => s.name.toLowerCase() === cleanName.toLowerCase()
  );

  // Fetch uploads for this specific channel
  useEffect(() => {
    if (!isOpen || !cleanName) return;

    let isMounted = true;
    setLoading(true);

    const fetchChannelVideos = async () => {
      try {
        const res = await fetch("/api/channels/tracks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelName: cleanName, sortBy: 'recent' })
        });
        const data = await res.json();
        
        if (isMounted) {
          if (data.tracks && data.tracks.length > 0) {
            setTracks(data.tracks);
          } else {
            // Fallback matching
            const filtered = DEFAULT_TRACKS.filter(t => 
              (t.channel || '').toLowerCase().includes(cleanName.toLowerCase())
            );
            setTracks(filtered.length ? filtered : DEFAULT_TRACKS);
          }
        }
      } catch (err) {
        console.warn("Error fetching channel details:", err);
        if (isMounted) {
          const filtered = DEFAULT_TRACKS.filter(t => 
            (t.channel || '').toLowerCase().includes(cleanName.toLowerCase())
          );
          setTracks(filtered.length ? filtered : DEFAULT_TRACKS);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchChannelVideos();

    return () => {
      isMounted = false;
    };
  }, [isOpen, cleanName]);

  if (!isOpen || !cleanName) return null;

  // Filtered tracks based on tab and internal search
  const displayTracks = tracks.filter(t => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q)) return false;
    }

    if (activeTab === 'popular') {
      return (t.views || '').toLowerCase().includes('m') || (t.views || '').toLowerCase().includes('k');
    }

    if (activeTab === 'shorts') {
      return (t.duration || '').startsWith('0:') || (t.title || '').toLowerCase().includes('#shorts');
    }

    return true;
  });

  const handleSubscribeToggle = () => {
    const handle = `@${cleanName.replace(/\s+/g, '').toLowerCase()}`;
    const channelObj: SubscribedChannel = {
      id: `ch-${cleanName.toLowerCase().replace(/\s+/g, '-')}`,
      name: cleanName,
      handle,
      avatar: getChannelAvatar(cleanName),
      subscribers: '12.5M subscribers'
    };
    onToggleSubscribe(channelObj);
    onShowToast(
      isSubscribed ? `Unsubscribed from ${cleanName}` : `Subscribed to ${cleanName}! Feed updated.`,
      isSubscribed ? 'info' : 'success'
    );
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      onPlay(tracks[0]);
      onShowToast(`Playing ${cleanName}'s channel stream`, 'success');
    }
  };

  const handleShareChannel = () => {
    const channelUrl = `https://youtube.com/@${cleanName.replace(/\s+/g, '')}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(channelUrl);
      onShowToast(`Copied ${cleanName} channel link!`, 'success');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-white overflow-hidden flex flex-col z-10 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button Floating Top Right */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-30 p-2.5 bg-slate-950/80 hover:bg-rose-600 text-white rounded-full transition-all border border-white/20 shadow-lg active:scale-90"
            title="Close"
          >
            <X size={18} />
          </button>

          {/* CHANNEL BANNER / HEADER */}
          <div className="relative h-32 sm:h-44 w-full bg-gradient-to-r from-rose-900 via-purple-900 to-indigo-950 overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-black/60" />
            
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="absolute bottom-3 left-4 sm:left-6 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-slate-200 border border-white/10">
              <Tv size={13} className="text-rose-400" />
              <span>Official YouTube Creator Channel</span>
            </div>
          </div>

          {/* CHANNEL PROFILE INFO ROW */}
          <div className="px-4 sm:px-6 pt-3 pb-4 border-b border-slate-800 bg-slate-900 shrink-0 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 relative z-20">
              
              <div className="flex items-end gap-3.5 sm:gap-4">
                {/* Channel Circular Logo */}
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1 bg-slate-900 ring-4 ring-rose-600/40 shadow-2xl shrink-0 overflow-hidden">
                  <img
                    src={getChannelAvatar(cleanName)}
                    alt={cleanName}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getFallbackChannelAvatar(cleanName);
                    }}
                    className="w-full h-full object-cover rounded-full bg-slate-950"
                  />
                </div>

                <div className="pb-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-lg sm:text-2xl font-black text-white leading-tight">
                      {cleanName}
                    </h2>
                    <CheckCircle2 size={18} className="text-rose-500 fill-rose-500/20" />
                  </div>

                  <p className="text-xs text-slate-400 font-semibold flex items-center gap-2">
                    <span>@{cleanName.replace(/\s+/g, '').toLowerCase()}</span>
                    <span>•</span>
                    <span className="text-rose-300">12.5M Subscribers</span>
                    <span>•</span>
                    <span>450+ Videos</span>
                  </p>
                </div>
              </div>

              {/* Channel Action Controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0">
                <button
                  onClick={handleSubscribeToggle}
                  className={`px-4 py-2 rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    isSubscribed
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  }`}
                >
                  {isSubscribed ? (
                    <>
                      <Check size={16} className="text-emerald-400" />
                      <span>Subscribed</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Subscribe</span>
                    </>
                  )}
                </button>

                {isSubscribed && (
                  <button
                    onClick={() => {
                      setHasNotificationsEnabled(!hasNotificationsEnabled);
                      onShowToast(
                        hasNotificationsEnabled ? 'Channel notifications muted' : 'All upload notifications turned ON!',
                        'info'
                      );
                    }}
                    className={`p-2 rounded-xl border transition-all ${
                      hasNotificationsEnabled
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title="Toggle Notification Bell"
                  >
                    {hasNotificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                  </button>
                )}

                {tracks.length > 0 && (
                  <button
                    onClick={handlePlayAll}
                    className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Play size={15} className="fill-slate-950" />
                    <span>Play All</span>
                  </button>
                )}

                <button
                  onClick={handleShareChannel}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all active:scale-90"
                  title="Share Channel"
                >
                  <Share2 size={16} />
                </button>
              </div>

            </div>

            {/* CHANNEL NAVIGATION TABS & INTERNAL SEARCH */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    activeTab === 'videos'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Latest Videos
                </button>
                <button
                  onClick={() => setActiveTab('popular')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    activeTab === 'popular'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Most Popular
                </button>
                <button
                  onClick={() => setActiveTab('shorts')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    activeTab === 'shorts'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Shorts
                </button>
                <button
                  onClick={() => setActiveTab('about')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    activeTab === 'about'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  About Channel
                </button>
              </div>

              {activeTab !== 'about' && (
                <div className="relative w-full sm:w-52">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${cleanName}...`}
                    className="w-full bg-slate-950 text-white text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold placeholder:text-slate-500"
                  />
                  <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                </div>
              )}
            </div>

          </div>

          {/* CHANNEL CONTENT AREA */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-[300px]">
            {activeTab === 'about' ? (
              <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <Info size={20} className="text-rose-500" />
                  <h3 className="text-sm font-black text-white">About {cleanName}</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Welcome to the official {cleanName} YouTube music channel! Stay updated with the latest high-definition music videos, official track releases, live sessions, and exclusive behind-the-scenes streams.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="block text-slate-400 text-[10px] uppercase font-bold">Joined</span>
                    <span className="font-extrabold text-white">2018</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="block text-slate-400 text-[10px] uppercase font-bold">Total Views</span>
                    <span className="font-extrabold text-white">4.2B Views</span>
                  </div>
                </div>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={`ch-skel-${i}`} className="bg-slate-950 animate-pulse rounded-2xl h-48 border border-slate-800" />
                ))}
              </div>
            ) : displayTracks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayTracks.map((track) => (
                  <TrackCard
                    key={`ch-modal-track-${track.id}`}
                    track={track}
                    onPlay={onPlay}
                    onDownload={onDownload}
                    isPlayingCurrent={currentTrackId === track.id}
                    isFavorite={favorites.some(f => f.id === track.id)}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <p className="text-xs font-bold">No videos found for this filter</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1 bg-slate-800 text-xs font-bold text-white rounded-lg"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

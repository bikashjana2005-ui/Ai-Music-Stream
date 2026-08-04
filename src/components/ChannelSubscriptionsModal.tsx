import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Youtube, 
  Check, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  Sparkles, 
  Users, 
  RefreshCw, 
  Bell, 
  BellOff,
  Compass, 
  CheckCircle2, 
  Filter, 
  AtSign,
  Radio,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SubscribedChannel } from '../types';
import { loginWithGoogle, fetchYouTubeUserSubscriptions } from '../lib/firebase';

interface ChannelSubscriptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: SubscribedChannel[];
  onToggleSubscribe: (channel: SubscribedChannel) => void;
  onSelectChannelFilter?: (channelName: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const POPULAR_RECOMMENDED_CHANNELS: SubscribedChannel[] = [
  {
    id: 'rec-lofigirl',
    name: 'Lofi Girl',
    handle: '@LofiGirl',
    avatar: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop',
    subscribers: '14.2M subscribers'
  },
  {
    id: 'rec-cokestudio',
    name: 'Coke Studio Bangla',
    handle: '@CokeStudioBangla',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop',
    subscribers: '3.8M subscribers'
  },
  {
    id: 'rec-tseries',
    name: 'T-Series',
    handle: '@tseries',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop',
    subscribers: '268M subscribers'
  },
  {
    id: 'rec-monstercat',
    name: 'Monstercat Uncaged',
    handle: '@MonstercatUncaged',
    avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop',
    subscribers: '7.6M subscribers'
  },
  {
    id: 'rec-chillhop',
    name: 'Chillhop Music',
    handle: '@ChillhopMusic',
    avatar: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=200&auto=format&fit=crop',
    subscribers: '3.3M subscribers'
  },
  {
    id: 'rec-colors',
    name: 'COLORS',
    handle: '@COLORSxSTUDIOS',
    avatar: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200&auto=format&fit=crop',
    subscribers: '7.1M subscribers'
  },
  {
    id: 'rec-spinnin',
    name: 'Spinnin Records',
    handle: '@SpinninRecords',
    avatar: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&auto=format&fit=crop',
    subscribers: '30.4M subscribers'
  },
  {
    id: 'rec-nprmusic',
    name: 'NPR Music',
    handle: '@nprmusic',
    avatar: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&auto=format&fit=crop',
    subscribers: '7.9M subscribers'
  }
];

export const ChannelSubscriptionsModal: React.FC<ChannelSubscriptionsModalProps> = ({
  isOpen,
  onClose,
  subscriptions,
  onToggleSubscribe,
  onSelectChannelFilter,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'discover' | 'manage' | 'sync'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SubscribedChannel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncingYouTube, setIsSyncingYouTube] = useState(false);
  const [filterActiveQuery, setFilterActiveQuery] = useState('');
  const [channelBellStates, setChannelBellStates] = useState<Record<string, boolean>>({});

  // Sync real-time original YouTube account subscriptions via Google OAuth
  const handleSyncYouTubeAccountSubscriptions = async () => {
    setIsSyncingYouTube(true);
    try {
      let channels: SubscribedChannel[] = [];
      try {
        channels = await fetchYouTubeUserSubscriptions();
      } catch (tokenErr) {
        onShowToast('Authenticating with Google for YouTube Subscriptions...', 'info');
        const loginRes = await loginWithGoogle();
        if (loginRes?.accessToken) {
          channels = await fetchYouTubeUserSubscriptions(loginRes.accessToken);
        } else {
          throw new Error('Could not retrieve YouTube access token');
        }
      }

      if (!channels || channels.length === 0) {
        onShowToast('No active YouTube subscriptions found on your Google Account.', 'info');
        return;
      }

      let addedCount = 0;
      channels.forEach((ch) => {
        const alreadySubbed = subscriptions.some(
          s => s.id === ch.id || (s.name || '').toLowerCase() === (ch.name || '').toLowerCase()
        );
        if (!alreadySubbed) {
          onToggleSubscribe(ch);
          addedCount++;
        }
      });

      if (addedCount > 0) {
        onShowToast(`Successfully synced ${addedCount} live YouTube channels!`, 'success');
        setActiveTab('manage');
      } else {
        onShowToast(`All ${channels.length} YouTube channels are already synced.`, 'info');
      }
    } catch (err: any) {
      console.error('YouTube Subscriptions sync error:', err);
      onShowToast('Failed to sync YouTube subscriptions. Please try signing in again.', 'error');
    } finally {
      setIsSyncingYouTube(false);
    }
  };

  const handleSearchChannels = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch('/api/channels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() })
      });
      const data = await res.json();
      if (data.channels && data.channels.length > 0) {
        setSearchResults(data.channels);
      } else {
        const customChannel: SubscribedChannel = {
          id: `custom-${Date.now()}`,
          name: searchQuery.trim(),
          handle: searchQuery.trim().startsWith('@') ? searchQuery.trim() : `@${searchQuery.trim().replace(/\s+/g, '')}`,
          avatar: `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop`,
          subscribers: 'Custom YouTube Channel',
          isCustom: true
        };
        setSearchResults([customChannel]);
      }
    } catch (err) {
      console.error('Channel search error:', err);
      onShowToast('Could not search channel. Added as custom entry.', 'info');
    } finally {
      setIsSearching(false);
    }
  };

  const isSubscribed = (channelId: string, channelName: string) => {
    return subscriptions.some(
      s => s.id === channelId || (s.name || '').toLowerCase() === (channelName || '').toLowerCase()
    );
  };

  const toggleBell = (channelId: string, channelName: string) => {
    const current = channelBellStates[channelId] !== false; // default true
    setChannelBellStates(prev => ({ ...prev, [channelId]: !current }));
    onShowToast(!current ? `Notifications turned ON for ${channelName}` : `Notifications turned OFF for ${channelName}`, 'info');
  };

  const filteredSubscriptions = subscriptions.filter(ch => 
    filterActiveQuery.trim() === '' ||
    (ch.name || '').toLowerCase().includes(filterActiveQuery.toLowerCase()) ||
    (ch.handle && ch.handle.toLowerCase().includes(filterActiveQuery.toLowerCase()))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-3xl bg-slate-900/95 border border-white/15 rounded-3xl p-5 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.7)] max-h-[92vh] flex flex-col relative text-white transition-colors duration-300 z-10 overflow-hidden backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 shrink-0">
                  <Youtube size={24} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    Manage Subscriptions
                    <span className="text-xs font-black bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                      {subscriptions.length} Active
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Add YouTube creators and labels to curate your real-time Home feed
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 py-3 border-b border-white/10 shrink-0 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('discover')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'discover'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-rose-400/50'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-white/10'
                }`}
              >
                <Compass size={15} />
                <span>Discover & Add</span>
              </button>

              <button
                onClick={() => setActiveTab('manage')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'manage'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-rose-400/50'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-white/10'
                }`}
              >
                <Users size={15} />
                <span>My Subscriptions ({subscriptions.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('sync')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'sync'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-indigo-300 border border-white/10'
                }`}
              >
                <RefreshCw size={15} />
                <span>Google YouTube Sync</span>
              </button>
            </div>

            {/* Scrollable Main Area */}
            <div className="overflow-y-auto flex-1 py-4 space-y-6 pr-1 custom-scrollbar">

              {/* TAB 1: DISCOVER & ADD CHANNELS */}
              {activeTab === 'discover' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Search Channel Bar */}
                  <form onSubmit={handleSearchChannels} className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-200 flex items-center gap-2">
                      <Search size={14} className="text-rose-500" />
                      Search & Add YouTube Channel by Name or Handle
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="e.g. @LofiGirl, Coke Studio, T-Series, Monstercat, SVF..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-950/80 border border-white/15 rounded-2xl px-4 py-3 pl-10 text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                        />
                        <AtSign size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                      </div>
                      <button
                        type="submit"
                        disabled={isSearching || !searchQuery.trim()}
                        className="px-5 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black rounded-2xl shadow-lg shadow-rose-600/25 flex items-center gap-1.5 transition-all shrink-0 active:scale-95 cursor-pointer"
                      >
                        {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        <span>Add Channel</span>
                      </button>
                    </div>
                  </form>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-3 bg-rose-500/10 p-4 rounded-3xl border border-rose-500/30">
                      <h3 className="text-xs font-black text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} /> Search Results
                      </h3>
                      <div className="grid grid-cols-1 gap-2.5">
                        {searchResults.map((ch) => {
                          const subscribed = isSubscribed(ch.id, ch.name);
                          return (
                            <div 
                              key={`search-ch-${ch.id}`}
                              className="flex items-center justify-between gap-3 p-3.5 bg-slate-800/90 rounded-2xl border border-white/10 shadow-sm"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <img 
                                  src={ch.avatar} 
                                  alt={ch.name}
                                  className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-rose-500/40"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                                  }}
                                />
                                <div className="min-w-0">
                                  <h4 className="text-sm font-extrabold truncate text-white flex items-center gap-1.5">
                                    {ch.name}
                                    <CheckCircle2 size={14} className="text-rose-500 shrink-0" />
                                  </h4>
                                  <p className="text-xs text-slate-400 font-medium truncate">
                                    {ch.handle} • <span className="text-rose-400 font-bold">{ch.subscribers}</span>
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  onToggleSubscribe(ch);
                                  onShowToast(subscribed ? `Unsubscribed from ${ch.name}` : `Subscribed to ${ch.name}!`, subscribed ? 'info' : 'success');
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                  subscribed
                                    ? 'bg-slate-700 text-slate-300 hover:bg-rose-600 hover:text-white'
                                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 active:scale-95'
                                }`}
                              >
                                {subscribed ? (
                                  <>
                                    <Check size={14} /> Subscribed
                                  </>
                                ) : (
                                  <>
                                    <Plus size={14} /> Subscribe
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* POPULAR YOUTUBE MUSIC CHANNELS GRID */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Radio size={14} className="text-rose-500" /> Top Popular Music Channels
                      </h3>
                      <span className="text-[11px] text-slate-400 font-semibold">1-Click Instant Subscribe</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {POPULAR_RECOMMENDED_CHANNELS.map((ch) => {
                        const subscribed = isSubscribed(ch.id, ch.name);
                        return (
                          <div
                            key={`rec-ch-${ch.id}`}
                            className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                              subscribed 
                                ? 'bg-rose-500/15 border-rose-500/40 shadow-xs' 
                                : 'bg-slate-950/60 hover:bg-slate-800/80 border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={ch.avatar}
                                alt={ch.name}
                                className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-rose-500/30"
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs font-extrabold truncate text-white flex items-center gap-1">
                                  {ch.name}
                                  <CheckCircle2 size={12} className="text-rose-500 shrink-0" />
                                </h4>
                                <p className="text-[10px] text-slate-400 font-medium truncate">
                                  {ch.handle}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                onToggleSubscribe(ch);
                                onShowToast(subscribed ? `Unsubscribed from ${ch.name}` : `Subscribed to ${ch.name}!`, subscribed ? 'info' : 'success');
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                                subscribed
                                  ? 'bg-slate-700 text-slate-200 hover:bg-rose-600 hover:text-white'
                                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-95'
                              }`}
                            >
                              {subscribed ? <Check size={13} /> : <Plus size={13} />}
                              <span>{subscribed ? 'Subscribed' : 'Subscribe'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: MY SUBSCRIBED CHANNELS */}
              {activeTab === 'manage' && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Filter Subscribed Channels */}
                  <div className="flex items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-white/10">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={filterActiveQuery}
                        onChange={(e) => setFilterActiveQuery(e.target.value)}
                        placeholder="Filter my subscriptions..."
                        className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                      <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    </div>

                    <span className="text-xs font-bold text-slate-400 shrink-0">
                      {filteredSubscriptions.length} channels
                    </span>
                  </div>

                  {filteredSubscriptions.length === 0 ? (
                    <div className="py-12 text-center space-y-3 bg-slate-950/40 rounded-3xl border border-dashed border-white/10 p-6">
                      <Youtube size={38} className="text-slate-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-300">No channels found</p>
                      <button
                        onClick={() => setActiveTab('discover')}
                        className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-rose-500 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Compass size={14} /> Discover Channels
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredSubscriptions.map((ch) => {
                        const isBellOn = channelBellStates[ch.id] !== false;
                        return (
                          <div 
                            key={`sub-manage-${ch.id}`}
                            className="flex items-center justify-between gap-3 p-3.5 bg-slate-800/80 rounded-2xl border border-white/10 hover:border-rose-500/40 transition-all group"
                          >
                            <div 
                              onClick={() => {
                                if (onSelectChannelFilter) {
                                  onSelectChannelFilter(ch.name);
                                  onClose();
                                }
                              }}
                              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                              title="Click to view stream feed on Home"
                            >
                              <img 
                                src={ch.avatar} 
                                alt={ch.name}
                                className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-rose-500/30 group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs sm:text-sm font-extrabold truncate text-white group-hover:text-rose-400 transition-colors flex items-center gap-1">
                                  {ch.name}
                                  <CheckCircle2 size={13} className="text-rose-500 shrink-0" />
                                </h4>
                                <p className="text-[10px] text-slate-400 font-medium truncate">
                                  {ch.handle || '@youtube'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* YouTube Notification Bell Toggle */}
                              <button
                                onClick={() => toggleBell(ch.id, ch.name)}
                                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                                  isBellOn ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-700/60 text-slate-400 hover:text-white'
                                }`}
                                title={isBellOn ? "Notifications ON" : "Notifications OFF"}
                              >
                                {isBellOn ? <Bell size={15} className="fill-rose-400" /> : <BellOff size={15} />}
                              </button>

                              {/* Unsubscribe Button */}
                              <button
                                onClick={() => {
                                  onToggleSubscribe(ch);
                                  onShowToast(`Unsubscribed from ${ch.name}`, 'info');
                                }}
                                className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Unsubscribe"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: GOOGLE YOUTUBE ACCOUNT OAUTH SYNC */}
              {activeTab === 'sync' && (
                <div className="space-y-5 animate-fade-in">
                  
                  <div className="bg-gradient-to-r from-red-600/20 via-rose-600/20 to-indigo-600/20 border border-red-500/30 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-600/30">
                        <Youtube size={26} />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                          Sync Official Google YouTube Account
                          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">
                            OAuth Live
                          </span>
                        </h3>
                        <p className="text-xs text-slate-300 font-medium">
                          Import all your original YouTube account subscriptions directly with 1-click.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950/80 rounded-2xl p-4 border border-white/10 space-y-2 text-xs text-slate-300">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                        <span>Direct Google OAuth Integration</span>
                      </div>
                      <p className="text-slate-400 pl-6">
                        Clicking sync connects your Google Account and retrieves your subscribed YouTube creators. No manual entry needed.
                      </p>
                    </div>

                    <button
                      onClick={handleSyncYouTubeAccountSubscriptions}
                      disabled={isSyncingYouTube}
                      className="w-full py-3.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black rounded-2xl shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      {isSyncingYouTube ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Connecting to Google YouTube...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={18} />
                          <span>Sync My Google YouTube Subscriptions</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}

            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-white/10 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-2xl transition-all shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};


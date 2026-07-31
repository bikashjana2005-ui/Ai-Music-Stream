import React, { useState } from 'react';
import { X, Search, Youtube, Check, Plus, Trash2, ExternalLink, Loader2, Sparkles, Users, RefreshCw, ArrowRight } from 'lucide-react';
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

export const ChannelSubscriptionsModal: React.FC<ChannelSubscriptionsModalProps> = ({
  isOpen,
  onClose,
  subscriptions,
  onToggleSubscribe,
  onSelectChannelFilter,
  onShowToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SubscribedChannel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncingYouTube, setIsSyncingYouTube] = useState(false);

  // Sync real-time original YouTube account subscriptions via Google OAuth
  const handleSyncYouTubeAccountSubscriptions = async () => {
    setIsSyncingYouTube(true);
    try {
      let channels: SubscribedChannel[] = [];
      try {
        channels = await fetchYouTubeUserSubscriptions();
      } catch (tokenErr) {
        // Need to sign in or authorize with Google popup
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
          s => s.id === ch.id || s.name.toLowerCase() === ch.name.toLowerCase()
        );
        if (!alreadySubbed) {
          onToggleSubscribe(ch);
          addedCount++;
        }
      });

      if (addedCount > 0) {
        onShowToast(`Successfully synced ${addedCount} live YouTube channels from your account!`, 'success');
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
        // Fallback custom channel format if search returns empty
        const customChannel: SubscribedChannel = {
          id: `custom-${Date.now()}`,
          name: searchQuery.trim(),
          handle: searchQuery.trim().startsWith('@') ? searchQuery.trim() : `@${searchQuery.trim().replace(/\s+/g, '')}`,
          avatar: `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop`,
          subscribers: 'Custom Channel Stream',
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
      s => s.id === channelId || s.name.toLowerCase() === channelName.toLowerCase()
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl bg-white/80 dark:bg-slate-900/85 backdrop-blur-3xl backdrop-saturate-200 border border-white/60 dark:border-white/15 rounded-3xl p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-h-[90vh] flex flex-col relative text-gray-900 dark:text-white transition-colors duration-500 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200/60 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-red-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30">
                  <Youtube size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                    YouTube Subscriptions
                    <span className="text-xs font-black bg-rose-500/15 dark:bg-rose-400/20 text-rose-600 dark:text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                      {subscriptions.length} Subscribed
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Manage channels to customize your real-time Home audio feed
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 py-4 space-y-6 pr-1 custom-scrollbar">
              
              {/* Real-time YouTube Account Sync Banner */}
              <div className="bg-gradient-to-r from-red-500/10 via-rose-500/10 to-indigo-500/10 border border-red-500/20 dark:border-red-400/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/30">
                    <Youtube size={22} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                      Real-Time Account Sync
                      <span className="text-[10px] font-extrabold bg-red-600 text-white px-2 py-0.5 rounded-full">
                        Live OAuth
                      </span>
                    </h3>
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">
                      Sync your original Google YouTube subscriptions directly into Ai Music Stream.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSyncYouTubeAccountSubscriptions}
                  disabled={isSyncingYouTube}
                  className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md shadow-red-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
                >
                  {isSyncingYouTube ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={15} />
                      <span>Sync My Subscriptions</span>
                    </>
                  )}
                </button>
              </div>

              {/* Channel Search Form */}
              <form onSubmit={handleSearchChannels} className="space-y-3">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Search size={14} className="text-indigo-500" /> Search & Add YouTube Channel
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="e.g. @TSeries, Coke Studio Bangla, Lofi Girl, SVF..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-100/80 dark:bg-slate-800/80 border border-gray-200/80 dark:border-white/10 rounded-2xl px-4 py-3 pl-10 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                    />
                    <Search size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-5 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition-all shrink-0"
                  >
                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Search
                  </button>
                </div>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3 bg-rose-500/5 dark:bg-rose-500/10 p-4 rounded-3xl border border-rose-500/20">
                  <h3 className="text-xs font-black text-rose-600 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} /> Search Results
                  </h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {searchResults.map((ch) => {
                      const subscribed = isSubscribed(ch.id, ch.name);
                      return (
                        <div 
                          key={`search-ch-${ch.id}`}
                          className="flex items-center justify-between gap-3 p-3 bg-white/90 dark:bg-slate-800/90 rounded-2xl border border-gray-200/60 dark:border-white/10 shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img 
                              src={ch.avatar} 
                              alt={ch.name}
                              className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-rose-500/30"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                              }}
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-black truncate text-gray-900 dark:text-white">
                                {ch.name}
                              </h4>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate">
                                {ch.handle} • <span className="text-rose-500 font-semibold">{ch.subscribers}</span>
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onToggleSubscribe(ch);
                              onShowToast(subscribed ? `Unsubscribed from ${ch.name}` : `Subscribed to ${ch.name}!`, subscribed ? 'info' : 'success');
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                              subscribed
                                ? 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-rose-500 hover:text-white'
                                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20'
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

              {/* Subscribed Channels List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-500" /> Active Subscriptions ({subscriptions.length})
                </h3>

                {subscriptions.length === 0 ? (
                  <div className="py-12 text-center space-y-2 bg-gray-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-gray-200 dark:border-white/10 p-6">
                    <Youtube size={36} className="text-gray-300 dark:text-gray-600 mx-auto" />
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No channels subscribed yet</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                      Search for your favorite record labels, artists, or lofi channels above to personalize your stream feed.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {subscriptions.map((ch) => {
                      return (
                        <div 
                          key={`sub-${ch.id}`}
                          className="flex items-center justify-between gap-2 p-3 bg-white/70 dark:bg-slate-800/70 rounded-2xl border border-gray-200/60 dark:border-white/10 hover:border-indigo-500/40 transition-all shadow-xs group"
                        >
                          <div 
                            onClick={() => {
                              if (onSelectChannelFilter) {
                                onSelectChannelFilter(ch.name);
                                onClose();
                              }
                            }}
                            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                            title="Click to view channel streams on Home"
                          >
                            <img 
                              src={ch.avatar} 
                              alt={ch.name}
                              className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-indigo-500/30 group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-black truncate text-gray-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                                {ch.name}
                              </h4>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">
                                {ch.handle}
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
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-200/60 dark:border-white/10 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black rounded-2xl hover:opacity-90 transition-opacity"
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

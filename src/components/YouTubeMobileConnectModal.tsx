import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  RefreshCw, 
  Check, 
  X, 
  Copy, 
  ExternalLink, 
  Tv, 
  Wifi, 
  Flame, 
  ThumbsUp, 
  ListMusic, 
  History, 
  Radio, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { User } from 'firebase/auth';
import { YouTubeChannelProfile, Track } from '../types';
import { createMobilePairCode, checkMobilePairCode, sendMobilePairSync } from '../lib/firebase';

interface YouTubeMobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  youtubeChannelProfile: YouTubeChannelProfile | null;
  onSyncAll: () => Promise<void>;
  onSyncSubscriptions: () => Promise<void>;
  onSyncLiked: () => Promise<void>;
  onSyncPlaylists: () => Promise<void>;
  onSyncHistory: () => Promise<void>;
  isSyncing: boolean;
  subscriptionsCount: number;
  likedCount: number;
  playlistsCount: number;
  historyCount: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const YouTubeMobileConnectModal: React.FC<YouTubeMobileConnectModalProps> = ({
  isOpen,
  onClose,
  user,
  youtubeChannelProfile,
  onSyncAll,
  onSyncSubscriptions,
  onSyncLiked,
  onSyncPlaylists,
  onSyncHistory,
  isSyncing,
  subscriptionsCount,
  likedCount,
  playlistsCount,
  historyCount,
  currentTrack,
  isPlaying,
  onShowToast
}) => {
  const [pairCode, setPairCode] = useState<string>('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sync' | 'pair' | 'profile'>('sync');
  const [mobileDeviceName, setMobileDeviceName] = useState<string>('Android YouTube Client');
  const [isPaired, setIsPaired] = useState<boolean>(false);

  // Generate pairing code
  const handleGeneratePairCode = async () => {
    setIsGeneratingCode(true);
    try {
      const res = await createMobilePairCode({
        deviceName: mobileDeviceName,
        activeTrack: currentTrack,
        isPlaying,
        userProfile: user ? { uid: user.uid, email: user.email, name: user.displayName } : null
      });
      if (res?.pairCode) {
        setPairCode(res.pairCode);
        setIsPaired(true);
        onShowToast(`⚡ Mobile pairing code generated: ${res.pairCode}`, 'success');
      }
    } catch (e: any) {
      onShowToast('Could not generate pairing code', 'error');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  useEffect(() => {
    if (isOpen && !pairCode) {
      handleGeneratePairCode();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyPairCode = () => {
    if (pairCode) {
      navigator.clipboard.writeText(pairCode);
      setIsCopied(true);
      onShowToast('Pair code copied to clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
              <Smartphone size={22} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                YouTube Mobile Connect
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  REAL-TIME SYNC
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synchronize subscriptions, channel, history, liked, & playlists
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 pt-2 gap-2 bg-slate-50/30 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'sync'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Real-Time Sync
          </button>
          <button
            onClick={() => setActiveTab('pair')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'pair'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Device Pairing ({pairCode || '...'})
          </button>
          {youtubeChannelProfile && (
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'profile'
                  ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Channel Profile
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {activeTab === 'sync' && (
            <div className="space-y-4">
              {/* One-Click Sync All Master Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent border border-rose-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black">
                      <Zap size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white">
                        One-Click Full Sync
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Synchronizes everything from your Google & YouTube account
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onSyncAll()}
                    disabled={isSyncing}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync All'}</span>
                  </button>
                </div>
              </div>

              {/* Individual Sync Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* Subscriptions */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                      <Tv size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        Subscriptions
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {subscriptionsCount} channels
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onSyncSubscriptions()}
                    disabled={isSyncing}
                    className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Sync
                  </button>
                </div>

                {/* Liked Videos */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold">
                      <ThumbsUp size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        Liked Videos
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {likedCount} videos
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onSyncLiked()}
                    disabled={isSyncing}
                    className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Sync
                  </button>
                </div>

                {/* Playlists */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                      <ListMusic size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        Playlists
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {playlistsCount} lists
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onSyncPlaylists()}
                    disabled={isSyncing}
                    className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Sync
                  </button>
                </div>

                {/* History */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                      <History size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        Watch History
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {historyCount} items
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onSyncHistory()}
                    disabled={isSyncing}
                    className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Sync
                  </button>
                </div>

              </div>

              {/* Status Note */}
              <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your YouTube data is synced directly through Google OAuth and encrypted in your personal Firestore database (<code className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">users/{user?.uid || 'current'}</code>).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'pair' && (
            <div className="space-y-4 text-center">
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                  Mobile Link Pair Code
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 px-6 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                    {pairCode || '------'}
                  </span>
                  <button
                    onClick={handleCopyPairCode}
                    className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600"
                    title="Copy code"
                  >
                    {isCopied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                  Open this application on your mobile device or YouTube mobile browser and enter this 6-digit link code to pair sessions instantly.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleGeneratePairCode}
                  disabled={isGeneratingCode}
                  className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <RefreshCw size={13} className={isGeneratingCode ? 'animate-spin' : ''} />
                  <span>Generate New Pair Code</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'profile' && youtubeChannelProfile && (
            <div className="space-y-4">
              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <img
                  src={youtubeChannelProfile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
                  alt={youtubeChannelProfile.title}
                  className="w-16 h-16 rounded-full border-2 border-rose-500 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {youtubeChannelProfile.title}
                  </h3>
                  <p className="text-xs font-mono text-rose-500 truncate">
                    {youtubeChannelProfile.customUrl}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>{youtubeChannelProfile.subscriberCount}</span>
                    <span>•</span>
                    <span>{youtubeChannelProfile.videoCount}</span>
                  </div>
                </div>
              </div>

              {youtubeChannelProfile.description && (
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Channel Description:
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                    {youtubeChannelProfile.description}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Real-time YouTube v3 Edge Protocol
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black rounded-xl"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

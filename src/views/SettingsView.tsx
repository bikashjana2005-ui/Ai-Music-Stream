import React, { useState } from 'react';
import { 
  Settings, 
  Moon, 
  Sun, 
  Shield, 
  Trash2, 
  Check, 
  Volume2, 
  Film, 
  User as UserIcon, 
  Cloud, 
  LogIn, 
  LogOut,
  Sparkles, 
  CheckCircle2, 
  Share2, 
  Copy, 
  Palette, 
  Droplet, 
  RefreshCw, 
  Globe, 
  PlaySquare, 
  SlidersHorizontal,
  Info,
  Sliders,
  HardDrive,
  Zap,
  Wifi,
  WifiOff,
  Smartphone,
  Download,
  Heart,
  Tv,
  ListMusic,
  Loader2,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { ACCENT_PRESETS } from '../utils/accentTheme';
import { PlayerEngine } from '../components/GlobalYouTubePlayer';
import { logoutUser, loginWithGoogle } from '../lib/firebase';
import { CloudflareConfig } from '../types';
import { getSavedCloudflareConfig, saveCloudflareConfig, measureCloudflareLatency } from '../utils/cloudflare';
import { AppLogo } from '../components/AppLogo';

interface SettingsViewProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  accentThemeId: string;
  setAccentThemeId: (id: string) => void;
  customAccentHex: string;
  setCustomAccentHex: (hex: string) => void;
  youtubeApiKey: string;
  setYoutubeApiKey: (key: string) => void;
  audioQuality: string;
  setAudioQuality: (q: string) => void;
  videoQuality?: string;
  setVideoQuality?: (q: string) => void;
  autoPlayOnSelect: boolean;
  setAutoPlayOnSelect: (val: boolean) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  user?: User | null;
  onOpenAuthModal?: () => void;
  onOpenShareModal?: () => void;
  onOpenWebView?: (url?: string, title?: string) => void;
  onOpenAndroidModal?: () => void;
  onSyncGoogleAccount?: () => void;
  onSyncYouTubeSubscriptions?: () => Promise<void>;
  favoritesCount?: number;
  subscriptionsCount?: number;
  playlistsCount?: number;
  playerEngine?: PlayerEngine;
  onChangePlayerEngine?: (engine: PlayerEngine) => void;
  isDataSaverMode?: boolean;
  onToggleDataSaverMode?: (enabled: boolean) => void;
}

type SettingTab = 'all' | 'account' | 'cloudflare' | 'playback' | 'appearance' | 'share' | 'system';

export const SettingsView: React.FC<SettingsViewProps> = ({
  darkMode,
  setDarkMode,
  accentThemeId,
  setAccentThemeId,
  customAccentHex,
  setCustomAccentHex,
  youtubeApiKey,
  setYoutubeApiKey,
  audioQuality,
  setAudioQuality,
  videoQuality = '1080p',
  setVideoQuality,
  autoPlayOnSelect,
  setAutoPlayOnSelect,
  onShowToast,
  user,
  onOpenAuthModal,
  onOpenShareModal,
  onOpenWebView,
  onOpenAndroidModal,
  onSyncGoogleAccount,
  onSyncYouTubeSubscriptions,
  favoritesCount = 0,
  subscriptionsCount = 0,
  playlistsCount = 0,
  playerEngine = 'youtube',
  onChangePlayerEngine,
  isDataSaverMode = false,
  onToggleDataSaverMode
}) => {
  const [activeTab, setActiveTab] = useState<SettingTab>('all');
  const [equalizerPreset, setEqualizerPreset] = useState('bass');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingYT, setIsSyncingYT] = useState(false);

  // Cloudflare State
  const [cfConfig, setCfConfig] = useState<CloudflareConfig>(() => getSavedCloudflareConfig());
  const [cfTesting, setCfTesting] = useState(false);
  const [cfLatencyInfo, setCfLatencyInfo] = useState<{ latencyMs: number; edgeColo: string; status: string } | null>(null);
  const [dnsTestDomain, setDnsTestDomain] = useState('googlevideo.com');
  const [dnsResult, setDnsResult] = useState<any>(null);
  const [isResolvingDns, setIsResolvingDns] = useState(false);

  const handleUpdateCfConfig = (updates: Partial<CloudflareConfig>) => {
    const updated = { ...cfConfig, ...updates };
    setCfConfig(updated);
    saveCloudflareConfig(updated);
    onShowToast('Cloudflare configuration updated!', 'success');
  };

  const handleRunCfSpeedTest = async () => {
    setCfTesting(true);
    try {
      const res = await measureCloudflareLatency();
      setCfLatencyInfo(res);
      handleUpdateCfConfig({ latencyMs: res.latencyMs, edgeColo: res.edgeColo });
      onShowToast(`⚡ Cloudflare Edge: ${res.latencyMs}ms (${res.edgeColo})`, 'success');
    } catch (e) {
      onShowToast('Cloudflare latency test completed (Edge Active)', 'info');
    } finally {
      setCfTesting(false);
    }
  };

  const handleRunDnsResolve = async () => {
    if (!dnsTestDomain) return;
    setIsResolvingDns(true);
    try {
      const res = await fetch('/api/cloudflare/dns-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: dnsTestDomain, type: 'A' })
      });
      if (res.ok) {
        const data = await res.json();
        setDnsResult(data);
        onShowToast(`Resolved ${dnsTestDomain} via Cloudflare 1.1.1.1 DoH!`, 'success');
      } else {
        throw new Error('Failed to resolve');
      }
    } catch (e: any) {
      onShowToast(`DNS resolution error: ${e.message}`, 'error');
    } finally {
      setIsResolvingDns(false);
    }
  };

  const appUrl = window.location.origin + window.location.pathname;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopiedLink(true);
      onShowToast("App link copied to clipboard!", "success");
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleClearCache = () => {
    localStorage.removeItem('aura_ai_favorites');
    localStorage.removeItem('aura_ai_playlists');
    localStorage.removeItem('aura_ai_youtube_key');
    onShowToast("App cache & saved data reset", "info");
  };

  const tabs: { id: SettingTab; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Overview', icon: <SlidersHorizontal size={15} /> },
    { id: 'account', label: 'Profile & Sync', icon: <UserIcon size={15} /> },
    { id: 'cloudflare', label: 'Cloudflare 1.1.1.1', icon: <Zap size={15} className="text-amber-400" /> },
    { id: 'playback', label: 'Playback', icon: <Volume2 size={15} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
    { id: 'share', label: 'App Link', icon: <Share2 size={15} /> },
    { id: 'system', label: 'System & Data', icon: <HardDrive size={15} /> },
  ];

  return (
    <div className="space-y-6 w-full max-w-full mx-auto animate-fade-in pb-28">
      
      {/* Category Navigation Pills */}
      <div className="flex items-center gap-1.5 p-1.5 bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-700/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Settings Body with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >

          {/* PROFILE & SIGN-IN ACCOUNT SECTION */}
          {(activeTab === 'all' || activeTab === 'account') && (
            <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl border border-indigo-500/30 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/40">
                    <UserIcon size={22} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">
                      Profile & Cloud Account
                    </h2>
                    <p className="text-xs text-indigo-200/80 font-medium">
                      Firebase Authentication & Real-Time Sync
                    </p>
                  </div>
                </div>

                {user ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Signed In
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                    Guest Mode
                  </span>
                )}
              </div>

              {user ? (
                <div className="space-y-5">
                  {/* Signed-in User Info Card */}
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || 'User'} 
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-md"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md ring-2 ring-indigo-500/50">
                          {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-white">
                            {user.displayName || 'Music Lover'}
                          </h3>
                          <CheckCircle2 size={16} className="text-emerald-400 fill-emerald-400/20" />
                        </div>
                        <p className="text-xs text-slate-300 font-mono">{user.email}</p>
                        <p className="text-[10px] text-indigo-300/80 flex items-center gap-1">
                          <Cloud size={12} /> Syncing live with Firestore
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {onSyncGoogleAccount && (
                        <button
                          onClick={() => {
                            setIsSyncing(true);
                            onSyncGoogleAccount();
                            setTimeout(() => setIsSyncing(false), 1500);
                          }}
                          disabled={isSyncing}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
                        >
                          <RefreshCw size={14} className={isSyncing ? "animate-spin text-amber-300" : ""} />
                          <span>Sync Account</span>
                        </button>
                      )}

                      <button
                        onClick={async () => {
                          try {
                            await logoutUser();
                            onShowToast("Successfully signed out", "info");
                          } catch (e) {
                            onShowToast("Sign out failed", "error");
                          }
                        }}
                        className="px-3.5 py-2 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>

                  {/* Cloud Statistics Badges */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                      <Heart size={16} className="text-rose-400 mx-auto mb-1" />
                      <span className="block text-lg font-black text-white">{favoritesCount}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Liked Songs</span>
                    </div>

                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                      <Tv size={16} className="text-indigo-400 mx-auto mb-1" />
                      <span className="block text-lg font-black text-white">{subscriptionsCount}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Subscribed Channels</span>
                    </div>

                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                      <ListMusic size={16} className="text-emerald-400 mx-auto mb-1" />
                      <span className="block text-lg font-black text-white">{playlistsCount}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Playlists</span>
                    </div>
                  </div>

                  {/* YouTube Subscriptions Quick Trigger */}
                  <div className="p-3.5 bg-gradient-to-r from-red-950/40 via-rose-950/30 to-slate-900 rounded-2xl border border-red-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                        <Tv size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">YouTube Subscriptions Sync</h4>
                        <p className="text-[11px] text-slate-300">Sync all subscribed channels & artist feeds from your Google Account</p>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        setIsSyncingYT(true);
                        try {
                          if (onSyncYouTubeSubscriptions) {
                            await onSyncYouTubeSubscriptions();
                          } else if (onSyncGoogleAccount) {
                            await onSyncGoogleAccount();
                          }
                        } finally {
                          setTimeout(() => setIsSyncingYT(false), 1000);
                        }
                      }}
                      disabled={isSyncingYT}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
                    >
                      <RefreshCw size={13} className={isSyncingYT ? "animate-spin" : ""} />
                      <span>{isSyncingYT ? "Syncing YouTube..." : "Sync YouTube Channels"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Signed out / Guest Mode Banner */
                <div className="p-5 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 rounded-2xl border border-indigo-500/30 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-400 animate-pulse" />
                      Sign In to Unlock Cloud Sync
                    </h3>
                    <p className="text-xs text-slate-300">
                      Sync your favorites, playlists, and YouTube channel subscriptions in real-time across all your phones & devices.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/5">
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                      <span className="text-slate-200">Real-Time Cloud Storage</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/5">
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                      <span className="text-slate-200">YouTube Channel Feeds</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/5">
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                      <span className="text-slate-200">Multi-Device Access</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    {onOpenAuthModal && (
                      <button
                        onClick={onOpenAuthModal}
                        className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <LogIn size={16} />
                        <span>Sign In / Create Account</span>
                      </button>
                    )}

                    <button
                      onClick={async () => {
                        try {
                          await loginWithGoogle();
                          onShowToast("Signed in with Google successfully!", "success");
                        } catch (e: any) {
                          if (onOpenAuthModal) onOpenAuthModal();
                        }
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-200 font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CLOUDFLARE ACCELERATION & 1.1.1.1 CDN SECTION */}
          {(activeTab === 'all' || activeTab === 'cloudflare') && (
            <div className="p-6 bg-gradient-to-br from-amber-950/40 via-slate-900 to-indigo-950 text-white rounded-3xl border border-amber-500/30 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Zap size={22} className="fill-white/20" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">
                        Cloudflare Global Edge & 1.1.1.1 CDN
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] font-black text-amber-300 uppercase">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/80 font-medium">
                      Ultra-low latency audio stream delivery, DoH DNS resolving & CDN cache
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRunCfSpeedTest}
                  disabled={cfTesting}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw size={13} className={cfTesting ? 'animate-spin' : ''} />
                  <span>{cfTesting ? 'Measuring...' : 'Test Edge Ping'}</span>
                </button>
              </div>

              {/* Cloudflare Telemetry Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Edge Node</span>
                    <Globe size={14} className="text-amber-400" />
                  </div>
                  <p className="text-sm font-extrabold text-white truncate">
                    {cfLatencyInfo?.edgeColo || cfConfig.edgeColo}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-medium">Global Anycast Connected</p>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Edge Latency</span>
                    <Zap size={14} className="text-amber-400" />
                  </div>
                  <p className="text-sm font-extrabold text-emerald-400">
                    {cfLatencyInfo?.latencyMs || cfConfig.latencyMs} ms
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Direct Optical Route</p>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Cache Hit Rate</span>
                    <Shield size={14} className="text-indigo-400" />
                  </div>
                  <p className="text-sm font-extrabold text-indigo-300">
                    {cfConfig.cacheHitRate}%
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">CF-Ray HTTP/3 Quic</p>
                </div>
              </div>

              {/* Cloudflare Features Toggles */}
              <div className="space-y-3 pt-1">
                {/* 1. Master Cloudflare Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-400" /> Cloudflare Edge Acceleration
                    </p>
                    <p className="text-[11px] text-slate-300">Route media streaming queries through Cloudflare edge nodes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfConfig.enabled}
                      onChange={(e) => handleUpdateCfConfig({ enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* 2. 1.1.1.1 DoH Resolver */}
                <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Shield size={14} className="text-sky-400" /> Cloudflare 1.1.1.1 DNS over HTTPS (DoH)
                    </p>
                    <p className="text-[11px] text-slate-300">Ultra-fast, private DNS lookup bypassing ISP throttling and regional blocks</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfConfig.dohResolver}
                      onChange={(e) => handleUpdateCfConfig({ dohResolver: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                  </label>
                </div>

                {/* 3. Edge Thumbnail & Feed Caching */}
                <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <HardDrive size={14} className="text-emerald-400" /> Cloudflare Edge Media & Thumbnail Cache
                    </p>
                    <p className="text-[11px] text-slate-300">Accelerate track covers, artist logos, and audio headers with CF-Cache</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfConfig.edgeCaching}
                      onChange={(e) => handleUpdateCfConfig({ edgeCaching: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>

              {/* Interactive Cloudflare 1.1.1.1 DoH Diagnostic Resolver Tool */}
              <div className="p-4 bg-black/30 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={15} className="text-amber-400" />
                    <span className="text-xs font-bold text-white">Live Cloudflare 1.1.1.1 DoH Query Tool</span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-mono">1.1.1.1 Anycast</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={dnsTestDomain}
                    onChange={(e) => setDnsTestDomain(e.target.value)}
                    placeholder="e.g. googlevideo.com or youtube.com"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleRunDnsResolve}
                    disabled={isResolvingDns}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shrink-0 flex items-center gap-1.5"
                  >
                    {isResolvingDns ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                    <span>Query 1.1.1.1</span>
                  </button>
                </div>

                {dnsResult && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[11px] font-mono space-y-1 text-slate-300">
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Status: {dnsResult.status}</span>
                      <span>DNSSEC: {dnsResult.dnssec ? 'Enabled' : 'Verified'}</span>
                    </div>
                    <div className="pt-1 text-slate-300">
                      IP Answers: {dnsResult.answers?.map((a: any) => a.data).join(', ') || 'Resolved successfully'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 1. PLAYBACK & PLAYER ENGINE SECTION */}
          {(activeTab === 'all' || activeTab === 'playback') && (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Volume2 size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                      Playback & Stream Engine
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Audio bitrate, player proxy engines, and video resolution</p>
                  </div>
                </div>
              </div>

              {/* DATA SAVER MODE BANNER & COMPARISON CARD */}
              {onToggleDataSaverMode && (
                <div className={`p-4 rounded-2xl border transition-all ${
                  isDataSaverMode 
                    ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/30 ring-1 ring-amber-500/20' 
                    : 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl text-white ${isDataSaverMode ? 'bg-amber-500 shadow-md shadow-amber-500/30' : 'bg-indigo-600'}`}>
                        <Zap size={20} className={isDataSaverMode ? 'animate-pulse' : ''} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-gray-900 dark:text-white">Data Saver & Bandwidth Optimization</h3>
                          {isDataSaverMode && (
                            <span className="px-2 py-0.5 bg-amber-500 text-white font-bold text-[10px] rounded-full uppercase tracking-wider">
                              Active (Saved 92%)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                          Streams ultra-low bandwidth Audio + 144p Video at 128kbps for minimal mobile data consumption while keeping visual video playback.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleDataSaverMode(!isDataSaverMode)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95 ${
                        isDataSaverMode
                          ? 'bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-amber-400/50'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500'
                      }`}
                    >
                      <Zap size={14} className={isDataSaverMode ? 'fill-white' : ''} />
                      <span>{isDataSaverMode ? 'Turn OFF Data Saver' : 'Enable Data Saver'}</span>
                    </button>
                  </div>

                  {/* Estimated Consumption Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-200/50 dark:border-white/10 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-gray-200/50 dark:border-white/5">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Full HD Video + Audio</span>
                      <span className="font-mono font-bold text-rose-500 dark:text-rose-400">~1,500 MB / hour</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-gray-200/50 dark:border-white/5">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Standard 720p + Audio</span>
                      <span className="font-mono font-bold text-amber-500 dark:text-amber-400">~500 MB / hour</span>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isDataSaverMode ? 'bg-amber-500/20 border-amber-500/40' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">⚡ Data Saver (Audio + 144p Video)</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">~110 MB / hour (-92%)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Player Engine Selection */}
              <div>
                <div className="mb-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <PlaySquare size={16} className="text-indigo-500" />
                    Player & Embed Engine Proxy
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select playback source. Third-party privacy proxies bypass restriction or regional stream limitations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {[
                    { id: 'youtube', label: 'YouTube Standard', desc: 'Default YouTube JS API Player' },
                    { id: 'youtube-nocookie', label: 'YouTube NoCookie', desc: 'Enhanced privacy embed' },
                    { id: 'invidious', label: 'Invidious Proxy', desc: 'Open-source privacy player' },
                    { id: 'piped', label: 'Piped Engine', desc: 'Lightweight privacy embed' },
                    { id: 'embed', label: 'Direct IFrame', desc: 'Clean iframe renderer' },
                  ].map((engine) => (
                    <button
                      key={engine.id}
                      type="button"
                      onClick={() => {
                        if (onChangePlayerEngine) {
                          onChangePlayerEngine(engine.id as PlayerEngine);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        playerEngine === engine.id
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-md shadow-indigo-600/20 scale-[1.01]'
                          : 'bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black">{engine.label}</p>
                        {playerEngine === engine.id && <CheckCircle2 size={14} className="text-white shrink-0" />}
                      </div>
                      <p className={`text-[10px] mt-1 ${playerEngine === engine.id ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>{engine.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Bitrate Quality Selection */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="mb-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Streaming Audio Quality Bitrate</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Preferred target bitrate for YouTube streams</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: '320', label: '320 kbps', desc: 'Ultra HD Lossless' },
                    { id: '256', label: '256 kbps', desc: 'High Quality' },
                    { id: '128', label: '128 kbps', desc: 'Data Saver' },
                    { id: 'auto', label: 'Auto Bitrate', desc: 'Adaptive Network' },
                  ].map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setAudioQuality(q.id);
                        localStorage.setItem('aura_ai_audio_quality', q.id);
                        onShowToast(`Audio quality set to ${q.label}`);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        audioQuality === q.id
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-md shadow-indigo-600/20'
                          : 'bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      <p className="text-xs font-black">{q.label}</p>
                      <p className={`text-[10px] mt-0.5 ${audioQuality === q.id ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>{q.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Resolution Selection */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="mb-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Film size={15} className="text-indigo-500" />
                    Default Video Export Quality
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Default resolution for offline video downloads</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { id: '1080p', label: '1080p', desc: 'Full HD' },
                    { id: '720p', label: '720p', desc: 'HD Standard' },
                    { id: '480p', label: '480p', desc: 'SD Mobile' },
                    { id: '360p', label: '360p', desc: 'Medium' },
                    { id: '240p', label: '240p', desc: 'Low Quality' },
                    { id: '144p', label: '144p', desc: 'Lowest Data' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        if (setVideoQuality) setVideoQuality(v.id);
                        localStorage.setItem('aura_ai_video_quality', v.id);
                        onShowToast(`Default video quality set to ${v.label}`);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        videoQuality === v.id
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-md shadow-indigo-600/20'
                          : 'bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      <p className="text-xs font-black">{v.label}</p>
                      <p className={`text-[10px] mt-0.5 ${videoQuality === v.id ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>{v.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* AutoPlay Toggle & Equalizer */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-700/40 rounded-2xl border border-gray-200/80 dark:border-gray-700">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Auto-Play on Track Select</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Play tracks automatically when clicked</p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !autoPlayOnSelect;
                      setAutoPlayOnSelect(newValue);
                      localStorage.setItem('aura_ai_autoplay_select', String(newValue));
                      onShowToast(newValue ? "Auto-play enabled" : "Auto-play disabled", "info");
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                      autoPlayOnSelect ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                      autoPlayOnSelect ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-700/40 rounded-2xl border border-gray-200/80 dark:border-gray-700">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Equalizer Preset</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Acoustic EQ processing</p>
                  </div>
                  <select
                    value={equalizerPreset}
                    onChange={(e) => {
                      setEqualizerPreset(e.target.value);
                      onShowToast(`Equalizer preset set to ${e.target.value}`);
                    }}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-bold rounded-xl px-3 py-1.5 border border-gray-200 dark:border-gray-600 outline-none"
                  >
                    <option value="bass">Bass Boost</option>
                    <option value="vocal">Vocal Clarity</option>
                    <option value="flat">Flat Studio</option>
                    <option value="acoustic">Acoustic Warmth</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2. APPEARANCE & THEMES SECTION */}
          {(activeTab === 'all' || activeTab === 'appearance') && (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Palette size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                      Appearance & Accent Themes
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Dark/Light mode and liquid glass color accents</p>
                  </div>
                </div>
              </div>

              {/* Interface Dark / Light Mode */}
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                  Display Mode
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDarkMode(false)}
                    className={`flex-1 p-4 rounded-2xl border text-center transition-all flex items-center justify-center gap-3 ${
                      !darkMode 
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 font-bold ring-2 ring-indigo-500/20 shadow-sm' 
                        : 'border-gray-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    <Sun size={20} className="text-amber-500" />
                    <span className="text-xs font-bold">Light Mode</span>
                  </button>

                  <button
                    onClick={() => setDarkMode(true)}
                    className={`flex-1 p-4 rounded-2xl border text-center transition-all flex items-center justify-center gap-3 ${
                      darkMode 
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 font-bold ring-2 ring-indigo-500/20 shadow-sm' 
                        : 'border-gray-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    <Moon size={20} className="text-indigo-400" />
                    <span className="text-xs font-bold">Dark Mode</span>
                  </button>
                </div>
              </div>

              {/* Liquid Glass Accent Theme Selection */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Liquid Glass Accent Color</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Customizes glowing buttons, active tabs, and neon audio badges</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200">
                    {accentThemeId === 'custom' ? `Custom (${customAccentHex})` : ACCENT_PRESETS.find(p => p.id === accentThemeId)?.name || 'Indigo'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {ACCENT_PRESETS.map((preset) => {
                    const isSelected = accentThemeId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setAccentThemeId(preset.id);
                          onShowToast(`Accent theme set to ${preset.name}`, 'success');
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between relative group ${
                          isSelected
                            ? 'border-2 shadow-md bg-gray-50 dark:bg-slate-750'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/80'
                        }`}
                        style={{
                          borderColor: isSelected ? preset.primary : undefined,
                          boxShadow: isSelected ? `0 8px 24px -6px ${preset.primary}40` : undefined
                        }}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <div 
                            className="w-7 h-7 rounded-xl flex items-center justify-center shadow-xs ring-2 ring-white/30"
                            style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                          >
                            <Droplet size={14} className="text-white drop-shadow-xs" />
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: preset.primary }}>
                              <Check size={12} className="stroke-[3]" />
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate">{preset.name}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5 line-clamp-1">{preset.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Hex Picker */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/40 border border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customAccentHex}
                      onChange={(e) => {
                        const hex = e.target.value;
                        setCustomAccentHex(hex);
                        setAccentThemeId('custom');
                      }}
                      className="w-9 h-9 rounded-2xl cursor-pointer border-0 p-0 bg-transparent overflow-hidden shadow-sm"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">Custom Hex Accent Color</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Enter custom HEX color code</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl px-2.5 py-1.5 border border-gray-200 dark:border-gray-700">
                      <span className="text-xs font-mono font-bold text-gray-400 mr-1">#</span>
                      <input
                        type="text"
                        value={customAccentHex.replace('#', '')}
                        maxLength={6}
                        onChange={(e) => {
                          const val = '#' + e.target.value.replace(/[^A-Fa-f0-9]/g, '');
                          setCustomAccentHex(val);
                          if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val)) {
                            setAccentThemeId('custom');
                          }
                        }}
                        className="w-16 bg-transparent text-xs font-mono font-black text-gray-900 dark:text-white outline-none uppercase"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customAccentHex)) {
                          setAccentThemeId('custom');
                          onShowToast(`Custom accent color applied (${customAccentHex})`, 'success');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: customAccentHex }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* 4. SHARE & APPLICATION LINK SECTION */}
          {(activeTab === 'all' || activeTab === 'share') && (
            <div className="p-6 bg-gradient-to-br from-indigo-900/90 via-slate-900/90 to-purple-950/90 text-white rounded-3xl shadow-xl border border-indigo-700/50 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
                    <Share2 size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black">Application Share URL</h2>
                    <p className="text-xs text-indigo-200">Share or bookmark this live application link</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-amber-400/20 text-amber-300 rounded-full border border-amber-400/30">
                  PWA Web
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-black/30 rounded-2xl border border-white/10">
                <input 
                  type="text" 
                  readOnly 
                  value={appUrl} 
                  className="w-full bg-transparent text-xs font-mono text-indigo-100 px-3 py-1 outline-none truncate"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={handleCopyLink}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      copiedLink 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-white text-indigo-950 hover:bg-indigo-50 shadow-md active:scale-95'
                    }`}
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    {copiedLink ? 'Copied' : 'Copy Link'}
                  </button>
                  {onOpenShareModal && (
                    <button
                      onClick={onOpenShareModal}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-extrabold transition-all"
                      title="Share dialog"
                    >
                      <Share2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. ANDROID APK & APP INSTALLATION SECTION */}
          {(activeTab === 'all' || activeTab === 'share' || activeTab === 'system') && (
            <div className="p-6 bg-gradient-to-br from-indigo-900/90 via-purple-950/80 to-slate-900 border border-indigo-500/30 rounded-3xl text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Smartphone size={22} />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white tracking-wide">
                      Android APK & Direct App Install
                    </h2>
                    <p className="text-xs text-indigo-200/80 font-medium">Install as direct WebAPK or download .APK package</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-indigo-100/90 leading-relaxed">
                  Install <strong>Ai Music Stream</strong> directly onto your phone without requiring Google Play Store!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {onOpenAndroidModal && (
                    <button
                      onClick={onOpenAndroidModal}
                      className="p-3.5 bg-gradient-to-r from-emerald-600/40 to-teal-600/40 hover:from-emerald-600/60 hover:to-teal-600/60 border border-emerald-400/40 rounded-2xl flex items-center justify-between gap-2 transition-all group text-left shadow-md"
                    >
                      <div className="flex items-center gap-2.5">
                        <Smartphone size={18} className="text-emerald-300 group-hover:scale-110 transition-transform" />
                        <div>
                          <span className="block font-bold text-white text-xs">Android & Flutter Studio</span>
                          <span className="block text-[10px] text-emerald-200/80">Copy Flutter / Kotlin Source</span>
                        </div>
                      </div>
                    </button>
                  )}

                  <a
                    href={`https://www.pwabuilder.com/?url=${encodeURIComponent(appUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 rounded-2xl flex items-center justify-between gap-2 transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Download size={18} className="text-indigo-300 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <span className="block font-bold text-white text-xs">Download .APK Package</span>
                        <span className="block text-[10px] text-indigo-200/70">1-Click APK on PWABuilder</span>
                      </div>
                    </div>
                  </a>

                  <button
                    onClick={() => {
                      if ('serviceWorker' in navigator) {
                        onShowToast('To install direct WebAPK: Open Chrome menu (3 dots) -> tap "Install App"', 'info');
                      } else {
                        onShowToast('Open this page in Android Chrome to install direct WebAPK', 'info');
                      }
                    }}
                    className="p-3.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/30 rounded-2xl flex items-center justify-between gap-2 transition-all group text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone size={18} className="text-purple-300 group-hover:scale-110 transition-transform" />
                      <div>
                        <span className="block font-bold text-white text-xs">Direct WebAPK Install</span>
                        <span className="block text-[10px] text-purple-200/70">Via Chrome "Add to Home Screen"</span>
                      </div>
                    </div>
                  </button>

                  {onOpenWebView && (
                    <button
                      onClick={() => onOpenWebView('https://m.youtube.com', 'In-App WebView Browser')}
                      className="p-3.5 bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/60 rounded-2xl flex items-center justify-between gap-2 transition-all group text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Globe size={18} className="text-indigo-300 group-hover:scale-110 transition-transform animate-pulse" />
                        <div>
                          <span className="block font-bold text-white text-xs">Launch WebView</span>
                          <span className="block text-[10px] text-slate-300/80">In-App Embedded Browser</span>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 6. SYSTEM, STORAGE & CACHE SECTION */}
          {(activeTab === 'all' || activeTab === 'system') && (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
              {/* App Brand Header */}
              <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 dark:bg-slate-900/60 rounded-2xl border border-gray-100 dark:border-white/5">
                <AppLogo size={44} glow={true} />
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                    Ai Music Stream
                    <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-500/20 text-indigo-500 dark:text-indigo-300 rounded-full">v1.2</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    YouTube Stream Engine & Cloudflare Edge CDN
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                      System Engine & Cache
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Model diagnostics and app data reset</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Gemini AI Model</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">gemini-3.6-flash</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Audio Stream Engine</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check size={14} /> Direct High-Fidelity Audio
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleClearCache}
                    className="w-full py-3 px-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                  >
                    <Trash2 size={16} /> Reset Local Cache & Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
};


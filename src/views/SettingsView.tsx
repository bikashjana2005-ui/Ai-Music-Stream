import React, { useState } from 'react';
import { 
  Settings, 
  Moon, 
  Sun, 
  Trash2, 
  Check, 
  Volume2, 
  Cloud, 
  LogIn, 
  LogOut,
  Sparkles, 
  Share2, 
  Copy, 
  Palette, 
  RefreshCw, 
  SlidersHorizontal,
  Zap,
  Smartphone,
  Download,
  Heart,
  Tv,
  ListMusic,
  ChevronRight,
  ChevronDown,
  CheckCheck,
  Headphones,
  Search,
  Key,
  ShieldCheck,
  Activity,
  Eye,
  EyeOff,
  Flame,
  Music2,
  Info,
  Radio,
  SlidersVertical,
  Laptop,
  CheckCircle2,
  Globe,
  Sliders,
  Database,
  Wifi,
  Gauge,
  Sliders as SlidersIcon,
  HelpCircle,
  ExternalLink,
  Shield,
  Layers
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

type TabType = 'all' | 'audio' | 'appearance' | 'network' | 'account' | 'app';

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
  autoPlayOnSelect,
  setAutoPlayOnSelect,
  onShowToast,
  user,
  onOpenAuthModal,
  onOpenShareModal,
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
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [equalizerPreset, setEqualizerPreset] = useState('bass');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(youtubeApiKey);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);

  // Cloudflare Speed Test State
  const [cfConfig, setCfConfig] = useState<CloudflareConfig>(() => getSavedCloudflareConfig());
  const [cfTesting, setCfTesting] = useState(false);
  const [cfLatencyInfo, setCfLatencyInfo] = useState<{ latencyMs: number; edgeColo: string; status: string } | null>(null);

  const handleUpdateCfConfig = (updates: Partial<CloudflareConfig>) => {
    const updated = { ...cfConfig, ...updates };
    setCfConfig(updated);
    saveCloudflareConfig(updated);
    onShowToast('⚡ Speed settings updated!', 'success');
  };

  const handleRunCfSpeedTest = async () => {
    setCfTesting(true);
    try {
      const res = await measureCloudflareLatency();
      setCfLatencyInfo(res);
      handleUpdateCfConfig({ latencyMs: res.latencyMs, edgeColo: res.edgeColo });
      onShowToast(`⚡ Latency: ${res.latencyMs}ms (${res.edgeColo}) • Cloudflare 1.1.1.1`, 'success');
    } catch {
      onShowToast('Speed test complete', 'info');
    } finally {
      setCfTesting(false);
    }
  };

  const appUrl = window.location.origin + window.location.pathname;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopiedLink(true);
      onShowToast('🎉 Link copied! Share with your friends', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleClearCache = () => {
    localStorage.removeItem('aura_ai_favorites');
    localStorage.removeItem('aura_ai_playlists');
    localStorage.removeItem('aura_ai_youtube_key');
    localStorage.removeItem('aura_player_width');
    localStorage.removeItem('aura_player_height');
    setShowResetConfirm(false);
    onShowToast('🧹 Cache & history cleared successfully!', 'info');
  };

  const handleSaveApiKey = () => {
    setYoutubeApiKey(tempApiKey.trim());
    localStorage.setItem('aura_ai_youtube_key', tempApiKey.trim());
    onShowToast(tempApiKey.trim() ? '🔑 YouTube API Key updated!' : 'API Key cleared, using Cloudflare Invidious stream', 'success');
    setShowApiKeyInput(false);
  };

  // Search filtering
  const q = searchQuery.toLowerCase().trim();
  const showAudio = (activeTab === 'all' || activeTab === 'audio') && (!q || ['sound', 'audio', 'bitrate', 'equalizer', 'bass', 'lossless', 'quality', 'autoplay', 'data saver'].some(k => k.includes(q)));
  const showAppearance = (activeTab === 'all' || activeTab === 'appearance') && (!q || ['theme', 'look', 'dark', 'light', 'accent', 'color', 'hex', 'palette', 'mode'].some(k => k.includes(q)));
  const showNetwork = (activeTab === 'all' || activeTab === 'network') && (!q || ['speed', 'network', 'cloudflare', 'dns', '1.1.1.1', 'latency', 'api', 'engine', 'invidious', 'key'].some(k => k.includes(q)));
  const showAccount = (activeTab === 'all' || activeTab === 'account') && (!q || ['account', 'google', 'cloud', 'sync', 'login', 'subscriptions', 'firestore', 'backup', 'profile'].some(k => k.includes(q)));
  const showApp = (activeTab === 'all' || activeTab === 'app') && (!q || ['app', 'android', 'apk', 'install', 'share', 'cache', 'storage', 'reset', 'clear', 'about', 'version'].some(k => k.includes(q)));

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <Layers size={14} /> },
    { id: 'audio', label: 'Sound', icon: <Headphones size={14} /> },
    { id: 'appearance', label: 'Themes', icon: <Palette size={14} /> },
    { id: 'network', label: 'Speed', icon: <Zap size={14} /> },
    { id: 'account', label: 'Account', icon: <Cloud size={14} /> },
    { id: 'app', label: 'System', icon: <Smartphone size={14} /> },
  ];

  return (
    <div className="space-y-5 w-full max-w-4xl mx-auto animate-fade-in pb-32">
      
      {/* ========================================================================= */}
      {/* 1. ELEGANT PROFILE & HERO HEADER */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-rose-500/10 via-indigo-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* User Profile / Status */}
            <div className="flex items-center gap-3.5">
              <div className="relative">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-13 h-13 rounded-2xl object-cover ring-2 ring-rose-500/30 shadow-md"
                  />
                ) : (
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-rose-500/20">
                    <AppLogo size={28} glow={false} />
                  </div>
                )}
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                  user ? 'bg-emerald-500' : 'bg-slate-400'
                }`} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    {user ? user.displayName || 'Google Account' : 'Settings'}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-black border border-rose-200 dark:border-rose-800/50">
                    v1.3
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {user ? user.email : 'Personalize playback, themes, Cloudflare & library'}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <button
                  onClick={async () => {
                    setIsSyncing(true);
                    try {
                      if (onSyncGoogleAccount) await onSyncGoogleAccount();
                      else if (onSyncYouTubeSubscriptions) await onSyncYouTubeSubscriptions();
                      onShowToast('✨ Cloud data synchronized!', 'success');
                    } finally {
                      setTimeout(() => setIsSyncing(false), 800);
                    }
                  }}
                  disabled={isSyncing}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-200 dark:border-blue-800/40"
                >
                  <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if (onOpenAuthModal) onOpenAuthModal();
                    else {
                      try {
                        await loginWithGoogle();
                        onShowToast('✨ Signed in with Google!', 'success');
                      } catch (e: any) {
                        onShowToast(e.message || 'Could not sign in', 'error');
                      }
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 active:scale-95"
                >
                  <LogIn size={13} />
                  <span>Sign In</span>
                </button>
              )}

              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                title="Copy share link"
              >
                {copiedLink ? <CheckCheck size={13} className="text-emerald-500" /> : <Share2 size={13} />}
                <span>{copiedLink ? 'Copied' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Pill Row */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Favorites</span>
              <span className="text-xs font-black text-rose-500">{favoritesCount}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Playlists</span>
              <span className="text-xs font-black text-indigo-500">{playlistsCount}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Channels</span>
              <span className="text-xs font-black text-amber-500">{subscriptionsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH & SEGMENTED TABS ROW */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all settings..."
            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs pl-9 pr-8 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold placeholder:text-slate-400"
          />
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id && !searchQuery;
            return (
              <button
                key={`settings-tab-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery('');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm font-black'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. GROUPED SETTINGS CARDS (Material 3 / iOS Grouped Layout) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        
        {/* ----------------------------------------------------------------------- */}
        {/* GROUP 1: SOUND & PLAYBACK */}
        {/* ----------------------------------------------------------------------- */}
        {showAudio && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <Headphones size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    Sound & Audio Engine
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    High-fidelity bitrates, equalizer presets, and instant playback
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold">
                {audioQuality}
              </span>
            </div>

            {/* Bitrate Selector Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Audio Stream Bitrate:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { q: '128k', label: '128 kbps', sub: 'Data Saver' },
                  { q: '192k', label: '192 kbps', sub: 'Standard' },
                  { q: '256k', label: '256 kbps', sub: 'High-Res' },
                  { q: '320k', label: '320 kbps', sub: 'Lossless' },
                ].map((item) => {
                  const isSelected = audioQuality === item.q;
                  return (
                    <button
                      key={`bitrate-btn-${item.q}`}
                      onClick={() => {
                        setAudioQuality(item.q);
                        onShowToast(`Audio bitrate set to ${item.label}`, 'success');
                      }}
                      className={`p-2.5 rounded-2xl text-left border transition-all ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20 text-rose-600 dark:text-rose-400'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{item.label}</span>
                        {isSelected && <Check size={13} className="text-rose-500" />}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Switches Row (Auto-Play & Data Saver) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              
              {/* Instant Auto-Play */}
              <div 
                onClick={() => {
                  const next = !autoPlayOnSelect;
                  setAutoPlayOnSelect(next);
                  onShowToast(next ? '⚡ Instant play on tap enabled' : 'Auto-play paused', 'info');
                }}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all select-none"
              >
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Instant Play on Tap
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    Immediately start playing when selecting any song
                  </span>
                </div>
                <div className={`w-10 h-5.5 rounded-full transition-colors p-0.5 shrink-0 flex items-center ${
                  autoPlayOnSelect ? 'bg-rose-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}>
                  <div className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" />
                </div>
              </div>

              {/* Data Saver Mode */}
              <div 
                onClick={() => {
                  const next = !isDataSaverMode;
                  onToggleDataSaverMode?.(next);
                  onShowToast(next ? '🌱 Data saver mode active' : 'Standard mode enabled', 'info');
                }}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all select-none"
              >
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Data Saver Mode 🌱
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    Optimize audio packets for cellular networks
                  </span>
                </div>
                <div className={`w-10 h-5.5 rounded-full transition-colors p-0.5 shrink-0 flex items-center ${
                  isDataSaverMode ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}>
                  <div className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" />
                </div>
              </div>

            </div>

            {/* Equalizer Tuning */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Acoustic Equalizer:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'bass', label: '💥 Bass Boost' },
                  { id: 'vocal', label: '🎤 Vocal Clarity' },
                  { id: 'acoustic', label: '🎸 Acoustic Warmth' },
                  { id: 'club', label: '🪩 Club EDM' },
                  { id: 'flat', label: '⚖️ Flat Studio' },
                ].map((eq) => (
                  <button
                    key={`eq-btn-${eq.id}`}
                    onClick={() => {
                      setEqualizerPreset(eq.id);
                      onShowToast(`Equalizer: ${eq.label}`, 'success');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                      equalizerPreset === eq.id
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {eq.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* GROUP 2: THEMES & APPEARANCE */}
        {/* ----------------------------------------------------------------------- */}
        {showAppearance && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Palette size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    Themes & Accent Colors
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Switch Dark/Light mode and personalize your app palette
                  </p>
                </div>
              </div>
            </div>

            {/* Dark / Light Mode Selector */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setDarkMode(true);
                  onShowToast('🌙 Cozy Dark Mode enabled', 'info');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  darkMode
                    ? 'bg-slate-900 text-white border-rose-500 ring-2 ring-rose-500/20 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center shrink-0">
                  <Moon size={16} />
                </div>
                <div>
                  <span className="text-xs font-black block">Cozy Dark</span>
                  <span className="text-[10px] text-slate-400">Night atmosphere</span>
                </div>
                {darkMode && <Check size={14} className="ml-auto text-rose-500" />}
              </button>

              <button
                onClick={() => {
                  setDarkMode(false);
                  onShowToast('☀️ Crisp Light Mode enabled', 'info');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  !darkMode
                    ? 'bg-amber-50 text-slate-950 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Sun size={16} />
                </div>
                <div>
                  <span className="text-xs font-black block">Crisp Light</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Vibrant & clean</span>
                </div>
                {!darkMode && <Check size={14} className="ml-auto text-amber-600" />}
              </button>
            </div>

            {/* Accent Presets */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Accent Theme Color:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ACCENT_PRESETS.map((preset) => {
                  const isSelected = accentThemeId === preset.id;
                  return (
                    <button
                      key={`accent-btn-${preset.id}`}
                      onClick={() => {
                        setAccentThemeId(preset.id);
                        onShowToast(`Applied ${preset.name} theme!`, 'success');
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-800 border-slate-900 dark:border-white ring-2 ring-rose-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div 
                        className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-white/40"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {preset.name}
                      </span>
                      {isSelected && <Check size={12} className="ml-auto text-rose-500" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Hex Color Picker */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={customAccentHex || '#f43f5e'}
                  onChange={(e) => {
                    setCustomAccentHex(e.target.value);
                    setAccentThemeId('custom');
                  }}
                  className="w-8 h-8 rounded-xl cursor-pointer border-0 p-0 bg-transparent"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Custom Hex Color
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    {customAccentHex || '#f43f5e'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setAccentThemeId('custom');
                  onShowToast(`Custom color: ${customAccentHex}`, 'success');
                }}
                className="px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-black rounded-xl shadow-xs"
              >
                Apply Custom
              </button>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* GROUP 3: SPEED & NETWORK */}
        {/* ----------------------------------------------------------------------- */}
        {showNetwork && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Zap size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    Cloudflare 1.1.1.1 & Speed
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Anycast edge acceleration, low latency & playback engines
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>

            {/* Live Speed Meter */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-base shadow-sm">
                  ⚡
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    Cloudflare Turbo Edge DNS
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    {cfLatencyInfo 
                      ? `Latency: ${cfLatencyInfo.latencyMs}ms • Edge: ${cfLatencyInfo.edgeColo}`
                      : 'Global Anycast network for instantaneous track loading'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleRunCfSpeedTest}
                disabled={cfTesting}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw size={12} className={cfTesting ? 'animate-spin' : ''} />
                <span>{cfTesting ? 'Testing...' : 'Test Speed'}</span>
              </button>
            </div>

            {/* Playback Engine Selection */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Streaming Engine:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'youtube' as PlayerEngine, title: 'YouTube Direct', desc: 'Direct fast stream' },
                  { id: 'nocookie' as PlayerEngine, title: 'Privacy Shield', desc: 'No tracking cookies' },
                  { id: 'invidious' as PlayerEngine, title: 'Edge Mirror', desc: 'Cloudflare proxy' },
                ].map((eng) => {
                  const isSelected = playerEngine === eng.id;
                  return (
                    <button
                      key={`engine-btn-${eng.id}`}
                      onClick={() => {
                        onChangePlayerEngine?.(eng.id);
                        onShowToast(`Engine set to ${eng.title}`, 'success');
                      }}
                      className={`p-2.5 rounded-2xl text-left border transition-all ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {eng.title}
                        </span>
                        {isSelected && <Check size={13} className="text-amber-500" />}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {eng.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional YouTube API Key Drawer */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key size={15} className="text-amber-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Custom YouTube API Key (Optional)
                  </span>
                </div>
                <button
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  className="px-2.5 py-1 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg"
                >
                  {showApiKeyInput ? 'Close' : youtubeApiKey ? 'Edit' : 'Configure'}
                </button>
              </div>

              {showApiKeyInput && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="relative">
                    <input
                      type={isApiKeyVisible ? 'text' : 'password'}
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-white dark:bg-slate-900 text-xs font-mono px-3 py-1.5 pr-8 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                      className="absolute right-2 top-2 text-slate-400"
                    >
                      {isApiKeyVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveApiKey}
                      className="px-3 py-1 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* GROUP 4: ACCOUNT & CLOUD */}
        {/* ----------------------------------------------------------------------- */}
        {showAccount && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Cloud size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    Google Account & Sync
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sync your favorites, custom playlists and YouTube subscriptions
                  </p>
                </div>
              </div>
            </div>

            {user ? (
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-blue-400" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-black text-sm flex items-center justify-center">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {user.displayName || 'Google Account'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {user.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await logoutUser();
                      onShowToast('Logged out of Google Account', 'info');
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Sign in with Google to synchronize your favorites, playlists, and subscriptions across all devices.
                </p>
                <button
                  onClick={async () => {
                    if (onOpenAuthModal) onOpenAuthModal();
                    else {
                      try {
                        await loginWithGoogle();
                        onShowToast('✨ Signed in with Google!', 'success');
                      } catch (e: any) {
                        onShowToast(e.message || 'Could not sign in', 'error');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-sm"
                >
                  Sign In with Google
                </button>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* GROUP 5: APP, STORAGE & ABOUT */}
        {/* ----------------------------------------------------------------------- */}
        {showApp && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Smartphone size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    App Installation & Storage
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Android WebAPK, link sharing, and cache management
                  </p>
                </div>
              </div>
            </div>

            {/* Android WebAPK Box */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                  <Smartphone size={20} />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    Install as Android WebAPK
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Enjoy fullscreen playback, background audio & home screen access
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onOpenAndroidModal) onOpenAndroidModal();
                  else handleCopyLink();
                }}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Download size={13} />
                <span>Install APK</span>
              </button>
            </div>

            {/* Clear Storage */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Clear Local Cache & History
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Reset local playback cache without deleting cloud records
                </span>
              </div>

              {showResetConfirm ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleClearCache}
                    className="px-2.5 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                >
                  Clear Cache
                </button>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};

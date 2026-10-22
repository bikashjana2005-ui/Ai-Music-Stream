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
  HelpCircle,
  ExternalLink,
  Shield,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { ACCENT_PRESETS } from '../utils/accentTheme';
import { logoutUser, DEFAULT_TARGET_YOUTUBE_EMAIL, getTargetYouTubeEmail } from '../lib/firebase';
import { CloudflareConfig, YouTubeChannelProfile, PlayerEngine } from '../types';
import { getSavedCloudflareConfig, saveCloudflareConfig, measureCloudflareLatency } from '../utils/cloudflare';
import { MorPankhIcon } from '../components/JanmashtamiEffect';
import { isJanmashtamiActive } from '../utils/janmashtami';

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
  onSyncYouTubeAll?: () => Promise<void>;
  onSyncYouTubeSubscriptions?: () => Promise<void>;
  onSyncYouTubeLiked?: () => Promise<void>;
  onSyncYouTubePlaylists?: () => Promise<void>;
  onSyncYouTubeHistory?: () => Promise<void>;
  onOpenMobileConnectModal?: () => void;
  isYouTubeSyncing?: boolean;
  youtubeChannelProfile?: YouTubeChannelProfile | null;
  favoritesCount?: number;
  subscriptionsCount?: number;
  playlistsCount?: number;
  historyCount?: number;
  playerEngine?: PlayerEngine;
  onChangePlayerEngine?: (engine: PlayerEngine) => void;
  isDataSaverMode?: boolean;
  onToggleDataSaverMode?: (enabled: boolean) => void;
}

type TabType = 'all' | 'video' | 'datasaver' | 'audio' | 'appearance' | 'network' | 'account' | 'app';

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
  videoQuality = '144p',
  setVideoQuality,
  autoPlayOnSelect,
  setAutoPlayOnSelect,
  onShowToast,
  user,
  onOpenAuthModal,
  onOpenShareModal,
  onOpenAndroidModal,
  onSyncGoogleAccount,
  onSyncYouTubeAll,
  onSyncYouTubeSubscriptions,
  onSyncYouTubeLiked,
  onSyncYouTubePlaylists,
  onSyncYouTubeHistory,
  onOpenMobileConnectModal,
  isYouTubeSyncing = false,
  youtubeChannelProfile = null,
  favoritesCount = 0,
  subscriptionsCount = 0,
  playlistsCount = 0,
  historyCount = 0,
  playerEngine = 'nocookie',
  onChangePlayerEngine,
  isDataSaverMode = false,
  onToggleDataSaverMode
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [equalizerPreset, setEqualizerPreset] = useState('bass');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(youtubeApiKey);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);

  // Video Quality Preferences State (Screenshot 1)
  const [videoQualityMobile, setVideoQualityMobile] = useState<'auto' | 'higher' | 'data_saver'>(() => {
    return (localStorage.getItem('aura_video_quality_mobile') as any) || 'data_saver';
  });
  const [videoQualityWifi, setVideoQualityWifi] = useState<'auto' | 'higher' | 'data_saver'>(() => {
    return (localStorage.getItem('aura_video_quality_wifi') as any) || 'data_saver';
  });

  const handleSelectMobileQuality = (mode: 'auto' | 'higher' | 'data_saver') => {
    setVideoQualityMobile(mode);
    localStorage.setItem('aura_video_quality_mobile', mode);
    if (mode === 'higher') setVideoQuality?.('1080p');
    else if (mode === 'auto') setVideoQuality?.('720p');
    else if (mode === 'data_saver') setVideoQuality?.('144p');
    const label = mode === 'auto' ? 'Auto (recommended)' : mode === 'higher' ? 'Higher picture quality' : 'Data saver';
    onShowToast(`Mobile Video Quality: ${label}`, 'success');
  };

  const handleSelectWifiQuality = (mode: 'auto' | 'higher' | 'data_saver') => {
    setVideoQualityWifi(mode);
    localStorage.setItem('aura_video_quality_wifi', mode);
    if (mode === 'higher') setVideoQuality?.('1080p');
    else if (mode === 'auto') setVideoQuality?.('720p');
    else if (mode === 'data_saver') setVideoQuality?.('144p');
    const label = mode === 'auto' ? 'Auto (recommended)' : mode === 'higher' ? 'Higher picture quality' : 'Data saver';
    onShowToast(`Wi-Fi Video Quality: ${label}`, 'success');
  };

  // Data Saving State (Screenshot 2)
  const [dataSavingMode, setDataSavingMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('aura_data_saving_mode');
    return saved !== null ? saved === 'true' : isDataSaverMode;
  });
  const [reduceVideoQuality, setReduceVideoQuality] = useState<boolean>(() => {
    const saved = localStorage.getItem('aura_ds_reduce_video');
    return saved !== null ? saved === 'true' : true;
  });
  const [reduceDownloadQuality, setReduceDownloadQuality] = useState<boolean>(() => {
    const saved = localStorage.getItem('aura_ds_reduce_download');
    return saved !== null ? saved === 'true' : true;
  });
  const [reduceSmartDownloadsQuality, setReduceSmartDownloadsQuality] = useState<boolean>(() => {
    const saved = localStorage.getItem('aura_ds_reduce_smart_download');
    return saved !== null ? saved === 'true' : true;
  });
  const [onlyDownloadOverWifi, setOnlyDownloadOverWifi] = useState<boolean>(() => {
    const saved = localStorage.getItem('aura_ds_only_wifi_download');
    return saved !== null ? saved === 'true' : false;
  });
  const [uploadOverWifiOnly, setUploadOverWifiOnly] = useState<boolean>(() => {
    const saved = localStorage.getItem('aura_ds_upload_wifi_only');
    return saved !== null ? saved === 'true' : false;
  });
  const [mutedPlaybackInFeeds, setMutedPlaybackInFeeds] = useState<boolean>(() => {
    const saved = localStorage.getItem('aura_ds_muted_playback_wifi');
    return saved !== null ? saved === 'true' : true;
  });
  const [selectQualityEveryVideo, setSelectQualityEveryVideo] = useState<boolean>(() => {
    const saved = localStorage.getItem('aura_ds_select_quality_every');
    return saved !== null ? saved === 'true' : true;
  });
  const [mobileDataUsageReminder, setMobileDataUsageReminder] = useState<boolean>(() => {
    const saved = localStorage.getItem('aura_ds_data_usage_reminder');
    return saved !== null ? saved === 'true' : false;
  });

  const handleToggleMainDataSaving = (val: boolean) => {
    setDataSavingMode(val);
    localStorage.setItem('aura_data_saving_mode', String(val));
    onToggleDataSaverMode?.(val);
    if (val) {
      setReduceVideoQuality(true);
      setReduceDownloadQuality(true);
      setReduceSmartDownloadsQuality(true);
      localStorage.setItem('aura_ds_reduce_video', 'true');
      localStorage.setItem('aura_ds_reduce_download', 'true');
      localStorage.setItem('aura_ds_reduce_smart_download', 'true');
      onShowToast('Data saving mode activated', 'success');
    } else {
      onShowToast('Data saving mode disabled', 'info');
    }
  };

  // Cloudflare Speed Test State
  const [cfConfig, setCfConfig] = useState<CloudflareConfig>(() => getSavedCloudflareConfig());
  const [cfTesting, setCfTesting] = useState(false);
  const [cfLatencyInfo, setCfLatencyInfo] = useState<{ latencyMs: number; edgeColo: string; status: string } | null>(null);

  const handleUpdateCfConfig = (updates: Partial<CloudflareConfig>) => {
    const updated = { ...cfConfig, ...updates };
    setCfConfig(updated);
    saveCloudflareConfig(updated);
    onShowToast('Speed settings updated', 'success');
  };

  const handleRunCfSpeedTest = async () => {
    setCfTesting(true);
    try {
      const res = await measureCloudflareLatency();
      setCfLatencyInfo(res);
      handleUpdateCfConfig({ latencyMs: res.latencyMs, edgeColo: res.edgeColo });
      onShowToast(`Speed test: ${res.latencyMs}ms (${res.edgeColo})`, 'success');
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
      onShowToast('App link copied to clipboard', 'success');
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
    onShowToast('Local cache & playback data cleared', 'info');
  };

  const handleSaveApiKey = () => {
    setYoutubeApiKey(tempApiKey.trim());
    localStorage.setItem('aura_ai_youtube_key', tempApiKey.trim());
    onShowToast(tempApiKey.trim() ? 'YouTube API Key saved' : 'Using direct YouTube streaming engine', 'success');
    setShowApiKeyInput(false);
  };

  // Search filtering
  const q = searchQuery.toLowerCase().trim();
  const showVideoQuality = (activeTab === 'all' || activeTab === 'video') && (!q || ['video', 'quality', 'preference', 'resolution', '1080p', '720p', 'mobile', 'wifi', 'wi-fi', 'higher picture', 'data saver'].some(k => k.includes(q)));
  const showDataSaving = (activeTab === 'all' || activeTab === 'datasaver') && (!q || ['data', 'saving', 'saver', 'download', 'smart download', 'wifi', 'upload', 'feed', 'monitoring', 'usage', 'reminder'].some(k => k.includes(q)));
  const showAudio = (activeTab === 'all' || activeTab === 'audio') && (!q || ['sound', 'audio', 'bitrate', 'equalizer', 'bass', 'lossless', 'quality', 'autoplay'].some(k => k.includes(q)));
  const showAppearance = (activeTab === 'all' || activeTab === 'appearance') && (!q || ['theme', 'look', 'dark', 'light', 'accent', 'color', 'hex', 'palette', 'mode'].some(k => k.includes(q)));
  const showNetwork = (activeTab === 'all' || activeTab === 'network') && (!q || ['speed', 'network', 'cloudflare', 'dns', '1.1.1.1', 'latency', 'api', 'engine', 'invidious', 'key'].some(k => k.includes(q)));
  const showAccount = (activeTab === 'all' || activeTab === 'account') && (!q || ['account', 'google', 'cloud', 'sync', 'login', 'subscriptions', 'firestore', 'backup', 'profile'].some(k => k.includes(q)));
  const showApp = (activeTab === 'all' || activeTab === 'app') && (!q || ['app', 'android', 'apk', 'install', 'share', 'cache', 'storage', 'reset', 'clear', 'about', 'version'].some(k => k.includes(q)));

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <Layers size={14} /> },
    { id: 'video', label: 'Video Quality', icon: <Tv size={14} /> },
    { id: 'datasaver', label: 'Data Saving', icon: <Gauge size={14} /> },
    { id: 'audio', label: 'Sound', icon: <Headphones size={14} /> },
    { id: 'appearance', label: 'Themes', icon: <Palette size={14} /> },
    { id: 'network', label: 'Speed', icon: <Zap size={14} /> },
    { id: 'account', label: 'Account', icon: <Cloud size={14} /> },
    { id: 'app', label: 'System', icon: <Smartphone size={14} /> },
  ];

  const savedMobileUser = (() => {
    try {
      const raw = localStorage.getItem('aura_mobile_auth');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const displayName = user?.displayName || savedMobileUser?.displayName || (user?.email ? user.email.split('@')[0] : 'Bikash Jana');
  const userEmail = user?.email || (savedMobileUser?.phoneNumber ? `Mobile: ${savedMobileUser.phoneNumber}` : (getTargetYouTubeEmail() || 'bikashjana2005@gmail.com'));
  const initialLetter = (displayName.trim()[0] || 'B').toUpperCase();

  return (
    <div className="space-y-4 w-full max-w-3xl mx-auto animate-fade-in pb-32 select-none px-2 sm:px-4 pt-1">
      {/* 1. TOP PROFILE & ACCOUNT SYNC BANNER (iOS Liquid Glass Card) */}
      <div className="ios-glass-card rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 text-white flex items-center justify-center text-lg font-black shadow-md ring-2 ring-white/30 dark:ring-white/20 shrink-0">
            {initialLetter}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {displayName}
              </h2>
              {savedMobileUser?.verified ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck size={11} />
                  Verified OTP
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 text-[10px] font-black uppercase tracking-wider">
                  Cloud Sync
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 truncate mt-0.5">
              {userEmail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(user || savedMobileUser) ? (
            <button
              type="button"
              onClick={async () => {
                try {
                  localStorage.removeItem('aura_mobile_auth');
                  localStorage.removeItem('aura_mobile_verified');
                } catch {}
                await logoutUser();
                onShowToast('Signed out of account', 'info');
              }}
              className="px-3.5 py-1.5 rounded-full ios-glass-button text-slate-700 dark:text-zinc-200 hover:text-rose-500 text-xs font-semibold transition-all active:scale-95 duration-75 flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuthModal && onOpenAuthModal()}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white text-xs font-bold shadow-md shadow-rose-600/30 hover:brightness-110 active:scale-95 duration-75 flex items-center gap-1.5"
            >
              <LogIn size={14} />
              <span>Connect Account</span>
            </button>
          )}

          {onSyncYouTubeAll && (
            <button
              type="button"
              onClick={() => onSyncYouTubeAll()}
              disabled={isYouTubeSyncing}
              className="w-8 h-8 rounded-full ios-glass-button flex items-center justify-center text-slate-700 dark:text-zinc-200 transition-all active:scale-95 duration-75"
              title="Sync All YouTube Data"
            >
              <RefreshCw size={14} className={isYouTubeSyncing ? 'animate-spin text-rose-500' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* 2. SEARCH & SETTINGS CATEGORIES TABS (iOS Liquid Glass Pills) */}
      <div className="space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search YouTube settings..."
            className="w-full bg-white/45 dark:bg-black/35 backdrop-blur-xl text-slate-900 dark:text-white text-xs pl-9 pr-8 py-2.5 rounded-full border border-black/5 dark:border-white/12 shadow-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium placeholder:text-slate-500 dark:placeholder:text-zinc-400"
          />
          <Search size={15} className="absolute left-3.5 top-3 text-slate-500 dark:text-zinc-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 duration-75 ${
                  isActive
                    ? 'ios-glass-pill-active font-bold shadow-sm'
                    : 'ios-glass-pill text-slate-700 dark:text-zinc-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. GROUPED SETTINGS CARDS */}
      <div className="space-y-4">

        {/* ----------------------------------------------------------------------- */}
        {/* GROUP: VIDEO QUALITY PREFERENCES (iOS Liquid Glass Card) */}
        {/* ----------------------------------------------------------------------- */}
        {showVideoQuality && (
          <div className="ios-glass-card rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-xs">
                  <Tv size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Video quality preferences
                  </h2>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    Select your default streaming quality for all videos. You can change streaming quality in player options for single videos.
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-section 1: VIDEO QUALITY ON MOBILE NETWORKS */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold tracking-wider text-slate-600 dark:text-zinc-400 uppercase block pt-1">
                Video quality on mobile networks
              </span>
              <div className="space-y-1.5">
                {[
                  { id: 'auto', title: 'Auto (recommended)', desc: 'Adjusts to give you the best experience for your conditions' },
                  { id: 'higher', title: 'Higher picture quality', desc: 'Uses more data' },
                  { id: 'data_saver', title: 'Data saver', desc: 'Lower picture quality' },
                ].map((item) => {
                  const isSelected = videoQualityMobile === item.id;
                  return (
                    <div
                      key={`mob-qual-${item.id}`}
                      onClick={() => handleSelectMobileQuality(item.id as any)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all select-none ${
                        isSelected 
                          ? 'border-rose-500/60 bg-rose-500/15 dark:bg-rose-500/20 shadow-xs' 
                          : 'border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/[0.04] hover:bg-white/60 dark:hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="space-y-0.5 pr-3">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-zinc-400 block">
                          {item.desc}
                        </span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'border-red-500' : 'border-zinc-600'
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quality Selection Popup Toggle */}
              <div 
                onClick={() => {
                  const nextVal = !selectQualityEveryVideo;
                  setSelectQualityEveryVideo(nextVal);
                  if (nextVal) {
                    localStorage.removeItem('aura_skip_quality_prompt');
                    localStorage.setItem('aura_ds_select_quality_every', 'true');
                    onShowToast('Quality selector popup enabled on video tap', 'success');
                  } else {
                    localStorage.setItem('aura_skip_quality_prompt', 'true');
                    localStorage.setItem('aura_ds_select_quality_every', 'false');
                    onShowToast('Quality selector popup disabled (direct play enabled)', 'info');
                  }
                }}
                className="pt-2 flex items-center justify-between border-t border-red-500/10 cursor-pointer select-none hover:opacity-90"
              >
                <div className="space-y-0.5 pr-3">
                  <span className="text-xs font-bold text-white block">
                    Show quality selector popup on video tap
                  </span>
                  <span className="text-[11px] text-zinc-400 block">
                    Displays preview and 3 quality options (Auto, High Quality, Data Saver) before playing
                  </span>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  selectQualityEveryVideo ? 'bg-red-600' : 'bg-zinc-700'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    selectQualityEveryVideo ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* GROUP: DATA SAVING (iOS Liquid Glass Card) */}
        {/* ----------------------------------------------------------------------- */}
        {showDataSaving && (
          <div className="ios-glass-card rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-xs">
                  <Gauge size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Data saving
                  </h2>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    Control bandwidth, stream packet reduction, and background Wi-Fi usage
                  </p>
                </div>
              </div>
            </div>

            {/* Main Data Saving Mode Toggle */}
            <div 
              onClick={() => handleToggleMainDataSaving(!dataSavingMode)}
              className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/60 dark:hover:bg-white/[0.08] transition-all select-none"
            >
              <div className="space-y-0.5 pr-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Data saving mode
                </span>
                <span className="text-[11px] text-slate-600 dark:text-zinc-400 block">
                  Automatically adjusts settings to save mobile data
                </span>
              </div>
              <div className={`w-10 h-5.5 rounded-full transition-colors p-0.5 shrink-0 flex items-center ${
                dataSavingMode ? 'bg-gradient-to-r from-rose-600 to-red-600 justify-end shadow-xs' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
              }`}>
                <div className={`w-4.5 h-4.5 rounded-full shadow-xs ${dataSavingMode ? 'bg-white' : 'bg-white dark:bg-zinc-400'}`} />
              </div>
            </div>

            {/* Sub-section: DEFAULT SETTINGS */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold tracking-wider text-slate-600 dark:text-zinc-400 uppercase block pt-1">
                Default settings
              </span>
              <div className="space-y-1.5">
                {[
                  {
                    id: 'reduceVideo',
                    label: 'Reduce video quality',
                    value: reduceVideoQuality,
                    toggle: () => {
                      const next = !reduceVideoQuality;
                      setReduceVideoQuality(next);
                      localStorage.setItem('aura_ds_reduce_video', String(next));
                      onShowToast(next ? 'Video quality reduced to save data' : 'Video quality reduction off', 'info');
                    }
                  },
                  {
                    id: 'reduceDownload',
                    label: 'Reduce download quality',
                    value: reduceDownloadQuality,
                    toggle: () => {
                      const next = !reduceDownloadQuality;
                      setReduceDownloadQuality(next);
                      localStorage.setItem('aura_ds_reduce_download', String(next));
                      onShowToast(next ? 'Download quality reduced' : 'Download quality standard', 'info');
                    }
                  },
                  {
                    id: 'reduceSmartDownload',
                    label: 'Reduce Smart downloads quality',
                    value: reduceSmartDownloadsQuality,
                    toggle: () => {
                      const next = !reduceSmartDownloadsQuality;
                      setReduceSmartDownloadsQuality(next);
                      localStorage.setItem('aura_ds_reduce_smart_download', String(next));
                      onShowToast(next ? 'Smart downloads quality reduced' : 'Smart downloads quality standard', 'info');
                    }
                  },
                  {
                    id: 'mutedPlaybackWifi',
                    label: 'Muted playback in feeds over Wi-Fi only',
                    value: mutedPlaybackInFeeds,
                    toggle: () => {
                      const next = !mutedPlaybackInFeeds;
                      setMutedPlaybackInFeeds(next);
                      localStorage.setItem('aura_ds_muted_playback_wifi', String(next));
                      onShowToast(next ? 'Feed autoplay restricted to Wi-Fi' : 'Feed autoplay allowed', 'info');
                    }
                  },
                ].map((item) => (
                  <div
                    key={`ds-setting-${item.id}`}
                    onClick={item.toggle}
                    className="p-3 rounded-xl bg-zinc-850/80 border border-red-500/10 flex items-center justify-between cursor-pointer hover:bg-zinc-800 transition-all select-none"
                  >
                    <span className="text-xs font-semibold text-white pr-3">
                      {item.label}
                    </span>
                    <div className={`w-10 h-5.5 rounded-full transition-colors p-0.5 shrink-0 flex items-center ${
                      item.value ? 'bg-gradient-to-r from-red-600 to-rose-600 justify-end shadow-xs' : 'bg-zinc-700 justify-start'
                    }`}>
                      <div className={`w-4.5 h-4.5 rounded-full shadow-xs ${item.value ? 'bg-white' : 'bg-zinc-400'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-section: DATA MONITORING & CONTROL */}
            <div className="space-y-2 pt-2 border-t border-red-500/10">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase block pt-1">
                Data monitoring & control
              </span>
              <div className="space-y-1.5">
                {[
                  {
                    id: 'selectQualityEvery',
                    label: 'Select quality for every video',
                    value: selectQualityEveryVideo,
                    toggle: () => {
                      const next = !selectQualityEveryVideo;
                      setSelectQualityEveryVideo(next);
                      localStorage.setItem('aura_ds_select_quality_every', String(next));
                      onShowToast(next ? 'Quality prompt active for each video' : 'Quality prompt off', 'info');
                    }
                  },
                ].map((item) => (
                  <div
                    key={`ds-ctrl-${item.id}`}
                    onClick={item.toggle}
                    className="p-3 rounded-xl bg-zinc-850/80 border border-red-500/10 flex items-center justify-between cursor-pointer hover:bg-zinc-800 transition-all select-none"
                  >
                    <span className="text-xs font-semibold text-white pr-3">
                      {item.label}
                    </span>
                    <div className={`w-10 h-5.5 rounded-full transition-colors p-0.5 shrink-0 flex items-center ${
                      item.value ? 'bg-gradient-to-r from-red-600 to-rose-600 justify-end shadow-xs' : 'bg-zinc-700 justify-start'
                    }`}>
                      <div className={`w-4.5 h-4.5 rounded-full shadow-xs ${item.value ? 'bg-white' : 'bg-zinc-400'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* ----------------------------------------------------------------------- */}
        {/* GROUP 1: SOUND & PLAYBACK ENGINE */}
        {/* ----------------------------------------------------------------------- */}
        {showAudio && (
          <div className="bg-zinc-900/90 rounded-2xl p-4 sm:p-5 border border-red-500/20 shadow-lg shadow-red-950/10 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-red-500/15 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600/15 text-red-500 flex items-center justify-center border border-red-500/20">
                  <Headphones size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Sound & Audio Engine
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    High-fidelity bitrates, equalizer presets, and instant playback
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-red-600/20 text-red-400 text-xs font-mono font-bold border border-red-500/30">
                {audioQuality}
              </span>
            </div>

            {/* Bitrate Selector Grid */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-300">
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
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-br from-red-600/25 to-rose-600/15 border-red-500 text-white shadow-sm'
                          : 'bg-zinc-850/80 border-red-500/10 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{item.label}</span>
                        {isSelected && <Check size={13} className="text-red-400" />}
                      </div>
                      <span className="text-[10px] text-zinc-400">{item.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Switches Row (Auto-Play & Data Saver with Sleek Red Toggles) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              
              {/* Instant Auto-Play */}
              <div 
                onClick={() => {
                  const next = !autoPlayOnSelect;
                  setAutoPlayOnSelect(next);
                  onShowToast(next ? 'Instant playback on click enabled' : 'Auto-play disabled', 'info');
                }}
                className="p-3 rounded-xl bg-zinc-850/80 border border-red-500/15 flex items-center justify-between cursor-pointer hover:bg-zinc-800 transition-all select-none"
              >
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-white block">
                    Instant Play on Tap
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    Immediately start playing when selecting any song
                  </span>
                </div>
                <div className={`w-10 h-5.5 rounded-full transition-colors p-0.5 shrink-0 flex items-center ${
                  autoPlayOnSelect ? 'bg-gradient-to-r from-red-600 to-rose-600 justify-end shadow-xs' : 'bg-zinc-700 justify-start'
                }`}>
                  <div className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" />
                </div>
              </div>

              {/* Data Saver Mode */}
              <div 
                onClick={() => {
                  const next = !isDataSaverMode;
                  onToggleDataSaverMode?.(next);
                  onShowToast(next ? 'Data saver active' : 'Standard quality enabled', 'info');
                }}
                className="p-3 rounded-xl bg-zinc-850/80 border border-red-500/15 flex items-center justify-between cursor-pointer hover:bg-zinc-800 transition-all select-none"
              >
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-white block">
                    Data Saver Mode
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    Optimize stream packets for low data usage
                  </span>
                </div>
                <div className={`w-10 h-5.5 rounded-full transition-colors p-0.5 shrink-0 flex items-center ${
                  isDataSaverMode ? 'bg-emerald-500 justify-end shadow-xs' : 'bg-zinc-700 justify-start'
                }`}>
                  <div className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" />
                </div>
              </div>

            </div>

            {/* Equalizer Tuning */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-zinc-300">
                Acoustic Equalizer:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'bass', label: 'Bass Boost' },
                  { id: 'vocal', label: 'Vocal Clarity' },
                  { id: 'acoustic', label: 'Acoustic' },
                  { id: 'club', label: 'Club EDM' },
                  { id: 'flat', label: 'Flat Studio' },
                ].map((eq) => (
                  <button
                    key={`eq-btn-${eq.id}`}
                    onClick={() => {
                      setEqualizerPreset(eq.id);
                      onShowToast(`Equalizer: ${eq.label}`, 'success');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all border cursor-pointer ${
                      equalizerPreset === eq.id
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-md shadow-red-600/30'
                        : 'bg-zinc-850/80 text-zinc-300 border-red-500/10 hover:bg-zinc-800'
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
          <div className="bg-zinc-900/90 rounded-2xl p-4 sm:p-5 border border-red-500/20 shadow-lg shadow-red-950/10 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-red-500/15 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600/15 text-red-500 flex items-center justify-center border border-red-500/20">
                  <Palette size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Themes & Accent Colors
                  </h2>
                  <p className="text-[11px] text-zinc-400">
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
                  onShowToast('Dark Mode enabled', 'info');
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  darkMode
                    ? 'bg-gradient-to-br from-red-950/30 to-zinc-900 text-white border-red-500 shadow-sm'
                    : 'bg-zinc-850/80 text-zinc-400 border-red-500/10 hover:bg-zinc-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-950/60 text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                  <Moon size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold block">Obsidian Dark</span>
                  <span className="text-[10px] text-zinc-400">Application Main Theme</span>
                </div>
                {darkMode && <Check size={14} className="ml-auto text-red-400" />}
              </button>

              <button
                onClick={() => {
                  setDarkMode(false);
                  onShowToast('Light Mode enabled', 'info');
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  !darkMode
                    ? 'bg-gradient-to-br from-red-950/30 to-zinc-900 text-white border-red-500 shadow-sm'
                    : 'bg-zinc-850/80 text-zinc-400 border-red-500/10 hover:bg-zinc-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Sun size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold block">Crisp Light</span>
                  <span className="text-[10px] text-zinc-400">Daytime atmosphere</span>
                </div>
                {!darkMode && <Check size={14} className="ml-auto text-amber-400" />}
              </button>
            </div>

            {/* Accent Presets */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-300">
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
                        onShowToast(`Theme set to ${preset.name}`, 'success');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-800 border-red-500 text-white shadow-sm'
                          : 'bg-zinc-850/80 border-red-500/10 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <div 
                        className="w-4 h-4 rounded-full shrink-0 border border-white/20"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <span className="text-xs font-semibold truncate">
                        {preset.name}
                      </span>
                      {isSelected && <Check size={12} className="ml-auto text-red-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Hex Color Picker */}
            <div className="p-3 rounded-xl bg-zinc-850/80 border border-red-500/15 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={customAccentHex || '#dc2626'}
                  onChange={(e) => {
                    setCustomAccentHex(e.target.value);
                    setAccentThemeId('custom');
                  }}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Custom Accent Color
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {customAccentHex || '#dc2626'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setAccentThemeId('custom');
                  onShowToast(`Applied custom color: ${customAccentHex}`, 'success');
                }}
                className="px-3 py-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                Apply Custom
              </button>
            </div>

            {/* Janmashtami Special Festival Effect (Active until 6th September 2026) */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-[#0c1e36] via-[#111c2a] to-[#1e1509] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                  <MorPankhIcon size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <span>श्रीकृष्ण जन्माष्टमी विशेष</span>
                      <span>🪈</span>
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Active until 6 Sep 2026
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-300 block mt-0.5">
                    Divine peacock feathers, golden sparkles & Krishna bhajans
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const current = localStorage.getItem('aura_janmashtami_particles') !== 'false';
                    const next = !current;
                    localStorage.setItem('aura_janmashtami_particles', String(next));
                    window.dispatchEvent(new Event('storage'));
                    onShowToast(next ? '✨ Janmashtami particles active' : 'Janmashtami particles paused', 'info');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all cursor-pointer active:scale-95"
                >
                  Toggle Particles
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* GROUP 3: SPEED & NETWORK */}
        {/* ----------------------------------------------------------------------- */}
        {showNetwork && (
          <div className="bg-zinc-900/90 rounded-2xl p-4 sm:p-5 border border-red-500/20 shadow-lg shadow-red-950/10 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-red-500/15 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600/15 text-red-500 flex items-center justify-center border border-red-500/20">
                  <Zap size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Cloudflare 1.1.1.1 & Network Speed
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Anycast edge acceleration, low latency & playback engines
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center gap-1 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>

            {/* Playback Engine Selection */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-300">
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
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-br from-red-600/25 to-rose-600/15 border-red-500 text-white shadow-sm'
                          : 'bg-zinc-850/80 border-red-500/10 hover:bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-white">
                          {eng.title}
                        </span>
                        {isSelected && <Check size={13} className="text-red-400" />}
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {eng.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional YouTube API Key Drawer */}
            <div className="p-3 rounded-xl bg-zinc-850/80 border border-red-500/15 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key size={15} className="text-zinc-400" />
                  <span className="text-xs font-bold text-white">
                    Custom YouTube API Key (Optional)
                  </span>
                </div>
                <button
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  className="px-2.5 py-1 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-red-500/15 rounded-lg cursor-pointer transition-colors"
                >
                  {showApiKeyInput ? 'Close' : youtubeApiKey ? 'Edit' : 'Configure'}
                </button>
              </div>

              {showApiKeyInput && (
                <div className="space-y-2 pt-2 border-t border-red-500/15">
                  <div className="relative">
                    <input
                      type={isApiKeyVisible ? 'text' : 'password'}
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-zinc-900 text-xs font-mono px-3 py-1.5 pr-8 rounded-lg border border-red-500/25 text-white focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                      className="absolute right-2 top-2 text-zinc-400 hover:text-white"
                    >
                      {isApiKeyVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveApiKey}
                      className="px-3 py-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
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
          <div className="bg-zinc-900/90 rounded-2xl p-4 sm:p-5 border border-red-500/20 shadow-lg shadow-red-950/10 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-red-500/15 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600/15 text-red-500 flex items-center justify-center border border-red-500/20">
                  <Cloud size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Cloud Account & Sync
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Sync your favorites, custom playlists and YouTube subscriptions in real time
                  </p>
                </div>
              </div>
            </div>

            {/* YouTube Mobile & Account Synchronization Panel */}
            <div className="p-3.5 rounded-xl bg-zinc-855/80 border border-red-500/15 space-y-3">
              {/* TARGET YOUTUBE ACCOUNT HIGHLIGHT */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-600/15 via-rose-500/10 to-transparent border border-red-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon fill="#e11d48" points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white">Target Account</span>
                      {user?.email && user.email !== 'bikashjana2005@gmail.com' ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 font-mono">
                          {user.email}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[10px] text-zinc-400 block">
                      Direct YouTube synchronization for subscriptions, liked songs & playlists
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onOpenAuthModal && onOpenAuthModal()}
                  className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
                  <span>Connect Account</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      YouTube Real-Time Sync
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      Sync subscriptions, channel, history, liked videos & playlists
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onOpenMobileConnectModal) onOpenMobileConnectModal();
                      else if (onSyncYouTubeAll) onSyncYouTubeAll();
                    }}
                    disabled={isYouTubeSyncing}
                    className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw size={12} className={isYouTubeSyncing ? 'animate-spin' : ''} />
                    <span>{isYouTubeSyncing ? 'Syncing...' : 'Sync All'}</span>
                  </button>

                  <button
                    onClick={() => onOpenMobileConnectModal?.()}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-red-500/15 transition-all cursor-pointer"
                  >
                    Connect Phone
                  </button>
                </div>
              </div>

              {/* YouTube Channel Profile Summary (if synced) */}
              {youtubeChannelProfile && (
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-red-500/20 flex items-center gap-2.5">
                  <img
                    src={youtubeChannelProfile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
                    alt={youtubeChannelProfile.title}
                    className="w-8 h-8 rounded-full border border-red-500 shadow-xs"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      {youtubeChannelProfile.title}
                    </span>
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {youtubeChannelProfile.customUrl} • {youtubeChannelProfile.subscriberCount}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Linked
                  </span>
                </div>
              )}

              {/* Real-time Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  onClick={() => onSyncYouTubeSubscriptions?.()}
                  disabled={isYouTubeSyncing}
                  className="p-2.5 rounded-xl bg-zinc-900/90 border border-red-500/15 text-left hover:border-red-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-white">Subscriptions</span>
                    <RefreshCw size={11} className={`text-zinc-400 group-hover:text-red-400 ${isYouTubeSyncing ? 'animate-spin' : ''}`} />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {subscriptionsCount} channels
                  </span>
                </button>

                <button
                  onClick={() => onSyncYouTubeLiked?.()}
                  disabled={isYouTubeSyncing}
                  className="p-2.5 rounded-xl bg-zinc-900/90 border border-red-500/15 text-left hover:border-red-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-white">Liked Videos</span>
                    <RefreshCw size={11} className={`text-zinc-400 group-hover:text-red-400 ${isYouTubeSyncing ? 'animate-spin' : ''}`} />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {favoritesCount} songs
                  </span>
                </button>

                <button
                  onClick={() => onSyncYouTubePlaylists?.()}
                  disabled={isYouTubeSyncing}
                  className="p-2.5 rounded-xl bg-zinc-900/90 border border-red-500/15 text-left hover:border-red-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-white">Playlists</span>
                    <RefreshCw size={11} className={`text-zinc-400 group-hover:text-red-400 ${isYouTubeSyncing ? 'animate-spin' : ''}`} />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {playlistsCount} lists
                  </span>
                </button>

                <button
                  onClick={() => onSyncYouTubeHistory?.()}
                  disabled={isYouTubeSyncing}
                  className="p-2.5 rounded-xl bg-zinc-900/90 border border-red-500/15 text-left hover:border-red-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-white">History</span>
                    <RefreshCw size={11} className={`text-zinc-400 group-hover:text-red-400 ${isYouTubeSyncing ? 'animate-spin' : ''}`} />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {historyCount} videos
                  </span>
                </button>
              </div>
            </div>

            {/* Mobile & OTP Verified Account Card */}
            <div className="p-3.5 rounded-xl bg-zinc-855/80 border border-emerald-500/25 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white">
                      {savedMobileUser?.displayName || 'Mobile & OTP Login'}
                    </span>
                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      {savedMobileUser?.verified ? 'VERIFIED OTP' : 'FAST SMS'}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 block font-mono">
                    {savedMobileUser?.phoneNumber || 'Login with Name + Mobile + Verified OTP'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenAuthModal && onOpenAuthModal()}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Smartphone size={13} />
                <span>{savedMobileUser?.verified ? 'Switch Mobile Profile' : 'Login with Mobile OTP'}</span>
              </button>
            </div>

            {user ? (
              <div className="p-3.5 rounded-xl bg-zinc-850/80 border border-red-500/15 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {user.photoURL && user.photoURL.trim() ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-9 h-9 rounded-full border border-red-500 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-rose-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                      {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {user.displayName || (user.isAnonymous ? 'Guest User' : 'Connected Account')}
                    </span>
                    <span className="text-[11px] text-rose-400 font-mono">
                      {user.email || (user.isAnonymous ? 'Offline Guest Mode' : 'Cloud Sync Active')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await logoutUser();
                      onShowToast('Signed out of account', 'info');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-850/80 border border-red-500/15 text-center space-y-2">
                <p className="text-xs text-zinc-300 font-medium">
                  Sign in to synchronize your favorites, playlists, and subscriptions across devices.
                </p>
                <button
                  onClick={() => {
                    if (onOpenAuthModal) onOpenAuthModal();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/30 cursor-pointer"
                >
                  Sign In / Connect Account
                </button>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* GROUP 5: APP & SYSTEM SETTINGS */}
        {/* ----------------------------------------------------------------------- */}
        {showApp && (
          <div className="bg-zinc-900/90 rounded-2xl p-4 sm:p-5 border border-red-500/20 shadow-lg shadow-red-950/10 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-red-500/15 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600/15 text-red-500 flex items-center justify-center border border-red-500/20">
                  <Smartphone size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    App Storage & Cache
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Local caching and playback history management
                  </p>
                </div>
              </div>
            </div>

            {/* Clear Storage */}
            <div className="p-3 rounded-xl bg-zinc-850/80 border border-red-500/15 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  Clear Local Cache & History
                </span>
                <span className="text-[10px] text-zinc-400">
                  Reset local playback cache without deleting cloud records
                </span>
              </div>

              {showResetConfirm ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleClearCache}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg cursor-pointer border border-red-500/15"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
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

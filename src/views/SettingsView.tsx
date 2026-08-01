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
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { ACCENT_PRESETS } from '../utils/accentTheme';
import { PlayerEngine } from '../components/GlobalYouTubePlayer';

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
  onSyncGoogleAccount?: () => void;
  favoritesCount?: number;
  subscriptionsCount?: number;
  playlistsCount?: number;
  playerEngine?: PlayerEngine;
  onChangePlayerEngine?: (engine: PlayerEngine) => void;
  isDataSaverMode?: boolean;
  onToggleDataSaverMode?: (enabled: boolean) => void;
}

type SettingTab = 'all' | 'playback' | 'appearance' | 'account' | 'share' | 'system';

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
  onSyncGoogleAccount,
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
    { id: 'playback', label: 'Playback & Player', icon: <Volume2 size={15} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
    { id: 'account', label: 'Account & Sync', icon: <UserIcon size={15} /> },
    { id: 'share', label: 'App Link', icon: <Share2 size={15} /> },
    { id: 'system', label: 'System & Data', icon: <HardDrive size={15} /> },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-28">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900/90 via-slate-900/90 to-purple-950/90 text-white border border-white/10 shadow-xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30">
                <Settings size={22} />
              </span>
              <h1 className="text-2xl font-black tracking-tight text-white">App & Preferences Settings</h1>
            </div>
            <p className="text-xs text-gray-300 font-medium">
              Configure playback engines, liquid glass themes, audio bitrates, and cloud synchronization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="px-3 py-1 bg-white/10 rounded-xl text-[11px] font-bold text-indigo-200 border border-white/15 flex items-center gap-1.5">
              <Globe size={13} className="text-indigo-400" />
              Engine: {playerEngine.toUpperCase()}
            </span>
            <span className="px-3 py-1 bg-white/10 rounded-xl text-[11px] font-bold text-amber-300 border border-white/15 flex items-center gap-1.5">
              <Sparkles size={13} />
              {audioQuality} kbps Audio
            </span>
          </div>
        </div>
      </div>

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

          {/* 3. ACCOUNT & CLOUD SYNC SECTION */}
          {(activeTab === 'all' || activeTab === 'account') && (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <UserIcon size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                      Account & Firestore Sync
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Backup playlists, favorites, and channels to cloud</p>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  user
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}>
                  {user ? 'Firestore Connected' : 'Offline Mode'}
                </span>
              </div>

              {user ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'User Avatar'} className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500 shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                        <UserIcon size={22} />
                      </div>
                    )}
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                        {user.displayName || 'Authenticated User'}
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{user.email}</p>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                        Synced: {subscriptionsCount} Subscriptions • {favoritesCount} Favorites • {playlistsCount} Playlists
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        if (onSyncGoogleAccount) {
                          setIsSyncing(true);
                          await onSyncGoogleAccount();
                          setTimeout(() => setIsSyncing(false), 800);
                        }
                      }}
                      disabled={isSyncing}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                      <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                    </button>

                    <button
                      onClick={onOpenAuthModal}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Cloud size={14} />
                      <span>Manage</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-slate-900/40 rounded-2xl border border-gray-200/80 dark:border-white/10">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Cloud size={16} className="text-indigo-500" />
                      Sign in with Google Account
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                      Sync your playlists, favorites, and channel subscriptions securely in real time.
                    </p>
                  </div>

                  <button
                    onClick={onOpenAuthModal}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
                  >
                    <LogIn size={15} />
                    Sign In & Sync
                  </button>
                </div>
              )}
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

          {/* 5. SYSTEM, STORAGE & CACHE SECTION */}
          {(activeTab === 'all' || activeTab === 'system') && (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
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


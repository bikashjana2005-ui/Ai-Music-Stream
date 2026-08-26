import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Library, 
  Settings, 
  Moon, 
  Sun, 
  Radio, 
  Sparkles,
  Key,
  Youtube,
  Plus,
  Check,
  User,
  Cloud,
  Share2,
  Download,
  Zap,
  Wifi,
  WifiOff,
  Star,
  Tv,
  Globe,
  Smartphone,
  LogIn
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { TabType, SubscribedChannel } from '../types';
import { getChannelAvatar, getFallbackChannelAvatar } from '../utils/channelLogos';
import { AppLogo } from './AppLogo';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  favoritesCount: number;
  hasYouTubeKey?: boolean;
  subscriptionsCount?: number;
  subscriptions?: SubscribedChannel[];
  selectedChannelFilter?: string | null;
  setSelectedChannelFilter?: (channelName: string | null) => void;
  onOpenSubscriptionsModal?: () => void;
  user?: FirebaseUser | null;
  onOpenAuthModal?: () => void;
  onOpenShareModal?: () => void;
  onOpenWebView?: (url?: string, title?: string) => void;
  onOpenAndroidModal?: () => void;
  isDataSaverMode?: boolean;
  onToggleDataSaverMode?: (enabled: boolean) => void;
  isOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  favoritesCount,
  hasYouTubeKey = false,
  subscriptionsCount = 0,
  subscriptions = [],
  selectedChannelFilter,
  setSelectedChannelFilter,
  onOpenSubscriptionsModal,
  user,
  onOpenAuthModal,
  onOpenShareModal,
  onOpenWebView,
  onOpenAndroidModal,
  isDataSaverMode = false,
  onToggleDataSaverMode,
  isOnline = true
}) => {
  const topNavRef = useRef<HTMLDivElement>(null);
  const bottomDockRef = useRef<HTMLDivElement>(null);
  const channelStripRef = useRef<HTMLDivElement>(null);

  // Smoothly scroll active tab and selected channel into view in navbar containers
  useEffect(() => {
    const scrollTargetIntoView = (containerRef: React.RefObject<HTMLDivElement | null>, selector: string) => {
      if (containerRef.current) {
        const el = containerRef.current.querySelector<HTMLElement>(selector);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    };

    scrollTargetIntoView(topNavRef, `[data-tab="${activeTab}"]`);
    scrollTargetIntoView(bottomDockRef, `[data-tab="${activeTab}"]`);
  }, [activeTab]);

  useEffect(() => {
    if (channelStripRef.current) {
      const selector = selectedChannelFilter 
        ? `[data-channel="${selectedChannelFilter.toLowerCase()}"]`
        : `[data-channel="all"]`;
      const el = channelStripRef.current.querySelector<HTMLElement>(selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedChannelFilter, activeTab]);

  return (
    <>
      {/* iOS Liquid Glass Top App Bar */}
      <header className="sticky top-0 z-30 w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl backdrop-saturate-200 border-b border-white/40 dark:border-white/10 transition-colors shadow-xs flex flex-col items-center">
        <div className="max-w-full w-full mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('search')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0 min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black flex items-center justify-center shadow-lg shadow-black/30 group-hover:scale-105 group-active:scale-95 transition-all ring-1 ring-white/20 shrink-0">
              <AppLogo size={32} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-sm sm:text-lg bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-800 dark:from-white dark:via-indigo-100 dark:to-gray-200 bg-clip-text text-transparent tracking-tight truncate">
                  Ai Music Stream
                </span>
                <span className="text-[9px] sm:text-[10px] font-black tracking-wider px-1.5 sm:px-2 py-0.5 bg-indigo-500/10 dark:bg-indigo-400/15 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center gap-1 border border-indigo-500/20 dark:border-indigo-400/20 backdrop-blur-md shrink-0">
                  <Sparkles size={10} /> Pro
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 font-semibold -mt-0.5 tracking-wide truncate max-w-[160px] sm:max-w-none">
                YouTube Audio & AI Music Stream
              </p>
            </div>
          </div>

          {/* Center Top Nav Links (Desktop View) */}
          <nav ref={topNavRef} className="hidden md:flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-gray-200/50 dark:border-white/10 backdrop-blur-md relative overflow-x-auto no-scrollbar scroll-smooth max-w-full">
            {/* 1. Search */}
            <button
              data-tab="search"
              onClick={() => setActiveTab('search')}
              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'search'
                  ? 'text-indigo-600 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {activeTab === 'search' && (
                <motion.div
                  layoutId="topNavPill"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-xs"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                <Search size={14} /> Search
              </span>
            </button>

            {/* 2. Subscriptions */}
            <button
              data-tab="subscriptions"
              onClick={() => setActiveTab('subscriptions')}
              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'subscriptions'
                  ? 'text-rose-600 dark:text-rose-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {activeTab === 'subscriptions' && (
                <motion.div
                  layoutId="topNavPill"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-xs"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                <div className="relative">
                  <Youtube size={14} className="text-rose-500" />
                  {selectedChannelFilter && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                  )}
                </div>
                <span>Subscriptions</span>
                {subscriptionsCount > 0 ? (
                  <span className="w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                    {subscriptionsCount}
                  </span>
                ) : (
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                )}
              </span>
            </button>

            {/* 3. Downloads */}
            <button
              data-tab="downloads"
              onClick={() => setActiveTab('downloads')}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'downloads'
                  ? 'text-indigo-600 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {activeTab === 'downloads' && (
                <motion.div
                  layoutId="topNavPill"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-xs"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                <Download size={14} /> Downloads
              </span>
            </button>

            {/* 4. Library */}
            <button
              data-tab="library"
              onClick={() => setActiveTab('library')}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'library'
                  ? 'text-indigo-600 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {activeTab === 'library' && (
                <motion.div
                  layoutId="topNavPill"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-xs"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                <Library size={14} /> Library
                {favoritesCount > 0 && (
                  <span className="w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                    {favoritesCount}
                  </span>
                )}
              </span>
            </button>

            {/* 5. Settings */}
            <button
              data-tab="settings"
              onClick={() => setActiveTab('settings')}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'settings'
                  ? 'text-indigo-600 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {activeTab === 'settings' && (
                <motion.div
                  layoutId="topNavPill"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-xs"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                <Settings size={14} /> Settings
              </span>
            </button>
          </nav>

          {/* Right Top Bar Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
            {!isOnline && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-500/15 dark:bg-amber-500/20 px-2 sm:px-2.5 py-1 rounded-full border border-amber-500/30 backdrop-blur-md animate-pulse shrink-0" title="You are currently offline. Local downloaded tracks will play seamlessly.">
                <WifiOff size={12} className="text-amber-500" />
                <span className="hidden sm:inline">Offline Mode</span>
              </span>
            )}

            {hasYouTubeKey && (
              <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/20 dark:border-emerald-500/30 backdrop-blur-md shrink-0">
                <Key size={11} /> Key Connected
              </span>
            )}

            {/* In-App WebView Browser Trigger */}
            {onOpenWebView && (
              <button
                onClick={() => onOpenWebView('https://m.youtube.com', 'In-App YouTube WebView')}
                className="w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded-2xl border border-indigo-500/25 shadow-xs backdrop-blur-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs font-bold shrink-0"
                title="Open In-App YouTube WebView Browser"
              >
                <Globe size={16} className="text-indigo-500 animate-pulse shrink-0" />
                <span className="hidden sm:inline">WebView</span>
              </button>
            )}

            {/* Native Android APK & Exporter Hub Button */}
            {onOpenAndroidModal && (
              <button
                onClick={onOpenAndroidModal}
                className="w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/25 shadow-xs backdrop-blur-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs font-bold shrink-0"
                title="Native Android APK & Flutter Code Exporter"
              >
                <Smartphone size={16} className="text-emerald-500 shrink-0" />
                <span className="hidden md:inline">Android APK</span>
              </button>
            )}

            {/* Share App Link Button */}
            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                className="w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs font-bold shrink-0"
                title="Use & Share Application Link"
              >
                <Share2 size={15} className="shrink-0" />
                <span className="hidden sm:inline">Use App</span>
              </button>
            )}

            {/* Cloud User Profile & Sign-In Quick Trigger */}
            {onOpenAuthModal && (
              <button
                id="navbar-auth-profile-btn"
                onClick={onOpenAuthModal}
                className={`px-2.5 py-1.5 rounded-2xl border backdrop-blur-xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold shrink-0 shadow-xs ${
                  user
                    ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-transparent shadow-indigo-500/20'
                }`}
                title={user ? `Signed in as ${user.displayName || user.email || 'Cloud User'}` : 'Sign in to sync library'}
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-5 h-5 rounded-full object-cover ring-1 ring-indigo-500" />
                ) : user ? (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    <User size={12} />
                  </div>
                ) : (
                  <LogIn size={14} className="text-white" />
                )}
                <span className="hidden sm:inline truncate max-w-[100px]">
                  {user ? (user.displayName?.split(' ')[0] || 'Account') : 'Sign In'}
                </span>
                {user && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
            )}

            {/* Glass Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-white/80 dark:bg-slate-800/80 text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 rounded-2xl border border-white/60 dark:border-white/10 shadow-xs backdrop-blur-xl transition-all active:scale-90"
              title="Toggle Theme"
            >
              {darkMode ? (
                <Sun key="sun" size={17} className="text-amber-400 theme-icon-animate" />
              ) : (
                <Moon key="moon" size={17} className="text-indigo-600 theme-icon-animate" />
              )}
            </button>
          </div>

        </div>
      </header>

      {/* iOS Liquid Glass Floating Bottom Navigation Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-4 pb-2.5 pt-1 pointer-events-none">
        <nav ref={bottomDockRef} className="max-w-lg mx-auto pointer-events-auto bg-white/80 dark:bg-slate-900/85 border border-white/60 dark:border-white/15 backdrop-blur-3xl backdrop-saturate-200 rounded-3xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex justify-between items-center transition-all ring-1 ring-black/5 dark:ring-white/10 overflow-x-auto no-scrollbar scroll-smooth">
          
          {/* 1. Search Tab */}
          <button
            data-tab="search"
            onClick={() => setActiveTab('search')}
            className={`relative flex flex-col items-center justify-center py-1 px-1.5 sm:px-2 rounded-2xl transition-all duration-300 shrink-0 ${
              activeTab === 'search'
                ? 'text-indigo-600 dark:text-indigo-300 font-black'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'
            }`}
          >
            <div className="px-2 py-0.5 rounded-full flex items-center justify-center relative">
              {activeTab === 'search' && (
                <motion.div
                  layoutId="dockActivePill"
                  className="absolute inset-0 bg-indigo-500/15 dark:bg-indigo-400/20 rounded-full border border-indigo-500/20 shadow-xs"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <Search size={17} className={`relative z-10 ${activeTab === 'search' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Search</span>
          </button>

          {/* 2. Subscriptions Tab */}
          <button
            data-tab="subscriptions"
            onClick={() => setActiveTab('subscriptions')}
            className={`relative flex flex-col items-center justify-center py-1 px-1.5 sm:px-2 rounded-2xl transition-all duration-300 shrink-0 ${
              activeTab === 'subscriptions'
                ? 'text-rose-600 dark:text-rose-300 font-black'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'
            }`}
          >
            <div className="px-2 py-0.5 rounded-full flex items-center justify-center relative">
              {activeTab === 'subscriptions' && (
                <motion.div
                  layoutId="dockActivePill"
                  className="absolute inset-0 bg-rose-500/15 dark:bg-rose-400/20 rounded-full border border-rose-500/20 shadow-xs"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <Youtube size={17} className={`relative z-10 ${activeTab === 'subscriptions' ? 'stroke-[2.5px] text-rose-500' : 'stroke-2'}`} />
              {subscriptionsCount > 0 ? (
                <span className="absolute -top-1 -right-1 z-20 w-3.5 h-3.5 bg-rose-600 text-white rounded-full text-[8px] font-black flex items-center justify-center shadow-xs border border-white dark:border-slate-900">
                  {subscriptionsCount}
                </span>
              ) : (
                <span className="absolute -top-0.5 -right-0.5 z-20 w-2 h-2 bg-rose-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900" />
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Subscriptions</span>
          </button>

          {/* 3. Downloads Tab */}
          <button
            data-tab="downloads"
            onClick={() => setActiveTab('downloads')}
            className={`relative flex flex-col items-center justify-center py-1 px-1.5 sm:px-2 rounded-2xl transition-all duration-300 shrink-0 ${
              activeTab === 'downloads'
                ? 'text-indigo-600 dark:text-indigo-300 font-black'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'
            }`}
          >
            <div className="px-2 py-0.5 rounded-full flex items-center justify-center relative">
              {activeTab === 'downloads' && (
                <motion.div
                  layoutId="dockActivePill"
                  className="absolute inset-0 bg-indigo-500/15 dark:bg-indigo-400/20 rounded-full border border-indigo-500/20 shadow-xs"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <Download size={17} className={`relative z-10 ${activeTab === 'downloads' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Downloads</span>
          </button>

          {/* 4. Library Tab */}
          <button
            data-tab="library"
            onClick={() => setActiveTab('library')}
            className={`relative flex flex-col items-center justify-center py-1 px-1.5 sm:px-2 rounded-2xl transition-all duration-300 shrink-0 ${
              activeTab === 'library'
                ? 'text-indigo-600 dark:text-indigo-300 font-black'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'
            }`}
          >
            <div className="px-2 py-0.5 rounded-full flex items-center justify-center relative">
              {activeTab === 'library' && (
                <motion.div
                  layoutId="dockActivePill"
                  className="absolute inset-0 bg-indigo-500/15 dark:bg-indigo-400/20 rounded-full border border-indigo-500/20 shadow-xs"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <Library size={17} className={`relative z-10 ${activeTab === 'library' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 z-20 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[8px] font-black flex items-center justify-center shadow-xs border border-white/50">
                  {favoritesCount}
                </span>
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Library</span>
          </button>

          {/* 5. Settings Tab */}
          <button
            data-tab="settings"
            onClick={() => setActiveTab('settings')}
            className={`relative flex flex-col items-center justify-center py-1 px-1.5 sm:px-2 rounded-2xl transition-all duration-300 shrink-0 ${
              activeTab === 'settings'
                ? 'text-indigo-600 dark:text-indigo-300 font-black'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'
            }`}
          >
            <div className="px-2 py-0.5 rounded-full flex items-center justify-center relative">
              {activeTab === 'settings' && (
                <motion.div
                  layoutId="dockActivePill"
                  className="absolute inset-0 bg-indigo-500/15 dark:bg-indigo-400/20 rounded-full border border-indigo-500/20 shadow-xs"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <Settings size={17} className={`relative z-10 ${activeTab === 'settings' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Settings</span>
          </button>
        </nav>
      </div>
    </>
  );
};


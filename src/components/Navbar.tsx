import React from 'react';
import { 
  Home, 
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
  Download
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { TabType, SubscribedChannel } from '../types';

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
  onOpenShareModal
}) => {
  return (
    <>
      {/* iOS Liquid Glass Top App Bar with Subscriptions Navigation Strip */}
      <header className="sticky top-0 z-30 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl backdrop-saturate-200 border-b border-white/40 dark:border-white/10 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 group-active:scale-95 transition-all ring-1 ring-white/30">
              <Radio size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-800 dark:from-white dark:via-indigo-100 dark:to-gray-200 bg-clip-text text-transparent tracking-tight">
                  Ai Music Stream
                </span>
                <span className="text-[10px] font-black tracking-wider px-2.5 py-0.5 bg-indigo-500/10 dark:bg-indigo-400/15 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center gap-1 border border-indigo-500/20 dark:border-indigo-400/20 backdrop-blur-md">
                  <Sparkles size={10} /> Pro
                </span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold -mt-0.5 tracking-wide">
                YouTube Audio & AI Music Stream
              </p>
            </div>
          </div>

          {/* Center Top Nav Links (Desktop View) */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-gray-200/50 dark:border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'home'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Home size={14} /> Home
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                activeTab === 'subscriptions'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
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
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'search'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Search size={14} /> Search
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                activeTab === 'library'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Library size={14} /> Library
              {favoritesCount > 0 && (
                <span className="w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                  {favoritesCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('downloads')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'downloads'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Download size={14} /> Downloads
            </button>

            {/* Settings Tab */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Settings size={14} /> Settings
            </button>

            {/* Profile Tab in Nav Bar */}
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-4 h-4 rounded-full object-cover ring-1 ring-emerald-500" />
                ) : (
                  <User size={14} className={user ? "text-emerald-500" : ""} />
                )}
                <span>{user ? (user.displayName?.split(' ')[0] || 'Profile') : 'Profile'}</span>
              </button>
            )}
          </nav>

          {/* Right Top Bar Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {hasYouTubeKey && (
              <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/20 dark:border-emerald-500/30 backdrop-blur-md">
                <Key size={11} /> Key Connected
              </span>
            )}

            {/* YouTube Channel Subscriptions Manager Quick Trigger */}
            {onOpenSubscriptionsModal && (
              <button
                onClick={onOpenSubscriptionsModal}
                className="relative px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 rounded-2xl border border-rose-500/25 shadow-xs backdrop-blur-xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                title="Manage Subscribed YouTube Channels"
              >
                <Youtube size={16} className="text-rose-500" />
                <span className="hidden sm:inline">Channels</span>
                {subscriptionsCount > 0 ? (
                  <span className="w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                    {subscriptionsCount}
                  </span>
                ) : (
                  <Plus size={12} className="text-rose-500" />
                )}
              </button>
            )}

            {/* User Profile / Auth Modal Trigger in Top Header */}
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className={`px-2.5 py-1.5 rounded-2xl border backdrop-blur-xl transition-all active:scale-95 flex items-center gap-2 text-xs font-bold shadow-xs ${
                  user
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/25'
                }`}
                title={user ? `Profile: ${user.email}` : 'Sign in to Profile'}
              >
                <div className="relative flex items-center justify-center shrink-0">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="User Avatar" className="w-5 h-5 rounded-full object-cover ring-2 ring-emerald-500 shadow-xs" />
                  ) : (
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${user ? 'bg-emerald-600' : 'bg-gradient-to-tr from-indigo-600 to-purple-600'}`}>
                      <User size={12} />
                    </div>
                  )}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${
                    user ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`} />
                </div>
                <span className="hidden sm:inline font-bold">
                  {user ? (user.displayName?.split(' ')[0] || 'Profile') : 'Sign In'}
                </span>
              </button>
            )}

            {/* Share App Link Button */}
            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold shrink-0"
                title="Use & Share Application Link"
              >
                <Share2 size={15} />
                <span className="hidden sm:inline">Use App</span>
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

        {/* Real-time Original YouTube Channels Navbar Strip */}
        {subscriptions.length > 0 && (
          <div className="bg-rose-500/5 dark:bg-rose-500/10 border-t border-rose-500/15 py-1.5 px-4 overflow-x-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto flex items-center gap-2.5">
              <span className="text-[10px] font-black text-rose-600 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Youtube size={14} className="text-rose-500" /> Subscriptions:
              </span>

              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5">
                {/* All Feed reset chip */}
                <button
                  onClick={() => {
                    if (setSelectedChannelFilter) setSelectedChannelFilter(null);
                    setActiveTab('subscriptions');
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 shrink-0 ${
                    activeTab === 'subscriptions' && !selectedChannelFilter
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white/80 dark:bg-slate-800/80 text-gray-700 dark:text-gray-300 hover:bg-rose-500/20'
                  }`}
                >
                  <Radio size={12} /> All Streams
                </button>

                {/* Subscribed Channel Avatars Bar */}
                {subscriptions.map((ch) => {
                  const isSelected = activeTab === 'subscriptions' && selectedChannelFilter?.toLowerCase() === ch.name.toLowerCase();
                  return (
                    <button
                      key={`nav-strip-${ch.id}`}
                      onClick={() => {
                        if (setSelectedChannelFilter) setSelectedChannelFilter(ch.name);
                        setActiveTab('subscriptions');
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 border ${
                        isSelected
                          ? 'bg-rose-500/20 dark:bg-rose-400/25 text-rose-600 dark:text-rose-300 border-rose-500/30 shadow-xs'
                          : 'bg-white/70 dark:bg-slate-800/70 text-gray-700 dark:text-gray-300 border-gray-200/50 dark:border-white/10 hover:border-rose-400/40'
                      }`}
                      title={`View ${ch.name} streams`}
                    >
                      <img 
                        src={ch.avatar} 
                        alt={ch.name}
                        className="w-4 h-4 rounded-full object-cover shrink-0 ring-1 ring-rose-500/30"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                        }}
                      />
                      <span className="truncate max-w-[100px]">{ch.name}</span>
                    </button>
                  );
                })}

                {/* Quick Add Channel (+) button */}
                {onOpenSubscriptionsModal && (
                  <button
                    onClick={onOpenSubscriptionsModal}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 rounded-xl border border-rose-500/20 transition-all shrink-0"
                    title="Search & Subscribe to new channel"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* iOS Liquid Glass Floating Bottom Navigation Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-4 pb-2.5 pt-1 pointer-events-none">
        <nav className="max-w-lg mx-auto pointer-events-auto bg-white/80 dark:bg-slate-900/85 border border-white/60 dark:border-white/15 backdrop-blur-3xl backdrop-saturate-200 rounded-3xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex justify-between items-center transition-all ring-1 ring-black/5 dark:ring-white/10">
          
          {/* Home Tab */}
          <button
            onClick={() => setActiveTab('home')}
            className={`relative flex flex-col items-center justify-center py-1 px-1.5 sm:px-2.5 rounded-2xl transition-all duration-300 ${
              activeTab === 'home'
                ? 'text-indigo-600 dark:text-indigo-300 font-black'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'
            }`}
          >
            <div className={`px-2 py-0.5 rounded-full transition-all duration-300 flex items-center justify-center ${
              activeTab === 'home' ? 'bg-indigo-500/15 dark:bg-indigo-400/20 shadow-xs scale-105 border border-indigo-500/20' : 'bg-transparent'
            }`}>
              <Home size={17} className={activeTab === 'home' ? 'stroke-[2.5px]' : 'stroke-2'} />
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Home</span>
          </button>

          {/* Subscriptions Tab */}
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`relative flex flex-col items-center justify-center py-1 px-1.5 sm:px-2.5 rounded-2xl transition-all duration-300 ${
              activeTab === 'subscriptions'
                ? 'text-rose-600 dark:text-rose-300 font-black'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'
            }`}
          >
            <div className={`px-2 py-0.5 rounded-full transition-all duration-300 flex items-center justify-center relative ${
              activeTab === 'subscriptions' ? 'bg-rose-500/15 dark:bg-rose-400/20 shadow-xs scale-105 border border-rose-500/20' : 'bg-transparent'
            }`}>
              <Youtube size={17} className={activeTab === 'subscriptions' ? 'stroke-[2.5px] text-rose-500' : 'stroke-2'} />
              {subscriptionsCount > 0 ? (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 text-white rounded-full text-[8px] font-black flex items-center justify-center shadow-xs border border-white dark:border-slate-900">
                  {subscriptionsCount}
                </span>
              ) : (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900" />
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Subs</span>
          </button>

          {/* Search Tab */}
          <button
            onClick={() => setActiveTab('search')}
            className={`relative flex flex-col items-center justify-center py-1 px-1.5 sm:px-2.5 rounded-2xl transition-all duration-300 ${
              activeTab === 'search'
                ? 'text-indigo-600 dark:text-indigo-300 font-black'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'
            }`}
          >
            <div className={`px-2 py-0.5 rounded-full transition-all duration-300 flex items-center justify-center ${
              activeTab === 'search' ? 'bg-indigo-500/15 dark:bg-indigo-400/20 shadow-xs scale-105 border border-indigo-500/20' : 'bg-transparent'
            }`}>
              <Search size={17} className={activeTab === 'search' ? 'stroke-[2.5px]' : 'stroke-2'} />
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Search</span>
          </button>

          {/* Library Tab */}
          <button
            onClick={() => setActiveTab('library')}
            className={`relative flex flex-col items-center justify-center py-1 px-1.5 sm:px-2.5 rounded-2xl transition-all duration-300 ${
              activeTab === 'library'
                ? 'text-indigo-600 dark:text-indigo-300 font-black'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'
            }`}
          >
            <div className={`px-2 py-0.5 rounded-full transition-all duration-300 flex items-center justify-center relative ${
              activeTab === 'library' ? 'bg-indigo-500/15 dark:bg-indigo-400/20 shadow-xs scale-105 border border-indigo-500/20' : 'bg-transparent'
            }`}>
              <Library size={17} className={activeTab === 'library' ? 'stroke-[2.5px]' : 'stroke-2'} />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[8px] font-black flex items-center justify-center shadow-xs border border-white/50">
                  {favoritesCount}
                </span>
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Library</span>
          </button>

          {/* Downloads Tab */}
          <button
            onClick={() => setActiveTab('downloads')}
            className={`relative flex flex-col items-center justify-center py-1 px-1.5 sm:px-2.5 rounded-2xl transition-all duration-300 ${
              activeTab === 'downloads'
                ? 'text-indigo-600 dark:text-indigo-300 font-black'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'
            }`}
          >
            <div className={`px-2 py-0.5 rounded-full transition-all duration-300 flex items-center justify-center relative ${
              activeTab === 'downloads' ? 'bg-indigo-500/15 dark:bg-indigo-400/20 shadow-xs scale-105 border border-indigo-500/20' : 'bg-transparent'
            }`}>
              <Download size={17} className={activeTab === 'downloads' ? 'stroke-[2.5px]' : 'stroke-2'} />
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 whitespace-nowrap">DLs</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`relative flex flex-col items-center justify-center py-1 px-1.5 sm:px-2.5 rounded-2xl transition-all duration-300 ${
              activeTab === 'settings'
                ? 'text-indigo-600 dark:text-indigo-300 font-black'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'
            }`}
          >
            <div className={`px-2 py-0.5 rounded-full transition-all duration-300 flex items-center justify-center relative ${
              activeTab === 'settings' ? 'bg-indigo-500/15 dark:bg-indigo-400/20 shadow-xs scale-105 border border-indigo-500/20' : 'bg-transparent'
            }`}>
              <Settings size={17} className={activeTab === 'settings' ? 'stroke-[2.5px]' : 'stroke-2'} />
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Settings</span>
          </button>

          {/* Profile Tab in Bottom Nav Dock */}
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="relative flex flex-col items-center justify-center py-1 px-1.5 sm:px-2.5 rounded-2xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold transition-all duration-300"
            >
              <div className="px-2 py-0.5 rounded-full transition-all duration-300 flex items-center justify-center relative bg-transparent">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User Avatar" className="w-4 h-4 rounded-full object-cover ring-2 ring-emerald-500 shadow-xs" />
                ) : (
                  <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-white shadow-xs ${user ? 'bg-emerald-600' : 'bg-gradient-to-tr from-indigo-600 to-purple-600'}`}>
                    <User size={12} />
                  </div>
                )}
                <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${
                  user ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`} />
              </div>
              <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {user ? (user.displayName?.split(' ')[0] || 'Profile') : 'Profile'}
              </span>
            </button>
          )}

        </nav>
      </div>
    </>
  );
};


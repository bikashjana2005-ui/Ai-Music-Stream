import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Settings, 
  User as UserIcon,
  SquarePlay,
  Sun,
  Moon,
  Bell,
  Sparkles,
  Tv,
  Cast,
  Share2
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { TabType, SubscribedChannel, Track } from '../types';
import { AppLogo } from './AppLogo';
import { JanmashtamiHeaderBadge } from './JanmashtamiEffect';
import { LaxmiPujaHeaderBadge } from './LaxmiPujaEffect';
import { isDurgaPujaActive, isLaxmiPujaActive } from '../utils/festivalUtils';

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
  onOpenNotifications?: () => void;
  onOpenCreateModal?: () => void;
  onOpenShareModal?: () => void;
  onOpenWebView?: (url?: string, title?: string) => void;
  onOpenAndroidModal?: () => void;
  onOpenJanmashtamiModal?: () => void;
  onOpenLaxmiPujaModal?: () => void;
  isDataSaverMode?: boolean;
  onToggleDataSaverMode?: (enabled: boolean) => void;
  isOnline?: boolean;
  userName?: string;
  currentTrack?: Track | null;
  onToggleMiniPlayer?: () => void;
  hasLastPlayedVideo?: boolean;
}

const DurgaPujaHeaderBadge: React.FC = () => {
  const [active, setActive] = useState<boolean>(false);

  useEffect(() => {
    setActive(isDurgaPujaActive());
  }, []);

  if (!active) return null;

  return (
    <div 
      className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-gradient-to-r from-red-950/80 via-amber-950/70 to-rose-950/80 border border-amber-400/40 text-amber-300 hover:text-white shadow-xs cursor-pointer select-none transition-all active:scale-95 duration-75 shrink-0"
      title="Durga Puja Sharodotsav"
    >
      <span className="text-[11px] sm:text-xs">🪔</span>
      <span className="text-[10px] sm:text-[11px] font-black tracking-tight bg-gradient-to-r from-amber-200 via-amber-300 to-rose-300 bg-clip-text text-transparent">
        Durga Puja
      </span>
    </div>
  );
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  favoritesCount,
  subscriptionsCount = 0,
  user,
  onOpenAuthModal,
  onOpenNotifications,
  onOpenShareModal,
  onOpenJanmashtamiModal,
  userName,
  onToggleMiniPlayer,
  hasLastPlayedVideo = false,
  onOpenLaxmiPujaModal,
}) => {
  const displayName = user?.displayName || userName || (user?.email ? user.email.split('@')[0] : 'Bikash Jana');
  const initialLetter = (displayName.trim()[0] || 'B').toUpperCase();
  const isLaxmiPuja = isLaxmiPujaActive();

  // Rock-solid stable header visibility without scroll jitter
  const isHeaderVisible = true;
  const [isCasting, setIsCasting] = useState<boolean>(false);

  const handleCastClick = () => {
    setIsCasting(true);
    setTimeout(() => {
      setIsCasting(false);
    }, 2500);
  };

  // Navigation tabs (Subscriptions, Search, You, Settings)
  const navTabs = [
    { 
      id: 'subscriptions' as TabType, 
      label: 'Subscriptions', 
      icon: SquarePlay, 
      badge: subscriptionsCount > 0 ? (subscriptionsCount > 9 ? '9+' : subscriptionsCount) : null 
    },
    { 
      id: 'search' as TabType, 
      label: 'Search', 
      icon: Search, 
      badge: null 
    },
    { 
      id: 'library' as TabType, 
      label: 'You', 
      icon: UserIcon, 
      isUserTab: true,
      badge: favoritesCount > 0 ? (favoritesCount > 9 ? '9+' : favoritesCount) : null 
    },
    { 
      id: 'settings' as TabType, 
      label: 'Settings', 
      icon: Settings, 
      badge: null 
    },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR: Flush, Non-Overlying Edge-to-Edge Navigation Bar       */}
      {/* ========================================================================= */}
      <div className={`sticky top-0 z-40 w-full ios-glass-header select-none transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu will-change-transform ${
        isLaxmiPuja 
          ? 'border-b border-amber-500/40 dark:border-amber-400/30 shadow-[0_4px_20px_rgba(245,158,11,0.12)]' 
          : ''
      } ${
        isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <header className="w-full max-w-7xl mx-auto h-14 px-3 sm:px-6 flex items-center justify-between gap-2">
          <div className="w-full flex items-center justify-between gap-2">
          
          {/* Left: Brand Identity + Festival Badge in one smooth horizontal flex group */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div 
              onClick={() => setActiveTab('subscriptions')}
              className="flex items-center gap-2 cursor-pointer group shrink-0 active:scale-95 transition-transform"
              title="Ai Music Stream"
            >
              <div className="relative">
                <AppLogo size={28} className="transition-transform group-hover:scale-105 shrink-0" glow={true} />
                {isLaxmiPuja && (
                  <span className="absolute -top-1 -right-1 text-[10px] animate-pulse pointer-events-none">✨</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-black text-sm sm:text-lg tracking-tight bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 bg-clip-text text-transparent truncate drop-shadow-xs">
                  Ai Music Stream
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-md text-[9px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 shrink-0">
                  PRO
                </span>
              </div>
            </div>

            {/* Festival Badges cleanly tucked next to brand without covering anything */}
            <div className="hidden xs:flex items-center gap-1.5 shrink-0">
              <LaxmiPujaHeaderBadge onClick={onOpenLaxmiPujaModal} />
              <DurgaPujaHeaderBadge />
              <JanmashtamiHeaderBadge onOpenModal={onOpenJanmashtamiModal} />
            </div>
          </div>

          {/* Right: Quick Action Controls matching YouTube Mobile Header */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Show Last Played Video in Mini Player Button */}
            {onToggleMiniPlayer && hasLastPlayedVideo && (
              <button
                type="button"
                onClick={onToggleMiniPlayer}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl ios-glass-pill ${
                  isLaxmiPuja 
                    ? 'text-amber-400 border border-amber-400/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]' 
                    : 'text-rose-600 dark:text-rose-400'
                } text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs`}
                title="Show Last Played Video in Mini Player"
              >
                <Tv size={14} className={`${isLaxmiPuja ? 'text-amber-400' : 'text-rose-500'} animate-pulse shrink-0`} />
                <span className="text-[11px] hidden sm:inline">Mini Player</span>
              </button>
            )}

            {/* YouTube Mobile Cast to TV Button */}
            <button
              type="button"
              onClick={handleCastClick}
              className={`w-9 h-9 rounded-xl ios-glass-button flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                isLaxmiPuja ? 'border border-amber-400/20 hover:border-amber-400/50' : ''
              } ${
                isCasting ? 'text-amber-500 ring-2 ring-amber-500/40 bg-amber-500/10' : 'text-slate-700 dark:text-zinc-200'
              }`}
              title="Cast to TV / Chromecast"
            >
              <Cast size={17} className={isCasting ? 'animate-pulse text-amber-500' : ''} />
            </button>

            {/* Quick Search Button (visible when not on search tab) */}
            {activeTab !== 'search' && (
              <button
                type="button"
                onClick={() => setActiveTab('search')}
                className={`w-9 h-9 rounded-xl ios-glass-button flex items-center justify-center text-slate-700 dark:text-zinc-200 transition-all cursor-pointer active:scale-90 ${
                  isLaxmiPuja ? 'border border-amber-400/20 hover:border-amber-400/50' : ''
                }`}
                title="Search Music & Videos"
              >
                <Search size={17} />
              </button>
            )}

            {/* Notification Bell */}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className={`w-9 h-9 rounded-xl ios-glass-button flex items-center justify-center text-slate-700 dark:text-zinc-200 transition-all cursor-pointer relative active:scale-90 ${
                  isLaxmiPuja ? 'border border-amber-400/20 hover:border-amber-400/50' : ''
                }`}
                title="Notifications"
              >
                <Bell size={17} />
                <span className={`absolute top-2 right-2 w-2 h-2 rounded-xs ${
                  isLaxmiPuja ? 'bg-amber-400' : 'bg-rose-500'
                } ring-2 ring-white dark:ring-zinc-900 animate-pulse`} />
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className={`w-9 h-9 rounded-xl ios-glass-button flex items-center justify-center text-slate-700 dark:text-zinc-200 transition-all cursor-pointer active:scale-90 ${
                isLaxmiPuja ? 'border border-amber-400/20 hover:border-amber-400/50' : ''
              }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>

            {/* Live Deployment & Sharing Modal */}
            {onOpenShareModal && (
              <button
                type="button"
                onClick={onOpenShareModal}
                className={`w-9 h-9 rounded-xl ios-glass-button flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:text-amber-400 transition-all cursor-pointer active:scale-90 ${
                  isLaxmiPuja ? 'border border-amber-400/20 hover:border-amber-400/50' : ''
                }`}
                title="Deployment Status & Live Link"
              >
                <Share2 size={17} />
              </button>
            )}

            {/* User Avatar - Rounded-xl without circle part */}
            <button
              type="button"
              onClick={() => {
                if (onOpenAuthModal && !user) onOpenAuthModal();
                else setActiveTab('library');
              }}
              className={`w-8 h-8 rounded-xl ${
                isLaxmiPuja 
                  ? 'bg-gradient-to-tr from-amber-600 via-yellow-500 to-rose-600 ring-2 ring-amber-300/40 shadow-[0_0_12px_rgba(245,158,11,0.4)]' 
                  : 'bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 ring-2 ring-white/40 dark:ring-white/20 shadow-md'
              } text-white flex items-center justify-center text-xs font-black cursor-pointer active:scale-90 transition-transform shrink-0`}
              title={user ? `Signed in as ${displayName}` : 'Sign In'}
            >
              {initialLetter}
            </button>
          </div>
        </div>
      </header>
    </div>

      {/* ========================================================================= */}
      {/* 2. AUTHENTIC FIXED BOTTOM NAVIGATION BAR / DOCK BAR (iOS Liquid Glass)    */}
      {/* ========================================================================= */}
      <div className={`fixed bottom-0 left-0 right-0 inset-x-0 w-full z-50 pointer-events-auto select-none ios-glass-dock pb-[env(safe-area-inset-bottom)] ${
        isLaxmiPuja 
          ? 'border-t border-amber-400/50 dark:border-amber-400/40 shadow-[0_-4px_28px_rgba(245,158,11,0.22)]' 
          : 'border-t border-white/40 dark:border-white/15'
      }`}>
        {/* Sacred Festive Golden Light Trim Line on Dock Bar */}
        {isLaxmiPuja && (
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-85 animate-pulse pointer-events-none" />
        )}

        <nav 
          role="tablist"
          aria-label="Bottom Navigation" 
          className="w-full max-w-lg mx-auto h-[54px] sm:h-[58px] px-2 sm:px-4 flex items-center justify-around"
        >
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={`bottom-nav-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 h-full mx-0.5 rounded-xl flex flex-col items-center justify-center relative cursor-pointer group transition-all duration-150 active:scale-95 ${
                  isActive 
                    ? (isLaxmiPuja 
                        ? 'text-amber-500 dark:text-amber-400 font-bold drop-shadow-[0_0_8px_rgba(245,158,11,0.45)]' 
                        : 'text-rose-600 dark:text-rose-400 font-bold') 
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium'
                }`}
                title={tab.label}
              >
                {/* Active Indicator Bar on top */}
                {isActive && (
                  <span className={`absolute top-0 w-8 h-[2.5px] rounded-xs ${
                    isLaxmiPuja 
                      ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.95)]' 
                      : 'bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 shadow-[0_0_10px_rgba(244,63,94,0.9)]'
                  }`} />
                )}

                {/* Icon Wrapper with Badge */}
                <div className="relative flex items-center justify-center mt-0.5">
                  {tab.isUserTab ? (
                    <div className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
                      isActive 
                        ? (isLaxmiPuja 
                            ? 'ring-2 ring-yellow-400 bg-gradient-to-tr from-amber-600 to-yellow-500 text-white shadow-[0_0_8px_rgba(245,158,11,0.5)] scale-105' 
                            : 'ring-2 ring-rose-500 bg-rose-600 text-white shadow-xs scale-105') 
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/10 dark:border-white/20'
                    }`}>
                      {initialLetter}
                    </div>
                  ) : Icon ? (
                    <Icon 
                      size={20} 
                      className={`transition-transform duration-150 ${
                        isActive 
                          ? (isLaxmiPuja 
                              ? 'text-amber-500 dark:text-amber-400 stroke-[2.4px] scale-105 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]' 
                              : 'text-rose-600 dark:text-rose-400 stroke-[2.4px] scale-105') 
                          : 'stroke-[1.8px] group-hover:scale-105'
                      }`} 
                    />
                  ) : null}

                  {/* Notification / Count Badge */}
                  {tab.badge !== null && (
                    <span className={`absolute -top-1.5 -right-2.5 px-1 min-w-[15px] h-3.5 flex items-center justify-center rounded-md ${
                      isLaxmiPuja ? 'bg-gradient-to-r from-amber-600 to-red-600 border-amber-300/40' : 'bg-rose-600 border-white dark:border-zinc-900'
                    } text-white text-[8.5px] font-black leading-none shadow-xs border`}>
                      {tab.badge}
                    </span>
                  )}
                </div>

                {/* Label text matching authentic mobile typography */}
                <span className={`text-[10px] tracking-tight mt-0.5 transition-colors ${
                  isActive 
                    ? (isLaxmiPuja ? 'font-bold text-amber-500 dark:text-amber-400' : 'font-bold text-rose-600 dark:text-rose-400') 
                    : 'text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};


import React from 'react';
import { 
  Home,
  Search, 
  Download, 
  Settings, 
  Moon, 
  Sun, 
  Globe, 
  Smartphone, 
  Zap, 
  Share2, 
  User as UserIcon,
  Cast,
  SquarePlay,
  Tv2
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { TabType, SubscribedChannel } from '../types';
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
  onOpenNotifications?: () => void;
  onOpenCreateModal?: () => void;
  onOpenShareModal?: () => void;
  onOpenWebView?: (url?: string, title?: string) => void;
  onOpenAndroidModal?: () => void;
  isDataSaverMode?: boolean;
  onToggleDataSaverMode?: (enabled: boolean) => void;
  isOnline?: boolean;
  userName?: string;
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
  selectedChannelFilter = null,
  setSelectedChannelFilter,
  onOpenSubscriptionsModal,
  user,
  onOpenAuthModal,
  onOpenShareModal,
  onOpenWebView,
  onOpenAndroidModal,
  isDataSaverMode = false,
  onToggleDataSaverMode,
  userName
}) => {
  const displayName = user?.displayName || userName || (user?.email ? user.email.split('@')[0] : 'Bikash Jana');
  const initialLetter = (displayName.trim()[0] || 'B').toUpperCase();
  const avatarPhoto = user?.photoURL;

  // Core Navigation Tabs with Settings integrated (Home tab removed per user request)
  const navItems = [
    { id: 'search' as TabType, label: 'Search', icon: Search, badge: null },
    { 
      id: 'subscriptions' as TabType, 
      label: 'Subscriptions', 
      icon: SquarePlay, 
      badge: subscriptionsCount > 0 ? subscriptionsCount : null 
    },
    { id: 'downloads' as TabType, label: 'Downloads', icon: Download, badge: null },
    { 
      id: 'library' as TabType, 
      label: 'You', 
      icon: UserIcon, 
      badge: favoritesCount > 0 ? favoritesCount : null,
      isUserTab: true 
    },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <>
      {/* Top Desktop & Mobile Header Bar with Centered App Name: Ai Music Stream */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-md border-b border-gray-200 dark:border-white/10 transition-colors shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-15 relative flex items-center justify-center">
          
          {/* Centered Brand Identity: Ai Music Stream */}
          <div 
            onClick={() => setActiveTab('search')}
            className="flex items-center justify-center gap-2 sm:gap-2.5 cursor-pointer select-none group"
            title="Ai Music Stream"
          >
            <AppLogo size={32} className="transition-transform group-hover:scale-105 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base sm:text-xl tracking-tight bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                Ai Music Stream
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                PRO
              </span>
            </div>
          </div>

          {/* Desktop Center Navigation Bar */}
          <nav className="hidden md:flex absolute right-4 lg:right-6 items-center gap-1 lg:gap-1.5 bg-gray-100 dark:bg-white/5 p-1 rounded-full border border-gray-200 dark:border-white/10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-red-600/20 text-red-500'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

        </div>
      </header>

      {/* Mobile Bottom Navigation Dock (Home, Search, Subscriptions, Downloads, You, Settings) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-lg border-t border-gray-200 dark:border-white/10 select-none pb-safe">
        <nav className="w-full max-w-lg mx-auto h-13.5 px-1 flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isYouTab = item.id === 'library';

            return (
              <button
                key={`mobile-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-red-600 dark:text-red-500 font-bold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {isYouTab ? (
                    <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                      isActive 
                        ? 'bg-gradient-to-tr from-pink-600 to-red-600 text-white ring-2 ring-red-500 ring-offset-1 ring-offset-[#0f0f0f]' 
                        : 'bg-gradient-to-tr from-pink-600/80 to-red-600/80 text-white'
                    }`}>
                      {initialLetter}
                    </div>
                  ) : (
                    <Icon size={19} className={isActive ? 'stroke-[2.4px]' : 'stroke-[1.8px]'} />
                  )}
                  {item.badge !== null && (
                    <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};

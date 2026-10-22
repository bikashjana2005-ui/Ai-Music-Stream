import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, testFirebaseConnection, handleFirestoreError, OperationType, fetchYouTubeUserSubscriptions, fetchYouTubeChannelProfile, fetchYouTubeUserPlaylists, fetchYouTubeLikedVideos, fetchYouTubeWatchHistory, fetchYouTubeSyncAll, loginAnonymously, getConnectedYouTubeEmail, getYouTubeAccessToken, getTargetYouTubeEmail } from './lib/firebase';
import { TabType, Track, Playlist, SubscribedChannel, DownloadedTrack, YouTubeChannelProfile, PlayerEngine } from './types';
import { DEFAULT_TRACKS, DEFAULT_CHANNELS, DEFAULT_LIKED_TRACKS, DEFAULT_HISTORY_TRACKS } from './data/fallbackTracks';
import { Navbar } from './components/Navbar';
import { DownloadModal } from './components/DownloadModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { ShareAppModal } from './components/ShareAppModal';
import { ChannelSubscriptionsModal } from './components/ChannelSubscriptionsModal';
import { ChannelDetailsModal } from './components/ChannelDetailsModal';
import { UserAuthModal } from './components/UserAuthModal';
import { YouTubeMetadataModal } from './components/YouTubeMetadataModal';
import { YouTubeMobileConnectModal } from './components/YouTubeMobileConnectModal';
import { Toast } from './components/Toast';
import { SubscriptionsView } from './views/SubscriptionsView';
import { SearchView } from './views/SearchView';
import { LibraryView } from './views/LibraryView';
import { SettingsView } from './views/SettingsView';
import { DownloadsView } from './views/DownloadsView';
import { SplashScreen } from './components/SplashScreen';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { InAppWebViewModal } from './components/InAppWebViewModal';
import { AndroidNativeExporterModal } from './components/AndroidNativeExporterModal';
import { NotificationsModal } from './components/NotificationsModal';
import { CreateActionModal } from './components/CreateActionModal';
import { VideoQualitySelectorModal, QualityOptionId } from './components/VideoQualitySelectorModal';
import { GlobalYouTubePlayer } from './components/GlobalYouTubePlayer';
import { VideoMiniPlayer } from './components/VideoMiniPlayer';
import { YouTubeStandardWebPlayer } from './components/YouTubeStandardWebPlayer';
import { MobileAuthModal } from './components/MobileAuthModal';
import { applyAccentTheme } from './utils/accentTheme';
import { JanmashtamiParticles, JanmashtamiModal } from './components/JanmashtamiEffect';
import { LaxmiPujaParticles, LaxmiPujaModal } from './components/LaxmiPujaEffect';
import { isJanmashtamiActive } from './utils/janmashtami';
import { extractYouTubeId, isTrackLiked } from './utils/youtube';
import { getChannelAvatar } from './utils/channelLogos';
import { Play, Tv, Maximize2 } from 'lucide-react';

const TAB_ORDER: TabType[] = ['subscriptions', 'search', 'library', 'settings', 'downloads'];

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [showMobileAuth, setShowMobileAuth] = useState<boolean>(false);
  const [mobileAuthUser, setMobileAuthUser] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('aura_mobile_auth');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const handleCompleteSplash = useCallback(() => {
    setShowSplash(false);
    // User instruction: Always do not show the login screen
    setShowMobileAuth(false);
    setIsAuthModalOpen(false);
  }, []);
  const [pendingQualityTrack, setPendingQualityTrack] = useState<Track | null>(null);
  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    try {
      const saved = localStorage.getItem('aura_ai_last_active_tab');
      if (saved && ['subscriptions', 'search', 'library', 'settings', 'downloads'].includes(saved)) {
        return saved as TabType;
      }
      return 'subscriptions';
    } catch {
      return 'subscriptions';
    }
  });
  const [tabDirection, setTabDirection] = useState<number>(1);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isJanmashtamiModalOpen, setIsJanmashtamiModalOpen] = useState<boolean>(false);
  const [janmashtamiParticlesEnabled, setJanmashtamiParticlesEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aura_janmashtami_particles') !== 'false';
    } catch {
      return true;
    }
  });
  const [isLaxmiPujaModalOpen, setIsLaxmiPujaModalOpen] = useState<boolean>(false);
  const [laxmiPujaParticlesEnabled, setLaxmiPujaParticlesEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aura_laxmi_particles') !== 'false';
    } catch {
      return true;
    }
  });

  // Tab Navigation History Stack for Device Navigation Bar Back Support
  const tabHistoryRef = useRef<TabType[]>([activeTab]);
  const activeTabRef = useRef<TabType>(activeTab);
  activeTabRef.current = activeTab;

  const handleTabChange = useCallback((newTab: TabType, pushToHistory: boolean = true) => {
    setActiveTabState((currentTab) => {
      if (currentTab === newTab) return currentTab;
      const currentIndex = TAB_ORDER.indexOf(currentTab);
      const newIndex = TAB_ORDER.indexOf(newTab);
      setTabDirection(newIndex >= currentIndex ? 1 : -1);

      if (pushToHistory) {
        tabHistoryRef.current.push(newTab);
        if (typeof window !== 'undefined') {
          window.history.pushState({ auraType: 'tab', tab: newTab }, '');
        }
      }
      return newTab;
    });
  }, []);

  // Save activeTab to localStorage & migrate legacy home/shorts
  useEffect(() => {
    if (activeTab === 'home' || activeTab === 'shorts') {
      setActiveTabState('subscriptions');
      return;
    }
    localStorage.setItem('aura_ai_last_active_tab', activeTab);
  }, [activeTab]);

  // Toast notification state & callback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);
  const [downloadedTracks, setDownloadedTracks] = useState<DownloadedTrack[]>(() => {
    try {
      const saved = localStorage.getItem('aura_ai_downloads');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('aura_ai_downloads', JSON.stringify(downloadedTracks));
  }, [downloadedTracks]);

  // Online / Offline state tracking
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Internet connection restored - YouTube server connected', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('You are offline - Switched to Local Offline Downloads mode', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('aura_ai_theme');
    return saved ? saved === 'dark' : true;
  });

  // Liquid Glass Accent Theme State - Default to Application Main Theme (Ai Music Red & Rose)
  const [accentThemeId, setAccentThemeId] = useState<string>(() => {
    const saved = localStorage.getItem('aura_ai_accent_theme');
    if (saved && saved !== 'indigo') return saved;
    return 'rose';
  });

  const [customAccentHex, setCustomAccentHex] = useState<string>(() => {
    const saved = localStorage.getItem('aura_ai_custom_accent_hex');
    if (saved && saved !== '#6366f1') return saved;
    return '#ef4444';
  });

  // Apply accent theme dynamically
  useEffect(() => {
    localStorage.setItem('aura_ai_accent_theme', accentThemeId);
    localStorage.setItem('aura_ai_custom_accent_hex', customAccentHex);
    applyAccentTheme(accentThemeId, customAccentHex);
  }, [accentThemeId, customAccentHex]);

  // Firebase user & auth modal state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // YouTube API key state
  const [youtubeApiKey, setYoutubeApiKey] = useState<string>(() => {
    return localStorage.getItem('aura_ai_youtube_key') || '';
  });

  // Audio Quality state
  const [audioQuality, setAudioQuality] = useState<string>(() => {
    return localStorage.getItem('aura_ai_audio_quality') || '128';
  });

  // Video Quality state - Default to 144p lowest data saver
  const [videoQuality, setVideoQuality] = useState<string>(() => {
    return localStorage.getItem('aura_ai_video_quality') || '144p';
  });

  const handleSetVideoQuality = (quality: string) => {
    setVideoQuality(quality);
    localStorage.setItem('aura_ai_video_quality', quality);
  };

  // Data Saver / Low Bandwidth Mode state - Default to true for lowest data consumption
  const [isDataSaverMode, setIsDataSaverMode] = useState<boolean>(() => {
    return localStorage.getItem('aura_data_saver_mode') !== 'false';
  });

  const handleToggleDataSaverMode = (enabled: boolean) => {
    setIsDataSaverMode(enabled);
    localStorage.setItem('aura_data_saver_mode', String(enabled));
    if (enabled) {
      setShowVideo(false); // Pure audio stream active without video player
      setAudioQuality('128');
      setVideoQuality('144p');
      showToast("⚡ Data Saver Mode ON — Low-bandwidth Audio stream active (128kbps audio)", "success");
    } else {
      setShowVideo(false);
      setAudioQuality('320');
      setVideoQuality('1080p');
      showToast("Data Saver Mode OFF — High Fidelity 320kbps Audio restored", "info");
    }
  };
  const [autoPlayOnSelect, setAutoPlayOnSelect] = useState<boolean>(() => {
    const saved = localStorage.getItem('aura_ai_autoplay_select');
    return saved ? saved === 'true' : false;
  });

  const handleSetAutoPlayOnSelect = (val: boolean) => {
    setAutoPlayOnSelect(val);
    try {
      localStorage.setItem('aura_ai_autoplay_select', String(val));
    } catch {}
  };
  const [isAutoplayUpNext, setIsAutoplayUpNext] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('aura_autoplay_upnext');
      return saved !== null ? saved === 'true' : false; // Default to false (Stop automatic video play)
    } catch {
      return false;
    }
  });

  const handleToggleAutoplayUpNext = (enabled?: boolean) => {
    setIsAutoplayUpNext(prev => {
      const nextVal = typeof enabled === 'boolean' ? enabled : !prev;
      localStorage.setItem('aura_autoplay_upnext', String(nextVal));
      showToast(nextVal ? '▶ Autoplay enabled: Up next videos will play automatically' : '⏹ Autoplay stopped: Videos will not play automatically', 'info');
      return nextVal;
    });
  };

  // Subscribed YouTube Channels state from localStorage
  const [subscriptions, setSubscriptions] = useState<SubscribedChannel[]>(() => {
    try {
      const saved = localStorage.getItem('aura_ai_subscriptions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set<string>();
          const cleaned: SubscribedChannel[] = [];
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i];
            if (!item || !item.name) continue;
            const validId = item.id && item.id !== 'undefined'
              ? item.id
              : `ch-${(item.name || 'ch').toLowerCase().replace(/[^a-z0-9]/g, '-') || i}-${i}`;
            if (!seen.has(validId) && !seen.has((item.name || '').toLowerCase())) {
              seen.add(validId);
              seen.add((item.name || '').toLowerCase());
              cleaned.push({
                ...item,
                id: validId,
                name: item.name,
                handle: item.handle || `@${item.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                avatar: item.avatar || getChannelAvatar(item.name),
                subscribers: item.subscribers || '1M subscribers',
              });
            }
          }
          if (cleaned.length > 0) return cleaned;
        }
      }
      return DEFAULT_CHANNELS;
    } catch {
      return DEFAULT_CHANNELS;
    }
  });

  // Subscriptions modal state
  const [isSubscriptionsModalOpen, setIsSubscriptionsModalOpen] = useState<boolean>(false);
  const [isMobileConnectModalOpen, setIsMobileConnectModalOpen] = useState<boolean>(false);
  const [isYouTubeSyncing, setIsYouTubeSyncing] = useState<boolean>(false);
  const [youtubeChannelProfile, setYoutubeChannelProfile] = useState<YouTubeChannelProfile | null>(null);
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string | null>(null);
  const [selectedChannelDetailsName, setSelectedChannelDetailsName] = useState<string | null>(null);
  const [selectedChannelForDetails, setSelectedChannelForDetails] = useState<string | null>(null);

  // Helper to load only real user-played video (never a default fallback track)
  // Helper to load last played video (or initial featured track so mini player is visible immediately)
  const getInitialLastPlayedVideo = (): Track | null => {
    try {
      const explicitUserPlayed = localStorage.getItem('aura_user_last_played_video');
      if (explicitUserPlayed) {
        const parsed = JSON.parse(explicitUserPlayed);
        if (parsed && parsed.id) return parsed;
      }
      const savedHist = localStorage.getItem('aura_ai_history');
      if (savedHist) {
        const parsedHist = JSON.parse(savedHist);
        if (Array.isArray(parsedHist) && parsedHist.length > 0 && parsedHist[0]?.id) {
          return parsedHist[0];
        }
      }
      return DEFAULT_TRACKS[0] || null;
    } catch {
      return DEFAULT_TRACKS[0] || null;
    }
  };

  // Track playback & audio stream state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(() => getInitialLastPlayedVideo());

  // Dedicated last played video state so mini player always shows the real last played video
  const [lastPlayedVideo, setLastPlayedVideo] = useState<Track | null>(() => getInitialLastPlayedVideo());

  const [isMiniPlayerDismissed, setIsMiniPlayerDismissed] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('aura_ai_volume');
      return saved ? parseInt(saved, 10) : 85;
    } catch {
      return 85;
    }
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aura_ai_muted') === 'true';
    } catch {
      return false;
    }
  });
  const [showVideo, setShowVideo] = useState<boolean>(false);
  const [isFullVideoPlayerOpen, setIsFullVideoPlayerOpen] = useState<boolean>(false);
  const [isVideoMiniPlayerOpen, setIsVideoMiniPlayerOpen] = useState<boolean>(true);
  const [playerEngine, setPlayerEngine] = useState<PlayerEngine>(() => {
    return (localStorage.getItem('aura_player_engine') as PlayerEngine) || 'youtube-nocookie';
  });

  const handleChangePlayerEngine = (engine: PlayerEngine) => {
    setPlayerEngine(engine);
    localStorage.setItem('aura_player_engine', engine);
    const domain = (engine === 'youtube-nocookie' || engine === 'nocookie') ? 'nocookie' : 'standard';
    localStorage.setItem('aura_player_domain', domain);
    showToast(`Switched player engine to ${engine.toUpperCase()} (YouTube NoCookie)`, 'info');
  };

  // Real-time playback time & duration from YouTube video stream
  const [playbackTime, setPlaybackTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('aura_ai_last_playback_time');
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  });
  const [realDuration, setRealDuration] = useState<number>(0);
  const [seekToSeconds, setSeekToSeconds] = useState<number | null>(null);

  const handleProgress = useCallback((playedSec: number) => {
    const sec = Math.floor(playedSec);
    queueMicrotask(() => {
      setPlaybackTime(sec);
    });
  }, []);

  const handleDuration = useCallback((durationSec: number) => {
    const totalSecs = Math.floor(durationSec);
    queueMicrotask(() => {
      setRealDuration(totalSecs);
      if (totalSecs > 0) {
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        const formatted = hrs > 0
          ? `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
          : `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        setCurrentTrack((prev) => {
          if (!prev || prev.duration === formatted) return prev;
          return { ...prev, duration: formatted };
        });
      }
    });
  }, []);

  const handleSeek = useCallback((newTime: number) => {
    setPlaybackTime(newTime);
    setSeekToSeconds(newTime);
    setTimeout(() => setSeekToSeconds(null), 100);
  }, []);

  const handleVolumeChange = useCallback((vol: number) => {
    setVolume(vol);
    if (vol > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Download Modal track & playlist
  const [downloadTrack, setDownloadTrack] = useState<Track | null>(null);
  const [downloadPlaylist, setDownloadPlaylist] = useState<Playlist | null>(null);

  // Add To Playlist Modal track
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<Track | null>(null);

  // YouTube Metadata Modal track
  const [metadataTrack, setMetadataTrack] = useState<Track | null>(null);

  // Share Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // In-App WebView Modal state
  const [isWebViewOpen, setIsWebViewOpen] = useState<boolean>(false);
  const [webViewUrl, setWebViewUrl] = useState<string>('https://m.youtube.com');
  const [webViewTitle, setWebViewTitle] = useState<string>('In-App WebView');

  // Native Android Exporter Modal state
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);

  const handleOpenWebView = useCallback((url?: string, title?: string) => {
    if (url) setWebViewUrl(url);
    if (title) setWebViewTitle(title);
    setIsWebViewOpen(true);
  }, []);

  const handleOpenAndroidModal = useCallback(() => {
    setIsAndroidModalOpen(true);
  }, []);

  // Favorites (Liked) state from localStorage - strictly user-liked only (no auto-liking)
  const [favorites, setFavorites] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('aura_ai_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Playlists state from localStorage
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('aura_ai_playlists');
      return saved ? JSON.parse(saved) : [
        {
          id: 'p-song-default',
          name: 'Song',
          description: 'Number of song you can find here.',
          tracks: [
            DEFAULT_TRACKS[4] || DEFAULT_TRACKS[0], // Kesariya - Brahmāstra
            DEFAULT_TRACKS[6] || DEFAULT_TRACKS[1], // Apna Bana Le
            DEFAULT_TRACKS[7] || DEFAULT_TRACKS[2], // Chaleya
            DEFAULT_TRACKS[5] || DEFAULT_TRACKS[3], // Mon Majhi Re
            DEFAULT_TRACKS[2] || DEFAULT_TRACKS[0]  // Dola Re
          ],
          createdAt: Date.now()
        },
        {
          id: 'p1',
          name: '✨ Chill AI Vibes',
          description: 'Relaxing ambient & lo-fi selection',
          tracks: [DEFAULT_TRACKS[0], DEFAULT_TRACKS[3]],
          createdAt: Date.now()
        }
      ];
    } catch {
      return [];
    }
  });

  // Watch history state from localStorage with accurate YouTube thumbnails
  const [history, setHistory] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('aura_ai_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t: Track) => {
            const vid = extractYouTubeId(t.id || (t as any).youtubeUrl || '');
            const correctThumb = vid && vid.length === 11
              ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`
              : (t.thumbnail || `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`);
            return {
              ...t,
              id: vid || t.id,
              thumbnail: correctThumb
            };
          });
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Synchronize state refs for popstate listener to guarantee fresh values without stale closures
  const isOverlayOpenRef = useRef(isOverlayOpen);
  isOverlayOpenRef.current = isOverlayOpen;

  const selectedChannelFilterRef = useRef(selectedChannelFilter);
  selectedChannelFilterRef.current = selectedChannelFilter;

  const pendingQualityTrackRef = useRef(pendingQualityTrack);
  pendingQualityTrackRef.current = pendingQualityTrack;

  const selectedChannelForDetailsRef = useRef(selectedChannelForDetails);
  selectedChannelForDetailsRef.current = selectedChannelForDetails;

  const metadataTrackRef = useRef(metadataTrack);
  metadataTrackRef.current = metadataTrack;

  const downloadTrackRef = useRef(downloadTrack);
  downloadTrackRef.current = downloadTrack;

  const downloadPlaylistRef = useRef(downloadPlaylist);
  downloadPlaylistRef.current = downloadPlaylist;

  const addToPlaylistTrackRef = useRef(addToPlaylistTrack);
  addToPlaylistTrackRef.current = addToPlaylistTrack;

  const isAuthModalOpenRef = useRef(isAuthModalOpen);
  isAuthModalOpenRef.current = isAuthModalOpen;

  const isSubscriptionsModalOpenRef = useRef(isSubscriptionsModalOpen);
  isSubscriptionsModalOpenRef.current = isSubscriptionsModalOpen;

  const isMobileConnectModalOpenRef = useRef(isMobileConnectModalOpen);
  isMobileConnectModalOpenRef.current = isMobileConnectModalOpen;

  const isNotificationsOpenRef = useRef(isNotificationsOpen);
  isNotificationsOpenRef.current = isNotificationsOpen;

  const isCreateModalOpenRef = useRef(isCreateModalOpen);
  isCreateModalOpenRef.current = isCreateModalOpen;

  const isShareModalOpenRef = useRef(isShareModalOpen);
  isShareModalOpenRef.current = isShareModalOpen;

  const isAndroidModalOpenRef = useRef(isAndroidModalOpen);
  isAndroidModalOpenRef.current = isAndroidModalOpen;

  const isWebViewOpenRef = useRef(isWebViewOpen);
  isWebViewOpenRef.current = isWebViewOpen;

  // Device Navigation Bar Back Button Handler (Android System Navigation & Browser Back)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({ auraType: 'root_tab', tab: activeTab }, '');
    }

    const handlePopState = (e: PopStateEvent) => {
      // 1. Check & close active top modals/sheets
      if (pendingQualityTrackRef.current) {
        setPendingQualityTrack(null);
        return;
      }
      if (selectedChannelForDetailsRef.current) {
        setSelectedChannelForDetails(null);
        return;
      }
      if (metadataTrackRef.current) {
        setMetadataTrack(null);
        return;
      }
      if (downloadTrackRef.current || downloadPlaylistRef.current) {
        setDownloadTrack(null);
        setDownloadPlaylist(null);
        return;
      }
      if (addToPlaylistTrackRef.current) {
        setAddToPlaylistTrack(null);
        return;
      }
      if (isAuthModalOpenRef.current) {
        setIsAuthModalOpen(false);
        return;
      }
      if (isSubscriptionsModalOpenRef.current) {
        setIsSubscriptionsModalOpen(false);
        return;
      }
      if (isMobileConnectModalOpenRef.current) {
        setIsMobileConnectModalOpen(false);
        return;
      }
      if (isNotificationsOpenRef.current) {
        setIsNotificationsOpen(false);
        return;
      }
      if (isCreateModalOpenRef.current) {
        setIsCreateModalOpen(false);
        return;
      }
      if (isShareModalOpenRef.current) {
        setIsShareModalOpen(false);
        return;
      }
      if (isAndroidModalOpenRef.current) {
        setIsAndroidModalOpen(false);
        return;
      }
      if (isWebViewOpenRef.current) {
        setIsWebViewOpen(false);
        return;
      }

      // 2. Close Audio Player Overlay if active
      if (isOverlayOpenRef.current) {
        setIsOverlayOpen(false);
        return;
      }

      // 3. Clear Subscriptions Channel Filter if active
      if (selectedChannelFilterRef.current) {
        setSelectedChannelFilter(null);
        return;
      }

      // 5. Navigate back to previous section tab in the history stack
      if (tabHistoryRef.current.length > 1) {
        tabHistoryRef.current.pop(); // Pop current tab
        const prevTab = tabHistoryRef.current[tabHistoryRef.current.length - 1];
        if (prevTab) {
          const currentIndex = TAB_ORDER.indexOf(activeTabRef.current);
          const prevIndex = TAB_ORDER.indexOf(prevTab);
          setTabDirection(prevIndex >= currentIndex ? 1 : -1);
          setActiveTabState(prevTab);
          showToast(`‹ Returned to ${prevTab.charAt(0).toUpperCase() + prevTab.slice(1)}`, 'info');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showToast]);

  // Push state when an overlay or modal opens so device back button pops it smoothly
  const anyModalOrOverlayOpen = !!(
    isOverlayOpen ||
    pendingQualityTrack ||
    selectedChannelForDetails ||
    metadataTrack ||
    downloadTrack ||
    downloadPlaylist ||
    addToPlaylistTrack ||
    isAuthModalOpen ||
    isSubscriptionsModalOpen ||
    isMobileConnectModalOpen ||
    isNotificationsOpen ||
    isCreateModalOpen ||
    isShareModalOpen ||
    isAndroidModalOpen ||
    isWebViewOpen
  );

  const prevModalOrOverlayOpenRef = useRef(false);

  useEffect(() => {
    if (anyModalOrOverlayOpen && !prevModalOrOverlayOpenRef.current) {
      if (typeof window !== 'undefined') {
        window.history.pushState({ auraType: 'modal_or_overlay' }, '');
      }
    }
    prevModalOrOverlayOpenRef.current = anyModalOrOverlayOpen;
  }, [anyModalOrOverlayOpen]);

  // Sync dark mode class
  useEffect(() => {
    localStorage.setItem('aura_ai_theme', darkMode ? 'dark' : 'light');
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Instant reset scroll to top when switching active views without sluggish delay
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeTab]);

  // Function to sync account data (local <-> Firestore cloud <-> YouTube)
  const handleSyncGoogleAccount = useCallback(async (targetUser?: User | null, showNotification: boolean = true) => {
    const activeUser = targetUser || auth.currentUser || user;
    if (!activeUser) {
      if (showNotification) {
        showToast('Please sign in with Mobile OTP or Email to sync your account.', 'info');
      }
      return;
    }

    try {
      if (showNotification) {
        showToast('Syncing library with Cloud...', 'info');
      }

      // 1. Sync local favorites to Firestore
      const savedFavs = localStorage.getItem('aura_ai_favorites');
      if (savedFavs) {
        const localFavs: Track[] = JSON.parse(savedFavs);
        for (const track of localFavs) {
          await setDoc(doc(db, 'users', activeUser.uid, 'favorites', track.id), {
            ...track, userId: activeUser.uid, addedAt: track.addedAt || new Date().toISOString()
          }, { merge: true });
        }
      }

      // 2. Sync local playlists to Firestore
      const savedPlaylists = localStorage.getItem('aura_ai_playlists');
      if (savedPlaylists) {
        const localPlay: Playlist[] = JSON.parse(savedPlaylists);
        for (const p of localPlay) {
          await setDoc(doc(db, 'users', activeUser.uid, 'playlists', p.id), {
            ...p, userId: activeUser.uid
          }, { merge: true });
        }
      }

      // 3. Sync local subscriptions to Firestore
      const savedSubs = localStorage.getItem('aura_ai_subscriptions');
      if (savedSubs) {
        const localSubs: SubscribedChannel[] = JSON.parse(savedSubs);
        for (const sub of localSubs) {
          await setDoc(doc(db, 'users', activeUser.uid, 'subscriptions', sub.id), {
            ...sub, userId: activeUser.uid, addedAt: new Date().toISOString()
          }, { merge: true });
        }
      }

      // 4. Sync local history to Firestore
      const savedHistory = localStorage.getItem('aura_ai_history');
      if (savedHistory) {
        const localHistory: Track[] = JSON.parse(savedHistory);
        for (const track of localHistory.slice(0, 30)) {
          await setDoc(doc(db, 'users', activeUser.uid, 'history', track.id), {
            ...track, userId: activeUser.uid, listenedAt: track.addedAt || new Date().toISOString()
          }, { merge: true });
        }
      }

      // 4. Auto-sync YouTube subscriptions & watch history in real time with connected Google email
      const connectedEmail = activeUser.email || getConnectedYouTubeEmail(activeUser);
      const ytToken = getYouTubeAccessToken(connectedEmail);
      if (ytToken) {
        // Sync channel subscriptions
        try {
          const ytChannels = await fetchYouTubeUserSubscriptions(ytToken, connectedEmail);
          for (const ch of ytChannels) {
            await setDoc(doc(db, 'users', activeUser.uid, 'subscriptions', ch.id), {
              ...ch,
              userId: activeUser.uid,
              syncedEmail: connectedEmail,
              addedAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch (ytErr) {
          console.warn("Could not auto-sync YouTube subscriptions:", ytErr);
        }

        // Sync watch history
        try {
          const ytHistory = await fetchYouTubeWatchHistory(ytToken, connectedEmail);
          for (const t of ytHistory) {
            await setDoc(doc(db, 'users', activeUser.uid, 'history', t.id), {
              ...t,
              userId: activeUser.uid,
              syncedEmail: connectedEmail,
              listenedAt: t.addedAt || new Date().toISOString()
            }, { merge: true });
          }
        } catch (ytHistErr) {
          console.warn("Could not auto-sync YouTube history:", ytHistErr);
        }
      }

      // 5. Sync last application activity session
      if (currentTrack) {
        await setDoc(doc(db, 'users', activeUser.uid, 'activity', 'lastSession'), {
          lastTrack: currentTrack,
          playbackTime,
          activeTab,
          volume,
          isMuted,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      if (showNotification) {
        showToast(`Account successfully synced (${activeUser.email || activeUser.displayName || 'Cloud'})`, 'success');
      }
    } catch (err) {
      console.error('Account sync error:', err);
      if (showNotification) {
        showToast('Failed to sync account data.', 'error');
      }
    }
  }, [user]);

  // Real-time YouTube Subscription Sync from Google Account
  const handleSyncYouTubeSubscriptions = useCallback(async () => {
    setIsYouTubeSyncing(true);
    const connectedEmail = user?.email || getConnectedYouTubeEmail(user);
    try {
      showToast(`Syncing YouTube channels for ${connectedEmail}...`, 'info');
      let ytChannels: SubscribedChannel[] = [];
      try {
        ytChannels = await fetchYouTubeUserSubscriptions(undefined, connectedEmail);
      } catch (tokenErr: any) {
        if (tokenErr?.message === 'NO_ACCESS_TOKEN' || tokenErr?.message === 'YOUTUBE_TOKEN_EXPIRED') {
          showToast('Direct token required or add channels in Discover tab.', 'info');
          return;
        } else {
          throw tokenErr;
        }
      }

      if (!ytChannels || ytChannels.length === 0) {
        showToast(`No YouTube subscriptions found for ${connectedEmail}.`, 'info');
        return;
      }

      setSubscriptions((prev) => {
        const map = new Map<string, SubscribedChannel>();
        prev.forEach(c => map.set(c.id, c));
        ytChannels.forEach(c => map.set(c.id, c));
        return Array.from(map.values());
      });

      if (user) {
        for (const ch of ytChannels) {
          try {
            await setDoc(doc(db, 'users', user.uid, 'subscriptions', ch.id), {
              ...ch,
              userId: user.uid,
              syncedEmail: connectedEmail,
              syncedFromYouTube: true,
              syncedAt: new Date().toISOString()
            }, { merge: true });
          } catch (e) {
            console.warn('Could not persist synced channel to Firestore:', ch.name, e);
          }
        }
      }

      showToast(`⚡ Successfully synced ${ytChannels.length} YouTube channels in real time!`, 'success');
    } catch (err: any) {
      console.warn('YouTube sync notice:', err?.message || err);
      if (err?.message === 'YOUTUBE_API_UNCONFIGURED') {
        showToast('YouTube API sync is currently being verified on Google Cloud. You can browse and add channels directly.', 'info');
      } else {
        showToast(`YouTube sync notice for ${connectedEmail}: Please ensure access token is configured.`, 'info');
      }
    } finally {
      setIsYouTubeSyncing(false);
    }
  }, [user, showToast]);

  // Real-time YouTube Liked Videos Sync
  const handleSyncYouTubeLiked = useCallback(async () => {
    setIsYouTubeSyncing(true);
    try {
      showToast('Syncing YouTube liked videos...', 'info');
      let tracks: Track[] = [];
      try {
        tracks = await fetchYouTubeLikedVideos();
      } catch (tokenErr: any) {
        if (tokenErr?.message === 'NO_ACCESS_TOKEN' || tokenErr?.message === 'YOUTUBE_TOKEN_EXPIRED') {
          showToast('Direct token required for liked videos sync.', 'info');
          return;
        } else {
          throw tokenErr;
        }
      }

      if (tracks.length > 0) {
        setFavorites((prev) => {
          const map = new Map<string, Track>();
          prev.forEach(t => map.set(t.id, t));
          tracks.forEach(t => map.set(t.id, t));
          return Array.from(map.values());
        });

        if (user) {
          for (const t of tracks) {
            try {
              await setDoc(doc(db, 'users', user.uid, 'favorites', t.id), {
                ...t,
                userId: user.uid,
                syncedFromYouTube: true,
                syncedAt: new Date().toISOString()
              }, { merge: true });
            } catch (e) {}
          }
        }
        showToast(`⚡ Synced ${tracks.length} YouTube liked videos!`, 'success');
      } else {
        showToast('No liked videos found on your YouTube account.', 'info');
      }
    } catch (err) {
      showToast('Notice: Could not sync YouTube liked videos.', 'info');
    } finally {
      setIsYouTubeSyncing(false);
    }
  }, [user, showToast]);

  // Real-time YouTube Playlists Sync
  const handleSyncYouTubePlaylists = useCallback(async () => {
    setIsYouTubeSyncing(true);
    try {
      showToast('Syncing YouTube playlists...', 'info');
      let lists: Playlist[] = [];
      try {
        lists = await fetchYouTubeUserPlaylists();
      } catch (tokenErr: any) {
        if (tokenErr?.message === 'NO_ACCESS_TOKEN' || tokenErr?.message === 'YOUTUBE_TOKEN_EXPIRED') {
          showToast('Direct token required for playlists sync.', 'info');
          return;
        } else {
          throw tokenErr;
        }
      }

      if (lists.length > 0) {
        setPlaylists((prev) => {
          const map = new Map<string, Playlist>();
          prev.forEach(p => map.set(p.id, p));
          lists.forEach(p => map.set(p.id, p));
          return Array.from(map.values());
        });

        if (user) {
          for (const p of lists) {
            try {
              await setDoc(doc(db, 'users', user.uid, 'playlists', p.id), {
                ...p,
                userId: user.uid,
                syncedFromYouTube: true,
                syncedAt: new Date().toISOString()
              }, { merge: true });
            } catch (e) {}
          }
        }
        showToast(`⚡ Synced ${lists.length} YouTube playlists!`, 'success');
      } else {
        showToast('No playlists found on your YouTube account.', 'info');
      }
    } catch (err) {
      showToast('Notice: Could not sync YouTube playlists.', 'info');
    } finally {
      setIsYouTubeSyncing(false);
    }
  }, [user, showToast]);

  // Real-time YouTube Watch History Sync
  const handleSyncYouTubeHistory = useCallback(async () => {
    setIsYouTubeSyncing(true);
    const connectedEmail = user?.email || getConnectedYouTubeEmail(user);
    try {
      showToast(`Syncing YouTube watch history for ${connectedEmail}...`, 'info');
      let tracks: Track[] = [];
      try {
        tracks = await fetchYouTubeWatchHistory(undefined, connectedEmail);
      } catch (tokenErr: any) {
        if (tokenErr?.message === 'NO_ACCESS_TOKEN' || tokenErr?.message === 'YOUTUBE_TOKEN_EXPIRED') {
          showToast('Direct token required for watch history sync.', 'info');
          return;
        } else {
          throw tokenErr;
        }
      }

      if (tracks.length > 0) {
        setHistory((prev) => {
          const map = new Map<string, Track>();
          prev.forEach(t => map.set(t.id, t));
          tracks.forEach(t => map.set(t.id, t));
          const combined = Array.from(map.values());
          combined.sort((a: any, b: any) => {
            const timeA = new Date(a.listenedAt || a.addedAt || a.syncedAt || 0).getTime();
            const timeB = new Date(b.listenedAt || b.addedAt || b.syncedAt || 0).getTime();
            return timeB - timeA;
          });
          return combined;
        });

        if (user) {
          for (const t of tracks) {
            try {
              await setDoc(doc(db, 'users', user.uid, 'history', t.id), {
                ...t,
                userId: user.uid,
                syncedEmail: connectedEmail,
                syncedFromYouTube: true,
                listenedAt: t.addedAt || new Date().toISOString(),
                syncedAt: new Date().toISOString()
              }, { merge: true });
            } catch (e) {}
          }
        }
        showToast(`⚡ Real-time synced ${tracks.length} YouTube history videos!`, 'success');
      } else {
        showToast(`No watch history items found for ${connectedEmail}.`, 'info');
      }
    } catch (err) {
      showToast('Notice: Could not sync YouTube watch history.', 'info');
    } finally {
      setIsYouTubeSyncing(false);
    }
  }, [user, showToast]);

  // Real-time Full YouTube Synchronization (All In One)
  const handleSyncYouTubeAll = useCallback(async () => {
    setIsYouTubeSyncing(true);
    const connectedEmail = user?.email || getConnectedYouTubeEmail(user);
    try {
      showToast(`Starting full real-time sync with YouTube account (${connectedEmail})...`, 'info');
      let syncResult: any = null;
      try {
        syncResult = await fetchYouTubeSyncAll(undefined, connectedEmail);
      } catch (tokenErr: any) {
        if (tokenErr?.message === 'NO_ACCESS_TOKEN' || tokenErr?.message === 'YOUTUBE_TOKEN_EXPIRED') {
          showToast('Direct token required for full YouTube sync.', 'info');
          return;
        } else {
          throw tokenErr;
        }
      }

      if (syncResult) {
        if (syncResult.profile || syncResult.channel) {
          setYoutubeChannelProfile(syncResult.profile || syncResult.channel);
        }

        if (syncResult.subscriptions && Array.isArray(syncResult.subscriptions) && syncResult.subscriptions.length > 0) {
          setSubscriptions((prev) => {
            const map = new Map<string, SubscribedChannel>();
            prev.forEach(c => map.set(c.id, c));
            syncResult.subscriptions.forEach((c: SubscribedChannel) => map.set(c.id, c));
            return Array.from(map.values());
          });
          if (user) {
            for (const ch of syncResult.subscriptions) {
              setDoc(doc(db, 'users', user.uid, 'subscriptions', ch.id), {
                ...ch,
                userId: user.uid,
                syncedEmail: connectedEmail,
                addedAt: new Date().toISOString()
              }, { merge: true }).catch(() => {});
            }
          }
        }

        const likedList = syncResult.likedTracks || syncResult.likedVideos || [];
        if (Array.isArray(likedList) && likedList.length > 0) {
          setFavorites((prev) => {
            const map = new Map<string, Track>();
            prev.forEach(t => map.set(t.id, t));
            likedList.forEach((t: Track) => map.set(t.id, t));
            return Array.from(map.values());
          });
          if (user) {
            for (const t of likedList) {
              setDoc(doc(db, 'users', user.uid, 'favorites', t.id), {
                ...t,
                userId: user.uid,
                syncedEmail: connectedEmail,
                addedAt: new Date().toISOString()
              }, { merge: true }).catch(() => {});
            }
          }
        }

        if (syncResult.playlists && Array.isArray(syncResult.playlists) && syncResult.playlists.length > 0) {
          setPlaylists((prev) => {
            const map = new Map<string, Playlist>();
            prev.forEach(p => map.set(p.id, p));
            syncResult.playlists.forEach((p: Playlist) => map.set(p.id, p));
            return Array.from(map.values());
          });
          if (user) {
            for (const p of syncResult.playlists) {
              setDoc(doc(db, 'users', user.uid, 'playlists', p.id), {
                ...p,
                userId: user.uid,
                syncedEmail: connectedEmail,
                createdAt: new Date().toISOString()
              }, { merge: true }).catch(() => {});
            }
          }
        }

        const historyList = syncResult.historyTracks || syncResult.history || [];
        if (Array.isArray(historyList) && historyList.length > 0) {
          setHistory((prev) => {
            const map = new Map<string, Track>();
            prev.forEach(t => map.set(t.id, t));
            historyList.forEach((t: Track) => map.set(t.id, t));
            const combined = Array.from(map.values());
            combined.sort((a: any, b: any) => {
              const timeA = new Date(a.listenedAt || a.addedAt || a.syncedAt || 0).getTime();
              const timeB = new Date(b.listenedAt || b.addedAt || b.syncedAt || 0).getTime();
              return timeB - timeA;
            });
            return combined;
          });
          if (user) {
            for (const t of historyList) {
              setDoc(doc(db, 'users', user.uid, 'history', t.id), {
                ...t,
                userId: user.uid,
                syncedEmail: connectedEmail,
                listenedAt: t.addedAt || new Date().toISOString(),
                syncedAt: new Date().toISOString()
              }, { merge: true }).catch(() => {});
            }
          }
        }

        showToast(`⚡ Real-time sync complete for ${connectedEmail}!`, 'success');
      }
    } catch (err: any) {
      console.warn('Full sync error:', err);
      showToast(`YouTube sync notice for ${connectedEmail}: Please verify channel connection.`, 'info');
    } finally {
      setIsYouTubeSyncing(false);
    }
  }, [user, showToast]);

  // Firebase Authentication listener and Firestore real-time sync on startup / open
  useEffect(() => {
    testFirebaseConnection();

    let isInitialLoad = true;

    const unsubscribeAuth = onAuthStateChanged(
      auth, 
      (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          console.log('Firebase user logged in on application open:', currentUser.uid);

          // Perform Google Account Sync on application open
          handleSyncGoogleAccount(currentUser, isInitialLoad);
          if (isInitialLoad) {
            isInitialLoad = false;
          }

        // Subscriptions listener
        const subPath = `users/${currentUser.uid}/subscriptions`;
        const unsubSubs = onSnapshot(collection(db, subPath), (snapshot) => {
          const cloudSubs: SubscribedChannel[] = [];
          const seen = new Set<string>();
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as SubscribedChannel;
            const validId = docSnap.id && docSnap.id !== 'undefined'
              ? docSnap.id
              : (data.id && data.id !== 'undefined' ? data.id : `ch-${(data.name || 'ch').toLowerCase().replace(/[^a-z0-9]/g, '-') || cloudSubs.length}-${cloudSubs.length}`);
            const channelName = data.name || 'Channel';
            if (!seen.has(validId) && !seen.has(channelName.toLowerCase())) {
              seen.add(validId);
              seen.add(channelName.toLowerCase());
              cloudSubs.push({
                ...data,
                id: validId,
                name: channelName,
                handle: data.handle || `@${channelName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                avatar: data.avatar || getChannelAvatar(channelName),
                subscribers: data.subscribers || '1M subscribers',
              });
            }
          });
          if (cloudSubs.length > 0) {
            setSubscriptions(cloudSubs);
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, subPath));

        // Favorites listener
        const favPath = `users/${currentUser.uid}/favorites`;
        const unsubFavs = onSnapshot(collection(db, favPath), (snapshot) => {
          const cloudFavs: Track[] = [];
          snapshot.forEach((docSnap) => {
            cloudFavs.push(docSnap.data() as Track);
          });
          if (cloudFavs.length > 0) {
            setFavorites(cloudFavs);
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, favPath));

        // Playlists listener
        const playPath = `users/${currentUser.uid}/playlists`;
        const unsubPlay = onSnapshot(collection(db, playPath), (snapshot) => {
          const cloudPlaylists: Playlist[] = [];
          snapshot.forEach((docSnap) => {
            cloudPlaylists.push(docSnap.data() as Playlist);
          });
          if (cloudPlaylists.length > 0) {
            setPlaylists(cloudPlaylists);
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, playPath));

        // History listener
        const histPath = `users/${currentUser.uid}/history`;
        const unsubHist = onSnapshot(collection(db, histPath), (snapshot) => {
          const cloudHistory: Track[] = [];
          snapshot.forEach((docSnap) => {
            cloudHistory.push(docSnap.data() as Track);
          });
          cloudHistory.sort((a: any, b: any) => {
            const timeA = new Date(a.listenedAt || a.addedAt || a.syncedAt || 0).getTime();
            const timeB = new Date(b.listenedAt || b.addedAt || b.syncedAt || 0).getTime();
            return timeB - timeA;
          });
          if (cloudHistory.length > 0) {
            setHistory(cloudHistory);
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, histPath));

        // Last Activity listener
        const actPath = `users/${currentUser.uid}/activity/lastSession`;
        const unsubAct = onSnapshot(doc(db, 'users', currentUser.uid, 'activity', 'lastSession'), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.lastTrack) {
              setCurrentTrack(data.lastTrack);
            }
            if (typeof data.playbackTime === 'number' && data.playbackTime > 0) {
              setPlaybackTime(data.playbackTime);
            }
            if (data.activeTab) {
              setActiveTabState(data.activeTab as TabType);
            }
            if (typeof data.volume === 'number') {
              setVolume(data.volume);
            }
            if (typeof data.isMuted === 'boolean') {
              setIsMuted(data.isMuted);
            }
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, actPath));

        return () => {
          unsubSubs();
          unsubFavs();
          unsubPlay();
          unsubHist();
          unsubAct();
        };
      } else {
        // Guest mode active: User can stream and save local favorites/history without mandatory cloud login
        console.info('Guest mode active. Local persistence ready.');
      }
    }, (authError) => {
      console.warn('Firebase Auth state listener error (offline / network issue):', authError);
    });

    return () => unsubscribeAuth();
  }, [handleSyncGoogleAccount]);

  // Auto-sync saved subscriptions, library, and last played state when application is opened or resumed
  useEffect(() => {
    const syncLatestDataOnOpen = () => {
      try {
        // 1. Sync Subscriptions from localStorage
        const savedSubs = localStorage.getItem('aura_ai_subscriptions');
        if (savedSubs) {
          const parsedSubs: SubscribedChannel[] = JSON.parse(savedSubs);
          if (parsedSubs.length > 0) {
            setSubscriptions(parsedSubs);
          }
        }

        // 2. Sync Favorites (Library) from localStorage
        const savedFavs = localStorage.getItem('aura_ai_favorites');
        if (savedFavs) {
          const parsedFavs: Track[] = JSON.parse(savedFavs);
          if (parsedFavs.length > 0) {
            setFavorites(parsedFavs);
          }
        }

        // 3. Sync Playlists (Library) from localStorage
        const savedPlaylists = localStorage.getItem('aura_ai_playlists');
        if (savedPlaylists) {
          const parsedPlay: Playlist[] = JSON.parse(savedPlaylists);
          if (parsedPlay.length > 0) {
            setPlaylists(parsedPlay);
          }
        }

        // 4. Sync History (Library) from localStorage
        const savedHist = localStorage.getItem('aura_ai_history');
        if (savedHist) {
          const parsedHist: Track[] = JSON.parse(savedHist);
          if (parsedHist.length > 0) {
            setHistory(parsedHist);
          }
        }

        // 5. Sync Real User-Played Last Video from localStorage (never default fallback)
        const savedUserTrack = localStorage.getItem('aura_user_last_played_video');
        if (savedUserTrack) {
          const parsedTrack: Track = JSON.parse(savedUserTrack);
          if (parsedTrack && parsedTrack.id) {
            setCurrentTrack(parsedTrack);
            setLastPlayedVideo(parsedTrack);
          }
        } else if (savedHist) {
          const parsedHist: Track[] = JSON.parse(savedHist);
          if (Array.isArray(parsedHist) && parsedHist.length > 0 && parsedHist[0]?.id) {
            setCurrentTrack(parsedHist[0]);
            setLastPlayedVideo(parsedHist[0]);
          }
        }

        // If user logged in, perform cloud sync
        if (user) {
          handleSyncGoogleAccount(user, false);
        }
      } catch (err) {
        console.warn('Auto-sync on app open error:', err);
      }
    };

    // Run immediately when mounted
    syncLatestDataOnOpen();

    // Re-sync whenever tab becomes visible after backgrounding or long time
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncLatestDataOnOpen();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', syncLatestDataOnOpen);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', syncLatestDataOnOpen);
    };
  }, [user, handleSyncGoogleAccount]);

  // Sync subscriptions to localStorage
  useEffect(() => {
    localStorage.setItem('aura_ai_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  // Sync favorites to localStorage
  useEffect(() => {
    localStorage.setItem('aura_ai_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Sync playlists to localStorage
  useEffect(() => {
    localStorage.setItem('aura_ai_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem('aura_ai_history', JSON.stringify(history));
  }, [history]);

  // Sync last played track to localStorage and update lastPlayedVideo state
  useEffect(() => {
    if (currentTrack) {
      localStorage.setItem('aura_user_last_played_video', JSON.stringify(currentTrack));
      localStorage.setItem('aura_ai_last_played_track', JSON.stringify(currentTrack));
      setLastPlayedVideo(currentTrack);
    }
  }, [currentTrack]);

  // Sync last playback time to localStorage
  useEffect(() => {
    if (playbackTime >= 0) {
      localStorage.setItem('aura_ai_last_playback_time', String(playbackTime));
    }
  }, [playbackTime]);

  // Sync volume and mute state to localStorage
  useEffect(() => {
    localStorage.setItem('aura_ai_volume', String(volume));
    localStorage.setItem('aura_ai_muted', String(isMuted));
  }, [volume, isMuted]);

  // Auto-sync application's last activity to Cloud (Firebase Firestore)
  useEffect(() => {
    if (!user || !currentTrack) return;

    const timer = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'users', user.uid, 'activity', 'lastSession'), {
          lastTrack: currentTrack,
          playbackTime,
          activeTab,
          volume,
          isMuted,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Could not sync last activity to cloud:', err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, currentTrack, playbackTime, activeTab, volume, isMuted]);

  const startActualPlayTrack = (track: Track, _unused?: boolean) => {
    setShowVideo(false);
    setIsOverlayOpen(false);

    // Extract clean 11-char YouTube ID and ensure 100% correct YouTube thumbnail
    const validVideoId = extractYouTubeId(track.id || (track as any).youtubeUrl || '');
    const finalId = validVideoId && validVideoId.length === 11 
      ? validVideoId 
      : (track.id && track.id.length === 11 ? track.id : '');

    const correctThumbnail = finalId && finalId.length === 11
      ? `https://i.ytimg.com/vi/${finalId}/hqdefault.jpg`
      : (track.thumbnail && !track.thumbnail.includes('unsplash') && !track.thumbnail.includes('picsum')
          ? track.thumbnail
          : `https://i.ytimg.com/vi/${finalId}/hqdefault.jpg`);

    const trackWithCorrectThumbnail: Track = {
      ...track,
      id: finalId || track.id,
      thumbnail: correctThumbnail,
      addedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('aura_user_last_played_video', JSON.stringify(trackWithCorrectThumbnail));
      localStorage.setItem('aura_ai_last_played_track', JSON.stringify(trackWithCorrectThumbnail));
    } catch {}

    if (currentTrack?.id === trackWithCorrectThumbnail.id) {
      setIsPlaying(false); // Stop automatic video play
      setIsFullVideoPlayerOpen(true);
      setIsVideoMiniPlayerOpen(false);
    } else {
      setCurrentTrack(trackWithCorrectThumbnail);
      setIsPlaying(false); // Stop automatic video play
      setPlaybackTime(0);
      setRealDuration(0);
      setIsFullVideoPlayerOpen(true);
      setIsVideoMiniPlayerOpen(false);
    }
    setLastPlayedVideo(trackWithCorrectThumbnail);
    setIsMiniPlayerDismissed(false);

    // Record to history in real-time (deduplicated, latest first) with correct thumbnail
    setHistory((prev) => {
      const filtered = prev.filter(t => t.id !== trackWithCorrectThumbnail.id);
      const updated = [trackWithCorrectThumbnail, ...filtered].slice(0, 50);
      try {
        localStorage.setItem('aura_ai_history', JSON.stringify(updated));
      } catch (err) {
        console.warn('Local history save warning:', err);
      }
      return updated;
    });

    // Real-time Cloud History Save to Firestore
    if (user) {
      setDoc(doc(db, 'users', user.uid, 'history', trackWithCorrectThumbnail.id), {
        ...trackWithCorrectThumbnail,
        userId: user.uid,
        listenedAt: new Date().toISOString()
      }, { merge: true }).catch((err) => {
        console.warn('Real-time cloud history sync warning:', err);
      });
    }

    showToast(`▶ YouTube Direct: "${trackWithCorrectThumbnail.title}"`, 'success');

    // Dispatch storage event to keep other tabs/views updated in real time
    try {
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  const handlePlayTrack = (track: Track, _forceDirect: boolean = false) => {
    startActualPlayTrack(track);
  };

  const handleConfirmQualityPlay = (track: Track, selectedQuality: QualityOptionId, dontShowAgain: boolean) => {
    if (selectedQuality === 'data_saver') {
      handleToggleDataSaverMode(true);
      handleSetVideoQuality('144p');
      setAudioQuality('128');
      showToast('⚡ Data saver applied: 144p lowest data streaming', 'info');
    } else if (selectedQuality === 'higher') {
      handleToggleDataSaverMode(false);
      handleSetVideoQuality('1080p');
      setAudioQuality('320');
      showToast('High quality (1080p) enabled', 'info');
    } else {
      handleToggleDataSaverMode(false);
      handleSetVideoQuality('auto');
      setAudioQuality('192');
      showToast('Auto adaptive quality enabled', 'info');
    }

    setPendingQualityTrack(null);
    startActualPlayTrack(track);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('aura_ai_history');
    showToast("Watch history cleared", "info");
  };

  const handleRemoveFromHistory = (trackId: string) => {
    setHistory((prev) => prev.filter(t => t.id !== trackId));
    try {
      const current = JSON.parse(localStorage.getItem('aura_ai_history') || '[]');
      const filtered = current.filter((t: any) => t.id !== trackId);
      localStorage.setItem('aura_ai_history', JSON.stringify(filtered));
    } catch {}
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleToggleFavorite = async (track: Track) => {
    const trackYtId = extractYouTubeId(track.id || track.youtubeUrl || '');
    const exists = isTrackLiked(track, favorites);
    
    // Ensure clean thumbnail
    const cleanTrack: Track = {
      ...track,
      thumbnail: track.thumbnail || (trackYtId ? `https://i.ytimg.com/vi/${trackYtId}/hqdefault.jpg` : '')
    };

    // Optimistic state update: Prepend to the top so You tab Liked section updates with newest on top
    setFavorites((prev) => {
      if (exists) {
        return prev.filter(f => {
          if (f.id === track.id) return false;
          const fYtId = extractYouTubeId(f.id || f.youtubeUrl || '');
          return !(trackYtId && fYtId && trackYtId === fYtId);
        });
      } else {
        const withoutCurrent = prev.filter(f => {
          if (f.id === track.id) return false;
          const fYtId = extractYouTubeId(f.id || f.youtubeUrl || '');
          return !(trackYtId && fYtId && trackYtId === fYtId);
        });
        return [cleanTrack, ...withoutCurrent];
      }
    });

    // Also keep aura_liked_video_ids in sync for any standalone components
    if (trackYtId) {
      try {
        const stored = JSON.parse(localStorage.getItem('aura_liked_video_ids') || '[]');
        const updated = exists 
          ? stored.filter((id: string) => id !== trackYtId)
          : Array.from(new Set([trackYtId, ...stored]));
        localStorage.setItem('aura_liked_video_ids', JSON.stringify(updated));
      } catch {}
    }

    if (exists) {
      showToast(`Removed from Liked videos`, 'info');
    } else {
      showToast(`Added to Liked videos 👍`, 'success');
    }

    // Sync to Firestore if logged in
    if (user) {
      const docId = track.id || trackYtId || 'track';
      const path = `users/${user.uid}/favorites/${docId}`;
      try {
        if (exists) {
          await deleteDoc(doc(db, 'users', user.uid, 'favorites', docId));
        } else {
          await setDoc(doc(db, 'users', user.uid, 'favorites', docId), {
            ...cleanTrack,
            userId: user.uid,
            addedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        handleFirestoreError(err, exists ? OperationType.DELETE : OperationType.WRITE, path);
      }
    }
  };

  const handleToggleSubscribe = async (channel: SubscribedChannel | string) => {
    const rawName = typeof channel === 'string' ? channel : (channel?.name || 'Channel');
    const rawId = typeof channel === 'string' ? '' : (channel?.id || '');
    const cleanId = rawId && rawId !== 'undefined'
      ? rawId
      : `ch-${rawName.toLowerCase().replace(/[^a-z0-9]/g, '-') || Date.now()}`;

    const channelObj: SubscribedChannel = typeof channel === 'string'
      ? {
          id: cleanId,
          name: rawName,
          handle: `@${rawName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          avatar: getChannelAvatar(rawName),
          subscribers: '1M subscribers',
        }
      : {
          ...channel,
          id: cleanId,
          name: rawName,
          handle: channel.handle || `@${rawName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          avatar: channel.avatar || getChannelAvatar(rawName),
          subscribers: channel.subscribers || '1M subscribers',
        };

    const channelName = channelObj.name;
    const channelId = channelObj.id;
    const exists = subscriptions.some(s => (s.id && s.id === channelId) || (s.name && s.name.toLowerCase() === channelName.toLowerCase()));
    
    // Instant optimistic state update
    setSubscriptions((prev) => {
      if (exists) {
        return prev.filter(s => (s.id && s.id !== channelId) && ((s.name || '').toLowerCase() !== channelName.toLowerCase()));
      } else {
        const withoutExisting = prev.filter(s => (s.id !== channelId) && ((s.name || '').toLowerCase() !== channelName.toLowerCase()));
        return [...withoutExisting, channelObj];
      }
    });

    if (exists) {
      showToast(`Unsubscribed from ${channelName}`, 'info');
      // If currently filtering by this channel, reset
      if (selectedChannelFilter && selectedChannelFilter.toLowerCase() === channelName.toLowerCase()) {
        setSelectedChannelFilter(null);
      }
    } else {
      showToast(`⚡ Subscribed to ${channelName}! Live updates active`, 'success');
    }

    // Broadcast instant local storage event for cross-tab real-time sync
    window.dispatchEvent(new Event('storage'));

    // Sync to Firestore in real time if logged in
    if (user) {
      const path = `users/${user.uid}/subscriptions/${cleanId}`;
      try {
        if (exists) {
          await deleteDoc(doc(db, 'users', user.uid, 'subscriptions', cleanId));
        } else {
          await setDoc(doc(db, 'users', user.uid, 'subscriptions', cleanId), {
            ...channelObj,
            id: cleanId,
            userId: user.uid,
            createdAt: new Date().toISOString()
          });
        }
      } catch (err) {
        handleFirestoreError(err, exists ? OperationType.DELETE : OperationType.WRITE, path);
      }
    }
  };

  const handleCreatePlaylist = async (name: string, description: string) => {
    const newP: Playlist = {
      id: `p-${Date.now()}`,
      name,
      description,
      tracks: currentTrack ? [currentTrack] : [],
      createdAt: Date.now()
    };

    setPlaylists((prev) => [newP, ...prev]);

    if (user) {
      const path = `users/${user.uid}/playlists/${newP.id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'playlists', newP.id), {
          ...newP,
          userId: user.uid
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    setPlaylists((prev) => prev.filter(p => p.id !== id));
    showToast("Playlist deleted", "info");

    if (user) {
      const path = `users/${user.uid}/playlists/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'playlists', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  const handleAddToPlaylist = async (playlistId: string, track: Track) => {
    const targetPlaylist = playlists.find(p => p.id === playlistId);
    if (!targetPlaylist) return;

    if (targetPlaylist.tracks.some(t => t.id === track.id)) {
      showToast(`"${track.title}" is already in "${targetPlaylist.name}"`, 'info');
      return;
    }

    const updatedTracks = [...targetPlaylist.tracks, track];
    const updatedPlaylists = playlists.map(p => 
      p.id === playlistId ? { ...p, tracks: updatedTracks } : p
    );

    setPlaylists(updatedPlaylists);
    showToast(`Added to "${targetPlaylist.name}"`, 'success');

    if (user) {
      const path = `users/${user.uid}/playlists/${playlistId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'playlists', playlistId), {
          ...targetPlaylist,
          tracks: updatedTracks,
          userId: user.uid
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  const handleRemoveFromPlaylist = async (playlistId: string, trackId: string) => {
    const targetPlaylist = playlists.find(p => p.id === playlistId);
    if (!targetPlaylist) return;

    const updatedTracks = targetPlaylist.tracks.filter(t => t.id !== trackId);
    const updatedPlaylists = playlists.map(p => 
      p.id === playlistId ? { ...p, tracks: updatedTracks } : p
    );

    setPlaylists(updatedPlaylists);
    showToast(`Removed track from "${targetPlaylist.name}"`, 'info');

    if (user) {
      const path = `users/${user.uid}/playlists/${playlistId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'playlists', playlistId), {
          ...targetPlaylist,
          tracks: updatedTracks,
          userId: user.uid
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  const handleUpdatePlaylist = async (playlistId: string, name: string, description: string) => {
    const targetPlaylist = playlists.find(p => p.id === playlistId);
    if (!targetPlaylist) return;

    const updated = {
      ...targetPlaylist,
      name,
      description
    };

    setPlaylists(prev => prev.map(p => p.id === playlistId ? updated : p));

    if (user) {
      const path = `users/${user.uid}/playlists/${playlistId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'playlists', playlistId), {
          ...updated,
          userId: user.uid
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  // Next / Prev Track handling with Autoplay (Mini player does not autoplay)
  const handleNextTrack = (trackList?: Track[]) => {
    const list = (trackList && trackList.length > 0) ? trackList : DEFAULT_TRACKS;
    if (!currentTrack) {
      if (list.length > 0) {
        startActualPlayTrack(list[0]);
      }
      return;
    }
    const idx = list.findIndex(t => t.id === currentTrack.id);
    const nextIdx = idx >= 0 ? (idx + 1) % list.length : 0;
    const nextTrack = list[nextIdx] || DEFAULT_TRACKS[0];

    startActualPlayTrack(nextTrack);
    setIsPlaying(true);
    showToast(`▶ Playing: ${nextTrack.title}`, 'info');
  };

  const handleTrackEnded = () => {
    if (isAutoplayUpNext) {
      handleNextTrack();
    } else {
      setIsPlaying(false);
      showToast('Track playback completed', 'info');
    }
  };

  const handlePrevTrack = (trackList?: Track[]) => {
    const list = (trackList && trackList.length > 0) ? trackList : DEFAULT_TRACKS;
    if (!currentTrack) return;
    const idx = list.findIndex(t => t.id === currentTrack.id);
    const prevIdx = (idx - 1 + list.length) % list.length;
    const prevTrack = list[prevIdx] || DEFAULT_TRACKS[0];

    startActualPlayTrack(prevTrack);
    setIsPlaying(true);
    showToast(`▶ Playing: ${prevTrack.title}`, 'info');
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] dark:bg-[#070810] text-slate-900 dark:text-slate-100 font-sans transition-colors selection:bg-rose-500 selection:text-white relative overflow-x-hidden flex flex-col items-center justify-start w-full">
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={handleCompleteSplash} />}
      </AnimatePresence>
      
      {/* ========================================================================= */}
      {/* iOS Style Full Liquid Glass Fluid Aurora Ambient Canvas (Light & Dark)     */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Fluid morphing liquid mesh blobs with organic squircle curvature */}
        <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-[42%_58%_70%_30%/45%_45%_55%_55%] bg-gradient-to-br from-rose-400/25 via-pink-400/20 to-amber-300/20 dark:from-rose-600/18 dark:via-purple-700/15 dark:to-transparent blur-[80px] animate-aurora-1" />
        <div className="absolute -top-[10%] -right-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-[55%_45%_35%_65%/60%_40%_60%_40%] bg-gradient-to-bl from-indigo-400/25 via-sky-400/20 to-teal-300/15 dark:from-indigo-600/20 dark:via-blue-700/18 dark:to-transparent blur-[85px] animate-aurora-2" />
        <div className="absolute top-[45%] left-[25%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] rounded-[60%_40%_48%_52%/40%_60%_40%_60%] bg-gradient-to-tr from-amber-300/15 via-rose-300/15 to-violet-400/20 dark:from-purple-900/22 dark:via-rose-900/18 dark:to-transparent blur-[90px] animate-aurora-3" />
        {/* Specular fluid light sheen */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-slate-200/20 dark:from-white/[0.02] dark:via-transparent dark:to-black/40 pointer-events-none" />
      </div>


      {/* Toast Overlay */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Janmashtami Divine Floating Particles (Active until 6th Sep 2026) */}
      <JanmashtamiParticles enabled={janmashtamiParticlesEnabled} />

      {/* Laxmi Puja Auspicious Floating Golden Shimmer & Lotus Embers */}
      <LaxmiPujaParticles enabled={laxmiPujaParticlesEnabled} />

      {/* Direct APK & WebAPK Installer Prompt */}
      <PWAInstallBanner showToast={showToast} />

      {/* Main Header & Shifted Bottom Dock Navbar (Hidden when Full Video Player is open to prevent overlying) */}
      {!isFullVideoPlayerOpen && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          favoritesCount={favorites.length}
          hasYouTubeKey={!!youtubeApiKey}
          subscriptionsCount={subscriptions.length}
          subscriptions={subscriptions}
          selectedChannelFilter={selectedChannelFilter}
          setSelectedChannelFilter={setSelectedChannelFilter}
          onOpenSubscriptionsModal={() => setIsSubscriptionsModalOpen(true)}
          user={user}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenWebView={handleOpenWebView}
          onOpenAndroidModal={handleOpenAndroidModal}
          onOpenJanmashtamiModal={() => setIsJanmashtamiModalOpen(true)}
          onOpenLaxmiPujaModal={() => setIsLaxmiPujaModalOpen(true)}
          isDataSaverMode={isDataSaverMode}
          onToggleDataSaverMode={handleToggleDataSaverMode}
          userName={user?.displayName || mobileAuthUser?.displayName || mobileAuthUser?.phoneNumber || 'Bikash Jana'}
          currentTrack={currentTrack || lastPlayedVideo}
          hasLastPlayedVideo={!!(currentTrack || lastPlayedVideo)}
          onToggleMiniPlayer={() => {
            setIsFullVideoPlayerOpen(false);
            setIsMiniPlayerDismissed(false);
            setIsVideoMiniPlayerOpen(true);
            if (!currentTrack && lastPlayedVideo) {
              setCurrentTrack(lastPlayedVideo);
            }
          }}
        />
      )}

      {/* Primary Main Content Area */}
      <main className="mx-auto pt-2 sm:pt-3 pb-28 sm:pb-32 w-full flex flex-col items-center justify-start self-center overflow-x-hidden max-w-full min-h-screen px-0 sm:px-4 lg:px-6">
        <AnimatePresence mode="wait" initial={false} custom={tabDirection}>
          <motion.div
            key={activeTab}
            custom={tabDirection}
            initial={(dir: number) => ({ opacity: 0, x: (dir || 1) * 36, scale: 0.985 })}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={(dir: number) => ({ opacity: 0, x: (dir || 1) * -28, scale: 0.99 })}
            transition={{
              x: { type: 'spring', stiffness: 360, damping: 30 },
              opacity: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
              scale: { duration: 0.20, ease: [0.16, 1, 0.3, 1] }
            }}
            className="w-full min-h-[70vh] flex flex-col items-center justify-start self-center will-change-[transform,opacity] transform-gpu"
          >
            {activeTab === 'subscriptions' && (
              <SubscriptionsView
                onPlay={handlePlayTrack}
                onDownload={(track) => setDownloadTrack(track)}
                currentTrackId={currentTrack?.id}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onOpenAddToPlaylist={(track) => setAddToPlaylistTrack(track)}
                onOpenMetadata={(track) => setMetadataTrack(track)}
                subscriptions={subscriptions}
                onOpenSubscriptionsModal={() => setIsSubscriptionsModalOpen(true)}
                onToggleSubscribe={handleToggleSubscribe}
                selectedChannelFilter={selectedChannelFilter}
                setSelectedChannelFilter={setSelectedChannelFilter}
                onOpenChannelDetails={(ch) => setSelectedChannelForDetails(ch)}
                onShowToast={showToast}
                onSyncYouTubeSubscriptions={handleSyncYouTubeSubscriptions}
              />
            )}

            {activeTab === 'search' && (
              <SearchView
                onPlay={handlePlayTrack}
                onDownload={(track) => setDownloadTrack(track)}
                currentTrackId={currentTrack?.id}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onOpenAddToPlaylist={(track) => setAddToPlaylistTrack(track)}
                onOpenMetadata={(track) => setMetadataTrack(track)}
                onOpenChannelDetails={(ch) => setSelectedChannelForDetails(ch)}
                youtubeApiKey={youtubeApiKey}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'library' && (
              <LibraryView
                onPlay={handlePlayTrack}
                onDownload={(track) => setDownloadTrack(track)}
                onDownloadPlaylist={(playlist) => setDownloadPlaylist(playlist)}
                currentTrackId={currentTrack?.id}
                favorites={favorites}
                history={history}
                onClearHistory={handleClearHistory}
                onRemoveFromHistory={handleRemoveFromHistory}
                onToggleFavorite={handleToggleFavorite}
                playlists={playlists}
                onCreatePlaylist={handleCreatePlaylist}
                onUpdatePlaylist={handleUpdatePlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                onRemoveTrackFromPlaylist={handleRemoveFromPlaylist}
                onOpenAddToPlaylist={(track) => setAddToPlaylistTrack(track)}
                onOpenMetadata={(track) => setMetadataTrack(track)}
                onOpenChannelDetails={(ch) => setSelectedChannelForDetails(ch)}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onShowToast={showToast}
                userName={user?.displayName || 'My Account'}
                userEmail={user?.email && user.email !== 'bikashjana2005@gmail.com' ? user.email : (getTargetYouTubeEmail() !== 'bikashjana2005@gmail.com' ? getTargetYouTubeEmail() : '')}
                userPhoto={user?.photoURL || undefined}
                isDataSaverMode={isDataSaverMode}
                onToggleDataSaverMode={handleToggleDataSaverMode}
                videoQuality={videoQuality}
                onChangeVideoQuality={handleSetVideoQuality}
                onOpenSettings={() => handleTabChange('settings')}
                onOpenDownloads={() => handleTabChange('downloads')}
                onOpenShareModal={() => setIsShareModalOpen(true)}
                downloadedTracks={downloadedTracks}
                onRemoveDownload={(trackId) => setDownloadedTracks(prev => prev.filter(t => t.id !== trackId))}
                onClearAllDownloads={() => setDownloadedTracks([])}
                onSyncYouTubeHistory={handleSyncYouTubeHistory}
                isYouTubeSyncing={isYouTubeSyncing}
              />
            )}

            {activeTab === 'downloads' && (
              <DownloadsView
                onPlay={handlePlayTrack}
                currentTrackId={currentTrack?.id}
                onShowToast={showToast}
                downloadedTracks={downloadedTracks}
                onRemoveDownload={(trackId) => setDownloadedTracks(prev => prev.filter(t => t.id !== trackId))}
                onClearAllDownloads={() => setDownloadedTracks([])}
                isOnline={isOnline}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                accentThemeId={accentThemeId}
                setAccentThemeId={setAccentThemeId}
                customAccentHex={customAccentHex}
                setCustomAccentHex={setCustomAccentHex}
                youtubeApiKey={youtubeApiKey}
                setYoutubeApiKey={setYoutubeApiKey}
                audioQuality={audioQuality}
                setAudioQuality={setAudioQuality}
                videoQuality={videoQuality}
                setVideoQuality={handleSetVideoQuality}
                autoPlayOnSelect={autoPlayOnSelect}
                setAutoPlayOnSelect={handleSetAutoPlayOnSelect}
                onShowToast={showToast}
                user={user}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onOpenShareModal={() => setIsShareModalOpen(true)}
                onOpenWebView={handleOpenWebView}
                onOpenAndroidModal={handleOpenAndroidModal}
                onSyncGoogleAccount={handleSyncGoogleAccount}
                onSyncYouTubeAll={handleSyncYouTubeAll}
                onSyncYouTubeSubscriptions={handleSyncYouTubeSubscriptions}
                onSyncYouTubeLiked={handleSyncYouTubeLiked}
                onSyncYouTubePlaylists={handleSyncYouTubePlaylists}
                onSyncYouTubeHistory={handleSyncYouTubeHistory}
                onOpenMobileConnectModal={() => setIsMobileConnectModalOpen(true)}
                isYouTubeSyncing={isYouTubeSyncing}
                youtubeChannelProfile={youtubeChannelProfile}
                favoritesCount={favorites.length}
                subscriptionsCount={subscriptions.length}
                playlistsCount={playlists.length}
                historyCount={history.length}
                playerEngine={playerEngine}
                onChangePlayerEngine={handleChangePlayerEngine}
                isDataSaverMode={isDataSaverMode}
                onToggleDataSaverMode={handleToggleDataSaverMode}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Download Options Modal (Track or Full Playlist) */}
      <DownloadModal
        isOpen={!!(downloadTrack || downloadPlaylist)}
        track={downloadTrack || undefined}
        playlist={downloadPlaylist || undefined}
        onClose={() => {
          setDownloadTrack(null);
          setDownloadPlaylist(null);
        }}
        onShowToast={showToast}
        audioQuality={audioQuality}
        videoQuality={videoQuality}
        onSetDefaultVideoQuality={handleSetVideoQuality}
        onDownloadComplete={(track, format, quality) => {
          setDownloadedTracks(prev => {
            if (!prev.find(t => t.id === track.id)) {
              return [{ ...track, downloadedAt: Date.now(), format, quality }, ...prev];
            }
            return prev;
          });
          handlePlayTrack(track);
          showToast(`Downloaded "${track.title}"`, 'success');
        }}
      />

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        isOpen={!!addToPlaylistTrack}
        track={addToPlaylistTrack || { id: '', title: '', channel: '', duration: '', thumbnail: '', views: '' }}
        playlists={playlists}
        onClose={() => setAddToPlaylistTrack(null)}
        onAddToPlaylist={handleAddToPlaylist}
        onCreatePlaylist={handleCreatePlaylist}
        onShowToast={showToast}
      />

      {/* Real-time YouTube Video Metadata Modal */}
      <YouTubeMetadataModal
        isOpen={!!metadataTrack}
        track={metadataTrack}
        onClose={() => setMetadataTrack(null)}
        onPlay={handlePlayTrack}
        onDownload={(track) => setDownloadTrack(track)}
        onOpenAddToPlaylist={(track) => setAddToPlaylistTrack(track)}
        onShowToast={showToast}
        youtubeApiKey={youtubeApiKey}
        onOpenWebView={handleOpenWebView}
      />

      {/* In-App WebView Browser Sheet */}
      <InAppWebViewModal
        isOpen={isWebViewOpen}
        onClose={() => setIsWebViewOpen(false)}
        initialUrl={webViewUrl}
        title={webViewTitle}
        onShowToast={showToast}
      />

      {/* Notifications Modal (Bell 9+) */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onPlayTrack={handlePlayTrack}
        onShowToast={showToast}
      />

      {/* Create Action Bottom Sheet (+) */}
      <CreateActionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPlayUrl={(url) => {
          handlePlayTrack({
            id: url,
            title: 'YouTube Custom Stream',
            channel: 'YouTube Direct',
            duration: 'Stream',
            views: 'Direct Play',
            aiMoodTags: 'Custom Stream'
          });
        }}
        onOpenSearch={() => handleTabChange('search')}
        onOpenCreatePlaylist={() => handleTabChange('library')}
        onSyncYouTubeAll={handleSyncYouTubeAll}
        onOpenWebView={() => handleOpenWebView('https://m.youtube.com', 'YouTube In-App WebView')}
        onShowToast={showToast}
      />

      {/* Native Android APK & Flutter Source Exporter Modal */}
      <AndroidNativeExporterModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Share App Modal */}
      <ShareAppModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShowToast={showToast}
      />

      {/* YouTube Channel Subscriptions Manager Modal */}
      <ChannelSubscriptionsModal
        isOpen={isSubscriptionsModalOpen}
        onClose={() => setIsSubscriptionsModalOpen(false)}
        subscriptions={subscriptions}
        onToggleSubscribe={handleToggleSubscribe}
        onSelectChannelFilter={(channelName) => setSelectedChannelFilter(channelName)}
        onShowToast={showToast}
      />

      {/* YouTube Channel Details Modal */}
      <ChannelDetailsModal
        isOpen={!!selectedChannelForDetails}
        channelName={selectedChannelForDetails}
        onClose={() => setSelectedChannelForDetails(null)}
        subscriptions={subscriptions}
        onToggleSubscribe={handleToggleSubscribe}
        onPlay={handlePlayTrack}
        onDownload={(track) => setDownloadTrack(track)}
        currentTrackId={currentTrack?.id}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        onShowToast={showToast}
      />

      {/* Cloud Account & Sign-In Modal */}
      <UserAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        onShowToast={showToast}
        onSyncGoogleAccount={() => handleSyncGoogleAccount(user, true)}
        onSyncYouTubeSubscriptions={handleSyncYouTubeSubscriptions}
        onOpenMobileAuth={() => {
          setIsAuthModalOpen(false);
          setShowMobileAuth(true);
        }}
        favoritesCount={favorites.length}
        subscriptionsCount={subscriptions.length}
        playlistsCount={playlists.length}
      />

      {/* YouTube Mobile App Real-Time Synchronization Modal */}
      <YouTubeMobileConnectModal
        isOpen={isMobileConnectModalOpen}
        onClose={() => setIsMobileConnectModalOpen(false)}
        user={user}
        youtubeChannelProfile={youtubeChannelProfile}
        onSyncAll={handleSyncYouTubeAll}
        onSyncSubscriptions={handleSyncYouTubeSubscriptions}
        onSyncLiked={handleSyncYouTubeLiked}
        onSyncPlaylists={handleSyncYouTubePlaylists}
        onSyncHistory={handleSyncYouTubeHistory}
        isSyncing={isYouTubeSyncing}
        subscriptionsCount={subscriptions.length}
        likedCount={favorites.length}
        playlistsCount={playlists.length}
        historyCount={history.length}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onShowToast={showToast}
      />

      {/* Video Quality Selection Popup (Screenshot matching) */}
      <VideoQualitySelectorModal
        isOpen={!!pendingQualityTrack}
        track={pendingQualityTrack}
        onClose={() => setPendingQualityTrack(null)}
        onConfirmPlay={handleConfirmQualityPlay}
        isDataSaverActive={isDataSaverMode}
      />

      {/* Janmashtami Special Festival Modal (Active until 6th Sep 2026) */}
      <JanmashtamiModal
        isOpen={isJanmashtamiModalOpen}
        onClose={() => setIsJanmashtamiModalOpen(false)}
        onPlayTrack={handlePlayTrack}
        particlesOn={janmashtamiParticlesEnabled}
        onToggleParticles={() => {
          const next = !janmashtamiParticlesEnabled;
          setJanmashtamiParticlesEnabled(next);
          localStorage.setItem('aura_janmashtami_particles', next ? 'true' : 'false');
          showToast(next ? '✨ Janmashtami floating effects ON' : 'Janmashtami floating effects paused', 'info');
        }}
        onShowToast={showToast}
      />

      {/* Laxmi Puja Special Festival Celebration Modal */}
      <LaxmiPujaModal
        isOpen={isLaxmiPujaModalOpen}
        onClose={() => setIsLaxmiPujaModalOpen(false)}
        onPlayTrack={handlePlayTrack}
        particlesOn={laxmiPujaParticlesEnabled}
        onToggleParticles={() => {
          const next = !laxmiPujaParticlesEnabled;
          setLaxmiPujaParticlesEnabled(next);
          localStorage.setItem('aura_laxmi_particles', next ? 'true' : 'false');
          showToast(next ? '✨ Laxmi Puja golden effects ON' : 'Golden effects paused', 'info');
        }}
        onShowToast={showToast}
      />

      {/* Mobile Login / Signup Screen with Real OTP from Trusted Source (Shown after logo screen) */}
      <MobileAuthModal
        isOpen={showMobileAuth}
        onClose={() => setShowMobileAuth(false)}
        onSuccess={(verifiedUser) => {
          setShowMobileAuth(false);
          setMobileAuthUser(verifiedUser);
          const greeting = verifiedUser.displayName 
            ? `${verifiedUser.displayName} (${verifiedUser.phoneNumber})` 
            : verifiedUser.phoneNumber;
          showToast(`Verified as ${greeting}! Welcome to Ai Music Stream 🎉`, 'success');
        }}
        onShowToast={showToast}
      />

      {/* Global Background Audio Player Engine (inactive when Full or Mini Video player handles playback) */}
      <GlobalYouTubePlayer
        currentTrack={null}
        isPlaying={false}
        volume={volume}
        isMuted={true}
        showVideo={false}
        onTrackEnded={handleTrackEnded}
        onProgress={handleProgress}
        onDuration={handleDuration}
        seekToSeconds={seekToSeconds}
        playerEngine={playerEngine}
        onChangePlayerEngine={handleChangePlayerEngine}
        isDataSaverMode={isDataSaverMode}
        onPlayTrack={handlePlayTrack}
        onNextTrack={handleNextTrack}
        onPrevTrack={handlePrevTrack}
        onDownloadTrack={(track) => setDownloadTrack(track)}
        onOpenAddToPlaylist={(track) => setAddToPlaylistTrack(track)}
        isFavorite={favorites.some(f => f.id === currentTrack?.id)}
        onToggleFavorite={handleToggleFavorite}
        isSubscribed={subscriptions.some(s => s.name.toLowerCase() === (currentTrack?.artist || currentTrack?.channel || '').toLowerCase())}
        onToggleSubscribe={handleToggleSubscribe}
        onShowToast={showToast}
        downloadedTracks={downloadedTracks}
        allTracks={DEFAULT_TRACKS}
        darkMode={darkMode}
        isAutoplay={isAutoplayUpNext}
        onToggleAutoplay={handleToggleAutoplayUpNext}
        onTogglePlayPause={handleTogglePlay}
        onSetPlaying={setIsPlaying}
        videoQuality={videoQuality}
        onChangeVideoQuality={handleSetVideoQuality}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
      />

      {/* Resizable Rectangular Video Mini Player (floating Picture-in-Picture window displaying last played video) */}
      {!isFullVideoPlayerOpen && (currentTrack || lastPlayedVideo) && !isMiniPlayerDismissed && (
        <VideoMiniPlayer
          currentTrack={currentTrack || lastPlayedVideo}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNextTrack={() => handleNextTrack()}
          onExpand={() => {
            setIsVideoMiniPlayerOpen(false);
            setIsFullVideoPlayerOpen(true);
          }}
          onClose={() => {
            setIsVideoMiniPlayerOpen(false);
            setIsMiniPlayerDismissed(true);
            setIsPlaying(false);
          }}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Floating Restore Mini Player Button when dismissed: Show last played video in mini player anytime */}
      {!isFullVideoPlayerOpen && isMiniPlayerDismissed && (currentTrack || lastPlayedVideo) && (
        <button
          type="button"
          onClick={() => {
            setIsMiniPlayerDismissed(false);
            setIsVideoMiniPlayerOpen(true);
            if (!currentTrack && lastPlayedVideo) {
              setCurrentTrack(lastPlayedVideo);
            }
          }}
          className="fixed bottom-16 sm:bottom-4 right-3 sm:right-4 z-40 px-3 py-2 rounded-xl bg-zinc-900/95 hover:bg-zinc-800 text-white border border-red-500/40 shadow-2xl backdrop-blur-md flex items-center gap-2.5 group transition-all duration-150 active:scale-95 cursor-pointer ring-1 ring-black/40"
          title={`Show last played video in mini player: ${(currentTrack || lastPlayedVideo)?.title}`}
        >
          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-black shrink-0 border border-white/20">
            <img
              src={(currentTrack || lastPlayedVideo)?.thumbnail || `https://i.ytimg.com/vi/${extractYouTubeId((currentTrack || lastPlayedVideo)?.id || '')}/hqdefault.jpg`}
              alt="Last played thumbnail"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop';
              }}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Play size={10} className="fill-white text-white" />
            </div>
          </div>
          <div className="text-left max-w-[130px] sm:max-w-[180px] min-w-0">
            <span className="text-[9px] font-black text-amber-400 block uppercase tracking-wider leading-none mb-0.5">
              Last Played Video
            </span>
            <span className="text-[11px] font-bold text-white truncate block leading-tight">
              {(currentTrack || lastPlayedVideo)?.title}
            </span>
          </div>
          <span className="text-[10px] font-bold text-red-400 group-hover:text-red-300 transition-colors shrink-0">
            Mini Player ↗
          </span>
        </button>
      )}

      {/* YouTube Own Standard Web Full Video Player with Smooth Morph Transition */}
      <AnimatePresence>
        {isFullVideoPlayerOpen && (
          <YouTubeStandardWebPlayer
            key="yt-standard-web-player-modal"
            isOpen={isFullVideoPlayerOpen}
            track={currentTrack || lastPlayedVideo}
            isPlaying={isPlaying}
            onClose={() => {
              setIsFullVideoPlayerOpen(false);
              setIsVideoMiniPlayerOpen(true);
              setIsMiniPlayerDismissed(false);
              if (!currentTrack && lastPlayedVideo) {
                setCurrentTrack(lastPlayedVideo);
              }
            }}
            onMinimizeToMiniPlayer={() => {
              setIsFullVideoPlayerOpen(false);
              setIsVideoMiniPlayerOpen(true);
              setIsMiniPlayerDismissed(false);
              if (!currentTrack && lastPlayedVideo) {
                setCurrentTrack(lastPlayedVideo);
              }
            }}
            onTogglePlay={handleTogglePlay}
            onPlayTrack={(t) => {
              startActualPlayTrack(t);
              setIsVideoMiniPlayerOpen(false);
              setIsFullVideoPlayerOpen(true);
            }}
            onNextTrack={() => handleNextTrack()}
            onPrevTrack={() => handlePrevTrack()}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onOpenAddToPlaylist={(track) => setAddToPlaylistTrack(track)}
            onDownload={(track) => setDownloadTrack(track)}
            isFavorite={favorites.some(f => f.id === currentTrack?.id)}
            onToggleFavorite={handleToggleFavorite}
            isSubscribed={subscriptions.some(s => s.name.toLowerCase() === (currentTrack?.artist || currentTrack?.channel || '').toLowerCase())}
            onToggleSubscribe={handleToggleSubscribe}
            onShowToast={showToast}
            allTracks={DEFAULT_TRACKS}
            darkMode={darkMode}
            accentThemeId={accentThemeId}
            user={user}
            userName={user?.displayName || mobileAuthUser?.displayName || mobileAuthUser?.phoneNumber || 'Bikash Jana'}
            isAutoplayUpNext={isAutoplayUpNext}
            onToggleAutoplayUpNext={handleToggleAutoplayUpNext}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

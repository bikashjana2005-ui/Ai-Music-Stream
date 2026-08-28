import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, testFirebaseConnection, handleFirestoreError, OperationType, fetchYouTubeUserSubscriptions, fetchYouTubeChannelProfile, fetchYouTubeUserPlaylists, fetchYouTubeLikedVideos, fetchYouTubeWatchHistory, fetchYouTubeSyncAll, handleGoogleRedirectResult, loginAnonymously, loginWithGoogle } from './lib/firebase';
import { TabType, Track, Playlist, SubscribedChannel, DownloadedTrack, YouTubeChannelProfile } from './types';
import { DEFAULT_TRACKS, DEFAULT_CHANNELS, DEFAULT_LIKED_TRACKS, DEFAULT_HISTORY_TRACKS } from './data/fallbackTracks';
import { Navbar } from './components/Navbar';
import { AudioPlayerOverlay } from './components/AudioPlayerOverlay';
import { GlobalYouTubePlayer, PlayerEngine } from './components/GlobalYouTubePlayer';
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
import { HomeView } from './views/HomeView';
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
import { applyAccentTheme } from './utils/accentTheme';

const TAB_ORDER: TabType[] = ['search', 'subscriptions', 'downloads', 'library', 'settings'];

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const handleCompleteSplash = useCallback(() => {
    setShowSplash(false);
  }, []);
  const [pendingQualityTrack, setPendingQualityTrack] = useState<Track | null>(null);
  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    try {
      const saved = localStorage.getItem('aura_ai_last_active_tab');
      if (saved === 'home') return 'search';
      return (saved as TabType) || 'search';
    } catch {
      return 'search';
    }
  });
  const [tabDirection, setTabDirection] = useState<number>(1);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

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

  // Save activeTab to localStorage
  useEffect(() => {
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

  // Liquid Glass Accent Theme State
  const [accentThemeId, setAccentThemeId] = useState<string>(() => {
    return localStorage.getItem('aura_ai_accent_theme') || 'indigo';
  });

  const [customAccentHex, setCustomAccentHex] = useState<string>(() => {
    return localStorage.getItem('aura_ai_custom_accent_hex') || '#6366f1';
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
    return localStorage.getItem('aura_ai_audio_quality') || '320';
  });

  // Video Quality state
  const [videoQuality, setVideoQuality] = useState<string>(() => {
    return localStorage.getItem('aura_ai_video_quality') || '1080p';
  });

  const handleSetVideoQuality = (quality: string) => {
    setVideoQuality(quality);
    localStorage.setItem('aura_ai_video_quality', quality);
  };

  // Data Saver / Low Bandwidth Mode state
  const [isDataSaverMode, setIsDataSaverMode] = useState<boolean>(() => {
    return localStorage.getItem('aura_data_saver_mode') === 'true';
  });

  const handleToggleDataSaverMode = (enabled: boolean) => {
    setIsDataSaverMode(enabled);
    localStorage.setItem('aura_data_saver_mode', String(enabled));
    if (enabled) {
      setShowVideo(true); // Keep low-bandwidth audio+video stream active
      setAudioQuality('128');
      setVideoQuality('144p');
      showToast("⚡ Data Saver Mode ON — Low-bandwidth Audio+Video stream active (144p video & 128kbps audio)", "success");
    } else {
      setShowVideo(true);
      setAudioQuality('320');
      setVideoQuality('1080p');
      showToast("Data Saver Mode OFF — Full HD Video & 320kbps Audio restored", "info");
    }
  };
  const [autoPlayOnSelect, setAutoPlayOnSelect] = useState<boolean>(() => {
    const saved = localStorage.getItem('aura_ai_autoplay_select');
    return saved ? saved === 'true' : true;
  });
  const [isAutoplayUpNext, setIsAutoplayUpNext] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('aura_autoplay_upnext');
      return saved === 'true'; // Defaults to false (Stop automatic upnext video playback)
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
      return saved ? JSON.parse(saved) : DEFAULT_CHANNELS;
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

  // Track playback & audio stream state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(() => {
    try {
      const saved = localStorage.getItem('aura_ai_last_played_track');
      return saved ? JSON.parse(saved) : DEFAULT_TRACKS[0];
    } catch {
      return DEFAULT_TRACKS[0];
    }
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);
  const [isMiniPlayerDismissed, setIsMiniPlayerDismissed] = useState<boolean>(false);
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
  const [showVideo, setShowVideo] = useState<boolean>(true);
  const [isFullScreenVideo, setIsFullScreenVideo] = useState<boolean>(false);
  const [playerEngine, setPlayerEngine] = useState<PlayerEngine>(() => {
    return (localStorage.getItem('aura_player_engine') as PlayerEngine) || 'youtube-nocookie';
  });

  const handleChangePlayerEngine = (engine: PlayerEngine) => {
    setPlayerEngine(engine);
    localStorage.setItem('aura_player_engine', engine);
    showToast(`Switched player engine to ${engine.toUpperCase()}`, 'info');
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
    setPlaybackTime(Math.floor(playedSec));
  }, []);

  const handleDuration = useCallback((durationSec: number) => {
    const totalSecs = Math.floor(durationSec);
    setRealDuration(totalSecs);
    if (totalSecs > 0) {
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      const formatted = hrs > 0
        ? `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
        : `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      setCurrentTrack((prev) => prev ? { ...prev, duration: formatted } : null);
    }
  }, []);

  const handleSeek = useCallback((newTime: number) => {
    setPlaybackTime(newTime);
    setSeekToSeconds(newTime);
    setTimeout(() => setSeekToSeconds(null), 100);
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

  // Favorites (Liked) state from localStorage
  const [favorites, setFavorites] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('aura_ai_favorites');
      return saved ? JSON.parse(saved) : DEFAULT_LIKED_TRACKS;
    } catch {
      return DEFAULT_LIKED_TRACKS;
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

  // Watch history state from localStorage
  const [history, setHistory] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('aura_ai_history');
      return saved ? JSON.parse(saved) : DEFAULT_HISTORY_TRACKS;
    } catch {
      return DEFAULT_HISTORY_TRACKS;
    }
  });

  // Synchronize state refs for popstate listener to guarantee fresh values without stale closures
  const isFullScreenVideoRef = useRef(isFullScreenVideo);
  isFullScreenVideoRef.current = isFullScreenVideo;

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

      // 2. Close Full Video Player Mode if active
      if (isFullScreenVideoRef.current) {
        setIsFullScreenVideo(false);
        return;
      }

      // 3. Close Audio Player Overlay if active
      if (isOverlayOpenRef.current) {
        setIsOverlayOpen(false);
        return;
      }

      // 4. Clear Subscriptions Channel Filter if active
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

  // Push state when an overlay, full video, or modal opens so device back button pops it smoothly
  const anyModalOrOverlayOpen = !!(
    isFullScreenVideo ||
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

  // Smooth scroll to top when switching active views
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Function to sync Google account data (local <-> Firestore cloud <-> YouTube)
  const handleSyncGoogleAccount = useCallback(async (targetUser?: User | null, showNotification: boolean = true) => {
    const activeUser = targetUser || auth.currentUser || user;
    if (!activeUser) {
      if (showNotification) {
        showToast('Please sign in with Google to sync your account.', 'info');
      }
      return;
    }

    try {
      if (showNotification) {
        showToast('Syncing Google Account with Cloud...', 'info');
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

      // 4. Auto-sync YouTube subscriptions if access token is available
      const ytToken = sessionStorage.getItem('aura_yt_access_token');
      if (ytToken) {
        try {
          const ytChannels = await fetchYouTubeUserSubscriptions(ytToken);
          for (const ch of ytChannels) {
            await setDoc(doc(db, 'users', activeUser.uid, 'subscriptions', ch.id), {
              ...ch, userId: activeUser.uid, addedAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch (ytErr) {
          console.log("Could not auto-sync YouTube subscriptions:", ytErr);
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
        showToast(`Google account successfully synced (${activeUser.email || activeUser.displayName})`, 'success');
      }
    } catch (err) {
      console.error('Google account sync error:', err);
      if (showNotification) {
        showToast('Failed to sync Google account data.', 'error');
      }
    }
  }, [user]);

  // Real-time YouTube Subscription Sync from Google Account
  const handleSyncYouTubeSubscriptions = useCallback(async () => {
    setIsYouTubeSyncing(true);
    try {
      showToast('Syncing YouTube channels from Google Account...', 'info');
      let ytChannels: SubscribedChannel[] = [];
      try {
        ytChannels = await fetchYouTubeUserSubscriptions();
      } catch (tokenErr: any) {
        if (tokenErr?.message === 'NO_ACCESS_TOKEN' || tokenErr?.message === 'YOUTUBE_TOKEN_EXPIRED') {
          showToast('Authenticating with Google to fetch YouTube subscriptions...', 'info');
          const loginRes = await loginWithGoogle();
          if (loginRes?.accessToken) {
            ytChannels = await fetchYouTubeUserSubscriptions(loginRes.accessToken);
          } else {
            showToast('Google sign-in completed. Please tap Sync Channels again.', 'info');
            return;
          }
        } else {
          throw tokenErr;
        }
      }

      if (!ytChannels || ytChannels.length === 0) {
        showToast('No YouTube subscriptions found on this Google account.', 'info');
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
              syncedFromYouTube: true,
              syncedAt: new Date().toISOString()
            }, { merge: true });
          } catch (e) {
            console.warn('Could not persist synced channel to Firestore:', ch.name, e);
          }
        }
      }

      showToast(`⚡ Successfully synced ${ytChannels.length} YouTube channels!`, 'success');
    } catch (err: any) {
      console.warn('YouTube sync notice:', err?.message || err);
      if (err?.message === 'YOUTUBE_API_UNCONFIGURED') {
        showToast('YouTube API sync is currently being verified on Google Cloud. You can browse and add channels directly.', 'info');
      } else {
        showToast('YouTube sync notice: please ensure you are signed in with your Google account.', 'info');
      }
    } finally {
      setIsYouTubeSyncing(false);
    }
  }, [user, showToast]);

  // Real-time YouTube Liked Videos Sync
  const handleSyncYouTubeLiked = useCallback(async () => {
    setIsYouTubeSyncing(true);
    try {
      showToast('Syncing YouTube liked videos from Google Account...', 'info');
      let tracks: Track[] = [];
      try {
        tracks = await fetchYouTubeLikedVideos();
      } catch (tokenErr: any) {
        if (tokenErr?.message === 'NO_ACCESS_TOKEN' || tokenErr?.message === 'YOUTUBE_TOKEN_EXPIRED') {
          showToast('Authenticating with Google for Liked Videos...', 'info');
          const loginRes = await loginWithGoogle();
          if (loginRes?.accessToken) {
            tracks = await fetchYouTubeLikedVideos(loginRes.accessToken);
          } else {
            return;
          }
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
      showToast('Syncing YouTube playlists from Google Account...', 'info');
      let lists: Playlist[] = [];
      try {
        lists = await fetchYouTubeUserPlaylists();
      } catch (tokenErr: any) {
        if (tokenErr?.message === 'NO_ACCESS_TOKEN' || tokenErr?.message === 'YOUTUBE_TOKEN_EXPIRED') {
          showToast('Authenticating with Google for Playlists...', 'info');
          const loginRes = await loginWithGoogle();
          if (loginRes?.accessToken) {
            lists = await fetchYouTubeUserPlaylists(loginRes.accessToken);
          } else {
            return;
          }
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
    try {
      showToast('Syncing YouTube watch history from Google Account...', 'info');
      let tracks: Track[] = [];
      try {
        tracks = await fetchYouTubeWatchHistory();
      } catch (tokenErr: any) {
        if (tokenErr?.message === 'NO_ACCESS_TOKEN' || tokenErr?.message === 'YOUTUBE_TOKEN_EXPIRED') {
          showToast('Authenticating with Google for Watch History...', 'info');
          const loginRes = await loginWithGoogle();
          if (loginRes?.accessToken) {
            tracks = await fetchYouTubeWatchHistory(loginRes.accessToken);
          } else {
            return;
          }
        } else {
          throw tokenErr;
        }
      }

      if (tracks.length > 0) {
        setHistory((prev) => {
          const map = new Map<string, Track>();
          prev.forEach(t => map.set(t.id, t));
          tracks.forEach(t => map.set(t.id, t));
          return Array.from(map.values());
        });

        if (user) {
          for (const t of tracks) {
            try {
              await setDoc(doc(db, 'users', user.uid, 'history', t.id), {
                ...t,
                userId: user.uid,
                syncedFromYouTube: true,
                syncedAt: new Date().toISOString()
              }, { merge: true });
            } catch (e) {}
          }
        }
        showToast(`⚡ Synced ${tracks.length} YouTube history videos!`, 'success');
      } else {
        showToast('No watch history items found on your YouTube account.', 'info');
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
    try {
      showToast('Starting full real-time YouTube sync (channels, liked, playlists, history)...', 'info');
      let syncResult: any = null;
      try {
        syncResult = await fetchYouTubeSyncAll();
      } catch (tokenErr: any) {
        if (tokenErr?.message === 'NO_ACCESS_TOKEN' || tokenErr?.message === 'YOUTUBE_TOKEN_EXPIRED') {
          showToast('Authenticating with Google for Full YouTube Sync...', 'info');
          const loginRes = await loginWithGoogle();
          if (loginRes?.accessToken) {
            syncResult = await fetchYouTubeSyncAll(loginRes.accessToken);
          } else {
            return;
          }
        } else {
          throw tokenErr;
        }
      }

      if (syncResult) {
        if (syncResult.profile) {
          setYoutubeChannelProfile(syncResult.profile);
        }

        if (syncResult.subscriptions && Array.isArray(syncResult.subscriptions) && syncResult.subscriptions.length > 0) {
          setSubscriptions((prev) => {
            const map = new Map<string, SubscribedChannel>();
            prev.forEach(c => map.set(c.id, c));
            syncResult.subscriptions.forEach((c: SubscribedChannel) => map.set(c.id, c));
            return Array.from(map.values());
          });
        }

        if (syncResult.likedVideos && Array.isArray(syncResult.likedVideos) && syncResult.likedVideos.length > 0) {
          setFavorites((prev) => {
            const map = new Map<string, Track>();
            prev.forEach(t => map.set(t.id, t));
            syncResult.likedVideos.forEach((t: Track) => map.set(t.id, t));
            return Array.from(map.values());
          });
        }

        if (syncResult.playlists && Array.isArray(syncResult.playlists) && syncResult.playlists.length > 0) {
          setPlaylists((prev) => {
            const map = new Map<string, Playlist>();
            prev.forEach(p => map.set(p.id, p));
            syncResult.playlists.forEach((p: Playlist) => map.set(p.id, p));
            return Array.from(map.values());
          });
        }

        if (syncResult.history && Array.isArray(syncResult.history) && syncResult.history.length > 0) {
          setHistory((prev) => {
            const map = new Map<string, Track>();
            prev.forEach(t => map.set(t.id, t));
            syncResult.history.forEach((t: Track) => map.set(t.id, t));
            return Array.from(map.values());
          });
        }

        showToast('⚡ Full YouTube mobile real-time sync completed successfully!', 'success');
      }
    } catch (err: any) {
      console.warn('Full sync error:', err);
      showToast('YouTube sync notice: Ensure you are logged into Google.', 'info');
    } finally {
      setIsYouTubeSyncing(false);
    }
  }, [user, showToast]);

  // Firebase Authentication listener and Firestore real-time sync on startup / open
  useEffect(() => {
    testFirebaseConnection();
    
    // Check if coming back from Google OAuth redirect sign-in
    handleGoogleRedirectResult().then((res) => {
      if (res?.user) {
        showToast(`Signed in via Google! Welcome ${res.user.displayName || 'Music Listener'}.`, 'success');
      }
    }).catch((err) => {
      console.warn('Redirect sign-in result check:', err);
    });

    let isInitialLoad = true;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
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
          snapshot.forEach((docSnap) => {
            cloudSubs.push(docSnap.data() as SubscribedChannel);
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
        // Automatically perform quick automatic sign-in on app open if no active user session exists
        const hasAutoSignedIn = sessionStorage.getItem('aura_auto_signin_attempted');
        if (!hasAutoSignedIn) {
          sessionStorage.setItem('aura_auto_signin_attempted', 'true');
          loginAnonymously().then((autoUser) => {
            if (autoUser) {
              console.log('⚡ Instant automatic sign-in complete on app open:', autoUser.uid);
              showToast(`⚡ Automatically signed in as ${autoUser.displayName || 'Guest Listener'}`, 'success');
            }
          }).catch((err) => {
            console.warn('Auto sign-in on app open:', err);
          });
        }
      }
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

        // 5. Sync Last Played Track from localStorage
        const savedTrack = localStorage.getItem('aura_ai_last_played_track');
        if (savedTrack) {
          const parsedTrack: Track = JSON.parse(savedTrack);
          if (parsedTrack && parsedTrack.id) {
            setCurrentTrack(parsedTrack);
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

  // Sync last played track to localStorage
  useEffect(() => {
    if (currentTrack) {
      localStorage.setItem('aura_ai_last_played_track', JSON.stringify(currentTrack));
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

  const startActualPlayTrack = (track: Track) => {
    setIsMiniPlayerDismissed(false);
    setShowVideo(true);
    setIsFullScreenVideo(true);
    setIsOverlayOpen(false);
    if (currentTrack?.id === track.id) {
      // Resume playback
      setIsPlaying(true);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setPlaybackTime(0);
      setRealDuration(0);
    }
    // Record to watch history (deduplicated, latest first)
    setHistory((prev) => {
      const filtered = prev.filter(t => t.id !== track.id);
      return [track, ...filtered].slice(0, 30);
    });
  };

  const handlePlayTrack = (track: Track, forceDirect: boolean = false) => {
    const skipPrompt = localStorage.getItem('aura_skip_quality_prompt') === 'true';
    if (forceDirect || skipPrompt) {
      startActualPlayTrack(track);
    } else {
      setPendingQualityTrack(track);
    }
  };

  const handleConfirmQualityPlay = (track: Track, selectedQuality: QualityOptionId, dontShowAgain: boolean) => {
    if (selectedQuality === 'data_saver') {
      handleToggleDataSaverMode(true);
      showToast('⚡ Data saver applied: 144p streaming', 'info');
    } else if (selectedQuality === 'higher') {
      handleToggleDataSaverMode(false);
      handleSetVideoQuality('1080p');
      setAudioQuality('320');
      showToast('High quality (1080p) enabled', 'info');
    } else {
      handleToggleDataSaverMode(false);
      handleSetVideoQuality('auto');
      setAudioQuality('320');
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
    const exists = favorites.some(f => f.id === track.id);
    
    // Optimistic state update
    setFavorites((prev) => {
      if (exists) {
        return prev.filter(f => f.id !== track.id);
      } else {
        return [...prev, track];
      }
    });

    if (exists) {
      showToast(`Removed from Liked videos`, 'info');
    } else {
      showToast(`Added to Liked videos`, 'success');
    }

    // Sync to Firestore if logged in
    if (user) {
      const path = `users/${user.uid}/favorites/${track.id}`;
      try {
        if (exists) {
          await deleteDoc(doc(db, 'users', user.uid, 'favorites', track.id));
        } else {
          await setDoc(doc(db, 'users', user.uid, 'favorites', track.id), {
            ...track,
            userId: user.uid,
            addedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        handleFirestoreError(err, exists ? OperationType.DELETE : OperationType.WRITE, path);
      }
    }
  };

  const handleToggleSubscribe = async (channel: SubscribedChannel) => {
    const channelName = channel?.name || 'Channel';
    const channelId = channel?.id || '';
    const exists = subscriptions.some(s => s.id === channelId || (s.name || '').toLowerCase() === channelName.toLowerCase());
    
    // Instant optimistic state update
    setSubscriptions((prev) => {
      if (exists) {
        return prev.filter(s => s.id !== channelId && (s.name || '').toLowerCase() !== channelName.toLowerCase());
      } else {
        return [...prev, channel];
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
      const cleanId = channel.id || `ch-${Date.now()}`;
      const path = `users/${user.uid}/subscriptions/${cleanId}`;
      try {
        if (exists) {
          await deleteDoc(doc(db, 'users', user.uid, 'subscriptions', cleanId));
        } else {
          await setDoc(doc(db, 'users', user.uid, 'subscriptions', cleanId), {
            ...channel,
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

  // Next / Prev Track handling
  const handleNextTrack = () => {
    const list = DEFAULT_TRACKS;
    if (!currentTrack) return;
    const idx = list.findIndex(t => t.id === currentTrack.id);
    const nextIdx = (idx + 1) % list.length;
    setCurrentTrack(list[nextIdx]);
    setIsPlaying(true);
  };

  const handleTrackEnded = () => {
    if (isAutoplayUpNext) {
      handleNextTrack();
    } else {
      setIsPlaying(false);
      showToast('Video playback completed • Autoplay is OFF', 'info');
    }
  };

  const handlePrevTrack = () => {
    const list = DEFAULT_TRACKS;
    if (!currentTrack) return;
    const idx = list.findIndex(t => t.id === currentTrack.id);
    const prevIdx = (idx - 1 + list.length) % list.length;
    setCurrentTrack(list[prevIdx]);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors selection:bg-indigo-500 selection:text-white relative overflow-x-hidden flex flex-col items-center justify-start w-full">
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={handleCompleteSplash} />}
      </AnimatePresence>
      
      {/* iOS Liquid Glass Ambient Background Mesh Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] animate-liquid-orb-1" 
          style={{ backgroundColor: 'var(--accent-orb-1)' }}
        />
        <div 
          className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[140px] animate-liquid-orb-2" 
          style={{ backgroundColor: 'var(--accent-orb-2)' }}
        />
        <div 
          className="absolute bottom-[-10%] left-[20%] w-[550px] h-[550px] rounded-full blur-[130px] animate-liquid-orb-1" 
          style={{ backgroundColor: 'var(--accent-orb-1)' }}
        />
      </div>


      {/* Toast Overlay */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Direct APK & WebAPK Installer Prompt */}
      <PWAInstallBanner showToast={showToast} />

      {/* Main Header & Shifted Bottom Dock Navbar */}
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
        isDataSaverMode={isDataSaverMode}
        onToggleDataSaverMode={handleToggleDataSaverMode}
        userName={user?.displayName || 'Bikash Jana'}
      />

      {/* Primary Main Content Area */}
      <main className="mx-auto pt-0 pb-20 w-full flex flex-col items-center justify-start self-center overflow-x-hidden max-w-full min-h-screen px-0 sm:px-4 lg:px-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="w-full min-h-[70vh] flex flex-col items-center justify-start self-center will-change-transform"
          >
            {activeTab === 'home' && (
              <HomeView
                onPlay={handlePlayTrack}
                onDownload={(track) => setDownloadTrack(track)}
                currentTrackId={currentTrack?.id}
                favorites={favorites}
                history={history}
                onClearHistory={handleClearHistory}
                onToggleFavorite={handleToggleFavorite}
                onOpenAddToPlaylist={(track) => setAddToPlaylistTrack(track)}
                onOpenMetadata={(track) => setMetadataTrack(track)}
                onOpenChannelDetails={(ch) => setSelectedChannelForDetails(ch)}
                onShowToast={showToast}
              />
            )}

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
                userName={user?.displayName || 'Bikash Jana'}
                userEmail={user?.email || 'bikashjana2005@gmail.com'}
                userPhoto={user?.photoURL || undefined}
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
                setAutoPlayOnSelect={setAutoPlayOnSelect}
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

      {/* Full Screen Audio Stream Player Overlay */}
      {isOverlayOpen && currentTrack && (
        <AudioPlayerOverlay
          track={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onClose={() => setIsOverlayOpen(false)}
          onDownload={(track) => setDownloadTrack(track)}
          onPlayTrack={handlePlayTrack}
          onNextTrack={handleNextTrack}
          onPrevTrack={handlePrevTrack}
          isFavorite={favorites.some(f => f.id === currentTrack.id)}
          onToggleFavorite={handleToggleFavorite}
          onOpenAddToPlaylist={(track) => setAddToPlaylistTrack(track)}
          onOpenMetadata={(track) => setMetadataTrack(track)}
          volume={volume}
          setVolume={setVolume}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          showVideo={showVideo}
          setShowVideo={setShowVideo}
          onShowToast={showToast}
          audioQuality={audioQuality}
          playbackTime={playbackTime}
          realDuration={realDuration}
          onSeek={handleSeek}
          playerEngine={playerEngine}
          onChangePlayerEngine={handleChangePlayerEngine}
          isDataSaverMode={isDataSaverMode}
          onToggleDataSaverMode={handleToggleDataSaverMode}
          onToggleFullScreen={() => {
            setIsOverlayOpen(false);
            setShowVideo(true);
            setIsFullScreenVideo(true);
          }}
        />
      )}

      {/* Persistent Global YouTube Video & Audio Player */}
      {currentTrack && (
        <GlobalYouTubePlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          volume={volume}
          isMuted={isMuted}
          showVideo={showVideo}
          isOverlayOpen={isOverlayOpen}
          isFullScreen={isFullScreenVideo}
          onToggleFullScreen={() => setIsFullScreenVideo(prev => !prev)}
          onTrackEnded={handleTrackEnded}
          isAutoplay={isAutoplayUpNext}
          onToggleAutoplay={handleToggleAutoplayUpNext}
          audioQuality={audioQuality}
          isDataSaverMode={isDataSaverMode}
          onOpenOverlay={() => setIsOverlayOpen(true)}
          onCloseVideo={() => {
            setShowVideo(false);
            setIsFullScreenVideo(false);
          }}
          onProgress={handleProgress}
          onDuration={handleDuration}
          seekToSeconds={seekToSeconds}
          playerEngine={playerEngine}
          onChangePlayerEngine={handleChangePlayerEngine}
          onPlayTrack={handlePlayTrack}
          onDownloadTrack={(track) => setDownloadTrack(track)}
          onOpenAddToPlaylist={(track) => setAddToPlaylistTrack(track)}
          isFavorite={favorites.some(f => f.id === currentTrack.id)}
          onToggleFavorite={handleToggleFavorite}
          isSubscribed={subscriptions.some(s => (s?.name || '').toLowerCase() === (currentTrack?.channel || '').toLowerCase())}
          onToggleSubscribe={handleToggleSubscribe}
          onShowToast={showToast}
          isOnline={isOnline}
          downloadedTracks={downloadedTracks}
          darkMode={darkMode}
        />
      )}

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
          showToast(`Downloaded "${track.title}" - Playing video now!`, 'success');
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



    </div>
  );
}

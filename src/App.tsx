import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, testFirebaseConnection, handleFirestoreError, OperationType, fetchYouTubeUserSubscriptions, handleGoogleRedirectResult } from './lib/firebase';
import { TabType, Track, Playlist, SubscribedChannel, DownloadedTrack } from './types';
import { DEFAULT_TRACKS, DEFAULT_CHANNELS } from './data/fallbackTracks';
import { Navbar } from './components/Navbar';
import { AudioPlayerOverlay } from './components/AudioPlayerOverlay';
import { GlobalYouTubePlayer, PlayerEngine } from './components/GlobalYouTubePlayer';
import { DownloadModal } from './components/DownloadModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { ShareAppModal } from './components/ShareAppModal';
import { ChannelSubscriptionsModal } from './components/ChannelSubscriptionsModal';
import { UserAuthModal } from './components/UserAuthModal';
import { YouTubeMetadataModal } from './components/YouTubeMetadataModal';
import { Toast } from './components/Toast';
import { HomeView } from './views/HomeView';
import { SubscriptionsView } from './views/SubscriptionsView';
import { SearchView } from './views/SearchView';
import { LibraryView } from './views/LibraryView';
import { SettingsView } from './views/SettingsView';
import { DownloadsView } from './views/DownloadsView';
import { SplashScreen } from './components/SplashScreen';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { applyAccentTheme } from './utils/accentTheme';

const TAB_ORDER: TabType[] = ['home', 'search', 'subscriptions', 'library', 'downloads', 'settings'];

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const handleCompleteSplash = useCallback(() => {
    setShowSplash(false);
  }, []);
  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    try {
      const saved = localStorage.getItem('aura_ai_last_active_tab');
      return (saved as string) === 'facebook' ? 'home' : (saved as TabType) || 'home';
    } catch {
      return 'home';
    }
  });
  const [tabDirection, setTabDirection] = useState<number>(1);

  const handleTabChange = useCallback((newTab: TabType) => {
    setActiveTabState((currentTab) => {
      if (currentTab === newTab) return currentTab;
      const currentIndex = TAB_ORDER.indexOf(currentTab);
      const newIndex = TAB_ORDER.indexOf(newTab);
      setTabDirection(newIndex >= currentIndex ? 1 : -1);
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
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string | null>(null);

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

  // Favorites state from localStorage
  const [favorites, setFavorites] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('aura_ai_favorites');
      return saved ? JSON.parse(saved) : [DEFAULT_TRACKS[0], DEFAULT_TRACKS[1]];
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
      return saved ? JSON.parse(saved) : [DEFAULT_TRACKS[0], DEFAULT_TRACKS[1]];
    } catch {
      return [DEFAULT_TRACKS[0]];
    }
  });

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
        // Run automatic guest/local state sync when app opens for first time
        const hasSyncedOnOpen = sessionStorage.getItem('aura_auto_synced_on_open');
        if (!hasSyncedOnOpen) {
          sessionStorage.setItem('aura_auto_synced_on_open', 'true');
          showToast('⚡ Application opened — Automatic sync complete', 'success');
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

  const handlePlayTrack = (track: Track) => {
    setIsMiniPlayerDismissed(false);
    setShowVideo(true);
    setIsFullScreenVideo(true);
    if (currentTrack?.id === track.id) {
      // Toggle or keep paused as requested
      setIsPlaying(false);
    } else {
      setCurrentTrack(track);
      setIsPlaying(false);
      setPlaybackTime(0);
      setRealDuration(0);
    }
    // Record to watch history (deduplicated, latest first)
    setHistory((prev) => {
      const filtered = prev.filter(t => t.id !== track.id);
      return [track, ...filtered].slice(0, 30);
    });
    setIsOverlayOpen(true);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('aura_ai_history');
    showToast("Watch history cleared", "info");
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
      showToast(`Removed "${track.title}" from Favorites`, 'info');
    } else {
      showToast(`Added "${track.title}" to Favorites`, 'success');
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
    const channelName = channel?.name || '';
    const channelId = channel?.id || '';
    const exists = subscriptions.some(s => s.id === channelId || (s.name || '').toLowerCase() === channelName.toLowerCase());
    
    // Optimistic state update
    setSubscriptions((prev) => {
      if (exists) {
        return prev.filter(s => s.id !== channelId && (s.name || '').toLowerCase() !== channelName.toLowerCase());
      } else {
        return [...prev, channel];
      }
    });

    // Sync to Firestore if logged in
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

  // Next / Prev Track handling
  const handleNextTrack = () => {
    const list = DEFAULT_TRACKS;
    if (!currentTrack) return;
    const idx = list.findIndex(t => t.id === currentTrack.id);
    const nextIdx = (idx + 1) % list.length;
    setCurrentTrack(list[nextIdx]);
    setIsPlaying(true);
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
        onOpenShareModal={() => setIsShareModalOpen(true)}
        isDataSaverMode={isDataSaverMode}
        onToggleDataSaverMode={handleToggleDataSaverMode}
      />

      {/* Primary Main Content Area */}
      <main className="mx-auto pt-2 sm:pt-4 pb-28 w-full flex flex-col items-center justify-start self-center overflow-x-hidden max-w-full min-h-screen px-0 sm:px-4 lg:px-6">
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
                subscriptions={subscriptions}
                onOpenSubscriptionsModal={() => setIsSubscriptionsModalOpen(true)}
                onToggleSubscribe={handleToggleSubscribe}
                selectedChannelFilter={selectedChannelFilter}
                setSelectedChannelFilter={setSelectedChannelFilter}
                onShowToast={showToast}
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
                onToggleFavorite={handleToggleFavorite}
                playlists={playlists}
                onCreatePlaylist={handleCreatePlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                onRemoveTrackFromPlaylist={handleRemoveFromPlaylist}
                onOpenAddToPlaylist={(track) => setAddToPlaylistTrack(track)}
                onOpenMetadata={(track) => setMetadataTrack(track)}
                onShowToast={showToast}
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
                onSyncGoogleAccount={handleSyncGoogleAccount}
                favoritesCount={favorites.length}
                subscriptionsCount={subscriptions.length}
                playlistsCount={playlists.length}
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
          onToggleFullScreen={() => setIsFullScreenVideo(prev => !prev)}
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
          onTrackEnded={handleNextTrack}
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
          isSubscribed={subscriptions.some(s => (s.name || '').toLowerCase() === (currentTrack.channel || '').toLowerCase())}
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



    </div>
  );
}

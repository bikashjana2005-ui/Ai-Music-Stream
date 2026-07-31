import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, testFirebaseConnection, handleFirestoreError, OperationType, fetchYouTubeUserSubscriptions } from './lib/firebase';
import { TabType, Track, Playlist, SubscribedChannel, DownloadedTrack } from './types';
import { DEFAULT_TRACKS, DEFAULT_CHANNELS } from './data/fallbackTracks';
import { Navbar } from './components/Navbar';
import { AudioPlayerOverlay } from './components/AudioPlayerOverlay';
import { GlobalYouTubePlayer } from './components/GlobalYouTubePlayer';
import { DownloadModal } from './components/DownloadModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { ShareAppModal } from './components/ShareAppModal';
import { ChannelSubscriptionsModal } from './components/ChannelSubscriptionsModal';
import { UserAuthModal } from './components/UserAuthModal';
import { Toast } from './components/Toast';
import { HomeView } from './views/HomeView';
import { SubscriptionsView } from './views/SubscriptionsView';
import { SearchView } from './views/SearchView';
import { LibraryView } from './views/LibraryView';
import { SettingsView } from './views/SettingsView';
import { DownloadsView } from './views/DownloadsView';
import { SplashScreen } from './components/SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('home');
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
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('aura_ai_theme');
    return saved ? saved === 'dark' : true;
  });

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

  // Auto play on track select state
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
  const [currentTrack, setCurrentTrack] = useState<Track | null>(DEFAULT_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);
  const [isMiniPlayerDismissed, setIsMiniPlayerDismissed] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showVideo, setShowVideo] = useState<boolean>(true);

  // Download Modal track & playlist
  const [downloadTrack, setDownloadTrack] = useState<Track | null>(null);
  const [downloadPlaylist, setDownloadPlaylist] = useState<Playlist | null>(null);

  // Add To Playlist Modal track
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<Track | null>(null);

  // Share Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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

  // Firebase Authentication listener and Firestore real-time sync
  useEffect(() => {
    testFirebaseConnection();
    
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        console.log('Firebase user logged in:', currentUser.uid);

        // Auto-sync local data to cloud
        const syncLocalToCloud = async () => {
          try {
            const savedFavs = localStorage.getItem('aura_ai_favorites');
            if (savedFavs) {
              const localFavs: Track[] = JSON.parse(savedFavs);
              for (const track of localFavs) {
                await setDoc(doc(db, 'users', currentUser.uid, 'favorites', track.id), {
                  ...track, userId: currentUser.uid, addedAt: track.addedAt || new Date().toISOString()
                }, { merge: true });
              }
            }

            const savedPlaylists = localStorage.getItem('aura_ai_playlists');
            if (savedPlaylists) {
              const localPlay: Playlist[] = JSON.parse(savedPlaylists);
              for (const p of localPlay) {
                await setDoc(doc(db, 'users', currentUser.uid, 'playlists', p.id), {
                  ...p, userId: currentUser.uid
                }, { merge: true });
              }
            }

            const savedSubs = localStorage.getItem('aura_ai_subscriptions');
            if (savedSubs) {
              const localSubs: SubscribedChannel[] = JSON.parse(savedSubs);
              for (const sub of localSubs) {
                await setDoc(doc(db, 'users', currentUser.uid, 'subscriptions', sub.id), {
                  ...sub, userId: currentUser.uid, addedAt: new Date().toISOString()
                }, { merge: true });
              }
            }

            // Also auto-sync YouTube subscriptions if access token is available in session
            const ytToken = sessionStorage.getItem('aura_yt_access_token');
            if (ytToken) {
              try {
                const ytChannels = await fetchYouTubeUserSubscriptions(ytToken);
                for (const ch of ytChannels) {
                  await setDoc(doc(db, 'users', currentUser.uid, 'subscriptions', ch.id), {
                    ...ch, userId: currentUser.uid, addedAt: new Date().toISOString()
                  }, { merge: true });
                }
                console.log("YouTube account subscriptions automatically synced.");
              } catch (ytErr) {
                console.log("Could not auto-sync YouTube subscriptions:", ytErr);
              }
            }

            console.log("Local data automatically synced to Google account.");
          } catch (e) {
            console.error("Auto-sync failed:", e);
          }
        };

        syncLocalToCloud();

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

        return () => {
          unsubSubs();
          unsubFavs();
          unsubPlay();
        };
      }
    });

    return () => unsubscribeAuth();
  }, []);

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

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handlePlayTrack = (track: Track) => {
    setIsMiniPlayerDismissed(false);
    setShowVideo(true);
    if (currentTrack?.id === track.id) {
      setIsPlaying(true);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
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
    const exists = subscriptions.some(s => s.id === channel.id || s.name.toLowerCase() === channel.name.toLowerCase());
    
    // Optimistic state update
    setSubscriptions((prev) => {
      if (exists) {
        return prev.filter(s => s.id !== channel.id && s.name.toLowerCase() !== channel.name.toLowerCase());
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>
      
      {/* iOS Liquid Glass Ambient Background Mesh Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/20 dark:bg-indigo-600/15 blur-[120px] animate-liquid-orb-1" />
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/15 dark:bg-purple-600/15 blur-[140px] animate-liquid-orb-2" />
        <div className="absolute bottom-[-10%] left-[20%] w-[550px] h-[550px] rounded-full bg-rose-500/15 dark:bg-rose-600/10 blur-[130px] animate-liquid-orb-1" />
      </div>

      {/* Global Seamless YouTube Audio Stream Engine */}
      <GlobalYouTubePlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        volume={volume}
        isMuted={isMuted}
        showVideo={showVideo}
        onTrackEnded={handleNextTrack}
        audioQuality={audioQuality}
      />

      {/* Toast Overlay */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Main Header & Shifted Bottom Dock Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
      />

      {/* Primary Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 pb-28 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                darkMode={darkMode}
                setDarkMode={setDarkMode}
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
                favoritesCount={favorites.length}
                subscriptionsCount={subscriptions.length}
                playlistsCount={playlists.length}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Persistent Global YouTube Video & Audio Player */}
      {currentTrack && (
        <GlobalYouTubePlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          volume={volume}
          isMuted={isMuted}
          showVideo={showVideo}
          isOverlayOpen={isOverlayOpen}
          onTrackEnded={handleNextTrack}
          audioQuality={audioQuality}
          onOpenOverlay={() => setIsOverlayOpen(true)}
          onCloseVideo={() => setShowVideo(false)}
        />
      )}

      {/* Full Screen Audio Stream Player Overlay */}
      {isOverlayOpen && currentTrack && (
        <AudioPlayerOverlay
          track={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onClose={() => setIsOverlayOpen(false)}
          onDownload={(track) => setDownloadTrack(track)}
          onNextTrack={handleNextTrack}
          onPrevTrack={handlePrevTrack}
          isFavorite={favorites.some(f => f.id === currentTrack.id)}
          onToggleFavorite={handleToggleFavorite}
          onOpenAddToPlaylist={(track) => setAddToPlaylistTrack(track)}
          volume={volume}
          setVolume={setVolume}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          showVideo={showVideo}
          setShowVideo={setShowVideo}
          onShowToast={showToast}
          audioQuality={audioQuality}
        />
      )}

      {/* Download Options Modal (Track or Full Playlist) */}
      {(downloadTrack || downloadPlaylist) && (
        <DownloadModal
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
          }}
        />
      )}

      {/* Add To Playlist Modal */}
      {addToPlaylistTrack && (
        <AddToPlaylistModal
          track={addToPlaylistTrack}
          playlists={playlists}
          onClose={() => setAddToPlaylistTrack(null)}
          onAddToPlaylist={handleAddToPlaylist}
          onCreatePlaylist={handleCreatePlaylist}
          onShowToast={showToast}
        />
      )}

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

      {/* Firebase User Auth & Cloud Sync Modal */}
      <UserAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        onShowToast={showToast}
        favoritesCount={favorites.length}
        subscriptionsCount={subscriptions.length}
        playlistsCount={playlists.length}
      />

    </div>
  );
}

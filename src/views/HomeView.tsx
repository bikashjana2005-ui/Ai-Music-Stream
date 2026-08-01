import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  List, 
  Music,
  Compass,
  Loader2,
  Sparkles,
  RefreshCw,
  Play,
  Flame,
  ThumbsUp,
  Volume2
} from 'lucide-react';
import { Track } from '../types';
import { DEFAULT_TRACKS } from '../data/fallbackTracks';
import { TrackCard } from '../components/TrackCard';

interface HomeViewProps {
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  currentTrackId?: string;
  favorites: Track[];
  history?: Track[];
  onClearHistory?: () => void;
  onToggleFavorite: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const YOUTUBE_HOME_CATEGORIES = [
  { id: 'all', label: 'All', query: '' },
  { id: 'hindi', label: 'Bollywood Hits', query: 'Bollywood Romantic Hits' },
  { id: 'bengali', label: 'Bengali Songs', query: 'Bengali Romantic Songs' },
  { id: 'lofi', label: 'Lofi & Chill', query: 'Lofi Beats Desi' },
  { id: 'live', label: 'Live Concerts', query: 'Live Concert Music' },
  { id: 'remix', label: 'Remixes & Edits', query: 'Bollywood Remixes' },
  { id: 'romantic', label: 'Romantic', query: 'Romantic Songs Arijit' },
  { id: 'arijit', label: 'Arijit Singh Specials', query: 'Arijit Singh Hits' }
];

export const HomeView: React.FC<HomeViewProps> = ({
  onPlay,
  onDownload,
  currentTrackId,
  favorites,
  history = [],
  onToggleFavorite,
  onOpenAddToPlaylist,
  onShowToast
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [loading, setLoading] = useState<boolean>(false);

  // Recommended videos state
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);

  // View format toggle state (grid vs list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('aura_view_mode') as 'grid' | 'list') || 'grid';
  });

  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('aura_view_mode', mode);
  };

  // Fetch YouTube recommendations based on user history or trending music
  const fetchRecommendations = async (silent: boolean = false) => {
    if (!silent) setLoadingRecs(true);
    try {
      // Determine recommendation seed topic from user's history or favorites
      let mood = "Bollywood Romantic Hits";
      let trackTitle = "";
      let channel = "";

      if (history.length > 0) {
        const lastTrack = history[0];
        trackTitle = lastTrack.title;
        channel = lastTrack.channel;
      } else if (favorites.length > 0) {
        mood = favorites[0].title;
      }

      const res = await fetch("/api/music/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, trackTitle, channel })
      });

      const data = await res.json();
      if (data.tracks && data.tracks.length > 0) {
        setRecommendedTracks(data.tracks);
        if (silent) onShowToast("Updated recommended video feed", "info");
      } else {
        setRecommendedTracks(DEFAULT_TRACKS.slice(0, 6));
      }
    } catch {
      setRecommendedTracks(DEFAULT_TRACKS.slice(0, 6));
    } finally {
      if (!silent) setLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [history.length, favorites.length]);

  // Fetch YouTube category streams
  const handleSelectCategory = async (catId: string, catQuery: string) => {
    setSelectedCategory(catId);
    if (catId === 'all' || !catQuery) {
      setTracks(DEFAULT_TRACKS);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/music/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: catQuery, filter: 'all' })
      });
      const data = await res.json();
      if (data.tracks && data.tracks.length > 0) {
        setTracks(data.tracks);
      } else {
        // Fallback filter
        const filtered = DEFAULT_TRACKS.filter(t => 
          t.title.toLowerCase().includes(catId) || 
          t.genre?.toLowerCase().includes(catId) ||
          t.channel.toLowerCase().includes(catId)
        );
        setTracks(filtered.length > 0 ? filtered : DEFAULT_TRACKS);
      }
    } catch {
      setTracks(DEFAULT_TRACKS);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayRecommendedMix = () => {
    if (recommendedTracks.length > 0) {
      onPlay(recommendedTracks[0]);
      onShowToast("Playing your YouTube Recommended Mix!", "success");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24 max-w-6xl mx-auto w-full">
      
      {/* 1. YouTube-Style Horizontal Category Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {YOUTUBE_HOME_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleSelectCategory(cat.id, cat.query)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 active:scale-95 ${
              selectedCategory === cat.id
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-gray-200/80 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 2. YOUTUBE RECOMMENDED FOR YOU SECTION */}
      <div className="space-y-3 bg-gradient-to-r from-rose-950/20 via-slate-900/40 to-slate-900/20 p-4 rounded-3xl border border-rose-500/20 shadow-md">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-500/20 rounded-xl text-rose-400">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Recommended Videos for You</span>
                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  YouTube Mix
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                Tailored based on your listening history & liked music
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {recommendedTracks.length > 0 && (
              <button
                onClick={handlePlayRecommendedMix}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-full shadow-md flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Play size={12} className="fill-white" />
                <span>Play Mix</span>
              </button>
            )}

            <button
              onClick={() => fetchRecommendations(true)}
              disabled={loadingRecs}
              className="p-2 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-full transition-all active:scale-95 disabled:opacity-50"
              title="Refresh recommendations"
            >
              <RefreshCw size={13} className={loadingRecs ? "animate-spin text-rose-500" : ""} />
            </button>
          </div>
        </div>

        {/* Recommended Tracks Horizontal Scroll / Grid */}
        {loadingRecs ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={`rec-skel-${i}`}
                className="w-48 h-40 bg-gray-300/40 dark:bg-slate-800/60 animate-pulse rounded-2xl shrink-0" 
              />
            ))}
          </div>
        ) : recommendedTracks.length > 0 ? (
          <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1">
            {recommendedTracks.map((track) => (
              <div 
                key={`home-rec-${track.id}`}
                className="w-52 shrink-0 group"
              >
                <TrackCard
                  track={track}
                  onPlay={onPlay}
                  onDownload={onDownload}
                  isPlayingCurrent={currentTrackId === track.id}
                  isFavorite={favorites.some((f) => f.id === track.id)}
                  onToggleFavorite={onToggleFavorite}
                  onOpenAddToPlaylist={onOpenAddToPlaylist}
                  viewMode="grid"
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* 3. Discover Videos Feed Header */}
      <div className="w-full flex items-center justify-between px-1 pt-2">
        <div className="flex items-center gap-2">
          <Compass size={16} className="text-rose-500" />
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
            Explore All ({tracks.length})
          </span>
          {loading && <Loader2 size={13} className="animate-spin text-rose-500" />}
        </div>

        {/* Grid / List view toggle */}
        <div className="bg-gray-100 dark:bg-slate-800 p-0.5 rounded-xl border border-gray-200/60 dark:border-white/10 flex items-center gap-0.5">
          <button
            onClick={() => handleToggleViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
            }`}
            title="Grid View"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => handleToggleViewMode('list')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
            }`}
            title="List View"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* 4. YouTube-Style Video Grid or List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div 
              key={`home-skel-${i}`} 
              className="bg-gray-200/60 dark:bg-slate-800/60 animate-pulse rounded-2xl h-52 p-3 border border-gray-300/30 dark:border-white/5" 
            />
          ))}
        </div>
      ) : tracks.length > 0 ? (
        <div className={
          viewMode === 'grid'
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full"
            : "grid grid-cols-1 md:grid-cols-2 gap-3 w-full"
        }>
          {tracks.map((track) => (
            <TrackCard
              key={`home-track-${track.id}`}
              track={track}
              onPlay={onPlay}
              onDownload={onDownload}
              isPlayingCurrent={currentTrackId === track.id}
              isFavorite={favorites.some((f) => f.id === track.id)}
              onToggleFavorite={onToggleFavorite}
              onOpenAddToPlaylist={onOpenAddToPlaylist}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-2 bg-white/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 w-full">
          <Music size={32} className="text-gray-400 mx-auto" />
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No tracks available</p>
        </div>
      )}

    </div>
  );
};

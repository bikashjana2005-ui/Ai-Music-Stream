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
  Volume2,
  Radio,
  Shuffle,
  Heart,
  History,
  TrendingUp,
  Zap,
  Coffee,
  Headphones,
  Mic2,
  Disc,
  ArrowRight,
  Download,
  MoreVertical
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
  onOpenMetadata?: (track: Track) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const RECOMMENDATION_CATEGORIES = [
  { id: 'all', label: 'All Recommendations', query: '' },
  { id: 'foryou', label: '✨ For You', query: 'Popular Romantic Bollywood Songs' },
  { id: 'mix', label: '🔥 YouTube Mix', query: 'Top Trending Music Hits' },
  { id: 'hindi', label: 'Bollywood Hits', query: 'Bollywood Romantic Hits' },
  { id: 'bengali', label: 'Bengali Melodies', query: 'Bengali Romantic Songs' },
  { id: 'lofi', label: '☕ Lofi & Chill', query: 'Lofi Beats Desi' },
  { id: 'live', label: '🎙️ Live & Unplugged', query: 'Live Concert Music' },
  { id: 'romantic', label: '❤️ Romantic Specials', query: 'Romantic Songs Arijit' },
  { id: 'arijit', label: 'Arijit Singh Hits', query: 'Arijit Singh Hits' }
];

// Quick Pick Mix Presets
const QUICK_PICK_MIXES = [
  {
    id: 'qp-1',
    title: 'Arijit Singh Romantics',
    subtitle: 'Kesariya, Mon Majhi Re & more',
    gradient: 'from-rose-600 to-pink-600',
    icon: Heart,
    query: 'Arijit Singh Romantic Hits'
  },
  {
    id: 'qp-2',
    title: 'Lofi Beats & Chill',
    subtitle: 'Late night study & relax vibes',
    gradient: 'from-purple-600 to-indigo-600',
    icon: Coffee,
    query: 'Lofi Beats Chill Hindi'
  },
  {
    id: 'qp-3',
    title: 'Bollywood Dance Party',
    subtitle: 'Upbeat energetic dance hits',
    gradient: 'from-amber-500 to-rose-600',
    icon: Flame,
    query: 'Bollywood Dance Party Hits'
  },
  {
    id: 'qp-4',
    title: 'Coke Studio Unplugged',
    subtitle: 'Soulful fusion & Coke Studio',
    gradient: 'from-emerald-600 to-teal-600',
    icon: Mic2,
    query: 'Coke Studio Bangla India'
  },
  {
    id: 'qp-5',
    title: 'Bengali Classics & Pop',
    subtitle: 'Top SVF & Jeet Gannguli hits',
    gradient: 'from-blue-600 to-cyan-600',
    icon: Disc,
    query: 'Top Bengali Romantic Songs'
  },
  {
    id: 'qp-6',
    title: 'Acoustic & Guitar Covers',
    subtitle: 'Stripped down acoustic sessions',
    gradient: 'from-violet-600 to-fuchsia-600',
    icon: Headphones,
    query: 'Acoustic Guitar Songs Hindi'
  }
];

export const HomeView: React.FC<HomeViewProps> = ({
  onPlay,
  onDownload,
  currentTrackId,
  favorites,
  history = [],
  onClearHistory,
  onToggleFavorite,
  onOpenAddToPlaylist,
  onOpenMetadata,
  onShowToast
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [loading, setLoading] = useState<boolean>(false);

  // Recommended tracks feed
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
        if (silent) onShowToast("Updated recommendations feed", "info");
      } else {
        setRecommendedTracks(DEFAULT_TRACKS);
      }
    } catch {
      setRecommendedTracks(DEFAULT_TRACKS);
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
        const filtered = DEFAULT_TRACKS.filter(t => 
          (t.title || '').toLowerCase().includes(catId) || 
          t.genre?.toLowerCase().includes(catId) ||
          (t.channel || '').toLowerCase().includes(catId)
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
      onShowToast("Playing your Recommendation Mix!", "success");
    }
  };

  const handlePlayQuickMix = async (query: string, title: string) => {
    onShowToast(`Loading ${title}...`, 'info');
    setLoading(true);
    try {
      const res = await fetch("/api/music/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, filter: 'all' })
      });
      const data = await res.json();
      if (data.tracks && data.tracks.length > 0) {
        setTracks(data.tracks);
        onPlay(data.tracks[0]);
        onShowToast(`Playing ${title}`, 'success');
      } else {
        onPlay(DEFAULT_TRACKS[0]);
      }
    } catch {
      onPlay(DEFAULT_TRACKS[0]);
    } finally {
      setLoading(false);
    }
  };

  const seedTrackName = history.length > 0 ? history[0].title : (favorites.length > 0 ? favorites[0].title : "Kesariya");

  return (
    <div className="space-y-7 animate-fade-in pb-28 max-w-6xl mx-auto w-full">
      
      {/* 1. YOUTUBE / SPOTIFY STYLE CATEGORY PILL FILTER BAR */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {RECOMMENDATION_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleSelectCategory(cat.id, cat.query)}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all shrink-0 active:scale-95 flex items-center gap-1.5 ${
              selectedCategory === cat.id
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-white/80 dark:bg-slate-900/80 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800 border border-gray-200/80 dark:border-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* CATEGORY TRACKS RESULTS (IF SPECIFIC CATEGORY SELECTED) */}
      {selectedCategory !== 'all' && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span>Category Tracks ({tracks.length})</span>
              {loading && <Loader2 size={14} className="animate-spin text-rose-500" />}
            </h2>
            <button
              onClick={() => handleSelectCategory('all', '')}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
            >
              Reset to All
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={`cat-skel-${i}`} className="bg-gray-200/80 dark:bg-slate-800/80 animate-pulse rounded-2xl h-48" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tracks.map((track) => (
                <TrackCard
                  key={`cat-track-${track.id}`}
                  track={track}
                  onPlay={onPlay}
                  onDownload={onDownload}
                  isPlayingCurrent={currentTrackId === track.id}
                  isFavorite={favorites.some((f) => f.id === track.id)}
                  onToggleFavorite={onToggleFavorite}
                  onOpenAddToPlaylist={onOpenAddToPlaylist}
                  onOpenMetadata={onOpenMetadata}
                  viewMode="grid"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. QUICK PICK RECOMMENDATIONS BENTO GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-amber-500" />
            <h2 className="text-sm sm:text-base font-black text-gray-900 dark:text-white uppercase tracking-wider">
              Quick Pick Mixes
            </h2>
          </div>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">1-Click Instant Station</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_PICK_MIXES.map((mix) => {
            const IconComponent = mix.icon;
            return (
              <div
                key={mix.id}
                onClick={() => handlePlayQuickMix(mix.query, mix.title)}
                className="group relative rounded-2xl p-4 bg-white/80 dark:bg-slate-900/80 border border-gray-200/80 dark:border-white/10 hover:border-rose-500/40 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5 min-w-0 z-10">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${mix.gradient} text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
                    <IconComponent size={22} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 truncate">
                      {mix.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate">
                      {mix.subtitle}
                    </p>
                  </div>
                </div>

                <button className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-white group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all shadow-xs group-hover:scale-110">
                  <Play size={14} className="fill-current ml-0.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. RECOMMENDED VIDEOS CAROUSEL */}
      <div className="space-y-3 bg-white/70 dark:bg-slate-900/70 p-4 sm:p-5 rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-lg">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/20 rounded-2xl text-rose-500">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>Recommended Videos for You</span>
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-300 bg-rose-500/15 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                  YouTube Feed
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                Fresh audio-visual recommendations based on your listening patterns
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchRecommendations(true)}
              disabled={loadingRecs}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-full transition-all active:scale-95 disabled:opacity-50"
              title="Refresh recommendations"
            >
              <RefreshCw size={14} className={loadingRecs ? "animate-spin text-rose-500" : ""} />
            </button>
          </div>
        </div>

        {/* Recommended Tracks Horizontal Scroll / Grid */}
        {loadingRecs ? (
          <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={`rec-skel-${i}`}
                className="w-52 h-48 bg-gray-200/80 dark:bg-slate-800/80 animate-pulse rounded-2xl shrink-0" 
              />
            ))}
          </div>
        ) : recommendedTracks.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
            {recommendedTracks.map((track) => (
              <div 
                key={`home-rec-${track.id}`}
                className="w-56 shrink-0 group"
              >
                <TrackCard
                  track={track}
                  onPlay={onPlay}
                  onDownload={onDownload}
                  isPlayingCurrent={currentTrackId === track.id}
                  isFavorite={favorites.some((f) => f.id === track.id)}
                  onToggleFavorite={onToggleFavorite}
                  onOpenAddToPlaylist={onOpenAddToPlaylist}
                  onOpenMetadata={onOpenMetadata}
                  viewMode="grid"
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* 5. HISTORY-SEEDED RECOMMENDATIONS (IF WATCH HISTORY EXISTS) */}
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <History size={18} className="text-indigo-500" />
              <h2 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                Because You Watched "{history[0].title}"
              </h2>
            </div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Watch History Stream</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {DEFAULT_TRACKS.slice(0, 3).map((track) => (
              <TrackCard
                key={`hist-rec-${track.id}`}
                track={track}
                onPlay={onPlay}
                onDownload={onDownload}
                isPlayingCurrent={currentTrackId === track.id}
                isFavorite={favorites.some((f) => f.id === track.id)}
                onToggleFavorite={onToggleFavorite}
                onOpenAddToPlaylist={onOpenAddToPlaylist}
                onOpenMetadata={onOpenMetadata}
                viewMode="list"
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

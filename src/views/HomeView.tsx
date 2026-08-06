import React, { useState, useEffect } from 'react';
import { 
  Compass,
  Loader2,
  Sparkles,
  RefreshCw,
  Play,
  Flame,
  Coffee,
  Headphones,
  Mic2,
  Disc,
  Heart,
  Zap
} from 'lucide-react';
import { Track } from '../types';
import { DEFAULT_TRACKS } from '../data/fallbackTracks';
import { TrackCard } from '../components/TrackCard';
import { YouTubeFeedCard } from '../components/YouTubeFeedCard';

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
  { id: 'all', label: 'All', query: '' },
  { id: 'hindi', label: '🇮🇳 Hindi Hits', query: 'Top Hindi Songs Bollywood Chartbusters Arijit Singh' },
  { id: 'bengali', label: '🇧🇩/🇮🇳 Bengali', query: 'Top Bengali Romantic Songs Hits Coke Studio' },
  { id: 'punjabi', label: '🌾 Punjabi Beats', query: 'Top Punjabi Songs Bhangra Karan Aujla Diljit' },
  { id: 'tamil', label: '🎸 Tamil Hits', query: 'Top Tamil Songs Anirudh AR Rahman Vijay' },
  { id: 'telugu', label: '⚡ Telugu Tollywood', query: 'Top Telugu Songs RRR Sid Sriram Thaman' },
  { id: 'malayalam', label: '🌴 Malayalam Mollywood', query: 'Top Malayalam Songs Sushin Shyam Aavesham' },
  { id: 'marathi', label: '🪕 Marathi Hits', query: 'Top Marathi Songs Ajay Atul Sairat' },
  { id: 'news', label: '📰 Live Indian News', query: 'Indian Live News Breaking Bangla Hindi Aaj Tak' },
  { id: 'podcasts', label: '🎙️ Desi Podcasts', query: 'Top Indian Podcasts Ranveer Allahbadia Hindi' },
  { id: 'lofi', label: '☕ Desi Lofi', query: 'Lofi Beats Chill Hindi Bengali Slowed' },
];

// Quick Pick Mix Presets
const QUICK_PICK_MIXES = [
  {
    id: 'qp-1',
    title: 'Hindi Bollywood Hits',
    subtitle: 'Kesariya, Apna Bana Le & Arijit Singh',
    gradient: 'from-rose-600 to-pink-600',
    icon: Heart,
    query: 'Top Hindi Bollywood Romantic Songs'
  },
  {
    id: 'qp-2',
    title: 'Bengali Superhits',
    subtitle: 'Mon Majhi Re, Coke Studio & SVF',
    gradient: 'from-amber-500 to-rose-600',
    icon: Flame,
    query: 'Top Bengali Romantic Songs Hits'
  },
  {
    id: 'qp-3',
    title: 'Punjabi Bhangra & Pop',
    subtitle: 'Karan Aujla, Diljit Dosanjh & Badshah',
    gradient: 'from-purple-600 to-indigo-600',
    icon: Headphones,
    query: 'Top Punjabi Songs Bhangra Beats'
  },
  {
    id: 'qp-4',
    title: 'South Indian Superhits',
    subtitle: 'Tamil, Telugu & Malayalam Chartbusters',
    gradient: 'from-emerald-600 to-teal-600',
    icon: Mic2,
    query: 'Top Tamil Telugu Malayalam Songs Hits'
  },
  {
    id: 'qp-5',
    title: 'Desi Lofi & Acoustic',
    subtitle: 'Late night chill slowed & reverb',
    gradient: 'from-blue-600 to-cyan-600',
    icon: Coffee,
    query: 'Hindi Bengali Lofi Chill Songs'
  },
  {
    id: 'qp-6',
    title: 'Indian Live News & Drama',
    subtitle: 'Kolkata TV, Aaj Tak, Star Jalsha & Zee',
    gradient: 'from-violet-600 to-fuchsia-600',
    icon: Disc,
    query: 'Indian Live News Bangla Hindi Star Jalsha'
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
      let mood = "Top Trending Indian Songs Hindi Bengali Punjabi Tamil Telugu Hits";
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
    <div className="space-y-6 animate-fade-in pb-28 w-full max-w-full mx-auto">
      
      {/* 1. YOUTUBE MOBILE CATEGORY FILTER PILL BAR WITH EXPLORE COMPASS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 sticky top-0 bg-slate-900/95 dark:bg-black/95 backdrop-blur-md z-20 px-3 sm:px-4 lg:px-6">
        <button
          type="button"
          onClick={() => onShowToast("Explore Trending Topics", "info")}
          className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-[#272727] text-gray-800 dark:text-white flex items-center justify-center shrink-0 hover:bg-gray-300 dark:hover:bg-[#3f3f3f] transition-all cursor-pointer shadow-xs border border-transparent dark:border-white/10"
          title="Explore Trending"
        >
          <Compass size={18} />
        </button>

        {RECOMMENDATION_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleSelectCategory(cat.id, cat.query)}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 active:scale-95 flex items-center gap-1.5 ${
              selectedCategory === cat.id
                ? 'bg-white text-black font-medium shadow-sm'
                : 'bg-gray-200 dark:bg-[#272727] text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-[#3f3f3f] border border-transparent dark:border-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* QUICK PICK MIXES ROW */}
      <div className="space-y-2 pt-1 px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            <h2 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Quick Pick Mixes
            </h2>
          </div>
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">1-Click Instant Station</span>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6">
          {QUICK_PICK_MIXES.map((mix) => {
            const IconComponent = mix.icon;
            return (
              <div
                key={mix.id}
                onClick={() => handlePlayQuickMix(mix.query, mix.title)}
                className="group relative rounded-2xl p-3 bg-white/80 dark:bg-zinc-900 border border-gray-200/80 dark:border-white/10 hover:border-rose-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden flex items-center gap-3 shrink-0 w-64"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${mix.gradient} text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
                  <IconComponent size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-rose-500 truncate">
                    {mix.title}
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">
                    {mix.subtitle}
                  </p>
                </div>
                <button className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-white group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all">
                  <Play size={12} className="fill-current ml-0.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* YOUTUBE FEED RECOMMENDATIONS */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-rose-500 animate-pulse" />
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              {selectedCategory === 'all' ? 'Recommended Videos' : `Recommendations for "${RECOMMENDATION_CATEGORIES.find(c => c.id === selectedCategory)?.label}"`}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchRecommendations(true)}
              disabled={loadingRecs || loading}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 rounded-full transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Refresh recommendations"
            >
              <RefreshCw size={14} className={loadingRecs || loading ? "animate-spin text-rose-500" : ""} />
            </button>
          </div>
        </div>

        {/* FEED CARDS GRID */}
        {(loadingRecs || loading) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 px-0 sm:px-4 lg:px-6 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={`skel-${i}`} className="space-y-3">
                <div className="aspect-video w-full bg-gray-200 dark:bg-zinc-800 animate-pulse sm:rounded-2xl" />
                <div className="flex gap-3 px-3 sm:px-0">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-zinc-800 animate-pulse rounded w-5/6" />
                    <div className="h-3 bg-gray-200 dark:bg-zinc-800 animate-pulse rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 px-0 sm:px-4 lg:px-6 w-full">
            {(selectedCategory !== 'all' ? tracks : recommendedTracks).map((track) => (
              <YouTubeFeedCard
                key={`home-feed-${track.id}`}
                track={track}
                onPlay={onPlay}
                onDownload={onDownload}
                isPlayingCurrent={currentTrackId === track.id}
                isFavorite={favorites.some((f) => f.id === track.id)}
                onToggleFavorite={onToggleFavorite}
                onOpenAddToPlaylist={onOpenAddToPlaylist}
                onOpenMetadata={onOpenMetadata}
                onShowToast={onShowToast}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

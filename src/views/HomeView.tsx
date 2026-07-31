import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Flame, 
  Play, 
  RefreshCw, 
  Loader2, 
  Disc3, 
  History, 
  Trash2, 
  Heart, 
  Radio, 
  LayoutGrid, 
  List 
} from 'lucide-react';
import { Track } from '../types';
import { MOOD_CATEGORIES, DEFAULT_TRACKS } from '../data/fallbackTracks';
import { TrackCard } from '../components/TrackCard';
import { extractYouTubeId, decodeHtmlEntities } from '../utils/youtube';

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

export const HomeView: React.FC<HomeViewProps> = ({
  onPlay,
  onDownload,
  currentTrackId,
  favorites,
  history = [],
  onClearHistory,
  onToggleFavorite,
  onOpenAddToPlaylist,
  onShowToast
}) => {
  const [selectedMood, setSelectedMood] = useState('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'Hindi' | 'Bengali'>('all');
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [loading, setLoading] = useState(false);
  const [featuredTrack, setFeaturedTrack] = useState<Track>(DEFAULT_TRACKS[0]);

  // View format toggle state (grid vs list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('aura_view_mode') as 'grid' | 'list') || 'grid';
  });

  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('aura_view_mode', mode);
  };

  // State for Watch History based AI Recommendations
  const [historyRecs, setHistoryRecs] = useState<Track[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch AI recommendations based on user's recent watch history
  useEffect(() => {
    if (!history || history.length === 0) {
      setHistoryRecs([]);
      return;
    }

    const fetchHistoryRecs = async () => {
      setHistoryLoading(true);
      try {
        const recent = history.slice(0, 3);
        const query = recent.map(t => `${t.title} ${t.channel}`).join(' ');
        const prompt = `Songs similar to ${query} official full audio track`;

        const res = await fetch("/api/music/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mood: prompt })
        });
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        if (data.tracks && data.tracks.length > 0) {
          const watchedIds = new Set(history.map(h => h.id));
          const filtered = data.tracks.filter((t: Track) => !watchedIds.has(t.id));
          setHistoryRecs(filtered.length > 0 ? filtered : data.tracks);
        }
      } catch (e) {
        console.error("Failed to fetch history recommendations", e);
        setHistoryRecs(DEFAULT_TRACKS.slice(0, 5));
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistoryRecs();
  }, [history?.length ? history[0]?.id : '']);

  const fetchRecommendations = async (moodPrompt: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/music/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: moodPrompt })
      });
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      if (data.tracks && data.tracks.length > 0) {
        setTracks(data.tracks);
        setFeaturedTrack(data.tracks[0]);
      } else {
        setTracks(DEFAULT_TRACKS);
        setFeaturedTrack(DEFAULT_TRACKS[0]);
      }
    } catch (err) {
      console.error(err);
      setTracks(DEFAULT_TRACKS);
      setFeaturedTrack(DEFAULT_TRACKS[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const category = MOOD_CATEGORIES.find(c => c.id === selectedMood);
    if (category) {
      let prompt = category.moodPrompt;
      if (languageFilter === 'Hindi') prompt += " Hindi Songs";
      else if (languageFilter === 'Bengali') prompt += " Bengali Songs Rabindra Sangeet";
      fetchRecommendations(prompt);
    }
  }, [selectedMood, languageFilter]);

  const handleRefresh = () => {
    const category = MOOD_CATEGORIES.find(c => c.id === selectedMood);
    let prompt = category ? category.moodPrompt : 'Trending Music Videos Hits';
    if (languageFilter === 'Hindi') prompt += " Hindi Trending Videos";
    else if (languageFilter === 'Bengali') prompt += " Bengali Trending Videos";
    fetchRecommendations(prompt);
    onShowToast("Refreshing Trending Videos...", "info");
  };

  // Filter local tracks if user selects language tab
  const displayedTracks = tracks.filter((t) => {
    if (languageFilter === 'all') return true;
    const searchStr = `${t.title} ${t.channel} ${t.aiMoodTags || ''} ${t.genre || ''}`.toLowerCase();
    if (languageFilter === 'Hindi') {
      return searchStr.includes('hindi') || searchStr.includes('bollywood') || searchStr.includes('arijit') || searchStr.includes('t-series') || searchStr.includes('sony music') || searchStr.includes('zee music');
    }
    if (languageFilter === 'Bengali') {
      return searchStr.includes('bengali') || searchStr.includes('svf') || searchStr.includes('rabindra') || searchStr.includes('tollywood') || searchStr.includes('anupam') || searchStr.includes('boss') || searchStr.includes('praktan');
    }
    return true;
  });

  const activeTracksList = displayedTracks.length > 0 ? displayedTracks : tracks;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-24 max-w-7xl mx-auto w-full">
      
      {/* 1. Watch History & Recently Played Videos */}
      <div className="space-y-4 p-4 sm:p-6 bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-white/10 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <History size={20} className="text-indigo-500 animate-pulse" />
              Watch History
              {history.length > 0 && (
                <span className="text-[10px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  {history.length} Recently Watched
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Videos you recently streamed and listened to
            </p>
          </div>

          {history.length > 0 && onClearHistory && (
            <button
              onClick={onClearHistory}
              className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 rounded-xl"
              title="Clear Watch History"
            >
              <Trash2 size={14} /> Clear Watch History
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="space-y-4">
            {/* Recently Played Video Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {history.slice(0, 8).map((histTrack) => (
                <div 
                  key={`watch-hist-${histTrack.id}`}
                  onClick={() => onPlay(histTrack)}
                  className="group flex items-center gap-3 p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-white/70 dark:border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <div className="relative shrink-0">
                    <img 
                      src={`https://i.ytimg.com/vi/${extractYouTubeId(histTrack.id)}/hqdefault.jpg`} 
                      alt={histTrack.title}
                      className="w-14 h-14 rounded-xl object-cover shadow-xs group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 rounded-xl transition-colors flex items-center justify-center">
                      <Play size={16} className="text-white fill-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black truncate text-gray-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                      {decodeHtmlEntities(histTrack.title)}
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate">
                      {decodeHtmlEntities(histTrack.channel)}
                    </p>
                    <span className="inline-block text-[9px] font-bold text-indigo-500 dark:text-indigo-400 mt-0.5">
                      Streamed Video
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Recommendations based on Watch History */}
            {historyRecs.length > 0 && (
              <div className="pt-3 border-t border-gray-200/60 dark:border-white/10">
                <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-2.5">
                  <Sparkles size={14} className="text-indigo-500" />
                  Recommended From Your Watch History
                </h3>
                {historyLoading ? (
                  <div className="py-4 text-center space-y-1">
                    <Loader2 size={20} className="animate-spin text-indigo-500 mx-auto" />
                    <p className="text-[11px] font-bold text-gray-500">Generating recommendations...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {historyRecs.slice(0, 3).map((recTrack) => (
                      <div 
                        key={`rec-history-${recTrack.id}`}
                        onClick={() => onPlay(recTrack)}
                        className="group flex items-center gap-3 p-2.5 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-2xl border border-indigo-500/15 hover:border-indigo-500/40 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                      >
                        <img 
                          src={`https://i.ytimg.com/vi/${extractYouTubeId(recTrack.id)}/hqdefault.jpg`} 
                          alt={recTrack.title}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black truncate text-gray-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                            {decodeHtmlEntities(recTrack.title)}
                          </h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate">
                            {decodeHtmlEntities(recTrack.channel)}
                          </p>
                        </div>
                        <button className="p-2 bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-300 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                          <Play size={14} className="fill-current" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty Watch History State */
          <div className="p-6 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl bg-gray-50/50 dark:bg-slate-900/30">
            <History size={28} className="text-gray-400 dark:text-gray-600 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300">No Watch History Yet</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              Play any video from the trending videos section below to start building your personal watch history.
            </p>
          </div>
        )}
      </div>

      {/* 3. Language & Vibe Liquid Glass Filter Bar */}
      <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl p-2 rounded-3xl border border-white/60 dark:border-white/10 shadow-lg flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 pl-3 shrink-0">
          <Disc3 size={18} className="text-indigo-600 dark:text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider hidden sm:inline">Vibe Filters:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-0.5">
          <button
            onClick={() => setLanguageFilter('all')}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold transition-all shrink-0 ${
              languageFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            All Videos
          </button>
          <button
            onClick={() => setLanguageFilter('Hindi')}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold transition-all shrink-0 ${
              languageFilter === 'Hindi'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            🇮🇳 Hindi
          </button>
          <button
            onClick={() => setLanguageFilter('Bengali')}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold transition-all shrink-0 ${
              languageFilter === 'Bengali'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            🇧🇩/🇮🇳 Bengali
          </button>

          {/* Categories */}
          {MOOD_CATEGORIES.slice(3).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedMood(cat.id)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold transition-all shrink-0 ${
                selectedMood === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Trending Videos Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Flame size={20} className="text-rose-500 fill-rose-500" />
            Trending Videos
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
            Top trending YouTube music videos & official audio tracks
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Format Toggle (Grid vs List) */}
          <div className="bg-gray-200/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-gray-300/50 dark:border-white/10 flex items-center gap-1 backdrop-blur-md">
            <button
              onClick={() => handleToggleViewMode('grid')}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Grid Format View"
            >
              <LayoutGrid size={15} />
              <span className="hidden md:inline">Grid</span>
            </button>
            <button
              onClick={() => handleToggleViewMode('list')}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="List Format View"
            >
              <List size={15} />
              <span className="hidden md:inline">List</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3.5 py-2 bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-white/10 rounded-2xl text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin text-indigo-500" />
            ) : (
              <RefreshCw size={14} className="text-indigo-500" />
            )}
            Refresh Trending
          </button>
        </div>
      </div>

      {/* 5. Tracks Grid / List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
            Fetching real-time audio streams...
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            : "grid grid-cols-1 md:grid-cols-2 gap-3"
        }>
          {activeTracksList.map((track) => (
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
      )}

    </div>
  );
};

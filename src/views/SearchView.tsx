import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Loader2, Music2, Wand2, X, Radio, ChevronRight, LayoutGrid, List, RefreshCw, Filter, Play, Plus, Flame } from 'lucide-react';
import { Track } from '../types';
import { TrackCard } from '../components/TrackCard';
import { DEFAULT_TRACKS } from '../data/fallbackTracks';

interface SearchViewProps {
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  currentTrackId?: string;
  favorites: Track[];
  onToggleFavorite: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  youtubeApiKey?: string;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  onPlay,
  onDownload,
  currentTrackId,
  favorites,
  onToggleFavorite,
  onOpenAddToPlaylist,
  youtubeApiKey,
  onShowToast
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchSource, setSearchSource] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'official' | 'live' | 'remix'>('all');
  const [lastSearchTime, setLastSearchTime] = useState<Date | null>(null);

  // View format toggle state (grid vs list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('aura_view_mode') as 'grid' | 'list') || 'grid';
  });

  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('aura_view_mode', mode);
  };
  
  // Real-time autocomplete suggestions from YouTube
  const [autoSuggestions, setAutoSuggestions] = useState<string[]>([]);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);

  // Recommended Vibe Prompts
  const [vibePrompts, setVibePrompts] = useState<string[]>([
    "Late night lofi for coding",
    "Upbeat 80s synthpop playlist",
    "Acoustic coffee shop guitar",
    "Heavy bass workout motivation",
    "Relaxing classical piano"
  ]);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestionsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time debounced YouTube autocomplete and live search
  useEffect(() => {
    if (!query.trim()) {
      setAutoSuggestions([]);
      setShowSuggestionsDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      // Fetch YouTube Autocomplete Suggestions
      try {
        const acRes = await fetch(`/api/music/autocomplete?q=${encodeURIComponent(query.trim())}`);
        const acData = await acRes.json();
        if (acData.suggestions && acData.suggestions.length > 0) {
          setAutoSuggestions(acData.suggestions);
          setShowSuggestionsDropdown(true);
        }
      } catch (e) {
        // ignore suggestion error
      }

      // Perform Real-Time Track Search
      executeSearch(query, activeFilter, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeFilter]);

  // Execute Search API call
  const executeSearch = async (searchTerm: string, filterType = activeFilter, forceFresh = false) => {
    if (!searchTerm.trim()) return;
    if (forceFresh) setIsSyncing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/music/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: searchTerm, 
          youtubeApiKey,
          filter: filterType,
          forceFresh
        })
      });
      const data = await res.json();
      if (data.source) setSearchSource(data.source);
      if (data.tracks && data.tracks.length > 0) {
        setSearchResults(data.tracks);
        setLastSearchTime(new Date());
        if (forceFresh) {
          onShowToast(`⚡ Fetched ${data.tracks.length} real-time YouTube streams`, 'success');
        }
      } else {
        setSearchResults(DEFAULT_TRACKS);
      }
    } catch (err) {
      console.error(err);
      setSearchResults(DEFAULT_TRACKS);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  // Explicitly fetch original real-time YouTube videos directly
  const fetchOriginalYouTubeVideos = async (searchTerm?: string) => {
    const targetQuery = (searchTerm || query || 'Aura Trending').trim();
    setIsSyncing(true);
    setLoading(true);
    try {
      const res = await fetch("/api/youtube/fetch-original", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: targetQuery })
      });
      const data = await res.json();
      if (data.source) setSearchSource(data.source);
      if (data.tracks && data.tracks.length > 0) {
        setSearchResults(data.tracks);
        setLastSearchTime(new Date());
        onShowToast(`🔥 Fetched ${data.tracks.length} original real-time YouTube videos!`, 'success');
      } else {
        onShowToast('No original YouTube videos found', 'error');
      }
    } catch (e) {
      console.error(e);
      onShowToast('Error fetching real-time original YouTube videos', 'error');
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestionsDropdown(false);
    executeSearch(query, activeFilter, true);
  };

  const handleSelectSuggestion = (suggestedText: string) => {
    setQuery(suggestedText);
    setShowSuggestionsDropdown(false);
    executeSearch(suggestedText, activeFilter, true);
  };

  // Fetch initial smart prompts
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await fetch("/api/music/smart-prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mood: "music discovery" })
        });
        const data = await res.json();
        if (data.suggestions) setVibePrompts(data.suggestions);
      } catch (e) {
        // fallback
      }
    };
    fetchPrompts();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-28">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Search size={26} className="text-rose-500" />
            Real-Time YouTube Music Search
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium flex items-center gap-2">
            <span>Type any song or artist for live, real-time video audio streaming.</span>
            {lastSearchTime && (
              <span className="hidden md:inline text-rose-500/80 font-mono font-bold text-[10px]">
                • Synced {lastSearchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 dark:bg-rose-950/60 border border-rose-500/30 rounded-full text-rose-600 dark:text-rose-400 text-xs font-bold shadow-xs">
            <Radio size={13} className="animate-pulse text-rose-500" />
            <span>YouTube Live Sync</span>
          </div>

          {query && (
            <button
              onClick={() => executeSearch(query, activeFilter, true)}
              disabled={isSyncing || loading}
              className="p-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center gap-1 transition-all active:scale-95"
              title="Force Refresh Live YouTube Results"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin text-rose-500" : "text-gray-500 dark:text-gray-400"} />
            </button>
          )}
        </div>
      </div>

      {/* Real-Time Search Input Box with Dropdown */}
      <div ref={searchContainerRef} className="relative">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (autoSuggestions.length > 0) setShowSuggestionsDropdown(true);
              }}
              placeholder="Type song, artist, album, or vibe for real-time YouTube search..."
              className="w-full bg-gray-100/90 dark:bg-slate-800/90 text-gray-900 dark:text-white pl-13 pr-32 py-4 rounded-full border border-gray-200/80 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold text-sm shadow-md transition-all duration-300"
            />
            <Search size={22} className="absolute left-4.5 text-rose-500" />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSearchResults([]);
                  setShowSuggestionsDropdown(false);
                }}
                className="absolute right-28 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-md text-xs font-black transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading || isSyncing ? <Loader2 size={16} className="animate-spin" /> : "Live Search"}
            </button>
          </div>
        </form>

        {/* Real-Time YouTube Suggestions Dropdown */}
        {showSuggestionsDropdown && autoSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden divide-y divide-gray-100 dark:divide-white/5 animate-fade-in">
            <div className="px-4 py-2 bg-gray-50 dark:bg-slate-900/50 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Flame size={12} className="text-rose-500" />
                Live YouTube Auto-Suggestions
              </span>
              <span className="text-rose-500 font-mono font-bold text-[9px]">REAL-TIME SYNC</span>
            </div>
            {autoSuggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(item)}
                className="w-full px-4 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-between group transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Search size={14} className="text-gray-400 group-hover:text-rose-500" />
                  {item}
                </span>
                <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Real-Time Search Filter Category Pills & Direct Original YouTube Fetch Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-400 flex items-center gap-1 mr-1">
            <Filter size={13} /> Filter:
          </span>

          {[
            { id: 'all', label: 'All YouTube Results' },
            { id: 'official', label: '🎵 Official Audio' },
            { id: 'live', label: '🎙️ Live Concerts' },
            { id: 'remix', label: '🔥 Remixes & Bass' }
          ].map(filterBtn => (
            <button
              key={filterBtn.id}
              onClick={() => {
                const newF = filterBtn.id as any;
                setActiveFilter(newF);
                if (query.trim()) executeSearch(query, newF, true);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all border ${
                activeFilter === filterBtn.id
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {filterBtn.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchOriginalYouTubeVideos()}
          disabled={isSyncing || loading}
          className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black rounded-full shadow-md hover:shadow-lg border border-rose-400/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shrink-0"
        >
          {isSyncing ? (
            <Loader2 size={15} className="animate-spin text-white" />
          ) : (
            <Sparkles size={15} className="text-yellow-300 animate-pulse" />
          )}
          <span>Fetch Real-Time Original YouTube Videos</span>
        </button>
      </div>

      {/* AI Smart Prompts Pill list */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
          <Wand2 size={14} /> Trending Vibe Prompts
        </h3>
        <div className="flex flex-wrap gap-2">
          {vibePrompts.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSuggestion(promptText)}
              className="px-3.5 py-2 bg-gray-100 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 rounded-2xl text-xs font-semibold transition-all hover:scale-102 flex items-center gap-1.5"
            >
              <span>✨</span>
              <span>{promptText}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 size={36} className="animate-spin text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Fetching real-time YouTube video streams for "{query}"...
            </p>
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Music2 size={18} className="text-rose-500" />
                <span>Real-Time YouTube Results</span>
                <span className="text-xs text-rose-500 font-extrabold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                  {searchResults.length} Tracks
                </span>
              </h3>

              <div className="flex items-center gap-2">
                {/* Format Toggle (Grid vs List) */}
                <div className="bg-gray-200/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-gray-300/50 dark:border-white/10 flex items-center gap-1 backdrop-blur-md">
                  <button
                    onClick={() => handleToggleViewMode('grid')}
                    className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
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
                        ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="List Format View"
                  >
                    <List size={15} />
                    <span className="hidden md:inline">List</span>
                  </button>
                </div>

                {searchSource && (
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800 hidden sm:inline">
                    {searchSource}
                  </span>
                )}
              </div>
            </div>

            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                : "grid grid-cols-1 md:grid-cols-2 gap-3"
            }>
              {searchResults.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  onPlay={onPlay}
                  onDownload={onDownload}
                  isPlayingCurrent={currentTrackId === track.id}
                  isFavorite={favorites.some(f => f.id === track.id)}
                  onToggleFavorite={onToggleFavorite}
                  onOpenAddToPlaylist={onOpenAddToPlaylist}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </>
        ) : query ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-xs font-medium">
            No tracks found matching "{query}". Try a different keyword or tap a vibe prompt above.
          </div>
        ) : (
          <div className="py-12 text-center space-y-2 bg-gray-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-gray-200 dark:border-white/10 p-8">
            <Search size={32} className="text-rose-400 mx-auto" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Search Millions of Real-Time YouTube Songs & Streams</p>
            <p className="text-[11px] text-gray-400">Type any track, artist, album, or click a vibe prompt above to stream audio live.</p>
          </div>
        )}
      </div>

    </div>
  );
};


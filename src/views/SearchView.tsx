import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Loader2, Music2, Wand2, X, Radio, ChevronRight, LayoutGrid, List } from 'lucide-react';
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
  const [searchSource, setSearchSource] = useState<string>('');

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
      executeSearch(query);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Execute Search API call
  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/music/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchTerm, youtubeApiKey })
      });
      const data = await res.json();
      if (data.source) setSearchSource(data.source);
      if (data.tracks && data.tracks.length > 0) {
        setSearchResults(data.tracks);
      } else {
        setSearchResults(DEFAULT_TRACKS);
      }
    } catch (err) {
      console.error(err);
      setSearchResults(DEFAULT_TRACKS);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestionsDropdown(false);
    executeSearch(query);
  };

  const handleSelectSuggestion = (suggestedText: string) => {
    setQuery(suggestedText);
    setShowSuggestionsDropdown(false);
    executeSearch(suggestedText);
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
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Search size={24} className="text-indigo-600 dark:text-indigo-400" />
            Real-Time YouTube Music Search
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Type to stream original audio from YouTube in real time.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-full text-rose-600 dark:text-rose-400 text-xs font-bold shadow-xs">
          <Radio size={12} className="animate-pulse" />
          <span>Real-Time YouTube Live Sync</span>
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
              placeholder="Type song, artist, or vibe for real-time YouTube search..."
              className="w-full bg-gray-100/90 dark:bg-gray-800/90 text-gray-900 dark:text-white pl-13 pr-32 py-4 rounded-full border border-gray-200/80 dark:border-gray-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm shadow-md transition-all duration-300"
            />
            <Search size={22} className="absolute left-4.5 text-indigo-600 dark:text-indigo-400" />

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
              className="absolute right-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-md text-xs font-black transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Search"}
            </button>
          </div>
        </form>

        {/* Real-Time YouTube Suggestions Dropdown */}
        {showSuggestionsDropdown && autoSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/50 animate-fade-in">
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Live YouTube Search Suggestions</span>
              <span className="text-indigo-500">Auto-Syncing</span>
            </div>
            {autoSuggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(item)}
                className="w-full px-4 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 flex items-center justify-between group transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Search size={14} className="text-gray-400 group-hover:text-indigo-500" />
                  {item}
                </span>
                <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI Smart Prompts Pill list */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
          <Wand2 size={14} /> Trending Vibe Prompts
        </h3>
        <div className="flex flex-wrap gap-2">
          {vibePrompts.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSuggestion(promptText)}
              className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-2xl text-xs font-semibold transition-all hover:scale-102"
            >
              ✨ {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 size={36} className="animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Fetching real-time YouTube streams for "{query}"...
            </p>
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Music2 size={18} className="text-indigo-600 dark:text-indigo-400" />
                Real-Time YouTube Results
              </h3>

              <div className="flex items-center gap-2">
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

                {searchSource && (
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 hidden sm:inline">
                    Source: {searchSource}
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
          <div className="py-12 text-center space-y-2 bg-gray-50 dark:bg-gray-800/40 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700/80 p-8">
            <Search size={32} className="text-indigo-400 mx-auto" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Search Millions of YouTube Songs & Audio Streams</p>
            <p className="text-[11px] text-gray-400">Type any track, artist, album, or click a vibe prompt above to start listening.</p>
          </div>
        )}
      </div>

    </div>
  );
};

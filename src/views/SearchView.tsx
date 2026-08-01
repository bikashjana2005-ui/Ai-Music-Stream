import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Sparkles, 
  Loader2, 
  Music2, 
  X, 
  ChevronRight, 
  LayoutGrid, 
  List, 
  Flame, 
  Compass,
  History,
  Clock,
  Trash2,
  TrendingUp,
  Filter
} from 'lucide-react';
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

const YOUTUBE_FILTER_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'official', label: 'Music' },
  { id: 'live', label: 'Live' },
  { id: 'remix', label: 'Remixes' },
  { id: 'indian', label: 'Bollywood & Regional' }
];

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
  const [activeFilter, setActiveFilter] = useState<'all' | 'official' | 'live' | 'remix' | 'indian'>('all');

  // Pagination for Unlimited Search Results
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Saved Search History state from localStorage
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aura_search_history');
      return saved ? JSON.parse(saved) : ['Arijit Singh', 'Lofi Beats', 'Coke Studio', 'Bollywood Trending'];
    } catch {
      return ['Arijit Singh', 'Lofi Beats'];
    }
  });

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState<number>(-1);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Save term to search history
  const saveSearchTerm = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 10);
      localStorage.setItem('aura_search_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Remove single term from search history
  const removeSearchTerm = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item !== termToRemove);
      localStorage.setItem('aura_search_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Clear entire search history
  const clearSearchHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory([]);
    localStorage.removeItem('aura_search_history');
    onShowToast('Search history cleared', 'info');
  };

  // On mount: Load initial video search results if query is empty
  useEffect(() => {
    if (searchResults.length === 0 && !query.trim()) {
      setSearchResults(DEFAULT_TRACKS);
      setSearchSource('Featured YouTube Videos');
    }
  }, []);

  // Filter Pill search terms for empty query fallback
  const FILTER_FALLBACK_QUERIES: Record<string, string> = {
    all: 'Popular YouTube Music Videos',
    official: 'Official Music Video Hits',
    live: 'Live Music Concert',
    remix: 'Remix Bass Boosted',
    indian: 'Bollywood Romantic Hits'
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time debounced YouTube autocomplete and live search
  useEffect(() => {
    if (!query.trim()) {
      setAutoSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      // Fetch YouTube Autocomplete Suggestions
      try {
        const acRes = await fetch(`/api/music/autocomplete?q=${encodeURIComponent(query.trim())}`);
        const acData = await acRes.json();
        if (acData.suggestions && acData.suggestions.length > 0) {
          setAutoSuggestions(acData.suggestions);
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
    saveSearchTerm(searchTerm);
    setCurrentPage(1);
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
          forceFresh,
          page: 1
        })
      });
      const data = await res.json();
      if (data.source) setSearchSource(data.source);
      if (data.tracks && data.tracks.length > 0) {
        setSearchResults(data.tracks);
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

  // Fetch next page of results for unlimited search results
  const handleLoadMore = async () => {
    if (loadingMore) return;
    const effectiveQuery = query.trim() || FILTER_FALLBACK_QUERIES[activeFilter] || 'Popular YouTube Music Videos';
    const nextPage = currentPage + 1;
    setLoadingMore(true);

    try {
      const res = await fetch("/api/music/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: effectiveQuery, 
          youtubeApiKey,
          filter: activeFilter,
          page: nextPage
        })
      });
      const data = await res.json();
      if (data.tracks && data.tracks.length > 0) {
        setSearchResults((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newTracks = data.tracks.filter((t: Track) => !existingIds.has(t.id));
          return [...prev, ...newTracks];
        });
        setCurrentPage(nextPage);
        onShowToast(`⚡ Loaded additional search results!`, 'success');
      } else {
        onShowToast('No more video results found', 'info');
      }
    } catch {
      onShowToast('Failed to load more results', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    if (query.trim()) {
      executeSearch(query, activeFilter, true);
    }
  };

  const handleSelectTerm = (selectedText: string) => {
    setQuery(selectedText);
    setShowDropdown(false);
    executeSearch(selectedText, activeFilter, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    const itemsCount = searchHistory.length + autoSuggestions.length;
    if (itemsCount === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) => (prev < itemsCount - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : itemsCount - 1));
    } else if (e.key === 'Enter' && focusedSuggestionIndex >= 0) {
      e.preventDefault();
      if (focusedSuggestionIndex < searchHistory.length) {
        handleSelectTerm(searchHistory[focusedSuggestionIndex]);
      } else {
        const suggestionIdx = focusedSuggestionIndex - searchHistory.length;
        handleSelectTerm(autoSuggestions[suggestionIdx]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in pb-28 max-w-6xl mx-auto w-full">
      
      {/* YouTube-Style Single Search Bar with History & Live Suggestions */}
      <div ref={searchContainerRef} className="relative z-30">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setFocusedSuggestionIndex(-1);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search YouTube songs, artists, or channels..."
              className="w-full bg-slate-900 dark:bg-slate-950 text-white pl-11 pr-28 py-3 rounded-full border border-gray-700/60 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm shadow-md transition-all"
            />
            <Search size={18} className="absolute left-4 text-gray-400" />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSearchResults([]);
                  setShowDropdown(false);
                }}
                className="absolute right-24 p-1 text-gray-400 hover:text-white rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-xs text-xs font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading || isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* YouTube-Style Combined Dropdown: Saved Search History + Auto-Suggestions */}
        {showDropdown && (searchHistory.length > 0 || autoSuggestions.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden divide-y divide-white/10 animate-fade-in backdrop-blur-2xl">
            
            {/* 1. Saved Search History Section */}
            {searchHistory.length > 0 && !query.trim() && (
              <div className="p-2 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-rose-400" />
                    Recent Search History
                  </span>
                  <button
                    onClick={clearSearchHistory}
                    className="text-slate-400 hover:text-rose-400 text-[10px] font-semibold transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                {searchHistory.map((item, idx) => (
                  <div
                    key={`history-${idx}`}
                    onClick={() => handleSelectTerm(item)}
                    className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl transition-colors flex items-center justify-between cursor-pointer group ${
                      focusedSuggestionIndex === idx
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <History size={14} className="text-slate-400 group-hover:text-rose-400 shrink-0" />
                      <span className="truncate">{item}</span>
                    </span>
                    
                    <button
                      onClick={(e) => removeSearchTerm(item, e)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-white/10 transition-colors"
                      title="Remove from search history"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Live YouTube Suggestions */}
            {autoSuggestions.length > 0 && (
              <div className="p-2 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Flame size={12} className="text-rose-500" />
                    Live YouTube Suggestions
                  </span>
                </div>

                {autoSuggestions.map((item, idx) => {
                  const globalIdx = searchHistory.length + idx;
                  return (
                    <button
                      key={`suggestion-${idx}`}
                      onClick={() => handleSelectTerm(item)}
                      className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl transition-colors flex items-center justify-between group ${
                        focusedSuggestionIndex === globalIdx
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Search size={14} className="text-slate-400 group-hover:text-rose-400 shrink-0" />
                        <span className="truncate">{item}</span>
                      </span>
                      <ChevronRight size={13} className="text-slate-500 group-hover:text-rose-400" />
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        )}
      </div>

      {/* YouTube Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {YOUTUBE_FILTER_PILLS.map((pill) => (
          <button
            key={pill.id}
            onClick={() => {
              const filterId = pill.id as any;
              setActiveFilter(filterId);
              const targetTerm = query.trim() || FILTER_FALLBACK_QUERIES[pill.id] || 'YouTube Music Hits';
              executeSearch(targetTerm, filterId, true);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeFilter === pill.id
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-gray-200/80 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-700'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Results Header with View Format Toggle */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Music2 size={16} className="text-rose-500" />
              <span>YouTube Search Results</span>
              <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                {searchResults.length} {searchResults.length === 1 ? 'Result' : 'Results'}
              </span>
            </h2>
            {query && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium pl-6">
                Found <span className="font-bold text-rose-500 dark:text-rose-400">{searchResults.length}</span> video streams for <span className="font-bold text-gray-800 dark:text-gray-200">"{query}"</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
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
        </div>

        {/* Results Stream Grid / List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div 
                key={`skeleton-${i}`} 
                className="bg-gray-200/60 dark:bg-slate-800/60 animate-pulse rounded-2xl h-52 p-3 flex flex-col justify-between border border-gray-300/30 dark:border-white/5"
              >
                <div className="w-full h-28 bg-gray-300 dark:bg-slate-700/60 rounded-xl mb-2" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-3/4 h-3.5 bg-gray-300 dark:bg-slate-700/60 rounded-md" />
                  <div className="w-1/2 h-3 bg-gray-300 dark:bg-slate-700/60 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-6">
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                : "grid grid-cols-1 md:grid-cols-2 gap-3"
            }>
              {searchResults.map((track) => (
                <TrackCard
                  key={`search-track-${track.id}`}
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

            {/* Load More Results (Unlimited Search) Button */}
            <div className="flex flex-col items-center justify-center pt-2 pb-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black rounded-full shadow-lg border border-rose-400/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Loading More Results...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="text-yellow-300 animate-pulse" />
                    <span>Load More Search Results</span>
                    <span className="bg-black/20 px-2 py-0.5 rounded-full text-[10px] font-mono">
                      Page {currentPage}
                    </span>
                  </>
                )}
              </button>
              <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-2">
                Showing {searchResults.length} videos • Click to fetch more real-time YouTube results
              </p>
            </div>
          </div>
        ) : query ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-xs font-medium bg-gray-50 dark:bg-slate-900/30 rounded-2xl border border-gray-200 dark:border-white/10 p-8">
            No tracks found matching "{query}". Try typing a different song or artist name.
          </div>
        ) : (
          <div className="py-16 text-center space-y-2 bg-white/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8">
            <Compass size={32} className="text-rose-500 mx-auto" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Search YouTube Music Streams</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Type any song name or artist above to search live YouTube streams instantly.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

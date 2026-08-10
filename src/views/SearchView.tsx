import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ArrowLeft,
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
  Filter,
  Play,
  CheckCircle2,
  Youtube,
  Zap,
  Sliders,
  RefreshCw,
  Video,
  Radio,
  Check,
  Settings,
  Mic,
  MicOff,
  Volume2
} from 'lucide-react';
import { Track } from '../types';
import { TrackCard } from '../components/TrackCard';
import { YouTubeFeedCard } from '../components/YouTubeFeedCard';
import { DEFAULT_TRACKS } from '../data/fallbackTracks';
import { YouTubeVoiceSearchModal } from '../components/YouTubeVoiceSearchModal';

interface SearchViewProps {
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  currentTrackId?: string;
  favorites: Track[];
  onToggleFavorite: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onOpenMetadata?: (track: Track) => void;
  onOpenChannelDetails?: (channelName: string) => void;
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
  onOpenMetadata,
  onOpenChannelDetails,
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

  // Real-Time YouTube Video Search Page Options State
  const [showOptionPanel, setShowOptionPanel] = useState<boolean>(false);
  const [realtimeSyncEnabled, setRealtimeSyncEnabled] = useState<boolean>(true);
  const [officialOnlyFilter, setOfficialOnlyFilter] = useState<boolean>(true);
  const [searchEngineType, setSearchEngineType] = useState<'v3' | 'hybrid' | 'scrape'>('v3');
  const [apiLatency, setApiLatency] = useState<number>(45);

  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('aura_view_mode', mode);
  };
  
  // Real-time autocomplete suggestions from YouTube
  const [autoSuggestions, setAutoSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState<number>(-1);

  // Voice Search / Voice Command State
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);

  const handleToggleVoiceSearch = () => {
    setShowVoiceModal(true);
  };

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Save term to search history
  const saveSearchTerm = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => (item || '').toLowerCase() !== trimmed.toLowerCase());
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

  useEffect(() => {
    // Initial mount setup
    setSearchResults([]);
  }, []);

  // Recent Video Searches state (store tracks recently searched or played)
  const [recentVideoSearches, setRecentVideoSearches] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('aura_recent_video_searches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_TRACKS.slice(0, 6);
  });

  const addTrackToRecentVideoSearches = (track: Track) => {
    setRecentVideoSearches((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 16);
      localStorage.setItem('aura_recent_video_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const removeRecentVideoSearch = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentVideoSearches((prev) => {
      const updated = prev.filter((t) => t.id !== trackId);
      localStorage.setItem('aura_recent_video_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentVideoSearches = () => {
    setRecentVideoSearches([]);
    localStorage.removeItem('aura_recent_video_searches');
  };

  const handlePlayTrack = (track: Track) => {
    addTrackToRecentVideoSearches(track);
    onPlay(track);
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

  // Execute Real-time Search API call with option parameters
  const executeSearch = async (searchTerm: string, filterType = activeFilter, forceFresh = false) => {
    if (!searchTerm.trim()) return;
    saveSearchTerm(searchTerm);
    setCurrentPage(1);
    if (forceFresh) setIsSyncing(true);
    else setLoading(true);

    const startTime = Date.now();

    try {
      // Choose endpoint based on real-time option selection
      const endpoint = (searchEngineType === 'v3' || forceFresh) 
        ? "/api/youtube/fetch-original" 
        : "/api/music/search";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: searchTerm, 
          youtubeApiKey,
          filter: filterType,
          forceFresh: forceFresh || realtimeSyncEnabled,
          isOfficialOnly: officialOnlyFilter,
          page: 1
        })
      });

      const data = await res.json();
      const latency = Date.now() - startTime;
      setApiLatency(latency);

      if (data.source) setSearchSource(data.source);
      
      let tracks = data.tracks || [];

      // Apply client-side official filter if enabled
      if (officialOnlyFilter && tracks.length > 0) {
        const officialTracks = tracks.filter((t: Track) => t.isOfficial || t.views?.toLowerCase().includes('view') || t.views?.toLowerCase().includes('verified') || t.views?.toLowerCase().includes('stream'));
        if (officialTracks.length > 0) {
          tracks = officialTracks;
        }
      }

      if (tracks.length > 0) {
        setSearchResults(tracks);
        if (tracks[0]) {
          addTrackToRecentVideoSearches(tracks[0]);
        }
        if (forceFresh) {
          onShowToast(`⚡ Fetched ${tracks.length} real-time official YouTube videos (${latency}ms)`, 'success');
        }
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Real-time YouTube search error:', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  // Fetch next page of results for unlimited search results
  const handleLoadMore = async () => {
    if (loadingMore) return;
    const effectiveQuery = query.trim() || 'Popular YouTube Music Videos';
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
    <div className="space-y-5 animate-fade-in pb-28 w-full max-w-full mx-auto">
      
      {/* YouTube-Style Single Search Bar with Standalone Mic and Option Controls */}
      <div ref={searchContainerRef} className="relative z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Main Search Input Container */}
          <form onSubmit={handleSubmit} className="relative flex-1">
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
                placeholder="Search YouTube"
                className="w-full bg-[#212121] dark:bg-[#1f1f1f] text-white pl-5 pr-20 py-2.5 sm:py-3 rounded-full border border-transparent focus:border-white/20 focus:outline-none font-medium text-sm sm:text-base shadow-sm placeholder:text-gray-400/90 transition-all"
              />

              {/* Right side inner controls (Clear & Search Submit) */}
              <div className="absolute right-2 flex items-center gap-1.5">
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setSearchResults([]);
                      setShowDropdown(false);
                    }}
                    className="p-1 text-gray-400 hover:text-white rounded-full transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-xs transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                  title="Search"
                >
                  {loading || isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
              </div>
            </div>
          </form>

          {/* Standalone Circular Voice Search Mic Button */}
          <button
            type="button"
            onClick={() => setShowVoiceModal(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#212121] dark:bg-[#1f1f1f] text-white hover:bg-zinc-700/80 transition-all shrink-0 cursor-pointer"
            title="Search by Voice"
          >
            <Mic size={20} className="text-white" />
          </button>

          {/* Standalone Option Toggle Button */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowOptionPanel(!showOptionPanel)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                showOptionPanel || realtimeSyncEnabled || officialOnlyFilter
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500 shadow-xs'
                  : 'bg-[#212121] dark:bg-[#1f1f1f] text-slate-300 hover:text-white hover:bg-zinc-700/80'
              }`}
              title="Search Options & Filters"
            >
              <Sliders size={18} className="text-gray-200" />
              {(realtimeSyncEnabled || officialOnlyFilter) && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-slate-950 animate-pulse" />
              )}
            </button>

            {/* Floating Search Option Popover Dropdown */}
            {showOptionPanel && (
              <div className="absolute right-0 top-full mt-2 w-64 z-50 bg-slate-900/95 border border-white/15 rounded-2xl shadow-2xl p-3 space-y-2 animate-fade-in backdrop-blur-2xl text-left">
                <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1 pb-1.5 border-b border-white/10">
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <Sliders size={13} className="text-rose-500" />
                    Search Options & Filters
                  </span>
                  <span className="text-emerald-400 font-mono text-[9px]">{apiLatency}ms</span>
                </div>

                {/* Quick Toggles */}
                <div className="space-y-1 pt-1 border-t border-white/10">
                  <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider px-1 flex items-center gap-1">
                    <Zap size={11} className="text-amber-400" /> Real-Time Toggles
                  </div>

                  {/* Live Sync Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !realtimeSyncEnabled;
                      setRealtimeSyncEnabled(next);
                      onShowToast(next ? '⚡ Real-time search ON' : 'Real-time search OFF', 'info');
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all border ${
                      realtimeSyncEnabled
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap size={12} className={realtimeSyncEnabled ? "text-rose-400 animate-pulse" : ""} />
                      <span>Real-Time Sync</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${realtimeSyncEnabled ? "bg-emerald-400" : "bg-slate-500"}`} />
                  </button>

                  {/* Official Only Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !officialOnlyFilter;
                      setOfficialOnlyFilter(next);
                      onShowToast(next ? '🎥 Official YouTube Videos only' : 'All video results', 'info');
                      if (query.trim()) executeSearch(query, activeFilter, true);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all border ${
                      officialOnlyFilter
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Video size={12} className={officialOnlyFilter ? "text-indigo-400" : ""} />
                      <span>Official Videos Only</span>
                    </div>
                    {officialOnlyFilter && <Check size={12} className="text-indigo-400" />}
                  </button>
                </div>

                {/* Search Engine Mode */}
                <div className="pt-1.5 border-t border-white/10 space-y-1">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-1">API Engine</div>
                  {[
                    { id: 'v3', label: 'YouTube API v3' },
                    { id: 'hybrid', label: 'Hybrid Engine' },
                    { id: 'scrape', label: 'Stream Scraper' }
                  ].map((engine) => (
                    <button
                      key={engine.id}
                      type="button"
                      onClick={() => {
                        setSearchEngineType(engine.id as any);
                        setShowOptionPanel(false);
                        onShowToast(`Engine set to ${engine.label}`, 'info');
                      }}
                      className={`w-full px-2 py-1 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors ${
                        searchEngineType === engine.id
                          ? 'bg-rose-600/20 text-rose-300 font-bold border border-rose-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{engine.label}</span>
                      {searchEngineType === engine.id && <Check size={11} className="text-rose-400" />}
                    </button>
                  ))}
                </div>

                {/* Direct Fetch Action */}
                <button
                  type="button"
                  onClick={() => {
                    setShowOptionPanel(false);
                    const targetQuery = query.trim() || 'Official Trending Music Videos';
                    executeSearch(targetQuery, activeFilter, true);
                  }}
                  disabled={isSyncing || loading}
                  className="w-full py-1.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                  <span>Fetch Live Official</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Quick Voice Search Command Presets Bar */}
        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1 shrink-0">
            <Mic size={12} className="text-rose-500" /> Voice Commands:
          </span>
          {[
            'Play Arijit Singh',
            'Kesariya Song',
            'Lofi Beats Chill',
            'Bollywood Dance Party',
            'Coke Studio Bangla'
          ].map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={() => {
                setQuery(cmd);
                onShowToast(`🎙️ Voice Command: "${cmd}"`, 'success');
                executeSearch(cmd, activeFilter, true);
              }}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-gray-100 dark:bg-slate-800/80 text-gray-700 dark:text-gray-300 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-300 border border-gray-200/60 dark:border-white/10 transition-all shrink-0 flex items-center gap-1 active:scale-95"
            >
              <Mic size={10} className="text-rose-400" />
              <span>"{cmd}"</span>
            </button>
          ))}
        </div>

        {/* YouTube-Style Combined Dropdown: Instant Video Results + Suggestions + History */}
        {showDropdown && (searchHistory.length > 0 || autoSuggestions.length > 0 || (query.trim() && searchResults.length > 0)) && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden divide-y divide-white/10 animate-fade-in backdrop-blur-2xl">
            
            {/* 1. Instant YouTube Video Results inside Search Bar Dropdown */}
            {query.trim() && searchResults.length > 0 && (
              <div className="p-2 space-y-1">
                <div className="px-3 py-1 text-[10px] font-extrabold text-rose-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Youtube size={13} className="text-rose-500 animate-pulse" />
                    Instant Original YouTube Video Results
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {searchResults.length} videos
                  </span>
                </div>

                <div className="space-y-1.5 pt-0.5">
                  {searchResults.slice(0, 3).map((track) => (
                    <div
                      key={`instant-yt-${track.id}`}
                      onClick={() => {
                        onPlay(track);
                        setShowDropdown(false);
                        saveSearchTerm(query);
                      }}
                      className="w-full p-2 bg-slate-950/80 hover:bg-slate-800 border border-white/5 hover:border-rose-500/30 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-800 border border-white/10">
                          <img
                            src={`https://img.youtube.com/vi/${track.id}/hqdefault.jpg`}
                            alt={track.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={14} className="text-white fill-white" />
                          </div>
                          {track.duration && (
                            <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-black/80 text-[8px] font-bold text-white rounded">
                              {track.duration}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                            {track.title}
                          </h4>
                          <p className="text-[11px] text-gray-400 font-medium truncate flex items-center gap-1 mt-0.5">
                            <span>{track.channel}</span>
                            {track.isOfficial && (
                              <CheckCircle2 size={10} className="text-sky-400 fill-sky-400/20 shrink-0" />
                            )}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlay(track);
                          setShowDropdown(false);
                          saveSearchTerm(query);
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg shadow flex items-center gap-1 transition-all shrink-0 active:scale-95"
                      >
                        <Play size={12} className="fill-white" />
                        <span>Play</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Live YouTube Suggestions */}
            {autoSuggestions.length > 0 && (
              <div className="p-2 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Flame size={12} className="text-rose-500" />
                    Live Query Suggestions
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

            {/* 3. Saved Search History Section */}
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

          </div>
        )}
      </div>

      {/* Main Content Area: Active Search Results vs Recent Video Searches */}
      {query.trim() ? (
        /* ACTIVE SEARCH RESULTS VIEW */
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
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                Found <span className="font-bold text-rose-500 dark:text-rose-400">{searchResults.length}</span> video streams for <span className="font-bold text-gray-800 dark:text-gray-200">"{query}"</span>
              </p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6"
                  : "grid grid-cols-1 md:grid-cols-2 gap-4"
              }>
                {searchResults.map((track) => (
                  <YouTubeFeedCard
                    key={`search-feed-${track.id}`}
                    track={track}
                    onPlay={handlePlayTrack}
                    onDownload={onDownload}
                    isPlayingCurrent={currentTrackId === track.id}
                    isFavorite={favorites.some(f => f.id === track.id)}
                    onToggleFavorite={onToggleFavorite}
                    onOpenAddToPlaylist={onOpenAddToPlaylist}
                    onOpenMetadata={onOpenMetadata}
                    onOpenChannelDetails={onOpenChannelDetails}
                    onShowToast={onShowToast}
                  />
                ))}
              </div>

              {/* Load More Results (Unlimited Search) Button */}
              <div className="flex flex-col items-center justify-center pt-2 pb-6">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black rounded-full shadow-lg border border-rose-400/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
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
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-xs font-medium bg-gray-50 dark:bg-slate-900/30 rounded-2xl border border-gray-200 dark:border-white/10 p-8">
              No tracks found matching "{query}". Try typing a different song or artist name.
            </div>
          )}
        </div>
      ) : (
        /* RECENT VIDEO SEARCHES VIEW */
        <div className="space-y-6">
          {/* Recent Video Searches Section Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-rose-500" />
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Recent Video Searches
              </h2>
            </div>
            {(searchHistory.length > 0 || recentVideoSearches.length > 0) && (
              <button
                onClick={(e) => {
                  clearSearchHistory(e);
                  clearRecentVideoSearches();
                }}
                className="text-xs font-bold text-rose-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Clear All History</span>
              </button>
            )}
          </div>

          {/* Recent Search Keyword Query Pills */}
          {searchHistory.length > 0 && (
            <div className="bg-gray-100/80 dark:bg-slate-900/80 p-3 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 space-y-2.5">
              <div className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <History size={13} className="text-rose-500" />
                <span>Recent Keywords</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {searchHistory.map((item, idx) => (
                  <div
                    key={`recent-query-${idx}`}
                    onClick={() => handleSelectTerm(item)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-full text-xs font-semibold flex items-center gap-2 shrink-0 cursor-pointer group transition-all"
                  >
                    <Search size={12} className="text-gray-400 group-hover:text-rose-500" />
                    <span>{item}</span>
                    <button
                      onClick={(e) => removeSearchTerm(item, e)}
                      className="p-0.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-400 hover:text-rose-500 transition-colors"
                      title="Remove keyword"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Searched Video Feed Cards */}
          {recentVideoSearches.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Video size={14} className="text-rose-500" />
                  <span>Recently Searched & Played Videos</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    {recentVideoSearches.length} videos
                  </span>
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

              <div className={
                viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6"
                  : "grid grid-cols-1 md:grid-cols-2 gap-4"
              }>
                {recentVideoSearches.map((track) => (
                  <div key={`recent-video-${track.id}`} className="relative group">
                    <YouTubeFeedCard
                      track={track}
                      onPlay={handlePlayTrack}
                      onDownload={onDownload}
                      isPlayingCurrent={currentTrackId === track.id}
                      isFavorite={favorites.some(f => f.id === track.id)}
                      onToggleFavorite={onToggleFavorite}
                      onOpenAddToPlaylist={onOpenAddToPlaylist}
                      onOpenMetadata={onOpenMetadata}
                      onOpenChannelDetails={onOpenChannelDetails}
                      onShowToast={onShowToast}
                    />
                    <button
                      onClick={(e) => removeRecentVideoSearch(track.id, e)}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-black/80 hover:bg-rose-600 text-white rounded-full opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all shadow-md cursor-pointer"
                      title="Remove from recent searches"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-2 bg-gray-50/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8">
              <Clock size={32} className="text-rose-500/60 mx-auto" />
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No Recent Video Searches</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                Type any song or video title above to search YouTube and start building your search history.
              </p>
            </div>
          )}
        </div>
      )}

      {/* YouTube Voice Search Modal */}
      <YouTubeVoiceSearchModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onSearchSubmit={(voiceQuery) => {
          setQuery(voiceQuery);
          setShowDropdown(false);
          executeSearch(voiceQuery, activeFilter, true);
        }}
        onShowToast={onShowToast}
      />

    </div>
  );
};

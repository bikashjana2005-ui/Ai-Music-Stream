import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ArrowLeft,
  ArrowUpLeft,
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
  
  Zap,
  Sliders,
  SlidersHorizontal,
  RefreshCw,
  Video,
  Radio,
  Check,
  Settings,
  Mic,
  MicOff,
  Volume2,
  Shuffle,
  Globe,
  Sun,
  Coffee,
  Heart,
  Disc,
  Layers
} from 'lucide-react';
import { Track } from '../types';
import { TrackCard } from '../components/TrackCard';
import { YouTubeFeedCard } from '../components/YouTubeFeedCard';
import { 
  DEFAULT_TRACKS, 
  YOUTUBE_SEARCH_DATA, 
  YOUTUBE_SEARCH_CATEGORIES, 
  POPULAR_SEARCH_QUERIES 
} from '../data/fallbackTracks';
import { YouTubeVoiceSearchModal } from '../components/YouTubeVoiceSearchModal';
import { YouTubeSearchFilterModal, SearchFilterOptions } from '../components/YouTubeSearchFilterModal';
import { JanmashtamiBanner } from '../components/JanmashtamiEffect';
import { isJanmashtamiActive } from '../utils/janmashtami';
import { getNetworkStatus, setLowNetworkMode, getOptimizedThumbnail } from '../utils/networkOptimizer';
import { RedesignedSearchView } from '../components/RedesignedSearchView';

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

  // Android YouTube Search Filter Modal State
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

  // Network Optimizer & Low Network Zero-Buffer State
  const [isLowNetworkActive, setIsLowNetworkActive] = useState<boolean>(() => {
    return getNetworkStatus().isLowNetwork;
  });

  useEffect(() => {
    const handleNetChange = () => {
      setIsLowNetworkActive(getNetworkStatus().isLowNetwork);
    };
    window.addEventListener('storage', handleNetChange);
    window.addEventListener('networkModeChanged', handleNetChange);
    return () => {
      window.removeEventListener('storage', handleNetChange);
      window.removeEventListener('networkModeChanged', handleNetChange);
    };
  }, []);

  const [filterOptions, setFilterOptions] = useState<SearchFilterOptions>({
    sortBy: 'relevance',
    type: 'all',
    uploadDate: 'any',
    duration: 'any',
    officialOnly: false,
    liveOnly: false,
    hd4kOnly: false
  });

  const hasActiveCustomFilters = Boolean(
    (filterOptions?.sortBy && filterOptions.sortBy !== 'relevance') || 
    (filterOptions?.type && filterOptions.type !== 'all') || 
    (filterOptions?.uploadDate && filterOptions.uploadDate !== 'any') || 
    (filterOptions?.duration && filterOptions.duration !== 'any') || 
    filterOptions?.officialOnly || 
    filterOptions?.liveOnly || 
    filterOptions?.hd4kOnly
  );

  // Filter and sort search results based on active filters
  const displayedSearchResults = React.useMemo(() => {
    let list = [...searchResults];

    if (filterOptions?.liveOnly) {
      list = list.filter(t => 
        t.views?.toLowerCase().includes('live') || 
        t.views?.toLowerCase().includes('stream') || 
        t.title.toLowerCase().includes('live')
      );
    }
    if (filterOptions?.officialOnly) {
      list = list.filter(t => 
        t.isOfficial || 
        t.views?.toLowerCase().includes('view') || 
        t.views?.toLowerCase().includes('verified')
      );
    }
    if (filterOptions?.hd4kOnly) {
      list = list.filter(t => 
        t.title.toLowerCase().includes('4k') || 
        t.title.toLowerCase().includes('hd') || 
        (t.aiMoodTags && t.aiMoodTags.toLowerCase().includes('4k'))
      );
    }
    if (filterOptions?.sortBy === 'view_count') {
      list.sort((a, b) => {
        const getNum = (str?: string) => {
          if (!str) return 0;
          const match = str.match(/([\d.]+)\s*([KMBkmb])?/);
          if (!match) return 0;
          let val = parseFloat(match[1]);
          const unit = (match[2] || '').toUpperCase();
          if (unit === 'B') val *= 1000000000;
          else if (unit === 'M') val *= 1000000;
          else if (unit === 'K') val *= 1000;
          return val;
        };
        return getNum(b.views) - getNum(a.views);
      });
    }

    return list;
  }, [searchResults, filterOptions]);

  // Curated YouTube Search Data Hub State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [curatedFilterQuery, setCuratedFilterQuery] = useState<string>('');

  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return <Flame size={13} className="text-rose-500" />;
      case 'Music2': return <Music2 size={13} className="text-pink-500" />;
      case 'Heart': return <Heart size={13} className="text-red-400" />;
      case 'Zap': return <Zap size={13} className="text-amber-400" />;
      case 'Disc': return <Disc size={13} className="text-indigo-400" />;
      case 'Coffee': return <Coffee size={13} className="text-emerald-400" />;
      case 'Sun': return <Sun size={13} className="text-yellow-400" />;
      case 'Video': return <Video size={13} className="text-sky-400" />;
      case 'Radio': return <Radio size={13} className="text-orange-400" />;
      case 'Globe': return <Globe size={13} className="text-blue-400" />;
      default: return <Sparkles size={13} className="text-yellow-400" />;
    }
  };

  const curatedYouTubeData = React.useMemo(() => {
    let list = YOUTUBE_SEARCH_DATA;
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'trending') {
        list = list.slice(0, 12);
      } else if (selectedCategory === 'bollywood') {
        list = list.filter(t => t.genre === 'Bollywood' || t.aiMoodTags?.toLowerCase().includes('hindi'));
      } else if (selectedCategory === 'bengali') {
        list = list.filter(t => t.genre === 'Bengali' || t.aiMoodTags?.toLowerCase().includes('bengali'));
      } else if (selectedCategory === 'punjabi') {
        list = list.filter(t => t.genre === 'Punjabi' || t.aiMoodTags?.toLowerCase().includes('punjabi'));
      } else if (selectedCategory === 'south') {
        list = list.filter(t => t.genre === 'South Cinema' || t.aiMoodTags?.toLowerCase().includes('tamil') || t.aiMoodTags?.toLowerCase().includes('telugu') || t.aiMoodTags?.toLowerCase().includes('malayalam'));
      } else if (selectedCategory === 'lofi') {
        list = list.filter(t => t.genre === 'Lo-Fi' || t.aiMoodTags?.toLowerCase().includes('lo-fi') || t.aiMoodTags?.toLowerCase().includes('chill'));
      } else if (selectedCategory === 'devotional') {
        list = list.filter(t => t.genre === 'Devotional' || t.aiMoodTags?.toLowerCase().includes('devotional') || t.aiMoodTags?.toLowerCase().includes('bhajan'));
      } else if (selectedCategory === 'creators') {
        list = list.filter(t => t.genre === 'Entertainment' || t.genre === 'Technology' || t.channel?.toLowerCase().includes('crazy xyz') || t.channel?.toLowerCase().includes('tech'));
      } else if (selectedCategory === 'classics') {
        list = list.filter(t => t.genre === 'Classics' || t.aiMoodTags?.toLowerCase().includes('nostalgia') || t.aiMoodTags?.toLowerCase().includes('90s'));
      } else if (selectedCategory === 'global') {
        list = list.filter(t => t.genre === 'Global' || t.aiMoodTags?.toLowerCase().includes('global'));
      }
    }

    if (curatedFilterQuery.trim()) {
      const q = curatedFilterQuery.toLowerCase().trim();
      list = list.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.channel.toLowerCase().includes(q) ||
        (t.genre && t.genre.toLowerCase().includes(q)) ||
        (t.aiMoodTags && t.aiMoodTags.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedCategory, curatedFilterQuery]);

  const handleShufflePlayCategory = () => {
    if (curatedYouTubeData.length === 0) return;
    const randomIndex = Math.floor(Math.random() * curatedYouTubeData.length);
    const chosenTrack = curatedYouTubeData[randomIndex];
    handlePlayTrack(chosenTrack);
    onShowToast(`🔀 Shuffled & playing "${chosenTrack.title}"`, 'success');
  };

  const handleToggleVoiceSearch = () => {
    setShowVoiceModal(true);
  };

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

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

  // Real-time debounced YouTube autocomplete suggestions
  useEffect(() => {
    if (!query.trim()) {
      setAutoSuggestions([]);
      return;
    }

    // Instant local matches from POPULAR_SEARCH_QUERIES for zero-delay suggestions
    const qLower = query.trim().toLowerCase();
    const localMatches = POPULAR_SEARCH_QUERIES
      .map(p => p.term)
      .filter(term => term.toLowerCase().includes(qLower));

    // Also check curated titles
    const titleMatches = YOUTUBE_SEARCH_DATA
      .map(t => t.title)
      .filter(t => t.toLowerCase().includes(qLower))
      .slice(0, 4);

    const instantMatches = Array.from(new Set([...localMatches, ...titleMatches])).slice(0, 10);
    if (instantMatches.length > 0) {
      setAutoSuggestions(instantMatches);
    }

    const timer = setTimeout(async () => {
      try {
        const acRes = await fetch(`/api/music/autocomplete?q=${encodeURIComponent(query.trim())}`);
        const acData = await acRes.json();
        if (acData.suggestions && Array.isArray(acData.suggestions) && acData.suggestions.length > 0) {
          setAutoSuggestions(Array.from(new Set([...acData.suggestions, ...localMatches])).slice(0, 12));
        }
      } catch (e) {
        // keep instant matches
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

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
    if (!query.trim()) return;
    setHasSubmitted(true);
    setShowDropdown(false);
    setIsInputFocused(false);
    saveSearchTerm(query.trim());
    executeSearch(query.trim(), activeFilter, true);
    inputRef.current?.blur();
  };

  const handleSelectTerm = (selectedText: string) => {
    const trimmed = selectedText.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setHasSubmitted(true);
    setShowDropdown(false);
    setIsInputFocused(false);
    saveSearchTerm(trimmed);
    executeSearch(trimmed, activeFilter, true);
    inputRef.current?.blur();
  };

  const handleAppendTerm = (selectedText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery(selectedText);
    setShowDropdown(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleBackToDiscovery = () => {
    setQuery('');
    setSearchResults([]);
    setHasSubmitted(false);
    setShowDropdown(false);
    setIsInputFocused(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const itemsCount = searchHistory.length + autoSuggestions.length;

    if (e.key === 'ArrowDown' && itemsCount > 0) {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) => (prev < itemsCount - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp' && itemsCount > 0) {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : itemsCount - 1));
    } else if (e.key === 'Enter') {
      if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < itemsCount) {
        e.preventDefault();
        if (focusedSuggestionIndex < searchHistory.length) {
          handleSelectTerm(searchHistory[focusedSuggestionIndex]);
        } else {
          const suggestionIdx = focusedSuggestionIndex - searchHistory.length;
          handleSelectTerm(autoSuggestions[suggestionIdx]);
        }
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setIsInputFocused(false);
      inputRef.current?.blur();
    }
  };

  const isSearchingMode = isInputFocused || ((query.trim().length > 0 || showDropdown) && !hasSubmitted);
  const isResultsMode = hasSubmitted && query.trim().length > 0;

  return (
    <div className="space-y-4 animate-fade-in pb-28 w-full max-w-full mx-auto relative min-h-screen text-gray-900 dark:text-gray-100">
      {/* YouTube Top Search Bar Header (Docked cleanly below Header Navbar without overlying) */}
      <div ref={searchContainerRef} className="sticky top-14 z-30 pt-1.5 pb-2.5 bg-gray-50/95 dark:bg-[#0f0f0f]/95 backdrop-blur-xl border-b border-gray-200/70 dark:border-white/10 transition-all">
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Back Navigation Arrow (Clears search & returns to Discovery) */}
          <button
            type="button"
            onClick={handleBackToDiscovery}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 active:scale-95"
            title="Back"
          >
            <ArrowLeft size={22} />
          </button>

          {/* Main Search Input Container */}
          <form onSubmit={handleSubmit} className="relative flex-1">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setFocusedSuggestionIndex(-1);
                  setShowDropdown(true);
                }}
                onFocus={() => {
                  setIsInputFocused(true);
                  setShowDropdown(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search YouTube"
                className="w-full pl-4 pr-12 py-2 sm:py-2.5 focus:outline-none font-normal text-[16px] sm:text-[17px] transition-all bg-white/70 dark:bg-white/10 backdrop-blur-2xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-400 rounded-xl border border-black/10 dark:border-white/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 shadow-[0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.4)]"
              />

              {/* Right side inner controls (Clear & Search Submit) */}
              <div className="absolute right-2 flex items-center gap-1">
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setSearchResults([]);
                      setHasSubmitted(false);
                      setShowDropdown(true);
                      inputRef.current?.focus();
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Standalone Voice Search Mic Button */}
          <button
            type="button"
            onClick={() => setShowVoiceModal(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer bg-white/70 dark:bg-white/10 backdrop-blur-2xl text-gray-700 dark:text-zinc-200 border border-black/10 dark:border-white/20 hover:bg-white/90 dark:hover:bg-white/20 hover:text-red-500 active:scale-95 shadow-[0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.4)]"
            title="Search with your voice"
          >
            <Mic size={20} />
          </button>
        </div>
      </div>

      {/* VIEW SWITCHER: Active YouTube Search Results View OR Redesigned YouTube Search Suggestions Screen */}
      {isResultsMode ? (
        /* 1. ACTIVE YOUTUBE SEARCH RESULTS VIEW */
        <div className="space-y-4 animate-fade-in">
          
          {/* Modern Android YouTube Filter Chips Row */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {/* Filter Modal Trigger Chip */}
            <button
              type="button"
              onClick={() => setShowFilterModal(true)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95 ${
                hasActiveCustomFilters
                  ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-xs border border-transparent'
                  : 'bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-xs'
              }`}
              title="Filter results"
            >
              <SlidersHorizontal size={13} />
              <span>Filters</span>
              {hasActiveCustomFilters && (
                <span className="w-1.5 h-1.5 rounded-xs bg-white" />
              )}
            </button>

            {[
              { id: 'all', label: 'All' },
              { id: 'videos', label: 'Videos' },
              { id: 'shorts', label: 'Shorts' },
              { id: 'playlists', label: 'Playlists' },
              { id: 'live', label: 'Live' },
              { id: '4k', label: '4K' },
              { id: 'official', label: 'Official' }
            ].map((chip) => {
              const isSelected = 
                (chip.id === 'all' && !hasActiveCustomFilters && activeFilter === 'all') ||
                (chip.id === 'live' && filterOptions.liveOnly) ||
                (chip.id === 'official' && filterOptions.officialOnly) ||
                (chip.id === '4k' && filterOptions.hd4kOnly) ||
                (chip.id !== 'all' && activeFilter === chip.id);

              return (
                <button
                  key={`yt-chip-${chip.id}`}
                  onClick={() => {
                    if (chip.id === 'live') {
                      setFilterOptions(prev => ({ ...prev, liveOnly: !prev.liveOnly }));
                    } else if (chip.id === 'official') {
                      setFilterOptions(prev => ({ ...prev, officialOnly: !prev.officialOnly }));
                    } else if (chip.id === '4k') {
                      setFilterOptions(prev => ({ ...prev, hd4kOnly: !prev.hd4kOnly }));
                    } else if (chip.id === 'all') {
                      setActiveFilter('all');
                      setFilterOptions({
                        sortBy: 'relevance',
                        type: 'all',
                        uploadDate: 'any',
                        duration: 'any',
                        officialOnly: false,
                        liveOnly: false,
                        hd4kOnly: false
                      });
                    } else {
                      setActiveFilter(chip.id as any);
                      executeSearch(query, chip.id as any, true);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-xs border border-transparent'
                      : 'bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-xs'
                  }`}
                >
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>

          {/* Low Network Mode Status Banner */}
          {isLowNetworkActive && (
            <div className="bg-indigo-950/20 dark:bg-indigo-950/40 border border-indigo-500/20 dark:border-indigo-500/30 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Zap size={15} className="fill-indigo-500 text-indigo-500 shrink-0" />
                <span className="truncate">
                  <strong>Zero-Buffer Mode Active</strong>: 144p stream & compressed previews prevent buffering.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLowNetworkMode(false);
                  setIsLowNetworkActive(false);
                  onShowToast('Switched to Standard HD streaming', 'info');
                }}
                className="text-[11px] underline font-bold hover:text-gray-900 dark:hover:text-white shrink-0 ml-2 cursor-pointer"
              >
                Disable
              </button>
            </div>
          )}

          {/* YouTube Shorts Shelf (Authentic Android YouTube Mobile format) */}
          {(activeFilter === 'shorts' || displayedSearchResults.length >= 4) && (
            <div className="space-y-2 pt-1 pb-2 border-b border-white/5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-red-600 flex items-center justify-center text-white shadow-xs">
                    <Play size={11} className="fill-white ml-0.5" />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    Shorts
                  </h3>
                </div>
                <span className="text-[11px] text-zinc-400 font-medium">Vertical Format</span>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                {displayedSearchResults.slice(0, 8).map((item, idx) => (
                  <div
                    key={`shorts-${item.id}-${idx}`}
                    onClick={() => handlePlayTrack(item)}
                    className="relative w-36 sm:w-44 aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 cursor-pointer group shadow-md active:scale-95 transition-all"
                  >
                    <img
                      src={getOptimizedThumbnail(item.id, isLowNetworkActive)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-2.5">
                      <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug drop-shadow-md">
                        {item.title}
                      </h4>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-zinc-300">
                        <span className="truncate">{item.views || '1.4M views'}</span>
                        <span className="bg-red-600 text-white font-bold px-1.5 py-0.2 rounded text-[8px] tracking-wider">SHORTS</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-1">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                <Music2 size={16} className="text-rose-500" />
                <span>YouTube Search Results</span>
                <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                  {displayedSearchResults.length} {displayedSearchResults.length === 1 ? 'Result' : 'Results'}
                </span>
              </h2>
              <p className="text-[11px] text-gray-400 font-medium">
                Found <span className="font-bold text-rose-400">{displayedSearchResults.length}</span> video streams for <span className="font-bold text-white">"{query}"</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-800 p-0.5 rounded-xl border border-white/10 flex items-center gap-0.5">
                <button
                  onClick={() => handleToggleViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'grid'
                      ? 'bg-slate-700 shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  style={{ color: viewMode === 'grid' ? 'var(--accent-primary)' : undefined }}
                  title="Grid View"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => handleToggleViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'list'
                      ? 'bg-slate-700 shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  style={{ color: viewMode === 'list' ? 'var(--accent-primary)' : undefined }}
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
          ) : displayedSearchResults.length > 0 ? (
            <div className="space-y-6">
              <div className={
                viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6"
                  : "grid grid-cols-1 md:grid-cols-2 gap-4"
              }>
                {displayedSearchResults.map((track, idx) => (
                  <YouTubeFeedCard
                    key={`search-feed-${track.id || idx}-${idx}`}
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
                  className="px-6 py-3 text-white text-xs font-black rounded-full shadow-lg border border-white/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                  style={{
                    background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))',
                    boxShadow: '0 4px 20px var(--accent-glow)'
                  }}
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
            <div className="space-y-6">
              <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-xs font-medium bg-gray-50 dark:bg-slate-900/30 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                No direct live stream matches found for "{query}". Explore verified YouTube search data below:
              </div>

              {/* Verified YouTube Search Data Suggestions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-yellow-400" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Popular YouTube Search Recommendations
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {YOUTUBE_SEARCH_DATA.slice(0, 8).length} curated tracks
                  </span>
                </div>

                <div className={
                  viewMode === 'grid'
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6"
                    : "grid grid-cols-1 md:grid-cols-2 gap-4"
                }>
                  {YOUTUBE_SEARCH_DATA.slice(0, 8).map((track, idx) => (
                    <YouTubeFeedCard
                      key={`fallback-yt-${track.id || idx}-${idx}`}
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
              </div>
            </div>
          )}
        </div>
      ) : (
        <RedesignedSearchView
          query={query}
          searchHistory={searchHistory}
          autoSuggestions={autoSuggestions}
          onSelectTerm={handleSelectTerm}
          onAppendTerm={handleAppendTerm}
          onOpenVoiceModal={() => setShowVoiceModal(true)}
        />
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

      {/* YouTube Search Filter Modal (Android Material 3 Bottom Sheet) */}
      <YouTubeSearchFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        currentFilters={filterOptions}
        filterOptions={filterOptions}
        onApplyFilters={(newOptions) => {
          setFilterOptions(newOptions);
          onShowToast('Applied YouTube search filters', 'success');
        }}
        onResetFilters={() => {
          setFilterOptions({
            sortBy: 'relevance',
            type: 'all',
            uploadDate: 'any',
            duration: 'any',
            officialOnly: false,
            liveOnly: false,
            hd4kOnly: false
          });
          onShowToast('Filters reset to default', 'info');
        }}
      />

    </div>
  );
};

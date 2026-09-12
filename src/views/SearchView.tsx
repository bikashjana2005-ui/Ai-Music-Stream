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
  Youtube,
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

  const hasActiveCustomFilters = filterOptions.sortBy !== 'relevance' || 
    filterOptions.type !== 'all' || 
    filterOptions.uploadDate !== 'any' || 
    filterOptions.duration !== 'any' || 
    filterOptions.officialOnly || 
    filterOptions.liveOnly || 
    filterOptions.hd4kOnly;

  // Filter and sort search results based on active filters
  const displayedSearchResults = React.useMemo(() => {
    let list = [...searchResults];

    if (filterOptions.liveOnly) {
      list = list.filter(t => 
        t.views?.toLowerCase().includes('live') || 
        t.views?.toLowerCase().includes('stream') || 
        t.title.toLowerCase().includes('live')
      );
    }
    if (filterOptions.officialOnly) {
      list = list.filter(t => 
        t.isOfficial || 
        t.views?.toLowerCase().includes('view') || 
        t.views?.toLowerCase().includes('verified')
      );
    }
    if (filterOptions.hd4kOnly) {
      list = list.filter(t => 
        t.title.toLowerCase().includes('4k') || 
        t.title.toLowerCase().includes('hd') || 
        (t.aiMoodTags && t.aiMoodTags.toLowerCase().includes('4k'))
      );
    }
    if (filterOptions.sortBy === 'view_count') {
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
    <div className="space-y-4 animate-fade-in pb-28 w-full max-w-full mx-auto relative">

      {/* YouTube Top Search Bar Header (Modern Android Material 3 Design) */}
      <div ref={searchContainerRef} className="sticky top-0 z-30 pt-1.5 pb-2 bg-[#0f0f0f] border-b border-white/5">
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Back Navigation Arrow (Clears search & returns to Discovery) */}
          <button
            type="button"
            onClick={handleBackToDiscovery}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#f1f1f1] hover:bg-white/10 active:bg-white/20 transition-all shrink-0 cursor-pointer"
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
                className="w-full bg-[#222222] text-[#f1f1f1] pl-4 pr-20 py-2 sm:py-2.5 rounded-full border border-transparent focus:border-zinc-500 focus:outline-none font-normal text-[15px] shadow-xs placeholder:text-[#888888] transition-all"
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
                    className="p-1.5 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="p-1.5 bg-[#333333] hover:bg-zinc-700 text-white rounded-full transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                  title="Search"
                >
                  {loading || isSyncing ? <Loader2 size={16} className="animate-spin text-white" /> : <Search size={16} />}
                </button>
              </div>
            </div>
          </form>

          {/* Standalone Circular Voice Search Mic Button (Modern Android YouTube) */}
          <button
            type="button"
            onClick={() => setShowVoiceModal(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#222222] text-[#f1f1f1] hover:bg-[#383838] active:scale-95 transition-all shrink-0 cursor-pointer"
            title="Search with your voice"
          >
            <Mic size={20} className="text-white" />
          </button>

          {/* Low Network Zero-Buffer Toggle Button */}
          <button
            type="button"
            onClick={() => {
              const next = !isLowNetworkActive;
              setLowNetworkMode(next);
              setIsLowNetworkActive(next);
              onShowToast(
                next 
                  ? '⚡ Zero Buffer Mode Active: 240p stream & 90% lighter thumbnails' 
                  : 'Standard HD video streaming restored',
                'info'
              );
            }}
            className={`h-10 px-3 rounded-full flex items-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95 text-xs font-semibold ${
              isLowNetworkActive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-[#222222] text-zinc-400 hover:text-white border border-transparent'
            }`}
            title={isLowNetworkActive ? "Zero Buffer Mode Active" : "Enable Zero Buffer Mode"}
          >
            <Zap size={14} className={isLowNetworkActive ? "fill-emerald-400 text-emerald-400 animate-pulse" : "text-zinc-400"} />
            <span className="hidden sm:inline">{isLowNetworkActive ? 'Zero Buffer' : 'Data Saver'}</span>
          </button>

          {/* Android YouTube Search Filter Modal Trigger Button */}
          <button
            type="button"
            onClick={() => setShowFilterModal(true)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer relative ${
              hasActiveCustomFilters
                ? 'bg-white text-black font-bold'
                : 'bg-[#222222] text-[#f1f1f1] hover:bg-[#383838] active:scale-95'
            }`}
            title="Search filters"
          >
            <SlidersHorizontal size={18} />
            {hasActiveCustomFilters && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-black" />
            )}
          </button>

        </div>

        {/* Quick Voice Search Command Presets Bar */}
        {!isSearchingMode && (
          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1 shrink-0">
              <Mic size={12} className="text-zinc-400" /> Voice prompts:
            </span>
            {[
              ...(isJanmashtamiActive() ? ['Play Achyutam Keshavam', 'Radhe Radhe Bhajan'] : []),
              'Arijit Singh Hits',
              'Lofi Beats Chill',
              'Coke Studio India',
              'Bollywood Dance Party'
            ].map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => {
                  handleSelectTerm(cmd);
                  onShowToast(`🎙️ Voice Command: "${cmd}"`, 'success');
                }}
                className="px-3 py-1 rounded-full text-xs font-medium bg-[#222222] text-zinc-300 hover:bg-[#333333] hover:text-white border border-white/5 transition-all shrink-0 active:scale-95 cursor-pointer"
              >
                <span>"{cmd}"</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW SWITCHER: Suggestions View VS Search Results VS Discovery Hub */}
      {isSearchingMode ? (
        /* 1. YOUTUBE SEARCH SUGGESTIONS VIEW (Matching screenshot IMG-20260906-WA0000.jpg) */
        <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden shadow-2xl divide-y divide-white/5 animate-fade-in">
          
          {query.trim() ? (
            /* Active Query Autocomplete List with ArrowUpLeft Buttons */
            <div>
              {autoSuggestions.length > 0 ? (
                autoSuggestions.map((item, idx) => (
                  <div
                    key={`yt-sug-${idx}`}
                    onClick={() => handleSelectTerm(item)}
                    className={`flex items-center justify-between px-4 py-3.5 hover:bg-[#272727] active:bg-[#333] cursor-pointer transition-colors group ${
                      focusedSuggestionIndex === idx ? 'bg-[#272727]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <Search size={18} className="text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                      <span className="text-[15px] font-normal text-zinc-100 truncate">
                        {item}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleAppendTerm(item, e)}
                      className="p-2 text-zinc-400 hover:text-white transition-colors"
                      title="Insert into search"
                    >
                      <ArrowUpLeft size={18} />
                    </button>
                  </div>
                ))
              ) : (
                <div
                  onClick={() => handleSelectTerm(query)}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-[#272727] cursor-pointer"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <Search size={18} className="text-zinc-500 shrink-0" />
                    <span className="text-[15px] font-normal text-zinc-100 truncate">
                      {query}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleAppendTerm(query, e)}
                    className="p-2 text-zinc-400 hover:text-white"
                  >
                    <ArrowUpLeft size={18} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Query is empty - Show Recent History & YouTube Trending Searches */
            <div>
              {searchHistory.length > 0 && (
                <div>
                  <div className="px-4 py-2 flex items-center justify-between bg-zinc-900/60 border-b border-white/5">
                    <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Clock size={13} className="text-purple-400" /> Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearSearchHistory}
                      className="text-xs text-zinc-400 hover:text-rose-400 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>

                  {searchHistory.map((item, idx) => (
                    <div
                      key={`yt-hist-${idx}`}
                      onClick={() => handleSelectTerm(item)}
                      className="flex items-center justify-between px-4 py-3.5 hover:bg-[#272727] active:bg-[#333] cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <Clock size={18} className="text-zinc-500 group-hover:text-purple-400 shrink-0" />
                        <span className="text-[15px] font-normal text-purple-400 truncate">
                          {item}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => removeSearchTerm(item, e)}
                          className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
                          title="Remove from history"
                        >
                          <X size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleAppendTerm(item, e)}
                          className="p-2 text-zinc-400 hover:text-white transition-colors"
                          title="Insert into search"
                        >
                          <ArrowUpLeft size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <div className="px-4 py-2 bg-zinc-900/60 border-t border-b border-white/5">
                  <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <TrendingUp size={13} className="text-rose-400" /> Trending on YouTube
                  </span>
                </div>
                {POPULAR_SEARCH_QUERIES.slice(0, 8).map((p, idx) => (
                  <div
                    key={`yt-pop-${idx}`}
                    onClick={() => handleSelectTerm(p.term)}
                    className="flex items-center justify-between px-4 py-3.5 hover:bg-[#272727] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <TrendingUp size={18} className="text-rose-500 shrink-0" />
                      <span className="text-[15px] font-normal text-zinc-200 truncate">
                        {p.term}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleAppendTerm(p.term, e)}
                      className="p-2 text-zinc-400 hover:text-white transition-colors"
                    >
                      <ArrowUpLeft size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : isResultsMode ? (
        /* 2. ACTIVE YOUTUBE SEARCH RESULTS VIEW */
        <div className="space-y-4 animate-fade-in">
          
          {/* Modern Android YouTube Filter Chips Row */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {/* Filter Modal Trigger Chip */}
            <button
              type="button"
              onClick={() => setShowFilterModal(true)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95 ${
                hasActiveCustomFilters
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#222222] text-[#f1f1f1] hover:bg-[#383838]'
              }`}
              title="Filter results"
            >
              <SlidersHorizontal size={13} />
              <span>Filters</span>
              {hasActiveCustomFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
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
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white text-black font-semibold shadow-xs'
                      : 'bg-[#222222] text-[#f1f1f1] hover:bg-[#383838]'
                  }`}
                >
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>

          {/* Low Network Mode Status Banner */}
          {isLowNetworkActive && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-emerald-300 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Zap size={15} className="fill-emerald-400 text-emerald-400 shrink-0" />
                <span className="truncate">
                  <strong>Zero-Buffer Mode Active</strong>: 240p stream & compressed previews prevent buffering.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLowNetworkMode(false);
                  setIsLowNetworkActive(false);
                  onShowToast('Switched to Standard HD streaming', 'info');
                }}
                className="text-[11px] underline font-bold hover:text-white shrink-0 ml-2 cursor-pointer"
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
                      ? 'bg-slate-700 text-rose-400 shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => handleToggleViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'list'
                      ? 'bg-slate-700 text-rose-400 shadow-xs'
                      : 'text-gray-400 hover:text-white'
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
          ) : displayedSearchResults.length > 0 ? (
            <div className="space-y-6">
              <div className={
                viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6"
                  : "grid grid-cols-1 md:grid-cols-2 gap-4"
              }>
                {displayedSearchResults.map((track) => (
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
                  {YOUTUBE_SEARCH_DATA.slice(0, 8).map((track) => (
                    <YouTubeFeedCard
                      key={`fallback-yt-${track.id}`}
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
        /* YOUTUBE SEARCH DATA HUB & DISCOVERY VIEW */
        <div className="space-y-6">

          {/* Janmashtami Festival Celebratory Banner (Active until 6th Sep 2026) */}
          {isJanmashtamiActive() && (
            <JanmashtamiBanner
              onPlayTrack={onPlay}
              onSearchQuery={(q) => {
                handleSelectTerm(q);
              }}
              onShowToast={onShowToast}
            />
          )}
          
          {/* 1. YouTube Search Data Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/20 shadow-xl p-5 sm:p-7">
            <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-rose-600/20 border border-rose-500/30 text-rose-400 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Youtube size={12} className="text-rose-500" />
                    Verified YouTube Search Data
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                    Real Video Streams
                  </span>
                </div>
                
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  YouTube Search Data Hub
                </h2>
                
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Explore over 70+ curated YouTube music videos, chartbuster tracks, and viral creators across 11 categories with real-time video playback and offline capability.
                </p>

                {/* Quick Meta Stats */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                    <Flame size={12} className="text-rose-400" /> 70+ Verified Videos
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                    <Layers size={12} className="text-indigo-400" /> 11 Dynamic Categories
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                    <Zap size={12} className="text-amber-400" /> Instant Stream
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-col gap-2.5 shrink-0">
                <button
                  onClick={handleShufflePlayCategory}
                  className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow-lg border border-rose-400/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Shuffle size={14} />
                  <span>Shuffle Category</span>
                </button>
                <button
                  onClick={() => {
                    const firstTrack = curatedYouTubeData[0];
                    if (firstTrack) handlePlayTrack(firstTrack);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-white/10 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Play size={14} className="fill-current text-rose-500" />
                  <span>Play Top Video</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Popular YouTube Search Topics & Trending Queries */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-rose-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Trending YouTube Search Topics
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                Click to search instantly
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {POPULAR_SEARCH_QUERIES.map((q, idx) => (
                <button
                  key={`popular-q-${idx}`}
                  type="button"
                  onClick={() => handleSelectTerm(q.term)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800/90 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-full text-xs font-semibold flex items-center gap-2 shrink-0 transition-all active:scale-95 group cursor-pointer shadow-xs"
                >
                  <Search size={12} className="text-gray-400 group-hover:text-rose-500 transition-colors" />
                  <span>{q.term}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                    q.tag === 'Viral' || q.tag === 'Hot'
                      ? 'bg-rose-500/20 text-rose-400'
                      : q.tag === 'Festival'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-indigo-500/20 text-indigo-400'
                  }`}>
                    {q.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. YouTube Search Category Selector Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-indigo-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Browse YouTube Search Categories
                </h3>
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {YOUTUBE_SEARCH_CATEGORIES.length} Categories
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {YOUTUBE_SEARCH_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={`cat-${cat.id}`}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      onShowToast(`Browsing ${cat.label}`, 'info');
                    }}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all border cursor-pointer active:scale-95 ${
                      isActive
                        ? 'bg-gradient-to-r from-rose-600 to-red-600 border-rose-400/40 text-white shadow-md shadow-rose-600/20'
                        : 'bg-white dark:bg-slate-800/80 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {renderCategoryIcon(cat.icon)}
                    <span>{cat.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-black/25 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Curated YouTube Search Video Showcase */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <Youtube size={18} className="text-rose-500" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>
                    {YOUTUBE_SEARCH_CATEGORIES.find(c => c.id === selectedCategory)?.label || 'All YouTube Videos'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    {curatedYouTubeData.length} videos
                  </span>
                </h3>
              </div>

              {/* Search Within Category & View Mode Controls */}
              <div className="flex items-center gap-2.5">
                <div className="relative w-44 sm:w-56">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={curatedFilterQuery}
                    onChange={(e) => setCuratedFilterQuery(e.target.value)}
                    placeholder="Filter category..."
                    className="w-full pl-7 pr-7 py-1 text-xs bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 focus:outline-hidden focus:border-rose-500"
                  />
                  {curatedFilterQuery && (
                    <button
                      onClick={() => setCuratedFilterQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

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

            {/* Video Cards Grid / List */}
            {curatedYouTubeData.length > 0 ? (
              <div className={
                viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6"
                  : "grid grid-cols-1 md:grid-cols-2 gap-4"
              }>
                {curatedYouTubeData.map((track) => (
                  <YouTubeFeedCard
                    key={`curated-yt-${track.id}`}
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
            ) : (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-xs font-medium bg-gray-50 dark:bg-slate-900/30 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                No videos match "{curatedFilterQuery}" in this category.
              </div>
            )}
          </div>

          {/* 5. User Search History & Recent Video Searches */}
          <div className="pt-6 border-t border-gray-200 dark:border-white/10 space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-rose-500" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Your Recent Searches
                </h3>
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
                  <span>Clear History</span>
                </button>
              )}
            </div>

            {/* Search Keyword Pills */}
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
            {recentVideoSearches.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 px-1">
                  <Video size={14} className="text-rose-500" />
                  <span>Recently Played & Searched Videos ({recentVideoSearches.length})</span>
                </span>

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
            )}
          </div>

        </div>
      )}

      {/* Android Material Design 3 Expressive Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setShowVoiceModal(true)}
        className="fixed bottom-24 right-4 sm:right-6 z-30 w-14 h-14 rounded-[20px] bg-gradient-to-tr from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-2xl shadow-rose-950/60 flex items-center justify-center cursor-pointer active:scale-90 transition-all duration-200 border border-rose-400/30 hover:scale-105 group"
        title="Voice Search (Android M3 Expressive FAB)"
      >
        <Mic size={24} className="group-hover:scale-110 transition-transform" />
      </button>

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

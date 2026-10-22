import React, { useState, useEffect, useCallback } from 'react';
import { 
  Compass, 
  RefreshCw, 
  Play, 
  Sparkles,
  Zap,
  Flame,
  Radio,
  Music2,
  Tv,
  Film,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { Track } from '../types';
import { DEFAULT_TRACKS } from '../data/fallbackTracks';
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
  onOpenChannelDetails?: (channelName: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// Exactly matching the pills seen in the home feed
export const HOME_CATEGORY_PILLS = [
  { id: 'all', label: 'All', query: 'Top Trending YouTube Videos India Crazy XYZ Star Jalsha Music' },
  { id: 'indian_soaps', label: 'Indian soap operas', query: 'Star Jalsha Zee Bangla Bengali Serial Promo Drama 2026' },
  { id: 'music', label: 'Music', query: 'Top Indian Bollywood Bengali Romantic Hits Arijit Singh' },
  { id: 'crazy_xyz', label: 'Crazy XYZ & Experiments', query: 'Crazy XYZ Experiments Stunts JCB Challenge' },
  { id: 'bengali', label: 'Bengali Hits', query: 'Top Bengali Romantic Songs Coke Studio SVF Bangla' },
  { id: 'hindi', label: 'Hindi Chartbusters', query: 'Top Hindi Bollywood Songs Chartbusters Arijit Anirudh' },
  { id: 'punjabi', label: 'Punjabi Beats', query: 'Top Punjabi Songs Karan Aujla Diljit Dosanjh' },
  { id: 'news', label: 'Live News', query: 'Live Indian News ABP Ananda Aaj Tak Kolkata TV' },
  { id: 'lofi', label: 'Desi Lofi', query: 'Chill Indian Lofi Slowed Reverb Hindi Bengali' },
  { id: 'mixes', label: 'Mixes', query: 'Non Stop Hindi Bengali DJ Remix Party 2026' }
];

// Screenshot initial feature tracks for instant rendering
const SPOTLIGHT_HOME_TRACKS: Track[] = [
  {
    id: 'yt-crazy-xyz-jcb',
    title: '2 JCB vs CAR🔥 | Ripping Off a Car With Two JCB | दो जेसीबी गा...',
    channel: 'Crazy XYZ',
    views: '82K views',
    duration: '17:00',
    publishedTime: '31 minutes ago',
    aiMoodTags: 'Trending • Challenge',
    thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
  },
  {
    id: 'yt-star-jalsha-kumkum',
    title: '28 আগস্ট - 1 সেপ্টেম্বর 7:00 PM | কুমকুম - কুমকুমের চ্যালেঞ্জ',
    channel: 'Star Jalsha',
    views: '161K views',
    duration: '0:40',
    publishedTime: '16 hours ago',
    aiMoodTags: 'Drama • Promo',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop'
  },
  {
    id: 'yt-sansarer-sankirtan',
    title: 'Sansarer Sankirtan | আজ 10:00 PM | Star Jalsha',
    channel: 'Star Jalsha',
    views: '95K views',
    duration: '1:00',
    publishedTime: '18 hours ago',
    aiMoodTags: 'Drama • Music',
    thumbnail: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&auto=format&fit=crop'
  },
  ...DEFAULT_TRACKS
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
  onOpenChannelDetails,
  onShowToast
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [feedTracks, setFeedTracks] = useState<Track[]>(() => {
    try {
      const cached = sessionStorage.getItem('aura_home_feed_cache');
      return cached ? JSON.parse(cached) : SPOTLIGHT_HOME_TRACKS;
    } catch {
      return SPOTLIGHT_HOME_TRACKS;
    }
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number>(Date.now());

  // Real-time Fetch YouTube Recommendations Feed
  const fetchYouTubeRecommendations = useCallback(async (
    category: string,
    pageNum: number = 1,
    forceFresh: boolean = false,
    append: boolean = false
  ) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const activePill = HOME_CATEGORY_PILLS.find(p => p.id === category);
      const query = activePill ? activePill.query : '';

      const res = await fetch("/api/youtube/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          category, 
          query, 
          page: pageNum,
          forceFresh,
          trackTitle: history[0]?.title || undefined,
          channel: history[0]?.channel || undefined
        })
      });

      if (!res.ok) throw new Error("Feed request failed");
      const data = await res.json();

      if (data.tracks && Array.isArray(data.tracks) && data.tracks.length > 0) {
        if (append && pageNum > 1) {
          setFeedTracks(prev => {
            const seen = new Set(prev.map(t => t.id));
            const newUnique = data.tracks.filter((t: Track) => !seen.has(t.id));
            return [...prev, ...newUnique];
          });
        } else {
          setFeedTracks(data.tracks);
          try {
            sessionStorage.setItem('aura_home_feed_cache', JSON.stringify(data.tracks));
          } catch {}
        }
        setLastRefreshedAt(Date.now());
      } else if (!append) {
        setFeedTracks(SPOTLIGHT_HOME_TRACKS);
      }
    } catch (err) {
      console.warn("YouTube recommendation feed fetch error, using cache/spotlight:", err);
      if (!append && feedTracks.length === 0) {
        setFeedTracks(SPOTLIGHT_HOME_TRACKS);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [history, feedTracks.length]);

  // Load recommendations feed on component mount
  useEffect(() => {
    fetchYouTubeRecommendations('all', 1, false);
  }, []);

  // Category Pill Selection Handler
  const handleSelectCategory = async (catId: string) => {
    setSelectedCategory(catId);
    setPage(1);
    await fetchYouTubeRecommendations(catId, 1, true);
  };

  // Pull / Click Refresh Feed Handler
  const handleRefreshFeed = async () => {
    onShowToast("Refreshing YouTube recommendations feed...", "info");
    await fetchYouTubeRecommendations(selectedCategory, 1, true);
    onShowToast("YouTube recommendations updated with latest videos", "success");
  };

  // Load More Handler for Infinite Feed
  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchYouTubeRecommendations(selectedCategory, nextPage, false, true);
  };

  return (
    <div className="w-full bg-transparent text-gray-900 dark:text-white min-h-screen pb-24 select-none">
      
      {/* 1. HORIZONTALLY SCROLLABLE FILTER PILLS WITH EXPLORE COMPASS (iOS Liquid Glass) */}
      <div className="sticky top-16 z-30 bg-white/75 dark:bg-[#11121d]/75 backdrop-blur-2xl border-b border-black/5 dark:border-white/10 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* Explore Compass Icon Button */}
          <button
            onClick={() => {
              handleSelectCategory('crazy_xyz');
              onShowToast('Exploring Trending YouTube Experiments & Challenges', 'info');
            }}
            className="w-8.5 h-8.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-800 dark:text-white hover:bg-black/10 dark:hover:bg-white/20 border border-black/5 dark:border-white/15 flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-95 shadow-xs backdrop-blur-md"
            title="Explore Trending"
          >
            <Compass size={17} />
          </button>

          {/* Category Pills */}
          {HOME_CATEGORY_PILLS.map((pill) => {
            const isSelected = selectedCategory === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => handleSelectCategory(pill.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all shrink-0 whitespace-nowrap cursor-pointer active:scale-95 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold shadow-[0_4px_16px_rgba(244,63,94,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] border-rose-400/40'
                    : 'bg-white/70 dark:bg-white/10 text-gray-700 dark:text-zinc-300 hover:bg-white/90 dark:hover:bg-white/20 border-black/5 dark:border-white/15 backdrop-blur-md shadow-xs'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Quick Refresh Button */}
        <button
          onClick={handleRefreshFeed}
          disabled={loading}
          className="w-8.5 h-8.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/5 dark:border-white/15 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center shrink-0 transition-all cursor-pointer ml-1 active:scale-95 shadow-xs backdrop-blur-md"
          title="Refresh Feed"
        >
          <RefreshCw size={15} className={loading ? "animate-spin text-red-500" : ""} />
        </button>
      </div>

      {/* 2. REAL-TIME YOUTUBE VIDEO FEED */}
      <div className="w-full max-w-7xl mx-auto py-2">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-3 sm:p-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={`feed-skel-${i}`} className="space-y-3 bg-white/40 dark:bg-[#181926]/40 p-2.5 rounded-3xl border border-black/5 dark:border-white/10 backdrop-blur-xl shadow-xs">
                <div className="aspect-video w-full bg-black/10 dark:bg-white/10 animate-pulse rounded-2xl" />
                <div className="flex items-start gap-3 px-1 pt-1">
                  <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-black/10 dark:bg-white/10 animate-pulse rounded-full w-4/5" />
                    <div className="h-3 bg-black/10 dark:bg-white/10 animate-pulse rounded-full w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 sm:gap-y-8 px-2 sm:px-4">
              {feedTracks.map((track, idx) => (
                <YouTubeFeedCard
                  key={`home-feed-${track.id || idx}-${idx}`}
                  track={track}
                  onPlay={onPlay}
                  onDownload={onDownload}
                  isPlayingCurrent={currentTrackId === track.id}
                  isFavorite={favorites.some((f) => f.id === track.id)}
                  onToggleFavorite={onToggleFavorite}
                  onOpenAddToPlaylist={onOpenAddToPlaylist}
                  onOpenMetadata={onOpenMetadata}
                  onOpenChannelDetails={onOpenChannelDetails}
                  onShowToast={onShowToast}
                />
              ))}
            </div>

            {/* Load More Feed Button */}
            <div className="w-full flex justify-center py-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-full bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 active:scale-95 text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2 border border-black/10 dark:border-white/15 backdrop-blur-xl shadow-md transition-all cursor-pointer"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-red-500" />
                    <span>Fetching More Recommendations...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp size={16} className="text-red-500" />
                    <span>Load More YouTube Recommendations</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  ThumbsUp, 
  Clock, 
  Download, 
  ListPlus, 
  Plus, 
  MoreVertical, 
  Play, 
  Trash2, 
  Share2, 
  Award, 
  Sparkles, 
  User, 
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Track, Playlist } from '../types';
import { YouTubePlaylistDetail } from '../components/YouTubePlaylistDetail';
import { YouTubeLikedVideos } from '../components/YouTubeLikedVideos';
import { YouTubeHistory } from '../components/YouTubeHistory';
import { extractYouTubeId } from '../utils/youtube';

interface LibraryViewProps {
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  onDownloadPlaylist?: (playlist: Playlist) => void;
  currentTrackId?: string;
  favorites: Track[];
  history?: Track[];
  onClearHistory?: () => void;
  onRemoveFromHistory?: (trackId: string) => void;
  onToggleFavorite: (track: Track) => void;
  playlists: Playlist[];
  onCreatePlaylist: (name: string, description: string) => void;
  onUpdatePlaylist?: (playlistId: string, name: string, description: string) => void;
  onDeletePlaylist: (id: string) => void;
  onRemoveTrackFromPlaylist?: (playlistId: string, trackId: string) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onOpenMetadata?: (track: Track) => void;
  onOpenChannelDetails?: (channelName: string) => void;
  onOpenAuthModal?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
}

// Sample recent history items matching Screenshot 2
const SAMPLE_RECENT_HISTORY: Track[] = [
  {
    id: 'yt-hist-1',
    title: '2 JCB vs CAR🔥 | Ripping Off a Car ...',
    channel: 'Crazy XYZ',
    views: '82K views',
    duration: '17:00',
    publishedTime: '31 minutes ago',
    aiMoodTags: 'Trending',
    thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop'
  },
  {
    id: 'yt-hist-2',
    title: 'Sansarer Sankirtan | আজ 10:00 PM | Star Jalsha',
    channel: 'Star Jalsha',
    views: '95K views',
    duration: '1:00',
    publishedTime: '18 hours ago',
    aiMoodTags: 'Drama',
    thumbnail: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&auto=format&fit=crop'
  },
  {
    id: 'yt-hist-3',
    title: '28 আগস্ট - 1 সেপ্টেম্বর 7:00 PM | কুমকুম',
    channel: 'Star Jalsha',
    views: '161K views',
    duration: '0:40',
    publishedTime: '16 hours ago',
    aiMoodTags: 'Serial',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop'
  }
];

export const LibraryView: React.FC<LibraryViewProps> = ({
  onPlay,
  onDownload,
  onDownloadPlaylist,
  currentTrackId,
  favorites,
  history = [],
  onClearHistory,
  onRemoveFromHistory,
  onToggleFavorite,
  playlists,
  onCreatePlaylist,
  onUpdatePlaylist,
  onDeletePlaylist,
  onRemoveTrackFromPlaylist,
  onOpenAddToPlaylist,
  onOpenMetadata,
  onOpenChannelDetails,
  onOpenAuthModal,
  onShowToast,
  userName = 'Bikash Jana',
  userEmail = 'bikashjana908@gmail.com',
  userPhoto
}) => {
  const [activeFilter, setActiveFilter] = useState<'recents' | 'playlists' | 'music'>('recents');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'main' | 'liked' | 'history' | 'watch_later'>('main');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  // Watch Later list state
  const [watchLaterList, setWatchLaterList] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('aura_watch_later');
      return saved ? JSON.parse(saved) : SAMPLE_RECENT_HISTORY.slice(0, 2);
    } catch {
      return SAMPLE_RECENT_HISTORY.slice(0, 2);
    }
  });

  const displayHistory = history.length > 0 ? history : SAMPLE_RECENT_HISTORY;
  const initialLetter = (userName.trim()[0] || 'B').toUpperCase();
  const userHandle = userEmail.includes('@') ? `@${userEmail.split('@')[0]}` : `@${userEmail}`;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    onCreatePlaylist(newPlaylistName, newPlaylistDesc);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setShowCreateModal(false);
    onShowToast("Playlist created successfully!", "success");
  };

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  // Sub-view: Liked Videos
  if (activeView === 'liked') {
    return (
      <div className="w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-red-950/20 text-white min-h-screen pb-24 p-3 sm:p-4">
        <button
          onClick={() => setActiveView('main')}
          className="mb-4 px-3 py-1.5 bg-zinc-800/90 border border-red-500/20 text-white rounded-xl text-xs font-semibold hover:bg-zinc-700 transition-colors"
        >
          ← Back to You
        </button>
        <YouTubeLikedVideos
          likedTracks={favorites}
          onPlay={onPlay}
          onDownload={onDownload}
          currentTrackId={currentTrackId}
          onToggleLiked={onToggleFavorite}
          onOpenAddToPlaylist={onOpenAddToPlaylist}
          onOpenMetadata={onOpenMetadata}
          onShowToast={onShowToast}
          userName={userName}
        />
      </div>
    );
  }

  // Sub-view: Full History
  if (activeView === 'history') {
    return (
      <div className="w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-red-950/20 text-white min-h-screen pb-24 p-3 sm:p-4">
        <button
          onClick={() => setActiveView('main')}
          className="mb-4 px-3 py-1.5 bg-zinc-800/90 border border-red-500/20 text-white rounded-xl text-xs font-semibold hover:bg-zinc-700 transition-colors"
        >
          ← Back to You
        </button>
        <YouTubeHistory
          historyTracks={displayHistory}
          onPlay={onPlay}
          onDownload={onDownload}
          currentTrackId={currentTrackId}
          onRemoveFromHistory={onRemoveFromHistory}
          onClearHistory={onClearHistory}
          onOpenAddToPlaylist={onOpenAddToPlaylist}
          onOpenMetadata={onOpenMetadata}
          onShowToast={onShowToast}
        />
      </div>
    );
  }

  // Sub-view: Playlist Detail
  if (selectedPlaylist) {
    return (
      <div className="w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-red-950/20 text-white min-h-screen pb-24 p-3 sm:p-4">
        <YouTubePlaylistDetail
          playlist={selectedPlaylist}
          onBack={() => setSelectedPlaylistId(null)}
          onPlay={onPlay}
          onDownload={onDownload}
          onDownloadPlaylist={onDownloadPlaylist}
          currentTrackId={currentTrackId}
          isFavorite={(t) => favorites.some(f => f.id === t.id)}
          onToggleFavorite={onToggleFavorite}
          onRemoveTrackFromPlaylist={onRemoveTrackFromPlaylist}
          onUpdatePlaylist={onUpdatePlaylist}
          onDeletePlaylist={onDeletePlaylist}
          onOpenAddToPlaylist={onOpenAddToPlaylist}
          onOpenMetadata={onOpenMetadata}
          onShowToast={onShowToast}
          userName={userName}
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-red-950/20 text-white min-h-screen pb-24 px-3 sm:px-4 py-3 select-none space-y-6">
      
      {/* 1. PROFILE HEADER SECTION (MATCHING SCREENSHOT 2) */}
      <div className="flex items-center gap-4 pt-1">
        {/* Large Pink/Red Avatar with 'B' or Photo */}
        {userPhoto && userPhoto.trim() ? (
          <img 
            src={userPhoto} 
            alt={userName} 
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-red-500/50 shadow-lg shadow-red-950/40 shrink-0" 
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-amber-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-red-900/40 ring-2 ring-red-500/30 shrink-0">
            {initialLetter}
          </div>
        )}

        {/* Name & Handle & Account Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
              {userName}
            </h2>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-semibold">
              <ShieldCheck size={11} className="text-red-400" />
              <span>Verified Account</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 font-medium mt-0.5 truncate">
            {userHandle} <span className="text-zinc-500 mx-1">•</span> <span className="text-rose-400/90 font-mono">{userEmail}</span>
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              YouTube Real-Time Sync Connected
            </span>
          </div>
        </div>
      </div>

      {/* 2. PILL ACTION BUTTONS (VIEW CHANNEL & GET PREMIUM) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            if (onOpenChannelDetails) {
              onOpenChannelDetails(userName);
            } else {
              onShowToast(`Viewing channel for ${userName}`, 'info');
            }
          }}
          className="px-4 py-1.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-white border border-red-500/20 text-xs sm:text-sm font-semibold transition-colors shrink-0 cursor-pointer active:scale-95 shadow-sm"
        >
          View channel
        </button>

        <button
          onClick={() => onShowToast('YouTube Premium is active with Ad-Free & Background Stream', 'success')}
          className="px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-semibold transition-colors shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-md shadow-red-600/20"
        >
          <span>Get Premium</span>
        </button>

        <button
          onClick={onOpenAuthModal}
          className="px-4 py-1.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-white border border-red-500/20 text-xs sm:text-sm font-semibold transition-colors shrink-0 cursor-pointer active:scale-95 shadow-sm"
        >
          Switch account
        </button>
      </div>

      {/* 3. HISTORY SECTION (MATCHING SCREENSHOT 2) */}
      <div className="space-y-3 pt-2">
        <div 
          onClick={() => setActiveView('history')}
          className="flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-1.5">
            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-red-400 transition-colors">
              History
            </h3>
            <ChevronRight size={18} className="text-white group-hover:translate-x-0.5 transition-transform" />
          </div>
          <span className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:underline">
            View all
          </span>
        </div>

        {/* Horizontal Carousel of History Tracks */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-3 px-3 py-1">
          {displayHistory.slice(0, 10).map((item) => (
            <div
              key={`hist-${item.id}`}
              onClick={() => onPlay(item)}
              className="w-40 sm:w-44 shrink-0 space-y-2 cursor-pointer group"
            >
              {/* 16:9 Thumbnail with Duration Tag */}
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-zinc-800/90 border border-red-500/15 relative shadow-sm">
                <img
                  src={item.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-red-950/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play size={18} className="fill-white text-white" />
                </div>
                <span className="absolute bottom-1.5 right-1.5 bg-zinc-900/90 text-white text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10">
                  {item.duration || '3:30'}
                </span>
              </div>

              {/* Title & Channel */}
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-white leading-snug line-clamp-2 group-hover:text-red-400">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                    {item.channel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenMetadata) onOpenMetadata(item);
                  }}
                  className="p-1 text-zinc-400 hover:text-white rounded-full transition-colors"
                >
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. PLAYLISTS / LIBRARY SECTION (MATCHING SCREENSHOT 2 & 3) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-white">
            Playlists
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300"
          >
            <Plus size={16} />
            <span>New playlist</span>
          </button>
        </div>

        {/* Filter Chips Bar (Recents ⌄, Playlists, Music) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveFilter('recents')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              activeFilter === 'recents' 
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30' 
                : 'bg-zinc-850/90 text-zinc-300 hover:bg-zinc-800 border border-red-500/20'
            }`}
          >
            <span>Recents</span>
            <ChevronDown size={14} />
          </button>

          <button
            onClick={() => setActiveFilter('playlists')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'playlists' 
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30' 
                : 'bg-zinc-850/90 text-zinc-300 hover:bg-zinc-800 border border-red-500/20'
            }`}
          >
            Playlists
          </button>

          <button
            onClick={() => setActiveFilter('music')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'music' 
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30' 
                : 'bg-zinc-850/90 text-zinc-300 hover:bg-zinc-800 border border-red-500/20'
            }`}
          >
            Music
          </button>
        </div>

        {/* 5. YOUTUBE LIST ITEMS (MATCHING SCREENSHOT 2 & 3) */}
        <div className="space-y-3 divide-y divide-red-500/15">
          
          {/* ITEM 1: Liked videos */}
          <div
            onClick={() => setActiveView('liked')}
            className="pt-2 flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Stacked Thumbnail with Thumbs Up Badge */}
              <div className="w-28 sm:w-32 aspect-video rounded-xl overflow-hidden bg-zinc-800/90 border border-red-500/20 relative shrink-0 shadow-sm">
                <img
                  src={favorites[0]?.thumbnail || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop'}
                  alt="Liked videos"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center">
                  <ThumbsUp size={18} className="fill-white text-white" />
                </div>
                <span className="absolute bottom-1 right-1.5 bg-zinc-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10">
                  {favorites.length}
                </span>
              </div>

              {/* Title & Metadata */}
              <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-red-400 transition-colors truncate">
                  Liked videos
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Private • {favorites.length} videos
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShowToast('Liked videos playlist options', 'info');
              }}
              className="p-2 text-zinc-400 hover:text-white rounded-full"
            >
              <MoreVertical size={18} />
            </button>
          </div>

          {/* ITEM 2: Downloads */}
          <div
            onClick={() => onShowToast('Offline Downloads library is ready', 'info')}
            className="pt-3 flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Stacked Thumbnail with Download Down-Arrow Badge */}
              <div className="w-28 sm:w-32 aspect-video rounded-xl overflow-hidden bg-zinc-800/90 border border-red-500/20 relative shrink-0 shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=300&auto=format&fit=crop"
                  alt="Downloads"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center">
                  <Download size={18} className="text-white" />
                </div>
                <span className="absolute bottom-1 right-1.5 bg-zinc-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10">
                  Offline
                </span>
              </div>

              {/* Title & Metadata */}
              <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-red-400 transition-colors truncate">
                  Downloads
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Saved on device • High Quality
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShowToast('Downloads options', 'info');
              }}
              className="p-2 text-zinc-400 hover:text-white rounded-full"
            >
              <MoreVertical size={18} />
            </button>
          </div>

          {/* ITEM 3: Playlist "Song" */}
          <div
            onClick={() => {
              if (playlists.length > 0) {
                setSelectedPlaylistId(playlists[0].id);
              } else {
                onCreatePlaylist("Song", "Public Playlist");
                onShowToast("Opened playlist: Song", "info");
              }
            }}
            className="pt-3 flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Thumbnail with Playlist Icon Overlay */}
              <div className="w-28 sm:w-32 aspect-video rounded-xl overflow-hidden bg-zinc-800/90 border border-red-500/20 relative shrink-0 shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop"
                  alt="Song"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute right-0 top-0 bottom-0 w-10 bg-zinc-950/80 border-l border-red-500/20 flex items-center justify-center">
                  <ListPlus size={16} className="text-white" />
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-red-400 transition-colors truncate">
                  Song
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Public • Playlist
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShowToast('Playlist options for Song', 'info');
              }}
              className="p-2 text-zinc-400 hover:text-white rounded-full"
            >
              <MoreVertical size={18} />
            </button>
          </div>

          {/* Dynamic User Playlists */}
          {playlists.map((playlist) => {
            if (playlist.name === 'Song') return null;
            const coverThumb = playlist.tracks[0]?.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop';

            return (
              <div
                key={playlist.id}
                onClick={() => setSelectedPlaylistId(playlist.id)}
                className="pt-3 flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-28 sm:w-32 aspect-video rounded-xl overflow-hidden bg-zinc-800/90 border border-red-500/20 relative shrink-0 shadow-sm">
                    <img
                      src={coverThumb}
                      alt={playlist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute right-0 top-0 bottom-0 w-10 bg-zinc-950/80 border-l border-red-500/20 flex flex-col items-center justify-center text-white">
                      <span className="text-[10px] font-bold">{playlist.tracks.length}</span>
                      <ListPlus size={14} />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-red-400 transition-colors truncate">
                      {playlist.name}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Playlist • {playlist.tracks.length} {playlist.tracks.length === 1 ? 'video' : 'videos'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePlaylist(playlist.id);
                    onShowToast('Playlist removed', 'info');
                  }}
                  className="p-2 text-zinc-400 hover:text-red-400 rounded-full"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}

        </div>
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-red-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ListPlus size={18} className="text-rose-500" />
              Create Custom Playlist
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Playlist Title
                </label>
                <input
                  type="text"
                  required
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="e.g. My Favorite Hits"
                  className="w-full p-2.5 bg-zinc-800/90 border border-red-500/20 rounded-xl text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="e.g. Hand-picked songs for chill vibes"
                  className="w-full p-2.5 bg-zinc-800/90 border border-red-500/20 rounded-xl text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-xl shadow-md shadow-red-600/30 transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

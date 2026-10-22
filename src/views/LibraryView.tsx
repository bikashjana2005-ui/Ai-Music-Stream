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
  Check,
  Zap,
  Sliders,
  Radio,
  ArrowLeft,
  Tv
} from 'lucide-react';
import { YouTubePlaylistDetail } from '../components/YouTubePlaylistDetail';
import { YouTubeLikedVideos } from '../components/YouTubeLikedVideos';
import { YouTubeHistory } from '../components/YouTubeHistory';
import { YouTubeDownloads } from '../components/YouTubeDownloads';
import { extractYouTubeId } from '../utils/youtube';
import { Track, Playlist, DownloadedTrack } from '../types';

interface LibraryViewProps {
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  onDownloadPlaylist?: (playlist: Playlist) => void;
  currentTrackId?: string;
  favorites: Track[];
  history?: Track[];
  downloadedTracks?: DownloadedTrack[];
  onRemoveDownload?: (trackId: string) => void;
  onClearAllDownloads?: () => void;
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
  isDataSaverMode?: boolean;
  onToggleDataSaverMode?: (enabled: boolean) => void;
  videoQuality?: string;
  onChangeVideoQuality?: (quality: string) => void;
  onOpenSettings?: () => void;
  onOpenDownloads?: () => void;
  onOpenShareModal?: () => void;
  onSyncYouTubeHistory?: () => Promise<void>;
  isYouTubeSyncing?: boolean;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onPlay,
  onDownload,
  onDownloadPlaylist,
  currentTrackId,
  favorites,
  history = [],
  downloadedTracks = [],
  onRemoveDownload,
  onClearAllDownloads,
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
  userName = 'My Account',
  userEmail = '',
  userPhoto,
  isDataSaverMode = true,
  onToggleDataSaverMode,
  videoQuality = '144p',
  onChangeVideoQuality,
  onOpenSettings,
  onOpenDownloads,
  onOpenShareModal,
  onSyncYouTubeHistory,
  isYouTubeSyncing = false
}) => {
  const [activeFilter, setActiveFilter] = useState<'recents' | 'playlists' | 'music'>('recents');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'main' | 'liked' | 'history' | 'watch_later' | 'downloads'>('main');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  const displayHistory = history;
  const initialLetter = (userName.trim()[0] || 'U').toUpperCase();
  const validEmail = userEmail && userEmail !== 'bikashjana2005@gmail.com' ? userEmail : '';
  const userHandle = validEmail ? (validEmail.includes('@') ? `@${validEmail.split('@')[0]}` : `@${validEmail}`) : '@user';

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

  // Sub-view: Redesigned Downloads (from You tab)
  if (activeView === 'downloads') {
    return (
      <div className="w-full bg-transparent text-slate-900 dark:text-white min-h-screen pb-28 p-3 sm:p-4">
        <YouTubeDownloads
          downloadedTracks={downloadedTracks}
          onPlay={onPlay}
          currentTrackId={currentTrackId}
          onRemoveDownload={onRemoveDownload}
          onClearAllDownloads={onClearAllDownloads}
          onOpenAddToPlaylist={onOpenAddToPlaylist}
          onOpenMetadata={onOpenMetadata}
          onShowToast={onShowToast}
          onBack={() => setActiveView('main')}
        />
      </div>
    );
  }

  // Sub-view: Liked Videos (Application Main Theme)
  if (activeView === 'liked') {
    return (
      <div className="w-full bg-transparent text-slate-900 dark:text-white min-h-screen pb-28 p-3 sm:p-4">
        <button
          onClick={() => setActiveView('main')}
          className="mb-4 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to You</span>
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

  // Sub-view: Full History (Application Main Theme)
  if (activeView === 'history') {
    return (
      <div className="w-full bg-transparent text-slate-900 dark:text-white min-h-screen pb-28 p-3 sm:p-4">
        <button
          onClick={() => setActiveView('main')}
          className="mb-4 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to You</span>
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
          onSyncYouTubeHistory={onSyncYouTubeHistory}
          isSyncing={isYouTubeSyncing}
        />
      </div>
    );
  }

  // Sub-view: Playlist Detail (Application Main Theme)
  if (selectedPlaylist) {
    return (
      <div className="w-full bg-transparent text-slate-900 dark:text-white min-h-screen pb-28 p-3 sm:p-4">
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
    <div className="w-full bg-transparent text-slate-900 dark:text-white min-h-screen pb-28 px-3 sm:px-4 py-3 select-none space-y-4 sm:space-y-5 animate-fade-in">
      
      {/* 1. PROFILE HEADER CARD (iOS Liquid Glass Card) */}
      <div className="ios-glass-card rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          {/* Avatar with Rose Gradient Glow */}
          {userPhoto && userPhoto.trim() ? (
            <img 
              src={userPhoto} 
              alt={userName} 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-rose-500/50 shadow-md shrink-0" 
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 text-white flex items-center justify-center text-2xl sm:text-3xl font-black shadow-md ring-2 ring-white/30 dark:ring-white/20 shrink-0">
              {initialLetter}
            </div>
          )}

          {/* Name & Handle & Account Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                {userName}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                <ShieldCheck size={11} className="text-rose-500" />
                <span>Verified Account</span>
              </span>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-medium mt-0.5 truncate">
              {userHandle}
              {validEmail ? (
                <>
                  <span className="text-slate-400 dark:text-zinc-600 mx-1">•</span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono">{validEmail}</span>
                </>
              ) : null}
            </p>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-xs bg-emerald-500 animate-pulse" />
                Real-Time Sync Connected
              </span>

              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-rose-700 dark:text-rose-400 bg-rose-500/15 border border-rose-500/25 px-2.5 py-0.5 rounded-lg">
                <Zap size={11} className="fill-current text-rose-500" />
                <span>Default: 144p Data Saver</span>
              </span>
            </div>
          </div>
        </div>

        {/* PILL ACTION BUTTONS (iOS Liquid Glass Pills) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => {
              if (onOpenChannelDetails) {
                onOpenChannelDetails(userName);
              } else {
                onShowToast(`Viewing channel for ${userName}`, 'info');
              }
            }}
            className="px-3.5 py-1.5 rounded-xl ios-glass-pill text-slate-800 dark:text-white text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer active:scale-95 shadow-xs"
          >
            View channel
          </button>

          <button
            onClick={() => onShowToast('Ai Music Stream Premium is active with Ad-Free playback', 'success')}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-md shadow-rose-600/25"
          >
            <Sparkles size={13} className="fill-white" />
            <span>Get Premium</span>
          </button>

          <button
            onClick={onOpenAuthModal}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-md shadow-rose-600/25"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
            <span>Connect YouTube{validEmail ? ` (${validEmail})` : ''}</span>
          </button>

          <button
            onClick={onOpenAuthModal}
            className="px-3.5 py-1.5 rounded-xl ios-glass-pill text-slate-800 dark:text-white text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer active:scale-95 shadow-xs"
          >
            Switch account
          </button>

          {/* Share & Deployment Status Button */}
          {onOpenShareModal && (
            <button
              onClick={onOpenShareModal}
              className="px-3.5 py-1.5 rounded-xl ios-glass-pill text-slate-800 dark:text-white text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer active:scale-95 shadow-xs flex items-center gap-1.5 hover:text-rose-600 dark:hover:text-rose-400"
              title="View Deployment Status & Live Sharing Link"
            >
              <Share2 size={13} className="text-rose-500" />
              <span>Share App & Deploy</span>
            </button>
          )}

          {/* Quick Data Saver Toggle Button */}
          {onToggleDataSaverMode && (
            <button
              onClick={() => {
                const nextState = !isDataSaverMode;
                onToggleDataSaverMode(nextState);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                isDataSaverMode
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-xs'
                  : 'ios-glass-pill text-slate-700 dark:text-zinc-300'
              }`}
              title="Toggle Data Saver (144p default)"
            >
              <Zap size={13} className={isDataSaverMode ? 'fill-current text-rose-500' : 'text-zinc-400'} />
              <span>{isDataSaverMode ? 'Data Saver: ON (144p)' : 'Data Saver: OFF'}</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-full ios-glass-button flex items-center justify-center text-slate-700 dark:text-zinc-300 transition-colors shrink-0 cursor-pointer active:scale-90"
              title="Open Settings"
            >
              <Sliders size={15} />
            </button>
          )}
        </div>

        {/* SECTION NAVIGATION TABS (Overview, Liked videos, History, Playlists) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-black/5 dark:border-white/10">
          <button
            onClick={() => setActiveView('main')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeView === 'main'
                ? 'ios-glass-pill-active font-bold shadow-sm'
                : 'ios-glass-pill text-slate-700 dark:text-zinc-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('liked')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeView === 'liked'
                ? 'ios-glass-pill-active font-bold shadow-sm'
                : 'ios-glass-pill text-slate-700 dark:text-zinc-300'
            }`}
          >
            <ThumbsUp size={13} className={activeView === 'liked' ? 'fill-white' : 'fill-current text-rose-500'} />
            <span>Liked videos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600/20 text-rose-600 dark:text-rose-400">
              {favorites.length}
            </span>
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeView === 'history'
                ? 'ios-glass-pill-active font-bold shadow-sm'
                : 'ios-glass-pill text-slate-700 dark:text-zinc-300'
            }`}
          >
            <Clock size={13} />
            <span>History</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-slate-200 dark:bg-slate-700">
              {displayHistory.length}
            </span>
          </button>
          <button
            onClick={() => setActiveView('downloads')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeView === 'downloads'
                ? 'ios-glass-pill-active font-bold shadow-sm'
                : 'ios-glass-pill text-slate-700 dark:text-zinc-300'
            }`}
          >
            <Download size={13} />
            <span>Downloads</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              {downloadedTracks.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2. APPLICATION MAIN THEME & QUALITY STATUS CARD */}
      <div className="bg-gradient-to-r from-red-500/10 via-rose-500/5 to-amber-500/10 border border-red-500/20 dark:border-red-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-600/30 shrink-0">
            <Radio size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Application Main Theme
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white shadow-xs">
                Ai Music Red & Rose
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-0.5">
              Default playback set to <span className="font-bold text-rose-600 dark:text-rose-400">144p Lowest Data Saver</span> for instantaneous, zero-lag streaming.
            </p>
          </div>
        </div>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
          >
            Adjust Quality Settings
          </button>
        )}
      </div>

      {/* 3. HISTORY SECTION */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div 
          onClick={() => setActiveView('history')}
          className="flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-1.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              History
            </h3>
            <ChevronRight size={18} className="text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-500 hover:underline">
            View all
          </span>
        </div>

        {/* Horizontal Carousel of History Tracks */}
        {displayHistory.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-2 px-2 py-1">
            {displayHistory.slice(0, 15).map((item, idx) => {
              const ytid = extractYouTubeId(item.id || item.youtubeUrl || '');
              const thumbUrl = ytid && ytid.length === 11 
                ? `https://i.ytimg.com/vi/${ytid}/hqdefault.jpg`
                : (item.thumbnail && !item.thumbnail.includes('unsplash') ? item.thumbnail : `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`);
              return (
                <div
                  key={`hist-${item.id || idx}-${idx}`}
                  onClick={() => onPlay(item)}
                  className="w-40 sm:w-44 shrink-0 space-y-2 cursor-pointer group"
                >
                  {/* 16:9 Thumbnail with Duration Tag */}
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 relative shadow-xs">
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded bg-red-600/90 text-white text-[9px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1 backdrop-blur-xs">
                        <Tv size={10} />
                        Last Played
                      </span>
                    )}
                    <img
                      src={thumbUrl}
                      alt={item.title}
                      onError={(e) => {
                        if (ytid) {
                          (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${ytid}/mqdefault.jpg`;
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md">
                        <Play size={14} className="fill-white translate-x-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10">
                      {item.duration || '3:30'}
                    </span>
                  </div>

                  {/* Title & Channel */}
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                        {item.channel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenMetadata) onOpenMetadata(item);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 text-center">
            <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300">No watch history yet</p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-0.5">Videos you watch stream with 144p low data saver by default and are saved here in real-time.</p>
          </div>
        )}
      </div>


      {/* 4. PLAYLISTS SECTION */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Playlists
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-500 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>New playlist</span>
          </button>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveFilter('recents')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              activeFilter === 'recents' 
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-white/10'
            }`}
          >
            <span>Recents</span>
            <ChevronDown size={14} />
          </button>

          <button
            onClick={() => setActiveFilter('playlists')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'playlists' 
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-white/10'
            }`}
          >
            Playlists
          </button>

          <button
            onClick={() => setActiveView('liked')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeView === 'liked'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-white/10'
            }`}
          >
            <ThumbsUp size={12} className="fill-current text-rose-500" />
            <span>Liked ({favorites.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter('music')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'music' 
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-white/10'
            }`}
          >
            Music
          </button>
        </div>

        {/* Playlist Items List */}
        <div className="space-y-3 divide-y divide-slate-100 dark:divide-white/5">
          
          {/* ITEM 1: Liked videos */}
          <div
            onClick={() => setActiveView('liked')}
            className="pt-2 flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Stacked Thumbnail with Thumbs Up Badge */}
              <div className="w-28 sm:w-32 aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 relative shrink-0 shadow-xs">
                <img
                  src={
                    favorites[0] 
                      ? (extractYouTubeId(favorites[0].id || favorites[0].youtubeUrl || '') 
                          ? `https://i.ytimg.com/vi/${extractYouTubeId(favorites[0].id || favorites[0].youtubeUrl || '')}/hqdefault.jpg` 
                          : favorites[0].thumbnail)
                      : 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop'
                  }
                  alt="Liked videos"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-rose-950/40 flex items-center justify-center">
                  <ThumbsUp size={18} className="fill-white text-white" />
                </div>
                <span className="absolute bottom-1 right-1.5 bg-black/80 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10">
                  {favorites.length}
                </span>
              </div>

              {/* Title & Metadata */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
                    Liked videos
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-600/15 text-rose-600 dark:text-rose-400">
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Auto-updated • {favorites.length} video{favorites.length === 1 ? '' : 's'}
                </p>
                {favorites[0] && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 truncate mt-0.5 font-medium">
                    Latest: {favorites[0].title}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShowToast('Liked videos playlist options', 'info');
              }}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors"
            >
              <MoreVertical size={18} />
            </button>
          </div>

          {/* ITEM 2: Downloads */}
          <div
            onClick={() => {
              setActiveView('downloads');
            }}
            className="pt-3 flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Stacked Thumbnail with Download Down-Arrow Badge */}
              <div className="w-28 sm:w-32 aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-white/10 relative shrink-0 shadow-xs">
                {downloadedTracks.length > 0 && downloadedTracks[0].thumbnail ? (
                  <img
                    src={downloadedTracks[0].thumbnail}
                    alt="Downloads"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=300&auto=format&fit=crop"
                    alt="Downloads"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                )}
                <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center group-hover:bg-red-950/20 transition-colors">
                  <Download size={20} className="text-white drop-shadow-md" />
                </div>
                <span className="absolute bottom-1 right-1.5 bg-emerald-600/90 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10">
                  {downloadedTracks.length > 0 ? `${downloadedTracks.length} Offline` : 'Offline'}
                </span>
              </div>

              {/* Title & Metadata */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                    Downloads
                  </h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Ready
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                  {downloadedTracks.length > 0 
                    ? `${downloadedTracks.length} tracks • Saved to device` 
                    : 'Saved on device • 144p data saver ready'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                Open
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveView('downloads');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
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
              <div className="w-28 sm:w-32 aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 relative shrink-0 shadow-xs">
                <img
                  src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop"
                  alt="Song"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute right-0 top-0 bottom-0 w-10 bg-slate-900/80 backdrop-blur-xs border-l border-white/10 flex items-center justify-center">
                  <ListPlus size={16} className="text-white" />
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
                  Song
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
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
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors"
            >
              <MoreVertical size={18} />
            </button>
          </div>

          {/* Dynamic User Playlists */}
          {playlists.map((playlist, idx) => {
            if (playlist.name === 'Song') return null;
            const coverThumb = playlist.tracks[0]?.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop';

            return (
              <div
                key={`lib-playlist-${playlist.id}-${idx}`}
                onClick={() => setSelectedPlaylistId(playlist.id)}
                className="pt-3 flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-28 sm:w-32 aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 relative shrink-0 shadow-xs">
                    <img
                      src={coverThumb}
                      alt={playlist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute right-0 top-0 bottom-0 w-10 bg-slate-900/80 backdrop-blur-xs border-l border-white/10 flex flex-col items-center justify-center text-white">
                      <span className="text-[10px] font-bold">{playlist.tracks.length}</span>
                      <ListPlus size={14} />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
                      {playlist.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
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
                  className="p-2 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                  title="Delete playlist"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 flex items-center justify-center text-white">
                <ListPlus size={16} />
              </div>
              <span>Create Custom Playlist</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Playlist Title
                </label>
                <input
                  type="text"
                  required
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="e.g. My Favorite Hits"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="e.g. Hand-picked songs for chill vibes"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-xl shadow-md shadow-red-600/30 transition-all cursor-pointer active:scale-95"
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

import React, { useState } from 'react';
import { Library, ThumbsUp, Heart, ListPlus, Download, Music2, Trash2, Plus, Sparkles, History, LayoutGrid, List, ArrowLeft, Play, Eye } from 'lucide-react';
import { Track, Playlist } from '../types';
import { TrackCard } from '../components/TrackCard';
import { YouTubePlaylistDetail } from '../components/YouTubePlaylistDetail';
import { YouTubeLikedVideos } from '../components/YouTubeLikedVideos';
import { YouTubeHistory } from '../components/YouTubeHistory';

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
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userName?: string;
}

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
  onShowToast,
  userName = 'Bikash Jana'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'favorites' | 'playlists' | 'history'>('favorites');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  // View format toggle state (grid vs list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('aura_view_mode') as 'grid' | 'list') || 'grid';
  });

  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('aura_view_mode', mode);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    onCreatePlaylist(newPlaylistName, newPlaylistDesc);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setShowCreateModal(false);
    onShowToast("Playlist created successfully!");
  };

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  return (
    <div className="space-y-6 animate-fade-in pb-20 w-full max-w-full mx-auto">
      
      {/* Sub Tabs & Quick Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white/70 dark:bg-slate-900/70 p-3 sm:p-4 rounded-3xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full flex-nowrap py-0.5">
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-inner flex-nowrap shrink-0">
            <button
              onClick={() => setActiveSubTab('favorites')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                activeSubTab === 'favorites'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ThumbsUp size={14} className={favorites.length > 0 ? "fill-blue-500 text-blue-500" : ""} />
              <span>Liked</span>
              <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {favorites.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('playlists')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                activeSubTab === 'playlists'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs ring-1 ring-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListPlus size={14} className={activeSubTab === 'playlists' ? "text-indigo-500" : ""} />
              <span>Playlists</span>
              <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {playlists.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('history')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                activeSubTab === 'history'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs ring-1 ring-purple-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History size={14} className={activeSubTab === 'history' ? "text-purple-500" : ""} />
              <span>History</span>
              <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                {history.length}
              </span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-2xl shadow-md shadow-indigo-600/20 text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-indigo-400/30 shrink-0 whitespace-nowrap"
          >
            <Plus size={14} /> New Playlist
          </button>
        </div>
      </div>

      {/* Content Sections */}
      {activeSubTab === 'favorites' && (
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
      )}

      {activeSubTab === 'history' && (
        <YouTubeHistory
          historyTracks={history}
          onPlay={onPlay}
          onDownload={onDownload}
          currentTrackId={currentTrackId}
          onRemoveFromHistory={onRemoveFromHistory}
          onClearHistory={onClearHistory}
          onOpenAddToPlaylist={onOpenAddToPlaylist}
          onOpenMetadata={onOpenMetadata}
          onShowToast={onShowToast}
        />
      )}

      {activeSubTab === 'playlists' && (
        <div className="space-y-4">
          {selectedPlaylist ? (
            /* YOUTUBE MOBILE PLAYLIST VIEW */
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
          ) : (
            /* ALL PLAYLISTS YOUTUBE LIST */
            <div>
              {playlists.length === 0 ? (
                <div className="py-20 text-center space-y-3 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-dashed border-gray-200 dark:border-white/10 p-8 shadow-inner">
                  <ListPlus size={48} className="text-gray-400 dark:text-gray-500 mx-auto" />
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">No custom playlists created</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Click "New Playlist" above to create custom mixtapes and video sets.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-600/20 transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus size={16} /> Create First Playlist
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {playlists.map((playlist) => {
                    const hasTracks = playlist.tracks.length > 0;
                    const coverThumb = hasTracks 
                      ? (playlist.tracks[0].thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop')
                      : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop';

                    return (
                      <div 
                        key={playlist.id} 
                        onClick={() => setSelectedPlaylistId(playlist.id)}
                        className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer relative"
                      >
                        {/* 16:9 Thumbnail with YouTube Playlist Stack Overlay */}
                        <div className="relative w-full sm:w-36 aspect-video rounded-xl overflow-hidden bg-slate-950 shrink-0 shadow-md">
                          <img 
                            src={coverThumb} 
                            alt={playlist.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop';
                            }}
                          />

                          {/* YouTube Playlist Stack Overlay on right */}
                          <div className="absolute right-0 top-0 bottom-0 w-12 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-0.5 border-l border-white/10">
                            <span className="text-[11px] font-black">{playlist.tracks.length}</span>
                            <ListPlus size={14} className="text-white/90" />
                          </div>

                          {/* Hover Play Button */}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-lg">
                              <Play size={14} className="fill-slate-950 ml-0.5" />
                            </div>
                          </div>
                        </div>

                        {/* Playlist Metadata */}
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {playlist.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            Playlist • {userName}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {playlist.tracks.length} {playlist.tracks.length === 1 ? 'video' : 'videos'}
                          </p>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                          {hasTracks && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlay(playlist.tracks[0]);
                              }}
                              className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                              title="Play all"
                            >
                              <Play size={15} className="fill-current" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePlaylist(playlist.id);
                              onShowToast("Playlist removed", "info");
                            }}
                            className="w-8 h-8 rounded-full hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-all cursor-pointer"
                            title="Delete Playlist"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ListPlus size={20} className="text-indigo-600" />
              Create Custom Playlist
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                  Playlist Title
                </label>
                <input
                  type="text"
                  required
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="e.g. Midnight Chill, Workout Power"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="e.g. Hand-picked AI lofi beats for intense coding"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { Library, Heart, ListPlus, Download, Music2, Trash2, Plus, Sparkles, History, LayoutGrid, List, ArrowLeft, Play, Eye } from 'lucide-react';
import { Track, Playlist } from '../types';
import { TrackCard } from '../components/TrackCard';

interface LibraryViewProps {
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  onDownloadPlaylist?: (playlist: Playlist) => void;
  currentTrackId?: string;
  favorites: Track[];
  history?: Track[];
  onClearHistory?: () => void;
  onToggleFavorite: (track: Track) => void;
  playlists: Playlist[];
  onCreatePlaylist: (name: string, description: string) => void;
  onDeletePlaylist: (id: string) => void;
  onRemoveTrackFromPlaylist?: (playlistId: string, trackId: string) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onPlay,
  onDownload,
  onDownloadPlaylist,
  currentTrackId,
  favorites,
  history = [],
  onClearHistory,
  onToggleFavorite,
  playlists,
  onCreatePlaylist,
  onDeletePlaylist,
  onRemoveTrackFromPlaylist,
  onOpenAddToPlaylist,
  onShowToast
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
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Library size={24} className="text-indigo-600 dark:text-indigo-400" />
            Your Music Library
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Saved favorites, custom AI playlists, and downloaded audio tracks.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 text-xs flex items-center gap-1.5 transition-transform active:scale-95"
        >
          <Plus size={16} /> New Playlist
        </button>
      </div>

      {/* Sub Tabs & Format Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit flex-wrap">
          <button
            onClick={() => setActiveSubTab('favorites')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'favorites'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Heart size={16} className={favorites.length > 0 ? "fill-rose-500 text-rose-500" : ""} />
            Favorites ({favorites.length})
          </button>

          <button
            onClick={() => setActiveSubTab('playlists')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'playlists'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ListPlus size={16} />
            Playlists ({playlists.length})
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'history'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <History size={16} />
            History ({history.length})
          </button>
        </div>

        {/* View Format Toggle (Grid vs List) */}
        {activeSubTab !== 'playlists' && (
          <div className="bg-gray-200/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-gray-300/50 dark:border-white/10 flex items-center gap-1 backdrop-blur-md self-start sm:self-auto">
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
        )}
      </div>

      {/* Content Sections */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Recently Watched Songs ({history.length})
            </h3>
            {history.length > 0 && onClearHistory && (
              <button
                onClick={onClearHistory}
                className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1"
              >
                <Trash2 size={14} /> Clear History
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-white dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-8">
              <History size={44} className="text-gray-300 dark:text-gray-600 mx-auto" />
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No watch history yet</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Stream any song on Home or Search to build your watch history and unlock personalized AI recommendations!
              </p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                : "grid grid-cols-1 md:grid-cols-2 gap-3"
            }>
              {history.map((track) => (
                <TrackCard
                  key={`hist-lib-${track.id}`}
                  track={track}
                  onPlay={onPlay}
                  onDownload={onDownload}
                  isPlayingCurrent={currentTrackId === track.id}
                  isFavorite={favorites.some(f => f.id === track.id)}
                  onToggleFavorite={onToggleFavorite}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-white dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-8">
              <Heart size={44} className="text-gray-300 dark:text-gray-600 mx-auto" />
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No favorite songs saved yet</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Tap the heart icon on any track card to save it here for instant access.
              </p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                : "grid grid-cols-1 md:grid-cols-2 gap-3"
            }>
              {favorites.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  onPlay={onPlay}
                  onDownload={onDownload}
                  isPlayingCurrent={currentTrackId === track.id}
                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'playlists' && (
        <div className="space-y-6">
          {/* DEDICATED PLAYLIST DOWNLOAD SECTION BANNER */}
          <div className="p-5 bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-indigo-900/90 text-white rounded-3xl shadow-lg border border-emerald-500/30 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-inner">
                <Download size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base">Playlist Downloads & Batch Exporter</h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-emerald-400/20 text-emerald-300 rounded-full border border-emerald-400/30">
                    MP3 & MP4
                  </span>
                </div>
                <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                  Download entire audio mixtapes and video playlists in high definition (320kbps / 1080p)
                </p>
              </div>
            </div>

            {playlists.length > 0 && onDownloadPlaylist && !selectedPlaylist && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onDownloadPlaylist(playlists[0])}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs rounded-2xl shadow-md shadow-emerald-500/30 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Download size={15} /> Download "{playlists[0].name}" ({playlists[0].tracks.length})
                </button>
              </div>
            )}
          </div>

          {selectedPlaylist ? (
            /* EXPANDED SINGLE PLAYLIST VIEW */
            <div className="space-y-5 animate-fade-in">
              {/* Back Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-indigo-900/90 via-indigo-800/80 to-purple-900/90 text-white rounded-3xl shadow-xl border border-indigo-700/50 backdrop-blur-xl">
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedPlaylistId(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-indigo-100 rounded-xl text-xs font-bold transition-all"
                  >
                    <ArrowLeft size={14} /> Back to All Playlists
                  </button>

                  <h2 className="text-xl font-black flex items-center gap-2">
                    <Sparkles size={20} className="text-amber-400" />
                    {selectedPlaylist.name}
                  </h2>
                  {selectedPlaylist.description && (
                    <p className="text-xs text-indigo-200 font-medium">{selectedPlaylist.description}</p>
                  )}
                  <div className="text-[11px] text-indigo-300 font-semibold">
                    {selectedPlaylist.tracks.length} tracks in this playlist
                  </div>
                </div>

                {/* Playlist Action Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedPlaylist.tracks.length > 0 && (
                    <>
                      <button
                        onClick={() => onPlay(selectedPlaylist.tracks[0])}
                        className="px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-black rounded-2xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                      >
                        <Play size={15} className="fill-indigo-900" /> Play All
                      </button>

                      {onDownloadPlaylist && (
                        <button
                          onClick={() => onDownloadPlaylist(selectedPlaylist)}
                          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/30 active:scale-95 transition-all"
                        >
                          <Download size={15} /> Download Playlist ({selectedPlaylist.tracks.length})
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => {
                      onDeletePlaylist(selectedPlaylist.id);
                      setSelectedPlaylistId(null);
                    }}
                    className="p-2.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 rounded-2xl text-xs font-bold transition-all"
                    title="Delete Playlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Track List inside Selected Playlist */}
              {selectedPlaylist.tracks.length === 0 ? (
                <div className="py-16 text-center space-y-3 bg-white dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-8">
                  <Music2 size={40} className="text-gray-300 dark:text-gray-600 mx-auto" />
                  <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Playlist is empty</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Browse songs on Home or Search and tap the "+ Playlist" button on any track card to add songs here!
                  </p>
                </div>
              ) : (
                <div className={
                  viewMode === 'grid'
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                    : "grid grid-cols-1 md:grid-cols-2 gap-3"
                }>
                  {selectedPlaylist.tracks.map((track) => (
                    <TrackCard
                      key={`pl-track-${selectedPlaylist.id}-${track.id}`}
                      track={track}
                      onPlay={onPlay}
                      onDownload={onDownload}
                      isPlayingCurrent={currentTrackId === track.id}
                      isFavorite={favorites.some(f => f.id === track.id)}
                      onToggleFavorite={onToggleFavorite}
                      onRemoveFromPlaylist={onRemoveTrackFromPlaylist ? () => onRemoveTrackFromPlaylist(selectedPlaylist.id, track.id) : undefined}
                      onOpenAddToPlaylist={onOpenAddToPlaylist}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ALL PLAYLISTS GRID */
            <div>
              {playlists.length === 0 ? (
                <div className="py-20 text-center space-y-3 bg-white dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-8">
                  <ListPlus size={44} className="text-gray-300 dark:text-gray-600 mx-auto" />
                  <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No custom playlists created</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Click "New Playlist" above to create custom mixtapes and audio collections.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {playlists.map((playlist) => (
                    <div key={playlist.id} className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <Sparkles size={16} className="text-indigo-500 shrink-0" />
                            {playlist.name}
                          </h3>
                          {playlist.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{playlist.description}</p>
                          )}
                        </div>
                        <button 
                          onClick={() => onDeletePlaylist(playlist.id)}
                          className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                          title="Delete Playlist"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold pt-2 border-t border-gray-100 dark:border-gray-700/60">
                        <span className="bg-gray-100 dark:bg-gray-700/60 px-2.5 py-1 rounded-full text-[11px]">
                          {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}
                        </span>

                        {/* Playlist Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedPlaylistId(playlist.id)}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Eye size={14} /> View
                          </button>

                          {playlist.tracks.length > 0 && (
                            <>
                              <button
                                onClick={() => onPlay(playlist.tracks[0])}
                                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                                title="Play Playlist"
                              >
                                <Play size={14} className="fill-indigo-600 dark:fill-indigo-300" /> Play
                              </button>

                              {onDownloadPlaylist && (
                                <button
                                  onClick={() => onDownloadPlaylist(playlist)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1 active:scale-95"
                                  title="Download Full Playlist"
                                >
                                  <Download size={14} /> Download
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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

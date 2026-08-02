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
  onOpenMetadata?: (track: Track) => void;
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
  onOpenMetadata,
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
    <div className="space-y-6 animate-fade-in pb-20 max-w-6xl mx-auto w-full">
      
      {/* Sub Tabs & Format Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1.5 p-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl w-fit flex-wrap border border-gray-200/60 dark:border-gray-700/60">
            <button
              onClick={() => setActiveSubTab('favorites')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'favorites'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Heart size={15} className={favorites.length > 0 ? "fill-rose-500 text-rose-500" : ""} />
              Favorites ({favorites.length})
            </button>

            <button
              onClick={() => setActiveSubTab('playlists')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'playlists'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ListPlus size={15} />
              Playlists ({playlists.length})
            </button>

            <button
              onClick={() => setActiveSubTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'history'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <History size={15} />
              History ({history.length})
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xs text-xs flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Plus size={15} /> New Playlist
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
            <div className="space-y-6 animate-fade-in">
              {/* Back Header & Hero Banner */}
              <div className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white rounded-3xl shadow-2xl border border-indigo-500/30 backdrop-blur-xl">
                <div className="absolute top-[-30%] right-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-500/15 blur-[90px] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  
                  {/* Left Metadata */}
                  <div className="flex items-center gap-5">
                    {/* Playlist Artwork Collage */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-800 border border-white/15 shadow-2xl shrink-0 grid grid-cols-2 gap-0.5 p-0.5">
                      {selectedPlaylist.tracks.slice(0, 4).map((t, idx) => (
                        <img 
                          key={`hero-art-${idx}`}
                          src={t.thumbnail} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                          }}
                        />
                      ))}
                      {selectedPlaylist.tracks.length === 0 && (
                        <div className="col-span-2 row-span-2 w-full h-full flex items-center justify-center bg-gradient-to-tr from-indigo-600 to-purple-600 text-white">
                          <Music2 size={32} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <button
                        onClick={() => setSelectedPlaylistId(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-indigo-200 rounded-xl text-xs font-bold transition-all mb-1"
                      >
                        <ArrowLeft size={14} /> All Playlists
                      </button>

                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                        {selectedPlaylist.name}
                      </h2>
                      {selectedPlaylist.description && (
                        <p className="text-xs sm:text-sm text-indigo-200/90 font-medium max-w-lg leading-relaxed">{selectedPlaylist.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-indigo-300 font-bold pt-1">
                        <span className="px-2.5 py-0.5 bg-indigo-500/20 rounded-full border border-indigo-400/30">
                          {selectedPlaylist.tracks.length} tracks
                        </span>
                        <span>• Custom Mix Collection</span>
                      </div>
                    </div>
                  </div>

                  {/* Playlist Action Bar */}
                  <div className="flex items-center gap-2.5 flex-wrap shrink-0 self-stretch md:self-auto justify-start md:justify-end">
                    {selectedPlaylist.tracks.length > 0 && (
                      <>
                        <button
                          onClick={() => onPlay(selectedPlaylist.tracks[0])}
                          className="px-5 py-3 bg-white text-indigo-950 hover:bg-indigo-50 font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-all"
                        >
                          <Play size={16} className="fill-indigo-950" /> Play All Tracks
                        </button>

                        {onDownloadPlaylist && (
                          <button
                            onClick={() => onDownloadPlaylist(selectedPlaylist)}
                            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-emerald-500/30 active:scale-95 transition-all"
                          >
                            <Download size={16} /> Download Playlist
                          </button>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => {
                        onDeletePlaylist(selectedPlaylist.id);
                        setSelectedPlaylistId(null);
                        onShowToast("Playlist deleted successfully", "info");
                      }}
                      className="p-3 bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 rounded-2xl text-xs font-bold transition-all border border-rose-500/30"
                      title="Delete Playlist"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Track List inside Selected Playlist */}
              {selectedPlaylist.tracks.length === 0 ? (
                <div className="py-20 text-center space-y-3 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-dashed border-gray-200 dark:border-white/10 p-8 shadow-inner">
                  <Music2 size={44} className="text-gray-400 dark:text-gray-500 mx-auto" />
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">This playlist is currently empty</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Browse songs on Home or Search and tap the "+ Playlist" button on any track card to build your collection!
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
                      onOpenMetadata={onOpenMetadata}
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
                <div className="py-20 text-center space-y-3 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-dashed border-gray-200 dark:border-white/10 p-8 shadow-inner">
                  <ListPlus size={48} className="text-gray-400 dark:text-gray-500 mx-auto" />
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">No custom playlists created</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Click "New Playlist" above to create custom mixtapes, lofi audio collections, and video sets.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-600/20 transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus size={16} /> Create First Playlist
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {playlists.map((playlist) => {
                    const hasTracks = playlist.tracks.length > 0;
                    return (
                      <div 
                        key={playlist.id} 
                        onClick={() => setSelectedPlaylistId(playlist.id)}
                        className="group relative p-5 bg-white dark:bg-slate-900/90 rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-md hover:shadow-2xl transition-all duration-300 space-y-4 cursor-pointer hover:-translate-y-1 overflow-hidden"
                      >
                        {/* Top Section with Collage Cover and Description */}
                        <div className="flex items-start gap-4">
                          {/* 2x2 Collage Cover Art */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-800 border border-gray-200/50 dark:border-white/10 shadow-md shrink-0 grid grid-cols-2 gap-0.5 p-0.5 relative group-hover:scale-105 transition-transform duration-300">
                            {playlist.tracks.slice(0, 4).map((t, idx) => (
                              <img 
                                key={`pl-thumb-${playlist.id}-${idx}`}
                                src={t.thumbnail} 
                                alt="" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop';
                                }}
                              />
                            ))}
                            {playlist.tracks.length === 0 && (
                              <div className="col-span-2 row-span-2 w-full h-full flex items-center justify-center bg-gradient-to-tr from-indigo-600 to-purple-600 text-white">
                                <Music2 size={28} />
                              </div>
                            )}

                            {/* Play overlay on cover */}
                            {hasTracks && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                                <div className="w-9 h-9 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-lg">
                                  <Play size={18} className="fill-indigo-600 ml-0.5" />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pr-6">
                            <h3 className="text-base font-black text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {playlist.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                              {playlist.description || "Custom audio & video mixtape collection."}
                            </p>
                            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded-xl text-[11px] font-extrabold border border-indigo-500/20">
                              <Sparkles size={12} />
                              <span>{playlist.tracks.length} {playlist.tracks.length === 1 ? 'Track' : 'Tracks'}</span>
                            </div>
                          </div>

                          {/* Delete Playlist button */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePlaylist(playlist.id);
                              onShowToast("Playlist removed", "info");
                            }}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                            title="Delete Playlist"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="flex items-center justify-between text-xs font-bold pt-3 border-t border-gray-100 dark:border-white/10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlaylistId(playlist.id);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <Eye size={14} /> Open Playlist
                          </button>

                          {hasTracks && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPlay(playlist.tracks[0]);
                                }}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-indigo-600/20 active:scale-95"
                                title="Play Playlist"
                              >
                                <Play size={13} className="fill-white" /> Play
                              </button>

                              {onDownloadPlaylist && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDownloadPlaylist(playlist);
                                  }}
                                  className="p-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all"
                                  title="Download Entire Playlist"
                                >
                                  <Download size={15} />
                                </button>
                              )}
                            </div>
                          )}
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

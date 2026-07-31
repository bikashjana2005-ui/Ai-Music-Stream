import React, { useState } from 'react';
import { X, Plus, Check, ListPlus, Sparkles, Music } from 'lucide-react';
import { Track, Playlist } from '../types';

interface AddToPlaylistModalProps {
  track: Track;
  playlists: Playlist[];
  onClose: () => void;
  onAddToPlaylist: (playlistId: string, track: Track) => void;
  onCreatePlaylist: (name: string, description: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  track,
  playlists,
  onClose,
  onAddToPlaylist,
  onCreatePlaylist
}) => {
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreatePlaylist(newTitle.trim(), newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setShowCreateNew(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 relative animate-scale-in p-5 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <ListPlus size={20} className="text-indigo-600 dark:text-indigo-400" />
            Add to Playlist
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Selected Track Preview */}
        <div className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/60">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-black text-xs">
            <Music size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{track.title}</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{track.channel}</p>
          </div>
        </div>

        {/* Playlists List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {playlists.length === 0 ? (
            <p className="text-center py-6 text-xs text-gray-500 dark:text-gray-400 font-medium">
              No playlists found. Create your first playlist below!
            </p>
          ) : (
            playlists.map((playlist) => {
              const inPlaylist = playlist.tracks.some(t => t.id === track.id);
              return (
                <div
                  key={playlist.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 border border-gray-100 dark:border-gray-700/50 transition-all"
                >
                  <div className="min-w-0 pr-2">
                    <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                      <Sparkles size={12} className="text-indigo-500 shrink-0" />
                      {playlist.name}
                    </h5>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                      {playlist.tracks.length} tracks
                    </p>
                  </div>

                  {inPlaylist ? (
                    <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold rounded-xl flex items-center gap-1 shrink-0">
                      <Check size={12} /> In Playlist
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        onAddToPlaylist(playlist.id, track);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xl shadow-sm transition-all active:scale-95 shrink-0 flex items-center gap-1"
                    >
                      <Plus size={13} /> Add
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Create New Playlist Option */}
        {!showCreateNew ? (
          <button
            onClick={() => setShowCreateNew(true)}
            className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5"
          >
            <Plus size={15} /> Create New Playlist
          </button>
        ) : (
          <form onSubmit={handleCreateAndAdd} className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <input
              type="text"
              required
              placeholder="Playlist Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreateNew(false)}
                className="flex-1 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md"
              >
                Save Playlist
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

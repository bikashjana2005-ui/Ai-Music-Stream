import React, { useState } from 'react';
import { Settings, Moon, Sun, Shield, Trash2, Check, Volume2, Film, User as UserIcon, Cloud, LogIn, LogOut, Sparkles, CheckCircle2, Share2, Copy, ExternalLink } from 'lucide-react';
import { User } from 'firebase/auth';

interface SettingsViewProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  youtubeApiKey: string;
  setYoutubeApiKey: (key: string) => void;
  audioQuality: string;
  setAudioQuality: (q: string) => void;
  videoQuality?: string;
  setVideoQuality?: (q: string) => void;
  autoPlayOnSelect: boolean;
  setAutoPlayOnSelect: (val: boolean) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  user?: User | null;
  onOpenAuthModal?: () => void;
  onOpenShareModal?: () => void;
  favoritesCount?: number;
  subscriptionsCount?: number;
  playlistsCount?: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  darkMode,
  setDarkMode,
  youtubeApiKey,
  setYoutubeApiKey,
  audioQuality,
  setAudioQuality,
  videoQuality = '1080p',
  setVideoQuality,
  autoPlayOnSelect,
  setAutoPlayOnSelect,
  onShowToast,
  user,
  onOpenAuthModal,
  onOpenShareModal,
  favoritesCount = 0,
  subscriptionsCount = 0,
  playlistsCount = 0
}) => {
  const [equalizerPreset, setEqualizerPreset] = useState('bass');
  const [copiedLink, setCopiedLink] = useState(false);

  const appUrl = window.location.origin + window.location.pathname;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopiedLink(true);
      onShowToast("App link copied to clipboard!", "success");
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleClearCache = () => {
    localStorage.removeItem('aura_ai_favorites');
    localStorage.removeItem('aura_ai_playlists');
    localStorage.removeItem('aura_ai_youtube_key');
    onShowToast("App cache & saved data reset", "info");
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in pb-28">
      
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings size={24} className="text-indigo-600 dark:text-indigo-400" />
          Stream & App Settings
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
          Configure audio streaming quality, player preferences, and system themes.
        </p>
      </div>

      {/* Application Share Link Card */}
      <div className="p-6 bg-gradient-to-br from-indigo-900/90 via-indigo-800/90 to-purple-900/90 text-white rounded-3xl shadow-xl border border-indigo-700/50 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-black">Application Access Link</h2>
              <p className="text-xs text-indigo-200">Share or bookmark this live application URL</p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-amber-400/20 text-amber-300 rounded-full border border-amber-400/30">
            Web & PWA
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-black/30 rounded-2xl border border-white/10">
          <input 
            type="text" 
            readOnly 
            value={appUrl} 
            className="w-full bg-transparent text-xs font-mono text-indigo-100 px-3 py-1 outline-none truncate"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleCopyLink}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                copiedLink 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-white text-indigo-950 hover:bg-indigo-50 shadow-md active:scale-95'
              }`}
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              {copiedLink ? 'Copied Link' : 'Copy Link'}
            </button>
            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-extrabold transition-all"
                title="Share dialog"
              >
                <Share2 size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Account & Firebase Cloud Sync Card */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <UserIcon size={18} className="text-indigo-600 dark:text-indigo-400" />
            Account & Cloud Sync
          </h2>
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
            user
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
          }`}>
            {user ? 'Firestore Cloud Active' : 'Offline Mode'}
          </span>
        </div>

        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User Avatar'} className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500 shadow-sm" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  <UserIcon size={22} />
                </div>
              )}
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                  {user.displayName || 'Authenticated User'}
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{user.email}</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                  Synced: {subscriptionsCount} Subscriptions • {favoritesCount} Favorites • {playlistsCount} Playlists
                </p>
              </div>
            </div>

            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
            >
              <Cloud size={14} />
              Manage Account
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-slate-900/40 rounded-2xl border border-gray-200/80 dark:border-white/10">
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                <Cloud size={16} className="text-indigo-500" />
                Sign in with Google Account
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                Backup & sync your playlists, favorites, and channel subscriptions across all devices.
              </p>
            </div>

            <button
              onClick={onOpenAuthModal}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
            >
              <LogIn size={15} />
              Sign In to Sync
            </button>
          </div>
        )}
      </div>

      {/* Audio & Streaming Settings */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Volume2 size={18} className="text-indigo-600 dark:text-indigo-400" />
          Audio Playback & Quality
        </h2>

        <div className="space-y-4">
          {/* Audio Quality Selection */}
          <div>
            <div className="mb-2">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Streaming Audio Quality</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Select desired bitrate for original YouTube audio streams</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: '320', label: '320 kbps', desc: 'Ultra HD' },
                { id: '256', label: '256 kbps', desc: 'High Quality' },
                { id: '128', label: '128 kbps', desc: 'Data Saver' },
                { id: 'auto', label: 'Auto Bitrate', desc: 'Adaptive' },
              ].map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setAudioQuality(q.id);
                    localStorage.setItem('aura_ai_audio_quality', q.id);
                    onShowToast(`Audio quality set to ${q.label}`);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    audioQuality === q.id
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-md shadow-indigo-600/20 scale-[1.02]'
                      : 'bg-gray-50 dark:bg-gray-700/60 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-indigo-300'
                  }`}
                >
                  <p className="text-xs font-black">{q.label}</p>
                  <p className={`text-[10px] mt-0.5 ${audioQuality === q.id ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>{q.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Default Video Download Quality Selection */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="mb-2">
              <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Film size={15} className="text-indigo-500" />
                Default Video Download Quality
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pre-selected resolution automatically applied to each & every video export</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { id: '1080p', label: '1080p', desc: 'Full HD' },
                { id: '720p', label: '720p', desc: 'HD Standard' },
                { id: '480p', label: '480p', desc: 'SD Mobile' },
                { id: '360p', label: '360p', desc: 'Medium' },
                { id: '240p', label: '240p', desc: 'Low Quality' },
                { id: '144p', label: '144p', desc: 'Lowest Data' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    if (setVideoQuality) setVideoQuality(v.id);
                    localStorage.setItem('aura_ai_video_quality', v.id);
                    onShowToast(`Default video quality set to ${v.label}`);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    videoQuality === v.id
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-md shadow-indigo-600/20 scale-[1.02]'
                      : 'bg-gray-50 dark:bg-gray-700/60 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-indigo-300'
                  }`}
                >
                  <p className="text-xs font-black">{v.label}</p>
                  <p className={`text-[10px] mt-0.5 ${videoQuality === v.id ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>{v.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Do Not Play Automatically Control */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Play Songs Automatically on Select</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {autoPlayOnSelect 
                  ? "Songs play immediately when clicked." 
                  : "Off: Songs load into player without playing automatically until you press Play."}
              </p>
            </div>
            <button
              onClick={() => {
                const newValue = !autoPlayOnSelect;
                setAutoPlayOnSelect(newValue);
                localStorage.setItem('aura_ai_autoplay_select', String(newValue));
                onShowToast(newValue ? "Auto-play enabled on track select" : "Auto-play disabled (songs won't play automatically)", "info");
              }}
              className={`w-13 h-7 rounded-full transition-colors relative p-1 shrink-0 ${
                autoPlayOnSelect ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                autoPlayOnSelect ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Equalizer Preset */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Equalizer Preset</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Optimize acoustic frequencies for original sound output</p>
            </div>
            <select
              value={equalizerPreset}
              onChange={(e) => {
                setEqualizerPreset(e.target.value);
                onShowToast(`Equalizer preset set to ${e.target.value}`);
              }}
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-bold rounded-xl p-2.5 border border-gray-200 dark:border-gray-600"
            >
              <option value="bass">Bass Boost</option>
              <option value="vocal">Vocal Clarity</option>
              <option value="flat">Flat Studio</option>
              <option value="acoustic">Acoustic Warmth</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visual Theme */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
          Interface Theme
        </h2>

        <div className="flex gap-3">
          <button
            onClick={() => setDarkMode(false)}
            className={`flex-1 p-4 rounded-2xl border text-center transition-all ${
              !darkMode 
                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold ring-2 ring-indigo-500/20' 
                : 'border-gray-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
          >
            <Sun size={20} className="mx-auto mb-2 text-amber-500" />
            <span className="text-xs">Light Mode</span>
          </button>

          <button
            onClick={() => setDarkMode(true)}
            className={`flex-1 p-4 rounded-2xl border text-center transition-all ${
              darkMode 
                ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 font-bold ring-2 ring-indigo-500/20' 
                : 'border-gray-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
          >
            <Moon size={20} className="mx-auto mb-2 text-indigo-400" />
            <span className="text-xs">Dark Mode</span>
          </button>
        </div>
      </div>

      {/* System Status & Data Management */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Shield size={18} className="text-indigo-600 dark:text-indigo-400" />
          AI Engine Status & Data
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">Gemini AI Model</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">gemini-3.6-flash</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">YouTube Audio Stream</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check size={14} /> Seamless Original Sound Engine
            </span>
          </div>

          <div className="pt-2">
            <button
              onClick={handleClearCache}
              className="w-full py-3 px-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
            >
              <Trash2 size={16} /> Reset Saved App Cache & Settings
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

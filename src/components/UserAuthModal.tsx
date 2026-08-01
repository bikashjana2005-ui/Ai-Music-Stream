import React, { useState } from 'react';
import { X, LogIn, LogOut, ShieldCheck, Cloud, CloudOff, CheckCircle2, Sparkles, User as UserIcon, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { loginWithGoogle, logoutUser } from '../lib/firebase';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSyncGoogleAccount?: () => void;
  favoritesCount: number;
  subscriptionsCount: number;
  playlistsCount: number;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onShowToast,
  onSyncGoogleAccount,
  favoritesCount,
  subscriptionsCount,
  playlistsCount
}) => {
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      onShowToast(`Welcome back, ${res.user.displayName || 'Music Enthusiast'}! Cloud synced.`, 'success');
      onClose();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        onShowToast('Google sign-in cancelled.', 'error');
      } else {
        onShowToast('Sign in failed. If you are in preview, try opening the app in a new tab.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logoutUser();
      onShowToast('Signed out successfully.', 'info');
      onClose();
    } catch (err: any) {
      onShowToast('Error signing out.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-white/85 dark:bg-slate-900/90 backdrop-blur-3xl backdrop-saturate-200 border border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative text-gray-900 dark:text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200/60 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Cloud size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-gray-900 dark:text-white flex items-center gap-1.5">
                    Firebase Cloud Sync
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    Cloud database & Auth persistence
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="py-6 space-y-5">
              {user ? (
                /* Logged In View */
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5 p-4 bg-indigo-500/10 dark:bg-indigo-400/15 rounded-2xl border border-indigo-500/20">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500 shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-lg">
                        <UserIcon size={22} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-sm text-gray-900 dark:text-white truncate">
                        {user.displayName || 'Authenticated Listener'}
                      </h4>
                      <p className="text-xs text-indigo-600 dark:text-indigo-300 font-semibold truncate">
                        {user.email}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        <CheckCircle2 size={12} /> Connected to Firestore Cloud
                      </span>
                    </div>
                  </div>

                  {/* Cloud Sync Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="bg-gray-100 dark:bg-slate-800/80 p-3 rounded-2xl text-center border border-gray-200/60 dark:border-white/10">
                      <span className="block text-lg font-black text-rose-500">{subscriptionsCount}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Channels</span>
                    </div>
                    <div className="bg-gray-100 dark:bg-slate-800/80 p-3 rounded-2xl text-center border border-gray-200/60 dark:border-white/10">
                      <span className="block text-lg font-black text-indigo-500">{favoritesCount}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Favorites</span>
                    </div>
                    <div className="bg-gray-100 dark:bg-slate-800/80 p-3 rounded-2xl text-center border border-gray-200/60 dark:border-white/10">
                      <span className="block text-lg font-black text-purple-500">{playlistsCount}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Playlists</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={async () => {
                        if (onSyncGoogleAccount) {
                          setIsSyncing(true);
                          await onSyncGoogleAccount();
                          setTimeout(() => setIsSyncing(false), 800);
                        }
                      }}
                      disabled={isSyncing || loading}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-98"
                    >
                      <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                      <span>{isSyncing ? 'Syncing Google Account...' : 'Sync Google Account Data Now'}</span>
                    </button>

                    <button
                      onClick={handleSignOut}
                      disabled={loading || isSyncing}
                      className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/25 text-xs font-black rounded-2xl flex items-center justify-center gap-2 transition-all"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                      Sign Out of Firebase
                    </button>
                  </div>
                </div>
              ) : (
                /* Logged Out View */
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                    <ShieldCheck size={32} />
                  </div>

                  <div>
                    <h4 className="text-base font-black text-gray-900 dark:text-white">
                      Sync Across All Devices
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 leading-relaxed px-2">
                      Sign in with Google to securely store your YouTube subscriptions, favorite songs, and playlists in Firebase Cloud Firestore.
                    </p>
                  </div>

                  <button
                    onClick={handleSignIn}
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-95"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                        </svg>
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium flex items-center justify-center gap-1">
                    <CloudOff size={10} /> Offline local storage is also active as fallback.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-200/60 dark:border-white/10 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-gray-200 dark:bg-slate-800 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

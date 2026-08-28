import React, { useState, useEffect } from 'react';
import { 
  X, LogIn, LogOut, ShieldCheck, Cloud, CloudOff, CheckCircle2, 
  Sparkles, User as UserIcon, Loader2, RefreshCw, ExternalLink, Mail, Key, UserPlus, AlertCircle,
  Users, Trash2, Plus, Check, Eye, EyeOff, Music2, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { 
  loginWithGoogle, 
  loginWithGoogleRedirect, 
  loginWithEmail, 
  registerWithEmail, 
  loginAnonymously, 
  logoutUser 
} from '../lib/firebase';

export interface SavedAccount {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  provider: 'google' | 'email' | 'guest';
  lastUsed: number;
}

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSyncGoogleAccount?: () => void;
  onSyncYouTubeSubscriptions?: (token?: string) => Promise<void>;
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
  onSyncYouTubeSubscriptions,
  favoritesCount,
  subscriptionsCount,
  playlistsCount
}) => {
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingYouTube, setIsSyncingYouTube] = useState(false);
  const [authTab, setAuthTab] = useState<'google' | 'email' | 'guest' | 'accounts'>('google');
  
  // Email form states
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Saved accounts state from localStorage
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() => {
    try {
      const saved = localStorage.getItem('aura_saved_accounts');
      if (saved) return JSON.parse(saved);
      return [
        {
          uid: 'google-bikash-real',
          email: 'bikashjana908@gmail.com',
          displayName: 'Bikash Jana',
          photoURL: null,
          isAnonymous: false,
          provider: 'google',
          lastUsed: Date.now()
        }
      ];
    } catch {
      return [
        {
          uid: 'google-bikash-real',
          email: 'bikashjana908@gmail.com',
          displayName: 'Bikash Jana',
          photoURL: null,
          isAnonymous: false,
          provider: 'google',
          lastUsed: Date.now()
        }
      ];
    }
  });

  // Keep savedAccounts synced with active user
  useEffect(() => {
    if (user) {
      let provider: 'google' | 'email' | 'guest' = 'email';
      if (user.isAnonymous) {
        provider = 'guest';
      } else if (user.providerData.some(p => p.providerId === 'google.com') || user.photoURL) {
        provider = 'google';
      }

      const newAcc: SavedAccount = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous,
        provider,
        lastUsed: Date.now()
      };

      setSavedAccounts((prev) => {
        const filtered = prev.filter(a => a.uid !== user.uid);
        const updated = [newAcc, ...filtered];
        try {
          localStorage.setItem('aura_saved_accounts', JSON.stringify(updated));
        } catch (e) {
          console.error('Error saving accounts:', e);
        }
        return updated;
      });
    }
  }, [user]);

  const handleRemoveSavedAccount = (e: React.MouseEvent, uid: string) => {
    e.stopPropagation();
    setSavedAccounts((prev) => {
      const updated = prev.filter(a => a.uid !== uid);
      try {
        localStorage.setItem('aura_saved_accounts', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
    onShowToast('Account profile removed from device.', 'info');
  };

  const handleSwitchToAccount = async (acc: SavedAccount) => {
    if (user && user.uid === acc.uid) {
      onShowToast(`Already active as ${acc.displayName || acc.email || 'this profile'}.`, 'info');
      return;
    }

    setErrorMsg(null);

    // If currently signed in as a different user, sign out first
    if (user) {
      try {
        await logoutUser();
      } catch (err) {}
    }

    if (acc.provider === 'guest' || acc.isAnonymous) {
      await handleGuestSignIn();
    } else if (acc.provider === 'email' && acc.email) {
      setAuthTab('email');
      setIsRegistering(false);
      setEmail(acc.email);
      setPassword('');
      onShowToast(`Switched target to ${acc.email}. Enter password to log in!`, 'info');
    } else {
      setAuthTab('google');
      onShowToast(`Click "Sign In with Google" to switch to ${acc.displayName || acc.email || 'Google Account'}`, 'info');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginWithGoogle();
      onShowToast(`Welcome back, ${res.user.displayName || 'Music Enthusiast'}! Cloud synced.`, 'success');
      
      // Auto-sync YouTube subscriptions if granted
      if (res.accessToken && onSyncYouTubeSubscriptions) {
        onShowToast('Syncing YouTube channels from your Google Account...', 'info');
        try {
          await onSyncYouTubeSubscriptions(res.accessToken);
        } catch (ytErr) {
          console.warn('YouTube auto sync after login notice:', ytErr);
        }
      }
      onClose();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      const errMsg = err?.message || '';
      const errCode = err?.code || '';
      if (errCode === 'auth/popup-closed-by-user' || errCode === 'auth/cancelled-popup-request') {
        setErrorMsg('Google sign-in popup was closed before completion.');
        onShowToast('Google sign-in popup closed.', 'info');
      } else if (errCode === 'auth/popup-blocked') {
        setErrorMsg('Browser popup was blocked by iframe. Use Email login or 1-Click Guest Sync below.');
        onShowToast('Popup blocked by browser iframe.', 'error');
      } else if (errCode === 'auth/unauthorized-domain') {
        setErrorMsg(`Domain (${window.location.host}) is not in Firebase authorized domains. Switch to Email or 1-Click Guest Sync!`);
        onShowToast('Domain not authorized for Google OAuth.', 'error');
      } else if (errMsg.includes('403') || errMsg.includes('access_denied') || errMsg.includes('verification') || errMsg.includes('unverified') || errCode === 'auth/access-denied') {
        setErrorMsg('Google blocked OAuth (App Verification Pending for sandbox domain). Please use Email Sign-In or 1-Click Guest Cloud Sync below!');
        onShowToast('Google OAuth verification restriction. Please use Email or Guest mode.', 'error');
      } else {
        setErrorMsg(err?.message || 'Google sign-in failed. Please use Email Login or 1-Click Guest Sync!');
        onShowToast('Google sign in error. Try Email or Guest mode.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRedirectSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      onShowToast('Redirecting to Google Sign-In...', 'info');
      await loginWithGoogleRedirect();
    } catch (err: any) {
      console.error('Google Redirect error:', err);
      setErrorMsg('Redirect sign-in error: ' + (err?.message || 'Please try opening in a new tab or use Email login.'));
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in both email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (isRegistering) {
        const u = await registerWithEmail(email, password, displayName || 'Aura Listener');
        onShowToast(`Account created! Welcome, ${u.displayName || 'Music Listener'}.`, 'success');
      } else {
        const u = await loginWithEmail(email, password);
        onShowToast(`Welcome back, ${u.displayName || u.email || 'User'}!`, 'success');
      }
      onClose();
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      if (err?.code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email already exists. Try signing in instead!');
        setIsRegistering(false);
      } else if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found') {
        setErrorMsg('Invalid email or password. Please check your credentials.');
      } else if (err?.code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (err?.code === 'auth/operation-not-allowed') {
        setErrorMsg('Email auth is not enabled in Firebase. Please use 1-Click Guest Sync!');
      } else {
        setErrorMsg(err?.message || 'Authentication failed. Try 1-Click Guest Sync.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const u = await loginAnonymously();
      onShowToast(`Signed in as Guest! Cloud Firestore sync activated.`, 'success');
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/admin-restricted-operation' || err?.code === 'auth/operation-not-allowed' || err?.message?.includes('admin-restricted-operation')) {
        setErrorMsg('Anonymous guest sign-in is disabled in Firebase. Please sign in with Google or Email to sync your library.');
        onShowToast('Please sign in with Google or Email to sync.', 'info');
        setAuthTab('google');
      } else {
        setErrorMsg('Guest sign in: ' + (err?.message || 'Please use Google or Email login.'));
        onShowToast('Guest sign-in unavailable.', 'info');
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
    } catch (err: any) {
      onShowToast('Error signing out.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewTab = () => {
    window.open(window.location.origin, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="auth-modal-overlay" className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop with blur & ambient gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            id="auth-modal-card"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl relative text-slate-900 dark:text-white z-10 overflow-hidden flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient visual banner */}
            <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-red-600 via-rose-600 to-zinc-950 text-white overflow-hidden">
              {/* Decorative background glow circles */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-red-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />

              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                    <Music2 size={24} className="text-white drop-shadow" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-xl text-white tracking-tight">
                        {user ? 'Account Hub' : 'Welcome to Ai Music Stream'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-[10px] font-bold tracking-wide uppercase text-white/90">
                        Cloud Sync
                      </span>
                    </div>
                    <p className="text-xs text-rose-100/90 font-medium mt-0.5">
                      {user 
                        ? 'Manage your cloud profile and synchronized library' 
                        : 'Sign in to access synchronized playlists, favorites & channels'}
                    </p>
                  </div>
                </div>

                <button
                  id="auth-modal-close-btn"
                  onClick={onClose}
                  className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 backdrop-blur-sm transition-colors shrink-0"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Active User Quick Ribbon (if logged in) */}
              {user && (
                <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {user.photoURL && user.photoURL.trim() ? (
                      <img
                        src={user.photoURL}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-white/50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                        <UserIcon size={14} />
                      </div>
                    )}
                    <span className="text-xs font-semibold text-white truncate">
                      {user.displayName || user.email || 'Guest Listener'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Synced
                  </span>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 pt-4 pb-1">
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs font-bold">
                <button
                  id="tab-google"
                  onClick={() => { setAuthTab('google'); setErrorMsg(null); }}
                  className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    authTab === 'google'
                      ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles size={13} />
                  <span className="truncate">Google</span>
                </button>

                <button
                  id="tab-email"
                  onClick={() => { setAuthTab('email'); setErrorMsg(null); }}
                  className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    authTab === 'email'
                      ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Mail size={13} />
                  <span className="truncate">Email</span>
                </button>

                <button
                  id="tab-guest"
                  onClick={() => { setAuthTab('guest'); setErrorMsg(null); }}
                  className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    authTab === 'guest'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserIcon size={13} />
                  <span className="truncate">1-Click</span>
                </button>

                <button
                  id="tab-accounts"
                  onClick={() => { setAuthTab('accounts'); setErrorMsg(null); }}
                  className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
                    authTab === 'accounts'
                      ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-rose-300 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users size={13} />
                  <span className="truncate">Profiles</span>
                  {savedAccounts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow">
                      {savedAccounts.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Body content */}
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Error Message Box */}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-700 dark:text-rose-300 space-y-2"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                    <p className="font-medium leading-relaxed flex-1">{errorMsg}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setAuthTab('email'); setErrorMsg(null); }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-xl transition-all shadow-sm flex items-center gap-1 active:scale-95"
                    >
                      <Mail size={12} /> Email Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthTab('guest'); setErrorMsg(null); }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-xl transition-all shadow-sm flex items-center gap-1 active:scale-95"
                    >
                      <UserIcon size={12} /> 1-Click Guest Sync
                    </button>
                  </div>
                </motion.div>
              )}

              {/* TAB 1: GOOGLE AUTH */}
              {authTab === 'google' && (
                <motion.div
                  key="google-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <div className="text-center space-y-1.5 py-1">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Sign in with your Google Account
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Instant synchronization for your liked tracks, custom playlists, and subscribed YouTube music channels.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {/* Official Google Button */}
                    <button
                      id="google-signin-primary-btn"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-bold text-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow flex items-center justify-center gap-3 transition-all active:scale-98 disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 size={18} className="animate-spin text-red-600" />
                      ) : (
                        <>
                          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                          </svg>
                          <span>Continue with Google</span>
                        </>
                      )}
                    </button>

                    {/* Secondary Redirect Option */}
                    <button
                      onClick={handleGoogleRedirectSignIn}
                      disabled={loading}
                      className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-200/80 dark:border-slate-700/60"
                    >
                      <LogIn size={14} className="text-red-500" />
                      <span>Use Full-Page Redirect Sign-In</span>
                    </button>
                  </div>

                  {/* Browser Sandbox Helper Box */}
                  <div className="p-3.5 bg-red-50/70 dark:bg-red-950/20 border border-red-200/70 dark:border-red-800/30 rounded-2xl text-left space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-red-900 dark:text-red-200">
                      <span className="flex items-center gap-1.5">
                        <ExternalLink size={14} className="text-red-600 dark:text-red-400" />
                        Running in Preview Mode?
                      </span>
                      <button
                        onClick={handleOpenNewTab}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1"
                      >
                        Open New Tab <ArrowRight size={11} />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      If your browser restricts popup windows inside iframes, opening in a standalone tab resolves Google OAuth verification smoothly.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: EMAIL / PASSWORD */}
              {authTab === 'email' && (
                <motion.form
                  key="email-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleEmailAuth}
                  className="space-y-3.5"
                >
                  <div className="text-center space-y-1">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {isRegistering ? 'Create your Account' : 'Sign in with Email'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isRegistering 
                        ? 'Set up a password-protected cloud profile' 
                        : 'Enter your account credentials to access your library'}
                    </p>
                  </div>

                  {isRegistering && (
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Display Name</label>
                      <div className="relative">
                        <UserIcon size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                          id="input-display-name"
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. Alex Rivera"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-slate-900 dark:text-white transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        id="input-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-slate-900 dark:text-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Password</label>
                    <div className="relative">
                      <Key size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        id="input-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-slate-900 dark:text-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="submit-email-auth-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 mt-1"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isRegistering ? (
                      <>
                        <UserPlus size={16} /> Create Account
                      </>
                    ) : (
                      <>
                        <LogIn size={16} /> Sign In
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                        setErrorMsg(null);
                      }}
                      className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                    >
                      {isRegistering 
                        ? 'Already registered? Switch to Sign In' 
                        : "New user? Create an Account"}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* TAB 3: 1-CLICK GUEST SYNC */}
              {authTab === 'guest' && (
                <motion.div
                  key="guest-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4 text-center py-2"
                >
                  <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                    <ShieldCheck size={28} />
                  </div>

                  <div className="space-y-1 max-w-sm mx-auto">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Instant 1-Click Cloud Access
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Start playing and saving tracks instantly. No forms, no popups, and no passwords required. Your data is automatically backed up to Cloud Firestore.
                    </p>
                  </div>

                  <button
                    id="guest-signin-btn"
                    onClick={handleGuestSignIn}
                    disabled={loading}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 transition-all active:scale-98 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Activate 1-Click Cloud Sync</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              {/* TAB 4: MULTIPLE ACCOUNTS SWITCHER */}
              {authTab === 'accounts' && (
                <motion.div
                  key="accounts-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Users size={14} className="text-red-500" />
                        Saved User Profiles ({savedAccounts.length})
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Switch between multiple Google, Email, or Guest profiles instantly.
                      </p>
                    </div>

                    <button
                      onClick={() => setAuthTab('email')}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center gap-1 transition-all active:scale-95 shrink-0"
                    >
                      <Plus size={12} /> Add New
                    </button>
                  </div>

                  {savedAccounts.length === 0 ? (
                    <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <UserIcon size={28} className="mx-auto text-slate-400" />
                      <p className="text-xs text-slate-500 font-medium">No saved accounts found on this device.</p>
                      <button
                        onClick={() => setAuthTab('google')}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl"
                      >
                        Sign in now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                      {savedAccounts.map((acc) => {
                        const isActive = user && user.uid === acc.uid;
                        return (
                          <div
                            key={acc.uid}
                            onClick={() => handleSwitchToAccount(acc)}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                              isActive
                                ? 'bg-red-500/10 dark:bg-red-500/20 border-red-500/40 ring-2 ring-red-500/30'
                                : 'bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/60'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {acc.photoURL && acc.photoURL.trim() ? (
                                <img
                                  src={acc.photoURL}
                                  alt={acc.displayName || 'Account'}
                                  className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-red-500/50"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                  <UserIcon size={16} />
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {acc.displayName || (acc.isAnonymous ? 'Guest Listener' : 'User Account')}
                                  </span>
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase border ${
                                    acc.provider === 'google'
                                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                      : acc.provider === 'guest'
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                  }`}>
                                    {acc.provider}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  {acc.email || `ID: ${acc.uid.slice(0, 12)}...`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              {isActive ? (
                                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-lg">
                                  <Check size={12} /> Active
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSwitchToAccount(acc);
                                  }}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] rounded-lg shadow transition-all active:scale-95"
                                >
                                  Switch
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => handleRemoveSavedAccount(e, acc.uid)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Remove profile from this device"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Cloud Sync Library Overview Cards (if user is signed in) */}
              {user && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cloud Synced Library
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Up to date
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-2xl text-center border border-slate-200/80 dark:border-slate-700/60">
                      <span className="block text-base font-black text-rose-500">{subscriptionsCount}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Channels</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-2xl text-center border border-slate-200/80 dark:border-slate-700/60">
                      <span className="block text-base font-black text-red-500">{favoritesCount}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Favorites</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-2xl text-center border border-slate-200/80 dark:border-slate-700/60">
                      <span className="block text-base font-black text-amber-500">{playlistsCount}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Playlists</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={async () => {
                        setIsSyncing(true);
                        try {
                          if (onSyncYouTubeSubscriptions) {
                            await onSyncYouTubeSubscriptions();
                          } else if (onSyncGoogleAccount) {
                            await onSyncGoogleAccount();
                          }
                        } finally {
                          setTimeout(() => setIsSyncing(false), 800);
                        }
                      }}
                      disabled={isSyncing || loading}
                      className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
                    >
                      <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                      <span>{isSyncing ? 'Syncing Subscriptions...' : 'Sync YouTube & Google Library'}</span>
                    </button>

                    <button
                      id="signout-current-user-btn"
                      onClick={handleSignOut}
                      disabled={loading || isSyncing}
                      className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-98 shrink-0"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium">
                <Cloud size={12} className="text-indigo-500" /> Firebase Secured
              </span>

              <button
                id="auth-modal-done-btn"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
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

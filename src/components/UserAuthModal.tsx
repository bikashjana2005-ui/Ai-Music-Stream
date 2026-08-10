import React, { useState, useEffect } from 'react';
import { 
  X, LogIn, LogOut, ShieldCheck, Cloud, CloudOff, CheckCircle2, 
  Sparkles, User as UserIcon, Loader2, RefreshCw, ExternalLink, Mail, Key, UserPlus, AlertCircle,
  Users, Trash2, Plus, Check
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
  const [authTab, setAuthTab] = useState<'google' | 'email' | 'guest'>('google');
  const [showAccountsList, setShowAccountsList] = useState(false);
  
  // Email form states
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Saved accounts state from localStorage
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() => {
    try {
      const saved = localStorage.getItem('aura_saved_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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
      // Instantly log into Guest mode
      await handleGuestSignIn();
    } else if (acc.provider === 'email' && acc.email) {
      setAuthTab('email');
      setIsRegistering(false);
      setEmail(acc.email);
      setPassword('');
      setShowAccountsList(false);
      onShowToast(`Switched profile target to ${acc.email}. Enter password to sign in!`, 'info');
    } else {
      setAuthTab('google');
      setShowAccountsList(false);
      onShowToast(`Click "Sign In with Google" to switch to ${acc.displayName || acc.email || 'Google Account'}`, 'info');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginWithGoogle();
      onShowToast(`Welcome back, ${res.user.displayName || 'Music Enthusiast'}! Cloud synced.`, 'success');
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
      console.error('Guest Auth Error:', err);
      setErrorMsg('Guest sign in failed: ' + (err?.message || 'Unknown error'));
      onShowToast('Guest sign-in failed.', 'error');
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

  const handleOpenNewTab = () => {
    window.open(window.location.origin, '_blank');
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
            className="w-full max-w-md bg-white/90 dark:bg-slate-900/95 backdrop-blur-3xl border border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative text-gray-900 dark:text-white z-10 overflow-hidden"
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
                    Firebase Cloud Account
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    Cloud Database & Multi-Device Sync
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
            <div className="py-4 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Multi-Accounts Switcher Section */}
              {savedAccounts.length > 0 && (
                <div className="bg-gray-100/80 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-gray-200/80 dark:border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Users size={14} className="text-indigo-500" />
                      Saved Accounts ({savedAccounts.length})
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">Tap profile to switch</span>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {savedAccounts.map((acc) => {
                      const isActive = user && user.uid === acc.uid;
                      return (
                        <div
                          key={acc.uid}
                          onClick={() => handleSwitchToAccount(acc)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-indigo-500/15 border-indigo-500/40 ring-1 ring-indigo-500/30' 
                              : 'bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 border-gray-200/60 dark:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {acc.photoURL ? (
                              <img src={acc.photoURL} alt={acc.displayName || 'Account'} className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-indigo-500" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                <UserIcon size={14} />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                  {acc.displayName || (acc.isAnonymous ? 'Guest Listener' : 'User Account')}
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                                  acc.provider === 'google' 
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' 
                                    : acc.provider === 'guest' 
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                                }`}>
                                  {acc.provider.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                {acc.email || `ID: ${acc.uid.slice(0, 10)}...`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {isActive ? (
                              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-1 rounded-lg">
                                <Check size={12} /> Active
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSwitchToAccount(acc);
                                }}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg shadow transition-all active:scale-95"
                              >
                                Switch
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => handleRemoveSavedAccount(e, acc.uid)}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Remove saved account"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                        <UserIcon size={22} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-sm text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                        {user.displayName || (user.isAnonymous ? 'Guest Music Listener' : 'Authenticated User')}
                        {user.isAnonymous && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                            Guest
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-indigo-600 dark:text-indigo-300 font-semibold truncate">
                        {user.email || `ID: ${user.uid.slice(0, 12)}...`}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        <CheckCircle2 size={12} /> Syncing with Firestore Cloud
                      </span>
                    </div>
                  </div>

                  {/* Cloud Sync Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
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
                    {onSyncGoogleAccount && (
                      <button
                        onClick={async () => {
                          setIsSyncing(true);
                          await onSyncGoogleAccount();
                          setTimeout(() => setIsSyncing(false), 800);
                        }}
                        disabled={isSyncing || loading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-98"
                      >
                        <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                        <span>{isSyncing ? 'Syncing Google Account...' : 'Sync Google YouTube Account'}</span>
                      </button>
                    )}

                    <button
                      onClick={handleSignOut}
                      disabled={loading || isSyncing}
                      className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/25 text-xs font-black rounded-2xl flex items-center justify-center gap-2 transition-all"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                /* Logged Out View - Multi Option */
                <div className="space-y-4">
                  {/* Method Switcher Tabs */}
                  <div className="flex bg-gray-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-gray-200/60 dark:border-white/10 text-xs font-bold">
                    <button
                      onClick={() => { setAuthTab('google'); setErrorMsg(null); }}
                      className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        authTab === 'google' 
                          ? 'bg-white dark:bg-indigo-600 text-gray-900 dark:text-white shadow-sm' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Sparkles size={13} /> Google
                    </button>
                    <button
                      onClick={() => { setAuthTab('email'); setErrorMsg(null); }}
                      className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        authTab === 'email' 
                          ? 'bg-white dark:bg-indigo-600 text-gray-900 dark:text-white shadow-sm' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Mail size={13} /> Email
                    </button>
                    <button
                      onClick={() => { setAuthTab('guest'); setErrorMsg(null); }}
                      className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        authTab === 'guest' 
                          ? 'bg-white dark:bg-indigo-600 text-gray-900 dark:text-white shadow-sm' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <UserIcon size={13} /> 1-Click Guest
                    </button>
                  </div>

                  {/* Error / Alert Banner */}
                  {errorMsg && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-xs text-amber-700 dark:text-amber-300 space-y-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 text-amber-500 mt-0.5" />
                        <div className="leading-snug flex-1">
                          <p className="font-semibold">{errorMsg}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => { setAuthTab('email'); setErrorMsg(null); }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg transition-all active:scale-95 shadow-sm flex items-center gap-1"
                        >
                          <Mail size={12} /> Use Email Login
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAuthTab('guest'); setErrorMsg(null); }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg transition-all active:scale-95 shadow-sm flex items-center gap-1"
                        >
                          <UserIcon size={12} /> 1-Click Guest Sync
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Google Auth Tab */}
                  {authTab === 'google' && (
                    <div className="space-y-3 pt-1 text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                        Connect with Google to auto-sync YouTube channels, playlists, and favorites to Firebase Cloud.
                      </p>

                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={handleGoogleSignIn}
                          disabled={loading}
                          className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <>
                              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                              </svg>
                              <span>Sign In with Google (Popup)</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleGoogleRedirectSignIn}
                          disabled={loading}
                          className="w-full py-2.5 px-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all border border-gray-200/80 dark:border-white/10"
                        >
                          <LogIn size={14} className="text-indigo-500" />
                          <span>Try Google Redirect Sign-In Mode</span>
                        </button>
                      </div>

                      <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 rounded-2xl text-left space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          <span className="flex items-center gap-1.5">
                            <ExternalLink size={13} />
                            Iframe Preview Solution
                          </span>
                          <button
                            onClick={handleOpenNewTab}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg shadow transition-all active:scale-95"
                          >
                            Open in New Tab
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                          Browsers often block OAuth popups inside embedded preview iframes. Click <strong>Open in New Tab</strong> to run Aura in a standalone window where Google OAuth popups work 100% seamlessly!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Email / Password Tab */}
                  {authTab === 'email' && (
                    <form onSubmit={handleEmailAuth} className="space-y-3 pt-1">
                      {isRegistering && (
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Your Name</label>
                          <div className="relative">
                            <UserIcon size={15} className="absolute left-3 top-3 text-gray-400" />
                            <input
                              type="text"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              placeholder="John Doe"
                              className="w-full pl-9 pr-3 py-2.5 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Email Address</label>
                        <div className="relative">
                          <Mail size={15} className="absolute left-3 top-3 text-gray-400" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">Password</label>
                        <div className="relative">
                          <Key size={15} className="absolute left-3 top-3 text-gray-400" />
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : isRegistering ? (
                          <>
                            <UserPlus size={16} /> Create New Account
                          </>
                        ) : (
                          <>
                            <LogIn size={16} /> Sign In with Email
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
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {isRegistering 
                            ? 'Already have an account? Sign In' 
                            : "Don't have an account? Register here"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 1-Click Guest Sync Tab */}
                  {authTab === 'guest' && (
                    <div className="space-y-3 pt-1 text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                        Instant 1-Click cloud sync. No password or Google popup required! Stores data in Firebase Firestore automatically.
                      </p>

                      <button
                        onClick={handleGuestSignIn}
                        disabled={loading}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <>
                            <ShieldCheck size={18} />
                            <span>Activate 1-Click Guest Cloud Sync</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium flex items-center justify-center gap-1 text-center pt-2">
                    <CloudOff size={10} /> Local browser storage is active as an instant fallback.
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

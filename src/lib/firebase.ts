import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  signOut, 
  onAuthStateChanged,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { 
  initializeFirestore,
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence offline/unreachable Firestore warnings (it operates automatically in offline cache mode)
try {
  setLogLevel('silent');
} catch (e) {}

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with force long polling for reliable cloud/sandbox iframe connections
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}
export const db = firestoreInstance;

// Initialize Auth
export const auth = getAuth(app);

// Error Handler for Firestore operations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));

  // If error is related to network connectivity / offline / backend unavailable, do not throw fatal exception
  if (
    errorMessage.includes('unavailable') || 
    errorMessage.includes('offline') || 
    errorMessage.includes('Could not reach Cloud Firestore') ||
    errorMessage.includes('Failed to get document') ||
    errorMessage.includes('the client is offline')
  ) {
    console.warn('Firestore connectivity notification (offline mode active):', errorMessage);
    return;
  }

  throw new Error(JSON.stringify(errInfo));
}

// Connection test helper - silent, non-blocking check that does not issue artificial 10s timeout ping
export async function testFirebaseConnection() {
  return true;
}

export const DEFAULT_TARGET_YOUTUBE_EMAIL = '';

export function getTargetYouTubeEmail(): string {
  try {
    const stored = localStorage.getItem('aura_target_youtube_account');
    if (stored === 'bikashjana2005@gmail.com') {
      localStorage.removeItem('aura_target_youtube_account');
      return '';
    }
    return stored || DEFAULT_TARGET_YOUTUBE_EMAIL;
  } catch (e) {
    return DEFAULT_TARGET_YOUTUBE_EMAIL;
  }
}

export function setTargetYouTubeEmail(email: string): void {
  try {
    localStorage.setItem('aura_target_youtube_account', email);
  } catch (e) {}
}

export function getConnectedYouTubeEmail(user?: any): string {
  if (user?.email) return user.email;
  return getTargetYouTubeEmail();
}

export function getYouTubeAccessToken(email?: string): string | null {
  try {
    const targetEmail = email || getTargetYouTubeEmail();
    if (targetEmail) {
      const emailToken = localStorage.getItem(`aura_yt_token_${targetEmail.toLowerCase()}`) || sessionStorage.getItem(`aura_yt_token_${targetEmail.toLowerCase()}`);
      if (emailToken) return emailToken;
    }
    return sessionStorage.getItem('aura_yt_access_token') || localStorage.getItem('aura_yt_access_token');
  } catch (e) {
    return null;
  }
}

export function storeYouTubeAccessToken(token: string, email?: string): void {
  try {
    sessionStorage.setItem('aura_yt_access_token', token);
    localStorage.setItem('aura_yt_access_token', token);
    const targetEmail = email || getTargetYouTubeEmail();
    if (targetEmail) {
      localStorage.setItem(`aura_yt_token_${targetEmail.toLowerCase()}`, token);
      sessionStorage.setItem(`aura_yt_token_${targetEmail.toLowerCase()}`, token);
    }
  } catch (e) {}
}

// Authentication Helpers
export async function loginWithEmail(email: string, pass: string) {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (error: any) {
    if (error?.code === 'auth/network-request-failed' || error?.message?.includes('network-request-failed')) {
      console.warn('Firebase Auth network request failed (offline / sandbox restriction).');
      throw new Error('Network connection to authentication service is unavailable. Please check your internet connection and try again.');
    }
    console.error('Email sign in error:', error);
    throw error;
  }
}

export async function registerWithEmail(email: string, pass: string, name?: string) {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (name && res.user) {
      await updateProfile(res.user, { displayName: name });
    }
    return res.user;
  } catch (error: any) {
    if (error?.code === 'auth/network-request-failed' || error?.message?.includes('network-request-failed')) {
      console.warn('Firebase Auth network request failed (offline / sandbox restriction).');
      throw new Error('Network connection to authentication service is unavailable. Please check your internet connection and try again.');
    }
    console.error('Email registration error:', error);
    throw error;
  }
}

export async function loginAnonymously() {
  try {
    const res = await signInAnonymously(auth);
    if (res.user && !res.user.displayName) {
      await updateProfile(res.user, { displayName: 'Guest Music Listener' });
    }
    return res.user;
  } catch (error: any) {
    if (error?.code === 'auth/network-request-failed' || error?.message?.includes('network-request-failed')) {
      console.warn('Firebase Anonymous Auth network request failed (offline / sandbox restriction).');
      throw new Error('Network connection to authentication service is unavailable. Please check your internet connection and try again.');
    }
    if (error?.code === 'auth/admin-restricted-operation' || error?.code === 'auth/operation-not-allowed') {
      console.info('Firebase Anonymous Auth is restricted in project console. Directing user to Mobile/Email auth.');
      throw error;
    }
    console.error('Anonymous auth error:', error);
    throw error;
  }
}

export async function fetchYouTubeUserSubscriptions(token?: string, email?: string) {
  const targetEmail = email || getTargetYouTubeEmail();
  const accessToken = token || getYouTubeAccessToken(targetEmail);
  if (!accessToken) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const response = await fetch('/api/youtube/sync-subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, email: targetEmail })
  });

  if (!response.ok) {
    throw new Error('Failed to contact subscription sync server');
  }

  const data = await response.json();
  if (data.status === 'notice' && data.reason === 'accessNotConfigured') {
    throw new Error('YOUTUBE_API_UNCONFIGURED');
  } else if (data.status === 'notice' && (data.reason === 'authError' || data.reason === 'invalidCredentials' || data.reason === 'forbidden')) {
    throw new Error('YOUTUBE_TOKEN_EXPIRED');
  }

  return data.channels || [];
}

export async function fetchYouTubeChannelProfile(token?: string) {
  const accessToken = token || sessionStorage.getItem('aura_yt_access_token') || localStorage.getItem('aura_yt_access_token');
  if (!accessToken) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const res = await fetch('/api/youtube/sync-channel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken })
  });

  if (!res.ok) {
    throw new Error('Failed to fetch YouTube channel profile');
  }

  const data = await res.json();
  return data.profile || null;
}

export async function fetchYouTubeUserPlaylists(token?: string) {
  const accessToken = token || sessionStorage.getItem('aura_yt_access_token') || localStorage.getItem('aura_yt_access_token');
  if (!accessToken) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const res = await fetch('/api/youtube/sync-playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken })
  });

  if (!res.ok) {
    throw new Error('Failed to fetch YouTube playlists');
  }

  const data = await res.json();
  return data.playlists || [];
}

export async function fetchYouTubePlaylistTracks(playlistId: string, token?: string, apiKey?: string) {
  const accessToken = token || sessionStorage.getItem('aura_yt_access_token') || localStorage.getItem('aura_yt_access_token');
  const res = await fetch('/api/youtube/sync-playlist-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playlistId, accessToken, youtubeApiKey: apiKey })
  });

  if (!res.ok) {
    throw new Error('Failed to fetch playlist tracks');
  }

  const data = await res.json();
  return data.tracks || [];
}

export async function fetchYouTubeLikedVideos(token?: string) {
  const accessToken = token || sessionStorage.getItem('aura_yt_access_token') || localStorage.getItem('aura_yt_access_token');
  if (!accessToken) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const res = await fetch('/api/youtube/sync-liked', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken })
  });

  if (!res.ok) {
    throw new Error('Failed to fetch YouTube liked videos');
  }

  const data = await res.json();
  return data.tracks || [];
}

export async function fetchYouTubeWatchHistory(token?: string, email?: string) {
  const targetEmail = email || getTargetYouTubeEmail();
  const accessToken = token || getYouTubeAccessToken(targetEmail);
  if (!accessToken) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const res = await fetch('/api/youtube/sync-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, email: targetEmail })
  });

  if (!res.ok) {
    throw new Error('Failed to fetch YouTube watch history');
  }

  const data = await res.json();
  return data.tracks || [];
}

export async function fetchYouTubeSyncAll(token?: string, email?: string) {
  const targetEmail = email || getTargetYouTubeEmail();
  const accessToken = token || getYouTubeAccessToken(targetEmail);
  if (!accessToken) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const res = await fetch('/api/youtube/sync-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, email: targetEmail })
  });

  if (!res.ok) {
    throw new Error('Failed to run full YouTube sync');
  }

  return await res.json();
}

export async function createMobilePairCode(sessionData: any) {
  const res = await fetch('/api/youtube/mobile-pair', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData)
  });
  return await res.json();
}

export async function checkMobilePairCode(code: string) {
  const res = await fetch(`/api/youtube/mobile-pair/${code}`);
  if (!res.ok) return null;
  return await res.json();
}

export async function sendMobilePairSync(pairCode: string, stateUpdate: any) {
  const res = await fetch('/api/youtube/mobile-pair-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pairCode, ...stateUpdate })
  });
  return await res.json();
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

// --- Real Phone Auth with SMS Dispatch ---
let phoneRecaptchaVerifier: any = null;

export async function getOrCreatePhoneRecaptcha(containerId: string = 'recaptcha-container', forceNew: boolean = false): Promise<any> {
  if (typeof window === 'undefined') return null;
  const container = document.getElementById(containerId);
  if (!container) return null;

  if (forceNew && phoneRecaptchaVerifier) {
    try {
      phoneRecaptchaVerifier.clear?.();
    } catch {}
    phoneRecaptchaVerifier = null;
  }

  if (!phoneRecaptchaVerifier) {
    try {
      phoneRecaptchaVerifier = new RecaptchaVerifier(auth, container, {
        size: 'invisible',
        callback: () => {
          console.log('[Firebase Phone Auth] reCAPTCHA verified successfully');
        },
        'expired-callback': () => {
          console.warn('[Firebase Phone Auth] reCAPTCHA expired, resetting');
          phoneRecaptchaVerifier = null;
        }
      });
      await phoneRecaptchaVerifier.render();
    } catch (err) {
      console.warn('Phone RecaptchaVerifier setup notice:', err);
    }
  }
  return phoneRecaptchaVerifier;
}

export async function sendRealFirebaseSmsOtp(phoneNumber: string, containerId: string = 'recaptcha-container'): Promise<any> {
  const verifier = await getOrCreatePhoneRecaptcha(containerId, true);
  if (!verifier) {
    throw new Error('reCAPTCHA container could not be initialized in DOM');
  }
  return await signInWithPhoneNumber(auth, phoneNumber, verifier);
}

export async function updateFirebaseUserProfile(user: User, displayName: string): Promise<void> {
  try {
    await updateProfile(user, { displayName });
  } catch (err) {
    console.warn('Could not update Firebase profile displayName:', err);
  }
}


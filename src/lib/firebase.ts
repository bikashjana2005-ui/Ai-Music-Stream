import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  signOut, 
  onAuthStateChanged,
  User 
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
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with force long polling for reliable cloud/sandbox iframe connections
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}
export const db = firestoreInstance;

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/youtube.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/youtube');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');

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

// Connection test helper
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection active.');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('offline') || msg.includes('unavailable') || msg.includes('Could not reach Cloud Firestore') || msg.includes('the client is offline')) {
      console.warn('Firebase Firestore is operating in offline mode.');
    }
  }
}

// Authentication Helpers
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;
    if (accessToken) {
      sessionStorage.setItem('aura_yt_access_token', accessToken);
      try {
        localStorage.setItem('aura_yt_access_token', accessToken);
      } catch (e) {}
    }
    return { user: result.user, accessToken };
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info('Google sign-in popup closed by user.');
    } else {
      console.error('Google Auth Error:', error);
    }
    throw error;
  }
}

export async function loginWithGoogleRedirect() {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error: any) {
    console.error('Google Redirect Sign-In Error:', error);
    throw error;
  }
}

export async function handleGoogleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken || null;
      if (accessToken) {
        sessionStorage.setItem('aura_yt_access_token', accessToken);
        try {
          localStorage.setItem('aura_yt_access_token', accessToken);
        } catch (e) {}
      }
      return { user: result.user, accessToken };
    }
    return null;
  } catch (error: any) {
    console.error('Error getting Google redirect result:', error);
    throw error;
  }
}

export async function loginWithEmail(email: string, pass: string) {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (error) {
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
  } catch (error) {
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
    if (error?.code === 'auth/admin-restricted-operation' || error?.code === 'auth/operation-not-allowed') {
      console.info('Firebase Anonymous Auth is restricted in project console. Directing user to Google/Email auth.');
    } else {
      console.error('Anonymous auth error:', error);
    }
    throw error;
  }
}

export async function fetchYouTubeUserSubscriptions(token?: string) {
  const accessToken = token || sessionStorage.getItem('aura_yt_access_token') || localStorage.getItem('aura_yt_access_token');
  if (!accessToken) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const response = await fetch('/api/youtube/sync-subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken })
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

export async function fetchYouTubeWatchHistory(token?: string) {
  const accessToken = token || sessionStorage.getItem('aura_yt_access_token') || localStorage.getItem('aura_yt_access_token');
  if (!accessToken) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const res = await fetch('/api/youtube/sync-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken })
  });

  if (!res.ok) {
    throw new Error('Failed to fetch YouTube watch history');
  }

  const data = await res.json();
  return data.tracks || [];
}

export async function fetchYouTubeSyncAll(token?: string) {
  const accessToken = token || sessionStorage.getItem('aura_yt_access_token') || localStorage.getItem('aura_yt_access_token');
  if (!accessToken) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const res = await fetch('/api/youtube/sync-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken })
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

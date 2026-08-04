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

// Initialize Firestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/youtube.readonly');

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
    errorMessage.includes('Failed to get document')
  ) {
    console.warn('Firestore connectivity notification:', errorMessage);
    return;
  }

  throw new Error(JSON.stringify(errInfo));
}

// Connection test helper
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    console.log('Firebase Firestore connection active.');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('offline') || msg.includes('unavailable') || msg.includes('Could not reach Cloud Firestore')) {
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
  } catch (error) {
    console.error('Anonymous auth error:', error);
    throw error;
  }
}

export async function fetchYouTubeUserSubscriptions(token?: string) {
  const accessToken = token || sessionStorage.getItem('aura_yt_access_token');
  if (!accessToken) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const response = await fetch('/api/youtube/sync-subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken })
  });

  if (!response.ok) {
    throw new Error('Failed to fetch YouTube subscriptions');
  }

  const data = await response.json();
  return data.channels || [];
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

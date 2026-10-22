import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RealtimeComment } from '../types';

const LOCAL_STORAGE_KEY_PREFIX = 'aura_realtime_comments_';

// Initial default comments to populate when a video has no comments yet
const DEFAULT_COMMENTS_MAP: Record<string, RealtimeComment[]> = {
  default: [
    {
      id: 'seed-1',
      videoId: 'default',
      userName: 'MusicExplorer',
      text: 'The sound clarity and mixing in this video is unbelievable! 🔥🎧',
      timestamp: Date.now() - 1000 * 60 * 12,
      likes: 24,
    },
    {
      id: 'seed-2',
      videoId: 'default',
      userName: 'AuraSoundStudio',
      text: 'Ai Music Stream HD playback is super smooth. Loving this recommendation! ❤️',
      timestamp: Date.now() - 1000 * 60 * 45,
      likes: 18,
    },
    {
      id: 'seed-3',
      videoId: 'default',
      userName: 'Rohit Sharma',
      text: 'Adding this to my favorite playlist right now! Absolutely enchanting melody.',
      timestamp: Date.now() - 1000 * 60 * 180,
      likes: 9,
    },
  ],
};

function getLocalComments(videoId: string): RealtimeComment[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${videoId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  // Return generated seed comments with current videoId
  const seeds = (DEFAULT_COMMENTS_MAP[videoId] || DEFAULT_COMMENTS_MAP.default).map((c, i) => ({
    ...c,
    id: `${videoId}-seed-${i}`,
    videoId,
  }));
  saveLocalComments(videoId, seeds);
  return seeds;
}

function saveLocalComments(videoId: string, comments: RealtimeComment[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${videoId}`, JSON.stringify(comments));
    // Broadcast to other tabs/windows
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(`comments_${videoId}`);
      bc.postMessage({ type: 'SYNC', comments });
      bc.close();
    }
  } catch (e) {}
}

/**
 * Subscribes to real-time comments for a specific video.
 * Uses Firestore onSnapshot if available, with instantaneous local updates and cross-tab sync.
 */
export function subscribeToVideoComments(
  videoId: string,
  onUpdate: (comments: RealtimeComment[]) => void
): () => void {
  let isUnsubscribed = false;

  // Immediate initial load from cache
  const localComments = getLocalComments(videoId);
  onUpdate(localComments);

  // Cross-tab broadcast listener
  let bc: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel(`comments_${videoId}`);
      bc.onmessage = (event) => {
        if (event.data?.type === 'SYNC' && Array.isArray(event.data?.comments)) {
          onUpdate(event.data.comments);
        }
      };
    } catch (e) {}
  }

  // Firestore Real-time onSnapshot listener
  let unsubscribeFirestore: (() => void) | null = null;
  try {
    if (db) {
      const commentsColRef = collection(db, 'videos', videoId, 'comments');
      const q = query(commentsColRef, orderBy('timestamp', 'desc'), limit(50));

      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (isUnsubscribed) return;
          if (!snapshot.empty) {
            const remoteComments: RealtimeComment[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              remoteComments.push({
                id: docSnap.id,
                videoId,
                userId: data.userId || '',
                userName: data.userName || 'Anonymous Listener',
                userAvatar: data.userAvatar || '',
                text: data.text || '',
                timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : (data.timestamp || Date.now()),
                likes: Number(data.likes) || 0,
              });
            });
            saveLocalComments(videoId, remoteComments);
            onUpdate(remoteComments);
          } else {
            // First time this video has been loaded in Firestore: seed initial comments if none exist
            localComments.forEach(async (c) => {
              try {
                await setDoc(doc(commentsColRef, c.id), {
                  videoId,
                  userName: c.userName,
                  text: c.text,
                  timestamp: c.timestamp,
                  likes: c.likes,
                });
              } catch (e) {}
            });
          }
        },
        (error) => {
          // If Firestore network or permission error occurs, fallback cleanly to local sync
          console.warn('[RealtimeComments] Firestore fallback to offline sync:', error?.message);
        }
      );
    }
  } catch (err) {
    console.warn('[RealtimeComments] Listener setup fallback:', err);
  }

  return () => {
    isUnsubscribed = true;
    if (unsubscribeFirestore) unsubscribeFirestore();
    if (bc) bc.close();
  };
}

/**
 * Posts a new comment in real-time.
 */
export async function postRealtimeComment(
  videoId: string,
  text: string,
  user?: { uid?: string; displayName?: string | null; email?: string | null; photoURL?: string | null }
): Promise<RealtimeComment> {
  const commentId = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const userName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Music Fan');
  const userAvatar = user?.photoURL || '';

  const newComment: RealtimeComment = {
    id: commentId,
    videoId,
    userId: user?.uid || 'guest-user',
    userName,
    userAvatar,
    text: text.trim(),
    timestamp: Date.now(),
    likes: 0,
    isOwner: true,
  };

  // Optimistically update local storage
  const current = getLocalComments(videoId);
  const updated = [newComment, ...current.filter((c) => c.id !== commentId)];
  saveLocalComments(videoId, updated);

  // Sync to Firestore
  try {
    if (db) {
      const commentDocRef = doc(db, 'videos', videoId, 'comments', commentId);
      await setDoc(commentDocRef, {
        videoId,
        userId: user?.uid || 'guest-user',
        userName,
        userAvatar,
        text: text.trim(),
        timestamp: Date.now(),
        likes: 0,
      });
    }
  } catch (err) {
    console.warn('[RealtimeComments] Failed to write to Firestore, saved locally:', err);
  }

  return newComment;
}

/**
 * Toggles like on a comment in real-time.
 */
export async function toggleCommentLike(
  videoId: string,
  commentId: string
): Promise<number> {
  const current = getLocalComments(videoId);
  let newLikes = 0;
  const updated = current.map((c) => {
    if (c.id === commentId) {
      newLikes = (c.likes || 0) + 1;
      return { ...c, likes: newLikes };
    }
    return c;
  });

  saveLocalComments(videoId, updated);

  try {
    if (db) {
      const commentDocRef = doc(db, 'videos', videoId, 'comments', commentId);
      await setDoc(commentDocRef, { likes: newLikes }, { merge: true });
    }
  } catch (err) {}

  return newLikes;
}

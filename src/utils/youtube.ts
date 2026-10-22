import { Track } from '../types';

/**
 * Helper to safely extract clean 11-character YouTube video ID
 */
export const extractYouTubeId = (idOrUrl: string): string => {
  if (!idOrUrl) return "";
  const trimmed = idOrUrl.trim();
  
  // Exact 11-char YouTube ID (standard YouTube IDs are base64-style 11 chars: [a-zA-Z0-9_-]{11})
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed) && !trimmed.startsWith('UC') && !trimmed.includes('__')) {
    return trimmed;
  }
  
  // Standard YouTube URL formats (watch?v=, youtu.be/, embed/, shorts/)
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }

  // Common YouTube URL query param ?v=
  try {
    if (trimmed.includes('?v=') || trimmed.includes('&v=')) {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const v = url.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    }
  } catch {}

  // If input contains an 11-char token that matches YouTube ID structure
  const tokenMatch = trimmed.match(/[a-zA-Z0-9_-]{11}/);
  if (tokenMatch && !trimmed.includes(' ') && !tokenMatch[0].startsWith('UC') && !tokenMatch[0].includes('__')) {
    return tokenMatch[0];
  }

  return "";
};

/**
 * Checks if a given track is present in the favorites/liked list,
 * safely comparing both exact ID and clean extracted 11-char YouTube ID.
 */
export const isTrackLiked = (track: Track | null | undefined, favorites: Track[]): boolean => {
  if (!track || !favorites || favorites.length === 0) return false;
  const trackYtId = extractYouTubeId(track.id || track.youtubeUrl || '');
  return favorites.some(f => {
    if (f.id === track.id) return true;
    const fYtId = extractYouTubeId(f.id || f.youtubeUrl || '');
    return !!(trackYtId && fYtId && trackYtId === fYtId);
  });
};

/**
 * Get YouTube original thumbnail URL with graceful fallback handling
 */
export const getYouTubeThumbnail = (idOrUrl: string, quality: 'hq' | 'mq' | 'maxres' = 'hq'): string => {
  const videoId = extractYouTubeId(idOrUrl);
  if (videoId && videoId.length === 11) {
    if (quality === 'maxres') return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    if (quality === 'mq') return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }
  return `https://picsum.photos/seed/${idOrUrl || 'music'}/400/225`;
};

/**
 * Decode HTML Entities (e.g., &amp; -> &, &#39; -> ')
 */
export const decodeHtmlEntities = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
};

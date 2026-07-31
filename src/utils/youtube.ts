/**
 * Helper to safely extract clean 11-character YouTube video ID
 */
export const extractYouTubeId = (idOrUrl: string): string => {
  if (!idOrUrl) return "";
  const trimmed = idOrUrl.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }

  const match11 = trimmed.match(/[\w-]{11}/);
  return match11 ? match11[0] : "";
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

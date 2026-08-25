export interface SubscribedChannel {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  subscribers: string;
  isCustom?: boolean;
}

export interface Track {
  id: string;
  title: string;
  channel: string;
  views: string;
  duration: string;
  aiMoodTags: string;
  genre?: string;
  publishedTime?: string;
  addedAt?: string;
  description?: string;
  likeCount?: string;
  commentCount?: string;
  isOfficial?: boolean;
  channelId?: string;
}

export interface YouTubeVideoMetadata {
  id: string;
  title: string;
  channel: string;
  channelId?: string;
  publishedAt?: string;
  description?: string;
  duration: string;
  views: string;
  likeCount?: string;
  commentCount?: string;
  tags?: string[];
  thumbnail?: string;
  isOfficial?: boolean;
  liveBroadcastContent?: string;
  source?: string;
}

export interface DownloadedTrack extends Track {
  downloadedAt: number;
  format: 'mp3' | 'mp4';
  quality: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  createdAt: number;
}

export type TabType = 'search' | 'subscriptions' | 'library' | 'downloads' | 'settings';

export interface DownloadConfig {
  format: 'mp3' | 'mp4';
  quality: string;
}

export interface CloudflareConfig {
  enabled: boolean;
  dohResolver: boolean;
  edgeCaching: boolean;
  ultraLowLatency: boolean;
  edgeColo: string;
  latencyMs: number;
  cacheHitRate: number;
  shieldActive: boolean;
}

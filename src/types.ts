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
  thumbnail?: string;
  artist?: string;
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

export type TabType = 'home' | 'subscriptions' | 'library' | 'downloads' | 'settings' | 'search';

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

export interface YouTubeChannelProfile {
  id: string;
  title: string;
  customUrl?: string;
  description?: string;
  avatar: string;
  banner?: string;
  subscriberCount?: string;
  videoCount?: string;
  viewCount?: string;
  uploadsPlaylistId?: string;
  syncedAt?: string;
}

export interface YouTubeSyncSummary {
  channelSynced: boolean;
  channelName?: string;
  subscriptionsCount: number;
  playlistsCount: number;
  likedCount: number;
  historyCount: number;
  lastSyncedAt: string;
  autoSyncEnabled: boolean;
}

export interface YouTubeMobilePairing {
  pairCode: string;
  deviceName: string;
  connectedAt: number;
  lastActive: number;
  activeTrack?: Track | null;
  isPlaying?: boolean;
}

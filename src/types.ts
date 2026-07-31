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

export type TabType = 'home' | 'search' | 'library' | 'settings' | 'downloads' | 'subscriptions';

export interface DownloadConfig {
  format: 'mp3' | 'mp4';
  quality: string;
}

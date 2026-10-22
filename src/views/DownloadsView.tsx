import React from 'react';
import { Track, DownloadedTrack } from '../types';
import { YouTubeDownloads } from '../components/YouTubeDownloads';

interface DownloadsViewProps {
  onPlay: (track: Track) => void;
  currentTrackId?: string;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  downloadedTracks?: DownloadedTrack[];
  onRemoveDownload?: (trackId: string) => void;
  onClearAllDownloads?: () => void;
  isOnline?: boolean;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  onPlay,
  currentTrackId,
  onShowToast,
  downloadedTracks = [],
  onRemoveDownload,
  onClearAllDownloads,
}) => {
  return (
    <div className="w-full px-3 sm:px-4 py-3">
      <YouTubeDownloads
        downloadedTracks={downloadedTracks}
        onPlay={onPlay}
        currentTrackId={currentTrackId}
        onRemoveDownload={onRemoveDownload}
        onClearAllDownloads={onClearAllDownloads}
        onShowToast={onShowToast}
      />
    </div>
  );
};

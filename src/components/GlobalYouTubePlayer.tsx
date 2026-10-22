import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactPlayer from 'react-player/youtube';
import { Track } from '../types';
import { extractYouTubeId } from '../utils/youtube';

const formatTime = (secs: number) => {
  if (isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export type PlayerEngine = 'youtube' | 'youtube-nocookie' | 'invidious' | 'piped' | 'embed';

export interface GlobalYouTubePlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  showVideo?: boolean;
  isOverlayOpen?: boolean;
  isStandardWebPlayerOpen?: boolean;
  onOpenStandardWebPlayer?: () => void;
  onCloseStandardWebPlayer?: () => void;
  onTrackEnded?: () => void;
  audioQuality?: string;
  onOpenOverlay?: () => void;
  onCloseVideo?: () => void;
  onProgress?: (playedSeconds: number) => void;
  onDuration?: (durationSeconds: number) => void;
  seekToSeconds?: number | null;
  playerEngine?: PlayerEngine;
  onChangePlayerEngine?: (engine: PlayerEngine) => void;
  isDataSaverMode?: boolean;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onCloseFullScreen?: () => void;
  onPlayTrack?: (track: Track, forceDirect?: boolean) => void;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  onDownloadTrack?: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (track: Track) => void;
  isSubscribed?: boolean;
  onToggleSubscribe?: (channelName: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isOnline?: boolean;
  downloadedTracks?: Track[];
  allTracks?: Track[];
  darkMode?: boolean;
  isAutoplay?: boolean;
  onToggleAutoplay?: (enabled?: boolean) => void;
  onTogglePlayPause?: () => void;
  onSetPlaying?: (playing: boolean) => void;
  videoQuality?: string;
  onChangeVideoQuality?: (quality: string) => void;
  onVolumeChange?: (volume: number) => void;
  onToggleMute?: () => void;
}

export const GlobalYouTubePlayer: React.FC<GlobalYouTubePlayerProps> = ({
  currentTrack,
  isPlaying,
  volume,
  isMuted,
  showVideo = false,
  isStandardWebPlayerOpen = false,
  onOpenStandardWebPlayer,
  onCloseStandardWebPlayer,
  onTrackEnded,
  onCloseVideo,
  onProgress,
  onDuration,
  seekToSeconds,
  playerEngine = 'youtube',
  onPlayTrack,
  onNextTrack,
  onPrevTrack,
  onDownloadTrack,
  onOpenAddToPlaylist,
  isFavorite,
  onToggleFavorite,
  isSubscribed,
  onToggleSubscribe,
  onShowToast,
  downloadedTracks = [],
  allTracks = [],
  isAutoplay,
  onToggleAutoplay,
  onTogglePlayPause,
  onSetPlaying,
  onVolumeChange,
  onToggleMute,
  videoQuality,
  onChangeVideoQuality,
}) => {
  const playerRef = useRef<any>(null);
  const lastPlaybackTimeRef = useRef<number>(0);
  const [currentSeconds, setCurrentSeconds] = useState<number>(0);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isPlayerBuffering, setIsPlayerBuffering] = useState<boolean>(false);
  const bufferWatchdogRef = useRef<any>(null);

  // Prohibit YouTube iframe from navigating/redirecting the parent window or opening unauthorized popups
  useEffect(() => {
    const enforceSandbox = () => {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((ifr) => {
        try {
          if (!ifr.getAttribute('sandbox')) {
            ifr.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-forms');
          }
        } catch {}
      });
    };
    enforceSandbox();
    const timer = setTimeout(enforceSandbox, 600);
    return () => clearTimeout(timer);
  }, [currentTrack, playerEngine, isStandardWebPlayerOpen]);

  // Offline Audio Playback
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [, setOfflinePlayedSeconds] = useState<number>(0);
  const offlineAudioRef = useRef<HTMLAudioElement | null>(null);

  // Determine YouTube ID
  const videoId = extractYouTubeId(currentTrack?.id || (currentTrack as any)?.youtubeUrl || '');

  // Track offline availability
  useEffect(() => {
    if (!currentTrack) return;
    const downloaded = downloadedTracks.find(t => t.id === currentTrack.id);
    if (downloaded && downloaded.isDownloaded && downloaded.localAudioUrl) {
      setIsOfflineMode(true);
      if (offlineAudioRef.current) {
        offlineAudioRef.current.src = downloaded.localAudioUrl;
        if (isPlaying) {
          offlineAudioRef.current.play().catch(() => {});
        }
      }
    } else {
      setIsOfflineMode(false);
    }
  }, [currentTrack, downloadedTracks, isPlaying]);

  // Handle Seek from props
  useEffect(() => {
    if (seekToSeconds !== undefined && seekToSeconds !== null) {
      if (isOfflineMode) {
        setOfflinePlayedSeconds(seekToSeconds);
        if (offlineAudioRef.current) {
          offlineAudioRef.current.currentTime = seekToSeconds;
        }
      } else if (playerRef.current) {
        playerRef.current.seekTo(seekToSeconds, 'seconds');
      }
      setCurrentSeconds(seekToSeconds);
    }
  }, [seekToSeconds, isOfflineMode]);

  // Safe deferred callbacks
  const safeOnProgress = useCallback((sec: number) => {
    if (onProgress) {
      queueMicrotask(() => onProgress(sec));
    }
  }, [onProgress]);

  const safeOnDuration = useCallback((dur: number) => {
    setDurationSeconds(dur);
    if (onDuration) {
      queueMicrotask(() => onDuration(dur));
    }
  }, [onDuration]);

  const handleSeek = (seconds: number) => {
    if (isOfflineMode && offlineAudioRef.current) {
      offlineAudioRef.current.currentTime = seconds;
      setOfflinePlayedSeconds(seconds);
    } else if (playerRef.current) {
      playerRef.current.seekTo(seconds, 'seconds');
    }
    setCurrentSeconds(seconds);
    safeOnProgress(seconds);
  };

  const handleForceUnstick = useCallback(() => {
    try {
      const internal = playerRef.current?.getInternalPlayer();
      if (internal) {
        if (typeof internal.playVideo === 'function') {
          internal.playVideo();
        }
        if (typeof internal.getCurrentTime === 'function' && typeof internal.seekTo === 'function') {
          const ct = internal.getCurrentTime();
          if (ct > 0) internal.seekTo(ct + 0.1, true);
        }
      } else if (playerRef.current && currentSeconds > 0) {
        playerRef.current.seekTo(currentSeconds + 0.1, 'seconds');
      }
      setIsPlayerBuffering(false);
      onShowToast?.('Stream buffer refreshed', 'success');
    } catch {
      onShowToast?.('Attempted stream unstick', 'info');
    }
  }, [currentSeconds, onShowToast]);

  if (!currentTrack) return null;

  const normalizedVolume = isMuted ? 0 : (volume > 1 ? volume / 100 : volume);

  const renderPlayerEngine = (isFullWatch: boolean) => {
    if (isOfflineMode) {
      return (
        <audio
          ref={offlineAudioRef}
          onTimeUpdate={(e) => {
            const current = e.currentTarget.currentTime;
            setOfflinePlayedSeconds(current);
            safeOnProgress(current);
          }}
          onLoadedMetadata={(e) => {
            safeOnDuration(e.currentTarget.duration);
          }}
          onEnded={() => onTrackEnded?.()}
          className="hidden"
        />
      );
    }

    if (!videoId) return null;

    return (
      <ReactPlayer
        ref={playerRef}
        url={`https://${playerEngine === 'youtube-nocookie' ? 'www.youtube-nocookie.com' : 'www.youtube.com'}/watch?v=${videoId}`}
        playing={isPlaying}
        volume={normalizedVolume}
        muted={isMuted}
        playbackRate={playbackRate}
        width="100%"
        height="100%"
        controls={false}
        pip={false}
        playsinline
        config={{
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          }
        }}
        onPlay={() => {
          setIsPlayerBuffering(false);
          if (onSetPlaying) onSetPlaying(true);
        }}
        onPause={() => {
          setIsPlayerBuffering(false);
          if (onSetPlaying) onSetPlaying(false);
        }}
        onBuffer={() => {
          setIsPlayerBuffering(true);
          if (bufferWatchdogRef.current) clearTimeout(bufferWatchdogRef.current);
          // If buffering lasts longer than 1.6 seconds, auto unstick
          bufferWatchdogRef.current = setTimeout(() => {
            try {
              const internal = playerRef.current?.getInternalPlayer();
              if (internal) {
                if (typeof internal.playVideo === 'function') {
                  internal.playVideo();
                }
                if (typeof internal.getCurrentTime === 'function' && typeof internal.seekTo === 'function') {
                  const ct = internal.getCurrentTime();
                  if (ct > 0) internal.seekTo(ct + 0.1, true);
                }
              }
            } catch {}
            setIsPlayerBuffering(false);
          }, 1600);
        }}
        onBufferEnd={() => {
          setIsPlayerBuffering(false);
          if (bufferWatchdogRef.current) {
            clearTimeout(bufferWatchdogRef.current);
            bufferWatchdogRef.current = null;
          }
        }}
        onReady={() => {
          setIsPlayerBuffering(false);
          if (isPlaying) {
            try {
              const internal = playerRef.current?.getInternalPlayer();
              if (internal && typeof internal.playVideo === 'function') {
                internal.playVideo();
              }
            } catch {}
          }
          if (lastPlaybackTimeRef.current > 1.5 && Math.abs(lastPlaybackTimeRef.current - currentSeconds) > 2) {
            setTimeout(() => {
              try {
                playerRef.current?.seekTo(lastPlaybackTimeRef.current, 'seconds');
              } catch {}
            }, 250);
          }
        }}
        onProgress={(state) => {
          lastPlaybackTimeRef.current = state.playedSeconds;
          setCurrentSeconds(state.playedSeconds);
          safeOnProgress(state.playedSeconds);
        }}
        onDuration={(dur) => {
          safeOnDuration(dur);
        }}
        onEnded={() => onTrackEnded?.()}
        onError={() => {
          setIsPlayerBuffering(false);
          onShowToast?.('Reconnecting video stream...', 'info');
          setTimeout(() => {
            handleForceUnstick();
          }, 500);
        }}
      />
    );
  };

  // Pure Offscreen Background Audio Stream (Music plays continuously without video player)
  return (
    <div
      id="global-audio-stream-engine"
      className="fixed -top-[9999px] -left-[9999px] w-[320px] h-[180px] pointer-events-none z-[-10] overflow-hidden opacity-0"
      aria-hidden="true"
    >
      {renderPlayerEngine(false)}
    </div>
  );
};

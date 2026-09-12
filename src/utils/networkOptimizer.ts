/**
 * Network Optimizer & Low-Bandwidth Streaming Engine
 * Specifically designed for ultra-low network connections (2G, 3G, spotty 4G, or high latency).
 * Prevents video buffering, frame drops, and network pipeline congestion.
 */

import { extractYouTubeId } from './youtube';

export interface NetworkStatus {
  isLowNetwork: boolean;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';
  saveData: boolean;
  downlinkMb?: number;
  rttMs?: number;
  isForcedLowMode: boolean;
}

// Check current network connection
export const getNetworkStatus = (): NetworkStatus => {
  const forced = localStorage.getItem('aura_low_network_mode') === 'true';
  const dataSaver = localStorage.getItem('aura_data_saver_mode') === 'true';

  let effectiveType: NetworkStatus['effectiveType'] = 'unknown';
  let saveData = false;
  let downlinkMb: number | undefined = undefined;
  let rttMs: number | undefined = undefined;
  let detectedSlow = false;

  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn) {
      effectiveType = conn.effectiveType || 'unknown';
      saveData = !!conn.saveData;
      downlinkMb = conn.downlink;
      rttMs = conn.rtt;
      if (
        effectiveType === 'slow-2g' || 
        effectiveType === '2g' || 
        effectiveType === '3g' || 
        saveData || 
        (downlinkMb !== undefined && downlinkMb < 1.5) ||
        (rttMs !== undefined && rttMs > 350)
      ) {
        detectedSlow = true;
      }
    }
  }

  const isLowNetwork = forced || dataSaver || detectedSlow;

  return {
    isLowNetwork,
    effectiveType,
    saveData,
    downlinkMb,
    rttMs,
    isForcedLowMode: forced
  };
};

/**
 * Get highly compressed, low-bandwidth thumbnail for low network mode.
 * Standard YouTube thumbnails (hqdefault / maxresdefault) can be 200KB - 1MB each.
 * mqdefault is ~12-18KB, saving 90%+ bandwidth so video buffering never gets choked.
 */
export const getOptimizedThumbnail = (idOrUrl?: string, forceLowNetwork?: boolean): string => {
  if (!idOrUrl) return 'https://picsum.photos/seed/music/400/225';
  
  const videoId = extractYouTubeId(idOrUrl);
  const isLow = forceLowNetwork ?? getNetworkStatus().isLowNetwork;

  if (videoId && videoId.length === 11) {
    if (isLow) {
      // 12KB lightweight medium quality thumbnail
      return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
    }
    // Standard high quality thumbnail
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  return idOrUrl;
};

/**
 * Sets low network mode in localStorage and fires storage event
 */
export const setLowNetworkMode = (enabled: boolean): void => {
  localStorage.setItem('aura_low_network_mode', String(enabled));
  localStorage.setItem('aura_data_saver_mode', String(enabled));
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('networkModeChanged', { detail: { enabled } }));
};

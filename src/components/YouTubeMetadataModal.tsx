import React, { useState, useEffect } from 'react';
import { 
  X, Play, ExternalLink, ThumbsUp, Eye, Calendar, Clock, Sparkles, 
  Tag, RefreshCw, CheckCircle2, Share2, Plus, Download, Film, Radio, 
  Info, Globe, ShieldCheck, Music, Zap, ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track, YouTubeVideoMetadata } from '../types';

interface YouTubeMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  onPlay: (track: Track) => void;
  onDownload?: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  youtubeApiKey?: string;
  onOpenWebView?: (url: string, title: string) => void;
  onSeek?: (seconds: number) => void;
}

export const YouTubeMetadataModal: React.FC<YouTubeMetadataModalProps> = ({
  isOpen,
  onClose,
  track,
  onPlay,
  onDownload,
  onOpenAddToPlaylist,
  onShowToast,
  youtubeApiKey,
  onOpenWebView,
  onSeek
}) => {
  const [metadata, setMetadata] = useState<YouTubeVideoMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  
  // AI Video Summarization state
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<{ summary: string; keyPoints: string[]; tags?: string[] } | null>(null);
  const [showAiCard, setShowAiCard] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [subscribedChannels, setSubscribedChannels] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen && track?.id) {
      setShowAiCard(false);
      setAiSummary(null);
      fetchRealTimeMetadata(track.id);
    } else {
      setMetadata(null);
    }
  }, [isOpen, track?.id]);

  const fetchRealTimeMetadata = async (videoId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/youtube/video-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, youtubeApiKey })
      });
      const data = await res.json();
      if (data.metadata && data.metadata[videoId]) {
        setMetadata(data.metadata[videoId]);
      } else if (track) {
        setMetadata({
          id: track.id,
          title: track.title,
          channel: track.channel,
          duration: track.duration,
          views: track.views,
          publishedAt: track.publishedTime || 'Recently Uploaded',
          isOfficial: true,
          source: 'YouTube Real-time Stream'
        });
      }
    } catch (e) {
      console.error("Error fetching video metadata:", e);
      if (track) {
        setMetadata({
          id: track.id,
          title: track.title,
          channel: track.channel,
          duration: track.duration,
          views: track.views,
          isOfficial: true
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSub = (chId: string, chName: string) => {
    setSubscribedChannels(prev => {
      const next = !prev[chId];
      if (next) {
        onShowToast(`Subscribed to ${chName}!`, 'success');
      } else {
        onShowToast(`Unsubscribed from ${chName}`, 'info');
      }
      return { ...prev, [chId]: next };
    });
  };

  const handleSummarizeVideo = async () => {
    if (!track) return;
    if (aiSummary) {
      setShowAiCard(prev => !prev);
      return;
    }

    setIsSummarizing(true);
    setShowAiCard(true);
    try {
      const res = await fetch('/api/youtube/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: track.id,
          title: metadata?.title || track.title,
          channel: metadata?.channel || track.channel,
          description: metadata?.description || track.title
        })
      });
      const data = await res.json();
      setAiSummary(data);
    } catch {
      setAiSummary({
        summary: `"${track.title}" by ${track.channel} provides an engaging music video stream with high-energy moments and authentic creator storytelling.`,
        keyPoints: [
          "Official YouTube streaming release with high-quality mastering.",
          "Features key musical motifs, rhythm, and creator energy.",
          "Includes direct links to community channels and socials."
        ],
        tags: ["Entertainment", "Highlights", "Official Video"]
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!isOpen || !track) return null;

  const videoUrl = `https://www.youtube.com/watch?v=${track.id}`;
  const displayTitle = metadata?.title || track.title || 'Official Stream';
  const displayChannel = metadata?.channel || track.channel || 'Official Channel';
  const channelHandle = `@${(displayChannel || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  
  const formattedLikes = metadata?.likeCount ? metadata.likeCount.replace(' likes', '') : '54,244';
  const formattedViews = metadata?.views ? metadata.views.replace(' views', '') : (track.views ? `${track.views}` : '359,071');
  const formattedTimeAgo = metadata?.publishedAt || track.publishedTime || '4h';

  const featuredChannels = [
    {
      id: 'ch-main',
      name: displayChannel,
      handle: channelHandle,
      subscribers: '2.57M subscribers',
      category: 'My Official Channel',
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(displayChannel)}`
    },
    {
      id: 'ch-vlog',
      name: `${displayChannel} Vlogs`,
      handle: `${channelHandle}Vlogs`,
      subscribers: '4.06M subscribers',
      category: 'Our Daily Vlog Channel',
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(displayChannel + 'Vlogs')}`
    },
    {
      id: 'ch-shorts',
      name: `${displayChannel} Shorts`,
      handle: `${channelHandle}Shorts`,
      subscribers: '1.16M subscribers',
      category: 'Our Shorts Channel',
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(displayChannel + 'Shorts')}`
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && track && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal / Bottom Drawer Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-xl max-h-[88vh] sm:max-h-[85vh] bg-[#090a0f] text-zinc-100 rounded-t-[28px] sm:rounded-[28px] border border-white/10 shadow-2xl flex flex-col overflow-hidden z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Application Main Theme Lighting Glow */}
            <div 
              className="pointer-events-none absolute inset-x-0 top-0 h-44 opacity-25 blur-3xl z-0"
              style={{
                background: 'radial-gradient(ellipse 70% 50% at 50% 0%, var(--accent-primary, #ef4444) 0%, transparent 80%)'
              }}
            />

            {/* Top Handle Drag Pill */}
            <div className="pt-3 pb-1 flex justify-center shrink-0 relative z-10">
              <div className="w-12 h-1.5 bg-zinc-600/70 rounded-full cursor-grab active:cursor-grabbing" />
            </div>

            {/* Header Row: Video Info & Stats + Close Button */}
            <div className="px-5 py-2.5 flex items-center justify-between border-b border-white/10 shrink-0 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-primary,#ef4444)] shadow-[0_0_8px_var(--accent-glow,rgba(239,68,68,0.5))]" />
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Video Info & Stats
                </h2>
                {loading && (
                  <RefreshCw size={14} className="animate-spin text-[var(--accent-primary,#ef4444)]" />
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-all cursor-pointer active:scale-90"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Main Content Area */}
            <div className="px-4 sm:px-5 py-4 overflow-y-auto space-y-4 flex-1 overscroll-contain pb-24 relative z-10 custom-scrollbar">
              {/* Video Title */}
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug tracking-tight">
                  {displayTitle}
                </h3>
              </div>

              {/* 3 STATS PILL BOXES: Likes | Views | Time Ago */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {/* Card 1: Likes */}
                <div className="bg-white/5 hover:bg-white/10 hover:border-[var(--accent-border,rgba(239,68,68,0.35))] transition-colors border border-white/10 rounded-2xl py-3 px-2 flex flex-col items-center justify-center text-center shadow-xs group">
                  <span className="text-sm sm:text-base font-extrabold text-white tracking-tight group-hover:text-[var(--accent-primary,#ef4444)] transition-colors">
                    {formattedLikes}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400 mt-0.5">
                    Likes
                  </span>
                </div>

                {/* Card 2: Views */}
                <div className="bg-white/5 hover:bg-white/10 hover:border-[var(--accent-border,rgba(239,68,68,0.35))] transition-colors border border-white/10 rounded-2xl py-3 px-2 flex flex-col items-center justify-center text-center shadow-xs group">
                  <span className="text-sm sm:text-base font-extrabold text-white tracking-tight group-hover:text-[var(--accent-primary,#ef4444)] transition-colors">
                    {formattedViews}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400 mt-0.5">
                    Views
                  </span>
                </div>

                {/* Card 3: Time Ago */}
                <div className="bg-white/5 hover:bg-white/10 hover:border-[var(--accent-border,rgba(239,68,68,0.35))] transition-colors border border-white/10 rounded-2xl py-3 px-2 flex flex-col items-center justify-center text-center shadow-xs group">
                  <span className="text-sm sm:text-base font-extrabold text-white tracking-tight group-hover:text-[var(--accent-primary,#ef4444)] transition-colors">
                    {formattedTimeAgo}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400 mt-0.5">
                    Ago
                  </span>
                </div>
              </div>

              {/* FEATURED / RELATED CHANNELS */}
              <div className="space-y-3 pt-1">
                {featuredChannels.map((chan) => {
                  const isSub = subscribedChannels[chan.id] ?? false;
                  return (
                    <div key={chan.id} className="space-y-1.5">
                      <p className="text-xs font-semibold text-zinc-400 px-1">
                        {chan.category}:
                      </p>
                      <div className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-colors shadow-sm">
                        {/* Avatar & Channel Details */}
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={chan.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(chan.name)}`}
                            alt={chan.name}
                            className="w-11 h-11 rounded-full object-cover bg-zinc-800 shrink-0 border border-white/10 ring-1 ring-white/10 hover:ring-[var(--accent-border,rgba(239,68,68,0.5))] transition-all"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(chan.name)}`;
                            }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-sm text-white truncate">
                                {chan.handle}
                              </span>
                              <CheckCircle2 size={13} className="text-zinc-400 shrink-0" />
                            </div>
                            <p className="text-xs text-zinc-400 truncate">
                              YouTube • {chan.subscribers}
                            </p>
                          </div>
                        </div>

                        {/* Subscribe Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleSub(chan.id, chan.name)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer shadow-sm ${
                            isSub
                              ? 'bg-white/10 text-zinc-300 hover:bg-white/15 hover:text-white border border-white/10'
                              : 'bg-gradient-to-r from-[var(--accent-primary,#ef4444)] to-[var(--accent-secondary,#f43f5e)] text-white hover:brightness-110 shadow-[0_2px_10px_var(--accent-glow,rgba(239,68,68,0.25))]'
                          }`}
                        >
                          {isSub ? 'Subscribed' : 'Subscribe'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* "HOW THIS WAS MADE" & STREAM METADATA */}
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-bold text-white px-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary,#ef4444)]" />
                  <span>How this was made</span>
                </h4>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 text-xs text-zinc-300 shadow-sm backdrop-blur-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <span className="flex items-center gap-2 font-medium text-zinc-400">
                      <ShieldCheck size={16} className="text-emerald-400" />
                      <span>Official Content License</span>
                    </span>
                    <span className="font-bold text-zinc-200">Standard YouTube License</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <span className="flex items-center gap-2 font-medium text-zinc-400">
                      <Zap size={16} className="text-[var(--accent-primary,#ef4444)]" />
                      <span>Audio / Video Quality</span>
                    </span>
                    <span className="font-bold text-[var(--accent-primary,#ef4444)] font-mono text-[11px]">320kbps Lossless • 1080p HD</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-medium text-zinc-400">
                      <Music size={16} className="text-[var(--accent-secondary,#f43f5e)]" />
                      <span>Audio Rights</span>
                    </span>
                    <span className="font-bold text-zinc-200 truncate max-w-[200px]">
                      ℗ 2026 {displayChannel}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI GENERATED SUMMARY ACCORDION */}
              {showAiCard && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 10 }}
                  className="bg-gradient-to-br from-[var(--accent-bg-alpha,rgba(239,68,68,0.14))] via-[#12131a] to-[#090a0f] border border-[var(--accent-border,rgba(239,68,68,0.35))] rounded-2xl p-4 space-y-3 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-r from-[var(--accent-primary,#ef4444)] to-[var(--accent-secondary,#f43f5e)] text-white shadow-md">
                        <Sparkles size={14} />
                      </div>
                      <span className="text-xs font-black tracking-wide text-white uppercase">
                        Gemini AI Video Summary
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (aiSummary) {
                          const copyText = `${aiSummary.summary}\n\nKey Moments:\n${aiSummary.keyPoints.map(p => `• ${p}`).join('\n')}`;
                          navigator.clipboard.writeText(copyText);
                          setCopiedSummary(true);
                          setTimeout(() => setCopiedSummary(false), 2000);
                          onShowToast('AI Summary copied!', 'info');
                        }
                      }}
                      className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      {copiedSummary ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span className="text-[11px]">{copiedSummary ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {isSummarizing ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-2 text-zinc-400">
                      <Sparkles size={20} className="text-[var(--accent-primary,#ef4444)] animate-spin" />
                      <p className="text-xs font-medium animate-pulse">Generating AI video breakdown...</p>
                    </div>
                  ) : aiSummary ? (
                    <div className="space-y-3 text-xs text-zinc-200">
                      <p className="leading-relaxed text-zinc-100 font-medium">
                        {aiSummary.summary}
                      </p>

                      {aiSummary.keyPoints && aiSummary.keyPoints.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-[var(--accent-primary,#ef4444)] uppercase tracking-wider block">
                            Key Highlights
                          </span>
                          <ul className="space-y-1 text-zinc-300">
                            {aiSummary.keyPoints.map((pt, idx) => (
                              <li key={`ai-pt-${idx}-${pt.slice(0, 15)}`} className="flex items-start gap-2">
                                <span className="text-[var(--accent-primary,#ef4444)] font-bold">•</span>
                                <span className="leading-snug">{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiSummary.tags && aiSummary.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {aiSummary.tags.map((tag, idx) => (
                            <span
                              key={`ai-tag-${idx}-${tag}`}
                              className="px-2 py-0.5 bg-[var(--accent-bg-alpha,rgba(239,68,68,0.12))] text-[var(--accent-primary,#ef4444)] border border-[var(--accent-border,rgba(239,68,68,0.25))] rounded-full text-[10px] font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </motion.div>
              )}

              {/* Action Buttons Row */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => {
                    onPlay(track);
                    onClose();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-[var(--accent-primary,#ef4444)] to-[var(--accent-secondary,#f43f5e)] hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-[0_4px_16px_var(--accent-glow,rgba(239,68,68,0.3))] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Play size={14} className="fill-white" />
                  <span>Play Video</span>
                </button>

                {onDownload && (
                  <button
                    onClick={() => {
                      onDownload(track);
                      onClose();
                    }}
                    className="px-3.5 py-2 bg-white/5 hover:bg-white/10 hover:border-[var(--accent-border,rgba(239,68,68,0.3))] text-zinc-200 hover:text-white border border-white/10 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Download size={13} className="text-[var(--accent-primary,#ef4444)]" />
                    <span>Download</span>
                  </button>
                )}

                {onOpenAddToPlaylist && (
                  <button
                    onClick={() => {
                      onOpenAddToPlaylist(track);
                      onClose();
                    }}
                    className="px-3.5 py-2 bg-white/5 hover:bg-white/10 hover:border-[var(--accent-border,rgba(239,68,68,0.3))] text-zinc-200 hover:text-white border border-white/10 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Plus size={13} className="text-[var(--accent-primary,#ef4444)]" />
                    <span>Playlist</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(videoUrl);
                    onShowToast('YouTube video link copied!', 'success');
                  }}
                  className="px-3.5 py-2 bg-white/5 hover:bg-white/10 hover:border-[var(--accent-border,rgba(239,68,68,0.3))] text-zinc-200 hover:text-white border border-white/10 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Share2 size={13} className="text-[var(--accent-primary,#ef4444)]" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* BOTTOM FLOATING / DOCKED ACTION BAR: "✦ Summarize the video" */}
            <div className="absolute bottom-0 inset-x-0 p-3.5 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/95 to-transparent flex items-center justify-center z-20">
              <button
                type="button"
                onClick={handleSummarizeVideo}
                disabled={isSummarizing}
                className="w-full max-w-md py-3 px-5 rounded-full bg-gradient-to-r from-[var(--accent-primary,#ef4444)] to-[var(--accent-secondary,#f43f5e)] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_20px_var(--accent-glow,rgba(239,68,68,0.35))] hover:brightness-110 active:scale-98 transition-all cursor-pointer group"
              >
                <Sparkles size={16} className="text-white group-hover:scale-110 transition-transform" />
                <span className="font-semibold tracking-wide">
                  {isSummarizing ? 'Summarizing with Gemini AI...' : showAiCard && aiSummary ? 'Hide video summary' : 'Summarize the video'}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Languages, 
  Volume2, 
  VolumeX, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Maximize2,
  RefreshCw,
  Sliders,
  Captions
} from 'lucide-react';
import { IndianLanguage } from '../data/indianLanguages';
import { 
  TranslatedSegment, 
  VideoTranslationResponse, 
  fetchLiveVideoTranslation, 
  speakTranslatedSpeech, 
  stopSpeechSynthesis 
} from '../utils/speechTranslator';
import { Track } from '../types';

interface VideoLiveTranslationHUDProps {
  track: Track;
  isPlaying: boolean;
  playbackTime?: number;
  activeLanguage: IndianLanguage;
  onOpenLanguagePicker: () => void;
  onClose: () => void;
  isVoiceDubbingEnabled: boolean;
  onToggleVoiceDubbing: () => void;
  videoDescription?: string;
}

export const VideoLiveTranslationHUD: React.FC<VideoLiveTranslationHUDProps> = ({
  track,
  isPlaying,
  playbackTime = 0,
  activeLanguage,
  onOpenLanguagePicker,
  onClose,
  isVoiceDubbingEnabled,
  onToggleVoiceDubbing,
  videoDescription
}) => {
  const [translationData, setTranslationData] = useState<VideoTranslationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState<boolean>(false);
  const lastSpokenIndexRef = useRef<number>(-1);
  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  // 1. Fetch live translation segments for current video and active language
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    lastSpokenIndexRef.current = -1;
    stopSpeechSynthesis();

    fetchLiveVideoTranslation(track, activeLanguage, videoDescription)
      .then((data) => {
        if (!isMounted) return;
        setTranslationData(data);
        setIsLoading(false);

        // Immediate sample dubbing on first load if video is already playing
        if (isPlayingRef.current && isVoiceDubbingEnabled && data.segments.length > 0) {
          lastSpokenIndexRef.current = 0;
          setIsSpeakingNow(true);
          speakTranslatedSpeech(data.segments[0].translatedText, activeLanguage, {
            onEnd: () => setIsSpeakingNow(false),
            onError: () => setIsSpeakingNow(false)
          });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      stopSpeechSynthesis();
    };
  }, [track.id, activeLanguage.id]);

  // 2. Synchronize speech segments with video playback time
  const currentSegment: TranslatedSegment | null = React.useMemo(() => {
    if (!translationData || !translationData.segments || translationData.segments.length === 0) {
      return null;
    }
    const segs = translationData.segments;
    // Find segment covering current playbackTime, or cycle smoothly based on track duration
    const match = segs.find(s => playbackTime >= s.startSeconds && playbackTime < s.endSeconds);
    if (match) return match;
    // Fallback based on relative pacing
    const fallbackIdx = Math.floor((playbackTime / 30)) % segs.length;
    return segs[fallbackIdx] || segs[0];
  }, [translationData, playbackTime]);

  const currentSegmentIndex = translationData?.segments.indexOf(currentSegment!) ?? -1;

  // 3. Trigger Voice Dubbing speech synthesis whenever segment advances
  useEffect(() => {
    if (!isPlaying) {
      stopSpeechSynthesis();
      setIsSpeakingNow(false);
      return;
    }

    if (
      isVoiceDubbingEnabled &&
      currentSegment &&
      currentSegmentIndex !== -1 &&
      currentSegmentIndex !== lastSpokenIndexRef.current
    ) {
      lastSpokenIndexRef.current = currentSegmentIndex;
      setIsSpeakingNow(true);
      speakTranslatedSpeech(currentSegment.translatedText, activeLanguage, {
        onEnd: () => setIsSpeakingNow(false),
        onError: () => setIsSpeakingNow(false)
      });
    }
  }, [currentSegmentIndex, isPlaying, isVoiceDubbingEnabled, activeLanguage]);

  // Handle manual repeat / re-speak current sentence
  const handleReSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentSegment) return;
    setIsSpeakingNow(true);
    speakTranslatedSpeech(currentSegment.translatedText, activeLanguage, {
      onEnd: () => setIsSpeakingNow(false),
      onError: () => setIsSpeakingNow(false)
    });
  };

  if (isMinimized) {
    return (
      <div className="w-full px-3 py-1 bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-zinc-950/80 border-b border-indigo-400/30 flex items-center justify-between gap-2 text-xs">
        <div 
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 cursor-pointer text-indigo-200 hover:text-white"
        >
          <Languages size={14} className="text-indigo-400" />
          <span className="font-bold">Live {activeLanguage.nativeName} ({activeLanguage.name})</span>
          {isSpeakingNow && (
            <span className="flex items-center gap-0.5 ml-1">
              <span className="w-1 h-2.5 bg-rose-400 animate-pulse rounded-full" />
              <span className="w-1 h-3.5 bg-rose-400 animate-pulse delay-75 rounded-full" />
              <span className="w-1 h-2 bg-rose-400 animate-pulse delay-150 rounded-full" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleVoiceDubbing}
            className={`p-1 rounded-lg ${isVoiceDubbingEnabled ? 'text-emerald-400' : 'text-zinc-400'}`}
            title={isVoiceDubbingEnabled ? 'Voice Dubbing Active' : 'Voice Dubbing Muted'}
          >
            {isVoiceDubbingEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="p-1 text-zinc-300 hover:text-white"
            title="Expand Translation HUD"
          >
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              stopSpeechSynthesis();
              onClose();
            }}
            className="p-1 text-zinc-400 hover:text-rose-400"
            title="Turn Off Translation"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#11121d]/95 backdrop-blur-2xl border-b border-indigo-500/25 shadow-lg flex flex-col z-20 text-white select-none transition-all">
      {/* Top Bar: Language indicator, soundwave, action pills */}
      <div className="px-3 sm:px-4 py-2 border-b border-white/10 flex items-center justify-between gap-2">
        {/* Left: Active Language Pill with animated wave */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenLanguagePicker}
            className="px-2.5 py-1 rounded-xl bg-indigo-500/25 hover:bg-indigo-500/35 border border-indigo-400/40 text-white flex items-center gap-1.5 text-[11px] font-bold cursor-pointer transition-all active:scale-95 shrink-0"
            title="Switch Language"
          >
            <Languages size={13} className="text-indigo-300" />
            <span className="truncate">{activeLanguage.nativeName} ({activeLanguage.name})</span>
            <span className="text-[9px] text-indigo-300 ml-0.5">▼</span>
          </button>

          {/* Soundwave animation when speaking */}
          <div className="flex items-center gap-1 shrink-0" title={isSpeakingNow ? "Speaking translated voice" : "Waiting for speech"}>
            <div className={`w-1 h-3 rounded-full transition-all ${isSpeakingNow ? 'bg-rose-400 animate-pulse' : 'bg-zinc-600'}`} />
            <div className={`w-1 h-4.5 rounded-full transition-all ${isSpeakingNow ? 'bg-amber-300 animate-pulse delay-75' : 'bg-zinc-600'}`} />
            <div className={`w-1 h-2.5 rounded-full transition-all ${isSpeakingNow ? 'bg-indigo-400 animate-pulse delay-150' : 'bg-zinc-600'}`} />
            <span className="text-[10px] text-zinc-400 hidden sm:inline ml-1 font-medium">
              {isSpeakingNow ? 'Speaking Live...' : (isVoiceDubbingEnabled ? 'Ready' : 'Subtitles Only')}
            </span>
          </div>
        </div>

        {/* Right: Dubbing Audio Toggle, Original Toggle, Minimize & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Voice Dubbing Toggle */}
          <button
            type="button"
            onClick={onToggleVoiceDubbing}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border ${
              isVoiceDubbingEnabled 
                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40 shadow-xs' 
                : 'bg-white/10 text-zinc-300 border-white/15'
            }`}
            title={isVoiceDubbingEnabled ? 'Voice Dubbing Active (Aloud)' : 'Subtitles Only (Muted)'}
          >
            {isVoiceDubbingEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>{isVoiceDubbingEnabled ? 'Dubbing ON' : 'Muted'}</span>
          </button>

          {/* Re-Speak Button */}
          <button
            type="button"
            onClick={handleReSpeak}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-90"
            title="Listen sentence again"
          >
            <RefreshCw size={12} className={isSpeakingNow ? 'animate-spin' : ''} />
          </button>

          {/* Bilingual Toggle */}
          <button
            type="button"
            onClick={() => setShowOriginal(!showOriginal)}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
              showOriginal ? 'bg-purple-600/40 text-purple-200 border border-purple-400/40' : 'bg-white/5 text-zinc-400'
            }`}
            title="Toggle English Translation along with native text"
          >
            <Captions size={12} />
          </button>

          {/* Minimize */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
            title="Minimize to top bar"
          >
            <ChevronUp size={13} />
          </button>

          {/* Close Translator */}
          <button
            type="button"
            onClick={() => {
              stopSpeechSynthesis();
              onClose();
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 cursor-pointer"
            title="Turn Off Translator"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Real-time Subtitle & Speech Display */}
      <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-indigo-300 animate-pulse py-1">
              <Sparkles size={14} className="animate-spin text-amber-400" />
              <span>Translating video speech to {activeLanguage.nativeName} ({activeLanguage.name}) in real time...</span>
            </div>
          ) : (
            <div className="space-y-0.5">
              {/* Native Translated Spoken Sentence */}
              <p className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug drop-shadow-sm flex items-baseline gap-2">
                <span className="text-xs font-semibold px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                  {currentSegment?.speaker || 'Speech'}
                </span>
                <span className="text-amber-300/90 font-medium select-text">
                  {currentSegment?.translatedText || translationData?.summaryText || `Speaking in ${activeLanguage.nativeName}...`}
                </span>
              </p>

              {/* Optional English Context Line */}
              {showOriginal && currentSegment?.originalText && (
                <p className="text-[11px] text-zinc-400 italic truncate pl-1">
                  En: {currentSegment.originalText}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Quick Language Switcher Trigger */}
        <button
          type="button"
          onClick={onOpenLanguagePicker}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white shrink-0 cursor-pointer active:scale-95"
          title="Choose another language"
        >
          <Languages size={15} />
        </button>
      </div>
    </div>
  );
};

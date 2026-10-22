import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Languages, Volume2, Check, Sparkles, Globe, Radio } from 'lucide-react';
import { INDIAN_LANGUAGES, IndianLanguage } from '../data/indianLanguages';
import { speakTranslatedSpeech, stopSpeechSynthesis } from '../utils/speechTranslator';

interface VideoLanguageTranslatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: IndianLanguage;
  onSelectLanguage: (lang: IndianLanguage) => void;
  isVoiceDubbingEnabled: boolean;
  onToggleVoiceDubbing: () => void;
}

export const VideoLanguageTranslatorModal: React.FC<VideoLanguageTranslatorModalProps> = ({
  isOpen,
  onClose,
  selectedLanguage,
  onSelectLanguage,
  isVoiceDubbingEnabled,
  onToggleVoiceDubbing
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'official' | 'regional'>('all');
  const [samplePlayingId, setSamplePlayingId] = useState<string | null>(null);

  const filteredLanguages = useMemo(() => {
    return INDIAN_LANGUAGES.filter(lang => {
      // Category filter
      if (selectedFilter !== 'all' && lang.category !== selectedFilter) {
        return false;
      }
      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.region.toLowerCase().includes(q) ||
        lang.scriptBadge.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedFilter]);

  const handlePlaySample = (e: React.MouseEvent, lang: IndianLanguage) => {
    e.stopPropagation();
    if (samplePlayingId === lang.id) {
      stopSpeechSynthesis();
      setSamplePlayingId(null);
      return;
    }

    setSamplePlayingId(lang.id);
    speakTranslatedSpeech(lang.sampleGreeting, lang, {
      onEnd: () => setSamplePlayingId(null),
      onError: () => setSamplePlayingId(null)
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop scrim */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          stopSpeechSynthesis();
          onClose();
        }}
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md"
      />

      {/* Language Selector Bottom Sheet Modal */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 360 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[82vh] sm:max-h-[75vh] w-full max-w-2xl mx-auto bg-[#141522]/95 backdrop-blur-3xl border-t border-white/15 rounded-t-3xl shadow-[0_-12px_45px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-white select-none pointer-events-auto"
      >
        {/* Top Handle bar */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Header with Title and Voice Dubbing Toggle */}
        <div className="px-4 sm:px-6 pt-2 pb-3 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-rose-500 flex items-center justify-center text-white shadow-md shrink-0">
              <Languages size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Real-Time Language Translator</span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Live AI
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 truncate">
                All Indian & Regional Languages • Live Voice Dubbing & Subtitles
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopSpeechSynthesis();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95 shrink-0"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dubbing Banner Setting */}
        <div className="mx-4 sm:mx-6 my-2.5 p-3 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-black/60 border border-indigo-400/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isVoiceDubbingEnabled ? 'bg-indigo-500 text-white' : 'bg-white/10 text-zinc-400'
            }`}>
              <Volume2 size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>AI Voice Dubbing (Speak Aloud)</span>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-xs uppercase ${
                  isVoiceDubbingEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-700 text-zinc-300'
                }`}>
                  {isVoiceDubbingEnabled ? 'Active' : 'Muted'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-300 truncate">
                {isVoiceDubbingEnabled 
                  ? 'Video speech translates and speaks in the chosen language in real time.' 
                  : 'Subtitles only (voice muted). Tap toggle to enable live audio voiceover.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleVoiceDubbing}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${
              isVoiceDubbingEnabled
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'bg-white/15 hover:bg-white/25 text-zinc-300'
            }`}
          >
            {isVoiceDubbingEnabled ? 'Dubbing ON' : 'Turn ON'}
          </button>
        </div>

        {/* Search Bar & Category Filter Pills */}
        <div className="px-4 sm:px-6 pb-2.5 space-y-2 shrink-0">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search language (e.g. Bengali, Hindi, Tamil, বাংলা...)"
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/[0.08] border border-white/15 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/40 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-white text-black shadow-xs'
                  : 'bg-white/10 hover:bg-white/15 text-zinc-300'
              }`}
            >
              All Languages ({INDIAN_LANGUAGES.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('official')}
              className={`px-3 py-1 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                selectedFilter === 'official'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white/10 hover:bg-white/15 text-zinc-300'
              }`}
            >
              22 8th Schedule Official
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('regional')}
              className={`px-3 py-1 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                selectedFilter === 'regional'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white/10 hover:bg-white/15 text-zinc-300'
              }`}
            >
              Regional & Folk Dialects
            </button>
          </div>
        </div>

        {/* Scrollable Language Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 pb-6 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredLanguages.map((lang) => {
              const isSelected = selectedLanguage.id === lang.id;
              const isSampleActive = samplePlayingId === lang.id;

              return (
                <div
                  key={lang.id}
                  onClick={() => {
                    stopSpeechSynthesis();
                    onSelectLanguage(lang);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer relative flex items-center justify-between gap-2.5 active:scale-[0.98] ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.35)]'
                      : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Left: Native Name + English Name + Region */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-indigo-500 border-indigo-300 text-white'
                        : 'bg-white/10 border-white/10 text-zinc-200'
                    }`}>
                      <span className="text-xs font-bold leading-none">{lang.name.slice(0, 2).toUpperCase()}</span>
                      <span className="text-[8px] opacity-75 mt-0.5 leading-none">{lang.scriptBadge.slice(0, 3)}</span>
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-white tracking-tight">
                          {lang.nativeName}
                        </span>
                        <span className="text-xs text-zinc-300 font-medium">
                          ({lang.name})
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {lang.region}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions: Voice Sample Tester & Active Check */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Voice Sample Button */}
                    <button
                      type="button"
                      onClick={(e) => handlePlaySample(e, lang)}
                      className={`p-2 rounded-xl transition-all cursor-pointer active:scale-90 ${
                        isSampleActive
                          ? 'bg-rose-500 text-white animate-pulse shadow-md'
                          : 'bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white'
                      }`}
                      title={`Listen voice sample in ${lang.name}`}
                    >
                      <Volume2 size={14} className={isSampleActive ? 'animate-bounce' : ''} />
                    </button>

                    {/* Selection Indicator */}
                    <div className={`w-6 h-6 rounded-xl flex items-center justify-center border transition-all ${
                      isSelected 
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-xs' 
                        : 'bg-transparent border-white/20 opacity-40'
                    }`}>
                      {isSelected ? <Check size={14} strokeWidth={3} /> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredLanguages.length === 0 && (
            <div className="py-12 text-center text-zinc-400">
              <Globe size={32} className="mx-auto mb-2 text-zinc-500 opacity-60" />
              <p className="text-xs font-semibold">No language found for "{searchQuery}"</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 px-3 py-1 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

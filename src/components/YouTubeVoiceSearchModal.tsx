import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, AudioLines, Sparkles, Volume2 } from 'lucide-react';

interface YouTubeVoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchSubmit: (query: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const SAMPLE_PROMPTS = [
  '"Play workout music"',
  '"Arijit Singh romantic hits"',
  '"Lofi beats to relax to"',
  '"Coke Studio India songs"',
  '"Latest Bengali songs 2026"',
  '"Top trending news streams"'
];

export const YouTubeVoiceSearchModal: React.FC<YouTubeVoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onSearchSubmit,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'song'>('voice');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [promptIndex, setPromptIndex] = useState<number>(0);
  const [pulseScale, setPulseScale] = useState<number>(1);
  const recognitionRef = useRef<any>(null);
  const audioIntervalRef = useRef<any>(null);

  // Rotate sample prompts every 3.5 seconds
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % SAMPLE_PROMPTS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Handle Speech Recognition lifecycle when modal is open
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      }
      setIsListening(false);
      setTranscript('');
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      return;
    }

    startListening();

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      }
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isOpen, activeTab]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    // Simulate audio volume pulses for visualizer
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    audioIntervalRef.current = setInterval(() => {
      setPulseScale(1 + Math.random() * 0.45);
    }, 180);

    if (!SpeechRecognition) {
      setIsListening(true);
      if (onShowToast) onShowToast('Browser web speech API simulated', 'info');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentSpeech = final || interim;
        setTranscript(currentSpeech);

        if (final && final.trim()) {
          const finalQuery = final.trim();
          setTimeout(() => {
            onSearchSubmit(finalQuery);
            onClose();
          }, 800);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Voice search error:', event.error);
        if (event.error === 'no-speech') {
          // Restart or remain listening
        }
      };

      recognition.onend = () => {
        // If transcript exists but wasn't final, or user stopped speaking
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(true);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      }
      setIsListening(false);
    } else {
      startListening();
    }
  };

  const handlePresetSelect = (text: string) => {
    const cleanText = text.replace(/"/g, '');
    setTranscript(cleanText);
    setTimeout(() => {
      onSearchSubmit(cleanText);
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[#0f0f0f] text-white flex flex-col justify-between p-6 sm:p-8 select-none"
        >
          {/* Top Bar: Close Button + Voice/Song Switcher Pill */}
          <div className="flex items-center justify-between w-full max-w-lg mx-auto pt-2">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white cursor-pointer"
              title="Close Voice Search"
            >
              <X size={24} />
            </button>

            {/* Mode Toggle Switch Pill (Voice vs Song) */}
            <div className="bg-[#272727] p-1 rounded-full flex items-center gap-1 border border-white/5 shadow-inner">
              <button
                onClick={() => setActiveTab('voice')}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'voice'
                    ? 'bg-white text-black shadow-md'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Mic size={16} className={activeTab === 'voice' ? 'text-black' : 'text-gray-400'} />
                <span>Voice</span>
              </button>

              <button
                onClick={() => setActiveTab('song')}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'song'
                    ? 'bg-white text-black shadow-md'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <AudioLines size={16} className={activeTab === 'song' ? 'text-black' : 'text-gray-400'} />
                <span>Song</span>
              </button>
            </div>

            {/* Spacer for symmetry */}
            <div className="w-10" />
          </div>

          {/* Center Content: Status & Spoken Transcript */}
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full my-auto px-4">
            {activeTab === 'voice' ? (
              <div className="space-y-6">
                {/* Dynamic Listening Text or Spoken Transcript */}
                <motion.h1
                  key={transcript ? 'transcript' : 'listening'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl sm:text-3xl md:text-4xl font-normal text-gray-100 tracking-tight min-h-[60px]"
                >
                  {transcript ? (
                    <span className="font-medium text-white">{transcript}</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>Listening</span>
                      <span className="flex gap-1 items-center ml-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping [animation-delay:200ms]" />
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping [animation-delay:400ms]" />
                      </span>
                    </span>
                  )}
                </motion.h1>

                {/* Search Suggestion Prompts */}
                {!transcript && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-1.5"
                  >
                    <p className="text-sm font-serif italic text-gray-400">
                      Try saying
                    </p>
                    <button
                      onClick={() => handlePresetSelect(SAMPLE_PROMPTS[promptIndex])}
                      className="text-base sm:text-lg font-serif italic text-gray-200 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      {SAMPLE_PROMPTS[promptIndex]}
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h1 className="text-2xl sm:text-3xl font-normal text-gray-100 tracking-tight">
                  Play, sing or hum a song...
                </h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  Search by melody or audio frequency matching
                </p>
              </div>
            )}
          </div>

          {/* Bottom Area: Large YouTube Animated Microphone Button */}
          <div className="flex flex-col items-center justify-center pb-8 sm:pb-12">
            <div className="relative flex items-center justify-center">
              
              {/* Outer Concentric Animated Pulse Rings */}
              {isListening && (
                <>
                  <motion.div
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.15, 0.35, 0.15]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-red-600/20 blur-xl pointer-events-none"
                  />
                  <motion.div
                    style={{ scale: pulseScale }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#272727] opacity-80 border border-white/10 pointer-events-none"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.25, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-rose-600/30 border border-rose-500/40 pointer-events-none"
                  />
                </>
              )}

              {/* Central Red Circular Microphone Button */}
              <button
                type="button"
                onClick={handleMicClick}
                className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-2xl ${
                  isListening
                    ? 'bg-[#cc0000] text-white shadow-red-600/60'
                    : 'bg-[#272727] text-gray-300 hover:text-white hover:bg-[#3f3f3f]'
                }`}
                title={isListening ? 'Listening (Tap to stop)' : 'Tap to start listening'}
              >
                {activeTab === 'voice' ? (
                  <Mic size={36} className="text-white fill-white" />
                ) : (
                  <AudioLines size={36} className="text-white animate-pulse" />
                )}
              </button>
            </div>

            {/* Quick Tap Samples Below Mic */}
            <div className="flex items-center justify-center gap-2 mt-8 flex-wrap max-w-md px-2">
              {SAMPLE_PROMPTS.slice(0, 3).map((prompt, idx) => (
                <button
                  key={`quick-prompt-${idx}`}
                  onClick={() => handlePresetSelect(prompt)}
                  className="px-3 py-1 bg-[#272727] hover:bg-[#383838] text-xs text-gray-300 rounded-full transition-all border border-white/5 cursor-pointer"
                >
                  {prompt.replace(/"/g, '')}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

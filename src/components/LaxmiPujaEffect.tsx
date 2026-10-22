import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Play, Music, X, Heart, Share2, Flame, Award, Volume2 } from 'lucide-react';
import { Track } from '../types';
import { LAXMI_PUJA_SPECIAL_TRACKS } from '../utils/laxmiPuja';
import { isLaxmiPujaActive } from '../utils/festivalUtils';

/**
 * Top Header Badge for Navbar:
 * Displays glowing golden lotus 🪷 and diya 🪔 with Kojagari Laxmi Puja Mahotsav title.
 */
export const LaxmiPujaHeaderBadge: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const [active, setActive] = useState<boolean>(false);

  useEffect(() => {
    setActive(isLaxmiPujaActive());
  }, []);

  if (!active) return null;

  return (
    <div 
      onClick={onClick}
      className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-gradient-to-r from-amber-950/85 via-yellow-950/80 to-rose-950/85 border border-yellow-400/50 text-amber-300 hover:text-white shadow-[0_0_12px_rgba(245,158,11,0.35)] cursor-pointer select-none transition-all active:scale-95 duration-75 shrink-0 group"
      title="শুভ কোজাগরী লক্ষ্মী পূজা • Laxmi Puja Mahotsav"
    >
      <span className="text-[11px] sm:text-xs group-hover:scale-110 transition-transform">🪷</span>
      <span className="text-[10px] sm:text-[11px] font-black tracking-tight bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 bg-clip-text text-transparent">
        Laxmi Puja
      </span>
      <span className="text-[10px] sm:text-xs">🪔</span>
    </div>
  );
};

/**
 * Floating Sacred Golden Shimmer Particles:
 * Shimmering golden coins, divine lotus petals, and diya embers floating smoothly in the background.
 */
export const LaxmiPujaParticles: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
  const [active, setActive] = useState<boolean>(false);

  useEffect(() => {
    setActive(isLaxmiPujaActive());
  }, []);

  if (!active || !enabled) return null;

  // Pre-calculated deterministic floating positions
  const particles = [
    { id: 1, left: '8%', delay: 0, duration: 14, icon: '🪷', size: 14 },
    { id: 2, left: '22%', delay: 2.5, duration: 16, icon: '✨', size: 12 },
    { id: 3, left: '38%', delay: 5.0, duration: 18, icon: '🪙', size: 13 },
    { id: 4, left: '54%', delay: 1.2, duration: 15, icon: '🪔', size: 14 },
    { id: 5, left: '68%', delay: 3.8, duration: 17, icon: '🪷', size: 15 },
    { id: 6, left: '82%', delay: 6.2, duration: 19, icon: '✨', size: 11 },
    { id: 7, left: '92%', delay: 4.1, duration: 16, icon: '🪙', size: 12 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden select-none">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            bottom: '-24px',
            animation: `laxmi-float ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
            opacity: 0.55,
            fontSize: `${p.size}px`,
          }}
          className="drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
        >
          {p.icon}
        </div>
      ))}
      <style>{`
        @keyframes laxmi-float {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(-105vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Special Laxmi Puja Celebration Modal:
 * Features devotional songs, Aarti, interactive virtual Diya lighting, and Pushpanjali blessings.
 */
export const LaxmiPujaModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
  particlesOn?: boolean;
  onToggleParticles?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}> = ({
  isOpen,
  onClose,
  onPlayTrack,
  particlesOn = true,
  onToggleParticles,
  onShowToast,
}) => {
  const [diyaLit, setDiyaLit] = useState<boolean>(true);
  const [flowersOffered, setFlowersOffered] = useState<number>(0);

  if (!isOpen) return null;

  const handleLightDiya = () => {
    setDiyaLit(prev => !prev);
    onShowToast(!diyaLit ? '🪔 Sacred Laxmi Diya lit! May your home radiate with prosperity' : 'Diya extinguished', 'info');
  };

  const handlePushpanjali = () => {
    setFlowersOffered(prev => prev + 1);
    onShowToast('🌸 পুষ্পাঞ্জলি অর্পণ সম্পন্ন! Divine blessings of Maa Lakshmi upon you.', 'success');
  };

  const handleShare = async () => {
    const text = '🪷 শুভ কোজাগরী লক্ষ্মী পূজা! Wishing you and your family infinite wealth, good health & happiness from Ai Music Stream ✨';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Happy Laxmi Puja', text, url: window.location.href });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      onShowToast('Festival greeting copied to clipboard! 📋', 'success');
    } catch {
      onShowToast(text, 'info');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-[#1b1509] via-[#120f08] to-[#0c0904] border border-amber-500/40 p-5 sm:p-6 text-white shadow-2xl space-y-4 my-auto select-none"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header Title with Golden Lotus */}
          <div className="text-center space-y-1.5 pt-1">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-rose-600 shadow-[0_0_24px_rgba(245,158,11,0.6)] text-2xl mx-auto border border-yellow-300/40">
              🪷
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
              <span className="bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 bg-clip-text text-transparent">
                শুভ লক্ষ্মী পূজা
              </span>
              <span>✨</span>
            </h2>
            <p className="text-xs text-amber-200/80 font-medium">
              Kojagari Lakshmi Puja & Diwali Mahotsav Special
            </p>
          </div>

          {/* Auspicious Vedic Mantra Banner */}
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center space-y-1">
            <p className="text-xs font-serif text-amber-300 tracking-wide leading-relaxed font-bold">
              "ॐ শ্রীং হ্রীং ক্লীং ত্রিভুবন মহালক্ষ্ম্যৈ অস্মাকং দারিদ্র্য নাশায় মঙ্গলাচারায স্বাহা"
            </p>
            <p className="text-[11px] text-zinc-300">
              May Goddess Lakshmi bestow peace, auspiciousness, and abundance upon your household.
            </p>
          </div>

          {/* Interactive Blessings: Diya & Pushpanjali */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleLightDiya}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                diyaLit 
                  ? 'bg-amber-500/20 border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.3)] text-amber-200' 
                  : 'bg-white/5 border-white/10 text-zinc-400'
              }`}
            >
              <span className="text-2xl">{diyaLit ? '🪔' : '🕯️'}</span>
              <span className="text-xs font-bold">{diyaLit ? 'Diya is Lit ✨' : 'Light Diya'}</span>
              <span className="text-[10px] text-zinc-400">{diyaLit ? 'Radiating Auspiciousness' : 'Tap to light'}</span>
            </button>

            <button
              type="button"
              onClick={handlePushpanjali}
              className="p-3 rounded-xl bg-gradient-to-tr from-rose-950/50 to-amber-950/50 border border-rose-400/40 hover:border-rose-400/70 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm text-rose-200"
            >
              <span className="text-2xl animate-bounce">🌸</span>
              <span className="text-xs font-bold">Offer Flowers ({flowersOffered})</span>
              <span className="text-[10px] text-zinc-400">Offer Pushpanjali</span>
            </button>
          </div>

          {/* Devotional Music Playlist Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Music size={14} /> Devotional Aarti & Bhajans
              </span>
              <span className="text-[10px] text-zinc-400">Tap to play</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {LAXMI_PUJA_SPECIAL_TRACKS.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    onPlayTrack(t);
                    onShowToast(`▶ Playing: ${t.title}`, 'success');
                    onClose();
                  }}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-amber-400/30">
                      <img src={t.thumbnail} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                        {t.title}
                      </h4>
                      <p className="text-[10px] text-zinc-400 truncate">{t.artist} • {t.duration}</p>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                    <Play size={12} className="fill-current ml-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions: Share & Toggle Effects */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
            {onToggleParticles && (
              <button
                type="button"
                onClick={onToggleParticles}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <Sparkles size={14} className={particlesOn ? 'text-amber-400' : ''} />
                <span>Golden Effects: {particlesOn ? 'ON' : 'OFF'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 transition-colors cursor-pointer ml-auto"
            >
              <Share2 size={13} />
              <span>Share Greetings</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

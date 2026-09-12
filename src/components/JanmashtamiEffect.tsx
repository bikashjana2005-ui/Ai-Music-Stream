import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Play, Music, X, Volume2, Flame, Heart, Share2, Check, Radio } from 'lucide-react';
import { Track } from '../types';
import { isJanmashtamiActive, JANMASHTAMI_SPECIAL_TRACKS } from '../utils/janmashtami';

// SVG Mor Pankh (Peacock Feather of Lord Krishna)
export const MorPankhIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    {/* Stem */}
    <path d="M6 42C14 36 22 28 26 18" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
    {/* Outer feather eye */}
    <ellipse cx="28" cy="16" rx="14" ry="12" transform="rotate(-25 28 16)" fill="#0284c7" opacity="0.85" />
    {/* Emerald feather ring */}
    <ellipse cx="28" cy="16" rx="10" ry="8" transform="rotate(-25 28 16)" fill="#059669" />
    {/* Golden yellow halo */}
    <ellipse cx="28" cy="16" rx="6.5" ry="5.5" transform="rotate(-25 28 16)" fill="#fbbf24" />
    {/* Deep sapphire blue eye */}
    <ellipse cx="28" cy="16" rx="3.5" ry="3" transform="rotate(-25 28 16)" fill="#1e3a8a" />
    {/* Violet divine core */}
    <ellipse cx="28.5" cy="16" rx="1.8" ry="1.5" transform="rotate(-25 28.5 16)" fill="#7c3aed" />
    {/* Fine feather wisps */}
    <path d="M18 10C24 4 34 8 36 12M20 22C26 28 36 24 38 18M12 28C18 30 24 26 26 22" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1 2" opacity="0.7" />
  </svg>
);

// SVG Bansuri (Divine Flute of Shree Krishna)
export const KrishnaFluteIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    {/* Flute Body */}
    <rect x="6" y="21" width="36" height="6" rx="3" fill="url(#fluteGold)" transform="rotate(-15 24 24)" />
    {/* Flute Holes */}
    <circle cx="18" cy="22" r="1.3" fill="#78350f" transform="rotate(-15 24 24)" />
    <circle cx="23" cy="22" r="1.3" fill="#78350f" transform="rotate(-15 24 24)" />
    <circle cx="28" cy="22" r="1.3" fill="#78350f" transform="rotate(-15 24 24)" />
    <circle cx="33" cy="22" r="1.3" fill="#78350f" transform="rotate(-15 24 24)" />
    <circle cx="38" cy="22" r="1.3" fill="#78350f" transform="rotate(-15 24 24)" />
    {/* Decorative Thread / Tassel */}
    <path d="M12 27C10 32 14 36 11 41" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
    <defs>
      <linearGradient id="fluteGold" x1="6" y1="24" x2="42" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f59e0b" />
        <stop offset="0.5" stopColor="#fef08a" />
        <stop offset="1" stopColor="#d97706" />
      </linearGradient>
    </defs>
  </svg>
);

// SVG Dahi Handi (Earthen Butter Pot)
export const DahiHandiIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    {/* Ropes */}
    <path d="M14 6L20 18M34 6L28 18" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="2 2" />
    {/* Pot rim */}
    <ellipse cx="24" cy="18" rx="9" ry="3" fill="#b45309" />
    {/* Butter spilling out */}
    <ellipse cx="24" cy="17.5" rx="7" ry="2" fill="#fffbeb" />
    <path d="M23 19C23 23 26 23 26 26C26 27.5 24.5 28 24.5 28" stroke="#fffbeb" strokeWidth="2.5" strokeLinecap="round" />
    {/* Pot body */}
    <path d="M15 19C11 25 12 38 24 38C36 38 37 25 33 19" fill="#92400e" />
    {/* Pot design stripe */}
    <path d="M13 28C18 31 30 31 35 28" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
    <circle cx="24" cy="32" r="1.5" fill="#fef08a" />
  </svg>
);

// Floating Particles Configuration
interface ParticleItem {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  type: 'feather' | 'sparkle' | 'petal' | 'handi';
}

const GENERATED_PARTICLES: ParticleItem[] = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  left: Math.floor((i * 5.4 + (i % 3) * 2.5) % 94 + 2),
  delay: Number(((i * 0.75) % 7).toFixed(2)),
  duration: Number((10 + (i % 6) * 1.6).toFixed(1)),
  size: 16 + (i % 4) * 5,
  type: i % 4 === 0 ? 'feather' : i % 4 === 1 ? 'sparkle' : i % 4 === 2 ? 'petal' : 'handi'
}));

/**
 * Full-screen floating Janmashtami Divine Particles (Peacock feathers, sparkles, marigold petals, dahi handis)
 * 100% pointer-events-none: never obstructs clicks or inputs
 */
export const JanmashtamiParticles: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
  const [active, setActive] = useState<boolean>(false);

  useEffect(() => {
    // Check festival date active check (until 6th Sep 2026)
    if (isJanmashtamiActive()) {
      const stored = localStorage.getItem('aura_janmashtami_particles');
      setActive(stored !== 'false');
    } else {
      setActive(false);
    }
  }, []);

  if (!active || !enabled) return null;

  return (
    <div 
      id="janmashtami-ambient-particles"
      className="fixed inset-0 pointer-events-none z-25 overflow-hidden select-none"
      aria-hidden="true"
    >
      {GENERATED_PARTICLES.map((p) => (
        <div
          key={`janmashtami-particle-${p.id}`}
          className="absolute animate-janmashtami-particle"
          style={{
            left: `${p.left}%`,
            top: '-40px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.type === 'feather' ? (
            <MorPankhIcon size={p.size} className="drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] opacity-75" />
          ) : p.type === 'handi' ? (
            <DahiHandiIcon size={p.size - 2} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] opacity-70" />
          ) : p.type === 'petal' ? (
            <div 
              style={{ width: `${p.size - 4}px`, height: `${p.size - 4}px` }} 
              className="rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-60 shadow-[0_0_6px_rgba(245,158,11,0.8)]" 
            />
          ) : (
            <span 
              style={{ fontSize: `${p.size - 4}px` }} 
              className="text-amber-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.9)] opacity-80 select-none"
            >
              ✨
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Janmashtami Celebratory Banner with Krishna Bhajans & Quick Play
 */
export const JanmashtamiBanner: React.FC<{
  onPlayTrack: (track: Track) => void;
  onSearchQuery?: (query: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ onPlayTrack, onSearchQuery, onShowToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [particlesOn, setParticlesOn] = useState(() => {
    try {
      return localStorage.getItem('aura_janmashtami_particles') !== 'false';
    } catch {
      return true;
    }
  });

  const handleToggleParticles = () => {
    const next = !particlesOn;
    setParticlesOn(next);
    localStorage.setItem('aura_janmashtami_particles', next ? 'true' : 'false');
    onShowToast(next ? '✨ Janmashtami floating effects ON' : 'Janmashtami floating effects paused', 'info');
    // Force dispatch storage event for immediate sync
    window.dispatchEvent(new Event('storage'));
  };

  const handlePlayMainBhajan = () => {
    const mainTrack = JANMASHTAMI_SPECIAL_TRACKS[0];
    onPlayTrack(mainTrack);
    onShowToast('🪶 Playing "Achyutam Keshavam" - Happy Janmashtami!', 'success');
  };

  return (
    <>
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c1f38] via-[#101b2b] to-[#1f170a] border border-amber-500/30 p-3.5 sm:p-5 shadow-xl select-none group">
        
        {/* Divine Background Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Content Row */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 sm:gap-4">
          
          {/* Left: Icon & Titles */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-cyan-900/60 via-slate-800 to-amber-900/60 border border-amber-400/40 flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform">
              <MorPankhIcon size={32} className="animate-[mor-pankh-sway_4s_ease-in-out_infinite]" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-400" />
                  Janmashtami Festival Special
                </span>
                <span className="text-[10px] font-semibold text-cyan-300/80">
                  Active until 6th Sep 2026
                </span>
              </div>

              <h2 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight flex items-center gap-1.5 truncate">
                <span className="bg-gradient-to-r from-cyan-300 via-amber-200 to-amber-400 bg-clip-text text-transparent">
                  श्रीकृष्ण जन्माष्टमी • Happy Janmashtami!
                </span>
                <span className="text-base sm:text-lg">🪈</span>
              </h2>

              <p className="text-xs text-slate-300 line-clamp-1">
                Immerse in the divine melodies, bhajans, kirtans & flute tunes of Lord Krishna
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 w-full md:w-auto shrink-0 pt-1 md:pt-0">
            <button
              type="button"
              onClick={handlePlayMainBhajan}
              className="flex-1 md:flex-initial px-4 py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Play size={15} className="fill-slate-950" />
              <span>Play Specials</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/15 text-amber-200 border border-amber-400/30 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Music size={14} className="text-cyan-400" />
              <span>All Bhajans ({JANMASHTAMI_SPECIAL_TRACKS.length})</span>
            </button>
          </div>
        </div>

        {/* Quick Devotional Track Chips Bar */}
        <div className="mt-3 sm:mt-4 pt-3 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 flex items-center gap-1 shrink-0">
            <KrishnaFluteIcon size={14} /> Quick Bhajans:
          </span>

          {JANMASHTAMI_SPECIAL_TRACKS.slice(0, 5).map((track) => (
            <button
              key={`quick-janmashtami-${track.id}`}
              type="button"
              onClick={() => {
                onPlayTrack(track);
                onShowToast(`🪶 Playing: ${track.title.split('|')[0].trim()}`, 'success');
              }}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-900/80 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-amber-400/20 hover:border-amber-400/50 transition-all shrink-0 flex items-center gap-1.5 active:scale-95"
            >
              <Play size={10} className="fill-amber-400 text-amber-400" />
              <span className="truncate max-w-[140px] sm:max-w-[190px]">
                {track.title.split('|')[0].trim()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Janmashtami Specials Modal with Curated Bhajans */}
      <JanmashtamiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPlayTrack={onPlayTrack}
        particlesOn={particlesOn}
        onToggleParticles={handleToggleParticles}
        onShowToast={onShowToast}
      />
    </>
  );
};

/**
 * Janmashtami Celebration Modal
 */
export const JanmashtamiModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
  particlesOn: boolean;
  onToggleParticles: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ isOpen, onClose, onPlayTrack, particlesOn, onToggleParticles, onShowToast }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#0b172a] via-[#0f172a] to-[#070b14] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="relative p-5 bg-gradient-to-r from-sky-950/80 via-slate-900 to-amber-950/70 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <MorPankhIcon size={26} />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <span>श्रीकृष्ण जन्माष्टमी विशेष</span>
                <span className="text-sm">🪈</span>
              </h3>
              <p className="text-xs text-amber-300/80 font-medium">
                Lord Krishna Divine Melodies & Bhajans
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Particle and Expiry Info Strip */}
        <div className="px-5 py-2.5 bg-black/40 border-b border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span>Floating Festive Effects</span>
            <span className="text-[10px] text-amber-400 font-bold">(Until 6 Sep 2026)</span>
          </div>

          <button
            type="button"
            onClick={onToggleParticles}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              particlesOn
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-800 text-slate-400 border border-white/10'
            }`}
          >
            {particlesOn ? '✨ Effects ON' : 'Effects Paused'}
          </button>
        </div>

        {/* Track List */}
        <div className="p-4 overflow-y-auto space-y-2.5 no-scrollbar flex-1">
          {JANMASHTAMI_SPECIAL_TRACKS.map((track, idx) => (
            <div
              key={`modal-janmashtami-track-${track.id}`}
              onClick={() => {
                onPlayTrack(track);
                onShowToast(`🪶 Now Playing: ${track.title.split('|')[0]}`, 'success');
              }}
              className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-900/60 hover:bg-amber-500/10 border border-white/5 hover:border-amber-400/30 transition-all cursor-pointer group"
            >
              <div className="w-6 text-center text-xs font-black text-amber-400/80">
                {idx + 1}
              </div>

              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-amber-400/20">
                <img
                  src={track.thumbnail}
                  alt={track.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={16} className="fill-white text-white" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                  {track.title}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span className="truncate">{track.channel}</span>
                  <span>•</span>
                  <span className="font-mono text-[10px] text-amber-400/90">{track.duration}</span>
                </div>
              </div>

              <button
                type="button"
                className="p-2 rounded-xl bg-amber-500/10 text-amber-400 opacity-80 group-hover:opacity-100 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shrink-0"
              >
                <Play size={14} className="fill-current" />
              </button>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            🙏 राधे राधे! Wishing you peace, joy and prosperity.
          </p>

          <button
            type="button"
            onClick={() => {
              onPlayTrack(JANMASHTAMI_SPECIAL_TRACKS[0]);
              onClose();
              onShowToast('🪶 Playing Janmashtami Specials', 'success');
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
          >
            <Play size={14} className="fill-slate-950" />
            <span>Play All</span>
          </button>
        </div>

      </div>
    </div>
  );
};

/**
 * Janmashtami Header Badge rendered in Navbar
 */
export const JanmashtamiHeaderBadge: React.FC<{
  onOpenModal?: () => void;
}> = ({ onOpenModal }) => {
  const [active, setActive] = useState<boolean>(false);

  useEffect(() => {
    setActive(isJanmashtamiActive());
  }, []);

  if (!active) return null;

  return (
    <div 
      onClick={onOpenModal}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-950/80 via-slate-900 to-amber-950/80 border border-amber-400/40 hover:border-amber-400/70 text-amber-300 hover:text-white shadow-xs cursor-pointer select-none transition-all active:scale-95 group"
      title="Shree Krishna Janmashtami Special (Active until 6th Sep 2026)"
    >
      <MorPankhIcon size={16} className="animate-[mor-pankh-sway_3s_ease-in-out_infinite]" />
      <span className="text-[11px] font-black tracking-tight bg-gradient-to-r from-amber-200 via-amber-300 to-cyan-300 bg-clip-text text-transparent">
        Janmashtami
      </span>
      <span className="text-[10px] text-amber-400">✨</span>
    </div>
  );
};

import React from 'react';
import { motion } from 'motion/react';

interface DurgaPujaLogoEffectProps {
  children: React.ReactNode;
}

export const DurgaPujaLogoEffect: React.FC<DurgaPujaLogoEffectProps> = ({ children }) => {
  return (
    <div className="relative flex items-center justify-center select-none">
      {/* 1. Divine Vermillion & Golden Sacred Halo Aura */}
      <motion.div
        animate={{
          scale: [1, 1.14, 1],
          opacity: [0.45, 0.75, 0.45],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full bg-gradient-to-r from-red-600/30 via-amber-500/35 to-rose-600/30 blur-3xl pointer-events-none"
      />

      {/* 2. Concentric Sacred Mandorla Rings */}
      <div className="absolute inset-0 -m-8 rounded-full border border-amber-400/30 dark:border-amber-300/40 pointer-events-none animate-pulse" />
      <div className="absolute inset-0 -m-12 rounded-full border border-red-500/20 dark:border-rose-400/25 pointer-events-none" />

      {/* 3. Maa Durga Sacred Third Eye & Trishul Crest on Top of Logo */}
      <motion.div
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="absolute -top-7 sm:-top-8 z-30 flex flex-col items-center pointer-events-none"
      >
        <div className="flex items-center gap-1 text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.9)]">
          {/* Sacred Trishul (Trident) SVG */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 animate-bounce">
            <path d="M12 2v20" />
            <path d="M6 7c0 4 3 7 6 7s6-3 6-7" />
            <path d="M6 7V4" />
            <path d="M18 7V4" />
            <path d="M12 2l-1.5 2h3L12 2z" fill="currentColor" />
          </svg>
        </div>
      </motion.div>

      {/* 4. Floating Kash Phool (Autumn white reeds), Diyas & Auspicious Golden Sparkles */}
      <div className="absolute inset-0 -m-16 pointer-events-none overflow-visible">
        {[
          { x: -75, y: -45, delay: 0, scale: 1.1, icon: '🌸', color: 'text-rose-300' },
          { x: 80, y: -40, delay: 0.2, scale: 1.2, icon: '🪔', color: 'text-amber-400' },
          { x: -85, y: 35, delay: 0.4, scale: 0.9, icon: '🌾', color: 'text-emerald-200' },
          { x: 85, y: 45, delay: 0.1, scale: 1.0, icon: '✦', color: 'text-yellow-300' },
          { x: 0, y: -80, delay: 0.3, scale: 1.2, icon: '✨', color: 'text-amber-200' },
          { x: 0, y: 80, delay: 0.5, scale: 1.1, icon: '🌺', color: 'text-red-400' },
          { x: -50, y: 70, delay: 0.25, scale: 0.85, icon: '✦', color: 'text-amber-300' },
          { x: 55, y: 72, delay: 0.35, scale: 0.9, icon: '🌾', color: 'text-white' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.35, 1, 0.35],
              scale: [item.scale * 0.85, item.scale * 1.2, item.scale * 0.85],
              y: [item.y - 4, item.y + 4, item.y - 4],
            }}
            transition={{
              duration: 2.0 + (i % 3) * 0.3,
              repeat: Infinity,
              delay: item.delay,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: `calc(50% + ${item.x}px)`,
              top: `calc(50% + ${item.y}px)`,
            }}
            className={`text-sm sm:text-base ${item.color} drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]`}
          >
            {item.icon}
          </motion.div>
        ))}
      </div>

      {/* Main Logo Container */}
      <div className="relative z-10">
        {children}
      </div>

      {/* 5. Festive Sharodotsav / Durga Puja Banner Badge below logo */}
      <div className="absolute -bottom-6 sm:-bottom-7 z-20 pointer-events-none whitespace-nowrap">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide bg-gradient-to-r from-red-600/90 via-amber-600/90 to-red-600/90 text-white shadow-lg border border-amber-300/40 backdrop-blur-md flex items-center gap-1">
          <span>🪔</span>
          <span>শুভ শারদীয়া • Durga Puja</span>
          <span>🌸</span>
        </span>
      </div>
    </div>
  );
};

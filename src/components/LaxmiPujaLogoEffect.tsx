import React from 'react';
import { motion } from 'motion/react';

interface LaxmiPujaLogoEffectProps {
  children: React.ReactNode;
}

export const LaxmiPujaLogoEffect: React.FC<LaxmiPujaLogoEffectProps> = ({ children }) => {
  return (
    <div className="relative flex items-center justify-center select-none">
      {/* 1. Divine Golden & Vermillion Sacred Aura Halo */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.85, 0.5],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-72 h-72 sm:w-92 sm:h-92 rounded-full bg-gradient-to-r from-amber-500/35 via-yellow-400/40 to-rose-600/30 blur-3xl pointer-events-none"
      />

      {/* 2. Concentric Auspicious Golden Mandorla Rays */}
      <div className="absolute inset-0 -m-8 rounded-3xl border border-yellow-400/40 dark:border-yellow-300/50 pointer-events-none animate-pulse" />
      <div className="absolute inset-0 -m-12 rounded-3xl border border-amber-500/25 dark:border-amber-400/30 pointer-events-none" />

      {/* 3. Auspicious Golden Lotus Pedestal Crown on Top of Logo */}
      <motion.div
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="absolute -top-8 sm:-top-9 z-30 flex flex-col items-center pointer-events-none"
      >
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/85 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.8)] backdrop-blur-md">
          <span className="text-sm sm:text-base animate-bounce">🪷</span>
          <span className="text-[10px] sm:text-[11px] font-black tracking-wider bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 bg-clip-text text-transparent">
            শ্রী লক্ষ্মী
          </span>
          <span className="text-xs">✨</span>
        </div>
      </motion.div>

      {/* 4. Floating Divine Elements: Golden Coins, Sacred Diyas, Lotus & Paddy Sheaves */}
      <div className="absolute inset-0 -m-16 pointer-events-none overflow-visible">
        {[
          { x: -80, y: -45, delay: 0, scale: 1.2, icon: '🪷', color: 'text-rose-400' },
          { x: 85, y: -40, delay: 0.25, scale: 1.15, icon: '🪔', color: 'text-amber-400' },
          { x: -90, y: 35, delay: 0.45, scale: 1.1, icon: '🪙', color: 'text-yellow-400' },
          { x: 90, y: 45, delay: 0.15, scale: 1.05, icon: '🌾', color: 'text-amber-300' },
          { x: 0, y: -85, delay: 0.35, scale: 1.25, icon: '✨', color: 'text-yellow-200' },
          { x: 0, y: 85, delay: 0.55, scale: 1.2, icon: '🪷', color: 'text-pink-400' },
          { x: -55, y: 75, delay: 0.2, scale: 0.95, icon: '🪙', color: 'text-amber-300' },
          { x: 60, y: 78, delay: 0.4, scale: 1.0, icon: '🪔', color: 'text-yellow-400' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [item.scale * 0.9, item.scale * 1.18, item.scale * 0.9],
              y: [item.y - 5, item.y + 5, item.y - 5],
            }}
            transition={{
              duration: 2.2 + (i % 3) * 0.3,
              repeat: Infinity,
              delay: item.delay,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: `calc(50% + ${item.x}px)`,
              top: `calc(50% + ${item.y}px)`,
            }}
            className={`text-sm sm:text-base ${item.color} drop-shadow-[0_0_10px_rgba(245,158,11,0.85)]`}
          >
            {item.icon}
          </motion.div>
        ))}
      </div>

      {/* Main Logo Container */}
      <div className="relative z-10">
        {children}
      </div>

      {/* 5. Auspicious Kojagari Laxmi Puja Mahotsav Banner Badge below logo */}
      <div className="absolute -bottom-6 sm:-bottom-7 z-20 pointer-events-none whitespace-nowrap">
        <span className="px-3.5 py-1.5 rounded-2xl text-[10px] sm:text-[11px] font-bold tracking-wide bg-gradient-to-r from-amber-700/95 via-yellow-600/95 to-amber-700/95 text-white shadow-xl border border-yellow-300/50 backdrop-blur-md flex items-center gap-1.5">
          <span>🪷</span>
          <span className="font-black bg-gradient-to-r from-yellow-100 via-amber-200 to-yellow-100 bg-clip-text text-transparent">
            শুভ লক্ষ্মী পূজা • Laxmi Puja
          </span>
          <span>🪙</span>
        </span>
      </div>
    </div>
  );
};

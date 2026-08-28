import React from 'react';
import { motion } from 'motion/react';

interface RakhiLogoEffectProps {
  children: React.ReactNode;
}

export const RakhiLogoEffect: React.FC<RakhiLogoEffectProps> = ({ children }) => {
  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Radiant Golden/Crimson Aura Glow */}
      <motion.div
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.35, 0.6, 0.35],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-yellow-400/25 blur-2xl pointer-events-none"
      />

      {/* Floating Auspicious Golden Sparkles & Petals */}
      <div className="absolute inset-0 -m-16 pointer-events-none overflow-visible">
        {[
          { x: -70, y: -50, delay: 0, scale: 0.9, color: 'text-amber-400' },
          { x: 75, y: -45, delay: 0.4, scale: 1.1, color: 'text-yellow-300' },
          { x: -85, y: 40, delay: 0.8, scale: 0.8, color: 'text-rose-400' },
          { x: 80, y: 55, delay: 0.2, scale: 1, color: 'text-amber-300' },
          { x: 0, y: -80, delay: 0.6, scale: 0.85, color: 'text-yellow-400' },
          { x: 0, y: 80, delay: 1.0, scale: 0.95, color: 'text-rose-500' },
        ].map((sparkle, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.3, 0.9, 0.3],
              scale: [sparkle.scale * 0.8, sparkle.scale * 1.2, sparkle.scale * 0.8],
              y: [sparkle.y - 4, sparkle.y + 4, sparkle.y - 4],
            }}
            transition={{
              duration: 2.5 + (i % 3) * 0.5,
              repeat: Infinity,
              delay: sparkle.delay,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: `calc(50% + ${sparkle.x}px)`,
              top: `calc(50% + ${sparkle.y}px)`,
            }}
            className={`text-base sm:text-lg ${sparkle.color} drop-shadow-sm font-serif`}
          >
            ✦
          </motion.div>
        ))}
      </div>

      {/* Sacred Rakhi Silk Thread (Moli/Kalava Dori) - Left & Right with Beads */}
      <div className="absolute inset-x-[-70px] sm:inset-x-[-110px] top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none z-0">
        {/* Left Sacred Thread */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          className="flex-1 flex items-center justify-end origin-right pr-1"
        >
          <div className="relative w-full h-[3px] bg-gradient-to-r from-transparent via-amber-500 to-rose-600 rounded-full shadow-sm flex items-center justify-end">
            {/* Left Thread Beads & Pearls */}
            <div className="flex items-center gap-1 sm:gap-1.5 mr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 border border-amber-500 shadow-xs"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-100 to-amber-300 border border-amber-400 shadow-xs"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-rose-500 to-red-600 border border-amber-300 shadow-xs"></span>
              <span className="w-2 h-2 rounded-full bg-amber-300 border border-amber-500 shadow-xs"></span>
            </div>
          </div>
        </motion.div>

        {/* Center Spacer for Central Emblem */}
        <div className="w-36 sm:w-44 shrink-0" />

        {/* Right Sacred Thread */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          className="flex-1 flex items-center justify-start origin-left pl-1"
        >
          <div className="relative w-full h-[3px] bg-gradient-to-l from-transparent via-amber-500 to-rose-600 rounded-full shadow-sm flex items-center justify-start">
            {/* Right Thread Beads & Pearls */}
            <div className="flex items-center gap-1 sm:gap-1.5 ml-2">
              <span className="w-2 h-2 rounded-full bg-amber-300 border border-amber-500 shadow-xs"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-rose-500 to-red-600 border border-amber-300 shadow-xs"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-100 to-amber-300 border border-amber-400 shadow-xs"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 border border-amber-500 shadow-xs"></span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative Golden Floral Mandala Petal Ring Frame */}
      <motion.div
        initial={{ rotate: -45, scale: 0.7, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
        className="absolute inset-[-14px] sm:inset-[-18px] pointer-events-none z-0 flex items-center justify-center"
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(217,119,6,0.35)]"
        >
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="50%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="crimsonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="50%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#9F1239" />
            </linearGradient>
            <radialGradient id="sunburst" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#E11D48" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Golden Sunburst Background */}
          <circle cx="100" cy="100" r="92" fill="url(#sunburst)" />

          {/* Auspicious 16 Petal Floral Mandala Ring */}
          {[...Array(16)].map((_, index) => {
            const angle = (index * 360) / 16;
            return (
              <g key={index} transform={`rotate(${angle} 100 100)`}>
                {/* Outer Golden Petal */}
                <path
                  d="M100 12 C104 22 108 30 100 38 C92 30 96 22 100 12 Z"
                  fill="url(#goldGrad)"
                  stroke="#78350F"
                  strokeWidth="0.5"
                />
                {/* Inner Ruby Gem Pearl */}
                <circle cx="100" cy="30" r="2.8" fill="url(#crimsonGrad)" stroke="#FDE047" strokeWidth="0.6" />
              </g>
            );
          })}

          {/* Golden Beaded Inner Border */}
          <circle
            cx="100"
            cy="100"
            r="68"
            fill="none"
            stroke="url(#goldGrad)"
            strokeWidth="3.5"
            strokeDasharray="2.5 3.5"
          />

          {/* Auspicious Crimson Ring */}
          <circle
            cx="100"
            cy="100"
            r="64"
            fill="none"
            stroke="url(#crimsonGrad)"
            strokeWidth="2.5"
          />
        </svg>
      </motion.div>

      {/* Central Children / Logo with Elevated Elevation */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

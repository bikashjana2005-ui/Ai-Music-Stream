import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AppLogo } from './AppLogo';
import { RakhiLogoEffect } from './RakhiLogoEffect';
import { isRakshaBandhanToday } from '../utils/festivalUtils';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [progress, setProgress] = useState(0);
  const isRakhiDay = isRakshaBandhanToday();

  useEffect(() => {
    // Fill progress bar smoothly
    const progressTimer = setTimeout(() => {
      setProgress(100);
    }, 50);

    // Call onComplete after display duration (allow festive animation to shine)
    const displayDuration = isRakhiDay ? 1800 : 1350;
    const completeTimer = setTimeout(() => {
      onCompleteRef.current();
    }, displayDuration);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(completeTimer);
    };
  }, [isRakhiDay]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 1.04, 
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } 
      }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white text-slate-900 overflow-hidden pointer-events-none select-none"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.05, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center justify-center px-6 text-center"
      >
        {/* Centered Animated App Logo (with Rakhi adornment on Raksha Bandhan) */}
        <motion.div 
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
          className="relative"
        >
          {isRakhiDay ? (
            <RakhiLogoEffect>
              <div className="relative rounded-full shadow-2xl shadow-amber-600/30">
                <AppLogo size={110} className="sm:w-32 sm:h-32" />
              </div>
            </RakhiLogoEffect>
          ) : (
            <div className="relative rounded-full shadow-2xl shadow-black/10">
              <AppLogo size={110} className="sm:w-32 sm:h-32" />
            </div>
          )}
        </motion.div>

        {/* Brand Name */}
        <motion.h1
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-6"
        >
          Ai Music Stream
        </motion.h1>

        {/* Raksha Bandhan Festive Greeting Badge (Only for Today) */}
        {isRakhiDay && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.22 }}
            className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border border-amber-500/30 shadow-xs"
          >
            <span className="text-amber-500 text-xs">✨</span>
            <span className="text-xs font-bold bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 bg-clip-text text-transparent tracking-wide">
              Happy Raksha Bandhan
            </span>
            <span className="text-amber-500 text-xs">✨</span>
          </motion.div>
        )}

        {/* Minimal Progress Line */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="w-40 sm:w-48 h-1 bg-slate-100 rounded-full overflow-hidden mt-6"
        >
          <div 
            className={`h-full rounded-full transition-all duration-[1200ms] ease-out ${
              isRakhiDay ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500' : 'bg-slate-900'
            }`}
            style={{ width: `${progress}%` }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};




import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AppLogo } from './AppLogo';
import { RakhiLogoEffect } from './RakhiLogoEffect';
import { DurgaPujaLogoEffect } from './DurgaPujaLogoEffect';
import { LaxmiPujaLogoEffect } from './LaxmiPujaLogoEffect';
import { isRakshaBandhanToday, isDurgaPujaActive, isLaxmiPujaActive } from '../utils/festivalUtils';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const isRakhiDay = isRakshaBandhanToday();
  const isDurgaPuja = isDurgaPujaActive();
  const isLaxmiPuja = isLaxmiPujaActive();
  const [hasCompleted, setHasCompleted] = useState(false);

  const handleFinish = () => {
    if (hasCompleted) return;
    setHasCompleted(true);
    onCompleteRef.current();
  };

  useEffect(() => {
    // Ultra-fast logo presentation with 320ms presentation & immediate transition
    const completeTimer = setTimeout(() => {
      handleFinish();
    }, 320);

    return () => {
      clearTimeout(completeTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        scale: 1.02,
        transition: { duration: 0.1, ease: 'easeOut' } 
      }}
      onClick={handleFinish}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-[#090d16] overflow-hidden select-none cursor-pointer"
    >
      {/* Subtle Ambient Radial Backlight */}
      <div className={`absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full blur-3xl pointer-events-none -translate-y-6 ${
        isLaxmiPuja 
          ? 'bg-gradient-to-r from-amber-500/30 via-yellow-400/35 to-rose-600/25' 
          : 'bg-rose-600/15 dark:bg-rose-600/20'
      }`} />

      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 4 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 1.02, opacity: 0 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        className="flex flex-col items-center justify-center text-center relative z-10 px-4"
      >
        {/* Centered App Logo with Glow and Festive Effects */}
        <div className="relative rounded-2xl shadow-2xl shadow-rose-600/25 flex items-center justify-center mb-5 sm:mb-6">
          {isLaxmiPuja ? (
            <LaxmiPujaLogoEffect>
              <AppLogo size={104} className="sm:w-28 sm:h-28" glow={true} />
            </LaxmiPujaLogoEffect>
          ) : isDurgaPuja ? (
            <DurgaPujaLogoEffect>
              <AppLogo size={104} className="sm:w-28 sm:h-28" glow={true} />
            </DurgaPujaLogoEffect>
          ) : isRakhiDay ? (
            <RakhiLogoEffect>
              <AppLogo size={104} className="sm:w-28 sm:h-28" glow={true} />
            </RakhiLogoEffect>
          ) : (
            <AppLogo size={104} className="sm:w-28 sm:h-28" glow={true} />
          )}
        </div>

        {/* Application Name: Ai Music Stream */}
        <div className="space-y-1 flex flex-col items-center mt-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
            <span className="bg-gradient-to-r from-red-600 via-rose-500 to-rose-600 bg-clip-text text-transparent">
              Ai
            </span>
            <span>Music Stream</span>
          </h1>
          <p className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
            Instant Music & Video
          </p>
        </div>

        {/* Rapid Micro Loader Line (Fills in 220ms for ultra-fast launch) */}
        <div className="w-28 sm:w-36 h-1 bg-slate-200 dark:bg-white/10 rounded-lg overflow-hidden mt-4">
          <motion.div 
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-lg shadow-xs"
          />
        </div>
      </motion.div>
    </motion.div>
  );
};





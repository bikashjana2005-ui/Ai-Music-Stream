import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { AppLogo } from './AppLogo';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fill progress bar smoothly
    const progressTimer = setTimeout(() => {
      setProgress(100);
    }, 50);

    // Call onComplete after 1350ms to allow full smooth animation cycle
    const completeTimer = setTimeout(() => {
      onCompleteRef.current();
    }, 1350);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 1.06, 
        filter: 'blur(16px)',
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } 
      }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden pointer-events-none select-none"
    >
      {/* Background Ambient Glow Orbs */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-600/30 via-purple-600/20 to-pink-600/10 rounded-full blur-[120px] pointer-events-none"
      />

      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 1.04, opacity: 0, y: -8 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center px-6 text-center"
      >
        {/* Animated App Logo */}
        <motion.div 
          initial={{ scale: 0.7, rotate: -8, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          className="relative mb-6"
        >
          {/* Outer Pulse Glow */}
          <div className="absolute -inset-3 bg-gradient-to-r from-rose-500/40 via-purple-600/40 to-indigo-500/40 rounded-full blur-2xl opacity-70 animate-pulse" />
          
          <div className="relative p-1 rounded-full bg-slate-900 border border-white/20 shadow-2xl shadow-black/80">
            <AppLogo size={88} className="sm:w-24 sm:h-24" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex items-center justify-center gap-2"
        >
          <h1 className="text-3xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300 tracking-tight">
            Ai Music Stream
          </h1>
          <span className="text-[10px] font-black tracking-wider px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-400/30 flex items-center gap-1 shadow-sm backdrop-blur-md">
            <Sparkles size={10} /> Pro
          </span>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-slate-400 font-medium mt-1.5 text-xs sm:text-sm tracking-wide"
        >
          YouTube Video & Audio Player Engine
        </motion.p>

        {/* Progress Bar Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="w-48 sm:w-56 h-1.5 bg-slate-800/80 rounded-full overflow-hidden mt-8 p-0.5 border border-white/10 backdrop-blur-sm"
        >
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-500 rounded-full transition-all duration-[1250ms] ease-out shadow-sm shadow-indigo-500/50"
            style={{ width: `${progress}%` }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};



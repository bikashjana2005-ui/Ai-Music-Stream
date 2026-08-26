import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
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
        {/* Centered Animated App Logo */}
        <motion.div 
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
          className="relative"
        >
          <div className="relative rounded-full shadow-2xl shadow-black/10">
            <AppLogo size={110} className="sm:w-32 sm:h-32" />
          </div>
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

        {/* Minimal Progress Line */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="w-40 sm:w-48 h-1 bg-slate-100 rounded-full overflow-hidden mt-6"
        >
          <div 
            className="h-full bg-slate-900 rounded-full transition-all duration-[1200ms] ease-out"
            style={{ width: `${progress}%` }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};




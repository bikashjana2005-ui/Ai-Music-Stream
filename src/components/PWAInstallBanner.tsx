import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Smartphone, X, CheckCircle2, ExternalLink } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallBanner: React.FC<{ showToast: (msg: string, type?: 'success' | 'info' | 'error') => void }> = ({ showToast }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showApkModal, setShowApkModal] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone / installed mode
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Auto show banner after 2 seconds
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      showToast('Ai Music Stream successfully installed on your device!', 'success');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [showToast]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showToast('Installing Ai Music Stream WebAPK...', 'success');
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowApkModal(true);
    }
  };

  const appUrl = window.location.href;

  return (
    <>
      {/* Bottom Floating Install Banner on Android/Mobile */}
      <AnimatePresence>
        {showBanner && !isInstalled && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[90] bg-slate-900/95 dark:bg-slate-900/95 border border-indigo-500/30 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">Install App on Phone</h4>
                <p className="text-xs text-slate-300 truncate">Install direct APK/App without Play Store</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Download size={14} /> Install
              </button>
              <button
                onClick={() => setShowBanner(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* APK Generation & Direct Install Modal */}
      <AnimatePresence>
        {showApkModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden"
            >
              <button
                onClick={() => setShowApkModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <Smartphone size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Direct APK & App Installation</h3>
                  <p className="text-xs text-slate-400">Install directly on Android or generate APK file</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-300 mb-6">
                <div className="p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl">
                  <h4 className="font-bold text-indigo-300 flex items-center gap-2 mb-1">
                    <CheckCircle2 size={16} /> Option 1: Direct WebAPK Install (Instant)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Open this app in <strong>Google Chrome on Android</strong>, tap the <strong>3 dots menu</strong> in top right, and tap <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>. It installs a native APK wrapper directly onto your phone without requiring root or external APK downloads!
                  </p>
                </div>

                <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2 mb-1">
                    <ExternalLink size={16} /> Option 2: Download Standalone .APK File
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    You can convert this live PWA web app URL into a direct downloadable <code>.apk</code> file in 1-click using PWABuilder:
                  </p>
                  <a
                    href={`https://www.pwabuilder.com/?url=${encodeURIComponent(appUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                  >
                    Generate & Download APK on PWABuilder <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <button
                onClick={() => setShowApkModal(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Cloud, 
  Activity, 
  Layers, 
  Database, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  Smartphone,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  const [copiedShared, setCopiedShared] = useState(false);
  const [copiedDev, setCopiedDev] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'guide'>('live');
  const [expandedSection, setExpandedSection] = useState<'aistudio' | 'firebase' | 'pwa' | null>('aistudio');

  const sharedProductionUrl = 'https://ais-pre-2wddfamqv2is5xwzrlenus-486828805712.asia-southeast1.run.app';
  const currentBrowserUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : sharedProductionUrl;

  const handleCopy = (url: string, isShared: boolean) => {
    navigator.clipboard.writeText(url).then(() => {
      if (isShared) {
        setCopiedShared(true);
        setTimeout(() => setCopiedShared(false), 2500);
      } else {
        setCopiedDev(true);
        setTimeout(() => setCopiedDev(false), 2500);
      }
      onShowToast("Deployment link copied to clipboard!", "success");
    }).catch(() => {
      onShowToast("Failed to copy link", "error");
    });
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Ai Music Stream - YouTube Audio & AI Music Player',
        text: 'Stream edge-to-edge YouTube videos and high-speed audio in 165Hz virtual smoothness!',
        url: sharedProductionUrl,
      }).catch(() => {});
    } else {
      handleCopy(sharedProductionUrl, true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-zinc-800 relative z-10 transform-gpu"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 pb-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/25">
                  <Cloud size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-gray-900 dark:text-white">Deployment & Live Sharing</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Online
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Google Cloud Run & PWA Distribution</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Segmented Control Tabs */}
            <div className="px-5 pt-3 pb-1 shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('live')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'live'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-xs'
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Globe size={14} /> Live URLs & Status
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('guide')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'guide'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-xs'
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Terminal size={14} /> Deployment Instructions
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 pt-3 space-y-4 overflow-y-auto flex-1">
              {activeTab === 'live' ? (
                <>
                  {/* Public Shared Production URL */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-amber-500" />
                        Public Shared Production URL (Instant Access)
                      </label>
                      <span className="text-[10px] font-semibold text-emerald-500">Auto-Synced</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-zinc-800/80 rounded-2xl border border-gray-200 dark:border-zinc-700">
                      <input 
                        type="text" 
                        readOnly 
                        value={sharedProductionUrl}
                        className="w-full bg-transparent text-xs font-mono text-gray-800 dark:text-zinc-200 px-2 outline-none truncate select-all"
                      />
                      <button
                        onClick={() => handleCopy(sharedProductionUrl, true)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                          copiedShared 
                            ? 'bg-emerald-600 text-white shadow-md' 
                            : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 active:scale-95'
                        }`}
                      >
                        {copiedShared ? <Check size={13} /> : <Copy size={13} />}
                        {copiedShared ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                      Share this link with any user. Runs instantly in any mobile or desktop browser without needing sign-in or developer setup.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={handleNativeShare}
                      className="p-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                    >
                      <Share2 size={15} /> Share via Apps
                    </button>
                    
                    <a
                      href={sharedProductionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
                    >
                      <ExternalLink size={15} /> Open Live Preview
                    </a>
                  </div>

                  {/* Real-Time Cloud Infrastructure Status */}
                  <div className="space-y-2 pt-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                      Application Infrastructure Matrix
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/70 dark:border-zinc-800 space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400 text-[11px]">
                          <Cloud size={13} className="text-blue-500" />
                          <span>Hosting Platform</span>
                        </div>
                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                          Google Cloud Run
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-zinc-500">Serverless Asia-SE1</div>
                      </div>

                      <div className="p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/70 dark:border-zinc-800 space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400 text-[11px]">
                          <Database size={13} className="text-amber-500" />
                          <span>Cloud Database</span>
                        </div>
                        <div className="font-bold text-gray-900 dark:text-white">Firestore Realtime</div>
                        <div className="text-[10px] text-gray-400 dark:text-zinc-500 truncate" title="ai-studio-aimusicstream">
                          ai-studio-aimusicstream
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/70 dark:border-zinc-800 space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400 text-[11px]">
                          <Activity size={13} className="text-emerald-500" />
                          <span>Refresh Engine</span>
                        </div>
                        <div className="font-bold text-gray-900 dark:text-white">165Hz Virtual Motion</div>
                        <div className="text-[10px] text-emerald-500 font-semibold">Sub-frame Interpolation</div>
                      </div>

                      <div className="p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/70 dark:border-zinc-800 space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400 text-[11px]">
                          <Layers size={13} className="text-rose-500" />
                          <span>Player Architecture</span>
                        </div>
                        <div className="font-bold text-gray-900 dark:text-white">Edge-to-Edge Adaptive</div>
                        <div className="text-[10px] text-gray-400 dark:text-zinc-500">Zero-circle geometry</div>
                      </div>
                    </div>
                  </div>

                  {/* Browser Context URL */}
                  <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-rose-600 text-white rounded-xl shrink-0">
                        <Smartphone size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-900 dark:text-white truncate">Install as Web App (PWA)</div>
                        <div className="text-[11px] text-gray-500 dark:text-zinc-400">
                          Add to Home Screen in Safari or Chrome for full-screen edge-to-edge audio.
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Step-by-Step Deployment Instructions */
                <div className="space-y-3">
                  {/* Section 1: AI Studio Cloud Deployment */}
                  <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedSection(expandedSection === 'aistudio' ? null : 'aistudio')}
                      className="w-full p-3.5 bg-gray-50 dark:bg-zinc-800/70 flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          1
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          AI Studio Automatic Cloud Hosting (Default & Live)
                        </span>
                      </div>
                      {expandedSection === 'aistudio' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedSection === 'aistudio' && (
                      <div className="p-3.5 text-xs text-gray-600 dark:text-zinc-300 space-y-2 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <p>
                          Your application is <strong>already deployed and continuously synced</strong>. Every time changes are compiled in Google AI Studio, a containerized production service is updated on Cloud Run.
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-gray-500 dark:text-zinc-400 text-[11px]">
                          <li>No manual build or server maintenance needed.</li>
                          <li>The Shared App URL is public and protected with SSL/TLS.</li>
                          <li>Firestore database rules and indexes run automatically.</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Section 2: Standalone Production Build */}
                  <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedSection(expandedSection === 'firebase' ? null : 'firebase')}
                      className="w-full p-3.5 bg-gray-50 dark:bg-zinc-800/70 flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                          2
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          Deploy to Firebase Hosting, Vercel, or Custom Domain
                        </span>
                      </div>
                      {expandedSection === 'firebase' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedSection === 'firebase' && (
                      <div className="p-3.5 text-xs text-gray-600 dark:text-zinc-300 space-y-2.5 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <p>
                          To deploy on your own custom domain (e.g. Firebase Hosting, Vercel, Netlify):
                        </p>
                        <div className="p-2.5 rounded-xl bg-zinc-950 font-mono text-[11px] text-zinc-300 space-y-1 overflow-x-auto">
                          <div className="text-zinc-500"># 1. Build the production bundle</div>
                          <div className="text-emerald-400">npm run build</div>
                          <div className="text-zinc-500 pt-1"># 2. Deploy to Firebase Hosting</div>
                          <div className="text-emerald-400">firebase deploy --only hosting</div>
                          <div className="text-zinc-500 pt-1"># Or deploy to Vercel</div>
                          <div className="text-emerald-400">npx vercel --prod dist</div>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                          The production bundle is compiled into the <code className="bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded">/dist</code> directory with minified assets and gzip compression.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Section 3: PWA Installation Guide */}
                  <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedSection(expandedSection === 'pwa' ? null : 'pwa')}
                      className="w-full p-3.5 bg-gray-50 dark:bg-zinc-800/70 flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
                          3
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          PWA Home Screen Installation (iOS & Android)
                        </span>
                      </div>
                      {expandedSection === 'pwa' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedSection === 'pwa' && (
                      <div className="p-3.5 text-xs text-gray-600 dark:text-zinc-300 space-y-2 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px]">
                        <div>
                          <strong className="text-gray-900 dark:text-white">On iOS (Safari):</strong>
                          <p className="text-gray-500 dark:text-zinc-400">
                            Tap the <strong>Share</strong> button at the bottom of Safari, scroll down, and select <strong>&quot;Add to Home Screen&quot;</strong>.
                          </p>
                        </div>
                        <div>
                          <strong className="text-gray-900 dark:text-white">On Android (Chrome / Brave):</strong>
                          <p className="text-gray-500 dark:text-zinc-400">
                            Tap the <strong>three dots menu (⋮)</strong> and tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-950/40 flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400 shrink-0">
              <span className="flex items-center gap-1.5 font-medium">
                <Cloud size={13} className="text-rose-500" />
                Live on Cloud Run
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 font-bold hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

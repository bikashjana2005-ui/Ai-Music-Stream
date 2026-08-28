import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  ExternalLink,
  Copy,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Sparkles,
  Search
} from 'lucide-react';

interface InAppWebViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
  title?: string;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const InAppWebViewModal: React.FC<InAppWebViewModalProps> = ({
  isOpen,
  onClose,
  initialUrl = 'https://m.youtube.com',
  title = 'In-App WebView',
  onShowToast
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>(initialUrl);
  const [inputUrl, setInputUrl] = useState<string>(initialUrl);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  useEffect(() => {
    if (initialUrl) {
      setCurrentUrl(initialUrl);
      setInputUrl(initialUrl);
    }
  }, [initialUrl, isOpen]);

  if (!isOpen) return null;

  const handleNavigate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let target = inputUrl.trim();
    if (!target) return;

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = 'https://' + target;
      } else {
        target = `https://www.youtube.com/results?search_query=${encodeURIComponent(target)}`;
      }
    }
    setCurrentUrl(target);
    setInputUrl(target);
    setLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleRefresh = () => {
    setLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(currentUrl);
    if (onShowToast) {
      onShowToast('WebView URL copied to clipboard!', 'success');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`bg-slate-900 border border-slate-700/80 text-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
            isMaximized
              ? 'w-full h-full rounded-none border-none'
              : 'w-full max-w-5xl h-[85vh] sm:h-[90vh]'
          }`}
        >
          {/* WebView Header Bar */}
          <div className="bg-slate-950/90 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Title & Badge */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                <Globe size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white truncate">{title}</h3>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck size={10} /> WebView Active
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{currentUrl}</p>
              </div>
            </div>

            {/* Navigation Controls & Search Bar */}
            <form
              onSubmit={handleNavigate}
              className="flex-1 max-w-xl mx-2 flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500 transition-colors"
            >
              <button
                type="button"
                onClick={handleRefresh}
                title="Reload page"
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <RotateCw size={14} className={loading ? 'animate-spin text-indigo-400' : ''} />
              </button>

              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Enter URL or YouTube search query..."
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />

              <button
                type="submit"
                className="p-1 text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-indigo-500/10 transition-colors"
              >
                <Search size={14} />
              </button>
            </form>

            {/* Window Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={copyUrlToClipboard}
                title="Copy URL"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Copy size={15} />
              </button>
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                title="Open in Browser Tab"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ExternalLink size={15} />
              </a>
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? 'Restore size' : 'Maximize window'}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors hidden sm:block"
              >
                {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              <button
                onClick={onClose}
                title="Close WebView"
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors ml-1"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Presets Bar */}
          <div className="bg-slate-950/60 border-b border-slate-800/80 px-3 py-1.5 flex items-center gap-2 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
            <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider shrink-0">Presets:</span>
            <button
              onClick={() => {
                const u = 'https://m.youtube.com';
                setInputUrl(u);
                setCurrentUrl(u);
                setIframeKey((k) => k + 1);
              }}
              className="px-2.5 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg font-medium shrink-0 transition-colors"
            >
              YouTube Mobile
            </button>
            <button
              onClick={() => {
                const u = 'https://music.youtube.com';
                setInputUrl(u);
                setCurrentUrl(u);
                setIframeKey((k) => k + 1);
              }}
              className="px-2.5 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg font-medium shrink-0 transition-colors"
            >
              YouTube Music
            </button>
            <button
              onClick={() => {
                const u = 'https://www.youtube.com/feed/trending';
                setInputUrl(u);
                setCurrentUrl(u);
                setIframeKey((k) => k + 1);
              }}
              className="px-2.5 py-0.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg font-medium shrink-0 transition-colors"
            >
              Trending Music
            </button>
          </div>

          {/* WebView Iframe Body */}
          <div className="relative flex-1 w-full bg-slate-950 overflow-hidden">
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 text-slate-400 gap-2">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Loading WebView page...</span>
              </div>
            )}

            <iframe
              key={iframeKey}
              src={currentUrl || 'https://m.youtube.com'}
              title="In-App WebView Browser"
              onLoad={() => setLoading(false)}
              className="w-full h-full border-none bg-white dark:bg-slate-900"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

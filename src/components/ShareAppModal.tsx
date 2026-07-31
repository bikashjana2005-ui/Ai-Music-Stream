import React, { useState } from 'react';
import { X, Share2, Copy, Check, ExternalLink, QrCode, Sparkles, Smartphone, Monitor } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = window.location.origin + window.location.pathname;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopied(true);
      onShowToast("Application link copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      onShowToast("Failed to copy link", "error");
    });
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Ai Music Stream - YouTube Audio & AI Music Player',
        text: 'Stream and download unlimited music, playlists, and audio streams in HD quality!',
        url: appUrl,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 relative animate-scale-in p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white">Use & Share Application</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Access Ai Music Stream anywhere</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live URL Box */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Direct Application Link
          </label>
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700">
            <input 
              type="text" 
              readOnly 
              value={appUrl}
              className="w-full bg-transparent text-xs font-mono text-gray-800 dark:text-gray-200 px-2 outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 ${
                copied 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 active:scale-95'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleNativeShare}
            className="p-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Share2 size={16} /> Share Link
          </button>
          
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            <ExternalLink size={16} /> Open New Tab
          </a>
        </div>

        {/* Device Compatibility Note */}
        <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="text-[11px] text-gray-600 dark:text-indigo-200">
            <span className="font-bold">Progressive Web App Ready:</span> Open this link on mobile or desktop browsers to stream music instantly.
          </div>
        </div>

      </div>
    </div>
  );
};

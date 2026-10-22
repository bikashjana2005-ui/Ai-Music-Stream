import React from 'react';
import { Search, Flame, ArrowUpLeft, History, Mic, Sparkles } from 'lucide-react';

interface RedesignedSearchViewProps {
  query: string;
  searchHistory: string[];
  autoSuggestions: string[];
  onSelectTerm: (term: string) => void;
  onAppendTerm: (term: string, e: React.MouseEvent) => void;
  onOpenVoiceModal: () => void;
}

interface RecommendationItem {
  icon: 'search' | 'flame';
  term: string;
  subtitle: string;
  img: string | null;
  aiKeywords?: string[];
}

// AI Recommended Keywords Cloud
const AI_TRENDING_KEYWORDS = [
  'Arijit Singh Hits',
  'Lo-Fi Beats 24/7',
  'Bollywood Top 50',
  'Coke Studio 2026',
  'Slowed + Reverb',
  'Trending Pop Hits',
  'Coke Studio Bangla',
  'Chill Acoustic',
  'Bass Boosted EDM',
  'Study Motivation'
];

// Authentic Recommendations strictly matching user request with AI keywords on every item
const SCREENSHOT_RECOMMENDATIONS: RecommendationItem[] = [
  {
    icon: 'search',
    term: 'star jalsha',
    subtitle: 'Channel you watch',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=100&fit=crop',
    aiKeywords: ['Bengali Serials', 'Star Jalsha Live', 'Drama Episodes']
  },
  {
    icon: 'search',
    term: 'sun bangla',
    subtitle: 'Channel you watch',
    img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=160&h=100&fit=crop',
    aiKeywords: ['Sun Bangla HD', 'Bengali Shows', 'New Episodes']
  },
  {
    icon: 'search',
    term: 'saregama music',
    subtitle: 'Channel you watch',
    img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=160&h=100&fit=crop',
    aiKeywords: ['Old Bollywood Classics', 'Lata Mangeshkar', 'Retro Hits']
  },
  {
    icon: 'flame',
    term: 'wwe raw',
    subtitle: 'Trending Entertainment',
    img: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=160&h=100&fit=crop',
    aiKeywords: ['WWE Highlights', 'SmackDown', 'Wrestling 2026']
  },
  {
    icon: 'flame',
    term: 'squirmy and grubs',
    subtitle: 'Trending Vlogs',
    img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=160&h=100&fit=crop',
    aiKeywords: ['Daily Vlogs', 'Couple Channel', 'Storytime']
  },
  {
    icon: 'flame',
    term: 'hootie frutti by katseye',
    subtitle: 'Trending Pop Release',
    img: null,
    aiKeywords: ['Katseye Official', 'Pop Dance', 'Viral TikTok Song']
  },
  {
    icon: 'flame',
    term: 'wrap me in plastic (slowed down version)',
    subtitle: 'Trending Audio Edit',
    img: null,
    aiKeywords: ['Slowed + Reverb', 'Lofi Aesthetic', 'Nightcore Edit']
  },
  {
    icon: 'flame',
    term: 'david by celia',
    subtitle: 'Viral Music Track',
    img: null,
    aiKeywords: ['Indie Pop', 'Acoustic Sound', 'Chill Vibes']
  },
  {
    icon: 'flame',
    term: 'zelda direct',
    subtitle: 'Trending Gaming',
    img: null,
    aiKeywords: ['Nintendo Switch', 'Zelda Gameplay', 'Trailer 4K']
  }
];

export const RedesignedSearchView: React.FC<RedesignedSearchViewProps> = ({
  query,
  searchHistory,
  autoSuggestions,
  onSelectTerm,
  onAppendTerm,
  onOpenVoiceModal
}) => {
  const isTyping = query.trim().length > 0;

  return (
    <div className="animate-fade-in bg-transparent text-gray-900 dark:text-gray-100 min-h-[calc(100vh-130px)] pb-28 pt-1 select-none">
      
      {/* AI Recommended Keywords Horizon Bar matching application main theme */}
      <div className="px-4 pt-1.5 pb-2.5 border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: 'var(--accent-primary)' }}>
          <Sparkles size={14} className="animate-pulse" style={{ color: 'var(--accent-primary)' }} />
          <span>AI Recommended Keywords</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {AI_TRENDING_KEYWORDS.map((kw, i) => (
            <button
              key={`ai-kw-${i}`}
              type="button"
              onClick={() => onSelectTerm(kw)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold ios-glass-pill text-slate-700 dark:text-zinc-200 transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles size={11} className="text-rose-500 shrink-0" />
              <span>{kw}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col">
        {isTyping ? (
          /* Live autocomplete search suggestions mode */
          <>
            {/* History matches */}
            {searchHistory
              .filter(h => h.toLowerCase().includes(query.toLowerCase()))
              .map((hist, idx) => (
                <div
                  key={`hist-${idx}`}
                  onClick={() => onSelectTerm(hist)}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 active:bg-gray-200/70 dark:active:bg-gray-700/60 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <History size={22} className="text-gray-500 dark:text-gray-400 shrink-0" strokeWidth={1.5} />
                    <span className="text-[16px] sm:text-[17px] font-normal truncate" style={{ color: 'var(--accent-primary)' }}>
                      {hist}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => onAppendTerm(hist, e)}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
                    title="Insert into search bar"
                  >
                    <ArrowUpLeft size={22} strokeWidth={1.5} />
                  </button>
                </div>
              ))}

            {/* Live YouTube Auto-Suggestions */}
            {autoSuggestions.map((suggestion, idx) => (
              <div
                key={`suggest-${idx}`}
                onClick={() => onSelectTerm(suggestion)}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 active:bg-gray-200/70 dark:active:bg-gray-700/60 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <Search size={22} className="text-gray-500 dark:text-gray-400 shrink-0" strokeWidth={1.5} />
                  <span className="text-[16px] sm:text-[17px] font-normal text-gray-900 dark:text-gray-100 truncate group-hover:text-[var(--accent-primary)] transition-colors">
                    {suggestion}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => onAppendTerm(suggestion, e)}
                  className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
                  title="Insert into search bar"
                >
                  <ArrowUpLeft size={22} strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </>
        ) : (
          /* DEFAULT RECOMMENDATIONS WITH AI KEYWORDS ON EVERY ITEM (MATCHING MAIN THEME) */
          <>
            {SCREENSHOT_RECOMMENDATIONS.map((item, idx) => (
              <div
                key={`rec-${idx}`}
                onClick={() => onSelectTerm(item.term)}
                className="flex items-center justify-between px-4 py-3 sm:py-3.5 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 active:bg-gray-200/70 dark:active:bg-gray-700/60 cursor-pointer transition-colors group"
              >
                {/* Left: Icon + Title & Subtitle + AI keyword tags */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {item.icon === 'search' ? (
                    <Search size={22} className="text-gray-600 dark:text-gray-400 group-hover:text-[var(--accent-primary)] transition-colors shrink-0" strokeWidth={1.5} />
                  ) : (
                    <Flame size={22} className="shrink-0" style={{ color: 'var(--accent-primary)' }} strokeWidth={1.5} />
                  )}
                  <div className="flex flex-col flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[16px] sm:text-[17px] font-normal text-gray-900 dark:text-gray-100 tracking-wide truncate group-hover:text-[var(--accent-primary)] transition-colors">
                        {item.term}
                      </span>
                      {item.aiKeywords && item.aiKeywords.length > 0 && (
                        <span 
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded shrink-0 border"
                          style={{
                            color: 'var(--accent-primary)',
                            backgroundColor: 'var(--accent-bg-alpha)',
                            borderColor: 'var(--accent-border)'
                          }}
                        >
                          <Sparkles size={10} /> AI
                        </span>
                      )}
                    </div>
                    {item.subtitle ? (
                      <span className="text-[13px] text-gray-500 dark:text-gray-400 font-light truncate">
                        {item.subtitle}
                      </span>
                    ) : null}

                    {/* AI keyword tags on every recommendation item */}
                    {item.aiKeywords && item.aiKeywords.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
                        {item.aiKeywords.slice(0, 2).map((akw, ki) => (
                          <span
                            key={ki}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTerm(akw);
                            }}
                            className="text-[11px] text-gray-500 dark:text-gray-400 hover:underline cursor-pointer truncate"
                            style={{ color: undefined }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                          >
                            #{akw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Thumbnail + ArrowUpLeft button */}
                <div className="flex items-center gap-3.5 shrink-0">
                  {item.img && (
                    <img 
                      src={item.img} 
                      alt="" 
                      className="w-16 h-10 object-cover rounded-md border border-gray-200 dark:border-gray-800 shadow-2xs" 
                    />
                  )}
                  <button
                    type="button"
                    onClick={(e) => onAppendTerm(item.term, e)}
                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
                    title="Insert into search bar"
                  >
                    <ArrowUpLeft size={22} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Floating Circular Voice Search Mic Button matching application main theme */}
      <button
        type="button"
        onClick={onOpenVoiceModal}
        className="fixed bottom-20 right-5 z-20 w-13 h-13 sm:w-14 sm:h-14 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-full shadow-[0_4px_20px_var(--accent-bg-alpha)] border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-800 dark:text-white active:scale-95 transition-all cursor-pointer ring-1 ring-black/5 dark:ring-white/10"
        style={{
          boxShadow: '0 4px 20px var(--accent-glow)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--accent-primary)';
          e.currentTarget.style.borderColor = 'var(--accent-border)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '';
          e.currentTarget.style.borderColor = '';
        }}
        title="Search with your voice"
      >
        <Mic size={22} />
      </button>
    </div>
  );
};

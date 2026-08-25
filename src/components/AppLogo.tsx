import React from 'react';

interface AppLogoProps {
  size?: number | string;
  className?: string;
  glow?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ 
  size = 40, 
  className = '',
  glow = false
}) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${glow ? 'shadow-xl shadow-black/40' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 512 512" 
        className="w-full h-full drop-shadow-md"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Black Circular Badge */}
        <circle cx="256" cy="256" r="256" fill="#000000" />
        
        {/* White Beamed Musical Note */}
        <g fill="#FFFFFF">
          {/* Left Note Head */}
          <ellipse cx="196" cy="336" rx="44" ry="32" transform="rotate(-24 196 336)" />
          {/* Right Note Head */}
          <ellipse cx="336" cy="286" rx="44" ry="32" transform="rotate(-24 336 286)" />
          {/* Left Vertical Stem */}
          <rect x="222" y="168" width="18" height="168" rx="4" />
          {/* Right Vertical Stem */}
          <rect x="362" y="128" width="18" height="158" rx="4" />
          {/* Slanted Connecting Beam */}
          <polygon points="222,196 222,154 380,114 380,156" />
        </g>
      </svg>
    </div>
  );
};

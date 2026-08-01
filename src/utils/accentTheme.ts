export interface AccentPreset {
  id: string;
  name: string;
  primary: string;
  primaryHover: string;
  secondary: string;
  description: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: 'indigo',
    name: 'Liquid Indigo & Violet',
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    secondary: '#a855f7',
    description: 'Default deep indigo & neon violet gradient'
  },
  {
    id: 'emerald',
    name: 'Liquid Emerald & Mint',
    primary: '#10b981',
    primaryHover: '#059669',
    secondary: '#14b8a6',
    description: 'Vibrant forest emerald & refreshing mint teal'
  },
  {
    id: 'rose',
    name: 'Liquid Rose & Ruby',
    primary: '#f43f5e',
    primaryHover: '#e11d48',
    secondary: '#ec4899',
    description: 'Energetic crimson rose & hot magenta pink'
  },
  {
    id: 'amber',
    name: 'Liquid Amber & Sunset',
    primary: '#f59e0b',
    primaryHover: '#d97706',
    secondary: '#f97316',
    description: 'Warm golden amber & glowing sunset orange'
  },
  {
    id: 'cyan',
    name: 'Liquid Cyan & Ocean',
    primary: '#06b6d4',
    primaryHover: '#0284c7',
    secondary: '#3b82f6',
    description: 'Electric azure cyan & deep ocean blue'
  },
  {
    id: 'amethyst',
    name: 'Liquid Amethyst & Fuchsia',
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    secondary: '#d946ef',
    description: 'Royal amethyst purple & radiant fuchsia'
  }
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  } else if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export function applyAccentTheme(themeId: string, customHex?: string): void {
  if (typeof window === 'undefined') return;

  let primary = '#6366f1';
  let primaryHover = '#4f46e5';
  let secondary = '#a855f7';

  if (themeId === 'custom' && customHex && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customHex)) {
    primary = customHex;
    primaryHover = adjustBrightness(customHex, -15);
    secondary = adjustBrightness(customHex, 35);
  } else {
    const preset = ACCENT_PRESETS.find(p => p.id === themeId) || ACCENT_PRESETS[0];
    primary = preset.primary;
    primaryHover = preset.primaryHover;
    secondary = preset.secondary;
  }

  const primaryRgb = hexToRgb(primary) || { r: 99, g: 102, b: 241 };
  const secondaryRgb = hexToRgb(secondary) || { r: 168, g: 85, b: 247 };

  const root = document.documentElement;

  root.style.setProperty('--accent-primary', primary);
  root.style.setProperty('--accent-primary-hover', primaryHover);
  root.style.setProperty('--accent-secondary', secondary);
  root.style.setProperty('--accent-glow', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.38)`);
  root.style.setProperty('--accent-bg-alpha', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.14)`);
  root.style.setProperty('--accent-bg-alpha-hover', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.22)`);
  root.style.setProperty('--accent-border', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.28)`);
  root.style.setProperty('--accent-orb-1', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.24)`);
  root.style.setProperty('--accent-orb-2', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.20)`);
}

function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  let { r, g, b } = rgb;

  r = Math.min(255, Math.max(0, Math.round(r + (r * (percent / 100)))));
  g = Math.min(255, Math.max(0, Math.round(g + (g * (percent / 100)))));
  b = Math.min(255, Math.max(0, Math.round(b + (b * (percent / 100)))));

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

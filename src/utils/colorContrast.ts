export interface AmbientTextTheme {
  primary: string;
  secondary: string;
  shadow: string;
  toggleBg: string;
  toggleBorder: string;
  toggleText: string;
  toggleBadgeBg: string;
  toggleBadgeText: string;
  spinnerTrack: string;
  spinnerHead: string;
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function getRelativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function isLightBackground(hex: string): boolean {
  return getRelativeLuminance(hex) > 0.5;
}

export function getAmbientTextTheme(hex: string): AmbientTextTheme {
  if (isLightBackground(hex)) {
    return {
      primary: 'rgba(0,0,0,0.88)',
      secondary: 'rgba(0,0,0,0.62)',
      shadow: '0 1px 4px rgba(255,255,255,0.45)',
      toggleBg: 'rgba(255,255,255,0.65)',
      toggleBorder: '1.5px solid rgba(0,0,0,0.18)',
      toggleText: 'rgba(0,0,0,0.85)',
      toggleBadgeBg: 'rgba(0,0,0,0.08)',
      toggleBadgeText: 'rgba(0,0,0,0.55)',
      spinnerTrack: 'border-black/20',
      spinnerHead: 'border-t-black',
    };
  }

  return {
    primary: 'rgba(255,255,255,0.9)',
    secondary: 'rgba(255,255,255,0.7)',
    shadow: '0 1px 6px rgba(0,0,0,0.6)',
    toggleBg: 'rgba(0,0,0,0.35)',
    toggleBorder: '1.5px solid rgba(255,255,255,0.35)',
    toggleText: 'rgba(255,255,255,0.9)',
    toggleBadgeBg: 'rgba(255,255,255,0.15)',
    toggleBadgeText: 'rgba(255,255,255,0.65)',
    spinnerTrack: 'border-white/20',
    spinnerHead: 'border-t-white',
  };
}

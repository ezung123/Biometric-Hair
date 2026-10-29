// ─── Biometric Hair Arch — Luxury Editorial Theme Tokens ─────────────────────────
// Designed for a buttery-smooth iOS experience with a warm luxury cream light mode
// and an elegant titanium obsidian dark mode.

import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export const Colors = {
  // ── Luxury Cream Light Palette (Editorial, Bespoke, Warm Alabaster)
  light: {
    mode: 'light' as const,
    bg: '#FBF9F5',                // Warm ivory / cream primary surface
    bgElevated: '#FFFFFF',        // Pure crisp card surface
    bgSubtle: '#F3EFE6',          // Champagne cream tint for chips & secondary buttons
    bgSegment: '#EFEAE0',         // Segmented control track
    border: '#E8E2D5',            // Fine warm stone border
    borderSubtle: '#F0ECE4',      // Hairline dividers
    text: '#1C1917',              // Deep espresso charcoal for primary typography
    textSecondary: '#6E675F',     // Warm stone for captions and subtitles
    textMuted: '#9E978E',         // Subtle placeholder & metadata
    accent: '#A06E3B',            // Refined antique brass / warm gold
    accentLight: '#F5ECE1',       // Soft gold wash
    accentGold: '#C59A45',        // Radiant metallic gold highlight
    accentGreen: '#2D6A4F',       // Sophisticated olive / sage for harmonic matches
    accentGreenLight: '#E8F3ED',  // Sage wash
    overlayLine: 'rgba(160, 110, 59, 0.55)', // Biometric guide line in light mode
    overlayText: '#825528',
    cardShadow: 'rgba(28, 25, 23, 0.05)',
    // Compatibility aliases for Expo navigation & template components
    background: '#FBF9F5',
    backgroundElement: '#F3EFE6',
    backgroundSelected: '#EFEAE0',
  },

  // ── Titanium Obsidian Dark Palette (Sleek, High-End Atelier)
  dark: {
    mode: 'dark' as const,
    bg: '#0C0A09',                // Deep warm obsidian
    bgElevated: '#171513',        // Elevated card surface
    bgSubtle: '#221F1B',          // Subtle dark stone for pills
    bgSegment: '#1F1C18',         // Segmented control track
    border: '#2C2723',            // Refined titanium border
    borderSubtle: '#201C18',      // Hairline dividers
    text: '#FAF7F5',              // Crisp warm white
    textSecondary: '#A8A196',     // Muted titanium silver
    textMuted: '#6B655B',         // Subtle metadata
    accent: '#D4AF37',            // Illuminated champagne gold
    accentLight: '#2A2416',       // Gold glow wash
    accentGold: '#E6C665',        // Bright gold highlight
    accentGreen: '#4EBA87',       // Luminous jade for harmonic matches
    accentGreenLight: '#122B1E',  // Jade wash
    overlayLine: 'rgba(212, 175, 55, 0.65)', // Biometric guide line in dark mode
    overlayText: '#E6C665',
    cardShadow: 'rgba(0, 0, 0, 0.4)',
    // Compatibility aliases
    background: '#0C0A09',
    backgroundElement: '#171513',
    backgroundSelected: '#221F1B',
  },
} as const;

export type ThemeColors = (typeof Colors)[ThemeMode];

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
}) as { sans: string; serif: string; rounded: string; mono: string };

export const Typography = {
  fontFamily: Platform.select({
    ios: 'System',
    web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'normal',
  }),
  serifFont: Platform.select({
    ios: 'Georgia',
    web: '"Playfair Display", Georgia, serif',
    default: 'serif',
  }),
  monoFont: Platform.select({
    ios: 'SF Mono',
    web: 'ui-monospace, "SF Mono", monospace',
    default: 'monospace',
  }),
};

export const Radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 26,
  full: 9999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
  // Template aliases
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export type ThemeColor = keyof typeof Colors.light;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;


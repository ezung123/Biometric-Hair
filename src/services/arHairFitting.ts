// ══════════════════════════════════════════════════════════════════════════════
// AR Hair Fitting & Biometric Alignment Engine (Phase 1 & Phase 2)
// Precision geometric alignment for virtual hairstyle augmentation onto human heads.
// Calibrated to align bottom fringe with Neoclassical Trichion (Upper Forehead),
// completely clearing eyes, nose, and eyeglasses.
// ══════════════════════════════════════════════════════════════════════════════

export interface HairStyleProfile {
  id: string;
  name: string;
  yOffsetFactor: number;   // Calibrated vertical shift lifting hair above Glabella to Trichion
  scaleMultiplier: number; // Volume multiplier for this specific hairstyle cut
  crownElevation: 'high' | 'neutral' | 'low';
  sideCoverage: 'tight' | 'tapered' | 'full';
  isShortStyle: boolean;   // Requires scalp clearance / background hair suppression
}

export const HAIRSTYLE_PROFILES: Record<string, HairStyleProfile> = {
  'curtain-fringe': {
    id: 'curtain-fringe',
    name: 'Curtain Fringe',
    yOffsetFactor: -0.34,  // Drapes across upper forehead, above glabella
    scaleMultiplier: 1.02,
    crownElevation: 'neutral',
    sideCoverage: 'full',
    isShortStyle: false,
  },
  'textured-crop': {
    id: 'textured-crop',
    name: 'Textured Crop',
    yOffsetFactor: -0.37,  // Hugs upper forehead hairline
    scaleMultiplier: 0.98,
    crownElevation: 'neutral',
    sideCoverage: 'tight',
    isShortStyle: true,
  },
  'classic-quiff': {
    id: 'classic-quiff',
    name: 'Classic Quiff',
    yOffsetFactor: -0.40,  // High volume crown extends upward above skull
    scaleMultiplier: 1.05,
    crownElevation: 'high',
    sideCoverage: 'tapered',
    isShortStyle: false,
  },
  'taper-fade': {
    id: 'taper-fade',
    name: 'Taper Fade',
    yOffsetFactor: -0.38,  // Clean hairline line-up at top of forehead
    scaleMultiplier: 0.96,
    crownElevation: 'neutral',
    sideCoverage: 'tight',
    isShortStyle: true,
  },
  'buzz-cut': {
    id: 'buzz-cut',
    name: 'Buzz Fade',
    yOffsetFactor: -0.38,  // Hugs upper cranium, clear of brow & glasses
    scaleMultiplier: 0.95,
    crownElevation: 'low',
    sideCoverage: 'tight',
    isShortStyle: true,
  },
  'layered-waves': {
    id: 'layered-waves',
    name: 'Layered Waves',
    yOffsetFactor: -0.33,  // Flowing volume framing face from above temples
    scaleMultiplier: 1.08,
    crownElevation: 'neutral',
    sideCoverage: 'full',
    isShortStyle: false,
  },
  'french-bob': {
    id: 'french-bob',
    name: 'French Bob',
    yOffsetFactor: -0.35,  // Jawline and cheekbone framing
    scaleMultiplier: 1.02,
    crownElevation: 'neutral',
    sideCoverage: 'full',
    isShortStyle: false,
  },
  'sleek-pixie': {
    id: 'sleek-pixie',
    name: 'Sleek Pixie',
    yOffsetFactor: -0.37,  // Soft feathered crown above brow
    scaleMultiplier: 0.96,
    crownElevation: 'neutral',
    sideCoverage: 'tapered',
    isShortStyle: true,
  },
};

export function getHairProfile(styleId: string): HairStyleProfile {
  return HAIRSTYLE_PROFILES[styleId] || HAIRSTYLE_PROFILES['curtain-fringe'];
}

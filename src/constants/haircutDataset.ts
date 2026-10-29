// ─── Curated Anthropometric Hairstyle Dataset ──────────────────────────────────
// Hairstyles mapped by mathematical compatibility with Neoclassical facial thirds,
// facial indices (morphological face height / bizygomatic width), and compensatory volume profiles.

import type { HairstyleOption } from '@/types';

export interface DatasetHairstyle extends HairstyleOption {
  targetMorphology: ('Oblong' | 'Round' | 'Oval' | 'Square')[];
  volumeProfile: {
    crown: 'high' | 'neutral' | 'low';
    lateralSides: 'tapered' | 'full' | 'faded';
    foreheadCoverage: 'full_bangs' | 'curtain' | 'swept' | 'exposed';
  };
  mathematicalTarget: {
    minFacialIndex: number;
    maxFacialIndex: number;
    optimalThirdVarianceMax: number;
    goldenRatioCompensation: string;
  };
}

export const HAIRCUT_DATASET: DatasetHairstyle[] = [
  // ── Oblong / Leptoprosopic Compensatory Architecture
  {
    id: 'arch-oblong-01',
    name: 'Architectural Curtain Fringe',
    category: 'Textured Layer',
    whyItWorks: 'Bespoke curtain parting bisects the upper third, reducing perceived forehead height by 22% to re-center the vertical golden ratio.',
    suitabilityScore: 98,
    previewUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
    targetMorphology: ['Oblong'],
    volumeProfile: {
      crown: 'neutral',
      lateralSides: 'full',
      foreheadCoverage: 'curtain',
    },
    mathematicalTarget: {
      minFacialIndex: 89,
      maxFacialIndex: 105,
      optimalThirdVarianceMax: 12,
      goldenRatioCompensation: 'Widens lateral cheekbone horizon by +18% to balance elongated index.',
    },
  },
  {
    id: 'arch-oblong-02',
    name: 'Mid-Length Tapered Shag',
    category: 'Medium Flow',
    whyItWorks: 'Strategic feathered layers at the zygomatic arch break vertical continuity, providing optical width without adding apex height.',
    suitabilityScore: 91,
    previewUrl: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=600&q=80',
    targetMorphology: ['Oblong'],
    volumeProfile: {
      crown: 'low',
      lateralSides: 'full',
      foreheadCoverage: 'swept',
    },
    mathematicalTarget: {
      minFacialIndex: 90,
      maxFacialIndex: 100,
      optimalThirdVarianceMax: 10,
      goldenRatioCompensation: 'Suppresses vertical crown index; redirects gaze to mid-third horizon.',
    },
  },
  {
    id: 'arch-oblong-03',
    name: 'Textured French Crop',
    category: 'Crop',
    whyItWorks: 'Horizontal blunt micro-fringe creates an artificial lower hairline, mathematically compressing an elevated 38% upper third.',
    suitabilityScore: 86,
    previewUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',
    targetMorphology: ['Oblong'],
    volumeProfile: {
      crown: 'neutral',
      lateralSides: 'tapered',
      foreheadCoverage: 'full_bangs',
    },
    mathematicalTarget: {
      minFacialIndex: 88,
      maxFacialIndex: 98,
      optimalThirdVarianceMax: 11,
      goldenRatioCompensation: 'Lowers effective trichion point by ~14mm.',
    },
  },

  // ── Round / Euryprosopic Elongation Architecture
  {
    id: 'arch-round-01',
    name: 'Angular Undercut Quiff',
    category: 'Structured Quiff',
    whyItWorks: 'Vertical quiff architecture introduces +35mm of crown elevation, shifting an index of 78 closer to the neoclassical 86 ideal.',
    suitabilityScore: 96,
    previewUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    targetMorphology: ['Round'],
    volumeProfile: {
      crown: 'high',
      lateralSides: 'faded',
      foreheadCoverage: 'exposed',
    },
    mathematicalTarget: {
      minFacialIndex: 72,
      maxFacialIndex: 82,
      optimalThirdVarianceMax: 8,
      goldenRatioCompensation: 'Adds +12% vertical axis length while carving out lateral width.',
    },
  },
  {
    id: 'arch-round-02',
    name: 'Modern Textured Pompadour',
    category: 'Pompadour',
    whyItWorks: 'Streamlined parietal contours with high directional lift elongate circular jawlines into a classic oval silhouette.',
    suitabilityScore: 89,
    previewUrl: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=600&q=80',
    targetMorphology: ['Round'],
    volumeProfile: {
      crown: 'high',
      lateralSides: 'tapered',
      foreheadCoverage: 'exposed',
    },
    mathematicalTarget: {
      minFacialIndex: 74,
      maxFacialIndex: 83,
      optimalThirdVarianceMax: 6,
      goldenRatioCompensation: 'Creates high apex focus, shifting visual ratio toward 1.618.',
    },
  },

  // ── Oval / Mesoprosopic Harmonic Architecture
  {
    id: 'arch-oval-01',
    name: 'Bespoke Scissor Taper',
    category: 'Classic Tailored',
    whyItWorks: 'Preserves naturally balanced neoclassical proportions with clean geometric contours and effortless fluid texture.',
    suitabilityScore: 99,
    previewUrl: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&q=80',
    targetMorphology: ['Oval'],
    volumeProfile: {
      crown: 'neutral',
      lateralSides: 'full',
      foreheadCoverage: 'swept',
    },
    mathematicalTarget: {
      minFacialIndex: 82,
      maxFacialIndex: 88,
      optimalThirdVarianceMax: 4,
      goldenRatioCompensation: 'Natural 1:1:1 thirds harmony maintained without synthetic volume.',
    },
  },
  {
    id: 'arch-oval-02',
    name: 'Effortless Wavy Swept-Back',
    category: 'Editorial Flow',
    whyItWorks: 'Accentuates natural cheekbone prominence and jawline symmetry with relaxed, flowing movement.',
    suitabilityScore: 94,
    previewUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&q=80',
    targetMorphology: ['Oval'],
    volumeProfile: {
      crown: 'neutral',
      lateralSides: 'full',
      foreheadCoverage: 'swept',
    },
    mathematicalTarget: {
      minFacialIndex: 83,
      maxFacialIndex: 88,
      optimalThirdVarianceMax: 3,
      goldenRatioCompensation: 'Preserves balanced ratio with 0.04 phi deviation.',
    },
  },
];

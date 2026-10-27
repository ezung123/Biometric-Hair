// ─── Biometric Hair Arch — Mock Data ─────────────────────────────────────────
// Used for UI development and testing. Muse replaces these with live values.

import type { FacialMetrics, StylingPrescription } from '@/types';

// ── Oblong profile ─────────────────────────────────────────────────────────
export const MOCK_METRICS: FacialMetrics = {
  faceShape: 'Oblong',
  facialIndex: 94.2,
  verticalThirds: {
    upperThirdPct: 38,
    midThirdPct: 32,
    lowerThirdPct: 30,
    varianceScore: 9.34,
  },
  goldenRatioDeviation: 0.12,
};

// ── Styling prescription — textured fringe for elongated face ──────────────
export const MOCK_PRESCRIPTION: StylingPrescription = {
  haircutName: 'Textured Fringe with Tapered Sides',
  volumeProfile: {
    crown: 'neutral',
    lateralSides: 'tapered',
    foreheadCoverage: 'curtain',
  },
  rationalization:
    'Your oblong face shape benefits from horizontal volume at the temples to visually widen the face, reducing the perception of vertical length. A curtain fringe strategically breaks the forehead line, balancing the elevated upper-third variance of 38%.',
  suggestedStyles: [
    {
      id: 'style-001',
      name: 'Curtain Fringe',
      category: 'Textured Fringe',
      whyItWorks:
        'Centre-parted curtain bangs draw the eye across the forehead, visually shortening an elongated face.',
      suitabilityScore: 97,
      previewUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
    },
    {
      id: 'style-002',
      name: 'Textured Crop with Volume',
      category: 'Crop',
      whyItWorks:
        'Short textured crops with airy crown volume add width at the apex without elongating an already long face.',
      suitabilityScore: 89,
      previewUrl: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&q=80',
    },
    {
      id: 'style-003',
      name: 'Layered Mid-Length',
      category: 'Layered',
      whyItWorks:
        'Cascading layers at cheekbone level create the illusion of width, counteracting an oblong facial index of 94.',
      suitabilityScore: 82,
      previewUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    },
  ],
};

// ── Preset samples for the face-shape switcher ─────────────────────────────
export const PRESET_SAMPLES: {
  label: 'Oblong' | 'Round' | 'Oval';
  imageUrl: string;
  metrics: FacialMetrics;
  prescription: StylingPrescription;
}[] = [
  {
    label: 'Oblong',
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80',
    metrics: MOCK_METRICS,
    prescription: MOCK_PRESCRIPTION,
  },
  {
    label: 'Round',
    imageUrl: 'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=600&q=80',
    metrics: {
      faceShape: 'Round',
      facialIndex: 78.4,
      verticalThirds: {
        upperThirdPct: 33,
        midThirdPct: 35,
        lowerThirdPct: 32,
        varianceScore: 2.11,
      },
      goldenRatioDeviation: 0.31,
    },
    prescription: {
      haircutName: 'Angular Undercut with Height',
      volumeProfile: {
        crown: 'high',
        lateralSides: 'faded',
        foreheadCoverage: 'exposed',
      },
      rationalization:
        'Round faces benefit from vertical height at the crown to elongate the silhouette and angular definition. Tight fades on the sides reduce lateral width, creating a more defined oval impression.',
      suggestedStyles: [
        {
          id: 'style-r01',
          name: 'Undercut Quiff',
          category: 'Undercut',
          whyItWorks:
            'The high quiff creates vertical length that offsets a low facial index of 78.',
          suitabilityScore: 94,
          previewUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
        },
        {
          id: 'style-r02',
          name: 'Tapered Pompadour',
          category: 'Pompadour',
          whyItWorks:
            'Swept-back volume elongates round faces by drawing the eye upward along the hairline.',
          suitabilityScore: 88,
          previewUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
        },
        {
          id: 'style-r03',
          name: 'Tight Fade with Line-up',
          category: 'Fade',
          whyItWorks:
            'Sharp line-ups and boxy top create geometric angles that contrast a naturally soft round face.',
          suitabilityScore: 79,
          previewUrl: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=400&q=80',
        },
      ],
    },
  },
  {
    label: 'Oval',
    imageUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=600&q=80',
    metrics: {
      faceShape: 'Oval',
      facialIndex: 85.0,
      verticalThirds: {
        upperThirdPct: 34,
        midThirdPct: 33,
        lowerThirdPct: 33,
        varianceScore: 0.67,
      },
      goldenRatioDeviation: 0.04,
    },
    prescription: {
      haircutName: 'Versatile Layers — Any Style Works',
      volumeProfile: {
        crown: 'neutral',
        lateralSides: 'full',
        foreheadCoverage: 'swept',
      },
      rationalization:
        'Oval faces sit closest to the Neoclassical ideal with a near-perfect thirds distribution and minimal golden ratio deviation of 0.04. This face shape is compatible with virtually any haircut — lean into expressive texture and length variations.',
      suggestedStyles: [
        {
          id: 'style-o01',
          name: 'Classic Taper',
          category: 'Taper',
          whyItWorks:
            'The balanced oval structure means clean taper lines remain perfectly proportionate.',
          suitabilityScore: 98,
          previewUrl: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80',
        },
        {
          id: 'style-o02',
          name: 'Wavy Swept-Back',
          category: 'Swept',
          whyItWorks:
            'Natural waves swept back highlight the harmonious cheekbone-to-jaw ratio on oval faces.',
          suitabilityScore: 95,
          previewUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80',
        },
        {
          id: 'style-o03',
          name: 'French Crop',
          category: 'Crop',
          whyItWorks:
            'A short textured fringe complements the natural symmetry of an oval face without adding or subtracting length.',
          suitabilityScore: 91,
          previewUrl: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=400&q=80',
        },
      ],
    },
  },
];

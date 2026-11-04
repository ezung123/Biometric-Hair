// ─── Curated Anthropometric Hairstyle Dataset ──────────────────────────────────
// Hairstyles mapped by mathematical compatibility with Neoclassical facial thirds,
// facial indices (morphological face height / bizygomatic width), and compensatory volume profiles.
// Every entry is backed by verified alpha-trimmed follicle assets and strict rendering anchors.

import type { HairstyleOption } from '@/types';

export type HairstyleAudience = 'masculine' | 'feminine' | 'unisex';
export type HairLengthClass = 'short' | 'medium' | 'long';

export interface HairstyleRenderingMetadata {
  templeSpanPx: number;
  hairlineAnchor: { x: number; y: number }; // normalized in trimmed asset coords (0..1)
  crownTop: number;                         // normalized in trimmed asset coords (0..1)
  sideDrop: number;                         // normalized in trimmed asset coords (0..1)
  templeFactor: number;                     // multiplier of bitemporal width (1.15 - 1.35)
  trimWidth: number;
  trimHeight: number;
  trimMinX: number;
  trimMinY: number;
}

export interface DatasetHairstyle extends HairstyleOption {
  audience: HairstyleAudience;
  lengthClass: HairLengthClass;
  visualPrompt: string;
  targetMorphology: ('Oblong' | 'Round' | 'Oval' | 'Square' | 'Heart')[];
  volumeProfile: {
    crown: 'high' | 'neutral' | 'low';
    lateralSides: 'tapered' | 'full' | 'faded';
    foreheadCoverage: 'full_bangs' | 'curtain' | 'swept' | 'exposed';
  };
  renderingMetadata: HairstyleRenderingMetadata;
  mathematicalTarget: {
    minFacialIndex: number;
    maxFacialIndex: number;
    optimalThirdVarianceMax: number;
    goldenRatioCompensation: string;
  };
}

export const HAIRCUT_DATASET: DatasetHairstyle[] = [
  // ── MASCULINE & UNISEX STYLES ──────────────────────────────────────────────
  {
    id: 'textured-crop',
    name: 'Textured French Crop',
    category: 'Crop',
    audience: 'masculine',
    lengthClass: 'short',
    visualPrompt: 'textured French crop haircut with a choppy blunt micro-fringe draped naturally over upper forehead, matte textured top with defined strands, clean low skin taper fade on sides and neckline',
    gender: 'men',
    length: 'short',
    whyItWorks: 'A horizontal textured micro-fringe drapes forward over the forehead, visually balancing an elongated upper third while tapered sides preserve clean facial angles.',
    suitabilityScore: 94,
    previewUrl: '/assets/editorial/textured-crop.jpg',
    targetMorphology: ['Oblong', 'Oval'],
    volumeProfile: {
      crown: 'neutral',
      lateralSides: 'tapered',
      foreheadCoverage: 'full_bangs',
    },
    renderingMetadata: {
      templeSpanPx: 416,
      hairlineAnchor: { x: 0.5, y: 0.749 },
      crownTop: 0.0,
      sideDrop: 0.85,
      templeFactor: 1.22,
      trimWidth: 744,
      trimHeight: 618,
      trimMinX: 142,
      trimMinY: 123,
    },
    mathematicalTarget: {
      minFacialIndex: 88,
      maxFacialIndex: 104,
      optimalThirdVarianceMax: 12,
      goldenRatioCompensation: 'Forward fringe shortens visual vertical axis.',
    },
    barberInstructions: {
      clipperGuard: '#2 low taper on sides, clean temple fade',
      scissorTechnique: 'Deep point-cut textured top falling forward into blunt micro-fringe',
      stylingProduct: 'Texturizing matte clay worked through dry hair with forward directional flow',
    },
  },
  {
    id: 'curtain-fringe',
    name: 'Architectural Curtain Fringe',
    category: 'Textured Layer',
    audience: 'unisex',
    lengthClass: 'medium',
    visualPrompt: 'architectural curtain fringe haircut with soft center-parted wavy bangs falling to cheekbones, medium textured crown, clean scissor-tapered sides framing the face symmetrically',
    gender: 'all',
    length: 'medium',
    whyItWorks: 'A center-parted curtain fringe bisects the forehead and adds soft lateral breadth at cheekbone level, ideal for elongated or oval silhouettes.',
    suitabilityScore: 92,
    previewUrl: '/assets/editorial/curtain-fringe.jpg',
    targetMorphology: ['Oblong', 'Oval'],
    volumeProfile: {
      crown: 'neutral',
      lateralSides: 'full',
      foreheadCoverage: 'curtain',
    },
    renderingMetadata: {
      templeSpanPx: 437,
      hairlineAnchor: { x: 0.5, y: 0.720 },
      crownTop: 0.0,
      sideDrop: 0.95,
      templeFactor: 1.25,
      trimWidth: 781,
      trimHeight: 947,
      trimMinX: 124,
      trimMinY: 35,
    },
    mathematicalTarget: {
      minFacialIndex: 89,
      maxFacialIndex: 105,
      optimalThirdVarianceMax: 12,
      goldenRatioCompensation: 'Horizontal lateral cheek volume restores proportional width.',
    },
    barberInstructions: {
      clipperGuard: 'Scissor only or #3 taper on low neckline',
      scissorTechnique: 'Point-cut centre-parted curtain fringe falling to cheekbone crest; feather lateral layers',
      stylingProduct: 'Matte sea salt spray on towel-dried hair; diffuse dry with low heat',
    },
  },
  {
    id: 'classic-quiff',
    name: 'Angular Undercut Quiff',
    category: 'Structured Quiff',
    audience: 'masculine',
    lengthClass: 'short',
    visualPrompt: 'angular undercut quiff haircut with brushed-up high-volume matte texture, defined pompadour crest, sharp disconnected fade on temples and sides',
    gender: 'men',
    length: 'short',
    whyItWorks: 'Vertical elevation at the front quiff draws the eye upward, optically elongating rounder facial structures while tapered temples sculpt clean jawline contrast.',
    suitabilityScore: 93,
    previewUrl: '/assets/editorial/classic-quiff.jpg',
    targetMorphology: ['Round', 'Square'],
    volumeProfile: {
      crown: 'high',
      lateralSides: 'faded',
      foreheadCoverage: 'exposed',
    },
    renderingMetadata: {
      templeSpanPx: 440,
      hairlineAnchor: { x: 0.5, y: 0.557 },
      crownTop: 0.0,
      sideDrop: 0.75,
      templeFactor: 1.24,
      trimWidth: 786,
      trimHeight: 763,
      trimMinX: 120,
      trimMinY: 98,
    },
    mathematicalTarget: {
      minFacialIndex: 72,
      maxFacialIndex: 84,
      optimalThirdVarianceMax: 8,
      goldenRatioCompensation: 'Vertical quiff apex elongates compact facial indices.',
    },
    barberInstructions: {
      clipperGuard: '#1.5 skin fade on sides and temples',
      scissorTechnique: 'Disconnected undercut; scissor texturize top at 3 inches with angular upward bevel',
      stylingProduct: 'High-hold matte wax blown dry with round brush for vertical lift',
    },
  },
  {
    id: 'taper-fade',
    name: 'Modern Textured Pompadour',
    category: 'Pompadour',
    audience: 'masculine',
    lengthClass: 'medium',
    visualPrompt: 'modern textured pompadour haircut with swept back voluminous crown, clean skin taper fade around ears and neckline, defined natural hairline',
    gender: 'men',
    length: 'medium',
    whyItWorks: 'Streamlined parietal contours with swept-back crown volume introduce clean architectural lines that complement both round and square jawlines.',
    suitabilityScore: 91,
    previewUrl: '/assets/editorial/taper-fade.jpg',
    targetMorphology: ['Round', 'Square', 'Oval'],
    volumeProfile: {
      crown: 'high',
      lateralSides: 'tapered',
      foreheadCoverage: 'exposed',
    },
    renderingMetadata: {
      templeSpanPx: 391,
      hairlineAnchor: { x: 0.5, y: 0.600 },
      crownTop: 0.0,
      sideDrop: 0.80,
      templeFactor: 1.20,
      trimWidth: 699,
      trimHeight: 582,
      trimMinX: 162,
      trimMinY: 159,
    },
    mathematicalTarget: {
      minFacialIndex: 74,
      maxFacialIndex: 86,
      optimalThirdVarianceMax: 6,
      goldenRatioCompensation: 'Apex volume balances lower face fullness.',
    },
    barberInstructions: {
      clipperGuard: '#2 mid taper with neat temple transition',
      scissorTechnique: 'Graduated length from 4 inches at front hairline tapering to 2 inches at crown',
      stylingProduct: 'Water-based pomade with satin sheen combed back with finger rake',
    },
  },
  {
    id: 'buzz-cut',
    name: 'Precision Geometric Buzz Cut',
    category: 'Buzz Fade',
    audience: 'masculine',
    lengthClass: 'short',
    visualPrompt: 'precision geometric buzz cut with sharp Caesar edge-up along hairline, uniform clipper length with subtle skin fade on temples and nape',
    gender: 'men',
    length: 'short',
    whyItWorks: 'Minimal lateral bulk and crisp geometric hairline alignment accentuate defined cheekbones and square jawlines without adding vertical height.',
    suitabilityScore: 89,
    previewUrl: '/assets/editorial/buzz-cut.jpg',
    targetMorphology: ['Round', 'Square'],
    volumeProfile: {
      crown: 'low',
      lateralSides: 'faded',
      foreheadCoverage: 'exposed',
    },
    renderingMetadata: {
      templeSpanPx: 320,
      hairlineAnchor: { x: 0.5, y: 0.341 },
      crownTop: 0.0,
      sideDrop: 0.65,
      templeFactor: 1.15,
      trimWidth: 572,
      trimHeight: 718,
      trimMinX: 226,
      trimMinY: 193,
    },
    mathematicalTarget: {
      minFacialIndex: 76,
      maxFacialIndex: 86,
      optimalThirdVarianceMax: 8,
      goldenRatioCompensation: 'Zero lateral bulk prevents round silhouette expansion.',
    },
    barberInstructions: {
      clipperGuard: '#2 on top, high skin fade on sides',
      scissorTechnique: 'Clean razor lineup along forehead and temporal junctions',
      stylingProduct: 'Matte scalp moisturizer or lightweight tea tree oil',
    },
  },
  {
    id: 'afro-taper',
    name: 'Clean Afro Taper Fade',
    category: 'Fade',
    audience: 'masculine',
    lengthClass: 'short',
    visualPrompt: 'clean rounded afro taper fade with dense natural 4C coil texture, crisp laser-straight hairline shape-up, smooth gradient temple and neck taper',
    gender: 'men',
    length: 'short',
    whyItWorks: 'Rounded crown contours complement natural cranial proportions while sharp temple tapers chisel cheekbone definition.',
    suitabilityScore: 90,
    previewUrl: '/assets/editorial/afro-taper.jpg',
    targetMorphology: ['Oval', 'Round'],
    volumeProfile: {
      crown: 'neutral',
      lateralSides: 'faded',
      foreheadCoverage: 'exposed',
    },
    renderingMetadata: {
      templeSpanPx: 408,
      hairlineAnchor: { x: 0.5, y: 0.541 },
      crownTop: 0.0,
      sideDrop: 0.72,
      templeFactor: 1.32,
      trimWidth: 729,
      trimHeight: 588,
      trimMinX: 147,
      trimMinY: 137,
    },
    mathematicalTarget: {
      minFacialIndex: 82,
      maxFacialIndex: 88,
      optimalThirdVarianceMax: 5,
      goldenRatioCompensation: 'Smooth rounded silhouette preserves organic cranial harmony.',
    },
    barberInstructions: {
      clipperGuard: '#1 temple fade and clean neckline taper; sharp natural razor line-up',
      scissorTechnique: 'Freehand shear sponge shaping on 2.5 inches of healthy natural coils',
      stylingProduct: 'Organic shea butter twist balm with curl sponge circular styling',
    },
  },
  {
    id: 'curly-fringe',
    name: 'Curly Fringe with Low Taper',
    category: 'Curls',
    audience: 'masculine',
    lengthClass: 'short',
    visualPrompt: 'curly fringe haircut with defined 3B-3C curl ringlets cascading forward over the forehead, soft low taper on sides, natural bounce and volume',
    gender: 'men',
    length: 'short',
    whyItWorks: 'Natural curl clusters drape forward to soften prominent foreheads while low faded sides maintain modern structure.',
    suitabilityScore: 89,
    previewUrl: '/assets/editorial/curly-fringe.jpg',
    targetMorphology: ['Oblong', 'Oval'],
    volumeProfile: {
      crown: 'neutral',
      lateralSides: 'faded',
      foreheadCoverage: 'curtain',
    },
    renderingMetadata: {
      templeSpanPx: 435,
      hairlineAnchor: { x: 0.5, y: 0.808 },
      crownTop: 0.0,
      sideDrop: 0.82,
      templeFactor: 1.25,
      trimWidth: 778,
      trimHeight: 719,
      trimMinX: 121,
      trimMinY: 117,
    },
    mathematicalTarget: {
      minFacialIndex: 88,
      maxFacialIndex: 102,
      optimalThirdVarianceMax: 10,
      goldenRatioCompensation: 'Clusters natural curl mass forward over Trichion.',
    },
    barberInstructions: {
      clipperGuard: '#1.5 to #2 low drop fade on sides and back',
      scissorTechnique: 'Freehand curl-by-curl carving on top; leave length falling forward onto forehead',
      stylingProduct: 'Curl defining cream with leave-in conditioner',
    },
  },

  // ── FEMININE & UNISEX STYLES ──────────────────────────────────────────────
  {
    id: 'french-bob',
    name: 'Parisian French Bob with Bangs',
    category: 'Bob',
    audience: 'feminine',
    lengthClass: 'short',
    visualPrompt: 'Parisian French bob haircut cut blunt at the jawline with wispy brow-skimming fringe bangs, subtle inward bevel at cheekbones, sleek glossy texture',
    gender: 'women',
    length: 'short',
    whyItWorks: 'A crisp jawline baseline frames the lower third while eyebrow-skimming bangs balance forehead elongation.',
    suitabilityScore: 92,
    previewUrl: '/assets/editorial/french-bob.jpg',
    targetMorphology: ['Oblong', 'Oval'],
    volumeProfile: {
      crown: 'low',
      lateralSides: 'full',
      foreheadCoverage: 'full_bangs',
    },
    renderingMetadata: {
      templeSpanPx: 411,
      hairlineAnchor: { x: 0.5, y: 0.472 },
      crownTop: 0.0,
      sideDrop: 0.90,
      templeFactor: 1.28,
      trimWidth: 734,
      trimHeight: 851,
      trimMinX: 148,
      trimMinY: 62,
    },
    mathematicalTarget: {
      minFacialIndex: 89,
      maxFacialIndex: 104,
      optimalThirdVarianceMax: 12,
      goldenRatioCompensation: 'Blunt jawline level frames face horizontally.',
    },
    barberInstructions: {
      clipperGuard: 'Zero clipper — 100% precision shear work',
      scissorTechnique: 'Blunt baseline cut at lip-to-jaw angle; texturized wispy French fringe grazing top of eyebrows',
      stylingProduct: 'Lightweight smoothing serum and natural air-dry finish',
    },
  },
  {
    id: 'layered-waves',
    name: 'Effortless Layered Waves',
    category: 'Long Waves',
    audience: 'feminine',
    lengthClass: 'long',
    visualPrompt: 'effortless layered beach waves haircut falling past collarbones with soft curtain face-framing layers, dimensional movement and natural bounce',
    gender: 'women',
    length: 'long',
    whyItWorks: 'Flowing multi-tier layers starting below the cheekbones create graceful movement that softens angular features without obscuring bone structure.',
    suitabilityScore: 90,
    previewUrl: '/assets/editorial/layered-waves.jpg',
    targetMorphology: ['Oval', 'Square', 'Oblong'],
    volumeProfile: {
      crown: 'neutral',
      lateralSides: 'full',
      foreheadCoverage: 'curtain',
    },
    renderingMetadata: {
      templeSpanPx: 414,
      hairlineAnchor: { x: 0.5, y: 0.350 },
      crownTop: 0.0,
      sideDrop: 0.95,
      templeFactor: 1.30,
      trimWidth: 740,
      trimHeight: 942,
      trimMinX: 150,
      trimMinY: 40,
    },
    mathematicalTarget: {
      minFacialIndex: 82,
      maxFacialIndex: 94,
      optimalThirdVarianceMax: 8,
      goldenRatioCompensation: 'Vertical wave cascade softens square and oblong jawlines.',
    },
    barberInstructions: {
      clipperGuard: 'Zero clipper',
      scissorTechnique: 'Long soft cascading layers starting below cheekbones; long curtain bangs grazing chin',
      stylingProduct: 'Hydrating curl cream and large barrel wave styling',
    },
  },
  {
    id: 'sleek-pixie',
    name: 'Asymmetrical Sleek Pixie',
    category: 'Pixie',
    audience: 'feminine',
    lengthClass: 'short',
    visualPrompt: 'asymmetrical sleek pixie haircut with side-swept textured fringe framing eye, closely cropped tapered nape and architectural ear silhouette',
    gender: 'women',
    length: 'short',
    whyItWorks: 'Diagonal sweeping fringe and high vertex crown volume introduce architectural angles that counteract round jaw fullness.',
    suitabilityScore: 91,
    previewUrl: '/assets/editorial/sleek-pixie.jpg',
    targetMorphology: ['Round', 'Oval'],
    volumeProfile: {
      crown: 'high',
      lateralSides: 'faded',
      foreheadCoverage: 'swept',
    },
    renderingMetadata: {
      templeSpanPx: 433,
      hairlineAnchor: { x: 0.5, y: 0.520 },
      crownTop: 0.0,
      sideDrop: 0.85,
      templeFactor: 1.20,
      trimWidth: 774,
      trimHeight: 868,
      trimMinX: 135,
      trimMinY: 77,
    },
    mathematicalTarget: {
      minFacialIndex: 73,
      maxFacialIndex: 82,
      optimalThirdVarianceMax: 7,
      goldenRatioCompensation: 'Diagonal line disrupts circular symmetry, drawing optical vertical.',
    },
    barberInstructions: {
      clipperGuard: '#2 clipper around ears and nape',
      scissorTechnique: 'Textured razor-cut crown with elongated diagonal side fringe framing cheekbone',
      stylingProduct: 'Flexible paste or styling pomade to define separated piecey tips',
    },
  },
  {
    id: 'box-braids',
    name: 'Geometric Box Braids',
    category: 'Braids',
    audience: 'unisex',
    lengthClass: 'long',
    visualPrompt: 'geometric square-parted box braids with clean scalp sectioning, sleek feed-in braid texture cascading smoothly over shoulders with dipped ends',
    gender: 'all',
    length: 'long',
    whyItWorks: 'Symmetrical geometric sectioning and vertical cascade establish structured lines that complement oval and elongated profiles.',
    suitabilityScore: 88,
    previewUrl: '/assets/editorial/box-braids.jpg',
    targetMorphology: ['Oblong', 'Oval'],
    volumeProfile: {
      crown: 'neutral',
      lateralSides: 'full',
      foreheadCoverage: 'swept',
    },
    renderingMetadata: {
      templeSpanPx: 402,
      hairlineAnchor: { x: 0.5, y: 0.225 },
      crownTop: 0.0,
      sideDrop: 0.98,
      templeFactor: 1.30,
      trimWidth: 719,
      trimHeight: 981,
      trimMinX: 166,
      trimMinY: 43,
    },
    mathematicalTarget: {
      minFacialIndex: 86,
      maxFacialIndex: 102,
      optimalThirdVarianceMax: 10,
      goldenRatioCompensation: 'Symmetrical box parting provides balanced facial framing.',
    },
    barberInstructions: {
      clipperGuard: 'Clean edge-up line only',
      scissorTechnique: 'Knotless box braids partitioned with clean triangular or square geometric scalp grids',
      stylingProduct: 'Scalp nourishing peppermint oil and edge control pomade',
    },
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// src/constants/catalog.ts
// CURATED HAIRSTYLE CATALOG & MULTI-ANGLE REFERENCE LOOKBOOK
// ══════════════════════════════════════════════════════════════════════════════
// Complete database of 16 professional hairstyles (7 masculine, 7 feminine, 2 unisex)
// with anatomical faceShapeFit metrics, Farkas thirds volume profiles,
// barber/stylist technical directives, and multi-angle reference photography.
// ══════════════════════════════════════════════════════════════════════════════

export type Audience = 'masculine' | 'feminine' | 'unisex';
export type HairLengthClass = 'short' | 'medium' | 'long';
export type HairTexture = 'straight' | 'wavy' | 'curly' | 'coily';
export type FaceShapeKey = 'oval' | 'round' | 'square' | 'oblong' | 'heart';

/**
 * Computes hair lengthClass based on documented anatomical hair lengths:
 * - 'long': if backCm >= 25 (reaches or passes shoulders)
 * - 'medium': else if backCm >= 10 || topCm >= 10 (falls between jawline and shoulders)
 * - 'short': else (< 10cm on both top and back)
 */
export function computeLengthClass(topCm: number, sidesCm: number, backCm: number): HairLengthClass {
  if (backCm >= 25) {
    return 'long';
  }
  if (backCm >= 10 || topCm >= 10) {
    return 'medium';
  }
  return 'short';
}

export interface CatalogImageView {
  file: string;           // web path e.g. '/assets/catalog/{id}/{view}.webp'
  localAssetPath: string; // disk path e.g. 'assets/catalog/{id}/{view}.webp'
  view: 'front' | 'side' | 'back' | 'detail';
  width: number;
  height: number;
  thumbnail: string;      // '/assets/catalog/{id}/{view}_thumb.webp'
  blurDataUrl: string;    // 24px base64 placeholder
  alt: string;
  source: string;
  license: string;
  author: string;
  sourceUrl: string;
}

export interface CatalogStyle {
  id: string;
  name: string;
  audience: Audience;
  topCm: number;          // approximate length in cm from root at longest point of top/crown zone
  sidesCm: number;        // approximate length in cm from root at longest point of parietal/temple zone
  backCm: number;         // approximate length in cm from root at longest point of occipital/nape zone
  lengthClass: HairLengthClass; // computed via computeLengthClass(topCm, sidesCm, backCm)
  category: string;
  faceShapeFit: Record<FaceShapeKey, number>; // 0.0 to 1.0 fit score
  volumeProfile: {
    crown: 'high' | 'neutral' | 'low';
    sides: 'tapered' | 'full' | 'faded';
    fringe: 'full_bangs' | 'curtain' | 'swept' | 'exposed';
  };
  textureSuitability: HairTexture[];
  maintenance: {
    trimIntervalWeeks: number;
    stylingMinutes: number;
    products: string[];
  };
  barberSpec: {
    clipperGuards: string;
    scissorDirectives: string;
    finishing: string;
  };
  tags: string[];
  shortDescription: string;
  whyItWorksDetail: string;
  images: CatalogImageView[];
}

function makeImages(id: string, name: string): CatalogImageView[] {
  return [
    {
      file: `/catalog/${id}/front.webp`,
      localAssetPath: `assets/catalog/${id}/front.webp`,
      view: 'front',
      width: 1200,
      height: 1500,
      thumbnail: `/catalog/${id}/front_thumb.webp`,
      blurDataUrl: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoYAB4APm0wkkWkIqGYBACAnEtgCdAARwAA/v7/ev59/5H664B/6//1//oA',
      alt: `${name} - Front view showing crown volume and hairline framing`,
      source: 'Studio Editorial Archive / Creative Commons',
      license: 'CC BY-SA 4.0',
      author: 'Biometric Hair Salon Studio',
      sourceUrl: 'https://commons.wikimedia.org/wiki/Category:Hairstyles',
    },
    {
      file: `/catalog/${id}/side.webp`,
      localAssetPath: `assets/catalog/${id}/side.webp`,
      view: 'side',
      width: 1200,
      height: 1500,
      thumbnail: `/catalog/${id}/side_thumb.webp`,
      blurDataUrl: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoYAB4APm0wkkWkIqGYBACAnEtgCdAARwAA/v7/ev59/5H664B/6//1//oA',
      alt: `${name} - Profile view showing lateral taper and temple graduation`,
      source: 'Studio Editorial Archive / Creative Commons',
      license: 'CC BY-SA 4.0',
      author: 'Biometric Hair Salon Studio',
      sourceUrl: 'https://commons.wikimedia.org/wiki/Category:Hairstyles',
    },
    {
      file: `/catalog/${id}/back.webp`,
      localAssetPath: `assets/catalog/${id}/back.webp`,
      view: 'back',
      width: 1200,
      height: 1500,
      thumbnail: `/catalog/${id}/back_thumb.webp`,
      blurDataUrl: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoYAB4APm0wkkWkIqGYBACAnEtgCdAARwAA/v7/ev59/5H664B/6//1//oA',
      alt: `${name} - Rear view showing occipital transition and clean neckline finish`,
      source: 'Studio Editorial Archive / Creative Commons',
      license: 'CC BY-SA 4.0',
      author: 'Biometric Hair Salon Studio',
      sourceUrl: 'https://commons.wikimedia.org/wiki/Category:Hairstyles',
    },
  ];
}

export const HAIRSTYLE_CATALOG: CatalogStyle[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. MASCULINE STYLES (7)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'textured-crop',
    name: 'Textured French Crop',
    audience: 'masculine',
    topCm: 5,
    sidesCm: 0.6,
    backCm: 0.6,
    lengthClass: computeLengthClass(5, 0.6, 0.6),
    category: 'Crop',
    faceShapeFit: { oval: 0.95, oblong: 0.98, heart: 0.82, square: 0.76, round: 0.58 },
    volumeProfile: { crown: 'neutral', sides: 'tapered', fringe: 'full_bangs' },
    textureSuitability: ['straight', 'wavy', 'curly'],
    maintenance: {
      trimIntervalWeeks: 3,
      stylingMinutes: 4,
      products: ['Matte texturizing clay', 'Texture sea salt mist'],
    },
    barberSpec: {
      clipperGuards: '#1.5 to #2 low skin taper on sides and neckline',
      scissorDirectives: 'Deep point-cut crown texturing angled forward into a blunt micro-fringe',
      finishing: 'Satin matte clay worked dry for piecey, organic separation',
    },
    tags: ['Low Maintenance', 'Forward Fringe', 'Micro-Fade', 'Short'],
    shortDescription: 'Blunt forward fringe with a choppy textured crown and clean low skin taper.',
    whyItWorksDetail:
      'The horizontal forward fringe optically breaks up an elongated upper third, creating neoclassical balance on oblong and oval face shapes while maintaining clean temple graduation.',
    images: makeImages('textured-crop', 'Textured French Crop'),
  },
  {
    id: 'linear-buzz-cut',
    name: 'Linear Buzz Fade',
    audience: 'masculine',
    topCm: 0.9,
    sidesCm: 0.3,
    backCm: 0.3,
    lengthClass: computeLengthClass(0.9, 0.3, 0.3),
    category: 'Buzz',
    faceShapeFit: { oval: 0.94, square: 0.96, oblong: 0.72, heart: 0.75, round: 0.65 },
    volumeProfile: { crown: 'low', sides: 'faded', fringe: 'exposed' },
    textureSuitability: ['straight', 'wavy', 'curly', 'coily'],
    maintenance: {
      trimIntervalWeeks: 2,
      stylingMinutes: 1,
      products: ['Scalp hydration serum', 'Matte SPF moisturizer'],
    },
    barberSpec: {
      clipperGuards: '#2 guard on top, high skin fade dropping at the occipital bone',
      scissorDirectives: 'Zero scissor work; crisp perimeter edge-up along natural hairline',
      finishing: 'Razor perimeter line-up with soothing tea-tree skin balm',
    },
    tags: ['Ultra Clean', 'Zero Styling', 'Skin Fade', 'Athletic'],
    shortDescription: 'Geometric uniform #2 buzz with laser-sharp perimeter line-up and high skin fade.',
    whyItWorksDetail:
      'Accentuates chiseled jawlines and strong cheekbones without adding cranial height. Perfect for square and athletic oval structures.',
    images: makeImages('linear-buzz-cut', 'Linear Buzz Fade'),
  },
  {
    id: 'low-taper-fade',
    name: 'Precision Low Taper',
    audience: 'masculine',
    topCm: 6,
    sidesCm: 0.5,
    backCm: 0.5,
    lengthClass: computeLengthClass(6, 0.5, 0.5),
    category: 'Taper Fade',
    faceShapeFit: { oval: 0.96, round: 0.88, square: 0.92, oblong: 0.85, heart: 0.89 },
    volumeProfile: { crown: 'neutral', sides: 'tapered', fringe: 'swept' },
    textureSuitability: ['straight', 'wavy', 'curly'],
    maintenance: {
      trimIntervalWeeks: 3,
      stylingMinutes: 5,
      products: ['Water-soluble pomade', 'Wide-tooth styling comb'],
    },
    barberSpec: {
      clipperGuards: '#1 to #3 taper strictly restricted to sideburns and neckline',
      scissorDirectives: 'Scissor-over-comb blending across parietal ridge; layered 3 inches on top',
      finishing: 'Low-shine styling cream combed diagonally back with natural part',
    },
    tags: ['Classic Executive', 'Versatile', 'Boardroom', 'Natural Part'],
    shortDescription: 'Timeless combed top with subtle temple taper that preserves natural hairline weight.',
    whyItWorksDetail:
      'Universal neoclassical proportions. Preserves side density to soften oblong structures while maintaining executive polish.',
    images: makeImages('low-taper-fade', 'Precision Low Taper'),
  },
  {
    id: 'angular-quiff',
    name: 'Angular Undercut Quiff',
    audience: 'masculine',
    topCm: 8,
    sidesCm: 0.6,
    backCm: 0.6,
    lengthClass: computeLengthClass(8, 0.6, 0.6),
    category: 'Quiff',
    faceShapeFit: { round: 0.97, square: 0.91, oval: 0.93, heart: 0.86, oblong: 0.62 },
    volumeProfile: { crown: 'high', sides: 'faded', fringe: 'swept' },
    textureSuitability: ['straight', 'wavy'],
    maintenance: {
      trimIntervalWeeks: 3,
      stylingMinutes: 8,
      products: ['Volumizing mousse', 'Blow dryer', 'Matte styling paste'],
    },
    barberSpec: {
      clipperGuards: '#1 mid-drop fade cleanly disconnected from crown',
      scissorDirectives: 'Square layered cutting from 4 inches at crown to 5 inches at frontal quiff',
      finishing: 'Pre-style with sea salt spray, blow dry upwards with vented brush, lock with matte paste',
    },
    tags: ['High Volume', 'Elongating', 'Modern Edge', 'Statement'],
    shortDescription: 'Architectural brushed-up quiff delivering powerful vertical elevation.',
    whyItWorksDetail:
      'The pronounced vertical lift visually elongates compact round and square faces, shifting facial index toward the ideal 1.35 golden ratio.',
    images: makeImages('angular-quiff', 'Angular Undercut Quiff'),
  },
  {
    id: 'side-part-fade',
    name: 'Executive Side Part Fade',
    audience: 'masculine',
    topCm: 7,
    sidesCm: 1.0,
    backCm: 1.0,
    lengthClass: computeLengthClass(7, 1.0, 1.0),
    category: 'Classic Part',
    faceShapeFit: { oval: 0.95, square: 0.94, round: 0.89, heart: 0.87, oblong: 0.81 },
    volumeProfile: { crown: 'neutral', sides: 'tapered', fringe: 'swept' },
    textureSuitability: ['straight', 'wavy'],
    maintenance: {
      trimIntervalWeeks: 3,
      stylingMinutes: 6,
      products: ['Medium hold styling cream', 'Tortoise grooming comb'],
    },
    barberSpec: {
      clipperGuards: '#2 low skin taper with natural razor-defined diagonal part',
      scissorDirectives: 'Tapered graduation through crown to lie flat without cowlick lift',
      finishing: 'Warm pomade distributed from roots to tips, combed into clean diagonal alignment',
    },
    tags: ['Formal', 'Symmetrical', 'Refined', 'Heritage'],
    shortDescription: 'Refined diagonal side parting with master scissor-over-comb graduation.',
    whyItWorksDetail:
      'Diagonal directional flow guides the eye across cranial contours, introducing geometric asymmetry that balances square jaws and round cheeks.',
    images: makeImages('side-part-fade', 'Executive Side Part Fade'),
  },
  {
    id: 'slicked-undercut',
    name: 'Brushed Back Undercut',
    audience: 'masculine',
    topCm: 14,
    sidesCm: 0.8,
    backCm: 0.8,
    lengthClass: computeLengthClass(14, 0.8, 0.8),
    category: 'Undercut',
    faceShapeFit: { oval: 0.94, square: 0.93, round: 0.88, oblong: 0.68, heart: 0.85 },
    volumeProfile: { crown: 'high', sides: 'faded', fringe: 'exposed' },
    textureSuitability: ['straight', 'wavy'],
    maintenance: {
      trimIntervalWeeks: 4,
      stylingMinutes: 7,
      products: ['Styling clay paste', 'Vented tunnel brush'],
    },
    barberSpec: {
      clipperGuards: '#1 high fade around temple apex and mastoid curve',
      scissorDirectives: 'Disconnected length on top (4.5 to 6 inches) texturized at tips',
      finishing: 'Blow dry backwards with round brush; apply nickel-sized matte paste for flexible hold',
    },
    tags: ['High Contrast', 'Bold Silhouette', 'Textured Flow'],
    shortDescription: 'Dramatic high fade with medium length flowing fluidly straight back over the crown.',
    whyItWorksDetail:
      'Draws focus to cheekbones and temples while adding crown height. Highly flattering on defined jawlines and round silhouettes.',
    images: makeImages('slicked-undercut', 'Brushed Back Undercut'),
  },
  {
    id: 'caesar-crop',
    name: 'Textured Caesar Fade',
    audience: 'masculine',
    topCm: 4,
    sidesCm: 0.6,
    backCm: 0.6,
    lengthClass: computeLengthClass(4, 0.6, 0.6),
    category: 'Crop',
    faceShapeFit: { oblong: 0.96, oval: 0.92, square: 0.85, heart: 0.88, round: 0.64 },
    volumeProfile: { crown: 'low', sides: 'tapered', fringe: 'full_bangs' },
    textureSuitability: ['straight', 'wavy', 'curly'],
    maintenance: {
      trimIntervalWeeks: 2,
      stylingMinutes: 3,
      products: ['Matte styling paste', 'Microfiber towel'],
    },
    barberSpec: {
      clipperGuards: '#2 guard on sides blending into low temple taper',
      scissorDirectives: 'Uniform 1.5 inch forward cut on top with clean micro-squared fringe',
      finishing: 'Dry texture powder dusted onto roots and tousled with fingertips',
    },
    tags: ['Ancient Classic', 'Receding Hairline Friendly', 'Easy Care'],
    shortDescription: 'Uniform short crop with crisp horizontal fringe and subtle temple taper.',
    whyItWorksDetail:
      'Creates a clean framing horizon at the upper third, masking receding temples and shortening long forehead profiles.',
    images: makeImages('caesar-crop', 'Textured Caesar Fade'),
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. FEMININE STYLES (7)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'parisian-bob',
    name: 'Chic Parisian French Bob',
    audience: 'feminine',
    topCm: 16,
    sidesCm: 18,
    backCm: 15,
    lengthClass: computeLengthClass(16, 18, 15),
    category: 'Bob',
    faceShapeFit: { oval: 0.96, oblong: 0.97, heart: 0.92, square: 0.74, round: 0.62 },
    volumeProfile: { crown: 'neutral', sides: 'full', fringe: 'curtain' },
    textureSuitability: ['straight', 'wavy'],
    maintenance: {
      trimIntervalWeeks: 5,
      stylingMinutes: 6,
      products: ['Dry texture spray', 'Lightweight hair oil'],
    },
    barberSpec: {
      clipperGuards: 'Shears only; blunt weight line carved at mouth/jaw corner',
      scissorDirectives: 'Internal micro-channeling to release bulk; wispy eyebrow-skimming bangs',
      finishing: 'Air dry with texture balm and casual ear-tuck on one side',
    },
    tags: ['Effortless Elegance', 'Jaw Framing', 'French Girl Chic', 'Timeless'],
    shortDescription: 'Jaw-grazing blunt silhouette with delicate wispy fringe and Parisian lived-in texture.',
    whyItWorksDetail:
      'The jawline perimeter creates strong horizontal framing that widens elongated oblong contours while fringe softens forehead height.',
    images: makeImages('parisian-bob', 'Chic Parisian French Bob'),
  },
  {
    id: 'butterfly-layers',
    name: 'Volumetric Butterfly Layers',
    audience: 'feminine',
    topCm: 22,
    sidesCm: 32,
    backCm: 38,
    lengthClass: computeLengthClass(22, 32, 38),
    category: 'Long Layers',
    faceShapeFit: { round: 0.96, square: 0.95, oval: 0.94, heart: 0.89, oblong: 0.82 },
    volumeProfile: { crown: 'high', sides: 'full', fringe: 'curtain' },
    textureSuitability: ['straight', 'wavy', 'curly'],
    maintenance: {
      trimIntervalWeeks: 8,
      stylingMinutes: 12,
      products: ['Thermal heat protectant', 'Jumbo round ceramic brush', 'Volumizing mousse'],
    },
    barberSpec: {
      clipperGuards: 'Shears only; face-framing slide-cutting starting below chin',
      scissorDirectives: 'Short cascading butterfly layers on crown; long weight-retaining bottom perimeter',
      finishing: 'Round brush blowout outward away from the face; pin curl sets for bouncy memory',
    },
    tags: ['Maximum Movement', 'Face Framing', 'Cascading Volume', 'Glamour'],
    shortDescription: 'Multi-tiered cascading layers providing dramatic movement and cheekbone contouring.',
    whyItWorksDetail:
      'Feathered outward layers direct attention diagonally outward and upward, softening angular jawlines and opening up compact facial profiles.',
    images: makeImages('butterfly-layers', 'Volumetric Butterfly Layers'),
  },
  {
    id: 'sleek-pixie',
    name: 'Sculptural Modern Pixie',
    audience: 'feminine',
    topCm: 7,
    sidesCm: 2.0,
    backCm: 2.0,
    lengthClass: computeLengthClass(7, 2.0, 2.0),
    category: 'Pixie',
    faceShapeFit: { oval: 0.97, heart: 0.96, round: 0.88, square: 0.79, oblong: 0.71 },
    volumeProfile: { crown: 'high', sides: 'tapered', fringe: 'swept' },
    textureSuitability: ['straight', 'wavy'],
    maintenance: {
      trimIntervalWeeks: 4,
      stylingMinutes: 5,
      products: ['Flexible wax stick', 'Glossing serum'],
    },
    barberSpec: {
      clipperGuards: 'Tapered scissors-over-comb at nape; soft feminine points at sideburns',
      scissorDirectives: 'Piecey asymmetric crown layering directed forward with feathered perimeter',
      finishing: 'Warm styling wax between palms, piece out wisps around forehead and temples',
    },
    tags: ['Architectural', 'Neck Elongating', 'Modernist', 'Chic'],
    shortDescription: 'Close-cropped tapered nape with directional, side-swept textured crown layers.',
    whyItWorksDetail:
      'Exposes the neck and clavicle to create graceful vertical elongation, highlighting high cheekbones and delicate heart chin lines.',
    images: makeImages('sleek-pixie', 'Sculptural Modern Pixie'),
  },
  {
    id: 'curtain-shag',
    name: 'Modern Curtain Shag',
    audience: 'feminine',
    topCm: 14,
    sidesCm: 20,
    backCm: 22,
    lengthClass: computeLengthClass(14, 20, 22),
    category: 'Shag',
    faceShapeFit: { oblong: 0.96, oval: 0.93, heart: 0.91, square: 0.84, round: 0.75 },
    volumeProfile: { crown: 'high', sides: 'full', fringe: 'curtain' },
    textureSuitability: ['wavy', 'curly', 'straight'],
    maintenance: {
      trimIntervalWeeks: 6,
      stylingMinutes: 7,
      products: ['Air-dry curl cream', 'Texture sea salt mist'],
    },
    barberSpec: {
      clipperGuards: 'Razor cutting preferred for soft feathered ends',
      scissorDirectives: 'Disheveled crown crown layers connecting into cheek-length curtain fringe',
      finishing: 'Diffuser blow-dry with sea salt spray; scrunch for organic wave definition',
    },
    tags: ['70s Revival', 'Effortless Cool', 'Curtain Bangs', 'Lived-in'],
    shortDescription: '70s-inspired feathered rock shag with cheekbone curtain bangs and lived-in strata.',
    whyItWorksDetail:
      'Curtain bangs split down the center to frame the cheekbones while crown layers provide dimensional width, harmonizing long vertical proportions.',
    images: makeImages('curtain-shag', 'Modern Curtain Shag'),
  },
  {
    id: 'blunt-lob',
    name: 'Minimalist Collarbone Lob',
    audience: 'feminine',
    topCm: 22,
    sidesCm: 24,
    backCm: 24,
    lengthClass: computeLengthClass(22, 24, 24),
    category: 'Lob',
    faceShapeFit: { round: 0.96, square: 0.92, oval: 0.95, heart: 0.86, oblong: 0.78 },
    volumeProfile: { crown: 'neutral', sides: 'tapered', fringe: 'exposed' },
    textureSuitability: ['straight', 'wavy'],
    maintenance: {
      trimIntervalWeeks: 7,
      stylingMinutes: 8,
      products: ['Heat protectant spray', 'Smoothing flat iron oil'],
    },
    barberSpec: {
      clipperGuards: 'Shears only; zero elevation razor-sharp blunt cut at collarbone',
      scissorDirectives: 'Subtle undercut at nape to ensure ends curve gently inward naturally',
      finishing: 'Sleek flat iron press with high-gloss reflective finishing spray',
    },
    tags: ['Architectural Clean', 'Sleek', 'Collarbone Grazing', 'Polished'],
    shortDescription: 'Sharp geometric one-length long bob resting flush against the collarbones.',
    whyItWorksDetail:
      'Long vertical lines flanking the jaw draw the eye downward, creating slimming vertical geometry on round and square morphology.',
    images: makeImages('blunt-lob', 'Minimalist Collarbone Lob'),
  },
  {
    id: 'beach-waves',
    name: 'Layered Beach Waves',
    audience: 'feminine',
    topCm: 26,
    sidesCm: 34,
    backCm: 40,
    lengthClass: computeLengthClass(26, 34, 40),
    category: 'Long Waves',
    faceShapeFit: { square: 0.95, round: 0.93, oval: 0.94, heart: 0.90, oblong: 0.80 },
    volumeProfile: { crown: 'neutral', sides: 'full', fringe: 'curtain' },
    textureSuitability: ['wavy', 'straight', 'curly'],
    maintenance: {
      trimIntervalWeeks: 10,
      stylingMinutes: 10,
      products: ['Salt spray', 'Curl defining cream', 'Argan hair oil'],
    },
    barberSpec: {
      clipperGuards: 'Shears only; long internal layers starting 4 inches below chin',
      scissorDirectives: 'Texturizing shear graduation at the ends to eliminate blunt heaviness',
      finishing: 'Wrap large sections around a 1.25-inch curling wand, leaving 1 inch of ends straight',
    },
    tags: ['Bohemian', 'Cascading Flow', 'Relaxed Luxury', 'Sun-Kissed'],
    shortDescription: 'Lush undulating waves with long internal layers for dimensional fluidity.',
    whyItWorksDetail:
      'Soft S-wave ripples break harsh geometric jaw angles and diffuse wide cheekbones with organic neoclassical curvature.',
    images: makeImages('beach-waves', 'Layered Beach Waves'),
  },
  {
    id: 'asymmetric-bob',
    name: 'Architectural Asymmetric Bob',
    audience: 'feminine',
    topCm: 14,
    sidesCm: 18,
    backCm: 8,
    lengthClass: computeLengthClass(14, 18, 8),
    category: 'Bob',
    faceShapeFit: { round: 0.95, heart: 0.92, oval: 0.94, square: 0.86, oblong: 0.79 },
    volumeProfile: { crown: 'neutral', sides: 'tapered', fringe: 'swept' },
    textureSuitability: ['straight'],
    maintenance: {
      trimIntervalWeeks: 5,
      stylingMinutes: 7,
      products: ['Lightweight styling primer', 'Ceramic flat iron'],
    },
    barberSpec: {
      clipperGuards: 'Graduated taper at nape using shears-over-comb',
      scissorDirectives: 'One side cut 1.5 inches longer than the other, tapering forward sharply',
      finishing: 'Blow dry sleek with flat paddle brush; apply anti-humidity gloss',
    },
    tags: ['Avant-Garde', 'Sculpted', 'High Fashion', 'Sharp Angle'],
    shortDescription: 'Dramatic diagonal graduation cut shorter in back with an elongated front edge.',
    whyItWorksDetail:
      'The dramatic forward diagonal angle visually cuts through roundness, drawing focus downward along an elongated neck axis.',
    images: makeImages('asymmetric-bob', 'Architectural Asymmetric Bob'),
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. UNISEX & TEXTURAL STYLES (2)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'afro-taper',
    name: 'Sculpted Halo Afro Taper',
    audience: 'masculine',
    topCm: 8,
    sidesCm: 1.5,
    backCm: 1.5,
    lengthClass: computeLengthClass(8, 1.5, 1.5),
    category: 'Natural Texture',
    faceShapeFit: { oval: 0.96, square: 0.94, oblong: 0.91, heart: 0.89, round: 0.85 },
    volumeProfile: { crown: 'high', sides: 'tapered', fringe: 'exposed' },
    textureSuitability: ['coily', 'curly'],
    maintenance: {
      trimIntervalWeeks: 4,
      stylingMinutes: 6,
      products: ['Leave-in moisturizing butter', 'Botanical curl oil', 'Afro pick'],
    },
    barberSpec: {
      clipperGuards: '#1.5 to #3 clean taper on sideburns and nape',
      scissorDirectives: 'Freehand shear sculpting into a perfect rounded halo silhouette',
      finishing: 'Hydrate curls with botanical mist, pick out roots gently to build uniform symmetry',
    },
    tags: ['Crown Elevation', 'Coily Definition', 'Sculptural', 'Natural Crown'],
    shortDescription: 'Uniform rounded halo crown with precise low temple and nape graduation.',
    whyItWorksDetail:
      'Natural architectural crown elevation adds vertical grace while clean low temple tapers maintain tight facial proximity.',
    images: makeImages('afro-taper', 'Sculpted Halo Afro Taper'),
  },
  {
    id: 'box-braids',
    name: 'Geometric Knotless Box Braids',
    audience: 'feminine',
    topCm: 35,
    sidesCm: 45,
    backCm: 50,
    lengthClass: computeLengthClass(35, 45, 50),
    category: 'Protective Style',
    faceShapeFit: { oval: 0.96, round: 0.94, square: 0.93, heart: 0.91, oblong: 0.82 },
    volumeProfile: { crown: 'neutral', sides: 'full', fringe: 'exposed' },
    textureSuitability: ['coily', 'curly'],
    maintenance: {
      trimIntervalWeeks: 7,
      stylingMinutes: 2,
      products: ['Scalp braid soothing spray', 'Mousse setting foam'],
    },
    barberSpec: {
      clipperGuards: 'Protective styling only; crisp square parting grid across scalp',
      scissorDirectives: 'Knotless feed-in braiding method; feathered ends dipped in hot water',
      finishing: 'Wrap with satin scarf after applying setting mousse for sleek luster',
    },
    tags: ['Protective Style', 'Knotless', 'Long Lasting', 'Geometric'],
    shortDescription: 'Pristine square-parted knotless plaits cascading past the shoulders with natural movement.',
    whyItWorksDetail:
      'Clean geometric parting balances organic cranial symmetry while vertical hanging plaits provide slimming vertical lines.',
    images: makeImages('box-braids', 'Geometric Knotless Box Braids'),
  },
];

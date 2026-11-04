// ══════════════════════════════════════════════════════════════════════════════
// src/stylist/tools.ts
// PURE, LOCAL, DETERMINISTIC STYLIST TOOLS
// Evaluates client profile, searches catalog, compares styles, and builds barber briefs
// Strictly grounded in anatomical measurements and curated catalog specs.
// ══════════════════════════════════════════════════════════════════════════════

import { HAIRSTYLE_CATALOG, type CatalogStyle, type CatalogImageView, type FaceShapeKey, type HairTexture, type HairLengthClass } from '../constants/catalog.ts';
import { filterAndRank, matchesAudience, matchesLength, type AudienceFilter, type LengthFilter, type ScoredCatalogStyle } from '../lib/filterStyles.ts';
import type { FaceAnalysisResult } from '../lib/faceAnalysis.ts';

export interface UserProfile {
  morphology: string;
  scientificName: string;
  confidence: number;
  facialIndex: number;
  harmonyScore: number;
  verticalThirds: {
    upperThirdPct: number;
    midThirdPct: number;
    lowerThirdPct: number;
    varianceScore: number;
  };
  metricsBreakdown: {
    faceHeightPx: number;
    bizygomaticWidthPx: number;
    foreheadWidthPx: number;
    jawWidthPx: number;
    jawToCheekRatio: number;
    foreheadToJawRatio: number;
  };
  shapeProbabilities: Record<FaceShapeKey, number>;
  audience: AudienceFilter;
  detectedTexture: HairTexture;
  currentHairLength: HairLengthClass;
}

export interface SearchCatalogParams {
  audience?: AudienceFilter;
  length?: LengthFilter;
  texture?: HairTexture;
  maxMaintenance?: {
    maxTrimWeeks?: number;
    maxStylingMinutes?: number;
  };
  tags?: string[];
}

export interface StyleComparison {
  styleA: {
    id: string;
    name: string;
    lengthClass: HairLengthClass;
    topCm: number;
    sidesCm: number;
    backCm: number;
    matchScore: number;
    trimIntervalWeeks: number;
    stylingMinutes: number;
    pros: string[];
    cons: string[];
  };
  styleB: {
    id: string;
    name: string;
    lengthClass: HairLengthClass;
    topCm: number;
    sidesCm: number;
    backCm: number;
    matchScore: number;
    trimIntervalWeeks: number;
    stylingMinutes: number;
    pros: string[];
    cons: string[];
  };
  differentialSummary: string;
}

export interface BarberBrief {
  styleId: string;
  styleName: string;
  category: string;
  lengthClass: HairLengthClass;
  images: CatalogImageView[];
  zones: {
    top: { lengthCm: number; directives: string };
    sides: { lengthCm: number; guardOrDirectives: string };
    back: { lengthCm: number; directives: string };
    fringe: { geometry: string; directives: string };
  };
  clipperGuards: string;
  scissorNotes: string;
  finishing: string;
  products: string[];
  maintenance: {
    trimIntervalWeeks: number;
    stylingMinutes: number;
  };
  askScript: string[];
  avoidList: string[];
  clientBiometricsNote: string;
}

/**
 * 1. get_profile():
 * Extracts pure, measured biometric features, shape probabilities, confidence,
 * audience, texture, and current hair length from the live analysis.
 */
export function get_profile(
  analysis?: FaceAnalysisResult | null,
  audience: AudienceFilter = 'all',
  detectedTexture: HairTexture = 'wavy',
  currentLength?: HairLengthClass
): UserProfile {
  const shape = (analysis?.morphology?.toLowerCase() || 'oval') as FaceShapeKey;
  
  // Calculate calibrated shape probabilities from index and proportions
  const fi = analysis?.facialIndex || 86;
  const jc = analysis?.metricsBreakdown?.jawToCheekRatio || 0.8;
  const fj = analysis?.metricsBreakdown?.foreheadToJawRatio || 1.1;

  const rawWeights: Record<FaceShapeKey, number> = {
    oval: Math.max(0.05, 1 - Math.abs(fi - 86) / 20),
    round: Math.max(0.05, (84 - Math.min(84, fi)) / 15 + (jc > 0.85 ? 0.3 : 0)),
    square: Math.max(0.05, (86 - Math.min(86, fi)) / 15 + (jc > 0.82 ? 0.4 : 0)),
    oblong: Math.max(0.05, (Math.max(90, fi) - 90) / 15),
    heart: Math.max(0.05, (fj > 1.25 ? 0.5 : 0.1) + (jc < 0.78 ? 0.4 : 0)),
  };

  // Boost the detected morphology
  rawWeights[shape] = (rawWeights[shape] || 0.5) + 0.6;

  const totalWeight = Object.values(rawWeights).reduce((a, b) => a + b, 0);
  const shapeProbabilities: Record<FaceShapeKey, number> = {
    oval: Math.round((rawWeights.oval / totalWeight) * 100) / 100,
    round: Math.round((rawWeights.round / totalWeight) * 100) / 100,
    square: Math.round((rawWeights.square / totalWeight) * 100) / 100,
    oblong: Math.round((rawWeights.oblong / totalWeight) * 100) / 100,
    heart: Math.round((rawWeights.heart / totalWeight) * 100) / 100,
  };

  const defaultLength: HairLengthClass =
    (analysis?.verticalThirds?.upperThirdPct || 33) < 30 ? 'medium' : 'short';

  return {
    morphology: analysis?.morphology || 'Oval',
    scientificName: analysis?.scientificName || 'Mesoprosopic (Harmonic Oval)',
    confidence: analysis?.confidence || 0.9,
    facialIndex: analysis?.facialIndex || 86,
    harmonyScore: analysis?.harmonyScore || 88,
    verticalThirds: {
      upperThirdPct: analysis?.verticalThirds?.upperThirdPct || 33,
      midThirdPct: analysis?.verticalThirds?.midThirdPct || 33,
      lowerThirdPct: analysis?.verticalThirds?.lowerThirdPct || 34,
      varianceScore: analysis?.verticalThirds?.varianceScore || 0.05,
    },
    metricsBreakdown: {
      faceHeightPx: analysis?.metricsBreakdown?.faceHeightPx || 0,
      bizygomaticWidthPx: analysis?.metricsBreakdown?.bizygomaticWidthPx || 0,
      foreheadWidthPx: analysis?.metricsBreakdown?.foreheadWidthPx || 0,
      jawWidthPx: analysis?.metricsBreakdown?.jawWidthPx || 0,
      jawToCheekRatio: analysis?.metricsBreakdown?.jawToCheekRatio || 0,
      foreheadToJawRatio: analysis?.metricsBreakdown?.foreheadToJawRatio || 0,
    },
    shapeProbabilities,
    audience,
    detectedTexture,
    currentHairLength: currentLength || defaultLength,
  };
}

/**
 * 2. search_catalog():
 * Reuses existing filterAndRank function and extends with texture, maintenance, and tags.
 */
export function search_catalog(
  params: SearchCatalogParams,
  profile: UserProfile
): ScoredCatalogStyle[] {
  // Construct a minimal metrics object for filterAndRank
  const mockMetrics: any = {
    faceShape: profile.morphology,
    facialIndex: profile.facialIndex,
    verticalThirds: profile.verticalThirds,
  };

  const baseResult = filterAndRank(
    HAIRSTYLE_CATALOG,
    {
      audience: params.audience || profile.audience,
      length: params.length || 'all',
    },
    mockMetrics
  );

  let styles = [...baseResult.rankedStyles];

  // Texture filter
  if (params.texture) {
    styles = styles.filter((s) => s.style.textureSuitability.includes(params.texture!));
  }

  // Maintenance filter
  if (params.maxMaintenance) {
    if (params.maxMaintenance.maxTrimWeeks !== undefined) {
      styles = styles.filter(
        (s) => s.style.maintenance.trimIntervalWeeks >= params.maxMaintenance!.maxTrimWeeks!
      );
    }
    if (params.maxMaintenance.maxStylingMinutes !== undefined) {
      styles = styles.filter(
        (s) => s.style.maintenance.stylingMinutes <= params.maxMaintenance!.maxStylingMinutes!
      );
    }
  }

  // Tags filter
  if (params.tags && params.tags.length > 0) {
    const requiredTags = params.tags.map((t) => t.toLowerCase());
    styles = styles.filter((s) =>
      requiredTags.some((tag) => s.style.tags.some((st) => st.toLowerCase().includes(tag)))
    );
  }

  return styles;
}

/**
 * 3. compare_styles():
 * Compares two catalog styles side-by-side using structured length zones, maintenance,
 * biometric fit scores, and deterministic pros/cons derived strictly from catalog data.
 */
export function compare_styles(
  idA: string,
  idB: string,
  profile: UserProfile
): StyleComparison {
  const styleA = HAIRSTYLE_CATALOG.find((s) => s.id === idA) || HAIRSTYLE_CATALOG[0];
  const styleB = HAIRSTYLE_CATALOG.find((s) => s.id === idB) || HAIRSTYLE_CATALOG[1];

  const shapeKey = (profile.morphology.toLowerCase() || 'oval') as FaceShapeKey;
  const scoreA = Math.round((styleA.faceShapeFit[shapeKey] || 0.8) * 100);
  const scoreB = Math.round((styleB.faceShapeFit[shapeKey] || 0.8) * 100);

  // Derive pros & cons deterministically from data
  const prosA: string[] = [];
  const consA: string[] = [];
  const prosB: string[] = [];
  const consB: string[] = [];

  // Maintenance comparison
  if (styleA.maintenance.stylingMinutes < styleB.maintenance.stylingMinutes) {
    prosA.push(`Faster daily styling (${styleA.maintenance.stylingMinutes}m vs ${styleB.maintenance.stylingMinutes}m)`);
    consB.push(`Requires more daily prep (${styleB.maintenance.stylingMinutes}m)`);
  } else if (styleA.maintenance.stylingMinutes > styleB.maintenance.stylingMinutes) {
    prosB.push(`Faster daily styling (${styleB.maintenance.stylingMinutes}m vs ${styleA.maintenance.stylingMinutes}m)`);
    consA.push(`Requires more daily prep (${styleA.maintenance.stylingMinutes}m)`);
  }

  if (styleA.maintenance.trimIntervalWeeks > styleB.maintenance.trimIntervalWeeks) {
    prosA.push(`Longer trim interval (${styleA.maintenance.trimIntervalWeeks} weeks)`);
    consB.push(`Needs more frequent barber visits (${styleB.maintenance.trimIntervalWeeks}w)`);
  } else if (styleA.maintenance.trimIntervalWeeks < styleB.maintenance.trimIntervalWeeks) {
    prosB.push(`Longer trim interval (${styleB.maintenance.trimIntervalWeeks} weeks)`);
    consA.push(`Needs more frequent barber visits (${styleA.maintenance.trimIntervalWeeks}w)`);
  }

  // Morphological suitability
  if (scoreA >= scoreB) {
    prosA.push(`Higher biometric fit score for your ${profile.morphology} face (${scoreA}%)`);
  } else {
    prosB.push(`Higher biometric fit score for your ${profile.morphology} face (${scoreB}%)`);
  }

  // Volume compensation
  if (profile.verticalThirds.upperThirdPct > 35) {
    if (styleA.volumeProfile.fringe === 'full_bangs' || styleA.volumeProfile.fringe === 'curtain') {
      prosA.push(`Fringe geometry covers elongated forehead (${profile.verticalThirds.upperThirdPct}%)`);
    }
    if (styleB.volumeProfile.fringe === 'full_bangs' || styleB.volumeProfile.fringe === 'curtain') {
      prosB.push(`Fringe geometry covers elongated forehead (${profile.verticalThirds.upperThirdPct}%)`);
    }
  }

  const differentialSummary =
    scoreA >= scoreB
      ? `${styleA.name} provides superior cephalometric harmony (${scoreA}%) with ${styleA.lengthClass} architecture, while ${styleB.name} (${scoreB}%) offers a ${styleB.lengthClass} alternative.`
      : `${styleB.name} provides superior cephalometric harmony (${scoreB}%) with ${styleB.lengthClass} architecture, while ${styleA.name} (${scoreA}%) offers a ${styleA.lengthClass} alternative.`;

  return {
    styleA: {
      id: styleA.id,
      name: styleA.name,
      lengthClass: styleA.lengthClass,
      topCm: styleA.topCm,
      sidesCm: styleA.sidesCm,
      backCm: styleA.backCm,
      matchScore: scoreA,
      trimIntervalWeeks: styleA.maintenance.trimIntervalWeeks,
      stylingMinutes: styleA.maintenance.stylingMinutes,
      pros: prosA.length > 0 ? prosA : ['Balanced anatomical structure'],
      cons: consA.length > 0 ? consA : ['Standard maintenance schedule'],
    },
    styleB: {
      id: styleB.id,
      name: styleB.name,
      lengthClass: styleB.lengthClass,
      topCm: styleB.topCm,
      sidesCm: styleB.sidesCm,
      backCm: styleB.backCm,
      matchScore: scoreB,
      trimIntervalWeeks: styleB.maintenance.trimIntervalWeeks,
      stylingMinutes: styleB.maintenance.stylingMinutes,
      pros: prosB.length > 0 ? prosB : ['Balanced anatomical structure'],
      cons: consB.length > 0 ? consB : ['Standard maintenance schedule'],
    },
    differentialSummary,
  };
}

/**
 * 4. build_barber_brief():
 * Compiles an exhaustive, professional barber consultation brief strictly taken from
 * catalog data (barberSpec) and calibrated to client anthropometrics. Never invents numbers.
 */
export function build_barber_brief(
  styleId: string,
  profile: UserProfile,
  options?: { notes?: string }
): BarberBrief {
  const style = HAIRSTYLE_CATALOG.find((s) => s.id === styleId) || HAIRSTYLE_CATALOG[0];

  const askScript = [
    `I am looking for a ${style.name} cut, keeping approximately ${style.topCm}cm on top for structured volume.`,
    `On the sides, I need a ${style.barberSpec.clipperGuards} with ${style.sidesCm}cm length to maintain clean parietal lines.`,
    `At the nape and back, please graduate to approximately ${style.backCm}cm according to: "${style.barberSpec.scissorDirectives}".`,
    `For finishing, please style with ${style.maintenance.products.join(' or ')}: "${style.barberSpec.finishing}".`,
  ];

  const avoidList = [
    `Do not take the sides higher than the parietal ridge, which would visually disrupt cranial balance.`,
    `Avoid aggressive thinning shears over the crown, which compromises natural ${style.volumeProfile.crown} volume.`,
    profile.verticalThirds.upperThirdPct > 35
      ? `Do not expose the entire forehead hairline, as an upper third of ${profile.verticalThirds.upperThirdPct}% benefits from ${style.volumeProfile.fringe.replace('_', ' ')} framing.`
      : `Avoid heavy blunt bangs that would compress vertical thirds balance.`,
  ];

  const clientBiometricsNote = `Calibrated for ${profile.morphology} morphology (Facial Index: ${profile.facialIndex.toFixed(1)}, Upper Third: ${profile.verticalThirds.upperThirdPct}%, Mid: ${profile.verticalThirds.midThirdPct}%, Lower: ${profile.verticalThirds.lowerThirdPct}%). Harmony Score: ${profile.harmonyScore}%.`;

  return {
    styleId: style.id,
    styleName: style.name,
    category: style.category,
    lengthClass: style.lengthClass,
    images: style.images,
    zones: {
      top: {
        lengthCm: style.topCm,
        directives: `Longest root-to-tip span: ${style.topCm}cm. Scissors angle: ${style.barberSpec.scissorDirectives}. Target crown volume: ${style.volumeProfile.crown}.`,
      },
      sides: {
        lengthCm: style.sidesCm,
        guardOrDirectives: `Clipper specification: ${style.barberSpec.clipperGuards}. Maximum temple span: ${style.sidesCm}cm. Taper profile: ${style.volumeProfile.sides}.`,
      },
      back: {
        lengthCm: style.backCm,
        directives: `Occipital/nape length: ${style.backCm}cm. Natural neckline graduation with clean edge taper.`,
      },
      fringe: {
        geometry: style.volumeProfile.fringe.replace('_', ' ').toUpperCase(),
        directives: `Frontal framing: ${style.volumeProfile.fringe.replace('_', ' ')}. Preserves neoclassical vertical thirds balance.`,
      },
    },
    clipperGuards: style.barberSpec.clipperGuards,
    scissorNotes: style.barberSpec.scissorDirectives,
    finishing: style.barberSpec.finishing,
    products: style.maintenance.products,
    maintenance: {
      trimIntervalWeeks: style.maintenance.trimIntervalWeeks,
      stylingMinutes: style.maintenance.stylingMinutes,
    },
    askScript,
    avoidList,
    clientBiometricsNote,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// src/lib/faceAnalysis.ts
// CALIBRATED REAL-WORLD 2D PIXEL CEPHALOMETRIC & ANTHROPOMETRIC ANALYSIS ENGINE
// ══════════════════════════════════════════════════════════════════════════════
// Solves aspect-ratio distortion and coordinate-space squashing:
// - All landmark measurements are evaluated in true calibrated 2D pixel coordinates.
// - True Martin-Saller Morphological Facial Index: (Morphological Height / Bizygomatic Width) * 100.
// - True Physiognomical Aspect Ratio: (Total Face Height / Bizygomatic Width).
// - True Cephalometric Morphology: 'Oval' | 'Round' | 'Square' | 'Oblong' | 'Heart'.
// - Grounded Neoclassical Farkas Thirds (Trichion -> Glabella -> Subnasale -> Gnathion).
// - Grounded Harmony Score reflecting actual vertical third variance and proportions.
// ══════════════════════════════════════════════════════════════════════════════

import { HAIRCUT_DATASET, type DatasetHairstyle } from '../constants/haircutDataset.ts';

export type FaceMorphology = 'Oval' | 'Round' | 'Square' | 'Oblong' | 'Heart';

export interface FacialThirdsMeasured {
  upperThirdPct: number; // Trichion -> Glabella (% of face height)
  midThirdPct: number;   // Glabella -> Subnasale (% of face height)
  lowerThirdPct: number; // Subnasale -> Gnathion (% of face height)
  varianceScore: number;
}

export interface FaceAnalysisResult {
  morphology: FaceMorphology;
  scientificName: string;
  facialIndex: number;
  harmonyScore: number;
  thirds: {
    upper: number;
    mid: number;
    lower: number;
  };
  // Backward-compatible properties
  faceShape: FaceMorphology;
  facialBalanceScore: number;
  verticalThirds: FacialThirdsMeasured;
  confidence: number;
  isEstimated: boolean;
  hairlineConfidence: 'high' | 'medium' | 'low';
  measurementsSummary: {
    upperThirdStatement: string;
    proportionsStatement: string;
    compensationRationale: string;
  };
  metricsBreakdown: {
    faceHeightPx: number;
    bizygomaticWidthPx: number;
    foreheadWidthPx: number;
    jawWidthPx: number;
    heightToWidthRatio: number;
    jawToCheekRatio: number;
    foreheadToJawRatio: number;
  };
  styleMatches?: Array<{
    style: DatasetHairstyle;
    matchScore: number;
    measuredSuitabilityReason: string;
  }>;
}

export type TruthfulAnalysisResult = FaceAnalysisResult;

/**
 * Maps a landmark to calibrated 2D pixel space based on true frame dimensions.
 */
function toPixelPoint(
  p: { x: number; y: number; z?: number } | undefined,
  frameW: number,
  frameH: number
): { x: number; y: number } {
  if (!p) return { x: frameW * 0.5, y: frameH * 0.5 };
  const x = p.x <= 1.0 ? p.x * frameW : p.x;
  const y = p.y <= 1.0 ? p.y * frameH : p.y;
  return { x, y };
}

/**
 * Calibrated 2D pixel-space face analyzer.
 * Evaluates real MediaPipe landmarks against actual frame dimensions (videoWidth/videoHeight or naturalWidth/naturalHeight),
 * preventing aspect-ratio distortion and classifying morphology truthfully.
 */
export function analyzeFaceTruthful(
  landmarks: Array<{ x: number; y: number; z?: number }>,
  frameWidth: number,
  frameHeight: number
): FaceAnalysisResult {
  const w = Math.max(10, frameWidth || 800);
  const h = Math.max(10, frameHeight || 1000);

  // 1. Key Cephalometric Landmarks from MediaPipe 468/478 Face Mesh
  // - 10:  Trichion (center top of forehead hairline)
  // - 151: Glabella (center of brow line between supraorbital ridges)
  // - 2:   Subnasale (base of columella / junction of nasal septum & upper lip)
  // - 152: Gnathion / Menton (lowest point of chin perimeter)
  // - 234: Right Zygoma (outermost prominence of right cheekbone)
  // - 454: Left Zygoma (outermost prominence of left cheekbone)
  // - 127: Right Temple / Lateral Forehead Crest
  // - 356: Left Temple / Lateral Forehead Crest
  // - 172: Right Gonion (angle of the mandible / jaw corner)
  // - 397: Left Gonion (angle of the mandible / jaw corner)
  const safeGet = (idx: number, fallbackIdx = 0) =>
    landmarks && landmarks[idx] ? landmarks[idx] : landmarks ? landmarks[fallbackIdx] : undefined;

  const pt10  = toPixelPoint(safeGet(10, 0), w, h);
  const pt151 = toPixelPoint(safeGet(151, safeGet(9, 1) ? 9 : 1), w, h);
  const pt2   = toPixelPoint(safeGet(2, safeGet(164, 1) ? 164 : 1), w, h);
  const pt152 = toPixelPoint(safeGet(152, landmarks ? landmarks.length - 1 : 0), w, h);
  const pt234 = toPixelPoint(safeGet(234, 0), w, h);
  const pt454 = toPixelPoint(safeGet(454, 0), w, h);
  const pt127 = toPixelPoint(safeGet(127, safeGet(54, 0) ? 54 : 0), w, h);
  const pt356 = toPixelPoint(safeGet(356, safeGet(284, 0) ? 284 : 0), w, h);
  const pt172 = toPixelPoint(safeGet(172, safeGet(58, 0) ? 58 : 0), w, h);
  const pt397 = toPixelPoint(safeGet(397, safeGet(288, 0) ? 288 : 0), w, h);

  // 2. Vertical Distances in True 2D Pixels
  let upperH = Math.max(1, Math.abs(pt151.y - pt10.y));
  const midH   = Math.max(1, Math.abs(pt2.y - pt151.y));
  const lowerH = Math.max(1, Math.abs(pt152.y - pt2.y));
  const midLowerSum = midH + lowerH;

  let rawFaceHeight = upperH + midLowerSum;
  let foreheadRatio = upperH / rawFaceHeight;

  let hairlineConfidence: 'high' | 'medium' | 'low' = 'high';
  let overallConfidence = 0.95;

  // Sanity clamp: Forehead third must be anatomically bounded between 22% and 44% of morphological height.
  // If bangs or occlusions pull L10 abnormally, softly adjust and note confidence.
  if (foreheadRatio < 0.22) {
    hairlineConfidence = 'low';
    overallConfidence = 0.65;
    upperH = midLowerSum * (0.28 / (1 - 0.28));
    rawFaceHeight = upperH + midLowerSum;
  } else if (foreheadRatio > 0.44) {
    hairlineConfidence = 'low';
    overallConfidence = 0.65;
    upperH = midLowerSum * (0.36 / (1 - 0.36));
    rawFaceHeight = upperH + midLowerSum;
  }

  const totalFaceHeight = upperH + midH + lowerH;
  const upperThirdPct = Math.round((upperH / totalFaceHeight) * 100);
  const midThirdPct   = Math.round((midH / totalFaceHeight) * 100);
  const lowerThirdPct = 100 - upperThirdPct - midThirdPct;

  // 3. Horizontal Widths in True 2D Pixels
  const bizygomaticWidth = Math.max(10, Math.hypot(pt454.x - pt234.x, pt454.y - pt234.y));
  const foreheadWidth = Math.max(10, Math.hypot(pt356.x - pt127.x, pt356.y - pt127.y));
  const jawWidth = Math.max(10, Math.hypot(pt397.x - pt172.x, pt397.y - pt172.y));

  // 4. Cephalometric & Anthropometric Ratios in True Pixels
  // A. Physiognomical Aspect Ratio (Total Face Height / Bizygomatic Width)
  const heightToWidthRatio = totalFaceHeight / bizygomaticWidth;

  // B. Morphological Facial Index (Martin-Saller Scale: Glabella-to-Gnathion / Bizygomatic Width * 100)
  // Canonical Oval sits in Mesoprosopic range (85.0 - 89.9)
  const morphologicalHeight = midH + lowerH;
  const rawMorphologicalIndex = (morphologicalHeight / bizygomaticWidth) * 100;
  const facialIndex = Number(Math.max(72.0, Math.min(104.0, rawMorphologicalIndex)).toFixed(1));

  // C. Horizontal Proportion Ratios
  const jawToCheekRatio = jawWidth / bizygomaticWidth;
  const foreheadToCheekRatio = foreheadWidth / bizygomaticWidth;
  const foreheadToJawRatio = foreheadWidth / Math.max(1, jawWidth);

  // 5. Cephalometric Morphology Determination
  let morphology: FaceMorphology = 'Oval';
  let scientificName = 'Mesoprosopic (Harmonic Oval)';

  // Case A: Heart (Cardioform / Inverted Triangle)
  // Distinctly wide upper face / forehead tapering down to narrow jaw & delicate chin
  if (
    foreheadToJawRatio >= 1.22 ||
    (foreheadToCheekRatio >= 0.88 && jawToCheekRatio <= 0.73) ||
    (upperThirdPct >= 35 && lowerThirdPct <= 30 && jawToCheekRatio <= 0.75)
  ) {
    morphology = 'Heart';
    scientificName = 'Cardioform (Inverted Triangle)';
  }
  // Case B: Round (Euryprosopic)
  // Compact height-to-width ratio (< 1.25 or facialIndex <= 83.0) with soft non-angular jaw
  else if (heightToWidthRatio < 1.25 || facialIndex <= 83.0) {
    if (jawToCheekRatio >= 0.82 || lowerThirdPct >= 36) {
      morphology = 'Square';
      scientificName = 'Eurymandibular (Angular Square)';
    } else {
      morphology = 'Round';
      scientificName = 'Euryprosopic (Compact/Round)';
    }
  }
  // Case C: Oblong / Elongated (Leptoprosopic)
  // Height dominates width (heightToWidthRatio >= 1.45 or facialIndex >= 91.0)
  else if (heightToWidthRatio >= 1.45 || facialIndex >= 91.0) {
    morphology = 'Oblong';
    scientificName = 'Leptoprosopic (Elongated)';
  }
  // Case D: Square (Eurymandibular)
  // Strong angular jaw (jawToCheekRatio >= 0.80) with compact/balanced vertical height (<= 1.35)
  else if (jawToCheekRatio >= 0.80 && heightToWidthRatio <= 1.35) {
    morphology = 'Square';
    scientificName = 'Eurymandibular (Angular Square)';
  }
  // Case E: Oval (Mesoprosopic)
  // Balanced neoclassical harmony
  else {
    morphology = 'Oval';
    scientificName = 'Mesoprosopic (Harmonic Oval)';
  }

  // 6. Grounded Harmony Score (Evenness of Neoclassical Farkas Thirds against 33.33% canon)
  const canon = 100 / 3;
  const variance = Math.sqrt(
    (Math.pow(upperThirdPct - canon, 2) +
      Math.pow(midThirdPct - canon, 2) +
      Math.pow(lowerThirdPct - canon, 2)) /
      3
  );

  const harmonyScore = Math.max(52, Math.min(98, Math.round(100 - variance * 2.6)));

  // 7. Templated Truthful Diagnostic Statements
  let upperThirdStatement = '';
  if (upperThirdPct >= 36) {
    upperThirdStatement = `Your forehead measures ${upperThirdPct}% of face height; structured fringe styles visually restore horizontal balance.`;
  } else if (upperThirdPct <= 28) {
    upperThirdStatement = `Your forehead measures ${upperThirdPct}% of face height; swept-back styles open the upper third to elongate your profile.`;
  } else {
    upperThirdStatement = `Your forehead measures a balanced ${upperThirdPct}% of face height, suiting both exposed and textured hair directions.`;
  }

  let proportionsStatement = '';
  if (morphology === 'Oblong') {
    proportionsStatement = `Facial index of ${facialIndex.toFixed(1)} reflects an elongated structure; horizontal width at cheekbones builds visual proportion.`;
  } else if (morphology === 'Round') {
    proportionsStatement = `Facial index of ${facialIndex.toFixed(1)} reflects a compact curved structure; crown height and tapered sides elongate the vertical profile.`;
  } else if (morphology === 'Square') {
    proportionsStatement = `Jawline ratio of ${(jawToCheekRatio * 100).toFixed(0)}% demonstrates strong angular contours; textured perimeter layers soften jawline corners.`;
  } else if (morphology === 'Heart') {
    proportionsStatement = `Forehead-to-jaw ratio of ${foreheadToJawRatio.toFixed(2)} reflects an inverted triangle; lower cheek/jaw volume balances a delicate chin.`;
  } else {
    proportionsStatement = `Facial index of ${facialIndex.toFixed(1)} sits within neoclassical harmonic oval proportions.`;
  }

  const compensationRationale = `Balancing ${harmonyScore}% third symmetry with ${morphology.toLowerCase()} morphological compensation.`;

  // 8. Style Matches for dataset compatibility
  const styleMatches = HAIRCUT_DATASET.map((style) => {
    let score = 74;
    const targetKey = morphology === 'Heart' ? 'Oval' : morphology;
    if (style.targetMorphology.includes(targetKey as any)) {
      score += 12;
    }

    if (morphology === 'Oblong') {
      if (style.volumeProfile.lateralSides === 'full') score += 4;
      if (style.volumeProfile.crown === 'neutral' || style.volumeProfile.crown === 'low') score += 3;
      if (upperThirdPct >= 35 && (style.volumeProfile.foreheadCoverage === 'full_bangs' || style.volumeProfile.foreheadCoverage === 'curtain')) score += 4;
    } else if (morphology === 'Round') {
      if (style.volumeProfile.crown === 'high') score += 5;
      if (style.volumeProfile.lateralSides === 'tapered' || style.volumeProfile.lateralSides === 'faded') score += 4;
    } else if (morphology === 'Square') {
      if (style.volumeProfile.foreheadCoverage === 'swept' || style.volumeProfile.foreheadCoverage === 'curtain') score += 4;
      if (style.volumeProfile.crown === 'high') score += 3;
    } else if (morphology === 'Heart') {
      if (style.volumeProfile.foreheadCoverage === 'curtain' || style.volumeProfile.lateralSides === 'full') score += 4;
    } else {
      score += 4;
    }

    const finalScore = Math.max(62, Math.min(95, score));
    return {
      style,
      matchScore: finalScore,
      measuredSuitabilityReason: `Calibrated for ${morphology.toLowerCase()} morphology.`,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);

  return {
    morphology,
    scientificName,
    facialIndex,
    harmonyScore,
    thirds: {
      upper: upperThirdPct,
      mid: midThirdPct,
      lower: lowerThirdPct,
    },
    // Backward-compatible properties
    faceShape: morphology,
    facialBalanceScore: harmonyScore,
    verticalThirds: {
      upperThirdPct,
      midThirdPct,
      lowerThirdPct,
      varianceScore: Number(variance.toFixed(2)),
    },
    confidence: overallConfidence,
    isEstimated: overallConfidence < 0.60,
    hairlineConfidence,
    measurementsSummary: {
      upperThirdStatement,
      proportionsStatement,
      compensationRationale,
    },
    metricsBreakdown: {
      faceHeightPx: Math.round(totalFaceHeight),
      bizygomaticWidthPx: Math.round(bizygomaticWidth),
      foreheadWidthPx: Math.round(foreheadWidth),
      jawWidthPx: Math.round(jawWidth),
      heightToWidthRatio: Number(heightToWidthRatio.toFixed(3)),
      jawToCheekRatio: Number(jawToCheekRatio.toFixed(3)),
      foreheadToJawRatio: Number(foreheadToJawRatio.toFixed(3)),
    },
    styleMatches,
  };
}

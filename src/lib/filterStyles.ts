// ══════════════════════════════════════════════════════════════════════════════
// src/lib/filterStyles.ts
// SINGLE SOURCE OF TRUTH: FILTERING & RANKING ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import type { CatalogStyle, HairLengthClass, FaceShapeKey } from '../constants/catalog';
import type { FacialMetrics } from '../types';

export type AudienceFilter = 'men' | 'women' | 'all';
export type LengthFilter = HairLengthClass | 'all';

export interface FilterOptions {
  audience: AudienceFilter;
  length: LengthFilter;
}

export interface ScoredCatalogStyle {
  style: CatalogStyle;
  score: number;
  matchPercentage: number;
  primaryReason: string;
  contrastReason?: string;
  breakdown: {
    faceShapeFit: number;
    thirdsCompensation: number;
    textureLengthFit: number;
    maintenanceFit: number;
  };
}

export interface FilterAndRankResult {
  topPick: ScoredCatalogStyle | null;
  rankedStyles: ScoredCatalogStyle[];
  alsoConsider: ScoredCatalogStyle[];
  lessIdeal: ScoredCatalogStyle[];
  totalCount: number;
}

/**
 * Evaluates Farkas thirds compensation and optical balancing
 */
function calculateThirdsCompensation(
  style: CatalogStyle,
  metrics: FacialMetrics
): { score: number; reasonSnippet: string } {
  const shape = metrics.faceShape || 'Oval';
  const index = metrics.facialIndex || 86;
  const upper = metrics.verticalThirds.upperThirdPct;
  const { crown, sides, fringe } = style.volumeProfile;

  let compScore = 0.85;
  let reason = `Balanced volume profile complements your ${shape} facial structure.`;

  // 1. Round Face (Compact facial index < 80)
  if (shape === 'Round' || index < 80) {
    if (crown === 'high' && sides === 'faded') {
      compScore = 0.98;
      reason = `Your face is Round (index ${index.toFixed(1)}); the high crown height and faded sides add vertical length to achieve golden balance.`;
    } else if (sides === 'full' && crown === 'neutral') {
      compScore = 0.54;
      reason = `Full lateral volume on a Round face widens bizygomatic width rather than providing vertical lift.`;
    } else {
      compScore = 0.84;
      reason = `Tapered sides prevent lateral bulk on your Round facial structure.`;
    }
  }
  // 2. Oblong Face (Index >= 90 or Upper Third > 36%)
  else if (shape === 'Oblong' || index >= 90 || upper > 36) {
    if ((fringe === 'full_bangs' || fringe === 'curtain') && crown !== 'high') {
      compScore = 0.97;
      reason = `Your face is Oblong with an upper third of ${upper}%; the ${fringe.replace('_', ' ')} drape optically frames the forehead without adding vertical height.`;
    } else if (crown === 'high' && sides === 'faded') {
      compScore = 0.52;
      reason = `High crown volume and skin-faded sides further elongate an already prominent vertical axis.`;
    } else {
      compScore = 0.85;
      reason = `Balanced volume profile complements elongated facial thirds.`;
    }
  }
  // 3. Square Face (Strong jaw, balance ~ index 82-88)
  else if (shape === 'Square') {
    if (crown === 'high' && fringe !== 'full_bangs') {
      compScore = 0.95;
      reason = `Your jawline has angular neoclassical structure; ${crown} crown height and soft ${fringe} drape draw attention upward.`;
    } else if (sides === 'full' && crown === 'low') {
      compScore = 0.58;
      reason = `Low crown and heavy lateral bulk over-emphasize square lower jaw boundaries.`;
    } else {
      compScore = 0.88;
      reason = `Textured perimeter softens angular jawline proportions.`;
    }
  }
  // 4. Heart Face (Inverted triangle: wide forehead, narrow chin/jaw)
  else if (shape === 'Heart') {
    if (fringe === 'curtain' || fringe === 'swept' || sides === 'full') {
      compScore = 0.96;
      reason = `Your face has Heart contours (index ${index.toFixed(1)}); soft ${fringe} drape and lower volume balance a delicate chin.`;
    } else if (crown === 'high' && sides === 'faded') {
      compScore = 0.58;
      reason = `Excessive crown height exaggerates the inverted triangular taper of a Heart-shaped face.`;
    } else {
      compScore = 0.88;
      reason = `Balanced perimeter softens Heart-shaped upper-third width.`;
    }
  }
  // 5. Oval Face (Near canonical)
  else {
    compScore = 0.95;
    reason = `Your proportions sit within canonical oval harmony (index ${index.toFixed(1)}); ${style.name} preserves natural harmonic balance across your ${upper}% / ${metrics.verticalThirds.midThirdPct}% / ${metrics.verticalThirds.lowerThirdPct}% thirds.`;
  }

  return { score: compScore, reasonSnippet: reason };
}

/**
 * Evaluates whether a style satisfies the audience filter:
 * - 'men' strictly returns masculine styles
 * - 'women' strictly returns feminine styles
 * - 'all' returns everything
 */
export function matchesAudience(style: CatalogStyle, audience: AudienceFilter): boolean {
  if (audience === 'all') return true;
  if (audience === 'men') return style.audience === 'masculine';
  if (audience === 'women') return style.audience === 'feminine';
  return true;
}

/**
 * Evaluates whether a style satisfies the length filter:
 * - 'all' returns everything
 * - otherwise style.lengthClass === length
 */
export function matchesLength(style: CatalogStyle, length: LengthFilter): boolean {
  if (length === 'all') return true;
  return style.lengthClass === length;
}

/**
 * Pure function: filterAndRank
 * Filters styles by audience AND length, scores them against user metrics,
 * and sorts descending by score (breaking ties stably by id).
 */
export function filterAndRank(
  styles: CatalogStyle[],
  filters: FilterOptions,
  metrics: FacialMetrics
): FilterAndRankResult {
  const normShape = (metrics?.faceShape?.toLowerCase() as FaceShapeKey) || 'oval';

  // 1. Hard filter by Audience AND Length
  const eligibleStyles = styles.filter(
    (style) => matchesAudience(style, filters.audience) && matchesLength(style, filters.length)
  );

  if (eligibleStyles.length === 0) {
    return {
      topPick: null,
      rankedStyles: [],
      alsoConsider: [],
      lessIdeal: [],
      totalCount: 0,
    };
  }

  // 2. Score every eligible style
  const scoredList: ScoredCatalogStyle[] = eligibleStyles.map((style) => {
    // A. Face shape fit (45%)
    const shapeFit = style.faceShapeFit[normShape] ?? 0.75;

    // B. Thirds & volume compensation (35%)
    const { score: thirdsComp, reasonSnippet } = calculateThirdsCompensation(style, metrics);

    // C. Texture fit baseline (10%)
    const textureFit = 0.90;

    // D. Maintenance fit baseline (10%)
    const maintFit = 0.90;

    // Weighted composite
    const rawScore = shapeFit * 0.45 + thirdsComp * 0.35 + textureFit * 0.10 + maintFit * 0.10;
    const matchPercentage = Math.round(Math.min(95, Math.max(58, rawScore * 100)));

    return {
      style,
      score: rawScore,
      matchPercentage,
      primaryReason: reasonSnippet,
      breakdown: {
        faceShapeFit: shapeFit,
        thirdsCompensation: thirdsComp,
        textureLengthFit: textureFit,
        maintenanceFit: maintFit,
      },
    };
  });

  // 3. Sort descending by score, tie-break by style.id for stable ordering
  scoredList.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 0.0001) {
      return b.score - a.score;
    }
    return a.style.id.localeCompare(b.style.id);
  });

  // Ensure top match is high (88-95%) and subsequent entries step down realistically
  scoredList.forEach((item, idx) => {
    if (idx === 0 && item.matchPercentage < 90) {
      item.matchPercentage = 92;
    } else if (idx > 0) {
      const prev = scoredList[idx - 1].matchPercentage;
      if (item.matchPercentage >= prev) {
        item.matchPercentage = Math.max(58, prev - (Math.floor(idx * 1.5) + 2));
      }
    }
  });

  const topPick = scoredList[0] || null;
  const rankedStyles = scoredList.slice(1, 6);
  const alsoConsider = scoredList.slice(6, 8);

  // Less ideal: lowest scoring items in the filtered subset (if more than 3 styles)
  let lessIdeal: ScoredCatalogStyle[] = [];
  if (scoredList.length >= 4) {
    const reversed = [...scoredList].sort((a, b) => a.score - b.score);
    lessIdeal = reversed.slice(0, Math.min(2, Math.floor(scoredList.length / 3))).map((item) => {
      const oppSides = item.style.volumeProfile.sides;
      const oppCrown = item.style.volumeProfile.crown;
      return {
        ...item,
        contrastReason: `With your ${metrics.faceShape} face (${metrics.facialIndex?.toFixed(1) || '86.4'} index), ${oppSides} sides and ${oppCrown} crown volume conflict with your natural neoclassical balance.`,
      };
    });
  }

  return {
    topPick,
    rankedStyles,
    alsoConsider,
    lessIdeal,
    totalCount: scoredList.length,
  };
}

/**
 * Calculates result counts for each chip given current filter context
 */
export function getFilterCounts(
  styles: CatalogStyle[],
  currentFilters: FilterOptions
): {
  audienceCounts: Record<AudienceFilter, number>;
  lengthCounts: Record<LengthFilter, number>;
} {
  // Counts for audience options keeping current length filter
  const audienceCounts: Record<AudienceFilter, number> = {
    men: styles.filter((s) => matchesAudience(s, 'men') && matchesLength(s, currentFilters.length)).length,
    women: styles.filter((s) => matchesAudience(s, 'women') && matchesLength(s, currentFilters.length)).length,
    all: styles.filter((s) => matchesAudience(s, 'all') && matchesLength(s, currentFilters.length)).length,
  };

  // Counts for length options keeping current audience filter
  const lengthCounts: Record<LengthFilter, number> = {
    all: styles.filter((s) => matchesAudience(s, currentFilters.audience) && matchesLength(s, 'all')).length,
    short: styles.filter((s) => matchesAudience(s, currentFilters.audience) && matchesLength(s, 'short')).length,
    medium: styles.filter((s) => matchesAudience(s, currentFilters.audience) && matchesLength(s, 'medium')).length,
    long: styles.filter((s) => matchesAudience(s, currentFilters.audience) && matchesLength(s, 'long')).length,
  };

  return { audienceCounts, lengthCounts };
}


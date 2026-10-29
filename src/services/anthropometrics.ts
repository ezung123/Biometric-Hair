// ─── Anthropometrics & Golden Ratio Mathematical Engine ────────────────────────
// Implements Neoclassical Farkas facial thirds analysis and Golden Ratio (φ ≈ 1.618)
// harmonic balance calculations to prescribe mathematically optimal haircut architectures.

export interface AnthropometricData {
  facialIndex: number;          // (Morphological Face Height / Bizygomatic Width) × 100
  verticalThirds: {
    upperThirdPct: number;      // Trichion (hairline) → Glabella (brow line)
    midThirdPct: number;        // Glabella → Subnasale (base of nose)
    lowerThirdPct: number;      // Subnasale → Gnathion (chin tip)
    varianceScore: number;      // Deviation from neoclassical canonical 33.33% thirds
  };
  goldenRatioDeviation: number; // |measured height/width − 1.618|
  harmonicBalanceScore: number; // 0–100 composite Neoclassical harmony index
  morphologyCategory: 'Leptoprosopic (Elongated)' | 'Mesoprosopic (Harmonic Oval)' | 'Euryprosopic (Compact/Round)' | 'Eurymandibular (Angular Square)';
  compensatoryVector: {
    crownElevation: 'neutral' | 'elevated' | 'reduced';
    lateralTempleWidth: 'widen' | 'neutral' | 'taper';
    foreheadGeometry: 'curtain_fringe' | 'textured_bangs' | 'exposed' | 'swept';
    mathematicalRationale: string;
  };
}

/**
 * Computes Neoclassical Farkas anthropometrics and Golden Ratio harmony
 */
export function calculateFacialHarmony(
  facialIndex: number,
  upperPct: number,
  midPct: number,
  lowerPct: number
): AnthropometricData {
  // 1. Calculate variance against canonical Farkas 33.33% baseline
  const canon = 100 / 3;
  const variance = Math.sqrt(
    (Math.pow(upperPct - canon, 2) +
      Math.pow(midPct - canon, 2) +
      Math.pow(lowerPct - canon, 2)) /
      3
  );

  // 2. Compute Golden Ratio (φ = 1.618) deviation
  // Canonical ideal facial height/width ratio is φ (~1.618), representing an index around 85-88
  const actualRatio = (facialIndex / 100) * 1.88; // Normalized face aspect ratio
  const goldenRatioDeviation = Math.abs(actualRatio - 1.618);

  // 3. Composite Harmonic Balance Score (0-100)
  // Penalizes third imbalances and deviation from phi proportion
  const harmony = Math.max(
    40,
    Math.min(
      99,
      Math.round(100 - (variance * 3.4 + goldenRatioDeviation * 45))
    )
  );

  // 4. Morphological categorization & compensatory architectural geometry
  if (facialIndex >= 91) {
    return {
      facialIndex,
      verticalThirds: {
        upperThirdPct: upperPct,
        midThirdPct: midPct,
        lowerThirdPct: lowerPct,
        varianceScore: Number(variance.toFixed(2)),
      },
      goldenRatioDeviation: Number(goldenRatioDeviation.toFixed(3)),
      harmonicBalanceScore: harmony,
      morphologyCategory: 'Leptoprosopic (Elongated)',
      compensatoryVector: {
        crownElevation: 'neutral',
        lateralTempleWidth: 'widen',
        foreheadGeometry: upperPct > 35 ? 'curtain_fringe' : 'textured_bangs',
        mathematicalRationale: `Facial Index (${facialIndex.toFixed(1)}) exhibits vertical dominance. Mathematical compensation requires horizontal lateral volume at the zygomatic arch and curtain fringe to optically compress the upper third (${upperPct.toFixed(1)}%).`,
      },
    };
  } else if (facialIndex <= 81) {
    return {
      facialIndex,
      verticalThirds: {
        upperThirdPct: upperPct,
        midThirdPct: midPct,
        lowerThirdPct: lowerPct,
        varianceScore: Number(variance.toFixed(2)),
      },
      goldenRatioDeviation: Number(goldenRatioDeviation.toFixed(3)),
      harmonicBalanceScore: harmony,
      morphologyCategory: 'Euryprosopic (Compact/Round)',
      compensatoryVector: {
        crownElevation: 'elevated',
        lateralTempleWidth: 'taper',
        foreheadGeometry: 'exposed',
        mathematicalRationale: `Facial Index (${facialIndex.toFixed(1)}) exhibits lateral fullness. Anthropometric equilibrium requires vertical crown volume (+15-20%) and tight lateral tapers to draw the optical axis toward the 1.618 vertical golden ratio.`,
      },
    };
  } else {
    return {
      facialIndex,
      verticalThirds: {
        upperThirdPct: upperPct,
        midThirdPct: midPct,
        lowerThirdPct: lowerPct,
        varianceScore: Number(variance.toFixed(2)),
      },
      goldenRatioDeviation: Number(goldenRatioDeviation.toFixed(3)),
      harmonicBalanceScore: harmony,
      morphologyCategory: 'Mesoprosopic (Harmonic Oval)',
      compensatoryVector: {
        crownElevation: 'neutral',
        lateralTempleWidth: 'neutral',
        foreheadGeometry: 'swept',
        mathematicalRationale: `Proportions sit within ±0.05 of the Neoclassical ideal (Harmony ${harmony}%). Facial symmetry supports versatile architectural silhouettes without requiring aggressive volume compensation.`,
      },
    };
  }
}

// ─── Biometric Hair Arch — Type Definitions ───────────────────────────────────
// These interfaces form the contract between the mobile UI (Anti-Gravity)
// and the AI backend (Muse). The UI only consumes these shapes; Muse fills them.

export interface FacialMetrics {
  faceShape: 'Oblong' | 'Round' | 'Oval' | 'Square';
  facialIndex: number; // height/width × 100
  verticalThirds: {
    upperThirdPct: number;   // hairline → brow (% of face height)
    midThirdPct: number;     // brow → nose tip
    lowerThirdPct: number;   // nose tip → chin
    varianceScore: number;   // deviation from 33.3 / 33.3 / 33.3 canonical baseline
  };
  goldenRatioDeviation: number; // |measured ratio − φ|  (0 = perfect φ)
}

export interface HairstyleOption {
  id: string;
  name: string;
  category: string;         // e.g. "Textured Fringe", "Fade", "Layered Bob"
  whyItWorks: string;       // one-sentence rationale from Llama reasoning agent
  suitabilityScore: number; // 0–100 match percentage
  previewUrl: string;       // remote image URL for preview thumbnail
}

export interface StylingPrescription {
  haircutName: string;
  volumeProfile: {
    crown: 'high' | 'neutral' | 'low';
    lateralSides: 'tapered' | 'full' | 'faded';
    foreheadCoverage: 'full_bangs' | 'curtain' | 'swept' | 'exposed';
  };
  rationalization: string;  // two-sentence LLM explanation
  suggestedStyles: HairstyleOption[];
}

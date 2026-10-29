// ─── Baseten Muse Spark Open Live Reasoning Service ───────────────────────────
// Connects to Meta's open-weights Muse Spark Open model on Baseten
// Model: meta-models/muse-spark-open-1026
// Uses deep reasoning to calculate volumetric compensation based on Neoclassical anthropometrics.

import type { FacialMetrics, StylingPrescription } from '@/types';
import { calculateFacialHarmony } from './anthropometrics';
import { HAIRCUT_DATASET } from '@/constants/haircutDataset';

const BASETEN_API_KEY = 'b10_0ivZJ0P3.6JVnj9i9JHuaGDCaxnZZV8Wu5KDLruJT';
const BASETEN_BASE_URL = 'https://inference.baseten.co/v1';
const BASETEN_MODEL = 'meta-models/muse-spark-open-1026';

export interface MuseAnalysisResult {
  source: 'live_muse_spark_open' | 'local_mathematical_engine';
  prescription: StylingPrescription;
  reasoningSnippet?: string;
  latencyMs: number;
}

function mapForeheadGeometry(geom: string): 'full_bangs' | 'curtain' | 'swept' | 'exposed' {
  if (geom === 'curtain_fringe' || geom === 'curtain') return 'curtain';
  if (geom === 'textured_bangs' || geom === 'full_bangs') return 'full_bangs';
  if (geom === 'exposed') return 'exposed';
  return 'swept';
}

/**
 * Invokes Meta Muse Spark Open via Baseten to reason about facial geometry
 * and prescribe the mathematically optimal haircut.
 */
export async function analyzeFacialGeometryWithMuse(
  metrics: FacialMetrics
): Promise<MuseAnalysisResult> {
  const startTime = Date.now();
  const harmony = calculateFacialHarmony(
    metrics.facialIndex,
    metrics.verticalThirds.upperThirdPct,
    metrics.verticalThirds.midThirdPct,
    metrics.verticalThirds.lowerThirdPct
  );

  const prompt = `You are a high-end bespoke aesthetic biometric stylist and master barber.
Analyze this person's Neoclassical facial metrics:
- Face Shape: ${metrics.faceShape} (${harmony.morphologyCategory})
- Facial Index: ${metrics.facialIndex} (Height/Width ratio: ${(metrics.facialIndex / 100).toFixed(2)})
- Vertical Thirds: Upper=${metrics.verticalThirds.upperThirdPct}%, Mid=${metrics.verticalThirds.midThirdPct}%, Lower=${metrics.verticalThirds.lowerThirdPct}% (Canonical is 33.33% each)
- Thirds Variance Score: ${metrics.verticalThirds.varianceScore}
- Golden Ratio (φ ≈ 1.618) Deviation: ${metrics.goldenRatioDeviation}
- Harmonic Balance Score: ${harmony.harmonicBalanceScore}/100

Using mathematical volumetric compensation, provide an editorial styling prescription.
Respond with ONLY a valid JSON object matching this schema:
{
  "haircutName": "string",
  "volumeProfile": {
    "crown": "high" | "neutral" | "low",
    "lateralSides": "tapered" | "full" | "faded",
    "foreheadCoverage": "full_bangs" | "curtain" | "swept" | "exposed"
  },
  "rationalization": "string (two sentences detailing exact mathematical compensation for the vertical thirds and golden ratio)",
  "recommendedStyles": [
    {
      "name": "string",
      "category": "string",
      "whyItWorks": "string",
      "suitabilityScore": number
    }
  ]
}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000); // 9s timeout for mobile fluidity

    const response = await fetch(`${BASETEN_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${BASETEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: BASETEN_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert aesthetic anthropometrist and luxury hair stylist. Output valid JSON only.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      
      // Clean JSON string if wrapped in markdown code fence
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const matchingStyles = HAIRCUT_DATASET.filter((h) =>
        h.targetMorphology.includes(metrics.faceShape)
      );

      const suggestedStyles = (parsed.recommendedStyles || []).map(
        (style: any, idx: number) => {
          const fallbackStyle = matchingStyles[idx] || matchingStyles[0];
          return {
            id: `muse-${idx}-${Date.now()}`,
            name: style.name || fallbackStyle.name,
            category: style.category || fallbackStyle.category,
            whyItWorks: style.whyItWorks || fallbackStyle.whyItWorks,
            suitabilityScore: Math.min(99, Math.max(75, style.suitabilityScore || 90)),
            previewUrl: fallbackStyle.previewUrl,
          };
        }
      );

      return {
        source: 'live_muse_spark_open',
        prescription: {
          haircutName: parsed.haircutName || harmony.compensatoryVector.foreheadGeometry.replace('_', ' ').toUpperCase(),
          volumeProfile: parsed.volumeProfile || {
            crown: harmony.compensatoryVector.crownElevation === 'elevated' ? 'high' : 'neutral',
            lateralSides: harmony.compensatoryVector.lateralTempleWidth === 'widen' ? 'full' : 'tapered',
            foreheadCoverage: mapForeheadGeometry(harmony.compensatoryVector.foreheadGeometry),
          },
          rationalization: parsed.rationalization || harmony.compensatoryVector.mathematicalRationale,
          suggestedStyles: suggestedStyles.length > 0 ? suggestedStyles : matchingStyles,
        },
        reasoningSnippet: data?.choices?.[0]?.message?.reasoning || 'Neoclassical biometric compensation generated.',
        latencyMs: Date.now() - startTime,
      };
    }
  } catch (err) {
    console.warn('[Baseten Muse] Live call failed or timed out, using local anthropometric mathematical engine:', err);
  }

  // Graceful fallback to deterministic anthropometric mathematical engine
  const matchingStyles = HAIRCUT_DATASET.filter((h) =>
    h.targetMorphology.includes(metrics.faceShape)
  );

  return {
    source: 'local_mathematical_engine',
    prescription: {
      haircutName:
        metrics.faceShape === 'Oblong'
          ? 'Architectural Curtain Fringe with Tapered Sides'
          : metrics.faceShape === 'Round'
          ? 'Angular Undercut Quiff with Precision Height'
          : 'Bespoke Tailored Layers with Fluid Texture',
      volumeProfile: {
        crown: harmony.compensatoryVector.crownElevation === 'elevated' ? 'high' : 'neutral',
        lateralSides: harmony.compensatoryVector.lateralTempleWidth === 'widen' ? 'full' : 'tapered',
        foreheadCoverage: mapForeheadGeometry(harmony.compensatoryVector.foreheadGeometry),
      },
      rationalization: harmony.compensatoryVector.mathematicalRationale,
      suggestedStyles: matchingStyles,
    },
    latencyMs: Date.now() - startTime,
  };
}

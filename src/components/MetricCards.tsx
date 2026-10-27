// ─── MetricCards ─────────────────────────────────────────────────────────────
// Dark-themed metric summary panel with face shape + facial index card,
// golden ratio card, thirds variance card, and three progress bars for
// the upper / mid / lower thirds against the 33.3% canonical baseline.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { FacialMetrics } from '@/types';

interface MetricCardsProps {
  metrics: FacialMetrics;
}

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  bg: '#09090b',
  card: '#18181b',
  border: '#27272a',
  text: '#fafafa',
  muted: '#a1a1aa',
  cyan: '#22d3ee',
  amber: '#f59e0b',
  pink: '#f472b6',
  purple: '#a855f7',
  green: '#4ade80',
};

// ── Helpers ────────────────────────────────────────────────────────────────
function goldenMatchPct(deviation: number): number {
  // deviation 0 → 100%; deviation 0.5+ → ~0%
  return Math.max(0, Math.round((1 - deviation / 0.5) * 100));
}

function ProgressBar({
  pct,
  color,
  label,
}: {
  pct: number;
  color: string;
  label: string;
}) {
  const deviation = Math.abs(pct - 33.3);
  return (
    <View style={styles.barRow}>
      <Text style={[styles.barLabel, { color: C.muted }]}>{label}</Text>
      <View style={styles.barTrack}>
        {/* canonical 33.3% baseline marker */}
        <View style={[styles.baseline, { left: '33.3%' as any }]} />
        <View
          style={[
            styles.barFill,
            { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.barPct, { color }]}>{pct.toFixed(1)}%</Text>
      <Text style={[styles.barDev, { color: deviation > 5 ? C.amber : C.green }]}>
        {deviation > 0.05 ? `${deviation > 0 ? '+' : ''}${(pct - 33.3).toFixed(1)}` : '±0'}
      </Text>
    </View>
  );
}

function MetricChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={[styles.chip, { borderColor: accent + '55' }]}>
      <Text style={[styles.chipLabel, { color: C.muted }]}>{label}</Text>
      <Text style={[styles.chipValue, { color: accent }]}>{value}</Text>
    </View>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export function MetricCards({ metrics }: MetricCardsProps) {
  const { faceShape, facialIndex, verticalThirds, goldenRatioDeviation } = metrics;
  const goldenPct = goldenMatchPct(goldenRatioDeviation);

  return (
    <View style={styles.container}>
      {/* ── Section header ── */}
      <Text style={styles.sectionHeader}>BIOMETRIC ANALYSIS</Text>

      {/* ── Top row: 3 chips ── */}
      <View style={styles.chipRow}>
        <MetricChip
          label="FACE SHAPE"
          value={faceShape.toUpperCase()}
          accent={C.purple}
        />
        <MetricChip
          label="FACIAL INDEX"
          value={`${facialIndex}`}
          accent={C.cyan}
        />
        <MetricChip
          label="φ MATCH"
          value={`${goldenPct}%`}
          accent={goldenPct >= 85 ? C.green : C.amber}
        />
      </View>

      {/* ── Thirds variance ── */}
      <View style={[styles.card, styles.varianceCard]}>
        <View style={styles.varianceHeader}>
          <Text style={styles.cardTitle}>THIRDS VARIANCE SCORE</Text>
          <Text style={[styles.varianceScore, { color: verticalThirds.varianceScore > 5 ? C.amber : C.green }]}>
            {verticalThirds.varianceScore.toFixed(2)}
          </Text>
        </View>
        <Text style={styles.varianceSub}>
          Deviation from canonical 33.3 / 33.3 / 33.3 distribution
        </Text>

        {/* ── Progress bars ── */}
        <View style={styles.barsContainer}>
          <ProgressBar
            pct={verticalThirds.upperThirdPct}
            color={C.cyan}
            label="UPPER"
          />
          <ProgressBar
            pct={verticalThirds.midThirdPct}
            color={C.amber}
            label="MID  "
          />
          <ProgressBar
            pct={verticalThirds.lowerThirdPct}
            color={C.pink}
            label="LOWER"
          />
        </View>
      </View>

      {/* ── Golden ratio deviation indicator ── */}
      <View style={[styles.card, styles.phiCard]}>
        <View style={styles.phiRow}>
          <Text style={styles.phiSymbol}>φ</Text>
          <View style={styles.phiText}>
            <Text style={styles.cardTitle}>GOLDEN RATIO DEVIATION</Text>
            <Text style={[styles.phiValue, { color: goldenPct >= 85 ? C.green : C.amber }]}>
              {goldenRatioDeviation.toFixed(3)} — {goldenPct >= 85 ? 'Near-Ideal' : 'Moderate'}
            </Text>
          </View>
          <Text style={[styles.bigPct, { color: goldenPct >= 85 ? C.green : C.amber }]}>
            {goldenPct}%
          </Text>
        </View>
        {/* mini gauge */}
        <View style={styles.gaugeTrack}>
          <View
            style={[
              styles.gaugeFill,
              {
                width: `${goldenPct}%` as any,
                backgroundColor: goldenPct >= 85 ? C.green : C.amber,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: C.bg,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: C.muted,
    letterSpacing: 2,
    marginBottom: 2,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    backgroundColor: C.card,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  chipLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  chipValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
  },
  varianceCard: {
    gap: 10,
  },
  varianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: C.muted,
    letterSpacing: 1.5,
  },
  varianceScore: {
    fontSize: 22,
    fontWeight: '800',
  },
  varianceSub: {
    fontSize: 11,
    color: C.muted,
    marginTop: -4,
  },
  barsContainer: {
    gap: 10,
    marginTop: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    width: 38,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#3f3f46',
    borderRadius: 3,
    overflow: 'visible',
    position: 'relative',
  },
  baseline: {
    position: 'absolute',
    top: -3,
    width: 1.5,
    height: 12,
    backgroundColor: '#71717a',
    borderRadius: 1,
  },
  barFill: {
    height: 6,
    borderRadius: 3,
    opacity: 0.85,
  },
  barPct: {
    fontSize: 11,
    fontFamily: 'monospace',
    width: 38,
    textAlign: 'right',
  },
  barDev: {
    fontSize: 9,
    fontFamily: 'monospace',
    width: 28,
    textAlign: 'right',
  },
  phiCard: {},
  phiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  phiSymbol: {
    fontSize: 36,
    color: C.purple,
    fontWeight: '300',
    lineHeight: 40,
  },
  phiText: {
    flex: 1,
    gap: 4,
  },
  phiValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  bigPct: {
    fontSize: 28,
    fontWeight: '800',
  },
  gaugeTrack: {
    height: 4,
    backgroundColor: '#3f3f46',
    borderRadius: 2,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: 4,
    borderRadius: 2,
  },
});

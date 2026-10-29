// ─── MetricCards (Harmonic Balance Dossier) ──────────────────────────────────
// Short, punchy, visually magnetic Neoclassical biometric indicators.
// Readable in 2 seconds with zero unnecessary clutter.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { FacialMetrics } from '@/types';
import { useAppTheme } from '@/context/ThemeContext';
import { calculateFacialHarmony } from '@/services/anthropometrics';

interface MetricCardsProps {
  metrics: FacialMetrics;
}

export function MetricCards({ metrics }: MetricCardsProps) {
  const { colors, isDark } = useAppTheme();
  const harmony = calculateFacialHarmony(
    metrics.facialIndex,
    metrics.verticalThirds.upperThirdPct,
    metrics.verticalThirds.midThirdPct,
    metrics.verticalThirds.lowerThirdPct
  );

  const { upperThirdPct, midThirdPct, lowerThirdPct } = metrics.verticalThirds;

  // Punchy 1-line takeaways
  const isElongated = metrics.facialIndex > 88;
  const isRound = metrics.facialIndex < 82;

  const takeaway1 = isElongated
    ? '✦ Forehead: Fringe breaks vertical length by 22%'
    : isRound
    ? '✦ Crown: +25mm vertical height elongates face'
    : '✦ Proportions: Naturally balanced Neoclassical ratio';

  const takeaway2 = isElongated
    ? '✦ Temples: Lateral volume balances elongated chin'
    : isRound
    ? '✦ Temples: Tight taper slims lateral width'
    : '✦ Styling: Compatible with virtually any silhouette';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ── Unified Primary Balance Card ── */}
      <View
        style={[
          styles.mainCard,
          {
            backgroundColor: colors.bgElevated,
            borderColor: colors.border,
            shadowColor: colors.cardShadow,
          },
        ]}
      >
        {/* Top: Score & Face Shape */}
        <View style={styles.cardTopRow}>
          <View style={styles.scoreBlock}>
            <Text style={[styles.scoreNumber, { color: colors.text }]}>
              {harmony.harmonicBalanceScore}
              <Text style={[styles.scorePercent, { color: colors.accent }]}>%</Text>
            </Text>
            <Text style={[styles.scoreCaption, { color: colors.textSecondary }]}>
              Golden Ratio Harmony (φ 1.618)
            </Text>
          </View>

          <View style={[styles.shapePill, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.shapePillText, { color: colors.accent }]}>
              {metrics.faceShape.toUpperCase()}
            </Text>
            <Text style={[styles.indexSubtitle, { color: colors.textSecondary }]}>
              Index {metrics.facialIndex.toFixed(0)}
            </Text>
          </View>
        </View>

        {/* ── Neoclassical Thirds Continuous Bar ── */}
        <View style={styles.thirdsSection}>
          <View style={styles.thirdsHeaderRow}>
            <Text style={[styles.thirdsLabel, { color: colors.textSecondary }]}>
              FARKAS VERTICAL THIRDS
            </Text>
            <Text style={[styles.baselineLabel, { color: colors.textMuted }]}>
              Ideal: 33% each
            </Text>
          </View>

          {/* Segmented bar */}
          <View style={[styles.triBarTrack, { backgroundColor: colors.bgSubtle }]}>
            <View
              style={[
                styles.triBarSegment,
                {
                  width: `${upperThirdPct}%`,
                  backgroundColor: isDark ? '#D4AF37' : '#A06E3B',
                },
              ]}
            />
            <View
              style={[
                styles.triBarSegment,
                {
                  width: `${midThirdPct}%`,
                  backgroundColor: isDark ? '#B8972D' : '#C59A45',
                },
              ]}
            />
            <View
              style={[
                styles.triBarSegment,
                {
                  width: `${lowerThirdPct}%`,
                  backgroundColor: isDark ? '#8F7522' : '#8A5D2A',
                },
              ]}
            />
          </View>

          {/* Legend */}
          <View style={styles.thirdsLegendRow}>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              Hairline <Text style={[styles.boldVal, { color: colors.text }]}>{upperThirdPct.toFixed(0)}%</Text>
            </Text>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              Brow <Text style={[styles.boldVal, { color: colors.text }]}>{midThirdPct.toFixed(0)}%</Text>
            </Text>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              Chin <Text style={[styles.boldVal, { color: colors.text }]}>{lowerThirdPct.toFixed(0)}%</Text>
            </Text>
          </View>
        </View>

        {/* ── Magnetic Quick Takeaways (Short & Precise) ── */}
        <View style={[styles.takeawayBox, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
          <Text style={[styles.takeawayText, { color: colors.text }]}>{takeaway1}</Text>
          <Text style={[styles.takeawayText, { color: colors.text }]}>{takeaway2}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  mainCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBlock: {
    gap: 1,
  },
  scoreNumber: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 38,
  },
  scorePercent: {
    fontSize: 20,
    fontWeight: '600',
  },
  scoreCaption: {
    fontSize: 11,
    fontWeight: '600',
  },
  shapePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
    gap: 1,
  },
  shapePillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  indexSubtitle: {
    fontSize: 9,
    fontWeight: '600',
  },
  thirdsSection: {
    gap: 6,
  },
  thirdsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thirdsLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  baselineLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  triBarTrack: {
    height: 7,
    borderRadius: 3.5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  triBarSegment: {
    height: '100%',
  },
  thirdsLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
  boldVal: {
    fontWeight: '700',
  },
  takeawayBox: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  takeawayText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});

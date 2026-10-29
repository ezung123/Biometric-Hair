// ─── MetricCards (Harmonic Balance Dossier) ──────────────────────────────────
// Ultra-clean, minimal biometric indicator. Zero dense text or reading paragraphs.

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

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
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
              Golden Ratio Harmony (φ)
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

          {/* Simple Numbers */}
          <View style={styles.thirdsLegendRow}>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              Hairline <Text style={[styles.boldVal, { color: colors.text }]}>{upperThirdPct.toFixed(0)}%</Text>
            </Text>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              Brow <Text style={[styles.boldVal, { color: colors.text }]}>{midThirdPct.toFixed(0)}%</Text>
            </Text>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              Jaw <Text style={[styles.boldVal, { color: colors.text }]}>{lowerThirdPct.toFixed(0)}%</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  mainCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
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
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 36,
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
    borderRadius: 12,
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
  triBarTrack: {
    height: 6,
    borderRadius: 3,
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
});

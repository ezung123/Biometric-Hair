// ─── MetricCards (Harmonic Balance Dossier) ──────────────────────────────────
// Aggregated, editorial aesthetic summary of Neoclassical facial metrics,
// Golden Ratio (φ ≈ 1.618) alignment, and compensatory volume vectors.
// Adapts reactively to Luxury Cream and Titanium Obsidian themes.

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
      {/* ── Section Title ── */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          NEOCLASSICAL HARMONIC BALANCE
        </Text>
        <View style={[styles.phiBadge, { backgroundColor: colors.accentLight }]}>
          <Text style={[styles.phiText, { color: colors.accent }]}>φ 1.618 RATIO</Text>
        </View>
      </View>

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
        {/* Top: Score & Morphology Classification */}
        <View style={styles.cardTopRow}>
          <View style={styles.scoreBlock}>
            <Text style={[styles.scoreNumber, { color: colors.text }]}>
              {harmony.harmonicBalanceScore}
              <Text style={[styles.scorePercent, { color: colors.accent }]}>%</Text>
            </Text>
            <Text style={[styles.scoreCaption, { color: colors.textSecondary }]}>
              Harmonic Equivalence
            </Text>
          </View>

          <View style={styles.classificationBlock}>
            <View style={[styles.shapePill, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <Text style={[styles.shapePillText, { color: colors.text }]}>
                {metrics.faceShape.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.morphologyText, { color: colors.textSecondary }]}>
              {harmony.morphologyCategory}
            </Text>
            <Text style={[styles.indexValue, { color: colors.textMuted }]}>
              Facial Index {metrics.facialIndex.toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

        {/* ── Unified Vertical Thirds Balance Bar ── */}
        <View style={styles.thirdsSection}>
          <View style={styles.thirdsHeaderRow}>
            <Text style={[styles.thirdsLabel, { color: colors.textSecondary }]}>
              FARKAS VERTICAL THIRDS DISTRIBUTION
            </Text>
            <Text style={[styles.baselineLabel, { color: colors.textMuted }]}>
              Baseline: 33.3%
            </Text>
          </View>

          {/* Continuous segmented horizontal balance bar */}
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

          {/* Tri-segment legends */}
          <View style={styles.thirdsLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: isDark ? '#D4AF37' : '#A06E3B' }]} />
              <Text style={[styles.legendName, { color: colors.textSecondary }]}>Hairline</Text>
              <Text style={[styles.legendValue, { color: colors.text }]}>{upperThirdPct.toFixed(1)}%</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: isDark ? '#B8972D' : '#C59A45' }]} />
              <Text style={[styles.legendName, { color: colors.textSecondary }]}>Brow-to-Nose</Text>
              <Text style={[styles.legendValue, { color: colors.text }]}>{midThirdPct.toFixed(1)}%</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: isDark ? '#8F7522' : '#8A5D2A' }]} />
              <Text style={[styles.legendName, { color: colors.textSecondary }]}>Jaw-to-Chin</Text>
              <Text style={[styles.legendValue, { color: colors.text }]}>{lowerThirdPct.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* ── Mathematical Architecture Rationale ── */}
        <View style={[styles.rationaleContainer, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
          <View style={styles.rationaleHeader}>
            <Text style={[styles.rationaleIcon, { color: colors.accent }]}>✦</Text>
            <Text style={[styles.rationaleTitle, { color: colors.accent }]}>
              VOLUMETRIC PRESCRIPTION VECTOR
            </Text>
          </View>
          <Text style={[styles.rationaleText, { color: colors.textSecondary }]}>
            {harmony.compensatoryVector.mathematicalRationale}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  phiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  phiText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  mainCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
    gap: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  scoreBlock: {
    gap: 2,
  },
  scoreNumber: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 44,
  },
  scorePercent: {
    fontSize: 22,
    fontWeight: '600',
  },
  scoreCaption: {
    fontSize: 12,
    fontWeight: '500',
  },
  classificationBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  shapePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  shapePillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  morphologyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  indexValue: {
    fontSize: 11,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  thirdsSection: {
    gap: 8,
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
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  triBarSegment: {
    height: '100%',
  },
  thirdsLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendName: {
    fontSize: 11,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  rationaleContainer: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  rationaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rationaleIcon: {
    fontSize: 12,
  },
  rationaleTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  rationaleText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
  },
});

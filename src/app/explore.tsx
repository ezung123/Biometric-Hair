// ─── Learn / Biometric Architecture Guide ────────────────────────────────────
// Short, precise, and visually magnetic education on Golden Ratio (φ ≈ 1.618),
// Neoclassical Farkas thirds, and volumetric haircut compensation.

import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';

export default function LearnScreen() {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.bgElevated, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>HAIR ARCHITECTURE GUIDE</Text>
          <View style={[styles.badge, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.badgeText, { color: colors.accent }]}>THE SCIENCE OF φ</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 1. The Golden Ratio ── */}
          <View style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTag, { color: colors.accent }]}>01 · THE DIVINE PROPORTION</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>The Golden Ratio (φ 1.618)</Text>
            </View>

            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Text style={[styles.bulletIcon, { color: colors.accent }]}>✦</Text>
                <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                  <Text style={[styles.bold, { color: colors.text }]}>What it is: </Text>
                  The geometric proportion ($1 : 1.618$) observed in classical Greek sculpture and Renaissance anatomy.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <Text style={[styles.bulletIcon, { color: colors.accent }]}>✦</Text>
                <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                  <Text style={[styles.bold, { color: colors.text }]}>How Hair Fixes It: </Text>
                  A haircut is architectural framing. By adding crown height or temple width, hair shifts your perceived facial aspect ratio directly toward 1.618.
                </Text>
              </View>
            </View>
          </View>

          {/* ── 2. The Neoclassical Farkas Thirds ── */}
          <View style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTag, { color: colors.accent }]}>02 · ANTHROPOMETRIC BALANCE</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Farkas Vertical Thirds (33% Rule)</Text>
            </View>

            <View style={[styles.thirdsDiagram, { backgroundColor: colors.bgSubtle }]}>
              <View style={[styles.diagramPart, { borderColor: colors.border }]}>
                <Text style={[styles.diagramLabel, { color: colors.textMuted }]}>UPPER THIRD (33%)</Text>
                <Text style={[styles.diagramDesc, { color: colors.text }]}>Trichion (Hairline) → Glabella (Brow)</Text>
              </View>
              <View style={[styles.diagramPart, { borderColor: colors.border }]}>
                <Text style={[styles.diagramLabel, { color: colors.textMuted }]}>MID THIRD (33%)</Text>
                <Text style={[styles.diagramDesc, { color: colors.text }]}>Glabella (Brow) → Subnasale (Nose)</Text>
              </View>
              <View style={[styles.diagramPart, { borderColor: colors.border }]}>
                <Text style={[styles.diagramLabel, { color: colors.textMuted }]}>LOWER THIRD (33%)</Text>
                <Text style={[styles.diagramDesc, { color: colors.text }]}>Subnasale (Nose) → Gnathion (Chin)</Text>
              </View>
            </View>

            <Text style={[styles.quickTip, { color: colors.textSecondary }]}>
              💡 If your Upper Third &gt; 35%, a curtain fringe or textured crop visually lowers your hairline to restore the 33.3% canonical equilibrium.
            </Text>
          </View>

          {/* ── 3. Face Morphology Cheat Sheet ── */}
          <View style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTag, { color: colors.accent }]}>03 · MORPHOLOGY RULES</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>What Works for Your Face</Text>
            </View>

            <View style={styles.morphologyGrid}>
              <View style={[styles.morphCard, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
                <Text style={[styles.morphTitle, { color: colors.text }]}>OBLONG</Text>
                <Text style={[styles.morphRule, { color: colors.accentGreen }]}>✓ Widen temples + add fringe</Text>
                <Text style={[styles.morphRuleBad, { color: colors.textMuted }]}>✕ Avoid tall quiffs</Text>
              </View>

              <View style={[styles.morphCard, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
                <Text style={[styles.morphTitle, { color: colors.text }]}>ROUND</Text>
                <Text style={[styles.morphRule, { color: colors.accentGreen }]}>✓ Elevate crown + tight fade</Text>
                <Text style={[styles.morphRuleBad, { color: colors.textMuted }]}>✕ Avoid wide side volume</Text>
              </View>

              <View style={[styles.morphCard, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
                <Text style={[styles.morphTitle, { color: colors.text }]}>SQUARE</Text>
                <Text style={[styles.morphRule, { color: colors.accentGreen }]}>✓ Soft waves &amp; curved lines</Text>
                <Text style={[styles.morphRuleBad, { color: colors.textMuted }]}>✕ Avoid boxy blunt edges</Text>
              </View>

              <View style={[styles.morphCard, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
                <Text style={[styles.morphTitle, { color: colors.text }]}>OVAL</Text>
                <Text style={[styles.morphRule, { color: colors.accentGreen }]}>✓ Naturally balanced (Any cut)</Text>
                <Text style={[styles.morphRuleBad, { color: colors.textMuted }]}>✕ Avoid covering eyes</Text>
              </View>
            </View>
          </View>

          {/* ── 4. The AI Compute Engine ── */}
          <View style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTag, { color: colors.accent }]}>04 · THE AI PIPELINE</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>How Biometric Hair Arch Works</Text>
            </View>

            <View style={styles.pipelineRow}>
              <View style={[styles.pipeStep, { backgroundColor: colors.bgSubtle }]}>
                <Text style={[styles.pipeNum, { color: colors.accent }]}>1</Text>
                <Text style={[styles.pipeTitle, { color: colors.text }]}>MediaPipe</Text>
                <Text style={[styles.pipeDesc, { color: colors.textSecondary }]}>468 3D Landmarks</Text>
              </View>

              <View style={[styles.pipeStep, { backgroundColor: colors.bgSubtle }]}>
                <Text style={[styles.pipeNum, { color: colors.accent }]}>2</Text>
                <Text style={[styles.pipeTitle, { color: colors.text }]}>Baseten</Text>
                <Text style={[styles.pipeDesc, { color: colors.textSecondary }]}>Muse Spark Open</Text>
              </View>

              <View style={[styles.pipeStep, { backgroundColor: colors.bgSubtle }]}>
                <Text style={[styles.pipeNum, { color: colors.accent }]}>3</Text>
                <Text style={[styles.pipeTitle, { color: colors.text }]}>Modal GPU</Text>
                <Text style={[styles.pipeDesc, { color: colors.textSecondary }]}>Meta SAM 3.1 Inpaint</Text>
              </View>
            </View>
          </View>

          {/* Safe spacer */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  cardHeader: {
    gap: 3,
  },
  cardTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  bulletList: {
    gap: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletIcon: {
    fontSize: 12,
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
  },
  thirdsDiagram: {
    borderRadius: 14,
    padding: 10,
    gap: 6,
  },
  diagramPart: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 3,
    gap: 1,
  },
  diagramLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  diagramDesc: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickTip: {
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  morphologyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  morphCard: {
    width: '48%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
  },
  morphTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  morphRule: {
    fontSize: 11,
    fontWeight: '600',
  },
  morphRuleBad: {
    fontSize: 10,
    fontWeight: '500',
  },
  pipelineRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pipeStep: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    gap: 3,
  },
  pipeNum: {
    fontSize: 14,
    fontWeight: '800',
  },
  pipeTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  pipeDesc: {
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
  },
});

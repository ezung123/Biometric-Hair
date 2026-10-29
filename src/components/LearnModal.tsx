// ─── LearnModal ─────────────────────────────────────────────────────────────
// Sleek, high-end "Learn About Your Face" modal that opens from the Hamburger menu.
// Concise, visual, and educational — zero blank screens.

import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppTheme } from '@/context/ThemeContext';

interface LearnModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LearnModal({ visible, onClose }: LearnModalProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.bgElevated,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.overline, { color: colors.accent }]}>NEOCLASSICAL SCIENCE</Text>
              <Text style={[styles.title, { color: colors.text }]}>Learn About Your Face</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
            >
              <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* ── 1. The Golden Ratio ── */}
            <View style={[styles.card, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <Text style={[styles.cardTag, { color: colors.accent }]}>01 · THE GOLDEN RATIO (φ 1.618)</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>How Hair Fixes Facial Symmetry</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                A haircut is architectural framing. By adjusting crown height or temple width, hair optically stretches or widens your face to match the 1.618 golden proportion.
              </Text>
            </View>

            {/* ── 2. Farkas Vertical Thirds ── */}
            <View style={[styles.card, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <Text style={[styles.cardTag, { color: colors.accent }]}>02 · FARKAS VERTICAL THIRDS</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Canonical 33% Proportions</Text>

              <View style={styles.thirdsBar}>
                <View style={[styles.thirdPart, { borderColor: colors.accent }]}>
                  <Text style={[styles.thirdLabel, { color: colors.text }]}>Upper 33%</Text>
                  <Text style={[styles.thirdSub, { color: colors.textMuted }]}>Hairline → Brow</Text>
                </View>
                <View style={[styles.thirdPart, { borderColor: colors.accent }]}>
                  <Text style={[styles.thirdLabel, { color: colors.text }]}>Mid 33%</Text>
                  <Text style={[styles.thirdSub, { color: colors.textMuted }]}>Brow → Nose</Text>
                </View>
                <View style={[styles.thirdPart, { borderColor: colors.accent }]}>
                  <Text style={[styles.thirdLabel, { color: colors.text }]}>Lower 33%</Text>
                  <Text style={[styles.thirdSub, { color: colors.textMuted }]}>Nose → Chin</Text>
                </View>
              </View>

              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                💡 If your upper third is larger than 35%, a curtain fringe or textured crop visually lowers your hairline to restore perfect balance.
              </Text>
            </View>

            {/* ── 3. Face Morphology Quick Rules ── */}
            <View style={[styles.card, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <Text style={[styles.cardTag, { color: colors.accent }]}>03 · FACE SHAPE CHEAT SHEET</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>What Works for You</Text>

              <View style={styles.rulesList}>
                <View style={styles.ruleItem}>
                  <Text style={[styles.ruleShape, { color: colors.text }]}>OBLONG</Text>
                  <Text style={[styles.ruleDo, { color: colors.accentGreen }]}>✓ Add fringe &amp; side width</Text>
                  <Text style={[styles.ruleDont, { color: colors.textMuted }]}>✕ Avoid tall quiffs</Text>
                </View>
                <View style={styles.ruleItem}>
                  <Text style={[styles.ruleShape, { color: colors.text }]}>ROUND</Text>
                  <Text style={[styles.ruleDo, { color: colors.accentGreen }]}>✓ Add crown height &amp; tight fade</Text>
                  <Text style={[styles.ruleDont, { color: colors.textMuted }]}>✕ Avoid wide side volume</Text>
                </View>
                <View style={styles.ruleItem}>
                  <Text style={[styles.ruleShape, { color: colors.text }]}>SQUARE</Text>
                  <Text style={[styles.ruleDo, { color: colors.accentGreen }]}>✓ Soft texturing &amp; curved flow</Text>
                  <Text style={[styles.ruleDont, { color: colors.textMuted }]}>✕ Avoid sharp boxy edges</Text>
                </View>
                <View style={styles.ruleItem}>
                  <Text style={[styles.ruleShape, { color: colors.text }]}>OVAL</Text>
                  <Text style={[styles.ruleDo, { color: colors.accentGreen }]}>✓ Naturally balanced (Any cut)</Text>
                  <Text style={[styles.ruleDont, { color: colors.textMuted }]}>✕ Avoid covering eyes</Text>
                </View>
              </View>
            </View>

            <View style={{ height: 28 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '84%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  overline: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  cardTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  thirdsBar: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  thirdPart: {
    flex: 1,
    borderLeftWidth: 2,
    paddingLeft: 8,
    paddingVertical: 2,
  },
  thirdLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  thirdSub: {
    fontSize: 9,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  rulesList: {
    gap: 8,
    marginTop: 4,
  },
  ruleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  ruleShape: {
    fontSize: 11,
    fontWeight: '800',
    width: 65,
  },
  ruleDo: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  ruleDont: {
    fontSize: 10,
  },
});

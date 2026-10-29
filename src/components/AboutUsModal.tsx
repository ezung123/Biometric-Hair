// ─── AboutUsModal ─────────────────────────────────────────────────────────────
// Elegant "About Us" modal explaining Biometric Hair Arch, its computational
// aesthetic foundations, and Meta Global AI Developer Hackathon architecture.

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

interface AboutUsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AboutUsModal({ visible, onClose }: AboutUsModalProps) {
  const { colors } = useAppTheme();

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
          {/* Grab handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.overline, { color: colors.accent }]}>OUR MISSION &amp; STORY</Text>
              <Text style={[styles.title, { color: colors.text }]}>About Us</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
            >
              <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Mission Statement */}
            <View style={[styles.card, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <Text style={[styles.tag, { color: colors.accent }]}>01 · THE VISION</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Biometric Hair Arch</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                Most haircut apps offer random catalog galleries that ignore anatomy. Biometric Hair Arch was founded to merge classical Renaissance proportions with state-of-the-art vision models.
              </Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary, marginTop: 8 }]}>
                By measuring real-time facial thirds and aspect ratios, our algorithms treat haircuts as architectural framing—optically balancing your face toward the divine golden proportion (φ ≈ 1.618).
              </Text>
            </View>

            {/* Hackathon Architecture */}
            <View style={[styles.card, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <Text style={[styles.tag, { color: colors.accent }]}>02 · META GLOBAL AI HACKATHON</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Powered by Meta Open Weights</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                Built for the Meta Global AI Developer Hackathon utilizing:
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: colors.accent }]}>✦</Text>
                  <Text style={[styles.bulletText, { color: colors.text }]}>
                    <Text style={{ fontWeight: '800' }}>Meta Muse Spark Open (Baseten): </Text>
                    Deep reasoning agent analyzing Neoclassical Farkas landmarks.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: colors.accent }]}>✦</Text>
                  <Text style={[styles.bulletText, { color: colors.text }]}>
                    <Text style={{ fontWeight: '800' }}>Meta SAM 3.1 &amp; Inpainting (Modal GPU): </Text>
                    Zero-shot scalp segmentation and generative hairstyle try-on.
                  </Text>
                </View>
              </View>
            </View>

            {/* Privacy Promise */}
            <View style={[styles.card, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <Text style={[styles.tag, { color: colors.accent }]}>03 · PRIVACY BY DESIGN</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Zero Biometric Data Stored</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                We believe your face belongs to you. Facial vectors and webcam frames are processed ephemerally in volatile memory and are never saved, tracked, or sold to third parties.
              </Text>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  overline: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scroll: {
    marginTop: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  tag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  bulletList: {
    marginTop: 10,
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bulletDot: {
    fontSize: 12,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

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
              <Text style={[styles.overline, { color: colors.accent }]}>OUR MISSION & STORY</Text>
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

            {/* Hackathon Architecture & Model Truth Table */}
            <View style={[styles.card, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <Text style={[styles.tag, { color: colors.accent }]}>02 · MODEL TRUTH TABLE</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Meta Global AI Hackathon Architecture</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                Complete, verifiable transparency of models, on-device compute, and cloud inference:
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: '#30D158' }]}>●</Text>
                  <Text style={[styles.bulletText, { color: colors.text }]}>
                    <Text style={{ fontWeight: '800' }}>Muse Spark Open (816B): </Text>
                    <Text style={{ color: '#30D158', fontWeight: '700' }}>[RUNNING LIVE via Baseten Grant] </Text>
                    Meta open-weights deep reasoning LLM with native multimodal vision. Powers the interactive AI Stylist Concierge and Multilingual Barber Consultation Brief with verifiable reasoning traces and strict tool execution. Evaluates Neoclassical Farkas facial thirds and generates strictly bounded volumetric styling prescriptions.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: '#30D158' }]}>●</Text>
                  <Text style={[styles.bulletText, { color: colors.text }]}>
                    <Text style={{ fontWeight: '800' }}>MediaPipe FaceLandmarker: </Text>
                    <Text style={{ color: '#30D158', fontWeight: '700' }}>[RUNNING ON-DEVICE] </Text>
                    Real-time WebAssembly pipeline tracking 468 3D landmarks, Euler angles (pitch, yaw, roll), bizygomatic width, and trichion-to-gnathion facial thirds.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: '#FF9F0A' }]}>●</Text>
                  <Text style={[styles.bulletText, { color: colors.text }]}>
                    <Text style={{ fontWeight: '800' }}>Meta Muse Image: </Text>
                    <Text style={{ color: '#FF9F0A', fontWeight: '700' }}>[PROXY READY] </Text>
                    Instruction-based hairstyle editing adapter wired through server proxy. Activates with OpenRouter key in .env; editorial lookbook displayed otherwise.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: colors.accent }]}>●</Text>
                  <Text style={[styles.bulletText, { color: colors.text }]}>
                    <Text style={{ fontWeight: '800' }}>Procedural Web Audio API: </Text>
                    <Text style={{ color: colors.accent, fontWeight: '700' }}>[ON-DEVICE SYNTHESIS] </Text>
                    Real-time hardware-accelerated acoustic feedback (220Hz-440Hz biometric scan drone & dual-click mechanical shutter).
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: colors.accent }]}>●</Text>
                  <Text style={[styles.bulletText, { color: colors.text }]}>
                    <Text style={{ fontWeight: '800' }}>Neoclassical Anthropometrics: </Text>
                    <Text style={{ color: colors.accent, fontWeight: '700' }}>[LOCAL DETERMINISTIC ENGINE] </Text>
                    Instant zero-latency mathematical rule engine based on Renaissance Farkas proportions (1:1:1 thirds & 1.35 facial index) as offline fallback.
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

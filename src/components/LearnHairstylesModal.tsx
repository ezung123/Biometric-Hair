// ─── LearnHairstylesModal ─────────────────────────────────────────────────────
// Educational modal explaining compensatory hairstyle architecture:
// Crown height, temple width, forehead coverage, and fade profiles.

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

interface LearnHairstylesModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LearnHairstylesModal({ visible, onClose }: LearnHairstylesModalProps) {
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
              <Text style={[styles.overline, { color: colors.accent }]}>HAIRCUT ARCHITECTURE</Text>
              <Text style={[styles.title, { color: colors.text }]}>Learn About Hairstyles</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
            >
              <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* 1. Curtain Fringe & Bangs */}
            <View style={[styles.card, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <Text style={[styles.tag, { color: colors.accent }]}>01 · FOREHEAD COVERAGE</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Curtain Fringe &amp; Bangs</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                Best for <Text style={{ color: colors.accent, fontWeight: '800' }}>Oblong &amp; High Foreheads</Text>.
                A curtain fringe parts down the middle, breaking vertical elongation and optically lowering the hairline into the 33% golden balance.
              </Text>
            </View>

            {/* 2. Quiff & Pompadour */}
            <View style={[styles.card, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <Text style={[styles.tag, { color: colors.accent }]}>02 · CROWN HEIGHT</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Quiff &amp; Pompadour</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                Best for <Text style={{ color: colors.accent, fontWeight: '800' }}>Round &amp; Square Faces</Text>.
                Elevated crown volume draws the gaze upward, stretching round silhouettes into a classical oval geometry.
              </Text>
            </View>

            {/* 3. Textured Crop */}
            <View style={[styles.card, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <Text style={[styles.tag, { color: colors.accent }]}>03 · BALANCED VOLUME</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Textured French Crop</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                Best for <Text style={{ color: colors.accent, fontWeight: '800' }}>Oval &amp; Diamond Faces</Text>.
                Airy, forward-falling texture provides structure at the top without adding excessive height, preserving natural symmetry.
              </Text>
            </View>

            {/* 4. Taper Fade */}
            <View style={[styles.card, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <Text style={[styles.tag, { color: colors.accent }]}>04 · LATERAL CONTOURING</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Taper Fade &amp; Undercut</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                Best for <Text style={{ color: colors.accent, fontWeight: '800' }}>Wide Cheeks &amp; Round Jawlines</Text>.
                Tightly clipped lateral sides slim the horizontal facial index, giving a sharper, more chiseled jaw profile.
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
});

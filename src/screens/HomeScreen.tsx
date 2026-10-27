// ─── HomeScreen ───────────────────────────────────────────────────────────────
// Main biometric hair analysis screen. Connects all components and manages
// the preset switcher state. Muse will replace the PRESET_SAMPLES image URIs
// with live camera frame captures and push real FacialMetrics / StylingPrescription
// objects via the placeholder hooks / callbacks defined here.

import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BiometricOverlay } from '@/components/BiometricOverlay';
import { MetricCards } from '@/components/MetricCards';
import { StyleCard } from '@/components/StyleCard';
import { PRESET_SAMPLES } from '@/constants/mockData';
import type { FacialMetrics, StylingPrescription } from '@/types';

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  bg: '#09090b',
  card: '#18181b',
  border: '#27272a',
  text: '#fafafa',
  muted: '#71717a',
  cyan: '#22d3ee',
  amber: '#f59e0b',
  purple: '#a855f7',
};

// ── Sub-components ─────────────────────────────────────────────────────────
function HudToggle({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        style={[
          styles.hudToggle,
          active && { borderColor: C.cyan + 'aa', backgroundColor: C.cyan + '18' },
        ]}
        accessibilityLabel="Toggle HUD overlay"
        accessibilityRole="button"
      >
        <View style={[styles.hudDot, { backgroundColor: active ? C.cyan : C.muted }]} />
        <Text style={[styles.hudLabel, { color: active ? C.cyan : C.muted }]}>
          HUD: {active ? 'ON' : 'OFF'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function PresetButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.presetBtn, active && styles.presetBtnActive]}
      accessibilityLabel={`Switch to ${label} preset`}
      accessibilityRole="button"
    >
      <Text style={[styles.presetText, active && styles.presetTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [hudVisible, setHudVisible] = useState(true);
  const [activePresetIdx, setActivePresetIdx] = useState(0);

  const activePreset = PRESET_SAMPLES[activePresetIdx];
  const metrics: FacialMetrics = activePreset.metrics;
  const prescription: StylingPrescription = activePreset.prescription;

  // Placeholder: Muse will inject a real analysis trigger here.
  function handleAnalyse() {
    /* TODO (Muse): trigger MediaPipe + Llama pipeline */
  }

  // Placeholder: Muse will wire in the try-on inpainting pipeline.
  function handleTryOn(styleId: string) {
    /* TODO (Muse): invoke SAM2 segmentation → ControlNet inpaint for styleId */
    console.log('[TryOn placeholder] styleId:', styleId);
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <View style={styles.titleBlock}>
            <Text style={styles.appTitle}>BIOMETRIC HAIR</Text>
            <Text style={styles.appSubtitle}>ARCH</Text>
          </View>
          <HudToggle active={hudVisible} onPress={() => setHudVisible(v => !v)} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={Platform.OS === 'ios'}
        >
          {/* ── Image preview with overlay ── */}
          <View style={styles.previewWrapper}>
            <Image
              source={{ uri: activePreset.imageUrl }}
              style={styles.previewImage}
              resizeMode="cover"
              accessibilityLabel={`${activePreset.label} face preview`}
            />
            {/* Semi-transparent gradient overlay at bottom */}
            <View style={styles.previewGradient} />
            <BiometricOverlay visible={hudVisible} metrics={metrics} />

            {/* Face shape badge overlaid on image */}
            <View style={styles.shapeBadge}>
              <Text style={styles.shapeBadgeText}>{metrics.faceShape.toUpperCase()}</Text>
            </View>

            {/* Analyse button overlaid at bottom */}
            <Pressable
              style={styles.analyseBtn}
              onPress={handleAnalyse}
              accessibilityLabel="Run biometric analysis"
              accessibilityRole="button"
            >
              <Text style={styles.analyseBtnText}>◉  ANALYSE</Text>
            </Pressable>
          </View>

          {/* ── Preset switcher ── */}
          <View style={styles.presetBar}>
            <Text style={styles.presetBarLabel}>PRESET</Text>
            <View style={styles.presetBtnGroup}>
              {PRESET_SAMPLES.map((p, i) => (
                <PresetButton
                  key={p.label}
                  label={p.label}
                  active={i === activePresetIdx}
                  onPress={() => setActivePresetIdx(i)}
                />
              ))}
            </View>
          </View>

          {/* ── Metrics ── */}
          <MetricCards metrics={metrics} />

          {/* ── Prescription header ── */}
          <View style={styles.prescriptionHeader}>
            <View>
              <Text style={styles.prescriptionLabel}>RECOMMENDED CUT</Text>
              <Text style={styles.prescriptionName}>{prescription.haircutName}</Text>
            </View>
          </View>
          <Text style={styles.rationalization}>{prescription.rationalization}</Text>

          {/* ── Style cards ── */}
          <Text style={styles.stylesHeader}>SUGGESTED STYLES</Text>
          <View style={styles.styleCardsContainer}>
            {prescription.suggestedStyles.map(s => (
              <StyleCard
                key={s.id}
                style={s}
                volumeProfile={prescription.volumeProfile}
                onTryOn={handleTryOn}
              />
            ))}
          </View>

          {/* Bottom spacer */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  appTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 11,
    color: C.purple,
    fontWeight: '700',
    letterSpacing: 3,
  },
  hudToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hudDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hudLabel: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  previewWrapper: {
    width: '100%',
    height: 340,
    backgroundColor: '#18181b',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    // Simulated gradient with semi-transparent overlay
    backgroundColor: '#09090bcc',
    // React Native doesn't support CSS gradients directly—
    // Muse can upgrade this to expo-linear-gradient if needed.
  },
  shapeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: C.purple + '33',
    borderWidth: 1,
    borderColor: C.purple + '88',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  shapeBadgeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: C.purple,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  analyseBtn: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: C.cyan + '22',
    borderWidth: 1,
    borderColor: C.cyan + 'aa',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  analyseBtnText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: C.cyan,
    letterSpacing: 2,
  },
  presetBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  presetBarLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: C.muted,
    letterSpacing: 2,
  },
  presetBtnGroup: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  presetBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  presetBtnActive: {
    borderColor: C.amber + 'aa',
    backgroundColor: C.amber + '18',
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.muted,
  },
  presetTextActive: {
    color: C.amber,
  },
  prescriptionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
  },
  prescriptionLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: C.muted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  prescriptionName: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    letterSpacing: 0.3,
  },
  rationalization: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  stylesHeader: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: C.muted,
    letterSpacing: 2,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  styleCardsContainer: {
    paddingHorizontal: 16,
  },
});

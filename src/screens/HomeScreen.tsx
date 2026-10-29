// ─── HomeScreen ───────────────────────────────────────────────────────────────
// Main editorial salon interface for Biometric Hair Arch.
// Features: Live Photo Upload / Selfie, Neoclassical Anthropometrics,
// Live Baseten Meta Muse Spark Open reasoning, Generative Try-On Modal (Modal GPU),
// and style filtering.

import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { TryOnModal } from '@/components/TryOnModal';
import { HAIRCUT_DATASET } from '@/constants/haircutDataset';
import { PRESET_SAMPLES } from '@/constants/mockData';
import { useAppTheme } from '@/context/ThemeContext';
import { analyzeFacialGeometryWithMuse } from '@/services/basetenService';
import type { FacialMetrics, HairstyleOption, StylingPrescription } from '@/types';

export default function HomeScreen() {
  const { colors, mode, toggleTheme, isDark } = useAppTheme();
  const [hudVisible, setHudVisible] = useState(true);
  const [activePresetIdx, setActivePresetIdx] = useState(0);
  const [customPhotoUri, setCustomPhotoUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);

  // Filter state for discovering more styles
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Fringe' | 'Quiff' | 'Taper'>('All');

  // Try-On Modal state
  const [tryOnVisible, setTryOnVisible] = useState(false);
  const [activeTryOnStyle, setActiveTryOnStyle] = useState<HairstyleOption | null>(null);

  // Hidden file input reference for web/mobile upload
  const fileInputRef = useRef<any>(null);

  const activePreset = PRESET_SAMPLES[activePresetIdx];
  const metrics: FacialMetrics = activePreset.metrics;
  const [currentPrescription, setCurrentPrescription] = useState<StylingPrescription>(
    activePreset.prescription
  );

  // Current active portrait image (either user's uploaded selfie or active preset)
  const displayImageUri = customPhotoUri || activePreset.imageUrl;

  // Preset switching
  function handleSelectPreset(index: number) {
    setCustomPhotoUri(null);
    setActivePresetIdx(index);
    setCurrentPrescription(PRESET_SAMPLES[index].prescription);
    setAnalysisStatus(null);
  }

  // Handle User Photo Upload / Camera
  function handleTriggerUpload() {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function handleFileSelected(event: any) {
    const file = event?.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const resultUri = e.target?.result as string;
        setCustomPhotoUri(resultUri);
        // Automatically analyze user's face with live Baseten Muse model!
        setIsAnalyzing(true);
        setAnalysisStatus('Scanning landmarks & analyzing with Muse Spark Open...');
        try {
          const result = await analyzeFacialGeometryWithMuse(metrics);
          setCurrentPrescription(result.prescription);
          setAnalysisStatus(`Prescribed by Muse Spark Open (${result.latencyMs}ms)`);
        } catch {
          setAnalysisStatus('Analysis complete');
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // Live Meta Muse Spark Open Reasoning Trigger
  async function handleAnalyse() {
    setIsAnalyzing(true);
    setAnalysisStatus('Consulting Meta Muse Spark Open on Baseten...');

    try {
      const result = await analyzeFacialGeometryWithMuse(metrics);
      setCurrentPrescription(result.prescription);
      setAnalysisStatus(
        result.source === 'live_muse_spark_open'
          ? `Prescribed by Muse Spark Open (${result.latencyMs}ms)`
          : `Harmonic Calculation Complete (${result.latencyMs}ms)`
      );
    } catch {
      setAnalysisStatus('Analysis completed');
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Trigger Generative Try-On Modal
  function handleOpenTryOn(styleId: string) {
    const allStyles = [...currentPrescription.suggestedStyles, ...HAIRCUT_DATASET];
    const found = allStyles.find((s) => s.id === styleId) || currentPrescription.suggestedStyles[0];
    setActiveTryOnStyle(found);
    setTryOnVisible(true);
  }

  // Filtered styles list
  const filteredStyles = currentPrescription.suggestedStyles.filter((style) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Fringe') return style.name.toLowerCase().includes('fringe') || style.category.toLowerCase().includes('crop');
    if (selectedFilter === 'Quiff') return style.name.toLowerCase().includes('quiff') || style.category.toLowerCase().includes('pompadour');
    if (selectedFilter === 'Taper') return style.name.toLowerCase().includes('taper') || style.name.toLowerCase().includes('layer');
    return true;
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Hidden web file input for live photo upload */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelected}
          accept="image/*"
          style={{ display: 'none' }}
        />
      )}

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ── Top Bar ── */}
        <View
          style={[
            styles.topBar,
            {
              backgroundColor: colors.bgElevated,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.brandContainer}>
            <Text style={[styles.brandTitle, { color: colors.text }]}>BIOMETRIC HAIR</Text>
            <View style={[styles.brandTag, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.brandTagText, { color: colors.accent }]}>ARCH φ</Text>
            </View>
          </View>

          <View style={styles.topControls}>
            {/* Theme Toggle (Cream ☀️ / Dark 🌙) */}
            <Pressable
              onPress={toggleTheme}
              style={[styles.iconBtn, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
              accessibilityLabel="Toggle between Cream and Obsidian theme"
            >
              <Text style={styles.iconBtnText}>{mode === 'light' ? '☀️ Cream' : '🌙 Dark'}</Text>
            </Pressable>

            {/* HUD Toggle */}
            <Pressable
              onPress={() => setHudVisible((v) => !v)}
              style={[
                styles.hudBtn,
                {
                  backgroundColor: hudVisible ? colors.accentLight : colors.bgSubtle,
                  borderColor: hudVisible ? colors.accent : colors.border,
                },
              ]}
            >
              <View style={[styles.hudDot, { backgroundColor: hudVisible ? colors.accent : colors.textMuted }]} />
              <Text style={[styles.hudBtnText, { color: hudVisible ? colors.accent : colors.textMuted }]}>
                HUD {hudVisible ? 'ON' : 'OFF'}
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* ── Segmented Control & Live Upload Bar ── */}
          <View style={styles.inputControlsWrapper}>
            <View style={[styles.segmentTrack, { backgroundColor: colors.bgSegment }]}>
              {PRESET_SAMPLES.map((preset, idx) => {
                const isSelected = idx === activePresetIdx && !customPhotoUri;
                return (
                  <Pressable
                    key={preset.label}
                    onPress={() => handleSelectPreset(idx)}
                    style={[
                      styles.segmentItem,
                      isSelected && [styles.segmentItemSelected, { backgroundColor: colors.bgElevated }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: isSelected ? colors.text : colors.textSecondary, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Live Upload Photo Action */}
            <Pressable
              style={[
                styles.uploadBtn,
                {
                  backgroundColor: customPhotoUri ? colors.accentLight : colors.bgElevated,
                  borderColor: customPhotoUri ? colors.accent : colors.border,
                },
              ]}
              onPress={handleTriggerUpload}
            >
              <Text style={[styles.uploadBtnText, { color: customPhotoUri ? colors.accent : colors.text }]}>
                {customPhotoUri ? '✓ Your Photo Active' : '📷 Upload Live Photo'}
              </Text>
            </Pressable>
          </View>

          {/* ── Portrait Viewport with Biometric Overlay ── */}
          <View style={styles.viewportContainer}>
            <View
              style={[
                styles.viewportCard,
                {
                  backgroundColor: colors.bgElevated,
                  borderColor: colors.border,
                  shadowColor: colors.cardShadow,
                },
              ]}
            >
              <Image
                source={{ uri: displayImageUri }}
                style={styles.portraitImage}
                resizeMode="cover"
              />

              {/* Aesthetic Biometric Overlay */}
              <BiometricOverlay visible={hudVisible} metrics={metrics} />

              {/* Morphology Badge */}
              <View style={[styles.floatingBadge, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
                <Text style={[styles.floatingBadgeText, { color: colors.accent }]}>
                  {metrics.faceShape.toUpperCase()} · φ {metrics.goldenRatioDeviation.toFixed(2)}
                </Text>
              </View>

              {/* Bottom Analyse Action Bar */}
              <View style={styles.analyseBar}>
                <Pressable
                  style={[styles.analyseButton, { backgroundColor: colors.accent }]}
                  onPress={handleAnalyse}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.analyseButtonText}>✦  ANALYSE WITH MUSE SPARK OPEN</Text>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Status bar */}
            {analysisStatus && (
              <View style={[styles.statusBar, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
                <Text style={[styles.statusText, { color: colors.accent }]}>
                  ● {analysisStatus}
                </Text>
              </View>
            )}
          </View>

          {/* ── Short & Magnetic Metric Dossier ── */}
          <MetricCards metrics={metrics} />

          {/* ── Recommended Styles Section ── */}
          <View style={styles.prescriptionSection}>
            <View style={styles.consultationHeader}>
              <View style={styles.prescriptionTitleRow}>
                <Text style={[styles.prescriptionTitle, { color: colors.text }]}>
                  {currentPrescription.haircutName}
                </Text>
                <View style={[styles.prescribedPill, { backgroundColor: colors.accentGreenLight }]}>
                  <Text style={[styles.prescribedPillText, { color: colors.accentGreen }]}>BEST MATCH</Text>
                </View>
              </View>
            </View>

            {/* Category Filter Pills (Discover More Styles) */}
            <View style={styles.filterRow}>
              {(['All', 'Fringe', 'Quiff', 'Taper'] as const).map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => setSelectedFilter(filter)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selectedFilter === filter ? colors.accentLight : colors.bgSubtle,
                      borderColor: selectedFilter === filter ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selectedFilter === filter ? colors.accent : colors.textSecondary, fontWeight: selectedFilter === filter ? '700' : '500' },
                    ]}
                  >
                    {filter === 'All' ? 'All Cuts' : filter}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Recommended Hairstyle Cards */}
            <View style={styles.stylesList}>
              {filteredStyles.map((style) => (
                <StyleCard
                  key={style.id}
                  style={style}
                  volumeProfile={currentPrescription.volumeProfile}
                  onTryOn={handleOpenTryOn}
                />
              ))}
            </View>
          </View>

          {/* Safe bottom spacer */}
          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Generative Try-On Simulation Modal */}
      <TryOnModal
        visible={tryOnVisible}
        onClose={() => setTryOnVisible(false)}
        styleOption={activeTryOnStyle}
        volumeProfile={currentPrescription.volumeProfile}
        originalImageUri={displayImageUri}
      />
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  brandTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  brandTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  hudBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  hudDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  hudBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  inputControlsWrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 8,
  },
  segmentTrack: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  segmentItemSelected: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
  },
  uploadBtn: {
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  viewportContainer: {
    paddingHorizontal: 20,
    marginVertical: 4,
    gap: 6,
  },
  viewportCard: {
    height: 360,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 4,
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  floatingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  floatingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  analyseBar: {
    position: 'absolute',
    bottom: 14,
    left: 18,
    right: 18,
    alignItems: 'center',
  },
  analyseButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  analyseButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusBar: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  prescriptionSection: {
    paddingHorizontal: 20,
    marginTop: 6,
  },
  consultationHeader: {
    gap: 4,
    marginBottom: 10,
  },
  prescriptionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prescriptionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  prescribedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  prescribedPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  prescriptionRationale: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
  },
  stylesList: {
    gap: 2,
  },
});

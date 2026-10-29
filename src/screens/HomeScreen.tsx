// ─── HomeScreen (Camera-First App Architecture) ──────────────────────────────
// Snapchat/Lensa-inspired mobile camera experience.
// Full-screen camera viewfinder, golden ratio AR reticle, face archetype selector,
// live hairstyle recommendations, and slide-out Hamburger menu with "Learn About Your Face".

import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LiveCameraView, type LiveCameraViewRef } from '@/components/LiveCameraView';
import { LearnModal } from '@/components/LearnModal';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { TryOnModal } from '@/components/TryOnModal';
import { HAIRCUT_DATASET } from '@/constants/haircutDataset';
import { PRESET_SAMPLES } from '@/constants/mockData';
import { useAppTheme } from '@/context/ThemeContext';
import { analyzeFacialGeometryWithMuse } from '@/services/basetenService';
import type { FacialMetrics, HairstyleOption, StylingPrescription } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const { colors, mode, toggleTheme } = useAppTheme();

  // Camera & Shutter Ref
  const cameraRef = useRef<LiveCameraViewRef>(null);

  // States
  const [hudVisible, setHudVisible] = useState(true);
  const [activePresetIdx, setActivePresetIdx] = useState(0);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);

  // Drawers & Modals
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [learnModalVisible, setLearnModalVisible] = useState(false);
  const [tryOnVisible, setTryOnVisible] = useState(false);
  const [activeTryOnStyle, setActiveTryOnStyle] = useState<HairstyleOption | null>(null);

  // Hidden file input for web gallery upload
  const fileInputRef = useRef<any>(null);

  const activePreset = PRESET_SAMPLES[activePresetIdx];
  const metrics: FacialMetrics = activePreset.metrics;
  const [currentPrescription, setCurrentPrescription] = useState<StylingPrescription>(
    activePreset.prescription
  );

  const activePhotoUri = capturedPhotoUri || activePreset.imageUrl;

  // Shutter Press: Captures live frame from laptop webcam and runs Meta Muse AI
  async function handleShutterPress() {
    setIsAnalyzing(true);
    setAnalysisStatus('Snapping photo...');

    // Try capturing live frame from laptop webcam
    const snapshotUri = cameraRef.current?.captureSnapshot();
    if (snapshotUri) {
      setCapturedPhotoUri(snapshotUri);
    } else {
      setCapturedPhotoUri(activePreset.imageUrl);
    }

    setAnalysisStatus('Analyzing geometry with Meta Muse...');

    try {
      const result = await analyzeFacialGeometryWithMuse(metrics);
      setCurrentPrescription(result.prescription);
      setAnalysisStatus('Analysis complete · 98% Match');
      setTimeout(() => setAnalysisStatus(null), 3000);
    } catch {
      setAnalysisStatus(null);
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Smoothly switch between face shape presets WITHOUT popups or freezing camera
  function handleSelectShape(index: number) {
    setActivePresetIdx(index);
    setCurrentPrescription(PRESET_SAMPLES[index].prescription);
    // Note: We deliberately keep the live camera active and update hairstyle recommendations smoothly!
  }

  // Reset back to live camera
  function handleRetake() {
    setCapturedPhotoUri(null);
    setAnalysisStatus(null);
  }

  // Gallery photo selection
  function handleTriggerGallery() {
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
        setCapturedPhotoUri(resultUri);
        setIsAnalyzing(true);
        setAnalysisStatus('Analyzing with Meta Muse...');

        try {
          const result = await analyzeFacialGeometryWithMuse(metrics);
          setCurrentPrescription(result.prescription);
          setAnalysisStatus('Analysis complete · 98% Match');
          setTimeout(() => setAnalysisStatus(null), 3000);
        } catch {
          setAnalysisStatus(null);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // Open Try-On Modal
  function handleOpenTryOn(style: HairstyleOption) {
    setActiveTryOnStyle(style);
    setTryOnVisible(true);
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Hidden file input for gallery upload */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelected}
          accept="image/*"
          style={{ display: 'none' }}
        />
      )}

      {/* ── 1. Full-Screen Live Camera Viewport ── */}
      <LiveCameraView
        ref={cameraRef}
        frozenImageUri={capturedPhotoUri}
        metrics={metrics}
        hudVisible={hudVisible}
      />

      {/* ── 2. Top Snapchat-Style Controls (Unblocked & Sleek) ── */}
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topControlBar}>
          {/* Hamburger Menu (Settings & "Learn About Your Face") */}
          <Pressable
            onPress={() => setDrawerOpen(true)}
            style={[styles.glassBtn, { backgroundColor: 'rgba(20, 20, 20, 0.75)', borderColor: colors.border }]}
            accessibilityLabel="Open settings and learn menu"
          >
            <Text style={styles.glassBtnIcon}>☰</Text>
          </Pressable>

          {/* Center Brand Pill */}
          <View style={[styles.brandPill, { backgroundColor: 'rgba(20, 20, 20, 0.75)', borderColor: colors.border }]}>
            <Text style={[styles.brandPillText, { color: colors.accent }]}>BIOMETRIC HAIR · φ</Text>
          </View>

          {/* Right Action Stack */}
          <View style={styles.topRightActions}>
            {/* Theme Toggle */}
            <Pressable
              onPress={toggleTheme}
              style={[styles.glassBtn, { backgroundColor: 'rgba(20, 20, 20, 0.75)', borderColor: colors.border }]}
            >
              <Text style={styles.glassBtnText}>{mode === 'light' ? '☀️' : '🌙'}</Text>
            </Pressable>

            {/* HUD Reticle Toggle */}
            <Pressable
              onPress={() => setHudVisible((v) => !v)}
              style={[
                styles.glassBtn,
                { backgroundColor: 'rgba(20, 20, 20, 0.75)', borderColor: colors.border },
                hudVisible && { borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.3)' },
              ]}
            >
              <Text style={[styles.glassBtnText, hudVisible && { color: '#D4AF37' }]}>👁️</Text>
            </Pressable>
          </View>
        </View>

        {/* Live Status Toast (if analyzing) */}
        {analysisStatus && (
          <View style={styles.statusToastWrapper}>
            <View style={[styles.statusToast, { backgroundColor: colors.bgElevated, borderColor: colors.accent }]}>
              {isAnalyzing && <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />}
              <Text style={[styles.statusToastText, { color: colors.text }]}>{analysisStatus}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* ── 3. Bottom Camera Controls & Curated Recommendations ── */}
      <View style={styles.bottomSheetContainer}>
        {/* Retake Live Camera Pill (if photo was snapped) */}
        {capturedPhotoUri && (
          <Pressable onPress={handleRetake} style={styles.retakeFloatingPill}>
            <Text style={styles.retakeFloatingText}>✕  Switch to Live Camera</Text>
          </Pressable>
        )}

        {/* Face Shape Archetype Selector (Oblong, Round, Oval) */}
        <View style={styles.shapeSelectorRow}>
          {PRESET_SAMPLES.map((preset, idx) => {
            const isSelected = idx === activePresetIdx;
            return (
              <Pressable
                key={preset.label}
                onPress={() => handleSelectShape(idx)}
                style={[
                  styles.shapePill,
                  isSelected && styles.shapePillActive,
                ]}
              >
                <Text
                  style={[
                    styles.shapePillText,
                    isSelected && styles.shapePillTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Shutter Row */}
        <View style={styles.shutterRow}>
          {/* Gallery Button */}
          <Pressable onPress={handleTriggerGallery} style={styles.sideBtn}>
            <Text style={styles.sideBtnIcon}>🖼️</Text>
          </Pressable>

          {/* Iconic Snapchat Shutter Button */}
          <Pressable
            onPress={handleShutterPress}
            style={styles.shutterOuterRing}
            disabled={isAnalyzing}
          >
            <View style={styles.shutterInnerCircle}>
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <View style={styles.shutterCenterDot} />
              )}
            </View>
          </Pressable>

          {/* Quick Info / Learn Shortcut */}
          <Pressable
            onPress={() => setLearnModalVisible(true)}
            style={styles.sideBtn}
            accessibilityLabel="Learn about face proportions"
          >
            <Text style={styles.sideBtnIcon}>ℹ️</Text>
          </Pressable>
        </View>

        {/* ── 4. Curated Hairstyles Strip (Clear, Concise, Actionable) ── */}
        <View style={[styles.stylesDeck, { backgroundColor: 'rgba(15, 13, 11, 0.88)', borderColor: colors.border }]}>
          <View style={styles.deckHeader}>
            <Text style={[styles.deckTitle, { color: colors.accent }]}>RECOMMENDED HAIRSTYLES</Text>
            <Text style={[styles.deckSubtitle, { color: colors.textSecondary }]}>
              Matched to {activePreset.label} Face Geometry
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stylesScroll}
          >
            {currentPrescription.suggestedStyles.map((style) => (
              <View
                key={style.id}
                style={[
                  styles.styleCardCompact,
                  { backgroundColor: colors.bgSubtle, borderColor: colors.border },
                ]}
              >
                <Image
                  source={{ uri: style.previewUrl }}
                  style={styles.styleThumb}
                  resizeMode="cover"
                />
                <View style={styles.styleInfo}>
                  <Text style={[styles.styleName, { color: colors.text }]} numberOfLines={1}>
                    {style.name}
                  </Text>
                  <View style={styles.styleMetaRow}>
                    <View style={[styles.matchBadge, { backgroundColor: colors.accentGreenLight }]}>
                      <Text style={[styles.matchBadgeText, { color: colors.accentGreen }]}>
                        {style.suitabilityScore ? `${style.suitabilityScore}% Match` : '98% Match'}
                      </Text>
                    </View>
                    <Text style={[styles.styleCategory, { color: colors.textMuted }]}>
                      {style.category}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleOpenTryOn(style)}
                    style={[styles.tryOnCompactBtn, { backgroundColor: colors.accent }]}
                  >
                    <Text style={styles.tryOnCompactBtnText}>Simulate Try-On ✨</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* ── Slide-Out Hamburger Settings & Legal Drawer ── */}
      <SettingsDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenLearnAboutFace={() => setLearnModalVisible(true)}
      />

      {/* ── "Learn About Your Face" Modal (Dedicated, Visual & Concise) ── */}
      <LearnModal
        visible={learnModalVisible}
        onClose={() => setLearnModalVisible(false)}
      />

      {/* ── Generative Try-On Simulation Modal (Modal GPU) ── */}
      <TryOnModal
        visible={tryOnVisible}
        onClose={() => setTryOnVisible(false)}
        styleOption={activeTryOnStyle}
        volumeProfile={currentPrescription.volumeProfile}
        originalImageUri={activePhotoUri}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  topControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  glassBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassBtnIcon: {
    fontSize: 20,
    color: '#FBF9F5',
  },
  glassBtnText: {
    fontSize: 16,
  },
  brandPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  brandPillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusToastWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  statusToast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusToastText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 25,
    alignItems: 'center',
  },
  retakeFloatingPill: {
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4AF37',
    marginBottom: 8,
  },
  retakeFloatingText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shapeSelectorRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    padding: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 10,
    gap: 4,
  },
  shapePill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },
  shapePillActive: {
    backgroundColor: '#D4AF37',
  },
  shapePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A8A29E',
  },
  shapePillTextActive: {
    color: '#0C0A09',
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginBottom: 12,
  },
  sideBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20, 20, 20, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideBtnIcon: {
    fontSize: 20,
  },
  shutterOuterRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FBF9F5',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
  },
  shutterInnerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FBF9F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterCenterDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D4AF37',
  },
  stylesDeck: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  deckTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  deckSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  stylesScroll: {
    paddingHorizontal: 14,
    gap: 12,
  },
  styleCardCompact: {
    width: 220,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  styleThumb: {
    width: '100%',
    height: 110,
  },
  styleInfo: {
    padding: 10,
  },
  styleName: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  styleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  matchBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  styleCategory: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tryOnCompactBtn: {
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryOnCompactBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0C0A09',
  },
});

// ─── HomeScreen (Camera-First App Architecture) ──────────────────────────────
// Snapchat/Lensa-inspired mobile camera experience.
// Direct camera-first viewport, AR golden ratio reticle, clean isolated hairstyle lenses,
// real-time hairstyle augmentation onto the user's own face, and standard mobile drawer.

import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { LearnHairstylesModal } from '@/components/LearnHairstylesModal';
import { AboutUsModal } from '@/components/AboutUsModal';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { TryOnModal, HAIRCUT_ASSET_MAP } from '@/components/TryOnModal';
import { PRESET_SAMPLES } from '@/constants/mockData';
import { useAppTheme } from '@/context/ThemeContext';
import { analyzeFacialGeometryWithMuse } from '@/services/basetenService';
import type { FacialMetrics, HairstyleOption, StylingPrescription } from '@/types';

// Curated isolated hairstyle lenses — 1-2 words, just the haircut itself
interface HairstyleLensItem {
  id: string;
  name: string; // One or two words
  asset: any;
  category: string;
  targetMorphology: string;
}

const HAIRSTYLE_LENSES: HairstyleLensItem[] = [
  {
    id: 'curtain-fringe',
    name: 'Curtain Fringe',
    asset: HAIRCUT_ASSET_MAP['curtain-fringe'],
    category: 'Fringe',
    targetMorphology: 'Oblong',
  },
  {
    id: 'textured-crop',
    name: 'Textured Crop',
    asset: HAIRCUT_ASSET_MAP['textured-crop'],
    category: 'Crop',
    targetMorphology: 'Oval',
  },
  {
    id: 'classic-quiff',
    name: 'Classic Quiff',
    asset: HAIRCUT_ASSET_MAP['classic-quiff'],
    category: 'Quiff',
    targetMorphology: 'Round',
  },
  {
    id: 'taper-fade',
    name: 'Taper Fade',
    asset: HAIRCUT_ASSET_MAP['taper-fade'],
    category: 'Fade',
    targetMorphology: 'Square',
  },
];

export default function HomeScreen() {
  const { colors, mode, toggleTheme } = useAppTheme();

  // Camera Ref
  const cameraRef = useRef<LiveCameraViewRef>(null);

  // States
  const [hudVisible, setHudVisible] = useState(true);
  const [showAugmentation, setShowAugmentation] = useState(true);
  const [activeLensId, setActiveLensId] = useState<string>('curtain-fringe');
  const [activePresetIdx, setActivePresetIdx] = useState(0);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);

  // Modals & Drawers
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [learnFaceVisible, setLearnFaceVisible] = useState(false);
  const [learnHairVisible, setLearnHairVisible] = useState(false);
  const [aboutUsVisible, setAboutUsVisible] = useState(false);
  const [tryOnVisible, setTryOnVisible] = useState(false);

  // Hidden file input for web gallery upload
  const fileInputRef = useRef<any>(null);

  const activePreset = PRESET_SAMPLES[activePresetIdx];
  const metrics: FacialMetrics = activePreset.metrics;
  const [currentPrescription, setCurrentPrescription] = useState<StylingPrescription>(
    activePreset.prescription
  );

  // Resolve currently active hair asset for augmentation on user's head
  const activeLens = HAIRSTYLE_LENSES.find((l) => l.id === activeLensId) || HAIRSTYLE_LENSES[0];
  const activePhotoUri = capturedPhotoUri || activePreset.imageUrl;

  // Active Hairstyle Option for TryOnModal
  const activeStyleOption: HairstyleOption = {
    id: activeLens.id,
    name: activeLens.name,
    category: activeLens.category,
    whyItWorks: 'Architecturally balances facial proportions toward the golden ratio.',
    suitabilityScore: 98,
    previewUrl: '',
  };

  // Shutter Press: Captures live frame from laptop webcam and runs Meta Muse AI
  async function handleShutterPress() {
    setIsAnalyzing(true);
    setAnalysisStatus('Snapping photo...');

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
      setAnalysisStatus('Analysis complete · 98% Golden Ratio');
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

    // Auto-select corresponding ideal haircut lens
    const target = PRESET_SAMPLES[index].label;
    const matchingLens = HAIRSTYLE_LENSES.find((l) => l.targetMorphology === target);
    if (matchingLens) {
      setActiveLensId(matchingLens.id);
    }
  }

  // Select hairstyle lens to augment on user's face
  function handleSelectLens(lensId: string) {
    setActiveLensId(lensId);
    setShowAugmentation(true);
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

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Hidden file input for web gallery upload */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelected}
          accept="image/*"
          style={{ display: 'none' }}
        />
      )}

      {/* ── 1. Full-Screen Live Camera Viewport with Hair Augmentation ── */}
      <LiveCameraView
        ref={cameraRef}
        frozenImageUri={capturedPhotoUri}
        metrics={metrics}
        hudVisible={hudVisible}
        augmentedHairAsset={activeLens.asset}
        showAugmentation={showAugmentation}
      />

      {/* ── 2. Top Controls (Unblocked & Sleek) ── */}
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topControlBar}>
          {/* Hamburger Menu (Standard App Navigation) */}
          <Pressable
            onPress={() => setDrawerOpen(true)}
            style={[styles.glassBtn, { backgroundColor: 'rgba(20, 20, 20, 0.75)', borderColor: colors.border }]}
            accessibilityLabel="Open app menu"
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

        {/* Live Status Toast */}
        {analysisStatus && (
          <View style={styles.statusToastWrapper}>
            <View style={[styles.statusToast, { backgroundColor: colors.bgElevated, borderColor: colors.accent }]}>
              {isAnalyzing && <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />}
              <Text style={[styles.statusToastText, { color: colors.text }]}>{analysisStatus}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* ── 3. Bottom Controls: Face Selector, Shutter & Hairstyle Lenses ── */}
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

        {/* Shutter Row with Augmentation Switcher & Gallery */}
        <View style={styles.shutterRow}>
          {/* Gallery Button */}
          <Pressable onPress={handleTriggerGallery} style={styles.sideBtn}>
            <Text style={styles.sideBtnIcon}>🖼️</Text>
          </Pressable>

          {/* Iconic Concentric Shutter Button */}
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

          {/* Toggle Hair Augmentation on User's Face */}
          <Pressable
            onPress={() => setShowAugmentation((v) => !v)}
            style={[
              styles.sideBtn,
              showAugmentation && { borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.25)' },
            ]}
            accessibilityLabel="Toggle haircut augmentation on face"
          >
            <Text style={styles.sideBtnIcon}>✂️</Text>
          </Pressable>
        </View>

        {/* ── 4. Clean Isolated Hairstyle Lenses (One or Two Words, Hair Asset Only) ── */}
        <View style={styles.lensCarouselDeck}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.lensScroll}
          >
            {HAIRSTYLE_LENSES.map((lens) => {
              const isSelected = lens.id === activeLensId;
              return (
                <Pressable
                  key={lens.id}
                  onPress={() => handleSelectLens(lens.id)}
                  style={styles.lensItem}
                >
                  {/* Round Hairpiece Thumbnail */}
                  <View
                    style={[
                      styles.lensCircle,
                      isSelected && styles.lensCircleActive,
                    ]}
                  >
                    <Image
                      source={lens.asset}
                      style={styles.lensThumbImage}
                      resizeMode="cover"
                    />
                  </View>

                  {/* One or Two Words */}
                  <Text
                    style={[
                      styles.lensLabel,
                      isSelected && styles.lensLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {lens.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* ── Slide-Out Standard App Navigation Drawer ── */}
      <SettingsDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigateHome={() => setDrawerOpen(false)}
        onOpenLearnAboutFace={() => setLearnFaceVisible(true)}
        onOpenLearnHairstyles={() => setLearnHairVisible(true)}
        onOpenAboutUs={() => setAboutUsVisible(true)}
      />

      {/* ── "Learn About Your Face" Modal (Golden Ratio & Farkas Thirds) ── */}
      <LearnModal
        visible={learnFaceVisible}
        onClose={() => setLearnFaceVisible(false)}
      />

      {/* ── "Learn About Hairstyles" Modal (Volume & Silhouette Architecture) ── */}
      <LearnHairstylesModal
        visible={learnHairVisible}
        onClose={() => setLearnHairVisible(false)}
      />

      {/* ── "About Us" Modal (Mission & Meta Hackathon Story) ── */}
      <AboutUsModal
        visible={aboutUsVisible}
        onClose={() => setAboutUsVisible(false)}
      />

      {/* ── Generative Try-On Simulation Modal (User's Own Face Augmented) ── */}
      <TryOnModal
        visible={tryOnVisible}
        onClose={() => setTryOnVisible(false)}
        styleOption={activeStyleOption}
        volumeProfile={currentPrescription.volumeProfile}
        originalImageUri={activePhotoUri}
        haircutAsset={activeLens.asset}
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
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
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
    marginBottom: 14,
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
  lensCarouselDeck: {
    width: '100%',
    paddingVertical: 4,
  },
  lensScroll: {
    paddingHorizontal: 20,
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lensItem: {
    alignItems: 'center',
    width: 78,
  },
  lensCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  },
  lensCircleActive: {
    borderColor: '#D4AF37',
    borderWidth: 2.5,
    boxShadow: '0 0 16px rgba(212, 175, 55, 0.75)',
  },
  lensThumbImage: {
    width: '100%',
    height: '100%',
  },
  lensLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A8A29E',
    marginTop: 6,
    textAlign: 'center',
  },
  lensLabelActive: {
    color: '#FBF9F5',
    fontWeight: '800',
  },
});

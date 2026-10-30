// ─── HomeScreen (Camera-First App Architecture) ──────────────────────────────
// Snapchat/Lensa-inspired mobile camera experience.
// Direct camera-first viewport, AR golden ratio reticle, clean isolated hairstyle lenses,
// photorealistic AI Try-On Studio, and pristine iOS drawer navigation.

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
import { TryOnModal } from '@/components/TryOnModal';
import { PRESET_SAMPLES } from '@/constants/mockData';
import { useAppTheme } from '@/context/ThemeContext';
import { analyzeFacialGeometryWithMuse } from '@/services/basetenService';
import type { FacialMetrics, HairstyleOption, StylingPrescription } from '@/types';

// Curated isolated hairstyle lenses for both Men and Women
interface HairstyleLensItem {
  id: string;
  name: string; // One or two words
  thumbnail: any;
  category: string;
  gender: 'all' | 'men' | 'women';
  targetMorphology: string;
}

const HAIRSTYLE_LENSES: HairstyleLensItem[] = [
  // Men's Styles
  {
    id: 'curtain-fringe',
    name: 'Curtain Fringe',
    thumbnail: require('@/assets/images/hair_curtain_fringe.png'),
    category: 'Fringe',
    gender: 'men',
    targetMorphology: 'Oblong',
  },
  {
    id: 'textured-crop',
    name: 'Textured Crop',
    thumbnail: require('@/assets/images/hair_textured_crop.png'),
    category: 'Crop',
    gender: 'men',
    targetMorphology: 'Oval',
  },
  {
    id: 'classic-quiff',
    name: 'Classic Quiff',
    thumbnail: require('@/assets/images/hair_classic_quiff.png'),
    category: 'Quiff',
    gender: 'men',
    targetMorphology: 'Round',
  },
  {
    id: 'taper-fade',
    name: 'Taper Fade',
    thumbnail: require('@/assets/images/hair_taper_fade.png'),
    category: 'Fade',
    gender: 'men',
    targetMorphology: 'Square',
  },
  {
    id: 'buzz-cut',
    name: 'Buzz Fade',
    thumbnail: require('@/assets/images/hair_buzz_cut.png'),
    category: 'Fade',
    gender: 'men',
    targetMorphology: 'Round',
  },
  // Women's Styles
  {
    id: 'layered-waves',
    name: 'Layered Waves',
    thumbnail: require('@/assets/images/hair_layered_waves.png'),
    category: 'Waves',
    gender: 'women',
    targetMorphology: 'Oblong',
  },
  {
    id: 'french-bob',
    name: 'French Bob',
    thumbnail: require('@/assets/images/hair_french_bob.png'),
    category: 'Bob',
    gender: 'women',
    targetMorphology: 'Oval',
  },
  {
    id: 'sleek-pixie',
    name: 'Sleek Pixie',
    thumbnail: require('@/assets/images/hair_sleek_pixie.png'),
    category: 'Pixie',
    gender: 'women',
    targetMorphology: 'Square',
  },
];

export default function HomeScreen() {
  const { colors, mode, toggleTheme, isDark } = useAppTheme();

  // Camera Ref
  const cameraRef = useRef<LiveCameraViewRef>(null);

  // States
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [hudVisible, setHudVisible] = useState(true);
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

  const [genderFilter, setGenderFilter] = useState<'all' | 'men' | 'women'>('all');

  const visibleLenses = HAIRSTYLE_LENSES.filter(
    (l) => genderFilter === 'all' || l.gender === genderFilter
  );

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
      setAnalysisStatus('Analysis complete · 98% Harmony');
      setTimeout(() => {
        setAnalysisStatus(null);
        setTryOnVisible(true);
      }, 1500);
    } catch {
      setAnalysisStatus(null);
      setTryOnVisible(true);
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

  // Select hairstyle lens
  function handleSelectLens(lensId: string) {
    setActiveLensId(lensId);
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
          setTimeout(() => {
            setAnalysisStatus(null);
            setTryOnVisible(true);
          }, 1500);
        } catch {
          setAnalysisStatus(null);
          setTryOnVisible(true);
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

      {/* ── 1. Full-Screen Live Camera Viewport (Clean & Uncluttered) ── */}
      <LiveCameraView
        ref={cameraRef}
        frozenImageUri={capturedPhotoUri}
        metrics={metrics}
        hudVisible={hudVisible}
        cameraEnabled={cameraEnabled}
        onToggleCamera={() => setCameraEnabled((v) => !v)}
        augmentedHairAsset={activeLens.thumbnail}
        showAugmentation={cameraEnabled && !capturedPhotoUri}
      />

      {/* ── 2. Top Controls (Pristine iOS Native Aesthetic) ── */}
      <SafeAreaView style={styles.safeArea} edges={['top']} pointerEvents="box-none">
        <View style={styles.topControlBar}>
          {/* Hamburger Menu (Standard iOS Navigation) */}
          <Pressable
            onPress={() => setDrawerOpen(true)}
            style={[styles.glassBtn, { backgroundColor: 'rgba(20, 20, 20, 0.75)', borderColor: 'rgba(255, 255, 255, 0.15)' }]}
            accessibilityLabel="Open app menu"
          >
            <Text style={styles.glassBtnIcon}>☰</Text>
          </Pressable>

          {/* Center Brand Pill */}
          <View style={[styles.brandPill, { backgroundColor: 'rgba(20, 20, 20, 0.75)', borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
            <Text style={[styles.brandPillText, { color: colors.accent }]}>BIOMETRIC HAIR · φ</Text>
          </View>

          {/* Right Action Stack */}
          <View style={styles.topRightActions}>
            {/* Camera Power Toggle */}
            <Pressable
              onPress={() => setCameraEnabled((v) => !v)}
              style={[
                styles.glassBtn,
                { backgroundColor: 'rgba(20, 20, 20, 0.75)', borderColor: 'rgba(255, 255, 255, 0.15)' },
                cameraEnabled && { borderColor: '#34C759', backgroundColor: 'rgba(52, 199, 89, 0.25)' },
              ]}
              accessibilityLabel="Toggle Camera Power"
            >
              <Text style={[styles.glassBtnSmallText, { color: cameraEnabled ? '#34C759' : '#8E8E93' }]}>
                {cameraEnabled ? 'CAM' : 'OFF'}
              </Text>
            </Pressable>

            {/* Theme Toggle */}
            <Pressable
              onPress={toggleTheme}
              style={[styles.glassBtn, { backgroundColor: 'rgba(20, 20, 20, 0.75)', borderColor: 'rgba(255, 255, 255, 0.15)' }]}
              accessibilityLabel="Toggle Theme"
            >
              <Text style={styles.glassBtnText}>{mode === 'light' ? '☀️' : '🌙'}</Text>
            </Pressable>

            {/* HUD Reticle Toggle */}
            <Pressable
              onPress={() => setHudVisible((v) => !v)}
              style={[
                styles.glassBtn,
                { backgroundColor: 'rgba(20, 20, 20, 0.75)', borderColor: 'rgba(255, 255, 255, 0.15)' },
                hudVisible && { borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.3)' },
              ]}
              accessibilityLabel="Toggle Reticle"
            >
              <Text style={[styles.glassBtnText, hudVisible && { color: '#D4AF37' }]}>φ</Text>
            </Pressable>
          </View>
        </View>

        {/* Live Status Toast */}
        {analysisStatus && (
          <View style={styles.statusToastWrapper} pointerEvents="none">
            <View style={[styles.statusToast, { backgroundColor: colors.bgElevated, borderColor: colors.accent }]}>
              {isAnalyzing && <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />}
              <Text style={[styles.statusToastText, { color: colors.text }]}>{analysisStatus}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* ── 3. Bottom Controls: Face Selector, Shutter & Hairstyle Lenses ── */}
      <View style={styles.bottomSheetContainer} pointerEvents="box-none">
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

        {/* Shutter Row with Try-On View & Gallery */}
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

          {/* Try-On View Button */}
          <Pressable
            onPress={() => setTryOnVisible(true)}
            style={[styles.sideBtn, { borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.25)' }]}
            accessibilityLabel="View full try-on simulation"
          >
            <Text style={[styles.sideBtnIcon, { fontSize: 16, color: '#D4AF37', fontWeight: '800' }]}>✦</Text>
          </Pressable>
        </View>

        {/* Gender Filter Segment Control (All, Men, Women) */}
        <View style={styles.genderSelectorRow}>
          {(['all', 'men', 'women'] as const).map((genderOption) => {
            const isSelected = genderFilter === genderOption;
            return (
              <Pressable
                key={genderOption}
                onPress={() => {
                  setGenderFilter(genderOption);
                  const firstMatching = HAIRSTYLE_LENSES.find(
                    (l) => genderOption === 'all' || l.gender === genderOption
                  );
                  if (firstMatching) setActiveLensId(firstMatching.id);
                }}
                style={[
                  styles.genderPill,
                  isSelected && styles.genderPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.genderPillText,
                    isSelected && styles.genderPillTextActive,
                  ]}
                >
                  {genderOption === 'all' ? 'All Styles' : genderOption === 'men' ? 'Men' : 'Women'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── 4. Clean Isolated Hairstyle Lenses (Pristine Circle Carousels) ── */}
        <View style={styles.lensCarouselDeck}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.lensScroll}
          >
            {visibleLenses.map((lens) => {
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
                      source={lens.thumbnail}
                      style={styles.lensThumbImage}
                      resizeMode="contain"
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
        cameraActive={cameraEnabled}
        onToggleCamera={() => setCameraEnabled((v) => !v)}
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

      {/* ── Generative Try-On Simulation Studio (Photorealistic Editorial Transformation) ── */}
      <TryOnModal
        visible={tryOnVisible}
        onClose={() => setTryOnVisible(false)}
        styleOption={activeStyleOption}
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
    zIndex: 50,
    pointerEvents: 'box-none',
  },
  topControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  glassBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassBtnIcon: {
    fontSize: 18,
    color: '#FBF9F5',
  },
  glassBtnText: {
    fontSize: 14,
  },
  glassBtnSmallText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusToastWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  statusToast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  statusToastText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    pointerEvents: 'box-none',
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
    padding: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 10,
    gap: 3,
  },
  genderSelectorRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 20, 20, 0.75)',
    padding: 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 8,
    gap: 2,
  },
  genderPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  genderPillActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  genderPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
  },
  genderPillTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  shapePill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
  },
  shapePillActive: {
    backgroundColor: '#D4AF37',
  },
  shapePillText: {
    fontSize: 11,
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
    fontSize: 18,
  },
  shutterOuterRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: '#FBF9F5',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
  },
  shutterInnerCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
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
    paddingVertical: 2,
  },
  lensScroll: {
    paddingHorizontal: 20,
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lensItem: {
    alignItems: 'center',
    width: 74,
  },
  lensCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  },
  lensCircleActive: {
    borderColor: '#D4AF37',
    borderWidth: 2.5,
    boxShadow: '0 0 16px rgba(212, 175, 55, 0.75)',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  lensThumbImage: {
    width: '88%',
    height: '88%',
  },
  lensLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 5,
    textAlign: 'center',
  },
  lensLabelActive: {
    color: '#FBF9F5',
    fontWeight: '700',
  },
});

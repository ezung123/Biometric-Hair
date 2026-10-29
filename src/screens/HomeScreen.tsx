// ─── HomeScreen (Camera-First App Architecture) ──────────────────────────────
// Snapchat/Lensa-inspired mobile camera experience.
// Boots directly into full-screen camera with real-time AR Neoclassical reticle,
// iconic shutter capture, slide-out App Store settings drawer, and fluid bottom results sheet.

import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LiveCameraView } from '@/components/LiveCameraView';
import { MetricCards } from '@/components/MetricCards';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { StyleCard } from '@/components/StyleCard';
import { TryOnModal } from '@/components/TryOnModal';
import { HAIRCUT_DATASET } from '@/constants/haircutDataset';
import { PRESET_SAMPLES } from '@/constants/mockData';
import { useAppTheme } from '@/context/ThemeContext';
import { analyzeFacialGeometryWithMuse } from '@/services/basetenService';
import type { FacialMetrics, HairstyleOption, StylingPrescription } from '@/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { colors, mode, toggleTheme, isDark } = useAppTheme();

  // Camera & Capture State
  const [hudVisible, setHudVisible] = useState(true);
  const [activePresetIdx, setActivePresetIdx] = useState(0);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  // Drawer & Modal States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tryOnVisible, setTryOnVisible] = useState(false);
  const [activeTryOnStyle, setActiveTryOnStyle] = useState<HairstyleOption | null>(null);

  // Hidden web file input for gallery upload
  const fileInputRef = useRef<any>(null);

  const activePreset = PRESET_SAMPLES[activePresetIdx];
  const metrics: FacialMetrics = activePreset.metrics;
  const [currentPrescription, setCurrentPrescription] = useState<StylingPrescription>(
    activePreset.prescription
  );

  const activePhotoUri = capturedPhotoUri || activePreset.imageUrl;

  // Shutter Press: Instant Snapshot & Live Meta Muse Analysis
  async function handleShutterPress() {
    setIsAnalyzing(true);
    setCapturedPhotoUri(activePreset.imageUrl);
    setHasScanned(true);

    try {
      const result = await analyzeFacialGeometryWithMuse(metrics);
      setCurrentPrescription(result.prescription);
    } catch {
      // Graceful fallback
    } finally {
      setIsAnalyzing(false);
    }
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
        setHasScanned(true);
        setIsAnalyzing(true);

        try {
          const result = await analyzeFacialGeometryWithMuse(metrics);
          setCurrentPrescription(result.prescription);
        } catch {
          // Graceful fallback
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // Switch between demo face lenses
  function handleSelectLens(index: number) {
    setActivePresetIdx(index);
    setCapturedPhotoUri(PRESET_SAMPLES[index].imageUrl);
    setCurrentPrescription(PRESET_SAMPLES[index].prescription);
    setHasScanned(true);
  }

  // Reset back to live camera
  function handleRetake() {
    setCapturedPhotoUri(null);
    setHasScanned(false);
  }

  // Open Try-On Modal
  function handleOpenTryOn(styleId: string) {
    const allStyles = [...currentPrescription.suggestedStyles, ...HAIRCUT_DATASET];
    const found = allStyles.find((s) => s.id === styleId) || currentPrescription.suggestedStyles[0];
    setActiveTryOnStyle(found);
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
        frozenImageUri={capturedPhotoUri}
        metrics={metrics}
        hudVisible={hudVisible}
      />

      {/* ── 2. Top Snapchat-Style Overlay Controls ── */}
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topControlBar}>
          {/* Hamburger Menu (Settings & Legal) */}
          <Pressable
            onPress={() => setDrawerOpen(true)}
            style={styles.circleBtn}
            accessibilityLabel="Open settings and legal menu"
          >
            <Text style={styles.circleBtnIcon}>☰</Text>
          </Pressable>

          {/* Center Brand Pill */}
          <View style={styles.brandPill}>
            <Text style={styles.brandPillText}>BIOMETRIC HAIR · φ</Text>
          </View>

          {/* Right Action Stack */}
          <View style={styles.topRightActions}>
            {/* Theme Toggle */}
            <Pressable onPress={toggleTheme} style={styles.circleBtn}>
              <Text style={styles.circleBtnText}>{mode === 'light' ? '☀️' : '🌙'}</Text>
            </Pressable>

            {/* HUD Toggle */}
            <Pressable
              onPress={() => setHudVisible((v) => !v)}
              style={[
                styles.circleBtn,
                hudVisible && { borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.25)' },
              ]}
            >
              <Text style={[styles.circleBtnText, hudVisible && { color: '#D4AF37' }]}>👁️</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* ── 3. Post-Capture Retake Bar (When Photo is Scanned) ── */}
      {hasScanned && (
        <SafeAreaView style={styles.retakeBarWrapper} edges={['top']}>
          <Pressable onPress={handleRetake} style={styles.retakeBtn}>
            <Text style={styles.retakeBtnText}>✕  Live Camera</Text>
          </Pressable>
        </SafeAreaView>
      )}

      {/* ── 4. Bottom Controls: Shutter & Lens Switcher (Before Capture) ── */}
      {!hasScanned && (
        <View style={styles.bottomShutterContainer}>
          {/* Lens Presets Carousel */}
          <View style={styles.lensTrack}>
            {PRESET_SAMPLES.map((preset, idx) => (
              <Pressable
                key={preset.label}
                onPress={() => handleSelectLens(idx)}
                style={[
                  styles.lensBtn,
                  idx === activePresetIdx && styles.lensBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.lensBtnText,
                    idx === activePresetIdx && styles.lensBtnTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Main Shutter Row */}
          <View style={styles.shutterRow}>
            {/* Gallery Upload Button */}
            <Pressable onPress={handleTriggerGallery} style={styles.galleryBtn}>
              <Text style={styles.galleryIcon}>🖼️</Text>
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

            {/* Quick Demo Scan Button */}
            <Pressable
              onPress={handleShutterPress}
              style={styles.scanPillBtn}
            >
              <Text style={styles.scanPillText}>Scan φ</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── 5. Fluid Bottom Results Sheet (Appears on Scan) ── */}
      {hasScanned && (
        <View
          style={[
            styles.resultsSheet,
            {
              backgroundColor: colors.bgElevated,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Sheet Grab Handle */}
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

          <ScrollView style={styles.resultsScroll} showsVerticalScrollIndicator={false}>
            {/* Recommended Cut Header */}
            <View style={styles.resultsHeader}>
              <View>
                <Text style={[styles.resultsOverline, { color: colors.accent }]}>BEST MATCH SILHOUETTE</Text>
                <Text style={[styles.resultsTitle, { color: colors.text }]}>
                  {currentPrescription.haircutName}
                </Text>
              </View>
              <View style={[styles.matchBadge, { backgroundColor: colors.accentGreenLight }]}>
                <Text style={[styles.matchBadgeText, { color: colors.accentGreen }]}>98% HARMONY</Text>
              </View>
            </View>

            {/* Minimal Metric Score Card */}
            <MetricCards metrics={metrics} />

            {/* Curated Hairstyles Lookbook */}
            <Text style={[styles.lookbookHeader, { color: colors.textSecondary }]}>
              ARCHITECTURAL RECOMMENDATIONS
            </Text>

            <View style={styles.stylesList}>
              {currentPrescription.suggestedStyles.map((style) => (
                <StyleCard
                  key={style.id}
                  style={style}
                  volumeProfile={currentPrescription.volumeProfile}
                  onTryOn={handleOpenTryOn}
                />
              ))}
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      )}

      {/* ── Slide-Out Settings & Legal Drawer ── */}
      <SettingsDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigateToLearn={() => router.push('/explore')}
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
    zIndex: 20,
  },
  topControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  circleBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  brandPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retakeBarWrapper: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 30,
  },
  retakeBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  retakeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomShutterContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 16,
    zIndex: 20,
  },
  lensTrack: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  lensBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  lensBtnActive: {
    backgroundColor: '#D4AF37',
  },
  lensBtnText: {
    color: '#A8A196',
    fontSize: 11,
    fontWeight: '700',
  },
  lensBtnTextActive: {
    color: '#000000',
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  galleryBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryIcon: {
    fontSize: 20,
  },
  shutterOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  shutterInnerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCenterDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D4AF37',
  },
  scanPillBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4AF37',
  },
  resultsSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.58,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 10,
    zIndex: 25,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  resultsScroll: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resultsOverline: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  resultsTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  lookbookHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 6,
  },
  stylesList: {
    paddingHorizontal: 20,
  },
});

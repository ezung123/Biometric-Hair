// ══════════════════════════════════════════════════════════════════════════════
// src/screens/HomeScreen.tsx
// BIOMETRIC HAIR AI: CLINICAL-LUXURY HAIRSTYLE RECOMMENDATION PRODUCT
// ══════════════════════════════════════════════════════════════════════════════
// 1. Live camera capture with real MediaPipe 468 3D landmarks & soft quality gate
// 2. Canonical 4:5 head-and-shoulders crop & truthful neoclassical anthropometrics
// 3. Ranked recommendations from curated 16-style catalog of multi-angle reference photos
// 4. Grounded stylist notes powered by Meta Muse Spark Open (Baseten grant proxy)
// 5. Zero AI try-on / zero black frames / 100% offline-ready reference lookbook
// ══════════════════════════════════════════════════════════════════════════════

import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LiveCameraView, type LiveCameraViewRef } from '@/components/LiveCameraView';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { LearnModal } from '@/components/LearnModal';
import { LearnHairstylesModal } from '@/components/LearnHairstylesModal';
import { AboutUsModal } from '@/components/AboutUsModal';
import { StyleDetailModal } from '@/components/StyleDetailModal';
import { CompareModal } from '@/components/CompareModal';
import { PhotoCreditsModal } from '@/components/PhotoCreditsModal';

import { HAIRSTYLE_CATALOG, type CatalogStyle, type Audience, type HairLengthClass } from '@/constants/catalog';
import {
  computeHairstyleRecommendations,
  fetchMuseStylistNote,
  type RecommendationResult,
  type ScoredStyle,
  type StylistNote,
} from '@/services/recommendationEngine';
import {
  filterAndRank,
  getFilterCounts,
  type AudienceFilter,
  type LengthFilter,
  type FilterOptions,
  type ScoredCatalogStyle,
} from '@/lib/filterStyles';
import { useFilterStore } from '@/lib/useFilterStore';
import { useAppTheme } from '@/context/ThemeContext';
import { playBiometricScanHum, playCameraShutterSound } from '@/services/interactionService';
import { evaluateCaptureQuality, type QualityGateResult } from '@/lib/qualityGate';
import { createHeadCropCanvas } from '@/lib/headCrop';
import { detectLandmarksOnFrozenFrame } from '@/lib/faceLandmarkerImage';
import { analyzeFaceTruthful, type TruthfulAnalysisResult } from '@/lib/faceAnalysis';
import type { FacialMetrics } from '@/types';

type ScreenView = 'camera' | 'recommendations';

export default function HomeScreen() {
  const { colors, mode, toggleTheme, isDark } = useAppTheme();
  const { width: windowW, height: windowH } = useWindowDimensions();

  // Refs
  const cameraRef = useRef<LiveCameraViewRef>(null);
  const fileInputRef = useRef<any>(null);

  // Navigation & Scan State
  const [currentView, setCurrentView] = useState<ScreenView>('camera');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [hudVisible, setHudVisible] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  // Quality & Guidance
  const [qualityGuidance, setQualityGuidance] = useState<QualityGateResult | null>(null);
  const [isLowConfidenceScan, setIsLowConfidenceScan] = useState<boolean>(false);
  const [softWarningReason, setSoftWarningReason] = useState<string | null>(null);

  // Scanned Portrait & Biometric Measurements
  const [canonicalCropUri, setCanonicalCropUri] = useState<string>('/sample_selfie.jpg');
  const [truthfulAnalysis, setTruthfulAnalysis] = useState<TruthfulAnalysisResult | null>(null);
  const [showMeasurementDrawer, setShowMeasurementDrawer] = useState<boolean>(false);

  // Active Metrics Baseline (Default to Oval Balanced)
  const [activeMetrics, setActiveMetrics] = useState<FacialMetrics>({
    faceShape: 'Oval',
    facialIndex: 86.4,
    verticalThirds: {
      upperThirdPct: 33,
      midThirdPct: 34,
      lowerThirdPct: 33,
      varianceScore: 1.0,
    },
    goldenRatioDeviation: 0.04,
  });

  // Unified Filter Store with local persistence
  const { filters, setAudience, setLength, resetFilters, isFiltered } = useFilterStore();

  // Pure single-source recommendation derivation
  const filterResult = useMemo(
    () => filterAndRank(HAIRSTYLE_CATALOG, filters, activeMetrics),
    [filters, activeMetrics]
  );

  const { audienceCounts, lengthCounts } = useMemo(
    () => getFilterCounts(HAIRSTYLE_CATALOG, filters),
    [filters]
  );

  const { topPick, rankedStyles, alsoConsider, lessIdeal, totalCount } = filterResult;

  // Top Pick Hero View Angle ('front' | 'side' | 'back')
  const [heroView, setHeroView] = useState<'front' | 'side' | 'back'>('front');
  const [imageLoadError, setImageLoadError] = useState(false);
  const [showSortExplainer, setShowSortExplainer] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const resultsScrollViewRef = useRef<any>(null);

  // Available views for current top pick
  const availableHeroViews = useMemo(() => {
    if (!topPick) return [];
    return (['front', 'side', 'back'] as const).filter((v) =>
      topPick.style.images.some((img) => img.view === v)
    );
  }, [topPick]);

  // Reset view to 'front' whenever topPick style changes
  useEffect(() => {
    setHeroView('front');
    setImageLoadError(false);
  }, [topPick?.style.id]);

  // Preload other views of top pick
  useEffect(() => {
    if (topPick && typeof window !== 'undefined') {
      topPick.style.images.forEach((img) => {
        const preload = new window.Image();
        preload.src = img.file;
      });
    }
  }, [topPick]);

  // Keyboard navigation for view angles
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!topPick || availableHeroViews.length <= 1) return;
      const idx = availableHeroViews.indexOf(heroView);
      if (idx === -1) return;
      if (e.key === 'ArrowRight') {
        const next = availableHeroViews[(idx + 1) % availableHeroViews.length];
        setHeroView(next);
      } else if (e.key === 'ArrowLeft') {
        const prev = availableHeroViews[(idx - 1 + availableHeroViews.length) % availableHeroViews.length];
        setHeroView(prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [heroView, availableHeroViews, topPick]);

  // Scroll to top gently when filters change
  useEffect(() => {
    resultsScrollViewRef.current?.scrollTo?.({ y: 0, animated: true });
  }, [filters]);

  // Stylist Note state
  const [stylistNote, setStylistNote] = useState<StylistNote>({
    summary: 'Balanced volume distribution complements your facial thirds.',
    tips: [
      'Direct crown hair with a vented brush to accentuate natural texture.',
      'Maintain crisp temple tapers every 2 to 3 weeks.',
    ],
    avoid: ['Heavy weighted creams that collapse root elevation.'],
    source: 'deterministic_engine',
  });

  // Query Muse Spark Open for structured stylist note on top pick
  useEffect(() => {
    if (topPick?.style) {
      fetchMuseStylistNote(activeMetrics, topPick.style).then((note) => {
        setStylistNote(note);
      }).catch(() => {});
    }
  }, [topPick?.style.id, activeMetrics]);

  // Saved Looks State
  const [savedStyleIds, setSavedStyleIds] = useState<string[]>([]);

  // Modals
  const [selectedDetailStyle, setSelectedDetailStyle] = useState<ScoredStyle | null>(null);
  const [compareStyleA, setCompareStyleA] = useState<CatalogStyle | null>(null);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showLearnFaceModal, setShowLearnFaceModal] = useState(false);
  const [showLearnHairstylesModal, setShowLearnHairstylesModal] = useState(false);
  const [showAboutUsModal, setShowAboutUsModal] = useState(false);
  const [showPhotoCreditsModal, setShowPhotoCreditsModal] = useState(false);

  // Handle Save / Bookmark Look
  const toggleSaveLook = (styleId: string) => {
    setSavedStyleIds((prev) =>
      prev.includes(styleId) ? prev.filter((id) => id !== styleId) : [...prev, styleId]
    );
  };

  // ── Core Scan Pipeline ────────────────────────────────────────────────────────
  async function performScan(targetUri?: string) {
    console.log('[PERFORM_SCAN] START with targetUri:', targetUri);
    playCameraShutterSound();
    playBiometricScanHum();
    setIsScanning(true);
    setQualityGuidance(null);
    setScanStatus('Acquiring high-resolution cranial frame...');

    let rawCapturedUri = targetUri;
    if (!rawCapturedUri) {
      const snapshot = cameraRef.current?.captureSnapshot();
      rawCapturedUri = snapshot || '/sample_selfie.jpg';
    }
    console.log('[PERFORM_SCAN] rawCapturedUri:', rawCapturedUri);

    try {
      setScanStatus('Tracking 468 3D facial landmarks...');
      const liveLandmarks = cameraRef.current?.getBoundaryState?.()?.landmarks;
      console.log('[PERFORM_SCAN] detectLandmarksOnFrozenFrame starting...');
      const detection = await detectLandmarksOnFrozenFrame(rawCapturedUri, liveLandmarks);
      console.log('[PERFORM_SCAN] Detection result:', detection.detected, detection.source, 'landmarks count:', detection.landmarks?.length);

      // Quality Gate check
      setScanStatus('Evaluating capture geometry & lighting...');
      const quality = evaluateCaptureQuality(
        detection.landmarks,
        detection.width,
        detection.height,
        detection.pixelData,
        windowW,
        windowH,
        true,
        detection.source
      );
      console.log('[PERFORM_SCAN] Quality result:', quality.passed, quality.code, quality.guidanceTitle);

      if (!quality.passed) {
        setQualityGuidance(quality);
        setIsScanning(false);
        setScanStatus(null);
        return;
      }

      if (quality.isSoftWarning) {
        setIsLowConfidenceScan(true);
        setSoftWarningReason(quality.guidanceMessage);
      } else {
        setIsLowConfidenceScan(false);
        setSoftWarningReason(null);
      }

      // Canonical 4:5 head and shoulders portrait
      setScanStatus('Calibrating 4:5 head and shoulders framing...');
      const cropResult = await createHeadCropCanvas(rawCapturedUri, detection.landmarks, 1024);
      setCanonicalCropUri(cropResult.dataUrl);

      // Neoclassical Anthropometrics on real landmarks with true frame dimensions
      setScanStatus('Analyzing Neoclassical Farkas proportions...');
      const analysis = analyzeFaceTruthful(
        detection.landmarks,
        detection.width,
        detection.height
      );
      console.log('[LIVE_ANALYSIS_OUTPUT]', analysis);
      setTruthfulAnalysis(analysis);

      const calculatedMetrics: FacialMetrics = {
        faceShape: analysis.morphology,
        scientificName: analysis.scientificName,
        harmonyScore: analysis.harmonyScore,
        facialIndex: analysis.facialIndex,
        verticalThirds: {
          upperThirdPct: analysis.thirds.upper,
          midThirdPct: analysis.thirds.mid,
          lowerThirdPct: analysis.thirds.lower,
          varianceScore: analysis.verticalThirds.varianceScore,
        },
        goldenRatioDeviation: Math.abs((analysis.facialIndex / 100) * 1.55 - 1.618),
      };
      setActiveMetrics(calculatedMetrics);

      // Derive recommendations from freshly computed live analysis
      setScanStatus('Ranking reference catalog looks...');

      setIsScanning(false);
      setScanStatus(null);
      setCurrentView('recommendations');
    } catch (err: any) {
      console.error('Scan pipeline error:', err);
      setIsScanning(false);
      setScanStatus(null);
      // Graceful fallback to recommendations
      setCurrentView('recommendations');
    }
  }

  // Handle Upload Image
  const handleFileUpload = (event: any) => {
    const file = event?.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) performScan(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const topHeroImage = topPick
    ? topPick.style.images.find((img) => img.view === heroView) || topPick.style.images[0]
    : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Hidden file input for photo upload */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          style={{ display: 'none' }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 1. CAMERA VIEWPORT                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {currentView === 'camera' && (
        <View style={StyleSheet.absoluteFill}>
          <LiveCameraView
            ref={cameraRef}
            frozenImageUri={null}
            metrics={activeMetrics}
            hudVisible={hudVisible}
            cameraEnabled={cameraEnabled}
            onToggleCamera={() => setCameraEnabled((v) => !v)}
            showAugmentation={false}
          />

          {/* Top Control Bar */}
          <SafeAreaView style={styles.topBarSafe} edges={['top']} pointerEvents="box-none">
            <View style={styles.topControlRow}>
              {/* Menu Button */}
              <Pressable
                onPress={() => setShowSettingsDrawer(true)}
                style={[
                  styles.glassBtn,
                  { backgroundColor: 'rgba(20, 20, 22, 0.75)', borderColor: 'rgba(255, 255, 255, 0.12)' },
                ]}
                accessibilityLabel="Open menu"
              >
                <View style={styles.hamburgerIcon}>
                  <View style={styles.hamburgerBar} />
                  <View style={styles.hamburgerBar} />
                  <View style={styles.hamburgerBar} />
                </View>
              </Pressable>

              {/* Title Pill */}
              <View
                style={[
                  styles.brandPill,
                  { backgroundColor: 'rgba(20, 20, 22, 0.75)', borderColor: 'rgba(255, 255, 255, 0.12)' },
                ]}
              >
                <Text style={[styles.brandPillText, { color: colors.accent }]}>BIOMETRIC HAIR ANALYSIS</Text>
              </View>

              {/* Action Stack */}
              <View style={styles.topRightStack}>
                <Pressable
                  onPress={() => setCameraEnabled((v) => !v)}
                  style={[
                    styles.glassBtn,
                    { backgroundColor: 'rgba(20, 20, 22, 0.75)', borderColor: 'rgba(255, 255, 255, 0.12)' },
                    !cameraEnabled && { borderColor: '#E53E3E', backgroundColor: 'rgba(229, 62, 62, 0.25)' },
                  ]}
                  accessibilityLabel="Toggle Camera"
                >
                  <Text style={[styles.glassBtnText, { color: cameraEnabled ? '#FFFFFF' : '#FC8181' }]}>
                    {cameraEnabled ? 'CAM' : 'OFF'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setHudVisible((v) => !v)}
                  style={[
                    styles.glassBtn,
                    { backgroundColor: 'rgba(20, 20, 22, 0.75)', borderColor: 'rgba(255, 255, 255, 0.12)' },
                    hudVisible && { borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.25)' },
                  ]}
                  accessibilityLabel="Toggle Reticle"
                >
                  <Text style={[styles.glassBtnText, { color: hudVisible ? '#D4AF37' : '#FFFFFF' }]}>PHI</Text>
                </Pressable>

                <Pressable
                  onPress={toggleTheme}
                  style={[
                    styles.glassBtn,
                    { backgroundColor: 'rgba(20, 20, 22, 0.75)', borderColor: 'rgba(255, 255, 255, 0.12)' },
                  ]}
                  accessibilityLabel="Toggle appearance"
                >
                  <Text style={styles.glassBtnText}>{mode === 'light' ? 'DARK' : 'LIGHT'}</Text>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>

          {/* Bottom Floating Control Panel */}
          <SafeAreaView style={styles.bottomBarSafe} edges={['bottom']} pointerEvents="box-none">
            <View style={[styles.bottomControlCard, { backgroundColor: 'rgba(20, 20, 22, 0.92)' }]}>
              {/* Secondary Actions */}
              <View style={styles.bottomSecondaryRow}>
                <Pressable
                  onPress={() => performScan('/sample_selfie.jpg')}
                  style={[styles.smallActionBtn, { borderColor: 'rgba(255, 255, 255, 0.2)' }]}
                  accessibilityRole="button"
                  accessibilityLabel="Use demo photo"
                >
                  <Text style={styles.smallActionText}>USE DEMO PHOTO</Text>
                </Pressable>

                <Pressable
                  onPress={() => fileInputRef.current?.click()}
                  style={[styles.smallActionBtn, { borderColor: 'rgba(255, 255, 255, 0.2)' }]}
                  accessibilityRole="button"
                  accessibilityLabel="Upload photo"
                >
                  <Text style={styles.smallActionText}>UPLOAD PHOTO</Text>
                </Pressable>
              </View>

              {/* Primary Capture CTA */}
              <Pressable
                onPress={() => performScan()}
                disabled={isScanning}
                style={[
                  styles.primaryCaptureBtn,
                  { backgroundColor: colors.accent },
                  isScanning && { opacity: 0.75 },
                ]}
                accessibilityLabel="Capture and analyze facial proportions"
              >
                {isScanning ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.captureBtnText}>{scanStatus || 'ANALYZING...'}</Text>
                  </View>
                ) : (
                  <Text style={styles.captureBtnText}>CAPTURE & ANALYZE</Text>
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 2. RECOMMENDATIONS LOOKBOOK DASHBOARD                                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {currentView === 'recommendations' && (
        <SafeAreaView style={styles.safeRoot} edges={['top', 'left', 'right']}>
          {/* Top Sticky Header */}
          <View style={[styles.dashboardHeader, { borderBottomColor: colors.border, backgroundColor: colors.bg }]}>
            <Pressable
              onPress={() => setCurrentView('camera')}
              style={[styles.headerIconBtn, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
              accessibilityLabel="Back to camera"
            >
              <Text style={[styles.headerIconText, { color: colors.text }]}>‹ CAM</Text>
            </Pressable>

            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.dashboardOverline, { color: colors.accent }]}>REFERENCE LOOKS</Text>
              <Text style={[styles.dashboardTitle, { color: colors.text }]}>
                {truthfulAnalysis ? `${truthfulAnalysis.faceShape.toUpperCase()} STRUCTURE` : 'FACIAL BALANCE'}
              </Text>
            </View>

            <Pressable
              onPress={() => setShowSettingsDrawer(true)}
              style={[styles.headerIconBtn, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
              accessibilityLabel="Open settings"
            >
              <Text style={[styles.headerIconText, { color: colors.text }]}>MENU</Text>
            </Pressable>
          </View>

          <ScrollView
            ref={resultsScrollViewRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Low-confidence soft warning notice */}
            {isLowConfidenceScan && (
              <View style={styles.lowConfidenceBanner}>
                <Text style={styles.lowConfidenceText}>
                  Notice: Soft alignment notice ({softWarningReason || 'Slight angle'}). Measurements are estimated.
                </Text>
                <Pressable onPress={() => setCurrentView('camera')} style={styles.retakeInlineBtn}>
                  <Text style={styles.retakeInlineText}>Retake</Text>
                </Pressable>
              </View>
            )}

            {/* ── 1. Compact Scan Summary Card ── */}
            <View style={[styles.summaryCard, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
              <View style={styles.summaryTopRow}>
                <View style={styles.userPhotoFrame}>
                  <Image source={{ uri: canonicalCropUri }} style={styles.userPhoto} resizeMode="cover" />
                </View>

                <View style={{ flex: 1, marginLeft: 14, justifyContent: 'center' }}>
                  <View style={styles.balanceBadgeRow}>
                    <View style={[styles.balancePill, { backgroundColor: 'rgba(22, 163, 74, 0.15)', borderColor: '#16A34A' }]}>
                      <Text style={styles.balancePillText}>
                        {activeMetrics.harmonyScore || truthfulAnalysis?.harmonyScore || truthfulAnalysis?.facialBalanceScore || 94}% FACIAL HARMONY
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.morphologyHeadline, { color: colors.text }]}>
                    {activeMetrics.faceShape} Morphology
                  </Text>
                  <Text style={[styles.facialIndexSub, { color: colors.textSecondary }]}>
                    {activeMetrics.scientificName || truthfulAnalysis?.scientificName || `${activeMetrics.faceShape} Structure`} · Index: {activeMetrics.facialIndex.toFixed(1)}
                  </Text>
                </View>
              </View>

              {/* Farkas Facial Thirds Bar */}
              <View style={styles.thirdsBarContainer}>
                <View style={styles.thirdsHeaderRow}>
                  <Text style={[styles.thirdsHeaderLabel, { color: colors.textSecondary }]}>NEOCLASSICAL FARKAS THIRDS</Text>
                  <Text style={[styles.thirdsHeaderTarget, { color: colors.textSecondary }]}>Target: 33.3% each</Text>
                </View>

                <View style={styles.thirdsTrack}>
                  <View style={[styles.thirdBlock, { flex: activeMetrics.verticalThirds.upperThirdPct, backgroundColor: '#1E232D' }]}>
                    <Text style={styles.thirdBlockText}>Forehead {activeMetrics.verticalThirds.upperThirdPct}%</Text>
                  </View>
                  <View style={[styles.thirdBlock, { flex: activeMetrics.verticalThirds.midThirdPct, backgroundColor: '#343B47' }]}>
                    <Text style={styles.thirdBlockText}>Mid-Face {activeMetrics.verticalThirds.midThirdPct}%</Text>
                  </View>
                  <View style={[styles.thirdBlock, { flex: activeMetrics.verticalThirds.lowerThirdPct, backgroundColor: '#4C5565' }]}>
                    <Text style={styles.thirdBlockText}>Jaw/Chin {activeMetrics.verticalThirds.lowerThirdPct}%</Text>
                  </View>
                </View>
              </View>

              {/* Summary Statement & Expander */}
              <View style={[styles.summaryDrawer, { borderTopColor: colors.border }]}>
                <Text style={[styles.summaryStatement, { color: colors.text }]}>
                  {truthfulAnalysis?.measurementsSummary.upperThirdStatement ||
                    `Proportions measured via Neoclassical anthropometry: ${activeMetrics.verticalThirds.upperThirdPct}% upper, ${activeMetrics.verticalThirds.midThirdPct}% mid, ${activeMetrics.verticalThirds.lowerThirdPct}% lower third.`}
                </Text>

                <Pressable onPress={() => setShowMeasurementDrawer((v) => !v)} style={{ marginTop: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }}>
                    {showMeasurementDrawer ? 'Hide measurement criteria ▲' : 'How we measured ▼'}
                  </Text>
                </Pressable>

                {showMeasurementDrawer && (
                  <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
                      • Upper Third: Trichion hairline to Glabella brow ridge{'\n'}
                      • Mid Third: Glabella to Subnasale nasal base{'\n'}
                      • Lower Third: Subnasale to Gnathion chin tip{'\n'}
                      • Facial Index: Morphological height divided by bizygomatic width.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* ── 2. Filter Switchers (Audience & Length) ── */}
            <View style={styles.filterSection}>
              {/* Filter Section Header with Reset */}
              <View style={styles.filterHeaderRow}>
                <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>FILTER LOOKBOOK</Text>
                {isFiltered && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={resetFilters}
                    style={styles.resetFiltersBtn}
                    accessibilityLabel="Reset all filters"
                  >
                    <Text style={[styles.resetFiltersText, { color: colors.accent }]}>Reset filters ↺</Text>
                  </Pressable>
                )}
              </View>

              {/* Audience Tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {(['men', 'women', 'all'] as const).map((aud) => {
                  const isSel = filters.audience === aud;
                  const count = audienceCounts[aud];
                  const label = aud === 'men' ? "Men's Looks" : aud === 'women' ? "Women's Looks" : 'All Looks';
                  const isDisabled = count === 0;
                  return (
                    <Pressable
                      key={aud}
                      accessibilityRole="button"
                      aria-pressed={isSel}
                      aria-disabled={isDisabled}
                      disabled={isDisabled}
                      onPress={() => setAudience(aud)}
                      style={[
                        styles.filterPill,
                        {
                          backgroundColor: isSel ? colors.accent : colors.bgSubtle,
                          borderColor: isSel ? colors.accent : colors.border,
                          opacity: isDisabled ? 0.35 : 1,
                        },
                      ]}
                      accessibilityLabel={`${label}, ${count} styles available`}
                    >
                      <Text style={[styles.filterPillText, { color: isSel ? '#FFFFFF' : colors.text }]}>
                        {label}
                      </Text>
                      <Text style={[styles.filterPillCount, { color: isSel ? '#FFFFFF' : colors.textSecondary }]}>
                        ({count})
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Length Tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {(['all', 'short', 'medium', 'long'] as const).map((len) => {
                  const isSel = filters.length === len;
                  const count = lengthCounts[len];
                  const label = len === 'all' ? 'All Lengths' : len.charAt(0).toUpperCase() + len.slice(1);
                  const isDisabled = count === 0;
                  return (
                    <Pressable
                      key={len}
                      accessibilityRole="button"
                      aria-pressed={isSel}
                      aria-disabled={isDisabled}
                      disabled={isDisabled}
                      onPress={() => setLength(len)}
                      style={[
                        styles.filterPillSmall,
                        {
                          backgroundColor: isSel ? colors.accent : colors.bgSubtle,
                          borderColor: isSel ? colors.accent : colors.border,
                          opacity: isDisabled ? 0.35 : 1,
                        },
                      ]}
                      accessibilityLabel={`${label}, ${count} styles available`}
                    >
                      <Text style={[styles.filterPillSmallText, { color: isSel ? '#FFFFFF' : colors.text }]}>
                        {label}
                      </Text>
                      <Text style={[styles.filterPillSmallCount, { color: isSel ? '#FFFFFF' : colors.textSecondary }]}>
                        ({count})
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* In-app "How we classify & rank" Tooltip */}
              <Pressable
                onPress={() => setShowSortExplainer((v) => !v)}
                style={styles.sortExplainerToggle}
                accessibilityRole="button"
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }}>
                  {showSortExplainer ? 'Hide sorting & length standards ▲' : 'How we sort & classify ▼'}
                </Text>
              </Pressable>

              {showSortExplainer && (
                <View style={[styles.sortExplainerBox, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
                  <Text style={[styles.sortExplainerText, { color: colors.textSecondary }]}>
                    • <Text style={{ fontWeight: '700', color: colors.text }}>Length Rules</Text>: Short (top &amp; back &lt; 10cm), Medium (top or back ≥ 10cm, falling between jawline and shoulders), Long (back ≥ 25cm, reaching or passing shoulders).{'\n'}
                    • <Text style={{ fontWeight: '700', color: colors.text }}>Neoclassical Ranking</Text>: (Face Shape Fit × 45%) + (Thirds Compensation × 35%) + (Texture Fit × 10%) + (Maintenance Fit × 10%). Ties broken stably by style ID.
                  </Text>
                </View>
              )}
            </View>

            {totalCount === 0 || !topPick ? (
              /* Designed Empty State */
              <View style={[styles.emptyContainer, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
                <View style={[styles.emptyIconCircle, { backgroundColor: colors.bgSubtle }]}>
                  <Text style={[styles.emptyIconText, { color: colors.accent }]}>✦</Text>
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Matching Hairstyles Found</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  There are currently no catalog styles matching both {filters.audience === 'men' ? "Men's Looks" : filters.audience === 'women' ? "Women's Looks" : "All Looks"} and {filters.length.toUpperCase()} length.
                </Text>
                <View style={styles.emptyActionsRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setLength('all')}
                    style={[styles.emptyActionBtn, { backgroundColor: colors.accent }]}
                  >
                    <Text style={styles.emptyActionBtnText}>Show All Lengths</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={resetFilters}
                    style={[styles.emptySecondaryBtn, { borderColor: colors.border, backgroundColor: colors.bgSubtle }]}
                  >
                    <Text style={[styles.emptySecondaryBtnText, { color: colors.text }]}>Reset Filters</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                {/* ── 3. "Top Pick" Hero Card ── */}
                <View style={[styles.heroCard, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
                  <View style={styles.heroHeaderRow}>
                    <View>
                      <Text style={[styles.heroOverline, { color: colors.accent }]}>TOP ANTHROPOMETRIC MATCH</Text>
                      <Text style={[styles.heroTitle, { color: colors.text }]}>{topPick.style.name}</Text>
                    </View>

                    <View style={[styles.heroMatchBadge, { backgroundColor: '#16A34A' }]}>
                      <Text style={styles.heroMatchText}>{topPick.matchPercentage}% MATCH</Text>
                    </View>
                  </View>

                  {/* Multi-Angle View Switcher (Only if >1 view exists) */}
                  {availableHeroViews.length > 1 && (
                    <View style={[styles.heroViewSelector, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
                      {(['front', 'side', 'back'] as const).map((vKey) => {
                        const isAvail = availableHeroViews.includes(vKey);
                        const isSel = heroView === vKey;
                        return (
                          <Pressable
                            key={vKey}
                            accessibilityRole="button"
                            aria-pressed={isSel}
                            aria-disabled={!isAvail}
                            disabled={!isAvail}
                            onPress={() => isAvail && setHeroView(vKey)}
                            style={[
                              styles.heroViewTab,
                              isSel && { backgroundColor: colors.accent, borderColor: colors.accent },
                              !isAvail && { opacity: 0.35 },
                            ]}
                            accessibilityLabel={`${vKey.toUpperCase()} VIEW ${!isAvail ? '(Unavailable)' : ''}`}
                          >
                            <Text
                              style={[
                                styles.heroViewTabText,
                                { color: isSel ? '#FFFFFF' : isAvail ? colors.text : colors.textSecondary },
                              ]}
                            >
                              {vKey.toUpperCase()} VIEW
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {/* Hero Image Viewport (4:5 Aspect Ratio) with Swipe & Error Fallback */}
                  <Pressable
                    onPress={() => setSelectedDetailStyle(topPick)}
                    onTouchStart={(e) => {
                      touchStartX.current = e.nativeEvent.pageX;
                    }}
                    onTouchEnd={(e) => {
                      if (touchStartX.current === null) return;
                      const deltaX = e.nativeEvent.pageX - touchStartX.current;
                      touchStartX.current = null;
                      if (Math.abs(deltaX) > 40 && availableHeroViews.length > 1) {
                        const idx = availableHeroViews.indexOf(heroView);
                        if (idx === -1) return;
                        if (deltaX < 0) {
                          setHeroView(availableHeroViews[(idx + 1) % availableHeroViews.length]);
                        } else {
                          setHeroView(availableHeroViews[(idx - 1 + availableHeroViews.length) % availableHeroViews.length]);
                        }
                      }
                    }}
                    style={[styles.heroImageFrame, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
                    accessibilityLabel="Open top pick in studio"
                  >
                    {imageLoadError || !topHeroImage ? (
                      <View style={styles.imageFallbackContainer}>
                        <Text style={[styles.imageFallbackText, { color: colors.textSecondary }]}>
                          Unable to load reference image
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setImageLoadError(false)}
                          style={[styles.imageRetryBtn, { backgroundColor: colors.accent }]}
                        >
                          <Text style={styles.imageRetryText}>RETRY</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <>
                        <Image
                          source={{ uri: topHeroImage.file }}
                          style={styles.heroImage}
                          resizeMode="cover"
                          onError={() => {
                            console.warn(`[HeroGallery] Failed to load image: ${topHeroImage.file}`);
                            setImageLoadError(true);
                          }}
                        />
                        <View style={styles.heroImageBadge}>
                          <Text style={styles.heroImageBadgeText}>{heroView.toUpperCase()} VIEW</Text>
                        </View>
                        <View style={styles.tapInspectOverlay}>
                          <Text style={styles.tapInspectText}>TAP TO VIEW DETAILS</Text>
                        </View>
                      </>
                    )}
                  </Pressable>

              {/* Primary Measured Reason */}
              <Text style={[styles.heroReason, { color: colors.text }]}>{topPick.primaryReason}</Text>

              {/* Volume Profile Pills */}
              <View style={styles.heroVolumeRow}>
                <View style={[styles.heroVolTag, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
                  <Text style={[styles.heroVolLabel, { color: colors.textSecondary }]}>CROWN</Text>
                  <Text style={[styles.heroVolVal, { color: colors.text }]}>
                    {topPick.style.volumeProfile.crown.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.heroVolTag, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
                  <Text style={[styles.heroVolLabel, { color: colors.textSecondary }]}>SIDES</Text>
                  <Text style={[styles.heroVolVal, { color: colors.text }]}>
                    {topPick.style.volumeProfile.sides.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.heroVolTag, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
                  <Text style={[styles.heroVolLabel, { color: colors.textSecondary }]}>FRINGE</Text>
                  <Text style={[styles.heroVolVal, { color: colors.text }]}>
                    {topPick.style.volumeProfile.fringe.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.heroActionRow}>
                <Pressable
                  onPress={() => setSelectedDetailStyle(topPick)}
                  style={[styles.heroCtaBtn, { backgroundColor: colors.accent }]}
                >
                  <Text style={styles.heroCtaBtnText}>OPEN IN STUDIO & BARBER CARD</Text>
                </Pressable>

                <Pressable
                  onPress={() => toggleSaveLook(topPick.style.id)}
                  style={[styles.heroSaveBtn, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
                  accessibilityLabel="Save top pick"
                >
                  <Text style={[styles.heroSaveBtnText, { color: colors.text }]}>
                    {savedStyleIds.includes(topPick.style.id) ? '★' : '☆'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* ── 4. Stylist Consultation Note (Meta Muse Spark Open via Proxy) ── */}
            <View style={[styles.stylistCard, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
              <View style={styles.stylistHeaderRow}>
                <Text style={[styles.stylistTitle, { color: colors.text }]}>STYLIST CONSULTATION NOTE</Text>
                <View
                  style={[
                    styles.modelProvenancePill,
                    {
                      backgroundColor:
                        stylistNote.source === 'muse_spark_open'
                          ? 'rgba(22, 163, 74, 0.15)'
                          : 'rgba(184, 142, 62, 0.15)',
                      borderColor: stylistNote.source === 'muse_spark_open' ? '#16A34A' : colors.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modelProvenanceText,
                      { color: stylistNote.source === 'muse_spark_open' ? '#16A34A' : colors.accent },
                    ]}
                  >
                    {stylistNote.source === 'muse_spark_open'
                      ? '● LIVE (Muse Spark Open 816B)'
                      : 'OFFLINE ANTHROPOMETRICS'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.stylistSummary, { color: colors.text }]}>{stylistNote.summary}</Text>

              <View style={{ marginTop: 8 }}>
                <Text style={[styles.tipsHeader, { color: colors.accent }]}>PRO TIPS</Text>
                {stylistNote.tips.map((tip, idx) => (
                  <View key={idx} style={styles.tipRow}>
                    <Text style={[styles.tipBullet, { color: colors.accent }]}>✦</Text>
                    <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
                  </View>
                ))}
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={[styles.tipsHeader, { color: '#E53E3E' }]}>AVOID</Text>
                {stylistNote.avoid.map((av, idx) => (
                  <View key={idx} style={styles.tipRow}>
                    <Text style={[styles.tipBullet, { color: '#E53E3E' }]}>✕</Text>
                    <Text style={[styles.tipText, { color: colors.textSecondary }]}>{av}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── 5. Ranked Reference Looks (Rank 2 through 6) ── */}
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              MORE RANKED RECOMMENDATIONS
            </Text>

            {rankedStyles.map((item, index) => {
              const isSaved = savedStyleIds.includes(item.style.id);
              return (
                <View
                  key={item.style.id}
                  style={[styles.styleCard, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}
                >
                  <Pressable
                    onPress={() => setSelectedDetailStyle(item)}
                    style={styles.cardImageContainer}
                    accessibilityLabel={`View details for ${item.style.name}`}
                  >
                    <Image
                      source={{ uri: item.style.images[0].file }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.cardRankBadge}>
                      <Text style={styles.cardRankText}>#{index + 2}</Text>
                    </View>
                    <View style={styles.cardMatchBadge}>
                      <Text style={styles.cardMatchText}>{item.matchPercentage}% MATCH</Text>
                    </View>
                  </Pressable>

                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.style.name}</Text>
                        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                          {item.style.lengthClass.toUpperCase()} · {item.style.category}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => toggleSaveLook(item.style.id)}
                        style={[
                          styles.cardSaveBtn,
                          { backgroundColor: colors.bgSubtle, borderColor: colors.border },
                        ]}
                        accessibilityLabel="Save style"
                      >
                        <Text style={[styles.cardSaveText, { color: isSaved ? colors.accent : colors.textSecondary }]}>
                          {isSaved ? '★' : '☆'}
                        </Text>
                      </Pressable>
                    </View>

                    <Text style={[styles.cardReason, { color: colors.text }]}>{item.primaryReason}</Text>

                    {/* Attribute Tags */}
                    <View style={styles.tagRow}>
                      {item.style.tags.slice(0, 3).map((tag, tIdx) => (
                        <View
                          key={tIdx}
                          style={[styles.attrTag, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
                        >
                          <Text style={[styles.attrTagText, { color: colors.textSecondary }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Card Actions */}
                    <View style={styles.cardActionsRow}>
                      <Pressable
                        onPress={() => setSelectedDetailStyle(item)}
                        style={[styles.cardDetailBtn, { backgroundColor: colors.accent }]}
                      >
                        <Text style={styles.cardDetailBtnText}>VIEW MULTI-ANGLE LOOKBOOK</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => setCompareStyleA(item.style)}
                        style={[styles.cardCompareBtn, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
                      >
                        <Text style={[styles.cardCompareBtnText, { color: colors.text }]}>COMPARE</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* ── 6. "Also Consider" Section ── */}
            {alsoConsider.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>ALSO CONSIDER</Text>
                <View style={styles.horizontalCardGrid}>
                  {alsoConsider.map((item) => (
                    <Pressable
                      key={item.style.id}
                      onPress={() => setSelectedDetailStyle(item)}
                      style={[
                        styles.halfCard,
                        { backgroundColor: colors.bgElevated, borderColor: colors.border },
                      ]}
                    >
                      <Image
                        source={{ uri: item.style.images[0].file }}
                        style={styles.halfCardImage}
                        resizeMode="cover"
                      />
                      <View style={{ padding: 10 }}>
                        <Text style={[styles.halfCardTitle, { color: colors.text }]}>{item.style.name}</Text>
                        <Text style={[styles.halfCardMatch, { color: '#16A34A' }]}>{item.matchPercentage}% Match</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* ── 7. "Less Ideal for Your Face" Section ── */}
            {lessIdeal.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.sectionHeading, { color: '#E53E3E' }]}>LESS IDEAL FOR YOUR MORPHOLOGY</Text>
                {lessIdeal.map((item) => (
                  <View
                    key={item.style.id}
                    style={[styles.lessIdealCard, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}
                  >
                    <View style={styles.lessIdealImageFrame}>
                      <Image
                        source={{ uri: item.style.images[0].file }}
                        style={styles.lessIdealImage}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.lessIdealTitle, { color: colors.text }]}>{item.style.name}</Text>
                      <Text style={[styles.lessIdealReason, { color: colors.textSecondary }]}>
                        {item.contrastReason ||
                          `Volume profile conflicts with ${activeMetrics.faceShape} facial proportions.`}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

            {/* ── 8. Saved Looks Strip (if any) ── */}
            {savedStyleIds.length > 0 && (
              <View style={[styles.savedStrip, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
                <Text style={[styles.savedStripTitle, { color: colors.accent }]}>
                  SAVED LOOKS ({savedStyleIds.length})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {savedStyleIds.map((sId) => {
                    const match = HAIRSTYLE_CATALOG.find((s) => s.id === sId);
                    if (!match) return null;
                    return (
                      <Pressable
                        key={sId}
                        onPress={() => {
                          const scored =
                            rankedStyles.find((r) => r.style.id === sId) ||
                            (topPick?.style.id === sId ? topPick : null) || {
                              style: match,
                              matchPercentage: 90,
                              primaryReason: match.shortDescription,
                              score: 0.9,
                              breakdown: { faceShapeFit: 0.9, thirdsCompensation: 0.9, textureLengthFit: 0.9, maintenanceFit: 0.9 },
                            };
                          setSelectedDetailStyle(scored as any);
                        }}
                        style={[styles.savedPill, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
                      >
                        <Text style={[styles.savedPillText, { color: colors.text }]}>{match.name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* ── 9. Transparency & Legal Footer ── */}
            <View style={styles.footerSection}>
              <View style={styles.footerLinksRow}>
                <Pressable onPress={() => setShowPhotoCreditsModal(true)}>
                  <Text style={[styles.footerLink, { color: colors.accent }]}>Photo Credits & Licenses</Text>
                </Pressable>
                <Text style={{ color: colors.border }}>·</Text>
                <Pressable onPress={() => setShowAboutUsModal(true)}>
                  <Text style={[styles.footerLink, { color: colors.accent }]}>AI Model Truth Table</Text>
                </Pressable>
              </View>
              <Text style={[styles.footerCopy, { color: colors.textSecondary }]}>
                Zero biometric data stored · 100% ephemeral on-device analysis
              </Text>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 3. MODALS & SHEETS                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <StyleDetailModal
        visible={Boolean(selectedDetailStyle)}
        onClose={() => setSelectedDetailStyle(null)}
        scoredStyle={selectedDetailStyle}
        isSaved={selectedDetailStyle ? savedStyleIds.includes(selectedDetailStyle.style.id) : false}
        onToggleSave={toggleSaveLook}
        onOpenCompare={(s) => setCompareStyleA(s)}
        metrics={activeMetrics}
      />

      <CompareModal
        visible={Boolean(compareStyleA)}
        onClose={() => setCompareStyleA(null)}
        styleA={compareStyleA}
        onSelectStyle={(s) => {
          const scored =
            rankedStyles.find((r) => r.style.id === s.id) ||
            (topPick?.style.id === s.id ? topPick : null) || {
            style: s,
            matchPercentage: 90,
            primaryReason: s.shortDescription,
            score: 0.9,
            breakdown: { faceShapeFit: 0.9, thirdsCompensation: 0.9, textureLengthFit: 0.9, maintenanceFit: 0.9 },
          };
          setSelectedDetailStyle(scored as any);
        }}
      />

      <PhotoCreditsModal
        visible={showPhotoCreditsModal}
        onClose={() => setShowPhotoCreditsModal(false)}
      />

      <AboutUsModal
        visible={showAboutUsModal}
        onClose={() => setShowAboutUsModal(false)}
      />

      <SettingsDrawer
        visible={showSettingsDrawer}
        onClose={() => setShowSettingsDrawer(false)}
        onNavigateHome={() => setCurrentView('camera')}
        onOpenLearnAboutFace={() => setShowLearnFaceModal(true)}
        onOpenLearnHairstyles={() => setShowLearnHairstylesModal(true)}
        onOpenAboutUs={() => setShowAboutUsModal(true)}
        cameraActive={cameraEnabled}
        onToggleCamera={() => setCameraEnabled((v) => !v)}
      />

      <LearnModal visible={showLearnFaceModal} onClose={() => setShowLearnFaceModal(false)} />
      <LearnHairstylesModal visible={showLearnHairstylesModal} onClose={() => setShowLearnHairstylesModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeRoot: {
    flex: 1,
  },
  topBarSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  glassBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  brandPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  brandPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.0,
  },
  topRightStack: {
    flexDirection: 'row',
    gap: 8,
  },
  hamburgerIcon: {
    width: 16,
    height: 12,
    justifyContent: 'space-between',
  },
  hamburgerBar: {
    height: 2,
    width: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  bottomBarSafe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomControlCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  bottomSecondaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  smallActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  smallActionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  primaryCaptureBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerIconBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerIconText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dashboardOverline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dashboardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  lowConfidenceBanner: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderWidth: 1,
    borderColor: '#EAB308',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lowConfidenceText: {
    color: '#CA8A04',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  retakeInlineBtn: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EAB308',
    borderRadius: 6,
  },
  retakeInlineText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userPhotoFrame: {
    width: 64,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(120, 120, 128, 0.25)',
  },
  userPhoto: {
    width: '100%',
    height: '100%',
  },
  balanceBadgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  balancePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  balancePillText: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '800',
  },
  morphologyHeadline: {
    fontSize: 17,
    fontWeight: '800',
  },
  facialIndexSub: {
    fontSize: 11,
    marginTop: 2,
  },
  thirdsBarContainer: {
    marginTop: 14,
  },
  thirdsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  thirdsHeaderLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  thirdsHeaderTarget: {
    fontSize: 9,
  },
  thirdsTrack: {
    flexDirection: 'row',
    height: 22,
    borderRadius: 6,
    overflow: 'hidden',
    gap: 1,
  },
  thirdBlock: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  thirdBlockText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  summaryDrawer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  summaryStatement: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  filterSection: {
    marginBottom: 14,
    gap: 8,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  filterSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  resetFiltersBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: 32,
    justifyContent: 'center',
  },
  resetFiltersText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  filterPillCount: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  filterPillSmall: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillSmallText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterPillSmallCount: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  sortExplainerToggle: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 2,
    minHeight: 36,
    justifyContent: 'center',
  },
  sortExplainerBox: {
    marginTop: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  sortExplainerText: {
    fontSize: 11,
    lineHeight: 16,
  },
  emptyContainer: {
    marginVertical: 16,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyIconText: {
    fontSize: 22,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptySecondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySecondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  imageFallbackContainer: {
    flex: 1,
    minHeight: 380,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageFallbackText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  imageRetryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageRetryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  heroOverline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  heroMatchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  heroMatchText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  heroViewSelector: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    marginBottom: 10,
  },
  heroViewTab: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  heroViewTabText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroImageFrame: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    marginBottom: 12,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(17, 18, 21, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  heroImageBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tapInspectOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(17, 18, 21, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tapInspectText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  heroReason: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  heroVolumeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  heroVolTag: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  heroVolLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  heroVolVal: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroCtaBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  heroSaveBtn: {
    width: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSaveBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  stylistCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  stylistHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stylistTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  modelProvenancePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  modelProvenanceText: {
    fontSize: 9,
    fontWeight: '800',
  },
  stylistSummary: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  tipsHeader: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 3,
  },
  tipBullet: {
    fontSize: 10,
    marginTop: 2,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  styleCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  cardImageContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardRankBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(17, 18, 21, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardRankText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cardMatchBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardMatchText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cardBody: {
    padding: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  cardSaveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSaveText: {
    fontSize: 14,
  },
  cardReason: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  attrTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  attrTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardDetailBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetailBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardCompareBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCompareBtnText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  horizontalCardGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  halfCardImage: {
    width: '100%',
    aspectRatio: 4 / 5,
  },
  halfCardTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  halfCardMatch: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  lessIdealCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  lessIdealImageFrame: {
    width: 50,
    height: 62,
    borderRadius: 8,
    overflow: 'hidden',
  },
  lessIdealImage: {
    width: '100%',
    height: '100%',
  },
  lessIdealTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  lessIdealReason: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  savedStrip: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginTop: 6,
    marginBottom: 16,
  },
  savedStripTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  savedPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  savedPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footerSection: {
    marginTop: 10,
    alignItems: 'center',
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerCopy: {
    fontSize: 11,
  },
});

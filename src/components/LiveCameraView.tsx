// ══════════════════════════════════════════════════════════════════════════════
// LiveCameraView (Real-time 3D AR Head Tracking with 6-DOF Volumetric Motion)
// Automatically tracks natural Trichion hairline, skull contour, and 3D rotations:
// - Pitch (looking up/down)
// - Yaw (turning left/right)
// - Roll (tilting left/right)
// Renders True 3D Volumetric Hairstyle with Three.js WebGL & Anatomical Occluder.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { useAppTheme } from '@/context/ThemeContext';
import { BiometricOverlay } from './BiometricOverlay';
import { ARHairCanvas3D } from './ARHairCanvas3D';
import { initMediaPipe, trackHeadPose3D } from '@/services/mediapipeFaceTracker';
import { detectHairlineDecisionBoundary } from '@/services/hairlineDetector';
import { hairSegmenter } from '@/services/hairSegmentation';
import type { FacialMetrics } from '@/types';

export interface LiveCameraViewRef {
  captureSnapshot: () => string | null;
  startCamera: () => void;
  stopCamera: () => void;
  hasCameraStream: boolean;
}

interface LiveCameraViewProps {
  frozenImageUri: string | null;
  metrics: FacialMetrics;
  hudVisible: boolean;
  onCameraActive?: (active: boolean) => void;
  cameraEnabled?: boolean;
  onToggleCamera?: () => void;
  augmentedHairAsset?: any;
  activeStyleId?: string;
  showAugmentation?: boolean;
}

export const LiveCameraView = forwardRef<LiveCameraViewRef, LiveCameraViewProps>(
  (
    {
      frozenImageUri,
      metrics,
      hudVisible,
      onCameraActive,
      cameraEnabled = true,
      onToggleCamera,
      augmentedHairAsset,
      activeStyleId = 'textured-crop',
      showAugmentation = true,
    },
    ref
  ) => {
    const { colors, isDark } = useAppTheme();
    const { width: windowW } = useWindowDimensions();
    const [hasCameraStream, setHasCameraStream] = useState(false);
    const [cameraPermissionError, setCameraPermissionError] = useState(false);

    // 6-DOF 3D Head Pose & Hairline State
    const [boundaryState, setBoundaryState] = useState<{
      hairlinePctY: number;  // Exact natural hairline line (Trichion)
      centerPctX: number;    // Exact skull center X
      skullWidthPx: number;  // Calculated width of the cranium in screen pixels
      pitchRad: number;      // 3D Pitch rotation
      yawRad: number;        // 3D Yaw rotation
      rollRad: number;       // 3D Roll rotation
      swayX: number;         // Dynamic inertia physics
      depthZ: number;        // 3D Depth distance
      confidence: number;    // Detection confidence score
      landmarks?: Array<{ x: number; y: number; z?: number }>;
    }>({
      hairlinePctY: 28.0,
      centerPctX: 50.0,
      skullWidthPx: 270,
      pitchRad: 0,
      yawRad: 0,
      rollRad: 0,
      swayX: 0,
      depthZ: 0,
      confidence: 0,
      landmarks: undefined,
    });

    const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({
      width: 640,
      height: 480,
    });

    const lastBoundaryRef = useRef<{ x: number; y: number; time: number }>({
      x: 50.0,
      y: 22.0,
      time: Date.now(),
    });
    const hairPhysicsVelocity = useRef<number>(0);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const feedCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const renderAnimFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const trackingCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const trackingIntervalRef = useRef<any>(null);

    async function requestWebcamStream(): Promise<MediaStream> {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Webcam API is not supported in this browser.');
      }

      try {
        return await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err1) {
        console.warn('[Camera] Tier 1 failed, trying generic video constraint:', err1);
      }

      try {
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err2) {
        console.warn('[Camera] Tier 2 failed, trying standard resolution:', err2);
      }

      return await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
    }

    const attachStreamToVideo = useCallback((stream: MediaStream | null) => {
      const video = videoRef.current;
      if (!video) return;

      if (stream) {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.autoplay = true;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
          }
          video.play().catch((e) => console.log('[Camera] Autoplay waiting:', e));
        };
        video.play().catch(() => {});
      } else {
        video.srcObject = null;
      }
    }, []);

    const setVideoElement = useCallback(
      (node: HTMLVideoElement | null) => {
        videoRef.current = node;
        if (node && streamRef.current) {
          attachStreamToVideo(streamRef.current);
        }
      },
      [attachStreamToVideo]
    );

    async function startCamera() {
      if (Platform.OS !== 'web') return;

      setCameraPermissionError(false);
      // Pre-warm MediaPipe FaceLandmarker and Multi-Class Hair Segmenter pipelines
      initMediaPipe().catch(() => {});
      hairSegmenter.initialize().catch(() => {});

      try {
        const stream = await requestWebcamStream();
        streamRef.current = stream;
        setHasCameraStream(true);
        onCameraActive?.(true);
        attachStreamToVideo(stream);
      } catch (err: any) {
        console.warn('[Camera] getUserMedia failed:', err);
        setHasCameraStream(false);
        setCameraPermissionError(true);
        onCameraActive?.(false);
      }
    }

    function stopCamera() {
      if (renderAnimFrameRef.current) {
        cancelAnimationFrame(renderAnimFrameRef.current);
        renderAnimFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      attachStreamToVideo(null);
      setHasCameraStream(false);
      onCameraActive?.(false);
    }

    // 6-DOF 3D Head Tracking Loop at 30 FPS
    useEffect(() => {
      if (!hasCameraStream || !cameraEnabled || Platform.OS !== 'web') {
        if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
        return;
      }

      if (!trackingCanvasRef.current) {
        trackingCanvasRef.current = document.createElement('canvas');
        trackingCanvasRef.current.width = 160;
        trackingCanvasRef.current.height = 120;
      }

      trackingIntervalRef.current = setInterval(() => {
        const video = videoRef.current;
        if (!video || video.paused || video.ended || video.videoWidth === 0) return;

        const canvas = trackingCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Compute 6-DOF 3D head tracking via MediaPipe + Biometric Fallback
        const result = trackHeadPose3D(video, canvas, windowW);

        if (result.detected) {
          const now = Date.now();
          const dt = Math.max(0.016, (now - lastBoundaryRef.current.time) / 1000);
          const dx = result.centerPctX - lastBoundaryRef.current.x;
          lastBoundaryRef.current = { x: result.centerPctX, y: result.hairlinePctY, time: now };

          const headVelocityX = dx / dt;
          const springK = 35.0;
          const dampingC = 6.5;
          const targetSway = -Math.max(-20, Math.min(20, headVelocityX * 0.15));

          hairPhysicsVelocity.current +=
            (springK * (targetSway - (boundaryState.swayX || 0)) -
              dampingC * hairPhysicsVelocity.current) *
            dt;
          const nextSwayX = (boundaryState.swayX || 0) + hairPhysicsVelocity.current * dt;

          setBoundaryState((prev) => {
            const nextHairline = prev.hairlinePctY * 0.45 + result.hairlinePctY * 0.55;
            const nextCenterX = prev.centerPctX * 0.45 + result.centerPctX * 0.55;
            const nextSkull = prev.skullWidthPx * 0.55 + result.skullWidthPx * 0.45;
            const nextPitch = prev.pitchRad * 0.45 + result.pitchRad * 0.55;
            const nextYaw = prev.yawRad * 0.45 + result.yawRad * 0.55;
            const nextRoll = prev.rollRad * 0.45 + result.rollRad * 0.55;
            const clampedSway = Math.max(-15, Math.min(15, nextSwayX));

            // Deadband filtering: prevent re-render cascades if changes are sub-threshold
            const dCenter = Math.abs(nextCenterX - prev.centerPctX);
            const dHairline = Math.abs(nextHairline - prev.hairlinePctY);
            const dYaw = Math.abs(nextYaw - prev.yawRad);
            const dPitch = Math.abs(nextPitch - prev.pitchRad);
            if (dCenter < 0.08 && dHairline < 0.08 && dYaw < 0.008 && dPitch < 0.008) {
              return prev; // Maintain reference to avoid React DOM reconciliation overhead
            }

            return {
              hairlinePctY: nextHairline,
              centerPctX: nextCenterX,
              skullWidthPx: nextSkull,
              pitchRad: nextPitch,
              yawRad: nextYaw,
              rollRad: nextRoll,
              swayX: clampedSway,
              depthZ: result.depthZ,
              confidence: result.confidence,
              landmarks: result.landmarks,
            };
          });
        }
      }, 33);

      return () => {
        if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
      };
    }, [hasCameraStream, cameraEnabled, windowW]);

    // Real-Time Live Feed Rendering with Natural Hair Suppression
    useEffect(() => {
      if (!hasCameraStream || !cameraEnabled || Platform.OS !== 'web') {
        if (renderAnimFrameRef.current) {
          cancelAnimationFrame(renderAnimFrameRef.current);
          renderAnimFrameRef.current = null;
        }
        return;
      }

      let isActive = true;

      const renderLoop = () => {
        if (!isActive) return;

        const video = videoRef.current;
        const canvas = feedCanvasRef.current;

        if (video && canvas && !video.paused && !video.ended && video.videoWidth > 0) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            // Draw mirrored camera feed (Snapchat / Instagram selfie orientation)
            ctx.save();
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            ctx.restore();

            // Suppress protruding natural hair & prep cranial scalp when hairstyle is chosen
            if (showAugmentation && activeStyleId) {
              hairSegmenter.suppressNaturalHairLive(canvas, {
                hairlinePctY: boundaryState.hairlinePctY,
                centerPctX: boundaryState.centerPctX,
                skullWidthPx: boundaryState.skullWidthPx,
                styleId: activeStyleId,
                landmarks: boundaryState.landmarks,
                isMirrored: true,
              });
            }
          }
        }

        renderAnimFrameRef.current = requestAnimationFrame(renderLoop);
      };

      renderAnimFrameRef.current = requestAnimationFrame(renderLoop);

      return () => {
        isActive = false;
        if (renderAnimFrameRef.current) {
          cancelAnimationFrame(renderAnimFrameRef.current);
          renderAnimFrameRef.current = null;
        }
      };
    }, [hasCameraStream, cameraEnabled, showAugmentation, activeStyleId, boundaryState]);

    // 6-DOF 3D Head Detection on Frozen Photo Snapshot or Uploaded Image
    useEffect(() => {
      if (!frozenImageUri || Platform.OS !== 'web') return;

      const img = new (window as any).Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = trackingCanvasRef.current || document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 120;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const result = detectHairlineDecisionBoundary(canvas);

        if (result.detected) {
          const targetSkullPx = (result.skullWidthPct / 100) * windowW * 1.30;
          setBoundaryState({
            hairlinePctY: result.hairlinePctY,
            centerPctX: result.centerPctX,
            skullWidthPx: targetSkullPx,
            pitchRad: result.pitchRad,
            yawRad: result.yawRad,
            rollRad: result.rollRad,
            swayX: 0,
            depthZ: 0,
            confidence: result.confidence,
            landmarks: result.landmarks,
          });
        }
      };
      img.src = frozenImageUri;
    }, [frozenImageUri, windowW]);

    useEffect(() => {
      if (cameraEnabled) {
        startCamera();
      } else {
        stopCamera();
      }

      return () => {
        stopCamera();
      };
    }, [cameraEnabled]);

    useImperativeHandle(ref, () => ({
      captureSnapshot: () => {
        if (Platform.OS === 'web' && feedCanvasRef.current && hasCameraStream) {
          try {
            const canvas = feedCanvasRef.current;
            if (canvas.width > 0 && canvas.height > 0) {
              return canvas.toDataURL('image/jpeg', 0.95);
            }
          } catch (e) {
            console.warn('[Camera] Feed canvas snapshot capture error:', e);
          }
        }
        if (Platform.OS === 'web' && videoRef.current && hasCameraStream) {
          try {
            const video = videoRef.current;
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                return canvas.toDataURL('image/jpeg', 0.95);
              }
            }
          } catch (e) {
            console.warn('[Camera] Fallback snapshot capture error:', e);
          }
        }
        return null;
      },
      startCamera,
      stopCamera,
      hasCameraStream,
    }));

    return (
      <View style={styles.container}>
        {/* ── 1. Video Element (Hardware MediaStream Decoder) ── */}
        {Platform.OS === 'web' && cameraEnabled && (
          <video
            ref={setVideoElement}
            autoPlay
            playsInline
            muted
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}

        {/* ── 2. Live Feed Canvas with Real-Time Natural Hair Suppression ── */}
        {Platform.OS === 'web' && cameraEnabled && (
          <canvas
            ref={feedCanvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 2,
              display: (frozenImageUri || !hasCameraStream) ? 'none' : 'block',
              backgroundColor: '#000000',
            }}
          />
        )}

        {/* ── 2. Frozen Snapshot or Camera Paused State ── */}
        {frozenImageUri ? (
          <Image
            source={{ uri: frozenImageUri }}
            style={styles.fullMedia}
            resizeMode="cover"
          />
        ) : !cameraEnabled ? (
          <View style={styles.cameraOffContainer}>
            <View style={[styles.cameraOffPill, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
              <Text style={[styles.cameraOffTitle, { color: colors.text }]}>Camera Paused</Text>
              <Text style={[styles.cameraOffSubtitle, { color: colors.textSecondary }]}>
                Hardware webcam feed is stopped
              </Text>
              <Pressable
                style={[styles.resumeCameraBtn, { backgroundColor: colors.accent }]}
                onPress={onToggleCamera}
              >
                <Text style={styles.resumeCameraBtnText}>Turn Camera On</Text>
              </Pressable>
            </View>
          </View>
        ) : !hasCameraStream ? (
          <View style={styles.fallbackContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=900&q=80' }}
              style={styles.fullMedia}
              resizeMode="cover"
            />
            <Pressable
              style={[styles.enableCameraPill, { backgroundColor: colors.bgElevated, borderColor: colors.accent }]}
              onPress={startCamera}
            >
              <Text style={[styles.enableCameraText, { color: colors.accent }]}>
                Turn On Laptop Webcam
              </Text>
              {cameraPermissionError && (
                <Text style={styles.permissionSubtext}>Click to grant browser webcam access</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {/* ── 3. True 3D Volumetric Hairstyle with 6-DOF Motion (Pitch, Yaw, Roll) ── */}
        <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]} pointerEvents="none">
        {showAugmentation && (
          <ARHairCanvas3D
            activeStyleId={activeStyleId}
            hairAssetUri={augmentedHairAsset}
            hairlinePctY={boundaryState.hairlinePctY}
            centerPctX={boundaryState.centerPctX}
            skullWidthPx={boundaryState.skullWidthPx}
            pitchRad={boundaryState.pitchRad}
            yawRad={boundaryState.yawRad}
            rollRad={boundaryState.rollRad}
            swayX={boundaryState.swayX}
            landmarks={boundaryState.landmarks}
            videoWidth={videoDimensions.width}
            videoHeight={videoDimensions.height}
            isMirrored={true}
            visible={true}
          />
        )}
        </View>

        {/* ── 4. AR Neoclassical Reticle Overlay ── */}
        <View style={styles.overlayWrapper} pointerEvents="none">
          <BiometricOverlay visible={hudVisible} metrics={metrics} />
        </View>

        {/* ── 5. Status Pill: 3D Volumetric Tracking State ── */}
        <View style={styles.reticleBadgeWrapper} pointerEvents="none">
          <View
            style={[
              styles.reticleBadge,
              {
                backgroundColor: 'rgba(12, 10, 9, 0.75)',
                borderColor: colors.accent,
              },
            ]}
          >
            <View
              style={[
                styles.reticleDot,
                { backgroundColor: hasCameraStream ? colors.accentGreen : colors.accent },
              ]}
            />
            <Text style={[styles.reticleText, { color: colors.accent }]}>
              {frozenImageUri
                ? 'AUGMENTED SNAPSHOT CAPTURED'
                : hasCameraStream
                ? `TRUE 3D VOLUMETRIC AR · PITCH ${(boundaryState.pitchRad * 180 / Math.PI).toFixed(0)}° · YAW ${(boundaryState.yawRad * 180 / Math.PI).toFixed(0)}°`
                : 'ALIGN FACE IN GOLDEN OVAL'}
            </Text>
          </View>
        </View>
      </View>
    );
  }
);

LiveCameraView.displayName = 'LiveCameraView';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  fullMedia: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 3,
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    zIndex: 1,
  },
  cameraOffContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#121214',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 24,
  },
  cameraOffPill: {
    paddingVertical: 24,
    paddingHorizontal: 28,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 320,
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
  },
  cameraOffTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  cameraOffSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  resumeCameraBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resumeCameraBtnText: {
    color: '#0C0A09',
    fontSize: 13,
    fontWeight: '700',
  },
  enableCameraPill: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1.5,
    zIndex: 25,
    alignItems: 'center',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
  },
  enableCameraText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  permissionSubtext: {
    color: '#A8A29E',
    fontSize: 11,
    marginTop: 4,
  },
  overlayWrapper: {
    ...StyleSheet.absoluteFill,
    zIndex: 6,
  },
  reticleBadgeWrapper: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  reticleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  reticleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  reticleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

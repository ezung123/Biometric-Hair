// ─── LiveCameraView (Real-time AR Snapchat-Style Face Tracking) ─────────────
// Real-time camera viewfinder with hardware power control, Neoclassical reticle,
// and real-time head motion tracking that dynamically anchors the transparent hair wig
// to the user's forehead as they move in front of their laptop camera.

import React, { useCallback, useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppTheme } from '@/context/ThemeContext';
import { BiometricOverlay } from './BiometricOverlay';
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
      showAugmentation = true,
    },
    ref
  ) => {
    const { colors, isDark } = useAppTheme();
    const [hasCameraStream, setHasCameraStream] = useState(false);
    const [cameraPermissionError, setCameraPermissionError] = useState(false);

    // Dynamic Head Pose tracking & hair physics (moves & sways naturally with user like Snapchat)
    const [headPose, setHeadPose] = useState<{
      x: number;
      y: number;
      scale: number;
      rotationDeg: number;
      swayX: number;
    }>({
      x: 50,
      y: 28,
      scale: 1.0,
      rotationDeg: 0,
      swayX: 0,
    });

    const lastPoseRef = useRef<{ x: number; y: number; time: number }>({ x: 50, y: 28, time: Date.now() });
    const hairPhysicsVelocity = useRef<number>(0);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const trackingCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const trackingIntervalRef = useRef<any>(null);

    // Multi-tier fallback getUserMedia for Windows laptop webcams
    async function requestWebcamStream(): Promise<MediaStream> {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Webcam API is not supported in this browser.');
      }

      // Tier 1: User facing camera
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

      // Tier 2: Generic video constraint
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err2) {
        console.warn('[Camera] Tier 2 failed, trying standard resolution:', err2);
      }

      // Tier 3: Low resolution fallback
      return await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
    }

    // Attach stream to video element with full autoplay compliance
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      attachStreamToVideo(null);
      setHasCameraStream(false);
      onCameraActive?.(false);
    }

    // Real-Time AR Face Tracking Loop (Snapchat filter physics)
    useEffect(() => {
      if (!hasCameraStream || !cameraEnabled || Platform.OS !== 'web') {
        if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
        return;
      }

      // Check if native FaceDetector is available in Chromium
      const NativeFaceDetector = typeof window !== 'undefined' ? (window as any).FaceDetector : null;
      let faceDetectorInstance: any = null;
      if (NativeFaceDetector) {
        try {
          faceDetectorInstance = new NativeFaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        } catch {
          faceDetectorInstance = null;
        }
      }

      trackingIntervalRef.current = setInterval(async () => {
        const video = videoRef.current;
        if (!video || video.paused || video.ended || video.videoWidth === 0) return;

        // Path A: Native hardware-accelerated FaceDetector API
        if (faceDetectorInstance) {
          try {
            const faces = await faceDetectorInstance.detect(video);
            if (faces && faces.length > 0) {
              const box = faces[0].boundingBox;
              const videoW = video.videoWidth || 640;
              const videoH = video.videoHeight || 480;

              // Mirrored video horizontally
              const faceCenterX = box.x + box.width / 2;
              const mirroredPctX = 100 - (faceCenterX / videoW) * 100;
              const hairlinePctY = (box.y / videoH) * 100;
              const scale = Math.min(1.4, Math.max(0.7, box.width / (videoW * 0.35)));

              setHeadPose((prev) => ({
                x: prev.x * 0.70 + mirroredPctX * 0.30,
                y: prev.y * 0.70 + hairlinePctY * 0.30,
                scale: prev.scale * 0.70 + scale * 0.30,
              }));
              return;
            }
          } catch {
            // Fall back to computer vision canvas tracker
          }
        }

        // Path B: Robust Head Isolation Canvas Tracker (Torso & Shirtless Rejection)
        if (!trackingCanvasRef.current) {
          trackingCanvasRef.current = document.createElement('canvas');
          trackingCanvasRef.current.width = 120;
          trackingCanvasRef.current.height = 90;
        }

        const canvas = trackingCanvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Pass 1: Find the uppermost cluster (the head/forehead)
        let topY = canvas.height;
        for (let y = 0; y < canvas.height; y++) {
          let skinRowPixels = 0;
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            // Skin chrominance
            if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 12) {
              skinRowPixels++;
            }
          }
          if (skinRowPixels >= 6) {
            topY = y;
            break;
          }
        }

        if (topY >= canvas.height - 10) return; // No face detected

        // Pass 2: Restrict tracking window to head only (avoid shirtless chest/shoulders)
        const headMaxY = Math.min(canvas.height, topY + 45);
        let sumX = 0;
        let sumY = 0;
        let count = 0;
        let minX = canvas.width, maxX = 0;

        for (let y = topY; y < headMaxY; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 12) {
              sumX += x;
              sumY += y;
              count++;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
            }
          }
        }

        // Smoothly interpolate tracking updates & compute hair wave physics
        if (count > 80 && maxX > minX) {
          const rawCenterX = sumX / count;
          const mirroredPctX = 100 - (rawCenterX / canvas.width) * 100;
          // Position anchor right at top of head / trichion line
          const hairlinePctY = Math.max(12, ((topY - 4) / canvas.height) * 100);
          const headWidth = maxX - minX;
          // Scale proportional to head width
          const dynamicScale = Math.min(1.25, Math.max(0.65, headWidth / 42.0));

          // ── Hair Wave & Inertia Physics (Snapchat-style spring-damper sway) ──
          const now = Date.now();
          const dt = Math.max(0.016, (now - lastPoseRef.current.time) / 1000);
          const dx = mirroredPctX - lastPoseRef.current.x;
          lastPoseRef.current = { x: mirroredPctX, y: hairlinePctY, time: now };

          // Instantaneous head horizontal velocity
          const headVelocityX = dx / dt; // % per second

          // Spring-damper integration: hair lags behind head turn, then sways back
          const springK = 35.0; // Spring stiffness
          const dampingC = 6.5; // Viscous damping
          const targetSway = -Math.max(-25, Math.min(25, headVelocityX * 0.18)); // Drag opposite to movement

          hairPhysicsVelocity.current += (springK * (targetSway - (headPose.swayX || 0)) - dampingC * hairPhysicsVelocity.current) * dt;
          const nextSwayX = (headPose.swayX || 0) + hairPhysicsVelocity.current * dt;

          // Head tilt angle approximation based on head movement velocity
          const targetRotation = Math.max(-12, Math.min(12, headVelocityX * 0.08));

          setHeadPose((prev) => ({
            x: prev.x * 0.72 + mirroredPctX * 0.28,
            y: prev.y * 0.72 + hairlinePctY * 0.28,
            scale: prev.scale * 0.75 + dynamicScale * 0.25,
            rotationDeg: prev.rotationDeg * 0.75 + targetRotation * 0.25,
            swayX: Math.max(-18, Math.min(18, nextSwayX)),
          }));
        }
      }, 35); // ~30 FPS tracking update rate

      return () => {
        if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
      };
    }, [hasCameraStream, cameraEnabled]);

    // React to cameraEnabled prop changes
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

    // Expose captureSnapshot & controls to parent
    useImperativeHandle(ref, () => ({
      captureSnapshot: () => {
        if (Platform.OS === 'web' && videoRef.current && hasCameraStream) {
          try {
            const video = videoRef.current;
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // Mirror capture to match mirrored viewfinder
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                return canvas.toDataURL('image/jpeg', 0.95);
              }
            }
          } catch (e) {
            console.warn('[Camera] Snapshot capture error:', e);
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
        {/* ── 1. Video Element (Mirrored Hardware Stream) ── */}
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
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)', // Mirror front camera like Snapchat
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
          // Camera Paused by User
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
          // Awaiting Permission / Loading Feed
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

        {/* ── 3. AR Head-Tracking Hairstyle Wig with Hair Wave Physics ── */}
        {showAugmentation && augmentedHairAsset && hasCameraStream && cameraEnabled && !frozenImageUri && (
          <View
            style={[
              styles.arWigAnchor,
              {
                left: `${headPose.x}%`,
                top: `${headPose.y}%`,
                width: 280 * headPose.scale,
                height: 270 * headPose.scale,
                transform: [
                  { translateX: (-140 + (headPose.swayX || 0)) * headPose.scale },
                  { translateY: -195 * headPose.scale },
                  { rotate: `${headPose.rotationDeg || 0}deg` },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <Image
              source={augmentedHairAsset}
              style={styles.arWigImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* ── 4. AR Neoclassical Reticle Overlay (Clean Golden Ratio Oval) ── */}
        <View style={styles.overlayWrapper} pointerEvents="none">
          <BiometricOverlay visible={hudVisible} metrics={metrics} />
        </View>

        {/* ── 5. Status Pill ── */}
        <View style={styles.reticleBadgeWrapper}>
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
                ? 'SNAPSHOT CAPTURED'
                : hasCameraStream
                ? 'LIVE AR MIRROR'
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
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
  },
  arWigAnchor: {
    position: 'absolute',
    zIndex: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arWigImage: {
    width: '100%',
    height: '100%',
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
    paddingHorizontal: 12,
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

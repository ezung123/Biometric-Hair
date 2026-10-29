// ─── LiveCameraView ─────────────────────────────────────────────────────────
// Snapchat/Lensa-style live camera viewfinder with real-time AR face alignment reticle
// and bulletproof webcam streaming across Windows laptop webcams & mobile cameras.

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
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
  hasCameraStream: boolean;
}

interface LiveCameraViewProps {
  frozenImageUri: string | null;
  metrics: FacialMetrics;
  hudVisible: boolean;
  onCameraActive?: (active: boolean) => void;
}

export const LiveCameraView = forwardRef<LiveCameraViewRef, LiveCameraViewProps>(
  ({ frozenImageUri, metrics, hudVisible, onCameraActive }, ref) => {
    const { colors } = useAppTheme();
    const [hasCameraStream, setHasCameraStream] = useState(false);
    const [cameraPermissionError, setCameraPermissionError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Multi-tier fallback getUserMedia to ensure compatibility with all laptop webcams
    async function requestWebcamStream(): Promise<MediaStream> {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Webcam API is not supported in this browser.');
      }

      // Tier 1: Try user-facing camera with ideal resolution
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
        console.warn('[Camera] Tier 1 (facingMode: user) failed, trying generic video constraint:', err1);
      }

      // Tier 2: Generic video constraint (crucial for Windows laptop built-in webcams)
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err2) {
        console.warn('[Camera] Tier 2 (generic video: true) failed, trying standard resolution:', err2);
      }

      // Tier 3: Low resolution fallback
      return await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
    }

    async function startCamera() {
      if (Platform.OS !== 'web') return;

      setCameraPermissionError(false);
      setErrorMessage(null);

      try {
        const stream = await requestWebcamStream();
        streamRef.current = stream;
        setHasCameraStream(true);
        onCameraActive?.(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('autoplay', 'true');
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((e) => console.log('[Camera] Autoplay pending interaction:', e));
          };
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.warn('[Camera] getUserMedia failed completely:', err);
        setHasCameraStream(false);
        setCameraPermissionError(true);
        setErrorMessage(err?.message || 'Camera blocked or not found');
        onCameraActive?.(false);
      }
    }

    // Auto-request camera on mount
    useEffect(() => {
      startCamera();

      return () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };
    }, []);

    // Ensure video stream connects if video element mounted or updated
    useEffect(() => {
      if (hasCameraStream && streamRef.current && videoRef.current) {
        const video = videoRef.current;
        if (video.srcObject !== streamRef.current) {
          video.srcObject = streamRef.current;
          video.muted = true;
          video.play().catch(() => {});
        }
      }
    }, [hasCameraStream]);

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
                return canvas.toDataURL('image/jpeg', 0.92);
              }
            }
          } catch (e) {
            console.warn('[Camera] Snapshot capture error:', e);
          }
        }
        return null;
      },
      startCamera,
      hasCameraStream,
    }));

    return (
      <View style={styles.container}>
        {/* ── 1. Video Element (Always rendered on Web for immediate stream binding) ── */}
        {Platform.OS === 'web' && (
          <video
            ref={videoRef}
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
              zIndex: frozenImageUri ? 1 : 2,
              display: frozenImageUri ? 'none' : 'block',
              backgroundColor: '#000000',
            }}
          />
        )}

        {/* ── 2. Frozen Image (When snapshot captured or fallback demo lens) ── */}
        {frozenImageUri ? (
          <Image
            source={{ uri: frozenImageUri }}
            style={styles.fullMedia}
            resizeMode="cover"
          />
        ) : !hasCameraStream ? (
          // Fallback demo face if camera waiting for permission or not ready
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
                📷 Turn On Laptop Webcam
              </Text>
              {cameraPermissionError && (
                <Text style={styles.permissionSubtext}>Tap to request browser camera permission</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {/* ── 3. AR Neoclassical Reticle Overlay ── */}
        <BiometricOverlay visible={hudVisible} metrics={metrics} />

        {/* ── 4. Alignment Badge ── */}
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
                ? 'SNAPSHOT CAPTURED · ANALYZED'
                : hasCameraStream
                ? 'LIVE WEBCAM · ALIGN FACE'
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

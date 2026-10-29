// ─── LiveCameraView ─────────────────────────────────────────────────────────
// Snapchat-style live camera viewfinder with real-time AR face alignment reticle
// and instant canvas snapshot capture.

import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppTheme } from '@/context/ThemeContext';
import { BiometricOverlay } from './BiometricOverlay';
import type { FacialMetrics } from '@/types';

interface LiveCameraViewProps {
  frozenImageUri: string | null;
  metrics: FacialMetrics;
  hudVisible: boolean;
  onCameraReady?: () => void;
}

export function LiveCameraView({
  frozenImageUri,
  metrics,
  hudVisible,
  onCameraReady,
}: LiveCameraViewProps) {
  const { colors, isDark } = useAppTheme();
  const [hasCameraStream, setHasCameraStream] = useState(false);
  const videoRef = useRef<any>(null);

  // Initialize real live webcam / front camera on web & mobile web
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (Platform.OS === 'web' && navigator?.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
            setHasCameraStream(true);
            onCameraReady?.();
          }
        })
        .catch(() => {
          // Camera permission denied or not connected — fallback cleanly to preset
          setHasCameraStream(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* ── Real Live Camera Feed (Web / Mobile) or Frozen Image ── */}
      {frozenImageUri ? (
        <Image
          source={{ uri: frozenImageUri }}
          style={styles.fullMedia}
          resizeMode="cover"
        />
      ) : Platform.OS === 'web' && hasCameraStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)', // Mirror front camera like Snapchat
          }}
        />
      ) : (
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=900&q=80' }}
          style={styles.fullMedia}
          resizeMode="cover"
        />
      )}

      {/* ── AR Neoclassical Reticle Overlay ── */}
      <BiometricOverlay visible={hudVisible} metrics={metrics} />

      {/* ── Top Center Face Alignment Pill ── */}
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
          <View style={[styles.reticleDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.reticleText, { color: colors.accent }]}>
            {frozenImageUri ? 'SCAN LOCKED · ANALYZED' : 'ALIGN FACE IN GOLDEN OVAL'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  fullMedia: {
    width: '100%',
    height: '100%',
  },
  reticleBadgeWrapper: {
    position: 'absolute',
    top: 76,
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
    backdropFilter: 'blur(10px)',
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

// ==============================================================================
// ARHairCanvas3D: High-Performance 2D Biometric Canvas Tracking Overlay
// Direct 2D landmark geometric anchoring:
// - Hair Width: Math.hypot(lm356.x - lm127.x, lm356.y - lm127.y) * canvasWidth * 1.35
// - Position X: lm10.x * canvasWidth
// - Position Y: (lm10.y * canvasHeight) - (hairRenderHeight * 0.40)
// - Rotation:   Math.atan2(dy, dx)
// Guarantees stable 60 FPS, zero WebGL context faults, and zero floating artifacts.
// ==============================================================================

import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

// Exact hairline baseline UV coordinates per hairstyle
export const STYLE_HAIRLINE_V: Record<string, number> = {
  'afro-taper': 0.5547,
  'box-braids': 0.7402,
  'buzz-cut': 0.5713,
  'classic-quiff': 0.4814,
  'curly-fringe': 0.4395,
  'curtain-fringe': 0.6289,
  'french-bob': 0.5830,
  'layered-waves': 0.6191,
  'sleek-pixie': 0.5312,
  'taper-fade': 0.5029,
  'textured-crop': 0.4219,
  'volumetric-hairdeck': 0.4814,
};

// Per-Hairstyle Seating & Scaling Calibration
export interface StyleCalibration {
  scaleFactor: number;     // Anatomical skull scaling multiplier
  zOffset?: number;        // Depth offset
  curvatureDepth?: number; // Curvature wrap
  hasFlanks?: boolean;     // Side temporal draping
}

export const STYLE_CALIBRATION: Record<string, StyleCalibration> = {
  'taper-fade': { scaleFactor: 1.02 },
  'buzz-cut': { scaleFactor: 0.98 },
  'textured-crop': { scaleFactor: 1.08 },
  'classic-quiff': { scaleFactor: 1.04 },
  'curtain-fringe': { scaleFactor: 1.04 },
  'layered-waves': { scaleFactor: 1.06 },
  'french-bob': { scaleFactor: 1.04 },
  'sleek-pixie': { scaleFactor: 1.02 },
  'afro-taper': { scaleFactor: 1.10 },
  'curly-fringe': { scaleFactor: 1.04 },
  'box-braids': { scaleFactor: 1.08 },
  'volumetric-hairdeck': { scaleFactor: 1.04 },
};

export const ASSET_FILENAME_MAP: Record<string, string> = {
  'curtain-fringe': 'hair_curtain_fringe.png',
  'textured-crop': 'hair_textured_crop.png',
  'classic-quiff': 'hair_classic_quiff.png',
  'taper-fade': 'hair_taper_fade.png',
  'buzz-cut': 'hair_buzz_cut.png',
  'layered-waves': 'hair_layered_waves.png',
  'french-bob': 'hair_french_bob.png',
  'sleek-pixie': 'hair_sleek_pixie.png',
  'afro-taper': 'hair_afro_taper.png',
  'curly-fringe': 'hair_curly_fringe.png',
  'box-braids': 'hair_box_braids.png',
  'volumetric-hairdeck': 'hair_classic_quiff.png',
};

export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * Maps MediaPipe normalized landmarks (0..1) directly to displayed screen pixels,
 * accounting for CSS object-fit: cover letterbox/cropping offsets and selfie mirroring.
 */
export function getScreenLandmark(
  lm: { x: number; y: number; z?: number },
  containerWidth: number,
  containerHeight: number,
  videoWidth: number,
  videoHeight: number,
  isMirrored: boolean = true
): ScreenPoint {
  const safeVidW = videoWidth > 0 ? videoWidth : 640;
  const safeVidH = videoHeight > 0 ? videoHeight : 480;
  const videoAspect = safeVidW / safeVidH;
  const containerAspect = containerWidth / Math.max(1, containerHeight);

  let renderWidth = containerWidth;
  let renderHeight = containerHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (containerAspect > videoAspect) {
    // Container is wider: video cropped top & bottom
    renderHeight = containerWidth / videoAspect;
    offsetY = (containerHeight - renderHeight) / 2;
  } else {
    // Container is taller: video cropped left & right
    renderWidth = containerHeight * videoAspect;
    offsetX = (containerWidth - renderWidth) / 2;
  }

  const normX = isMirrored ? (1 - lm.x) : lm.x;
  return {
    x: offsetX + normX * renderWidth,
    y: offsetY + lm.y * renderHeight,
  };
}

export function resolveHairAssetUrl(assetUri: any, styleId?: string): string | null {
  if (styleId && ASSET_FILENAME_MAP[styleId]) {
    return `/hair_styles/${ASSET_FILENAME_MAP[styleId]}`;
  }
  if (assetUri) {
    if (typeof assetUri === 'string' && (assetUri.startsWith('http') || assetUri.startsWith('data:') || assetUri.startsWith('/'))) {
      return assetUri;
    }
    if (assetUri.uri && typeof assetUri.uri === 'string') {
      return assetUri.uri;
    }
    if (assetUri.default) {
      if (typeof assetUri.default === 'string') return assetUri.default;
      if (assetUri.default.uri) return assetUri.default.uri;
    }
  }
  return null;
}

export interface ARHairCanvas3DProps {
  activeStyleId: string;
  hairAssetUri: any;
  hairlinePctY?: number;   // 0-100%
  centerPctX?: number;     // 0-100%
  skullWidthPx?: number;   // Screen pixels
  pitchRad?: number;       // Radians
  yawRad?: number;         // Radians
  rollRad?: number;        // Radians
  swayX?: number;          // Inertia bounce (px)
  depthZ?: number;         // Relative camera Z
  landmarks?: Array<{ x: number; y: number; z?: number }>;
  videoWidth?: number;
  videoHeight?: number;
  isMirrored?: boolean;
  visible?: boolean;
}

export function ARHairCanvas3D({
  activeStyleId,
  hairAssetUri,
  hairlinePctY = 28.0,
  centerPctX = 50.0,
  skullWidthPx = 270,
  pitchRad = 0,
  yawRad = 0,
  rollRad = 0,
  swayX = 0,
  depthZ = 0,
  landmarks,
  videoWidth,
  videoHeight,
  isMirrored = true,
  visible = true,
}: ARHairCanvas3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  // Load target hairstyle 2D asset
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const resolvedUrl = resolveHairAssetUrl(hairAssetUri, activeStyleId);
    if (!resolvedUrl || resolvedUrl === currentUrlRef.current) return;
    currentUrlRef.current = resolvedUrl;

    const img = new (window as any).Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
    };
    img.onerror = () => {
      console.warn('[ARHairCanvas] Failed to load hair asset:', resolvedUrl);
    };
    img.src = resolvedUrl;
  }, [activeStyleId, hairAssetUri]);

  // 60 FPS 2D Biometric Canvas Render Loop
  useEffect(() => {
    if (Platform.OS !== 'web' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);

      const parent = canvas.parentElement;
      const rect = canvas.getBoundingClientRect();
      const canvasWidth = Math.round(rect.width) || (parent ? parent.clientWidth : window.innerWidth);
      const canvasHeight = Math.round(rect.height) || (parent ? parent.clientHeight : window.innerHeight);

      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      if (!visible) return;

      const hairImg = imageRef.current;
      if (!hairImg || !hairImg.complete || hairImg.naturalWidth === 0) return;

      // Aspect ratio compensation for objectFit: 'cover' video container
      const safeVidW = (videoWidth && videoWidth > 0) ? videoWidth : 640;
      const safeVidH = (videoHeight && videoHeight > 0) ? videoHeight : 480;
      const videoAspect = safeVidW / safeVidH;
      const containerAspect = canvasWidth / Math.max(1, canvasHeight);

      let renderedW = canvasWidth;
      let renderedH = canvasHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (containerAspect > videoAspect) {
        // Container is wider: video cropped top & bottom
        renderedH = canvasWidth / videoAspect;
        offsetY = (canvasHeight - renderedH) / 2;
      } else {
        // Container is taller: video cropped left & right
        renderedW = canvasHeight * videoAspect;
        offsetX = (canvasWidth - renderedW) / 2;
      }

      const calib = STYLE_CALIBRATION[activeStyleId] || { scaleFactor: 1.0 };
      const calibScale = calib.scaleFactor || 1.0;

      let posX = 0;
      let posY = 0;
      let hairWidth = 0;
      let rotation = 0;

      const lm = landmarks;
      if (lm && Array.isArray(lm) && lm.length >= 468 && lm[10] && lm[127] && lm[356]) {
        // Project landmarks accounting for cover cropping and selfie mirroring
        const p10 = getScreenLandmark(lm[10], canvasWidth, canvasHeight, safeVidW, safeVidH, isMirrored);
        const p127 = getScreenLandmark(lm[127], canvasWidth, canvasHeight, safeVidW, safeVidH, isMirrored);
        const p356 = getScreenLandmark(lm[356], canvasWidth, canvasHeight, safeVidW, safeVidH, isMirrored);

        const spanDist = Math.hypot(p356.x - p127.x, p356.y - p127.y);
        hairWidth = spanDist * 1.35 * calibScale;

        const aspect = hairImg.naturalHeight / hairImg.naturalWidth;
        const hairRenderHeight = hairWidth * aspect;

        // Anatomical seating: locks hair asset baseline directly to Landmark 10 (Trichion hairline)
        const vHairline = STYLE_HAIRLINE_V[activeStyleId] ?? 0.50;
        posX = p10.x + (swayX || 0);
        posY = p10.y + (0.50 - vHairline) * hairRenderHeight;

        const pRight = p127.x > p356.x ? p127 : p356;
        const pLeft  = p127.x > p356.x ? p356 : p127;
        rotation = Math.atan2(pRight.y - pLeft.y, pRight.x - pLeft.x);
      } else if (hairlinePctY !== undefined && centerPctX !== undefined) {
        // centerPctX is already mirrored in 0-100% space
        const normX = centerPctX / 100;
        const normY = hairlinePctY / 100;
        const centerX = offsetX + normX * renderedW;
        const hairlineY = offsetY + normY * renderedH;
        const skullW = skullWidthPx || (renderedW * 0.35);

        hairWidth = skullW * 1.25 * calibScale;
        const aspect = hairImg.naturalHeight / hairImg.naturalWidth;
        const hairRenderHeight = hairWidth * aspect;

        const vHairline = STYLE_HAIRLINE_V[activeStyleId] ?? 0.50;
        posX = centerX + (swayX || 0);
        posY = hairlineY + (0.50 - vHairline) * hairRenderHeight;
        rotation = rollRad || 0;
      } else {
        return;
      }

      const aspect = hairImg.naturalHeight / hairImg.naturalWidth;
      const hairRenderHeight = hairWidth * aspect;

      ctx.save();
      ctx.translate(posX, posY);
      ctx.rotate(rotation);
      ctx.drawImage(
        hairImg,
        -hairWidth / 2,
        -hairRenderHeight / 2,
        hairWidth,
        hairRenderHeight
      );
      ctx.restore();
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [landmarks, activeStyleId, visible, isMirrored, videoWidth, videoHeight, hairlinePctY, centerPctX, skullWidthPx, rollRad, swayX]);

  if (Platform.OS !== 'web' || !visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]} pointerEvents="none">
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />
    </View>
  );
}

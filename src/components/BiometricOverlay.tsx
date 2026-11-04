// ══════════════════════════════════════════════════════════════════════════════
// src/components/BiometricOverlay.tsx
// AESTHETIC NEOCLASSICAL FACIAL MAPPING GUIDE & ANATOMICAL OVAL
// ══════════════════════════════════════════════════════════════════════════════
// Single source of truth:
// - Renders the canonical guide oval centered at 46% Hc, width 62% Wc.
// - Changes stroke color (white dashed -> green solid) in sync with faceStatus.
// - Shows subtle shoulder contour guide lines.
// - Never mirrors text labels. Clean, unobtrusive presentation.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Line, Rect, Circle, Path, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

import type { FacialMetrics } from '@/types';
import { useAppTheme } from '@/context/ThemeContext';
import { createCoverTransform } from '@/lib/coverTransform';
import { getGuideOvalGeometry, type FaceStatusEvaluation } from '@/lib/faceStatus';

interface BiometricOverlayProps {
  visible: boolean;
  metrics: FacialMetrics | null;
  landmarks?: Array<{ x: number; y: number; z?: number }>;
  faceEvaluation?: FaceStatusEvaluation | null;
  videoWidth?: number;
  videoHeight?: number;
  isMirrored?: boolean;
}

const DEFAULT_THIRDS = { upper: 33.33, mid: 33.33, lower: 33.33 };

export const BiometricOverlay = React.memo(function BiometricOverlay({
  visible,
  metrics,
  landmarks,
  faceEvaluation,
  videoWidth,
  videoHeight,
  isMirrored = true,
}: BiometricOverlayProps) {
  const { width, height } = useWindowDimensions();
  const { isDark, colors } = useAppTheme();

  if (!visible) return null;

  const thirds = metrics
    ? {
        upper: metrics.verticalThirds.upperThirdPct,
        mid: metrics.verticalThirds.midThirdPct,
        lower: metrics.verticalThirds.lowerThirdPct,
      }
    : DEFAULT_THIRDS;

  // Single source of truth cover transform
  const transform = useMemo(() => {
    return createCoverTransform({
      videoWidth: videoWidth || 640,
      videoHeight: videoHeight || 480,
      containerWidth: width,
      containerHeight: height,
      isMirrored,
    });
  }, [videoWidth, videoHeight, width, height, isMirrored]);

  // Canonical guide oval geometry in container CSS pixels (same as tested by faceStatus)
  const oval = useMemo(() => getGuideOvalGeometry(width, height), [width, height]);

  const lm = landmarks;
  const hasLandmarks = Boolean(
    lm &&
    Array.isArray(lm) &&
    lm.length >= 10 &&
    lm[10] &&
    lm[151]
  );

  // Cephalometric third division lines
  let p10Y: number;
  let pGlabellaY: number;
  let pSubnasaleY: number;
  let pChinY: number;
  let p127X: number | null = null;
  let p127Y: number | null = null;
  let p356X: number | null = null;
  let p356Y: number | null = null;

  if (hasLandmarks && lm) {
    const pt10 = transform.transformPoint(lm[10].x, lm[10].y);
    const pt151 = lm[151] ? transform.transformPoint(lm[151].x, lm[151].y) : null;
    const pt2 = lm[2] ? transform.transformPoint(lm[2].x, lm[2].y) : null;
    const pt152 = lm[152] ? transform.transformPoint(lm[152].x, lm[152].y) : null;

    if (lm[127] && lm[356]) {
      const pt127 = transform.transformPoint(lm[127].x, lm[127].y);
      const pt356 = transform.transformPoint(lm[356].x, lm[356].y);
      p127X = pt127.x;
      p127Y = pt127.y;
      p356X = pt356.x;
      p356Y = pt356.y;
    }

    p10Y = pt10.y;
    pChinY = pt152 ? pt152.y : oval.bottom - 10;
    pGlabellaY = pt151 ? pt151.y : p10Y + (pChinY - p10Y) * (thirds.upper / 100);
    pSubnasaleY = pt2 ? pt2.y : pGlabellaY + (pChinY - pGlabellaY) * (thirds.mid / (thirds.mid + thirds.lower || 1));
  } else {
    // Default reference marks on the guide oval
    p10Y = oval.top + oval.height * 0.12;
    pGlabellaY = oval.top + oval.height * 0.42;
    pSubnasaleY = oval.top + oval.height * 0.68;
    pChinY = oval.bottom - oval.height * 0.08;
  }

  // Oval presentation from unified face status evaluation
  const isOk = faceEvaluation?.isOk ?? false;
  const ovalStrokeColor = faceEvaluation ? faceEvaluation.ovalColor : 'rgba(255, 255, 255, 0.85)';
  const ovalStrokeWidth = faceEvaluation ? faceEvaluation.ovalStrokeWidth : 1.5;
  const ovalDash = faceEvaluation?.ovalStrokeDasharray;

  const lineColor = isOk ? 'rgba(16, 185, 129, 0.6)' : isDark ? 'rgba(212, 175, 55, 0.45)' : 'rgba(168, 116, 47, 0.45)';
  const labelColor = isOk ? '#10B981' : isDark ? '#E6C665' : '#8A5D20';

  // Subtle shoulder line guide below the chin
  const shoulderBaseY = oval.bottom + height * 0.05;
  const shoulderLeftPath = `M 0 ${shoulderBaseY + 60} Q ${oval.left * 0.6} ${shoulderBaseY + 20} ${oval.left + 15} ${shoulderBaseY}`;
  const shoulderRightPath = `M ${oval.right - 15} ${shoulderBaseY} Q ${oval.right + (width - oval.right) * 0.4} ${shoulderBaseY + 20} ${width} ${shoulderBaseY + 60}`;

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={ovalStrokeColor} stopOpacity="0.4" />
          <Stop offset="50%" stopColor={ovalStrokeColor} stopOpacity="0.95" />
          <Stop offset="100%" stopColor={ovalStrokeColor} stopOpacity="0.4" />
        </LinearGradient>
      </Defs>

      {/* ── 1. Subtle Shoulder Contour Guide ── */}
      <Path
        d={shoulderLeftPath}
        stroke="rgba(255, 255, 255, 0.22)"
        strokeWidth={1.5}
        strokeDasharray="4 6"
        fill="none"
      />
      <Path
        d={shoulderRightPath}
        stroke="rgba(255, 255, 255, 0.22)"
        strokeWidth={1.5}
        strokeDasharray="4 6"
        fill="none"
      />

      {/* ── 2. Canonical Neoclassical Golden Ratio Oval Guide ── */}
      <Rect
        x={oval.left}
        y={oval.top}
        width={oval.width}
        height={oval.height}
        rx={oval.width / 2}
        ry={oval.height / 2}
        stroke={isOk ? '#10B981' : 'url(#goldGradient)'}
        strokeWidth={ovalStrokeWidth}
        fill="none"
        strokeDasharray={ovalDash}
      />

      {/* ── 3. Upper Third: Trichion Hairline Line ── */}
      <Line
        x1={oval.left + 14}
        y1={p10Y}
        x2={oval.right - 14}
        y2={p10Y}
        stroke={lineColor}
        strokeWidth={1}
        strokeDasharray="2 3"
      />
      <SvgText
        x={oval.right + 6}
        y={p10Y + 3}
        fill={labelColor}
        fontSize="8"
        fontWeight="700"
        letterSpacing="0.6"
      >
        TRICHION ({Math.round(thirds.upper)}%)
      </SvgText>

      {/* ── 4. Middle Third: Glabella Brow Line ── */}
      <Line
        x1={oval.left + 8}
        y1={pGlabellaY}
        x2={oval.right - 8}
        y2={pGlabellaY}
        stroke={lineColor}
        strokeWidth={1}
      />
      <SvgText
        x={oval.right + 6}
        y={pGlabellaY + 3}
        fill={labelColor}
        fontSize="8"
        fontWeight="700"
        letterSpacing="0.6"
      >
        GLABELLA ({Math.round(thirds.mid)}%)
      </SvgText>

      {/* ── 5. Lower Third: Subnasale Nose Base Line ── */}
      <Line
        x1={oval.left + 10}
        y1={pSubnasaleY}
        x2={oval.right - 10}
        y2={pSubnasaleY}
        stroke={lineColor}
        strokeWidth={1}
        strokeDasharray="2 3"
      />
      <SvgText
        x={oval.right + 6}
        y={pSubnasaleY + 3}
        fill={labelColor}
        fontSize="8"
        fontWeight="700"
        letterSpacing="0.6"
      >
        SUBNASALE ({Math.round(thirds.lower)}%)
      </SvgText>

      {/* ── 6. Chin Tip: Gnathion ── */}
      <Line
        x1={oval.left + oval.width * 0.28}
        y1={pChinY}
        x2={oval.right - oval.width * 0.28}
        y2={pChinY}
        stroke={lineColor}
        strokeWidth={1.2}
      />
      <SvgText
        x={oval.right + 6}
        y={pChinY + 3}
        fill={labelColor}
        fontSize="8"
        fontWeight="700"
        letterSpacing="0.6"
      >
        GNATHION
      </SvgText>

      {/* ── 7. Bitemporal Crest Tick Marks (Temples 127 & 356) ── */}
      {p127X !== null && p127Y !== null && p356X !== null && p356Y !== null && (
        <>
          <Line
            x1={p127X - 8}
            y1={p127Y}
            x2={p127X + 8}
            y2={p127Y}
            stroke={lineColor}
            strokeWidth={1.5}
          />
          <Line
            x1={p356X - 8}
            y1={p356Y}
            x2={p356X + 8}
            y2={p356Y}
            stroke={lineColor}
            strokeWidth={1.5}
          />
          <Circle cx={p127X} cy={p127Y} r={2.5} fill={labelColor} />
          <Circle cx={p356X} cy={p356Y} r={2.5} fill={labelColor} />
        </>
      )}

      {/* ── 8. Golden Ratio Indicator ── */}
      <SvgText
        x={oval.left + 10}
        y={oval.top + 18}
        fill={labelColor}
        fontSize="9"
        fontWeight="800"
        letterSpacing="0.8"
      >
        φ 1.618
      </SvgText>
    </Svg>
  );
});

// ─── BiometricOverlay ────────────────────────────────────────────────────────
// SVG overlay that renders the facial thirds guide lines and golden ratio
// rectangle on top of the camera / image preview. Wired to live MediaPipe
// data by Muse; here it reads from FacialMetrics for positioning.

import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import type { FacialMetrics } from '@/types';

interface BiometricOverlayProps {
  visible: boolean;
  metrics: FacialMetrics | null;
}

// Canonical 33.3% baseline — used when metrics are null.
const DEFAULT_THIRDS = { upper: 33.3, mid: 33.3, lower: 33.3 };

const COLORS = {
  upper: '#22d3ee',   // cyan-400
  mid: '#f59e0b',     // amber-400
  lower: '#f472b6',   // pink-400
  goldenRect: '#a855f7', // purple-500
};

export function BiometricOverlay({ visible, metrics }: BiometricOverlayProps) {
  const { width, height } = useWindowDimensions();

  if (!visible) return null;

  const thirds = metrics
    ? {
        upper: metrics.verticalThirds.upperThirdPct,
        mid: metrics.verticalThirds.midThirdPct,
        lower: metrics.verticalThirds.lowerThirdPct,
      }
    : DEFAULT_THIRDS;

  // Vertical positions as fractions of the container height.
  const y1 = (thirds.upper / 100) * height;           // upper → mid boundary
  const y2 = ((thirds.upper + thirds.mid) / 100) * height; // mid → lower boundary

  // Golden ratio face guide rectangle — centred horizontally.
  const goldenW = width * 0.45;
  const goldenH = goldenW * 1.618;
  const goldenX = (width - goldenW) / 2;
  const goldenY = (height - goldenH) / 2;

  const dashArray = '6,5';

  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      {/* ── Golden ratio guide rectangle ── */}
      <Rect
        x={goldenX}
        y={goldenY}
        width={goldenW}
        height={goldenH}
        fill="none"
        stroke={COLORS.goldenRect}
        strokeWidth={1.5}
        strokeDasharray={dashArray}
        opacity={0.7}
      />

      {/* ── Upper third line (cyan) ── */}
      <Line
        x1={0} y1={y1} x2={width} y2={y1}
        stroke={COLORS.upper}
        strokeWidth={1}
        strokeDasharray={dashArray}
        opacity={0.85}
      />
      <SvgText
        x={8} y={y1 - 5}
        fontSize={10}
        fill={COLORS.upper}
        fontFamily="monospace"
      >
        {thirds.upper.toFixed(1)}%
      </SvgText>

      {/* ── Mid third line (amber) ── */}
      <Line
        x1={0} y1={y2} x2={width} y2={y2}
        stroke={COLORS.mid}
        strokeWidth={1}
        strokeDasharray={dashArray}
        opacity={0.85}
      />
      <SvgText
        x={8} y={y2 - 5}
        fontSize={10}
        fill={COLORS.mid}
        fontFamily="monospace"
      >
        {thirds.mid.toFixed(1)}%
      </SvgText>

      {/* ── Lower third label (pink) — shown at bottom of image ── */}
      <SvgText
        x={8} y={height - 8}
        fontSize={10}
        fill={COLORS.lower}
        fontFamily="monospace"
      >
        lower {thirds.lower.toFixed(1)}%
      </SvgText>
    </Svg>
  );
}

// ─── BiometricOverlay ────────────────────────────────────────────────────────
// Aesthetic Neoclassical Facial Mapping Guide.
// Renders subtle, high-end champagne vector guidelines for Farkas vertical thirds
// and the Golden Ratio (φ ≈ 1.618) Neoclassical oval.
// Dynamically adapts to the active luxury cream / dark obsidian theme.

import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Line, Rect, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

import type { FacialMetrics } from '@/types';
import { useAppTheme } from '@/context/ThemeContext';

interface BiometricOverlayProps {
  visible: boolean;
  metrics: FacialMetrics | null;
}

const DEFAULT_THIRDS = { upper: 33.33, mid: 33.33, lower: 33.33 };

export function BiometricOverlay({ visible, metrics }: BiometricOverlayProps) {
  const { width, height } = useWindowDimensions();
  const { isDark } = useAppTheme();

  if (!visible) return null;

  const thirds = metrics
    ? {
        upper: metrics.verticalThirds.upperThirdPct,
        mid: metrics.verticalThirds.midThirdPct,
        lower: metrics.verticalThirds.lowerThirdPct,
      }
    : DEFAULT_THIRDS;

  // Calculate vertical positions based on image container dimensions
  const y1 = (thirds.upper / 100) * height; // Trichion → Glabella
  const y2 = ((thirds.upper + thirds.mid) / 100) * height; // Glabella → Subnasale

  // Golden ratio guide geometry
  const goldenW = Math.min(width * 0.52, 220);
  const goldenH = goldenW * 1.618;
  const goldenX = (width - goldenW) / 2;
  const goldenY = (height - goldenH) / 2;

  // High-end aesthetic palette (refined gold/champagne)
  const lineColor = isDark ? 'rgba(230, 198, 101, 0.55)' : 'rgba(160, 110, 59, 0.65)';
  const goldenColor = isDark ? 'rgba(212, 175, 55, 0.4)' : 'rgba(184, 134, 11, 0.35)';
  const textColor = isDark ? '#E6C665' : '#8A5D2A';
  const dotColor = isDark ? '#F5D77F' : '#A06E3B';

  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
      <Defs>
        <LinearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
          <Stop offset="50%" stopColor={lineColor} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={lineColor} stopOpacity="0.2" />
        </LinearGradient>
      </Defs>

      {/* ── Neoclassical Golden Ratio (φ = 1.618) Boundary ── */}
      <Rect
        x={goldenX}
        y={goldenY}
        width={goldenW}
        height={goldenH}
        rx={goldenW * 0.48}
        ry={goldenH * 0.38}
        fill="none"
        stroke={goldenColor}
        strokeWidth={1.2}
        strokeDasharray="4,4"
      />

      {/* ── Upper Third Guide (Glabella / Brow line) ── */}
      <Line
        x1={goldenX - 20}
        y1={y1}
        x2={goldenX + goldenW + 20}
        y2={y1}
        stroke="url(#goldGrad)"
        strokeWidth={1.2}
      />
      <Circle cx={goldenX - 20} cy={y1} r={2.5} fill={dotColor} />
      <Circle cx={goldenX + goldenW + 20} cy={y1} r={2.5} fill={dotColor} />
      <SvgText
        x={goldenX - 24}
        y={y1 - 6}
        fontSize={10}
        fontWeight="600"
        letterSpacing={1}
        fill={textColor}
        textAnchor="end"
      >
        GLABELLA · {thirds.upper.toFixed(1)}%
      </SvgText>

      {/* ── Mid Third Guide (Subnasale / Base of nose) ── */}
      <Line
        x1={goldenX - 20}
        y1={y2}
        x2={goldenX + goldenW + 20}
        y2={y2}
        stroke="url(#goldGrad)"
        strokeWidth={1.2}
      />
      <Circle cx={goldenX - 20} cy={y2} r={2.5} fill={dotColor} />
      <Circle cx={goldenX + goldenW + 20} cy={y2} r={2.5} fill={dotColor} />
      <SvgText
        x={goldenX - 24}
        y={y2 - 6}
        fontSize={10}
        fontWeight="600"
        letterSpacing={1}
        fill={textColor}
        textAnchor="end"
      >
        SUBNASALE · {thirds.mid.toFixed(1)}%
      </SvgText>

      {/* ── Lower Third Label (Gnathion / Chin) ── */}
      <SvgText
        x={goldenX - 24}
        y={Math.min(y2 + (height - y2) * 0.65, height - 12)}
        fontSize={10}
        fontWeight="600"
        letterSpacing={1}
        fill={textColor}
        textAnchor="end"
      >
        GNATHION · {thirds.lower.toFixed(1)}%
      </SvgText>
    </Svg>
  );
}

// ─── StyleCard ───────────────────────────────────────────────────────────────
// Displays a single recommended hairstyle with match badge, category pill,
// volume tag row, and a "Simulate Try-On" CTA (placeholder — wired by Muse).

import React, { useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { HairstyleOption, StylingPrescription } from '@/types';

interface StyleCardProps {
  style: HairstyleOption;
  volumeProfile: StylingPrescription['volumeProfile'];
  onTryOn?: (styleId: string) => void;
}

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  bg: '#09090b',
  card: '#18181b',
  cardHover: '#1c1c1f',
  border: '#27272a',
  text: '#fafafa',
  muted: '#a1a1aa',
  cyan: '#22d3ee',
  amber: '#f59e0b',
  purple: '#a855f7',
  green: '#4ade80',
  pink: '#f472b6',
};

function matchColor(score: number): string {
  if (score >= 90) return C.green;
  if (score >= 75) return C.amber;
  return C.pink;
}

function VolumeTag({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.volumeTag}>
      <Text style={styles.tagLabel}>{label}</Text>
      <Text style={styles.tagValue}>{value.replace('_', ' ').toUpperCase()}</Text>
    </View>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export function StyleCard({ style, volumeProfile, onTryOn }: StyleCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const accentColor = matchColor(style.suitabilityScore);

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  }

  function handleBtnIn() {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  }

  function handleBtnOut() {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  }

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }], borderColor: accentColor + '33' }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible={true}
        accessibilityLabel={`${style.name} hairstyle card`}
      >
        {/* ── Top row: image + header ── */}
        <View style={styles.topRow}>
          <Image
            source={{ uri: style.previewUrl }}
            style={styles.previewImage}
            resizeMode="cover"
            accessibilityLabel={`${style.name} preview`}
          />
          <View style={styles.headerBlock}>
            {/* Name + category pill */}
            <View style={styles.nameLine}>
              <Text style={styles.styleName} numberOfLines={1}>{style.name}</Text>
            </View>
            <View style={[styles.categoryPill, { borderColor: accentColor + '66' }]}>
              <Text style={[styles.categoryText, { color: accentColor }]}>
                {style.category}
              </Text>
            </View>
            {/* Match badge */}
            <View style={[styles.matchBadge, { backgroundColor: accentColor + '20', borderColor: accentColor + '55' }]}>
              <View style={[styles.matchDot, { backgroundColor: accentColor }]} />
              <Text style={[styles.matchText, { color: accentColor }]}>
                {style.suitabilityScore}% Match
              </Text>
            </View>
          </View>
        </View>

        {/* ── Explanation ── */}
        <Text style={styles.whyText}>{style.whyItWorks}</Text>

        {/* ── Volume profile tags ── */}
        <View style={styles.tagRow}>
          <VolumeTag label="CROWN" value={volumeProfile.crown} />
          <VolumeTag label="SIDES" value={volumeProfile.lateralSides} />
          <VolumeTag label="FOREHEAD" value={volumeProfile.foreheadCoverage} />
        </View>

        {/* ── Try-On CTA ── */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <Pressable
            style={[styles.tryOnButton, { borderColor: accentColor + '88' }]}
            onPressIn={handleBtnIn}
            onPressOut={handleBtnOut}
            onPress={() => onTryOn?.(style.id)}
            accessibilityLabel="Simulate Try-On"
            accessibilityRole="button"
          >
            <Text style={[styles.tryOnIcon]}>✦</Text>
            <Text style={[styles.tryOnText, { color: accentColor }]}>
              Simulate Try-On
            </Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  previewImage: {
    width: 72,
    height: 88,
    borderRadius: 10,
    backgroundColor: '#27272a',
  },
  headerBlock: {
    flex: 1,
    gap: 7,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  styleName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    flex: 1,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
  },
  matchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  whyText: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 19,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  volumeTag: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 3,
  },
  tagLabel: {
    fontSize: 8,
    color: C.muted,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  tagValue: {
    fontSize: 9,
    color: C.text,
    fontFamily: 'monospace',
    fontWeight: '700',
    textAlign: 'center',
  },
  tryOnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    gap: 7,
    backgroundColor: '#ffffff08',
  },
  tryOnIcon: {
    fontSize: 14,
    color: '#a855f7',
  },
  tryOnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

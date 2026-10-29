// ─── StyleCard ───────────────────────────────────────────────────────────────
// High-fashion hairstyle recommendation card with short, readable benefits
// and buttery iOS spring animations.

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
import { useAppTheme } from '@/context/ThemeContext';

interface StyleCardProps {
  style: HairstyleOption;
  volumeProfile: StylingPrescription['volumeProfile'];
  onTryOn?: (styleId: string) => void;
}

export function StyleCard({ style, volumeProfile, onTryOn }: StyleCardProps) {
  const { colors, isDark } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  }

  function handleBtnIn() {
    Animated.spring(btnScale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  function handleBtnOut() {
    Animated.spring(btnScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 35,
    }).start();
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgElevated,
          borderColor: colors.border,
          shadowColor: colors.cardShadow,
        },
      ]}
    >
      {/* Top: Image + Header info */}
      <View style={styles.topRow}>
          <Image
            source={{ uri: style.previewUrl }}
            style={[styles.thumbnail, { backgroundColor: colors.bgSubtle }]}
            resizeMode="cover"
          />

          <View style={styles.headerInfo}>
            <View style={styles.titleLine}>
              <Text style={[styles.styleName, { color: colors.text }]} numberOfLines={1}>
                {style.name}
              </Text>
            </View>

            <View style={styles.pillsRow}>
              <View style={[styles.categoryPill, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                  {style.category}
                </Text>
              </View>

              <View style={[styles.matchBadge, { backgroundColor: colors.accentGreenLight }]}>
                <View style={[styles.matchDot, { backgroundColor: colors.accentGreen }]} />
                <Text style={[styles.matchText, { color: colors.accentGreen }]}>
                  {style.suitabilityScore}% Match
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Compact Volume Spec tags */}
        <View style={[styles.tagBar, { backgroundColor: colors.bgSubtle }]}>
          <Text style={[styles.tagText, { color: colors.textSecondary }]}>
            Crown: <Text style={{ color: colors.text, fontWeight: '700' }}>{volumeProfile.crown.toUpperCase()}</Text>
          </Text>
          <Text style={{ color: colors.border }}>·</Text>
          <Text style={[styles.tagText, { color: colors.textSecondary }]}>
            Temples: <Text style={{ color: colors.text, fontWeight: '700' }}>{volumeProfile.lateralSides.toUpperCase()}</Text>
          </Text>
          <Text style={{ color: colors.border }}>·</Text>
          <Text style={[styles.tagText, { color: colors.textSecondary }]}>
            Fringe: <Text style={{ color: colors.text, fontWeight: '700' }}>{volumeProfile.foreheadCoverage.replace('_', ' ').toUpperCase()}</Text>
          </Text>
        </View>

        {/* Buttery CTA Button */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable
            style={[
              styles.tryOnButton,
              {
                backgroundColor: isDark ? colors.accentLight : colors.bg,
                borderColor: colors.accent,
              },
            ]}
            onPressIn={handleBtnIn}
            onPressOut={handleBtnOut}
            onPress={() => onTryOn?.(style.id)}
          >
            <Text style={[styles.tryOnIcon, { color: colors.accent }]}>✦</Text>
            <Text style={[styles.tryOnText, { color: colors.accent }]}>
              Simulate Try-On (Modal GPU)
            </Text>
          </Pressable>
        </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  thumbnail: {
    width: 76,
    height: 88,
    borderRadius: 14,
  },
  headerInfo: {
    flex: 1,
    gap: 5,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  styleName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  matchDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  matchText: {
    fontSize: 10,
    fontWeight: '700',
  },
  whyText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  tagBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  tryOnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    gap: 6,
    marginTop: 4,
  },
  tryOnIcon: {
    fontSize: 13,
  },
  tryOnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});

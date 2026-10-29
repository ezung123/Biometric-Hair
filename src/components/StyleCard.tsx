// ─── StyleCard ───────────────────────────────────────────────────────────────
// Bespoke editorial hairstyle recommendation card with buttery iOS spring physics.
// Adapts reactively to Luxury Cream and Titanium Obsidian themes.

import React, { useRef, useState } from 'react';
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
  const [isSimulating, setIsSimulating] = useState(false);
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

  async function handleSimulate() {
    setIsSimulating(true);
    onTryOn?.(style.id);
    setTimeout(() => {
      setIsSimulating(false);
    }, 1200);
  }

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ scale }],
          backgroundColor: colors.bgElevated,
          borderColor: colors.border,
          shadowColor: colors.cardShadow,
        },
      ]}
    >
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
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
                  {style.suitabilityScore}% Harmony
                </Text>
              </View>
            </View>

            <Text style={[styles.whyText, { color: colors.textSecondary }]} numberOfLines={3}>
              {style.whyItWorks}
            </Text>
          </View>
        </View>

        {/* Volume tags */}
        <View style={[styles.tagBar, { backgroundColor: colors.bgSubtle }]}>
          <View style={styles.tagItem}>
            <Text style={[styles.tagKey, { color: colors.textMuted }]}>CROWN</Text>
            <Text style={[styles.tagVal, { color: colors.text }]}>{volumeProfile.crown.toUpperCase()}</Text>
          </View>
          <View style={[styles.tagDivider, { backgroundColor: colors.border }]} />
          <View style={styles.tagItem}>
            <Text style={[styles.tagKey, { color: colors.textMuted }]}>TEMPLES</Text>
            <Text style={[styles.tagVal, { color: colors.text }]}>{volumeProfile.lateralSides.toUpperCase()}</Text>
          </View>
          <View style={[styles.tagDivider, { backgroundColor: colors.border }]} />
          <View style={styles.tagItem}>
            <Text style={[styles.tagKey, { color: colors.textMuted }]}>FRINGE</Text>
            <Text style={[styles.tagVal, { color: colors.text }]}>
              {volumeProfile.foreheadCoverage.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
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
            onPress={handleSimulate}
          >
            <Text style={[styles.tryOnIcon, { color: colors.accent }]}>
              {isSimulating ? '◌' : '✦'}
            </Text>
            <Text style={[styles.tryOnText, { color: colors.accent }]}>
              {isSimulating ? 'Simulating on Modal GPU...' : 'Simulate Try-On'}
            </Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  thumbnail: {
    width: 84,
    height: 100,
    borderRadius: 14,
  },
  headerInfo: {
    flex: 1,
    gap: 6,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  styleName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  matchDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  matchText: {
    fontSize: 11,
    fontWeight: '700',
  },
  whyText: {
    fontSize: 12,
    lineHeight: 17,
  },
  tagBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 2,
  },
  tagItem: {
    alignItems: 'center',
    gap: 2,
  },
  tagKey: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  tagVal: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tagDivider: {
    width: 1,
    height: 16,
  },
  tryOnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 11,
    gap: 8,
    marginTop: 10,
  },
  tryOnIcon: {
    fontSize: 14,
  },
  tryOnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});

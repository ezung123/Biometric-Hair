// ══════════════════════════════════════════════════════════════════════════════
// src/components/CompareModal.tsx
// SIDE-BY-SIDE REFERENCE LOOK COMPARISON STUDIO
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppTheme } from '@/context/ThemeContext';
import { HAIRSTYLE_CATALOG, type CatalogStyle } from '@/constants/catalog';

interface CompareModalProps {
  visible: boolean;
  onClose: () => void;
  styleA: CatalogStyle | null;
  onSelectStyle: (style: CatalogStyle) => void;
}

export function CompareModal({
  visible,
  onClose,
  styleA,
  onSelectStyle,
}: CompareModalProps) {
  const { colors, isDark } = useAppTheme();

  // Style B picker selection
  const otherStyles = HAIRSTYLE_CATALOG.filter((s) => s.id !== styleA?.id);
  const [styleBId, setStyleBId] = useState<string>(otherStyles[0]?.id || '');

  if (!styleA) return null;
  const styleB = HAIRSTYLE_CATALOG.find((s) => s.id === styleBId) || otherStyles[0];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.overline, { color: colors.accent }]}>SIDE-BY-SIDE EVALUATION</Text>
              <Text style={[styles.title, { color: colors.text }]}>Compare Reference Looks</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
              accessibilityLabel="Close comparison"
            >
              <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          {/* Quick Style B Switcher Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pickerRow}
            contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
          >
            <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Compare with:</Text>
            {otherStyles.map((s) => {
              const isSel = s.id === styleB?.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setStyleBId(s.id)}
                  style={[
                    styles.pickerChip,
                    { backgroundColor: isSel ? colors.accent : colors.bgSubtle, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.pickerChipText, { color: isSel ? '#FFFFFF' : colors.text }]}>
                    {s.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Side-by-Side Dual Column Grid */}
            <View style={styles.comparisonGrid}>
              {/* Column A */}
              <View style={[styles.columnCard, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
                <View style={styles.colImageFrame}>
                  <Image source={{ uri: styleA.images[0].file }} style={styles.colImage} resizeMode="cover" />
                  <View style={styles.colTag}>
                    <Text style={styles.colTagText}>LOOK 1</Text>
                  </View>
                </View>
                <Text style={[styles.styleName, { color: colors.text }]}>{styleA.name}</Text>
                <Text style={[styles.lengthText, { color: colors.textSecondary }]}>{styleA.lengthClass.toUpperCase()} · {styleA.category}</Text>

                {/* Metrics */}
                <View style={styles.metricBlock}>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Crown Volume</Text>
                  <Text style={[styles.metricVal, { color: colors.text }]}>{styleA.volumeProfile.crown.toUpperCase()}</Text>

                  <Text style={[styles.metricLabel, { color: colors.textSecondary, marginTop: 6 }]}>Side Boundary</Text>
                  <Text style={[styles.metricVal, { color: colors.text }]}>{styleA.volumeProfile.sides.toUpperCase()}</Text>

                  <Text style={[styles.metricLabel, { color: colors.textSecondary, marginTop: 6 }]}>Fringe</Text>
                  <Text style={[styles.metricVal, { color: colors.text }]}>{styleA.volumeProfile.fringe.replace('_', ' ').toUpperCase()}</Text>

                  <Text style={[styles.metricLabel, { color: colors.textSecondary, marginTop: 6 }]}>Trim Frequency</Text>
                  <Text style={[styles.metricVal, { color: colors.text }]}>{styleA.maintenance.trimIntervalWeeks} wks</Text>
                </View>

                <Pressable
                  onPress={() => {
                    onClose();
                    onSelectStyle(styleA);
                  }}
                  style={[styles.chooseBtn, { backgroundColor: colors.accent }]}
                >
                  <Text style={styles.chooseBtnText}>CHOOSE LOOK 1</Text>
                </Pressable>
              </View>

              {/* Column B */}
              {styleB && (
                <View style={[styles.columnCard, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
                  <View style={styles.colImageFrame}>
                    <Image source={{ uri: styleB.images[0].file }} style={styles.colImage} resizeMode="cover" />
                    <View style={styles.colTag}>
                      <Text style={styles.colTagText}>LOOK 2</Text>
                    </View>
                  </View>
                  <Text style={[styles.styleName, { color: colors.text }]}>{styleB.name}</Text>
                  <Text style={[styles.lengthText, { color: colors.textSecondary }]}>{styleB.lengthClass.toUpperCase()} · {styleB.category}</Text>

                  {/* Metrics */}
                  <View style={styles.metricBlock}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Crown Volume</Text>
                    <Text style={[styles.metricVal, { color: colors.text }]}>{styleB.volumeProfile.crown.toUpperCase()}</Text>

                    <Text style={[styles.metricLabel, { color: colors.textSecondary, marginTop: 6 }]}>Side Boundary</Text>
                    <Text style={[styles.metricVal, { color: colors.text }]}>{styleB.volumeProfile.sides.toUpperCase()}</Text>

                    <Text style={[styles.metricLabel, { color: colors.textSecondary, marginTop: 6 }]}>Fringe</Text>
                    <Text style={[styles.metricVal, { color: colors.text }]}>{styleB.volumeProfile.fringe.replace('_', ' ').toUpperCase()}</Text>

                    <Text style={[styles.metricLabel, { color: colors.textSecondary, marginTop: 6 }]}>Trim Frequency</Text>
                    <Text style={[styles.metricVal, { color: colors.text }]}>{styleB.maintenance.trimIntervalWeeks} wks</Text>
                  </View>

                  <Pressable
                    onPress={() => {
                      onClose();
                      onSelectStyle(styleB);
                    }}
                    style={[styles.chooseBtn, { backgroundColor: isDark ? '#FFFFFF' : '#14161A' }]}
                  >
                    <Text style={[styles.chooseBtnText, { color: isDark ? '#14161A' : '#FFFFFF' }]}>
                      CHOOSE LOOK 2
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  overline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pickerRow: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    alignSelf: 'center',
    marginRight: 4,
  },
  pickerChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  pickerChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scroll: {
    marginTop: 4,
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  columnCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
  },
  colImageFrame: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  colImage: {
    width: '100%',
    height: '100%',
  },
  colTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(17, 18, 21, 0.82)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  colTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  styleName: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  lengthText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 8,
  },
  metricBlock: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(120, 120, 128, 0.15)',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  chooseBtn: {
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});


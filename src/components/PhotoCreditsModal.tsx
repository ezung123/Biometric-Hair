// ══════════════════════════════════════════════════════════════════════════════
// src/components/PhotoCreditsModal.tsx
// IN-APP PHOTO CREDITS & OPEN LICENSE ATTRIBUTION SHEET
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppTheme } from '@/context/ThemeContext';
import { HAIRSTYLE_CATALOG } from '@/constants/catalog';

interface PhotoCreditsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PhotoCreditsModal({ visible, onClose }: PhotoCreditsModalProps) {
  const { colors } = useAppTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.overline, { color: colors.accent }]}>ATTRIBUTION & LICENSES</Text>
              <Text style={[styles.title, { color: colors.text }]}>Photo Credits</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
              accessibilityLabel="Close credits"
            >
              <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.introText, { color: colors.textSecondary }]}>
              Biometric Hair AI respects intellectual property and credits the photographers and contributors of our multi-angle lookbook reference library under Creative Commons and open salon archive licenses.
            </Text>

            {HAIRSTYLE_CATALOG.map((style) => (
              <View
                key={style.id}
                style={[styles.creditCard, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
              >
                <Text style={[styles.styleTitle, { color: colors.text }]}>{style.name}</Text>
                <Text style={[styles.styleSub, { color: colors.accent }]}>
                  {style.audience.toUpperCase()} · {style.lengthClass.toUpperCase()} · {style.category}
                </Text>

                <View style={styles.viewsList}>
                  {style.images.map((img) => (
                    <View key={img.view} style={styles.viewRow}>
                      <View style={styles.viewDot} />
                      <Text style={[styles.viewText, { color: colors.text }]}>
                        <Text style={{ fontWeight: '800' }}>{img.view.toUpperCase()} VIEW: </Text>
                        {img.author} · <Text style={{ fontStyle: 'italic' }}>{img.license}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <View style={{ height: 32 }} />
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
    maxHeight: '85%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: 14,
    paddingHorizontal: 20,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  overline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 20,
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
  scroll: {
    marginTop: 12,
  },
  introText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  creditCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  styleTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  styleSub: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 2,
    marginBottom: 8,
  },
  viewsList: {
    gap: 4,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  viewDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#16A34A',
    marginTop: 6,
  },
  viewText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
});


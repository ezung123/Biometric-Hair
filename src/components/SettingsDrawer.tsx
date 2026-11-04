// ─── SettingsDrawer (Pristine iOS Native Aesthetic) ──────────────────────────
// Clean, minimal, typography-driven iOS navigation drawer.
// Zero emojis, zero verbose paragraphs, pure Apple Human Interface design.

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

interface SettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigateHome: () => void;
  onOpenLearnAboutFace: () => void;
  onOpenLearnHairstyles: () => void;
  onOpenAboutUs: () => void;
  cameraActive: boolean;
  onToggleCamera: () => void;
}

export const SettingsDrawer = React.memo(function SettingsDrawer({
  visible,
  onClose,
  onNavigateHome,
  onOpenLearnAboutFace,
  onOpenLearnHairstyles,
  onOpenAboutUs,
  cameraActive = true,
  onToggleCamera,
}: SettingsDrawerProps) {
  const { colors, mode, toggleTheme, isDark } = useAppTheme();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Dimmed backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close menu" />

        {/* Inset iOS Style Drawer Container */}
        <View
          style={[
            styles.drawer,
            {
              backgroundColor: colors.bg,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.drawerTitle, { color: colors.text }]}>Biometric Hair Arch</Text>
              <Text style={[styles.drawerSubtitle, { color: colors.accent }]}>Version 1.0.0</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: colors.bgSubtle,
                  borderColor: colors.border,
                },
              ]}
              accessibilityLabel="Close menu"
            >
              <Text style={[styles.closeBtnText, { color: colors.text }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* ── Section: Navigation ── */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>NAVIGATION</Text>
            <View style={[styles.groupedCard, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
              {/* Home */}
              <Pressable
                onPress={() => {
                  onClose();
                  onNavigateHome();
                }}
                style={[styles.rowItem, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.rowLabel, { color: colors.text }]}>Home</Text>
                <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
              </Pressable>

              {/* Haircut Architecture */}
              <Pressable
                onPress={() => {
                  onClose();
                  onOpenLearnHairstyles();
                }}
                style={[styles.rowItem, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.rowLabel, { color: colors.text }]}>Haircut Architecture</Text>
                <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
              </Pressable>

              {/* Facial Proportions */}
              <Pressable
                onPress={() => {
                  onClose();
                  onOpenLearnAboutFace();
                }}
                style={[styles.rowItem, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.rowLabel, { color: colors.text }]}>Facial Proportions (φ 1.618)</Text>
                <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
              </Pressable>

              {/* About Us */}
              <Pressable
                onPress={() => {
                  onClose();
                  onOpenAboutUs();
                }}
                style={styles.rowItemLast}
              >
                <Text style={[styles.rowLabel, { color: colors.text }]}>About Us</Text>
                <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
              </Pressable>
            </View>

            {/* ── Section: Controls & Preferences ── */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>CONTROLS</Text>
            <View style={[styles.groupedCard, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
              {/* Laptop Camera Toggle */}
              <View style={[styles.rowItem, { borderBottomColor: colors.border }]}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Webcam Stream</Text>
                <Pressable
                  onPress={onToggleCamera}
                  style={[
                    styles.togglePill,
                    {
                      backgroundColor: cameraActive
                        ? isDark ? '#30D158' : '#16A34A'
                        : colors.bgSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.togglePillText, { color: cameraActive ? '#FFFFFF' : colors.textSecondary }]}>
                    {cameraActive ? 'Enabled' : 'Disabled'}
                  </Text>
                </Pressable>
              </View>

              {/* Interface Theme */}
              <View style={styles.rowItemLast}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Appearance</Text>
                <Pressable
                  onPress={toggleTheme}
                  style={[
                    styles.segmentedControl,
                    { backgroundColor: colors.bgSubtle, borderColor: colors.border, borderWidth: 1 },
                  ]}
                >
                  <Text style={[styles.segmentLabel, { color: colors.text }]}>
                    {mode === 'light' ? 'Pearl White' : 'Dark'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* ── Section: AI Compute Infrastructure ── */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>AI ENGINE ARCHITECTURE</Text>
            <View style={[styles.groupedCard, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
              <View style={[styles.rowItem, { borderBottomColor: colors.border }]}>
                <View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>Muse Spark Open (816B)</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Cephalometrics & Salon Concierge</Text>
                </View>
                <Text style={[styles.badgeText, { color: isDark ? '#30D158' : '#16A34A', fontWeight: '700' }]}>LIVE (Baseten)</Text>
              </View>
              <View style={[styles.rowItem, { borderBottomColor: colors.border }]}>
                <View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>MediaPipe FaceLandmarker</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>468 3D Landmarks & Head Pose</Text>
                </View>
                <Text style={[styles.badgeText, { color: isDark ? '#30D158' : '#16A34A', fontWeight: '700' }]}>ON-DEVICE</Text>
              </View>
              <View style={[styles.rowItem, { borderBottomColor: colors.border }]}>
                <View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>Meta Muse Image</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Instruction Edit (OpenRouter)</Text>
                </View>
                <Text style={[styles.badgeText, { color: '#FF9F0A', fontWeight: '700' }]}>PROXY READY</Text>
              </View>
              <View style={styles.rowItemLast}>
                <View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>Neoclassical Anthropometrics</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Deterministic Renaissance Math</Text>
                </View>
                <Text style={[styles.badgeText, { color: colors.accent, fontWeight: '700' }]}>OFFLINE FALLBACK</Text>
              </View>
            </View>

            {/* ── Section: Privacy & Legal ── */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>PRIVACY & LEGAL</Text>
            <View style={[styles.groupedCard, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
              <Pressable
                onPress={() => {
                  onClose();
                  onOpenAboutUs();
                }}
                style={[styles.rowItem, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.rowLabel, { color: colors.text }]}>Biometric Data Protection</Text>
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Zero Storage (GDPR)</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onClose();
                  onOpenAboutUs();
                }}
                style={styles.rowItemLast}
              >
                <Text style={[styles.rowLabel, { color: colors.text }]}>Terms of Service & AI Ethics</Text>
                <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
              </Pressable>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Meta Global AI Developer Hackathon Edition
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  drawer: {
    width: '84%',
    maxWidth: 360,
    height: '100%',
    marginLeft: 'auto',
    borderLeftWidth: 1,
    paddingTop: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  drawerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 12,
    marginTop: 18,
  },
  groupedCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowItemLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  chevron: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '400',
  },
  togglePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  togglePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  segmentedControl: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

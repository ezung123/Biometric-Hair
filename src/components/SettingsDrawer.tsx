// ─── SettingsDrawer ─────────────────────────────────────────────────────────
// Slide-out App Store settings & legal drawer with theme toggle, biometric privacy policy,
// terms of service, and AI model architecture info.

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
  onNavigateToLearn: () => void;
}

export function SettingsDrawer({ visible, onClose, onNavigateToLearn }: SettingsDrawerProps) {
  const { colors, mode, toggleTheme, isDark } = useAppTheme();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Dimmed backdrop (tap to dismiss) */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Drawer container (slides from left) */}
        <View
          style={[
            styles.drawer,
            {
              backgroundColor: colors.bgElevated,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Drawer Header */}
          <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.drawerTitle, { color: colors.text }]}>BIOMETRIC HAIR ARCH</Text>
              <Text style={[styles.drawerSubtitle, { color: colors.accent }]}>App Settings &amp; Legal</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
            >
              <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* ── Preferences Section ── */}
            <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>PREFERENCES</Text>

            <View style={[styles.rowCard, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Interface Theme</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  {mode === 'light' ? 'Bespoke Luxury Cream' : 'Titanium Obsidian'}
                </Text>
              </View>
              <Pressable
                onPress={toggleTheme}
                style={[styles.actionPill, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}
              >
                <Text style={[styles.actionPillText, { color: colors.text }]}>
                  {mode === 'light' ? '☀️ Cream' : '🌙 Dark'}
                </Text>
              </Pressable>
            </View>

            {/* ── Education & Guide ── */}
            <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>EDUCATION</Text>

            <Pressable
              onPress={() => {
                onClose();
                onNavigateToLearn();
              }}
              style={[styles.rowCard, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
            >
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Hair Architecture Guide</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  The science of Golden Ratio φ &amp; Farkas thirds
                </Text>
              </View>
              <Text style={[styles.arrowText, { color: colors.accent }]}>→</Text>
            </Pressable>

            {/* ── AI Engine & Infrastructure ── */}
            <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>AI INFRASTRUCTURE</Text>

            <View style={[styles.infoCard, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <View style={styles.engineRow}>
                <Text style={[styles.engineName, { color: colors.text }]}>Meta Muse Spark Open</Text>
                <View style={[styles.statusBadge, { backgroundColor: colors.accentGreenLight }]}>
                  <Text style={[styles.statusBadgeText, { color: colors.accentGreen }]}>Active · Baseten</Text>
                </View>
              </View>
              <Text style={[styles.engineDesc, { color: colors.textSecondary }]}>
                Deep reasoning agent running Neoclassical volumetric styling compensation.
              </Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <View style={styles.engineRow}>
                <Text style={[styles.engineName, { color: colors.text }]}>Meta SAM 3.1 &amp; Inpaint</Text>
                <View style={[styles.statusBadge, { backgroundColor: colors.accentGreenLight }]}>
                  <Text style={[styles.statusBadgeText, { color: colors.accentGreen }]}>Active · Modal GPU</Text>
                </View>
              </View>
              <Text style={[styles.engineDesc, { color: colors.textSecondary }]}>
                Zero-shot scalp segmentation and generative hairstyle try-on pipeline.
              </Text>
            </View>

            {/* ── App Store Legal & Privacy ── */}
            <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>LEGAL &amp; PRIVACY</Text>

            <View style={[styles.legalCard, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <Text style={[styles.legalTitle, { color: colors.text }]}>Biometric Data Protection (GDPR / CCPA)</Text>
              <Text style={[styles.legalBody, { color: colors.textSecondary }]}>
                Biometric Hair Arch processes dense facial keypoints in real time. All landmark vectors and facial geometry measurements are ephemeral and never sold or shared with third parties.
              </Text>
            </View>

            <View style={[styles.legalCard, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}>
              <Text style={[styles.legalTitle, { color: colors.text }]}>Terms of Service</Text>
              <Text style={[styles.legalBody, { color: colors.textSecondary }]}>
                Styling prescriptions and try-on simulations are AI-generated approximations intended for aesthetic consultation.
              </Text>
            </View>

            {/* Version */}
            <View style={styles.versionBlock}>
              <Text style={[styles.versionText, { color: colors.textMuted }]}>
                Biometric Hair Arch · Version 1.0.0 (Build 2026.10)
              </Text>
              <Text style={[styles.copyrightText, { color: colors.textMuted }]}>
                Meta Global AI Developer Hackathon Edition
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  drawer: {
    width: '84%',
    maxWidth: 360,
    height: '100%',
    borderRightWidth: 1,
    paddingTop: 48,
    paddingBottom: 24,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
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
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  drawerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 6,
  },
  rowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  actionPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  arrowText: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  engineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  engineName: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  engineDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  legalCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  legalTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  legalBody: {
    fontSize: 10,
    lineHeight: 14,
  },
  versionBlock: {
    alignItems: 'center',
    marginTop: 12,
    gap: 3,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  copyrightText: {
    fontSize: 9,
  },
});

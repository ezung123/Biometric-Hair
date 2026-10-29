// ─── SettingsDrawer ─────────────────────────────────────────────────────────
// Clean, standard mobile app navigation drawer (Snapchat/Lensa style) with Home,
// About Us, Learn About Hairstyles, Learn About Your Face, theme preferences, and legal.

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
}

export function SettingsDrawer({
  visible,
  onClose,
  onNavigateHome,
  onOpenLearnAboutFace,
  onOpenLearnHairstyles,
  onOpenAboutUs,
}: SettingsDrawerProps) {
  const { colors, mode, toggleTheme } = useAppTheme();

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

        {/* Drawer container (slides from left or right) */}
        <View
          style={[
            styles.drawer,
            {
              backgroundColor: colors.bgElevated,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Drawer Brand Header */}
          <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.drawerTitle, { color: colors.text }]}>BIOMETRIC HAIR ARCH</Text>
              <Text style={[styles.drawerSubtitle, { color: colors.accent }]}>Computational Aesthetics · φ</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
            >
              <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* ── 1. Main Navigation ── */}
            <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>MENU</Text>

            {/* Home */}
            <Pressable
              onPress={() => {
                onClose();
                onNavigateHome();
              }}
              style={[styles.navItem, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
            >
              <Text style={styles.navIcon}>🏠</Text>
              <View style={styles.navTextCol}>
                <Text style={[styles.navTitle, { color: colors.text }]}>Home</Text>
                <Text style={[styles.navSubtitle, { color: colors.textSecondary }]}>Live Camera &amp; AI Mirror</Text>
              </View>
              <Text style={[styles.navArrow, { color: colors.accent }]}>→</Text>
            </Pressable>

            {/* Learn About Hairstyles */}
            <Pressable
              onPress={() => {
                onClose();
                onOpenLearnHairstyles();
              }}
              style={[styles.navItem, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
            >
              <Text style={styles.navIcon}>✂️</Text>
              <View style={styles.navTextCol}>
                <Text style={[styles.navTitle, { color: colors.text }]}>Learn About Hairstyles</Text>
                <Text style={[styles.navSubtitle, { color: colors.textSecondary }]}>Crown height, volume &amp; fade profiles</Text>
              </View>
              <Text style={[styles.navArrow, { color: colors.accent }]}>→</Text>
            </Pressable>

            {/* Learn About Your Face */}
            <Pressable
              onPress={() => {
                onClose();
                onOpenLearnAboutFace();
              }}
              style={[styles.navItem, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
            >
              <Text style={styles.navIcon}>📐</Text>
              <View style={styles.navTextCol}>
                <Text style={[styles.navTitle, { color: colors.text }]}>Learn About Your Face</Text>
                <Text style={[styles.navSubtitle, { color: colors.textSecondary }]}>Golden Ratio φ &amp; Farkas 33% thirds</Text>
              </View>
              <Text style={[styles.navArrow, { color: colors.accent }]}>→</Text>
            </Pressable>

            {/* About Us */}
            <Pressable
              onPress={() => {
                onClose();
                onOpenAboutUs();
              }}
              style={[styles.navItem, { backgroundColor: colors.bgSubtle, borderColor: colors.border }]}
            >
              <Text style={styles.navIcon}>ℹ️</Text>
              <View style={styles.navTextCol}>
                <Text style={[styles.navTitle, { color: colors.text }]}>About Us</Text>
                <Text style={[styles.navSubtitle, { color: colors.textSecondary }]}>Our Mission &amp; Meta Hackathon Story</Text>
              </View>
              <Text style={[styles.navArrow, { color: colors.accent }]}>→</Text>
            </Pressable>

            {/* ── 2. Preferences ── */}
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

            {/* ── 3. AI Infrastructure ── */}
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

            {/* ── 4. Legal & Privacy ── */}
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

            {/* Version & Hackathon Attribution */}
            <View style={styles.footerNote}>
              <Text style={[styles.versionText, { color: colors.textMuted }]}>
                Biometric Hair Arch · Version 1.0.0 (Build 2026.10)
              </Text>
              <Text style={[styles.versionSubtext, { color: colors.textMuted }]}>
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
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  drawer: {
    width: '85%',
    maxWidth: 380,
    height: '100%',
    marginLeft: 'auto',
    borderLeftWidth: 1,
    paddingTop: 16,
    paddingBottom: 24,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  drawerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 18,
    marginBottom: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  navIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  navTextCol: {
    flex: 1,
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  navSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  navArrow: {
    fontSize: 16,
    fontWeight: '700',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  actionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  engineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  engineName: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  engineDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  legalCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  legalTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  legalBody: {
    fontSize: 11,
    lineHeight: 16,
  },
  footerNote: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  versionSubtext: {
    fontSize: 10,
    marginTop: 2,
  },
});

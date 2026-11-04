// ══════════════════════════════════════════════════════════════════════════════
// src/components/BarberBriefModal.tsx
// CLINICAL BARBER CONSULTATION BRIEF MODAL
// Multi-Angle Photos, Zone Table, What to Say, What to Avoid, Multilingual (EN/ES/ZH/FR),
// Print/PDF Export, Copy Text, and Share Actions
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import type { BarberBrief } from '@/stylist/tools';
import {
  type SupportedLanguage,
  I18N_DICTIONARY,
  translateBriefContent,
} from '@/stylist/translation';

export interface BarberBriefModalProps {
  visible: boolean;
  onClose: () => void;
  brief: BarberBrief | null;
  onSaveLook?: (styleId: string) => void;
  isSaved?: boolean;
}

export const BarberBriefModal: React.FC<BarberBriefModalProps> = ({
  visible,
  onClose,
  brief,
  onSaveLook,
  isSaved = false,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [language, setLanguage] = useState<SupportedLanguage>('EN');
  const [copied, setCopied] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<{
    askScript: string[];
    avoidList: string[];
    isMachineTranslated: boolean;
  }>({
    askScript: brief?.askScript || [],
    avoidList: brief?.avoidList || [],
    isMachineTranslated: false,
  });

  const i18n = I18N_DICTIONARY[language];

  useEffect(() => {
    if (!brief) return;
    let isMounted = true;
    setTranslating(true);

    translateBriefContent(brief, language)
      .then((res) => {
        if (isMounted) {
          setTranslatedContent(res);
          setTranslating(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setTranslatedContent({
            askScript: brief.askScript,
            avoidList: brief.avoidList,
            isMachineTranslated: false,
          });
          setTranslating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [brief, language]);

  if (!brief) return null;

  const handleCopyText = () => {
    const lines = [
      `═══════════════════════════════════════════════════════════════`,
      i18n.title,
      `Style: ${brief.styleName} (${brief.lengthClass.toUpperCase()})`,
      brief.clientBiometricsNote,
      `═══════════════════════════════════════════════════════════════`,
      ``,
      `[ZONE SPECIFICATIONS]`,
      `• ${i18n.topZone}: ${brief.zones.top.lengthCm}cm | ${brief.zones.top.directives}`,
      `• ${i18n.sidesZone}: ${brief.zones.sides.lengthCm}cm | Guard: ${brief.clipperGuards} | ${brief.zones.sides.guardOrDirectives}`,
      `• ${i18n.backZone}: ${brief.zones.back.lengthCm}cm | ${brief.zones.back.directives}`,
      `• ${i18n.fringeZone}: ${brief.zones.fringe.geometry} | ${brief.zones.fringe.directives}`,
      ``,
      `[WHAT TO SAY TO YOUR BARBER]`,
      ...translatedContent.askScript.map((s, i) => `${i + 1}. "${s}"`),
      ``,
      `[CRITICAL: WHAT TO AVOID]`,
      ...translatedContent.avoidList.map((a) => `⚠️ ${a}`),
      ``,
      `[MAINTENANCE & PRODUCTS]`,
      `• Trim Frequency: Every ${brief.maintenance.trimIntervalWeeks} weeks`,
      `• Styling Prep: ${brief.maintenance.stylingMinutes} minutes`,
      `• Products: ${brief.products.join(', ')}`,
      `• Regimen: ${brief.finishing}`,
      ``,
      i18n.disclosure,
    ].join('\n');

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(lines);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadPdf = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShare = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any)
        .share({
          title: `${brief.styleName} - Barber Consultation Brief`,
          text: `Check out my barber consultation brief for ${brief.styleName} on Biometric Hair Arch.`,
          url: window.location.href,
        })
        .catch(() => handleCopyText());
    } else {
      handleCopyText();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, isDesktop ? styles.desktopCard : styles.mobileCard]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Text style={styles.overline}>{brief.lengthClass.toUpperCase()} LOOKBOOK</Text>
                {translatedContent.isMachineTranslated && (
                  <View style={styles.transBadge}>
                    <Text style={styles.transBadgeText}>MACHINE TRANSLATED</Text>
                  </View>
                )}
              </View>
              <Text style={styles.title}>{brief.styleName}</Text>
              <Text style={styles.subtitle}>{i18n.title}</Text>
            </View>

            {/* Language Switcher */}
            <View style={styles.langSelector}>
              {(['EN', 'ES', 'ZH', 'FR'] as const).map((lang) => (
                <Pressable
                  key={lang}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch language to ${lang}`}
                  onPress={() => setLanguage(lang)}
                  style={[styles.langBtn, language === lang && styles.langBtnActive]}
                >
                  <Text style={[styles.langBtnText, language === lang && styles.langBtnTextActive]}>
                    {lang}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close barber brief"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Multi-Angle Photo Strip */}
            <Text style={styles.sectionTitle}>STUDIO REFERENCE LOOKBOOK (3 ANGLES)</Text>
            <View style={styles.photoRow}>
              {brief.images.map((img, idx) => (
                <View key={idx} style={styles.photoFrame}>
                  <Image source={{ uri: img.file }} style={styles.photoImg} resizeMode="cover" />
                  <View style={styles.photoLabelPill}>
                    <Text style={styles.photoLabelText}>{img.view.toUpperCase()}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Client Biometrics Grounding Notice */}
            <View style={styles.biometricNoticeBox}>
              <Text style={styles.biometricNoticeText}>📐 {brief.clientBiometricsNote}</Text>
            </View>

            {/* Zone Specifications Table */}
            <Text style={styles.sectionTitle}>ANATOMICAL ZONE CUTTING SPECIFICATIONS</Text>
            <View style={styles.zoneTable}>
              {/* Top / Crown */}
              <View style={styles.tableRow}>
                <View style={styles.zoneLabelCol}>
                  <Text style={styles.zoneName}>{i18n.topZone}</Text>
                  <Text style={styles.lengthBadge}>{brief.zones.top.lengthCm} cm</Text>
                </View>
                <View style={styles.zoneDescCol}>
                  <Text style={styles.zoneDirectives}>{brief.zones.top.directives}</Text>
                </View>
              </View>

              {/* Sides / Parietal */}
              <View style={[styles.tableRow, styles.tableRowAlt]}>
                <View style={styles.zoneLabelCol}>
                  <Text style={styles.zoneName}>{i18n.sidesZone}</Text>
                  <Text style={styles.lengthBadge}>{brief.zones.sides.lengthCm} cm</Text>
                  <Text style={styles.guardBadge}>Guard: {brief.clipperGuards}</Text>
                </View>
                <View style={styles.zoneDescCol}>
                  <Text style={styles.zoneDirectives}>{brief.zones.sides.guardOrDirectives}</Text>
                </View>
              </View>

              {/* Back / Occipital */}
              <View style={styles.tableRow}>
                <View style={styles.zoneLabelCol}>
                  <Text style={styles.zoneName}>{i18n.backZone}</Text>
                  <Text style={styles.lengthBadge}>{brief.zones.back.lengthCm} cm</Text>
                </View>
                <View style={styles.zoneDescCol}>
                  <Text style={styles.zoneDirectives}>{brief.zones.back.directives}</Text>
                </View>
              </View>

              {/* Fringe / Frontal */}
              <View style={[styles.tableRow, styles.tableRowAlt]}>
                <View style={styles.zoneLabelCol}>
                  <Text style={styles.zoneName}>{i18n.fringeZone}</Text>
                  <Text style={styles.lengthBadge}>{brief.zones.fringe.geometry}</Text>
                </View>
                <View style={styles.zoneDescCol}>
                  <Text style={styles.zoneDirectives}>{brief.zones.fringe.directives}</Text>
                </View>
              </View>
            </View>

            {/* What to Say to Your Barber */}
            <Text style={styles.sectionTitle}>💬 {i18n.askScriptTitle}</Text>
            <View style={styles.scriptBox}>
              {translating ? (
                <Text style={styles.loadingText}>Translating consultation script...</Text>
              ) : (
                translatedContent.askScript.map((script, idx) => (
                  <View key={idx} style={styles.scriptItem}>
                    <Text style={styles.scriptNum}>{idx + 1}</Text>
                    <Text style={styles.scriptText}>"{script}"</Text>
                  </View>
                ))
              )}
            </View>

            {/* What to Avoid */}
            <Text style={styles.sectionTitle}>⚠️ {i18n.avoidListTitle}</Text>
            <View style={styles.avoidBox}>
              {translatedContent.avoidList.map((item, idx) => (
                <View key={idx} style={styles.avoidItem}>
                  <Text style={styles.avoidIcon}>✕</Text>
                  <Text style={styles.avoidText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Maintenance & Regimen */}
            <Text style={styles.sectionTitle}>✂️ {i18n.maintenanceTitle}</Text>
            <View style={styles.metaGrid}>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>{i18n.trimInterval}</Text>
                <Text style={styles.metaValue}>Every {brief.maintenance.trimIntervalWeeks} Weeks</Text>
              </View>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>{i18n.stylingTime}</Text>
                <Text style={styles.metaValue}>{brief.maintenance.stylingMinutes} Minutes</Text>
              </View>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>{i18n.productsTitle}</Text>
                <Text style={styles.metaValue}>{brief.products.join(', ')}</Text>
              </View>
            </View>

            {/* Disclosure */}
            <Text style={styles.disclosureText}>{i18n.disclosure}</Text>
          </ScrollView>

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <Pressable
              onPress={handleCopyText}
              style={[styles.actionBtn, styles.primaryBtn]}
              accessibilityRole="button"
              accessibilityLabel="Copy brief text"
            >
              <Text style={styles.primaryBtnText}>
                {copied ? `✓ ${i18n.copiedBtn}` : `📋 ${i18n.copyBtn}`}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDownloadPdf}
              style={[styles.actionBtn, styles.secondaryBtn]}
              accessibilityRole="button"
              accessibilityLabel="Download PDF"
            >
              <Text style={styles.secondaryBtnText}>🖨️ {i18n.downloadPdfBtn}</Text>
            </Pressable>

            <Pressable
              onPress={handleShare}
              style={[styles.actionBtn, styles.secondaryBtn]}
              accessibilityRole="button"
              accessibilityLabel="Share brief"
            >
              <Text style={styles.secondaryBtnText}>🔗 {i18n.shareBtn}</Text>
            </Pressable>

            {onSaveLook && (
              <Pressable
                onPress={() => onSaveLook(brief.styleId)}
                style={[styles.actionBtn, styles.secondaryBtn]}
                accessibilityRole="button"
                accessibilityLabel="Save look"
              >
                <Text style={styles.secondaryBtnText}>
                  {isSaved ? '★ SAVED' : '☆ SAVE LOOK'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalCard: {
    backgroundColor: '#121214',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'column',
    maxHeight: '92%',
    overflow: 'hidden',
  },
  mobileCard: {
    width: '100%',
  },
  desktopCard: {
    width: 780,
    maxWidth: '92%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  overline: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#D4AF37',
  },
  transBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  transBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 2,
  },
  langSelector: {
    flexDirection: 'row',
    backgroundColor: '#1E1E22',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
  },
  langBtnActive: {
    backgroundColor: '#D4AF37',
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A1A1AA',
  },
  langBtnTextActive: {
    color: '#000000',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scroll: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  photoFrame: {
    flex: 1,
    aspectRatio: 4 / 5,
    backgroundColor: '#1E1E22',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoLabelPill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  biometricNoticeBox: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  biometricNoticeText: {
    fontSize: 11,
    color: '#E4E4E7',
    lineHeight: 16,
  },
  zoneTable: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#18181B',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tableRowAlt: {
    backgroundColor: '#1F1F23',
  },
  zoneLabelCol: {
    width: '38%',
    paddingRight: 8,
  },
  zoneName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lengthBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4AF37',
    marginTop: 2,
  },
  guardBadge: {
    fontSize: 10,
    color: '#A1A1AA',
    marginTop: 2,
  },
  zoneDescCol: {
    flex: 1,
    justifyContent: 'center',
  },
  zoneDirectives: {
    fontSize: 11,
    color: '#E4E4E7',
    lineHeight: 16,
  },
  scriptBox: {
    backgroundColor: '#18181B',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  scriptItem: {
    flexDirection: 'row',
    gap: 10,
  },
  scriptNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D4AF37',
    width: 16,
  },
  scriptText: {
    flex: 1,
    fontSize: 12,
    color: '#FFFFFF',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  loadingText: {
    fontSize: 12,
    color: '#A1A1AA',
    fontStyle: 'italic',
  },
  avoidBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    gap: 6,
  },
  avoidItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  avoidIcon: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  avoidText: {
    flex: 1,
    fontSize: 11,
    color: '#FCA5A5',
    lineHeight: 16,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metaCard: {
    flex: 1,
    backgroundColor: '#1E1E22',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metaLabel: {
    fontSize: 10,
    color: '#A1A1AA',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  disclosureText: {
    fontSize: 10,
    color: '#71717A',
    textAlign: 'center',
    marginBottom: 20,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#18181B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flex: 1,
    minWidth: 110,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  primaryBtn: {
    backgroundColor: '#D4AF37',
  },
  primaryBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  secondaryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

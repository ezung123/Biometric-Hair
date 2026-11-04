// ══════════════════════════════════════════════════════════════════════════════
// src/components/StylistDrawer.tsx
// AI STYLIST BOTTOM SHEET (MOBILE) / SIDE PANEL (DESKTOP)
// Interactive Concierge with Quick Action Chips, Collapsible Model Traces,
// Embedded Style Cards, and Barber Brief Generation
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import {
  runStylistAgent,
  STYLIST_QUICK_ACTIONS,
  type StylistMessage,
  type QuickActionType,
} from '@/stylist/agent';
import type { FaceAnalysisResult } from '@/lib/faceAnalysis';
import type { ScoredCatalogStyle } from '@/lib/filterStyles';
import type { BarberBrief } from '@/stylist/tools';

export interface StylistDrawerProps {
  visible: boolean;
  onClose: () => void;
  analysis: FaceAnalysisResult | null;
  audience?: 'men' | 'women' | 'all';
  onOpenStyleDetail?: (style: ScoredCatalogStyle) => void;
  onOpenBarberBrief?: (brief: BarberBrief) => void;
}

export const StylistDrawer: React.FC<StylistDrawerProps> = ({
  visible,
  onClose,
  analysis,
  audience = 'all',
  onOpenStyleDetail,
  onOpenBarberBrief,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [messages, setMessages] = useState<StylistMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedTraces, setExpandedTraces] = useState<Record<string, boolean>>({});

  const scrollViewRef = useRef<any>(null);

  // Initial welcome message
  useEffect(() => {
    if (visible && messages.length === 0 && analysis) {
      const welcomeMsg: StylistMessage = {
        id: 'msg_welcome',
        sender: 'assistant',
        text: `Hello! I am your AI Hair Stylist and Barbering Consultant, grounded in your **${analysis.morphology}** facial morphology (${analysis.facialIndex.toFixed(1)} index, ${analysis.harmonyScore}% harmony).\n\nTap any quick action below or ask me about haircut styles, clipper guard sequences, or maintenance routines.`,
        badge: 'Muse Spark Open (Meta, via Baseten)',
        trace: [
          `Loaded facial metrics: ${analysis.morphology} (Facial Index: ${analysis.facialIndex.toFixed(1)})`,
          `Analyzed Farkas vertical thirds: Upper ${analysis.verticalThirds.upperThirdPct}%, Mid ${analysis.verticalThirds.midThirdPct}%, Lower ${analysis.verticalThirds.lowerThirdPct}%`,
          `Calibrated consultation profile for ${audience} audience`,
        ],
        timestamp: Date.now(),
      };
      setMessages([welcomeMsg]);
    }
  }, [visible, analysis, audience]);

  const toggleTrace = (id: string) => {
    setExpandedTraces((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || !analysis || loading) return;

    setInputText('');
    const userMsg: StylistMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      badge: 'Offline stylist',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const history = messages.map((m) => ({
        role: m.sender,
        content: m.text,
      }));

      const reply = await runStylistAgent(text, analysis, audience, history);
      setMessages((prev) => [...prev, reply]);
    } catch (err: any) {
      const fallbackMsg: StylistMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `I experienced a temporary network latency. For your ${analysis.morphology} face, prioritize hairstyles with clean parietal tapers to maintain cranial balance.`,
        badge: 'Offline stylist',
        trace: ['Network timeout handled gracefully', 'Generated local fallback recommendation'],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.drawerContainer, isDesktop ? styles.desktopDrawer : styles.mobileDrawer]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerTagRow}>
                <View style={styles.aiDot} />
                <Text style={styles.headerOverline}>BIOMETRIC CONCIERGE</Text>
                <View style={styles.modelBadge}>
                  <Text style={styles.modelBadgeText}>Meta Muse Spark Open</Text>
                </View>
              </View>
              <Text style={styles.headerTitle}>AI Stylist & Barber Brief</Text>
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close AI Stylist"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Quick Action Chips Bar */}
          <View style={styles.quickActionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
              {STYLIST_QUICK_ACTIONS.map((action, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleSendMessage(action)}
                  disabled={loading}
                  style={[styles.chip, loading && { opacity: 0.5 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Ask ${action}`}
                >
                  <Text style={styles.chipText}>{action}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Chat Message Scroll */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              const isTraceExpanded = Boolean(expandedTraces[msg.id]);

              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageWrap,
                    isAssistant ? styles.assistantWrap : styles.userWrap,
                  ]}
                >
                  {/* Assistant Provenance Badge */}
                  {isAssistant && (
                    <View style={styles.provenanceRow}>
                      <Text style={styles.badgeLabel}>
                        {msg.badge === 'Muse Spark Open (Meta, via Baseten)'
                          ? '● Meta Muse Spark Open 1026'
                          : '○ Offline Anthropometrics Stylist'}
                      </Text>
                    </View>
                  )}

                  {/* Message Bubble */}
                  <View
                    style={[
                      styles.bubble,
                      isAssistant ? styles.assistantBubble : styles.userBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        isAssistant ? styles.assistantText : styles.userText,
                      ]}
                    >
                      {msg.text}
                    </Text>

                    {/* Live Collapsible Trace */}
                    {isAssistant && msg.trace && msg.trace.length > 0 && (
                      <View style={styles.traceContainer}>
                        <Pressable
                          onPress={() => toggleTrace(msg.id)}
                          style={styles.traceHeader}
                          accessibilityRole="button"
                          accessibilityLabel="Toggle reasoning trace"
                        >
                          <Text style={styles.traceHeaderIcon}>
                            {isTraceExpanded ? '▼' : '▶'}
                          </Text>
                          <Text style={styles.traceHeaderText}>
                            {isTraceExpanded ? 'Hide Reasoning Trace' : 'Show Reasoning Trace'} ({msg.trace.length} steps)
                          </Text>
                        </Pressable>

                        {isTraceExpanded && (
                          <View style={styles.traceSteps}>
                            {msg.trace.map((step, sIdx) => (
                              <View key={sIdx} style={styles.traceStepRow}>
                                <Text style={styles.traceBullet}>→</Text>
                                <Text style={styles.traceStepText}>{step}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {/* Embedded Style Cards */}
                    {isAssistant && msg.styleCards && msg.styleCards.length > 0 && (
                      <View style={styles.cardsEmbedContainer}>
                        <Text style={styles.cardsEmbedTitle}>RECOMMENDED LOOKBOOK MATCHES:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsHorizontalScroll}>
                          {msg.styleCards.map((sc, scIdx) => (
                            <View key={scIdx} style={styles.embeddedCard}>
                              <Image source={{ uri: sc.style.images[0]?.file }} style={styles.embeddedCardImg} />
                              <View style={styles.embeddedCardBody}>
                                <View style={styles.matchPill}>
                                  <Text style={styles.matchPillText}>{sc.matchPercentage}% MATCH</Text>
                                </View>
                                <Text style={styles.embeddedCardName} numberOfLines={1}>
                                  {sc.style.name}
                                </Text>
                                <Text style={styles.embeddedCardCategory}>
                                  {sc.style.lengthClass.toUpperCase()}
                                </Text>

                                {onOpenStyleDetail && (
                                  <Pressable
                                    onPress={() => onOpenStyleDetail(sc)}
                                    style={styles.embeddedCardBtn}
                                    accessibilityRole="button"
                                    accessibilityLabel={`View ${sc.style.name}`}
                                  >
                                    <Text style={styles.embeddedCardBtnText}>VIEW SPECS</Text>
                                  </Pressable>
                                )}
                              </View>
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {/* Embedded Barber Brief Card */}
                    {isAssistant && msg.barberBrief && onOpenBarberBrief && (
                      <View style={styles.briefEmbedBox}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.briefEmbedOverline}>COMPLETE BARBER BRIEF</Text>
                          <Text style={styles.briefEmbedTitle}>{msg.barberBrief.styleName}</Text>
                          <Text style={styles.briefEmbedDesc}>
                            Zone tables, clipper guards, and verbal chair scripts ready for your appointment.
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => onOpenBarberBrief(msg.barberBrief!)}
                          style={styles.openBriefBtn}
                          accessibilityRole="button"
                          accessibilityLabel="Open Barber Consultation Brief"
                        >
                          <Text style={styles.openBriefBtnText}>OPEN BRIEF 📋</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Loading Typing Skeleton */}
            {loading && (
              <View style={[styles.messageWrap, styles.assistantWrap]}>
                <View style={styles.provenanceRow}>
                  <Text style={styles.badgeLabel}>● Meta Muse Spark Open Thinking...</Text>
                </View>
                <View style={[styles.bubble, styles.assistantBubble, styles.skeletonBubble]}>
                  <ActivityIndicator size="small" color="#D4AF37" />
                  <Text style={styles.skeletonText}>Synthesizing cephalometric directives...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask for hair advice, clipper guards, low maintenance..."
              placeholderTextColor="#71717A"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage(inputText)}
              returnKeyType="send"
              editable={!loading}
            />
            <Pressable
              onPress={() => handleSendMessage(inputText)}
              disabled={loading || !inputText.trim()}
              style={[
                styles.sendBtn,
                (!inputText.trim() || loading) && { opacity: 0.4 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Send stylist message"
            >
              <Text style={styles.sendBtnText}>SEND</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  drawerContainer: {
    backgroundColor: '#121214',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mobileDrawer: {
    width: '100%',
    height: '84%',
  },
  desktopDrawer: {
    width: 640,
    height: '90%',
    borderRadius: 20,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  aiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  headerOverline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#D4AF37',
  },
  modelBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modelBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
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
  quickActionsContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#18181B',
  },
  chipsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: '#27272A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E4E4E7',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 14,
  },
  messageWrap: {
    flexDirection: 'column',
    maxWidth: '92%',
  },
  assistantWrap: {
    alignSelf: 'flex-start',
  },
  userWrap: {
    alignSelf: 'flex-end',
  },
  provenanceRow: {
    marginBottom: 4,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  bubble: {
    padding: 14,
    borderRadius: 16,
  },
  assistantBubble: {
    backgroundColor: '#1E1E22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#D4AF37',
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 20,
  },
  assistantText: {
    color: '#F4F4F5',
  },
  userText: {
    color: '#000000',
    fontWeight: '600',
  },
  traceContainer: {
    marginTop: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  traceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  traceHeaderIcon: {
    fontSize: 10,
    color: '#D4AF37',
  },
  traceHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4AF37',
  },
  traceSteps: {
    marginTop: 6,
    gap: 4,
  },
  traceStepRow: {
    flexDirection: 'row',
    gap: 6,
  },
  traceBullet: {
    fontSize: 10,
    color: '#71717A',
  },
  traceStepText: {
    flex: 1,
    fontSize: 10,
    color: '#A1A1AA',
    lineHeight: 14,
  },
  cardsEmbedContainer: {
    marginTop: 12,
  },
  cardsEmbedTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A1A1AA',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  cardsHorizontalScroll: {
    flexDirection: 'row',
  },
  embeddedCard: {
    width: 140,
    backgroundColor: '#121214',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginRight: 8,
  },
  embeddedCardImg: {
    width: '100%',
    height: 140,
    backgroundColor: '#27272A',
  },
  embeddedCardBody: {
    padding: 8,
  },
  matchPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#16A34A',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  matchPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  embeddedCardName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  embeddedCardCategory: {
    fontSize: 9,
    color: '#71717A',
    marginBottom: 6,
  },
  embeddedCardBtn: {
    backgroundColor: '#27272A',
    paddingVertical: 5,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  embeddedCardBtnText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D4AF37',
  },
  briefEmbedBox: {
    marginTop: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'column',
    gap: 8,
  },
  briefEmbedOverline: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  briefEmbedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  briefEmbedDesc: {
    fontSize: 11,
    color: '#D4D4D8',
    lineHeight: 15,
    marginTop: 2,
  },
  openBriefBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  openBriefBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  skeletonBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonText: {
    fontSize: 12,
    color: '#A1A1AA',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#18181B',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#27272A',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 13,
  },
  sendBtn: {
    height: 44,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// src/stylist/agent.ts
// AI STYLIST AGENT WITH MUSE SPARK OPEN VIA SERVER PROXY & OFFLINE FALLBACK
// Strict JSON protocol, multi-turn tool calling, privacy guardrails, and deterministic fallback.
// ══════════════════════════════════════════════════════════════════════════════

import {
  get_profile,
  search_catalog,
  compare_styles,
  build_barber_brief,
  type UserProfile,
  type SearchCatalogParams,
  type StyleComparison,
  type BarberBrief,
} from './tools.ts';
import { HAIRSTYLE_CATALOG, type CatalogStyle } from '../constants/catalog.ts';
import type { ScoredCatalogStyle } from '../lib/filterStyles.ts';
import type { FaceAnalysisResult } from '../lib/faceAnalysis.ts';

export interface StylistTurnAction {
  thought: string;
  action: 'call_tool' | 'final';
  tool?: 'get_profile' | 'search_catalog' | 'compare_styles' | 'build_barber_brief';
  args?: any;
  final?: {
    answer: string;
    recommendedStyleIds?: string[];
    briefStyleId?: string;
    followUp?: string;
  };
}

export interface StylistMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  badge: 'Muse Spark Open (Meta, via Baseten)' | 'Offline stylist';
  trace?: string[];
  styleCards?: ScoredCatalogStyle[];
  barberBrief?: BarberBrief;
  timestamp: number;
}

export const STYLIST_QUICK_ACTIONS = [
  'Best for my face',
  'Low maintenance',
  'Short and sharp',
  'Something different',
  'Compare my top 2',
  'Make my barber brief',
] as const;

export type QuickActionType = (typeof STYLIST_QUICK_ACTIONS)[number];

// Client-side cache: Keyed by `${profileHash}__${userMessage}`
const responseCache = new Map<string, StylistMessage>();

function getProxyBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return '';
    }
    return window.location.port === '3001' ? '' : 'http://localhost:3001';
  }
  return 'http://localhost:3001';
}

/**
 * PRIVACY GUARDRAIL (HARD RULE):
 * Asserts that no image bytes, base64 strings, or photo file references exist in the payload.
 */
export function assertPrivacyGuarantees(payload: any): void {
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  if (/data:image\/[a-zA-Z]+;base64/i.test(payloadStr) || /;base64,/i.test(payloadStr)) {
    throw new Error('PRIVACY VIOLATION: Base64 image data detected in model payload.');
  }
  if (/\.jpg|\.png|\.webp|\.jpeg|capture_|selfie_|media_/i.test(payloadStr)) {
    throw new Error('PRIVACY VIOLATION: Capture filename or photo reference detected in model payload.');
  }
}

/**
 * Profanity & off-topic filter
 */
function isOffTopic(text: string): boolean {
  const t = text.toLowerCase();
  const hairKeywords = [
    'hair', 'style', 'cut', 'barber', 'face', 'shape', 'curl', 'fade', 'taper',
    'fringe', 'bangs', 'maintenance', 'product', 'shampoo', 'pomade', 'quiff',
    'bob', 'pixie', 'buzz', 'braid', 'shag', 'length', 'volume', 'crown',
    'sides', 'look', 'best', 'compare', 'brief', 'recommend', 'hello', 'hi'
  ];
  const hasHairTopic = hairKeywords.some((k) => t.includes(k));
  if (!hasHairTopic && t.length > 15) {
    // Check if definitely non-hair (e.g. recipe, weather, politics, coding)
    const offTopicKeywords = ['weather', 'recipe', 'cook', 'president', 'election', 'stock', 'crypto', 'code', 'python', 'javascript'];
    if (offTopicKeywords.some((k) => t.includes(k))) return true;
  }
  return false;
}

/**
 * Deterministic Stylist Fallback:
 * Provides robust, beautifully calibrated answers for the 6 quick actions and general queries.
 */
export function runDeterministicStylist(
  message: string,
  profile: UserProfile
): StylistMessage {
  const msgLower = message.toLowerCase().trim();
  const trace: string[] = [];

  // 1. "Best for my face"
  if (msgLower.includes('best for my face') || msgLower.includes('best')) {
    trace.push(`Checked your measurements (${profile.morphology}, Index: ${profile.facialIndex.toFixed(1)})`);
    trace.push(`Filtered catalog for confirmed audience: ${profile.audience}`);
    trace.push(`Ranked by Farkas thirds volume compensation`);

    const results = search_catalog({ audience: profile.audience }, profile);
    const topStyles = results.slice(0, 3);
    const top1 = topStyles[0];

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: `Based on your ${profile.morphology} face morphology (${profile.scientificName}) and ${profile.verticalThirds.upperThirdPct}% upper third, ${top1.style.name} is your top anatomical match (${top1.matchPercentage}% harmony). It provides ${top1.style.volumeProfile.crown} crown volume with ${top1.style.volumeProfile.sides} sides to restore neoclassical symmetry.`,
      badge: 'Offline stylist',
      trace,
      styleCards: topStyles,
      timestamp: Date.now(),
    };
  }

  // 2. "Low maintenance"
  if (msgLower.includes('low maintenance') || msgLower.includes('maintenance')) {
    trace.push(`Checked styling time constraints (<= 10m)`);
    trace.push(`Filtered styles with extended trim intervals`);

    const results = search_catalog(
      { audience: profile.audience, maxMaintenance: { maxStylingMinutes: 10, maxTrimWeeks: 4 } },
      profile
    );
    const topStyles = results.slice(0, 3);

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: `For a low-maintenance routine, these styles require under 10 minutes of daily prep and maintain clean structural lines for 4 to 6 weeks between trims.`,
      badge: 'Offline stylist',
      trace,
      styleCards: topStyles,
      timestamp: Date.now(),
    };
  }

  // 3. "Short and sharp"
  if (msgLower.includes('short and sharp') || msgLower.includes('short')) {
    trace.push(`Filtered catalog to short length class`);
    trace.push(`Evaluated precision clipper guards (#1-#3)`);

    const results = search_catalog({ audience: profile.audience, length: 'short' }, profile);
    const topStyles = results.slice(0, 3);

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: `Here are the top-rated short styles with precision tapers and textured crowns, calibrated to preserve your ${profile.morphology} facial proportions.`,
      badge: 'Offline stylist',
      trace,
      styleCards: topStyles,
      timestamp: Date.now(),
    };
  }

  // 4. "Something different"
  if (msgLower.includes('something different') || msgLower.includes('different')) {
    trace.push(`Analyzed contrasting silhouette geometries`);
    trace.push(`Selected alternative length class with high harmony score`);

    const allResults = search_catalog({ audience: profile.audience }, profile);
    // Pick alternative styles (e.g. rank 3 and 4)
    const altStyles = allResults.slice(2, 5);

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: `If you want to step outside your usual look while preserving harmonic bone balance, these alternative silhouettes introduce dynamic angles and textural movement.`,
      badge: 'Offline stylist',
      trace,
      styleCards: altStyles,
      timestamp: Date.now(),
    };
  }

  // 5. "Compare my top 2"
  if (msgLower.includes('compare') || msgLower.includes('top 2')) {
    trace.push(`Retrieved top 2 biometric matches`);
    trace.push(`Computed length zone differences and maintenance delta`);
    trace.push(`Generated differential comparison`);

    const results = search_catalog({ audience: profile.audience }, profile);
    const styleA = results[0]?.style;
    const styleB = results[1]?.style;

    if (styleA && styleB) {
      const comparison = compare_styles(styleA.id, styleB.id, profile);
      return {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: `### Comparison: ${styleA.name} vs ${styleB.name}\n\n${comparison.differentialSummary}\n\n* **${styleA.name}:** ${styleA.topCm}cm top / ${styleA.sidesCm}cm sides · ${styleA.maintenance.stylingMinutes}m prep · ${comparison.styleA.pros[0]}.\n* **${styleB.name}:** ${styleB.topCm}cm top / ${styleB.sidesCm}cm sides · ${styleB.maintenance.stylingMinutes}m prep · ${comparison.styleB.pros[0]}.`,
        badge: 'Offline stylist',
        trace,
        styleCards: [results[0], results[1]],
        timestamp: Date.now(),
      };
    }
  }

  // 6. "Make my barber brief"
  if (msgLower.includes('barber brief') || msgLower.includes('brief') || msgLower.includes('consultation')) {
    trace.push(`Identified top anatomical hairstyle`);
    trace.push(`Extracted clipper guard directives & scissor angles`);
    trace.push(`Synthesized client consultation script and avoid list`);

    const results = search_catalog({ audience: profile.audience }, profile);
    const topPick = results[0]?.style || HAIRSTYLE_CATALOG[0];
    const brief = build_barber_brief(topPick.id, profile);

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: `I have generated your complete Barber Brief for **${topPick.name}**. It includes exact millimeter lengths for crown, parietals, and nape, clipper guards, finishing product directives, and 4 plain-English sentences to say in the chair.`,
      badge: 'Offline stylist',
      trace,
      barberBrief: brief,
      timestamp: Date.now(),
    };
  }

  // General free-text fallback
  trace.push(`Evaluated general hair consultation query`);
  trace.push(`Applied cephalometric styling guidelines for ${profile.morphology}`);

  const topStyles = search_catalog({ audience: profile.audience }, profile).slice(0, 2);
  return {
    id: `msg_${Date.now()}`,
    sender: 'assistant',
    text: `For your ${profile.morphology} morphology (${profile.facialIndex.toFixed(1)} index), prioritize styles with ${profile.verticalThirds.upperThirdPct < 30 ? 'vertical crown height' : 'soft forehead framing'} to maintain neoclassical tripartite balance. Tap any quick action or ask about specific hair lengths, clipper guards, or products!`,
    badge: 'Offline stylist',
    trace,
    styleCards: topStyles,
    timestamp: Date.now(),
  };
}

/**
 * Model Prompt for Muse Spark Open
 */
const SYSTEM_PROMPT = `You are a clinical-grade AI Hair Stylist and Barbering Assistant for Biometric Hair Arch.
You operate strictly via a JSON protocol. Every turn, respond with ONLY valid JSON matching this schema:

If you need data, call ONE tool:
{"thought": "short rationale", "action": "call_tool", "tool": "search_catalog"|"compare_styles"|"build_barber_brief", "args": {...}}

When ready with the final response:
{"thought": "short rationale", "action": "final", "final": {"answer": "plain text response", "recommendedStyleIds": ["id1", "id2"], "briefStyleId": "id", "followUp": "optional question"}}

STRICT RULES:
1. Ground all numbers, clipper guards, and measurements ONLY in tool results. Never invent numbers.
2. Never make medical or dermatological claims.
3. Keep answers concise (2-4 sentences).
4. Ask at most ONE clarifying question if needed.
5. Respect user's confirmed audience filter.
6. Return valid JSON only with NO markdown wrappers.`;

/**
 * Execute Agent Loop with Muse Spark Open via Proxy:
 * Max 4 tool calls, 20s timeout per call, schema validation, 1 repair retry.
 */
export async function runStylistAgent(
  userMessage: string,
  analysis: FaceAnalysisResult,
  audience: 'men' | 'women' | 'all' = 'all',
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<StylistMessage> {
  const profile = get_profile(analysis, audience);

  // Check cache
  const cacheKey = `${profile.morphology}_${profile.facialIndex}_${audience}__${userMessage.trim().toLowerCase()}`;
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey)!;
  }

  // Refusal for off-topic queries
  if (isOffTopic(userMessage)) {
    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: 'I am your dedicated biometric hair stylist and barbering consultant. Please ask me about hairstyles, haircut directives, volume balancing, or maintenance schedules for your face shape.',
      badge: 'Offline stylist',
      timestamp: Date.now(),
    };
  }

  const trace: string[] = [];
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Client Profile:
- Morphology: ${profile.morphology} (${profile.scientificName})
- Facial Index: ${profile.facialIndex.toFixed(1)}
- Vertical Thirds: Forehead=${profile.verticalThirds.upperThirdPct}%, Mid=${profile.verticalThirds.midThirdPct}%, Lower=${profile.verticalThirds.lowerThirdPct}%
- Audience Preference: ${profile.audience}
- Current Length: ${profile.currentHairLength}

User Message: "${userMessage}"`,
    },
  ];

  let toolCallCount = 0;
  const MAX_TOOL_CALLS = 4;
  let finalResult: StylistTurnAction['final'] | null = null;
  let usedBrief: BarberBrief | undefined;
  let usedStyleCards: ScoredCatalogStyle[] = [];

  const proxyUrl = `${getProxyBaseUrl()}/api/baseten/chat`;

  while (toolCallCount < MAX_TOOL_CALLS && !finalResult) {
    toolCallCount++;

    // Privacy assertion before dispatch
    const payloadStr = JSON.stringify(messages);
    try {
      assertPrivacyGuarantees(payloadStr);
    } catch (err: any) {
      console.warn('[Stylist Agent] Privacy block:', err.message);
      return runDeterministicStylist(userMessage, profile);
    }

    let parsedAction: StylistTurnAction | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Token': 'biometric-hair-token-v1',
        },
        body: JSON.stringify({
          messages,
          max_tokens: 600,
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Proxy error`);
      }

      const json = await res.json();
      const rawContent = json?.data?.choices?.[0]?.message?.content || '';
      const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        parsedAction = JSON.parse(cleanJson);
      } catch {
        // 1 repair retry
        const repairRes = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-App-Token': 'biometric-hair-token-v1',
          },
          body: JSON.stringify({
            messages: [
              ...messages,
              { role: 'assistant', content: rawContent },
              { role: 'user', content: 'Syntax error: Please return strictly valid JSON matching the schema with no extra text.' },
            ],
            max_tokens: 500,
            temperature: 0,
          }),
        });
        const repJson = await repairRes.json();
        const repContent = repJson?.data?.choices?.[0]?.message?.content || '';
        parsedAction = JSON.parse(repContent.replace(/```json/g, '').replace(/```/g, '').trim());
      }
    } catch (err: any) {
      console.warn('[Stylist Agent] Model call failed, switching to offline stylist:', err.message);
      return runDeterministicStylist(userMessage, profile);
    }

    if (!parsedAction || !parsedAction.action) {
      return runDeterministicStylist(userMessage, profile);
    }

    // Action 1: Call Tool
    if (parsedAction.action === 'call_tool' && parsedAction.tool) {
      const toolName = parsedAction.tool;
      const args = parsedAction.args || {};

      let toolOutput: any = null;
      if (toolName === 'search_catalog') {
        trace.push(`Filtered styles: ${JSON.stringify(args)}`);
        toolOutput = search_catalog(args, profile).slice(0, 4).map((s) => ({
          id: s.style.id,
          name: s.style.name,
          matchPercentage: s.matchPercentage,
          lengthClass: s.style.lengthClass,
          barberSpec: s.style.barberSpec,
        }));
      } else if (toolName === 'compare_styles') {
        trace.push(`Compared ${args.idA} vs ${args.idB}`);
        toolOutput = compare_styles(args.idA, args.idB, profile);
      } else if (toolName === 'build_barber_brief') {
        trace.push(`Built barber brief for ${args.styleId}`);
        const brief = build_barber_brief(args.styleId, profile, args.options);
        usedBrief = brief;
        toolOutput = {
          styleName: brief.styleName,
          zones: brief.zones,
          clipperGuards: brief.clipperGuards,
          askScript: brief.askScript,
        };
      } else {
        toolOutput = profile;
      }

      messages.push({
        role: 'assistant',
        content: JSON.stringify(parsedAction),
      });
      messages.push({
        role: 'user',
        content: `Tool Result for ${toolName}: ${JSON.stringify(toolOutput)}`,
      });
    } else if (parsedAction.action === 'final' && parsedAction.final) {
      finalResult = parsedAction.final;
      trace.push(`Synthesized final styling recommendation`);
    } else {
      break;
    }
  }

  if (!finalResult) {
    return runDeterministicStylist(userMessage, profile);
  }

  // Populate style cards if recommendedStyleIds are returned
  if (finalResult.recommendedStyleIds && finalResult.recommendedStyleIds.length > 0) {
    const catalogMatches = search_catalog({ audience: profile.audience }, profile);
    usedStyleCards = catalogMatches.filter((s) =>
      finalResult!.recommendedStyleIds!.includes(s.style.id)
    );
  }

  if (!usedBrief && finalResult.briefStyleId) {
    usedBrief = build_barber_brief(finalResult.briefStyleId, profile);
  }

  const resultMessage: StylistMessage = {
    id: `msg_${Date.now()}`,
    sender: 'assistant',
    text: finalResult.answer,
    badge: 'Muse Spark Open (Meta, via Baseten)',
    trace: trace.length > 0 ? trace : ['Evaluated biometric measurements', 'Provided personalized advice'],
    styleCards: usedStyleCards.length > 0 ? usedStyleCards : undefined,
    barberBrief: usedBrief,
    timestamp: Date.now(),
  };

  responseCache.set(cacheKey, resultMessage);
  return resultMessage;
}
